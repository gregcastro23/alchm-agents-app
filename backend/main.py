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
import httpx

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

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
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
    yield  # app runs here
    # shutdown cleanup (if needed later) goes after yield

app = FastAPI(title="Planetary Agents Core", lifespan=lifespan)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    if not db_agent:
        # Determine if it's a planetary or moon phase agent
        is_planetary = False
        is_moon_phase = False
        parts = request.agentId.split("-")
        planet_opt, sign_opt, degree_opt = "", "", 0
        phase_name_opt = ""
        
        # Check if it is a moon phase agent
        if request.agentId.startswith("moon-phase-"):
            is_moon_phase = True
            if len(parts) >= 4:
                try:
                    degree_opt = int(parts[-1])
                except ValueError:
                    degree_opt = 0
                phase_slug = "-".join(parts[2:-1])
                slug_map = {
                    "new-moon": "New Moon",
                    "waxing-crescent": "Waxing Crescent",
                    "first-quarter": "First Quarter",
                    "waxing-gibbous": "Waxing Gibbous",
                    "full-moon": "Full Moon",
                    "waning-gibbous": "Waning Gibbous",
                    "last-quarter": "Last Quarter",
                    "waning-crescent": "Waning Crescent",
                    "dark-moon": "Dark Moon"
                }
                phase_name_opt = slug_map.get(phase_slug, "New Moon")
                
                # Derive sign from absolute degree (0-359)
                sign_opt = ZODIAC_SIGNS[min(11, max(0, degree_opt // 30))]
        else:
            # Strip "planetary" prefix if present
            offset = 1 if (len(parts) > 0 and parts[0].lower() == "planetary") else 0
            
            if len(parts) >= offset + 2:
                planet_candidate = parts[offset].title()
                sign_candidate = parts[offset + 1].title()
                if sign_candidate == "Scorpius":
                    sign_candidate = "Scorpio"
                
                if planet_candidate in PLANETARY_PERIODS_DAYS and sign_candidate in ZODIAC_SIGNS:
                    is_planetary = True
                    planet_opt = planet_candidate
                    sign_opt = sign_candidate
                    
                    # Check for degree
                    if len(parts) >= offset + 3:
                        try:
                            degree_opt = int(parts[offset + 2])
                        except ValueError:
                            degree_opt = 0

        try:
            # Shared moon phase profiles for moon-phase agents and Moon planetary degree agents
            phase_personalities = {
                "New Moon": {
                    "archetype": "The Seed Planter",
                    "traits": ["intuitive", "introspective", "initiating", "mysterious", "potential-focused"],
                    "specialty": "New beginnings, setting intentions, and void-dwelling potential.",
                    "spirit": 0.9, "essence": 0.3, "matter": 0.1, "substance": 0.1, "color": "#1e293b", "symbol": "🌑"
                },
                "Waxing Crescent": {
                    "archetype": "The Young Explorer",
                    "traits": ["curious", "hopeful", "tentative", "learning", "growing"],
                    "specialty": "Building momentum, early growth, and hopeful exploration.",
                    "spirit": 0.7, "essence": 0.4, "matter": 0.2, "substance": 0.2, "color": "#38bdf8", "symbol": "🌒"
                },
                "First Quarter": {
                    "archetype": "The Decision Maker",
                    "traits": ["decisive", "challenged", "determined", "active", "crisis-oriented"],
                    "specialty": "Breaking through barriers, dynamic actions, and decisive choice.",
                    "spirit": 0.5, "essence": 0.5, "matter": 0.3, "substance": 0.2, "color": "#0ea5e9", "symbol": "🌓"
                },
                "Waxing Gibbous": {
                    "archetype": "The Refiner",
                    "traits": ["perfecting", "analyzing", "adjusting", "preparing", "anticipating"],
                    "specialty": "Analyzing details, fine-tuning structures, and preparing for peak expression.",
                    "spirit": 0.4, "essence": 0.6, "matter": 0.4, "substance": 0.3, "color": "#0284c7", "symbol": "🌔"
                },
                "Full Moon": {
                    "archetype": "The Illuminator",
                    "traits": ["revealing", "emotional", "powerful", "culminating", "illuminating"],
                    "specialty": "Emotional truths, dramatic revelations, and peak manifestation.",
                    "spirit": 0.5, "essence": 0.7, "matter": 0.5, "substance": 0.4, "color": "#f59e0b", "symbol": "🌕"
                },
                "Waning Gibbous": {
                    "archetype": "The Grateful Sage",
                    "traits": ["grateful", "sharing", "teaching", "distributing", "wise"],
                    "specialty": "Sharing wisdom, expressing gratitude, and distributing abundance.",
                    "spirit": 0.4, "essence": 0.6, "matter": 0.6, "substance": 0.5, "color": "#e2e8f0", "symbol": "🌖"
                },
                "Last Quarter": {
                    "archetype": "The Release Master",
                    "traits": ["releasing", "forgiving", "clearing", "transitioning", "letting go"],
                    "specialty": "Clearing outmoded patterns, compassionate forgiveness, and active release.",
                    "spirit": 0.3, "essence": 0.5, "matter": 0.5, "substance": 0.4, "color": "#94a3b8", "symbol": "🌗"
                },
                "Waning Crescent": {
                    "archetype": "The Dream Weaver",
                    "traits": ["restful", "dreamy", "intuitive", "preparing", "surrendering"],
                    "specialty": "Restful contemplation, dream integration, and peaceful surrender.",
                    "spirit": 0.2, "essence": 0.4, "matter": 0.4, "substance": 0.3, "color": "#64748b", "symbol": "🌘"
                },
                "Dark Moon": {
                    "archetype": "The Void Walker",
                    "traits": ["mysterious", "transformative", "void-dwelling", "death-rebirth", "primal"],
                    "specialty": "Primal void exploration, shadow integration, and deep transformation.",
                    "spirit": 1.0, "essence": 0.1, "matter": 0.1, "substance": 0.0, "color": "#0f172a", "symbol": "⚫"
                }
            }

            if is_moon_phase:
                element = utils.get_zodiac_element(sign_opt)
                SIGN_MODALITIES = {
                    "Aries": "Cardinal", "Libra": "Cardinal", "Cancer": "Cardinal", "Capricorn": "Cardinal",
                    "Taurus": "Fixed", "Leo": "Fixed", "Scorpio": "Fixed", "Aquarius": "Fixed",
                    "Gemini": "Mutable", "Virgo": "Mutable", "Sagittarius": "Mutable", "Pisces": "Mutable"
                }
                modality = SIGN_MODALITIES.get(sign_opt, "Cardinal")
                
                p_data = phase_personalities.get(phase_name_opt, phase_personalities["New Moon"])
                
                agent_create = schemas.AgentCreate(
                    agentId=request.agentId,
                    name=f"{phase_name_opt} Moon in {sign_opt} {degree_opt % 30} Degree",
                    title="Moon Phase Intelligence",
                    birthDate=datetime(2000, 1, 1),
                    birthTime="12:00",
                    birthLocation=schemas.BirthLocation(lat=0.0, lon=0.0, name="Unknown"),
                    consciousnessLevel="Active",
                    monicaConstant=p_data["spirit"],
                    dominantElement=element,
                    dominantModality=modality,
                    specialty=p_data["specialty"],
                    wisdomDomains=["Lunar Dynamics", "Emotional Integration"],
                    avatar="",
                    color=p_data["color"],
                    symbol=p_data["symbol"],
                    personalityCore=p_data,
                    traits=p_data["traits"]
                )
            elif is_planetary:
                element = utils.get_zodiac_element(sign_opt)
                
                PLANET_COLORS = {
                    "Sun": "#f59e0b",
                    "Moon": "#3b82f6",
                    "Mercury": "#10b981",
                    "Venus": "#ec4899",
                    "Mars": "#ef4444",
                    "Jupiter": "#8b5cf6",
                    "Saturn": "#4b5563",
                    "Uranus": "#06b6d4",
                    "Neptune": "#6366f1",
                    "Pluto": "#7c3aed"
                }
                SIGN_MODALITIES = {
                    "Aries": "Cardinal", "Libra": "Cardinal", "Cancer": "Cardinal", "Capricorn": "Cardinal",
                    "Taurus": "Fixed", "Leo": "Fixed", "Scorpio": "Fixed", "Aquarius": "Fixed",
                    "Gemini": "Mutable", "Virgo": "Mutable", "Sagittarius": "Mutable", "Pisces": "Mutable"
                }
                
                modality = SIGN_MODALITIES.get(sign_opt, "Cardinal")
                color = PLANET_COLORS.get(planet_opt, "#8b5cf6")
                symbol = planet_opt
                p_data = None
                
                # Check if the planet is Moon, to calculate its exact phase from the degree
                if planet_opt == "Moon":
                    zodiac_starts = {
                        "Aries": 0, "Taurus": 30, "Gemini": 60, "Cancer": 90,
                        "Leo": 120, "Virgo": 150, "Libra": 180, "Scorpio": 210,
                        "Sagittarius": 240, "Capricorn": 270, "Aquarius": 300, "Pisces": 330
                    }
                    start_deg = zodiac_starts.get(sign_opt, 0)
                    abs_degree = (start_deg + degree_opt) % 360
                    
                    if abs_degree < 11.25:
                        phase_name = "New Moon"
                    elif abs_degree < 78.75:
                        phase_name = "Waxing Crescent"
                    elif abs_degree < 101.25:
                        phase_name = "First Quarter"
                    elif abs_degree < 168.75:
                        phase_name = "Waxing Gibbous"
                    elif abs_degree < 191.25:
                        phase_name = "Full Moon"
                    elif abs_degree < 258.75:
                        phase_name = "Waning Gibbous"
                    elif abs_degree < 281.25:
                        phase_name = "Last Quarter"
                    elif abs_degree < 348.75:
                        phase_name = "Waning Crescent"
                    else:
                        phase_name = "Dark Moon"
                        
                    p_data = phase_personalities.get(phase_name, phase_personalities["New Moon"])
                    name_str = f"{phase_name} Moon in {sign_opt} {degree_opt} Degree"
                    specialty = f"Moon ({phase_name} Phase) intelligence in {sign_opt} at {degree_opt}°"
                    color = p_data["color"]
                    symbol = p_data["symbol"]
                else:
                    name_str = f"{planet_opt} in {sign_opt} {degree_opt} Degree" if len(parts) >= offset + 3 else f"{planet_opt} in {sign_opt}"
                    specialty = f"{planet_opt} intelligence in {sign_opt} at {degree_opt}°"
                
                dignity_val = utils.get_planetary_dignity(planet_opt, sign_opt)
                if dignity_val in (1, 3):
                    ruler_dignity = "domicile"
                elif dignity_val == 2:
                    ruler_dignity = "exaltation"
                elif dignity_val in (-1, -3):
                    ruler_dignity = "detriment"
                elif dignity_val == -2:
                    ruler_dignity = "fall"
                else:
                    ruler_dignity = "peregrine"
                    
                is_anaretic = (degree_opt == 29)
                is_cardinal_degree = (degree_opt == 0 and modality == "Cardinal")
                critical_degrees = {
                    "Cardinal": [0, 13, 26],
                    "Fixed": [8, 9, 21, 22],
                    "Mutable": [4, 17]
                }
                is_critical_degree = degree_opt in critical_degrees.get(modality, [])
                
                # Consciousness level calculation
                level_score = 3
                if ruler_dignity == "domicile":
                    level_score += 2
                elif ruler_dignity == "exaltation":
                    level_score += 3
                elif ruler_dignity == "detriment":
                    level_score -= 1
                elif ruler_dignity == "fall":
                    level_score -= 2
                    
                if is_anaretic:
                    level_score += 2
                if is_cardinal_degree:
                    level_score += 1
                if is_critical_degree:
                    level_score += 1
                    
                if degree_opt == 0:
                    level_score += 1
                if degree_opt == 29:
                    level_score += 1
                    
                if level_score >= 7:
                    consciousness_level = "Transcendent"
                elif level_score >= 6:
                    consciousness_level = "Illuminated"
                elif level_score >= 5:
                    consciousness_level = "Advanced"
                elif level_score >= 4:
                    consciousness_level = "Elevated"
                elif level_score >= 3:
                    consciousness_level = "Active"
                elif level_score >= 2:
                    consciousness_level = "Awakening"
                else:
                    consciousness_level = "Dormant"
                    
                # Power level calculation
                power = 0.5
                if ruler_dignity == "domicile":
                    power += 0.3
                elif ruler_dignity == "exaltation":
                    power += 0.4
                elif ruler_dignity == "detriment":
                    power -= 0.2
                elif ruler_dignity == "fall":
                    power -= 0.3
                    
                if is_critical_degree:
                    power += 0.15
                if degree_opt == 0:
                    power += 0.1
                if degree_opt == 29:
                    power += 0.15
                if modality == "Fixed":
                    power += 0.05
                power_level = max(0.0, min(1.0, power))
                
                agent_create = schemas.AgentCreate(
                    agentId=request.agentId,
                    name=name_str,
                    title="Planetary Intelligence",
                    birthDate=datetime(2000, 1, 1),
                    birthTime="12:00",
                    birthLocation=schemas.BirthLocation(lat=0.0, lon=0.0, name="Unknown"),
                    consciousnessLevel=consciousness_level,
                    monicaConstant=power_level,
                    dominantElement=element,
                    dominantModality=modality,
                    specialty=specialty,
                    wisdomDomains=["Cosmology", "Planetary Influence"],
                    avatar="",
                    color=color,
                    symbol=symbol,
                    personalityCore=p_data,
                    traits=p_data["traits"] if p_data else []
                )
            else:
                display_name = request.agentId.replace("-", " ").title()
                agent_create = schemas.AgentCreate(
                    agentId=request.agentId,
                    name=display_name,
                    title="Historical Figure",
                    birthDate=datetime(2000, 1, 1),
                    birthTime="12:00",
                    birthLocation=schemas.BirthLocation(lat=0.0, lon=0.0, name="Unknown"),
                    consciousnessLevel="Active",
                    monicaConstant=0.5,
                    dominantElement="Air",
                    dominantModality="Cardinal",
                    specialty="Historical Wisdom",
                    wisdomDomains=["History", "Philosophical Depth"],
                    avatar="",
                    color="#64748b",
                    symbol="Scroll"
                )
            db_agent = crud.create_agent(db=db, agent=agent_create)
            print(f"Auto-registered missing agent dynamically: {request.agentId}", flush=True)
        except Exception as sync_err:
            print(f"Warning: Failed to auto-register missing agent {request.agentId}: {sync_err}", flush=True)
            db.rollback()

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

@app.post("/api/generate-image")
async def generate_image(request: Dict[str, Any]):
    prompt = request.get("prompt")
    if not prompt:
        raise HTTPException(status_code=400, detail="Missing prompt")
        
    api_token = os.getenv("CLOUDFLARE_API_TOKEN")
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID")
    
    if not api_token or not account_id:
        raise HTTPException(
            status_code=500, 
            detail="Server misconfiguration: Missing Cloudflare credentials (CLOUDFLARE_API_TOKEN or CLOUDFLARE_ACCOUNT_ID)"
        )
        
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0"
    
    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "prompt": prompt,
        "num_steps": request.get("steps", 30),
        "negative_prompt": request.get("negative_prompt", "text, labels, watermarks, ugly, bad anatomy")
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=60.0)
            if response.status_code != 200:
                raise HTTPException(
                    status_code=502, 
                    detail=f"Cloudflare AI error: {response.status_code} {response.text}"
                )
                
            # Cloudflare returns binary image data
            import base64
            image_data = response.content
            b64_encoded = base64.b64encode(image_data).decode('utf-8')
            mime_type = response.headers.get("Content-Type", "image/png")
            data_uri = f"data:{mime_type};base64,{b64_encoded}"
            
            return {
                "success": True,
                "provider": "cloudflare-workers-ai",
                "imageUrl": data_uri,
                "url": data_uri,
                "metadata": {
                    "model": "@cf/stabilityai/stable-diffusion-xl-base-1.0"
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image generation failed: {str(e)}")


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
