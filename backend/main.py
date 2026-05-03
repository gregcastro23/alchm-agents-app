from fastapi import FastAPI, HTTPException, Header, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import uvicorn
import httpx
from datetime import datetime, timedelta
import asyncio
import anthropic

import models, schemas, crud, database, utils, prompts, rag

# Initialize database
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Planetary Agents Core")

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
            text = f"Error calling Anthropic: {str(e)}"
    
    # 5. Record Conversation
    session_id = request.sessionId or f"session-{datetime.utcnow().timestamp()}"
    crud.create_conversation(db, schemas.ConversationCreate(
        agentId=request.agentId,
        sessionId=session_id,
        userId=request.userId,
        userMessage=request.message,
        agentResponse=text
    ))
    
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

# --- Smart Proxy ---

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
