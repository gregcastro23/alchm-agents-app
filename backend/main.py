from fastapi import FastAPI, HTTPException, Header, Depends
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import threading
import uvicorn
import math
from datetime import datetime, timedelta
import asyncio
import time
from collections import deque

import models
import schemas
import crud
import database
import utils
import prompts
import rag
import providers
import ingest
from feed_emitter import emit_feed_event

class SlidingWindowRateLimiter:
    def __init__(self, limit: int = 60, window: float = 60.0):
        self.limit = limit
        self.window = window
        self.requests = deque()
        self.lock = threading.Lock()

    def is_allowed(self) -> bool:
        now = time.time()
        with self.lock:
            while self.requests and self.requests[0] < now - self.window:
                self.requests.popleft()
            if len(self.requests) < self.limit:
                self.requests.append(now)
                return True
            return False

# Initialize rate limiter and kinetics state
sync_rate_limiter = SlidingWindowRateLimiter(limit=60, window=60.0)
KINETICS_STATE = {}
KINETICS_STATE_LOCK = threading.Lock()

# Initialize database
models.Base.metadata.create_all(bind=database.engine)
database.ensure_postgres_runtime_schema()

app = FastAPI(title="Planetary Agents Core")

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup_rag_ingest() -> None:
    """Populate ChromaDB from PostgreSQL in the background on startup.

    Runs in a daemon thread so Railway's health check passes immediately.
    RAG becomes available once ingest completes (~30-60 s on first deploy).
    Subsequent restarts skip the ingest because the collection is already
    populated (PersistentClient stores to ./chroma_db on disk).
    """
    def _run() -> None:
        try:
            ingest.run_ingest(force=False)
        except Exception as exc:
            print(f"[startup] RAG ingest error: {exc}", flush=True)

    threading.Thread(target=_run, daemon=True, name="rag-ingest").start()


# Configuration
ALCHM_KITCHEN_URL = os.getenv("ALCHM_KITCHEN_URL", "https://whattoeatnext-production.up.railway.app")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "882133EA-3D06-4DF2-A63C-F4114AB4EFBC")

# Cost-tiered model selection for historical agent chat.
# Tier maps to the model the *first* provider in the chain will try.
# `free` skips Anthropic entirely and starts at Groq (see providers.build_chain).
ANTHROPIC_TIER_MODEL = {
    "cheap_fast": "claude-haiku-4-5-20251001",
    "primary":    "claude-sonnet-4-6",
    "reflective": "claude-opus-4-7",
}
# Default tier is `free` — the user has not topped up Anthropic credits and we
# want every chat to start on the free chain. Override via env var to flip back
# to a paid Anthropic-first chain (e.g. cheap_fast → Haiku 4.5).
DEFAULT_TIER = os.getenv("HISTORICAL_AGENT_DEFAULT_TIER", "free")
MAX_TIER = os.getenv("HISTORICAL_AGENT_MAX_TIER", "primary")
TIER_ORDER = ["free", "cheap_fast", "primary", "reflective"]
RAG_MIN_SIMILARITY = float(os.getenv("RAG_MIN_SIMILARITY", "0.0"))


def _resolve_tier(requested: Optional[str]) -> str:
    """Pick a tier, clamped to MAX_TIER and falling back to DEFAULT_TIER."""
    tier = (requested or DEFAULT_TIER).lower()
    if tier not in TIER_ORDER:
        tier = DEFAULT_TIER
    if TIER_ORDER.index(tier) > TIER_ORDER.index(MAX_TIER):
        tier = MAX_TIER
    return tier


def _format_rag_block(documents, distances=None) -> str:
    """
    Wrap retrieved chunks as labeled reference material so the model treats
    them as facts to recall, not voice to mimic. Returns empty string if no
    useful chunks survive the similarity threshold.
    """
    if not documents:
        return ""

    keep = []
    for i, doc in enumerate(documents):
        if not doc:
            continue
        if distances and i < len(distances):
            # Chroma returns distance (lower is closer). Convert to a similarity.
            sim = max(0.0, 1.0 - float(distances[i]))
            if sim < RAG_MIN_SIMILARITY:
                continue
        keep.append(doc)

    if not keep:
        return ""

    body = "\n\n---\n\n".join(keep)
    return (
        "<reference_material>\n"
        "These are excerpts that may help you recall specific knowledge.\n"
        "Speak in your own voice. Do not quote these verbatim unless asked.\n\n"
        f"{body}\n"
        "</reference_material>"
    )

