from fastapi import FastAPI, HTTPException, Header, Depends
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import uvicorn
import httpx
from datetime import datetime, timedelta
import asyncio
import anthropic

import models
import schemas
import crud
import database
import utils
import prompts
import rag

# Initialize database
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Planetary Agents Core")

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
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")

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
    # 1. Get Agent Data
    db_agent = crud.get_agent(db, agent_id=request.agentId)
    
    # 2. Determine System Prompt
    context = request.context or {}
    
    if request.agentId == "monica-001":
        system_prompt = prompts.build_monica_prompt(context)
    elif db_agent:
        system_prompt = prompts.get_agent_system_prompt(db_agent.__dict__)
    else:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    # 3. RAG Enhancement
    rag_context = ""
    try:
        # Search agent's knowledge
        rag_results = rag.vector_store.query(
            collection_name="historical-agents",
            query_text=request.message,
            n_results=3,
            where={"agentId": request.agentId}
        )
        if rag_results and rag_results.get("documents") and rag_results["documents"]:
            rag_context = "\n\nRelevant Knowledge:\n" + "\n".join(rag_results["documents"][0])
    except Exception as e:
        print(f"RAG Error: {e}")
        
    full_system_prompt = system_prompt + rag_context
        
    # 4. Call AI
    text = f"Persona response for {request.agentId}: [AI Implementation Pending API Key Verification]"
    
    anthropic_failed = False
    if ANTHROPIC_API_KEY:
        try:
            client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
            message = await client.messages.create(
                model=os.getenv("DEFAULT_MODEL", "claude-3-5-sonnet-20241022"),
                max_tokens=1024,
                system=full_system_prompt,
                messages=[
                    {"role": "user", "content": request.message}
                ]
            )
            text = message.content[0].text
        except Exception as e:
            anthropic_failed = True
            text = f"Error calling Anthropic: {str(e)}"
            print(text)
            
    # Fallback to OpenAI if Anthropic failed or key is missing
    if (not ANTHROPIC_API_KEY or anthropic_failed) and OPENAI_API_KEY:
        try:
            from openai import AsyncOpenAI
            openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
            response = await openai_client.chat.completions.create(
                model=os.getenv("MONICA_DEFAULT_MODEL", "gpt-4o-mini"),
                messages=[
                    {"role": "system", "content": full_system_prompt},
                    {"role": "user", "content": request.message}
                ],
                max_tokens=1024
            )
            text = response.choices[0].message.content
        except Exception as e:
            text = f"Error calling OpenAI fallback: {str(e)}\nPrevious Error: {text}"
    
    # 5. Record Conversation
    session_id = request.sessionId or f"session-{datetime.utcnow().timestamp()}"
    try:
        crud.create_conversation(db, schemas.ConversationCreate(
            agentId=request.agentId,
            sessionId=session_id,
            userId=request.userId,
            userMessage=request.message,
            agentResponse=text
        ))
    except Exception as e:
        print(f"Warning: Failed to record conversation for {request.agentId}: {e}")
        db.rollback()
    
    return {
        "text": text,
        "agentId": request.agentId,
        "sessionId": session_id,
        "metadata": {
            "timestamp": datetime.utcnow().isoformat(),
            "rag_used": bool(rag_context)
        }
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
async def search_knowledge(agent_id: str, query: str):
    results = rag.vector_store.query(
        collection_name="historical-agents",
        query_text=query,
        n_results=5,
        where={"agentId": agent_id}
    )
    return results

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

# --- Smart Proxy --- forwards to Railway alchm.kitchen backend

@app.post("/alchemize")
async def proxy_alchemize(request: Dict, internal_api_secret: Optional[str] = Header(None)):
    """Proxy /alchemize to the Railway WhatToEatNext backend (alchm.kitchen)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(
                f"{ALCHM_KITCHEN_URL}/alchemize",
                json=request,
                headers={"INTERNAL_API_SECRET": internal_api_secret or INTERNAL_API_SECRET}
            )
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Alchemize proxy failed: {str(e)}")

@app.post("/astrologize")
async def proxy_astrologize(request: Dict, internal_api_secret: Optional[str] = Header(None)):
    """Proxy /astrologize to the Railway WhatToEatNext backend (alchm.kitchen)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(
                f"{ALCHM_KITCHEN_URL}/astrologize",
                json=request,
                headers={"INTERNAL_API_SECRET": internal_api_secret or INTERNAL_API_SECRET}
            )
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Astrologize proxy failed: {str(e)}")

@app.post("/api/alchemical/quantities")
async def proxy_alchemical_quantities(request: Dict, internal_api_secret: Optional[str] = Header(None)):
    """Proxy /api/alchemical/quantities to the Railway WhatToEatNext backend (alchm.kitchen)."""
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(
                f"{ALCHM_KITCHEN_URL}/api/alchemical/quantities",
                json=request,
                headers={"INTERNAL_API_SECRET": internal_api_secret or INTERNAL_API_SECRET}
            )
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Quantities proxy failed: {str(e)}")

@app.post("/api/planetary/positions")
async def get_positions(request: Dict, internal_api_secret: Optional[str] = Header(None)):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{ALCHM_KITCHEN_URL}/api/planetary/positions",
                json=request,
                headers={"INTERNAL_API_SECRET": internal_api_secret or INTERNAL_API_SECRET}
            )
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=str(e))