@app.get("/health", response_model=schemas.HealthResponse)
async def health():
    return {
        "status": "healthy",
        "service": "planetary-agents-core",
        "database": "connected"
    }

@app.get("/")
async def root():
    return {"message": "Planetary Agents Core API is operational"}

@app.get("/api/providers/health")
async def providers_health():
    """
    Ping every known LLM provider with a 1-token "hi" prompt.
    Returns {provider: {ok, latency_ms, error, model}} for each.
    Useful as a debug primitive when chat is misbehaving.
    """
    pings = await asyncio.gather(
        *(providers.health_check(cfg) for cfg in providers.all_known_providers()),
        return_exceptions=False,
    )
    return {
        cfg.name: result
        for cfg, result in zip(providers.all_known_providers(), pings)
    }


# --- Frontend compatibility endpoints ---

ZODIAC_SIGNS = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]

PLANETARY_PERIODS_DAYS = {
    "Sun": 365.25,
    "Moon": 27.321661,
    "Mercury": 87.969,
    "Venus": 224.701,
    "Mars": 686.98,
    "Jupiter": 4332.59,
    "Saturn": 10759.22,
    "Uranus": 30685.4,
    "Neptune": 60189.0,
    "Pluto": 90560.0,
}

PLANETARY_OFFSETS = {
    "Sun": 28.0,
    "Moon": 91.0,
    "Mercury": 74.0,
    "Venus": 132.0,
    "Mars": 201.0,
    "Jupiter": 16.0,
    "Saturn": 301.0,
    "Uranus": 64.0,
    "Neptune": 359.0,
    "Pluto": 277.0,
}


def _request_datetime(payload: Dict[str, Any]) -> datetime:
    now = datetime.utcnow()
    return datetime(
        int(payload.get("year") or now.year),
        int(payload.get("month") or now.month),
        int(payload.get("day") or payload.get("date") or now.day),
        int(payload.get("hour") or 0),
        int(payload.get("minute") or 0),
    )