@app.post("/api/planetary/current-hour")
async def proxy_planetary_current_hour(request: Dict, internal_api_secret: Optional[str] = Header(None)):
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(
                f"{ALCHM_KITCHEN_URL}/api/planetary/current-hour",
                json=request,
                headers={"INTERNAL_API_SECRET": internal_api_secret or INTERNAL_API_SECRET}
            )
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Current hour proxy failed: {str(e)}")

@app.post("/api/tokens/calculate")
async def proxy_tokens_calculate(request: Dict, internal_api_secret: Optional[str] = Header(None)):
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(
                f"{ALCHM_KITCHEN_URL}/api/tokens/calculate",
                json=request,
                headers={"INTERNAL_API_SECRET": internal_api_secret or INTERNAL_API_SECRET}
            )
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Tokens calculate proxy failed: {str(e)}")

@app.post("/api/tokens/projections")
async def proxy_tokens_projections(request: Dict, internal_api_secret: Optional[str] = Header(None)):
    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.post(
                f"{ALCHM_KITCHEN_URL}/api/tokens/projections",
                json=request,
                headers={"INTERNAL_API_SECRET": internal_api_secret or INTERNAL_API_SECRET}
            )
            return response.json()
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Tokens projections proxy failed: {str(e)}")

@app.post("/api/planetary/positions/bulk", response_model=schemas.BulkPositionsResponse)
async def get_bulk_positions(request: schemas.BulkPositionsRequest, internal_api_secret: Optional[str] = Header(None)):
    """
    Native bulk planetary positions endpoint.
    Fans out requests to the upstream alchm.kitchen API in parallel.
    """
    timestamps = []
    current_time = request.startDate
    # Cap at 64 samples to protect both us and Railway from runaways
    max_samples = 64
    while current_time <= request.endDate and len(timestamps) < max_samples:
        timestamps.append(current_time)
        current_time += timedelta(hours=request.intervalHours)

    async with httpx.AsyncClient() as client:
        async def fetch_one(dt: datetime):
            payload = {
                "year": dt.year,
                "month": dt.month,
                "day": dt.day,
                "hour": dt.hour,
                "minute": dt.minute,
                "latitude": request.latitude,
                "longitude": request.longitude,
                "zodiacSystem": "tropical"
            }
            try:
                resp = await client.post(
                    f"{ALCHM_KITCHEN_URL}/api/planetary/positions",
                    json=payload,
                    headers={"INTERNAL_API_SECRET": internal_api_secret or INTERNAL_API_SECRET},
                    timeout=10.0
                )
                if resp.status_code == 200:
                    return {"timestamp": dt.isoformat(), "positions": resp.json()}
            except Exception:
                pass
            return None

        results = await asyncio.gather(*(fetch_one(t) for t in timestamps))
    
    ok_results = [r for r in results if r is not None]
    
    return {
        "samples": ok_results,
        "count": len(ok_results),
        "degraded": len(ok_results) < len(timestamps)
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