def _planetary_positions_for(dt: datetime) -> Dict[str, Dict[str, Any]]:
    epoch = datetime(2000, 1, 1, 12, 0)
    elapsed_days = (dt - epoch).total_seconds() / 86400
    positions: Dict[str, Dict[str, Any]] = {}

    for planet, period in PLANETARY_PERIODS_DAYS.items():
        longitude = (PLANETARY_OFFSETS[planet] + (elapsed_days / period) * 360) % 360
        sign_index = int(longitude // 30)
        degree_float = longitude % 30
        degree = int(degree_float)
        minute = int(round((degree_float - degree) * 60))
        speed = 360 / period
        positions[planet] = {
            "sign": ZODIAC_SIGNS[sign_index],
            "degree": degree,
            "minute": minute,
            "exactLongitude": round(longitude, 4),
            "isRetrograde": False,
            "retrogradeSymbol": "",
            "longitudeSpeed": round(speed, 6),
            "arcminutesPerDay": round(speed * 60, 4),
            "speedDisplay": f"{round(speed, 3)}°/day",
        }

    return positions


def _elemental_scores(dt: datetime) -> Dict[str, float]:
    day_angle = ((dt.timetuple().tm_yday / 365.25) * math.tau) % math.tau
    hour_angle = ((dt.hour + dt.minute / 60) / 24 * math.tau) % math.tau
    return {
        "spirit_score": round(3.5 + 1.5 * (1 + math.sin(day_angle)), 4),
        "essence_score": round(3.5 + 1.5 * (1 + math.cos(hour_angle)), 4),
        "matter_score": round(3.5 + 1.5 * (1 + math.cos(day_angle)), 4),
        "substance_score": round(3.5 + 1.5 * (1 + math.sin(hour_angle)), 4),
    }


@app.post("/api/planetary/positions")
async def planetary_positions(request: Dict[str, Any]):
    dt = _request_datetime(request)
    return {
        "birth_info": {
            "year": dt.year,
            "month": dt.month,
            "date": dt.day,
            "hour": dt.hour,
            "minute": dt.minute,
        },
        "planetary_positions": _planetary_positions_for(dt),
    }


@app.get("/planetary/current")
async def current_planetary_positions():
    dt = datetime.utcnow()
    return {
        "birth_info": {
            "year": dt.year,
            "month": dt.month,
            "date": dt.day,
            "hour": dt.hour,
            "minute": dt.minute,
        },
        "planetary_positions": _planetary_positions_for(dt),
    }


@app.post("/api/planetary/positions/bulk")
async def bulk_planetary_positions(request: schemas.BulkPositionsRequest):
    samples = []
    current = request.startDate
    step = timedelta(hours=max(request.intervalHours, 0.25))
    while current <= request.endDate and len(samples) < 500:
        samples.append({
            "timestamp": current.isoformat(),
            "positions": {
                "birth_info": {
                    "year": current.year,
                    "month": current.month,
                    "date": current.day,
                    "hour": current.hour,
                    "minute": current.minute,
                },
                "planetary_positions": _planetary_positions_for(current),
            },
        })
        current += step

    return {"samples": samples, "count": len(samples), "degraded": True}


@app.post("/api/alchemical/quantities")
async def alchemical_quantities(request: Dict[str, Any]):
    dt = _request_datetime(request)
    scores = _elemental_scores(dt)
    kinetic_val = float(request.get("kinetic_rating") or 0) / 10
    thermo_val = float(request.get("thermo_rating") or 0) / 10
    if kinetic_val == 0:
        kinetic_val = round((scores["spirit_score"] + scores["substance_score"]) / 20, 4)
    if thermo_val == 0:
        thermo_val = round((scores["essence_score"] + scores["matter_score"]) / 20, 4)

    return {
        **scores,
        "kinetic_val": kinetic_val,
        "thermo_val": thermo_val,
        "metadata": {
            "source": "local-fastapi-compatibility",
            "degraded": True,
        },
    }

# --- Agent Management ---

@app.get("/api/agents", response_model=List[schemas.Agent])
def read_agents(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    agents = crud.get_agents(db, skip=skip, limit=limit)
    return agents

import json

@app.get("/api/agents/diet-profiles")
def get_diet_profiles():
    # Navigate to root dir
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    
    # Load recommendations
    recs_path = os.path.join(root_dir, "scripts", "output", "agent-ingredient-recommendations.json")
    recommendations = []
    if os.path.exists(recs_path):
        try:
            with open(recs_path, "r", encoding="utf-8") as f:
                recommendations = json.load(f)
        except Exception as e:
            print(f"Error loading recommendations: {e}")
            
    # Load diet data
    diet_data = {}
    for i in range(1, 4):
        diet_path = os.path.join(root_dir, "scripts", f"diet-data-part{i}.json")
        if os.path.exists(diet_path):
            try:
                with open(diet_path, "r", encoding="utf-8") as f:
                    diet_data.update(json.load(f))
            except Exception as e:
                print(f"Error loading diet data {i}: {e}")
                
    profiles = []
    for rec in recommendations:
        agent_id = rec.get("agentId")
        profiles.append({
            "agentId": agent_id,
            "name": rec.get("name"),
            "title": rec.get("title", "Historical Figure"),
            "era": rec.get("era", "Unknown"),
            "historicalDiet": diet_data.get(agent_id),
            "alchemicalState": rec.get("alchemicalState"),
            "contextBlueprint": rec.get("contextBlueprint"),
            "birthData": rec.get("birthData")
        })
        
    return {"success": True, "profiles": profiles}

@app.get("/api/agents/{agent_id}", response_model=schemas.Agent)
def read_agent(agent_id: str, db: Session = Depends(database.get_db)):
    db_agent = crud.get_agent(db, agent_id=agent_id)
    if db_agent is None:
        raise HTTPException(status_code=404, detail="Agent not found")
    return db_agent

@app.post("/api/agents", response_model=schemas.Agent)
def create_agent(agent: schemas.AgentCreate, db: Session = Depends(database.get_db)):
    db_agent = crud.get_agent(db, agent_id=agent.agentId)
    if db_agent:
        raise HTTPException(status_code=400, detail="Agent ID already registered")
    return crud.create_agent(db=db, agent=agent)

# --- Chat Orchestration ---

@app.post("/api/chat", response_model=schemas.ChatResponse)
async def chat(request: schemas.ChatRequest, db: Session = Depends(database.get_db)):
    # 1. Resolve agent (still needed for RAG filter and DB recording)
    db_agent = crud.get_agent(db, agent_id=request.agentId)

    # 2. Build persona block.
    # Priority: caller-supplied override (canonical TS builder) > Monica template > enriched Python fallback.
    context = request.context or {}
    if request.systemPromptOverride:
        persona_block = request.systemPromptOverride
    elif request.agentId == "monica-001":
        persona_block = prompts.build_monica_prompt(context)
    elif db_agent:
        persona_block = prompts.get_agent_system_prompt(db_agent.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Agent not found")

    # 3. RAG — labeled reference material, augments persona without dominating.
    rag_block = ""
    try:
        rag_results = rag.vector_store.query(
            collection_name="historical-agents",
            query_text=request.message,
            n_results=3,
            where={"agentId": request.agentId},
        )
        if rag_results and rag_results.get("documents") and rag_results["documents"]:
            distances = (rag_results.get("distances") or [[]])[0]
            rag_block = _format_rag_block(rag_results["documents"][0], distances)
    except Exception as e:
        print(f"RAG Error: {e}")

    # 4. Pick tier and build the provider fallback chain.
    tier = _resolve_tier(request.modelTier)
    anthropic_model = ANTHROPIC_TIER_MODEL.get(tier)  # None for tier=="free"
    chain = providers.build_chain(tier, anthropic_model)

    # 5. Walk the chain. First successful provider wins; failures cascade with
    # a `fallback_event` log line (grep "fallback_event" in Railway logs).
    result = await providers.run_chain(
        chain=chain,
        persona_block=persona_block,
        rag_block=rag_block,
        user_message=request.message,
        agent_id=request.agentId,
        tier=tier,
        persona_cache_key=request.personaCacheKey,
    )
    if result is None:
        text = f"Persona response for {request.agentId}: [All providers unavailable]"
        used_provider = None
        used_model = None
        cache_hit = None
    else:
        text = result.text
        used_provider = result.provider
        used_model = result.model
        cache_hit = result.cache

    # 7. Record Conversation
    session_id = request.sessionId or f"session-{datetime.utcnow().timestamp()}"
    try:
        crud.create_conversation(db, schemas.ConversationCreate(
            agentId=request.agentId,
            sessionId=session_id,
            userId=request.userId,
            userMessage=request.message,
            agentResponse=text,
            modelUsed=used_model,
        ))
    except Exception as e:
        print(f"Warning: Failed to record conversation for {request.agentId}: {e}")
        db.rollback()

    # 8. Emit feed event so alchm.kitchen's Live Network Feed surfaces this
    #    chat in near-real time. Fire-and-forget; never blocks the response.
    emit_feed_event(
        request.agentId,
        "agent_chat",
        {
            "sessionId": session_id,
            "messagePreview": request.message[:140],
            "responsePreview": text[:140] if text else "",
            "provider": used_provider,
            "model": used_model,
            "tier": tier,
        },
    )

    return {
        "text": text,
        "agentId": request.agentId,
        "sessionId": session_id,
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "rag_used": bool(rag_block),
            "tier": tier,
            "provider": used_provider,
            "model": used_model,
            "persona_source": "override" if request.systemPromptOverride else "python_template",
            "persona_cache_key": request.personaCacheKey,
            "cache": cache_hit,
        },
    }

# --- RAG Management ---

@app.post("/api/rag/ingest")
async def ingest_knowledge(agent_id: str, documents: List[str]):
    ids = [f"{agent_id}-{i}-{datetime.utcnow().timestamp()}" for i, _ in enumerate(documents)]
    metadatas = [{"agentId": agent_id} for _ in documents]
    rag.vector_store.add_documents(
        collection_name="historical-agents",
        documents=documents,
        metadatas=metadatas,
        ids=ids
    )
    return {"success": True, "count": len(documents)}

@app.get("/api/rag/search")
async def search_knowledge(agent_id: str, query: str, db: Session = Depends(database.get_db)):
    try:
        return rag.vector_store.query(
            collection_name="historical-agents",
            query_text=query,
            n_results=5,
            where={"agentId": agent_id}
        )
    except Exception as exc:
        agent = crud.get_agent(db, agent_id)
        if not agent:
            raise HTTPException(status_code=404, detail="Agent not found")

        fields = [
            agent.name,
            agent.title,
            agent.specialty,
            agent.historicalEra,
            agent.culture,
            agent.geography,
            str(agent.personalityCore or ""),
            str(agent.personalityGifts or ""),
            str(agent.personalityChallenges or ""),
        ]
        haystack = "\n".join(field for field in fields if field)
        terms = [term.lower() for term in query.split() if term.strip()]
        score = sum(1 for term in terms if term in haystack.lower())
        distance = 1.0 - min(score / max(len(terms), 1), 1.0)
        document = (
            f"{agent.name} — {agent.title or 'Historical Agent'}\n"
            f"Specialty: {agent.specialty or 'General wisdom'}\n"
            f"Era: {agent.historicalEra or 'Unknown'}\n"
            f"Culture: {agent.culture or 'Unknown'}\n"
            f"Knowledge fallback: {haystack[:1200]}"
        )

        return {
            "ids": [[f"{agent_id}-lexical-fallback"]],
            "documents": [[document]],
            "metadatas": [[{"agentId": agent_id, "source": "lexical-db-fallback"}]],
            "distances": [[distance]],
            "degraded": True,
            "error": str(exc),
        }


@app.post("/api/rag/rebuild")
async def rebuild_rag(x_internal_secret: Optional[str] = Header(None)):
    """Force a full re-ingest of all agent knowledge into ChromaDB.

    Use this after seeding new agents without redeploying.
    Requires X-Internal-Secret header matching INTERNAL_API_SECRET.
    The rebuild runs in the background; the endpoint returns immediately.
    """
    if x_internal_secret != INTERNAL_API_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")

    def _run() -> None:
        try:
            ingest.run_ingest(force=True)
        except Exception as exc:
            print(f"[rag/rebuild] Error: {exc}", flush=True)

    threading.Thread(target=_run, daemon=True, name="rag-rebuild").start()
    return {"status": "rebuilding", "message": "Re-ingestion started in background. Check Railway logs for progress."}


@app.get("/api/moment-recommendations")
async def get_moment_recommendations(limit: int = 5, db: Session = Depends(database.get_db)):
    agents = crud.get_all_agents(db)
    if not agents:
        return {"recommendations": [], "summary": "No agents found"}
        
    alchm_data = {"Alchemy Effects": {"Total Spirit": 1.0, "Total Essence": 2.0, "Total Matter": 1.5, "Total Substance": 0.5}} # Mock
    current_planets = {} # Mock
    
    scored_agents = []
    for agent in agents:
        mc = agent.monicaConstant if getattr(agent, 'monicaConstant', None) is not None else 0.5
        score = utils.calculate_enhanced_moment_score(
            agent.agentId, 
            current_planets, 
            alchm_data, 
            mc
        )
        scored_agents.append({
            "agent": {
                "agentId": agent.agentId,
                "name": agent.name,
                "title": agent.title
            },
            "synergy": score
        })
        
    scored_agents.sort(key=lambda x: x["synergy"]["score"], reverse=True)
    return {
        "recommendations": scored_agents[:limit],
        "summary": f"Analyzed {len(agents)} agents against current cosmic energies."
    }

@app.post("/api/moment-recommendations")
async def post_moment_recommendations(request: Dict[str, Any], db: Session = Depends(database.get_db)):
    agent_ids = request.get("agentIds", [])
    if not agent_ids:
        return {"scores": []}
        
    alchm_data = request.get("alchmData", {})
    current_planets = request.get("currentPlanets", {})
    
    scores = []
    for agent_id in agent_ids:
        agent = crud.get_agent(db, agent_id)
        mc = agent.monicaConstant if agent and getattr(agent, 'monicaConstant', None) is not None else 0.5
        score = utils.calculate_enhanced_moment_score(agent_id, current_planets, alchm_data, mc)
        scores.append(score)
        
    return {"scores": scores}



@app.get("/api/philosophers-stone/positions", response_model=schemas.PhilosophersStonePositionsResponse)
async def get_philosophers_stone_positions(
    year: Optional[int] = None,
    month: Optional[int] = None,
    day: Optional[int] = None,
    hour: Optional[int] = None,
    minute: Optional[int] = None,
):
    now = datetime.utcnow()
    dt = datetime(
        year or now.year,
        month or now.month,
        day or now.day,
        hour or 0,
        minute or 0
    )
    current_pos = _planetary_positions_for(dt)
    prev_dt = dt - timedelta(days=1)
    prev_pos = _planetary_positions_for(prev_dt)
    
    results = utils.alchemize_detailed(
        planetary_positions=current_pos,
        historical_positions=prev_pos,
        dt=dt
    )
    return results

@app.post("/api/philosophers-stone/positions", response_model=schemas.PhilosophersStonePositionsResponse)
async def post_philosophers_stone_positions(request: schemas.PhilosophersStonePositionsRequest):
    now = datetime.utcnow()
    dt = datetime(
        request.year or now.year,
        request.month or now.month,
        request.day or now.day,
        request.hour or 0,
        request.minute or 0
    )
    
    if request.customPlanets:
        current_pos = request.customPlanets
    else:
        current_pos = _planetary_positions_for(dt)
        
    prev_dt = dt - timedelta(days=1)
    prev_pos = _planetary_positions_for(prev_dt)
    
    results = utils.alchemize_detailed(
        planetary_positions=current_pos,
        historical_positions=prev_pos,
        dt=dt
    )
    return results

@app.get("/api/agents/{agent_id}/kinetics")
async def get_agent_kinetics(
    agent_id: str,
    planet: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    db_agent = crud.get_agent(db, agent_id=agent_id)
    if not db_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    now = datetime.utcnow()
    current_pos = _planetary_positions_for(now)
    
    current_planet = planet or getattr(db_agent, 'symbol', 'Sun') or "Sun"
    if current_planet not in PLANETARY_OFFSETS:
        current_planet = "Sun"
        
    with KINETICS_STATE_LOCK:
        state = KINETICS_STATE.get(agent_id)
        if state:
            prev_pos = state["positions"]
            prev_time = state["timestamp"]
            prev_metrics = state["metrics"]
            time_interval = (now - prev_time).total_seconds()
            if time_interval <= 0.0:
                time_interval = 3600.0
        else:
            prev_time = now - timedelta(hours=1)
            prev_pos = _planetary_positions_for(prev_time)
            prev_metrics = None
            time_interval = 3600.0
            
        metrics = utils.calculate_kinetics(
            current_planetary_positions=current_pos,
            previous_planetary_positions=prev_pos,
            time_interval=time_interval,
            current_planet=current_planet,
            previous_metrics=prev_metrics
        )
        
        KINETICS_STATE[agent_id] = {
            "positions": current_pos,
            "timestamp": now,
            "metrics": metrics
        }
        
    return metrics

@app.post("/api/internal/agent-sync", response_model=schemas.AgentSyncResponse)
async def agent_sync(
    payload: schemas.AgentSyncPayload,
    x_sync_secret: Optional[str] = Header(None, alias="X-Sync-Secret"),
    x_internal_secret: Optional[str] = Header(None, alias="X-Internal-Secret"),
    db: Session = Depends(database.get_db)
):
    secret = x_sync_secret or x_internal_secret
    if secret != INTERNAL_API_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid sync secret")
        
    if not sync_rate_limiter.is_allowed():
        raise HTTPException(status_code=429, detail="Too Many Requests: Rate limit exceeded")
        
    db_agent = crud.get_agent(db, agent_id=payload.agentId)
    if db_agent:
        db_agent.name = payload.displayName
        if payload.title is not None:
            db_agent.title = payload.title
        if payload.avatar is not None:
            db_agent.avatar = payload.avatar
        if payload.color is not None:
            db_agent.color = payload.color
        if payload.symbol is not None:
            db_agent.symbol = payload.symbol
        db_agent.lastActive = datetime.utcnow()
        db.commit()
        db.refresh(db_agent)
        action = "updated"
    else:
        agent_create = schemas.AgentCreate(
            agentId=payload.agentId,
            name=payload.displayName,
            title=payload.title or "Synced Agent",
            birthDate=datetime(2000, 1, 1),
            birthTime="12:00",
            birthLocation=schemas.BirthLocation(lat=0.0, lon=0.0, name="Unknown"),
            consciousnessLevel="Active",
            monicaConstant=0.5,
            dominantElement="Air",
            dominantModality="Cardinal",
            specialty="Alchemical Synchronization",
            wisdomDomains=["Cosmology"],
            avatar=payload.avatar,
            color=payload.color,
            symbol=payload.symbol
        )
        crud.create_agent(db=db, agent=agent_create)
        action = "created"

    # Surface registration in alchm.kitchen's Live Network Feed. Only emit
    # when the row was newly created so we don't spam the feed with every
    # update.
    if action == "created":
        emit_feed_event(
            payload.agentId,
            "agent_registered",
            {
                "displayName": payload.displayName,
                "title": payload.title,
                "symbol": payload.symbol,
            },
        )

    return {
        "success": True,
        "agentId": payload.agentId,
        "action": action
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
