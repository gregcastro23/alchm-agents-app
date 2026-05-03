from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class BirthLocation(BaseModel):
    lat: float
    lon: float
    name: str

class AgentBase(BaseModel):
    agentId: str
    name: str
    title: Optional[str] = None
    birthDate: Optional[datetime] = None
    birthTime: Optional[str] = None
    birthLocation: Optional[BirthLocation] = None
    
    consciousnessLevel: Optional[str] = None
    monicaConstant: Optional[float] = None
    dominantElement: Optional[str] = None
    dominantModality: Optional[str] = None
    
    specialty: Optional[str] = None
    wisdomDomains: Optional[List[str]] = []
    
    avatar: Optional[str] = None
    color: Optional[str] = None
    symbol: Optional[str] = None

class AgentCreate(AgentBase):
    pass

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    title: Optional[str] = None
    consciousnessLevel: Optional[str] = None
    monicaConstant: Optional[float] = None
    currentMood: Optional[str] = None
    evolutionStage: Optional[int] = None

class Agent(AgentBase):
    id: int
    historicalEra: Optional[str] = None
    culture: Optional[str] = None
    geography: Optional[str] = None
    
    personalityCore: Optional[Dict[str, Any]] = None
    personalityShadows: Optional[List[Dict[str, Any]]] = None
    personalityGifts: Optional[List[Dict[str, Any]]] = None
    personalityChallenges: Optional[List[Dict[str, Any]]] = None
    
    currentMood: Optional[str] = None
    evolutionStage: int = 0
    
    conversations: int = 0
    wisdomShared: int = 0
    resonanceScore: float = 0.5
    evolutionPoints: int = 0
    lastActive: datetime
    isActive: bool = True

    class Config:
        from_attributes = True

class ConversationBase(BaseModel):
    agentId: str
    sessionId: str
    userId: Optional[str] = None
    userMessage: str
    agentResponse: str

class ConversationCreate(ConversationBase):
    responseTime: Optional[float] = None
    modelUsed: Optional[str] = None
    temperature: Optional[float] = None
    tokenCount: Optional[int] = None

class Conversation(ConversationBase):
    id: int
    createdAt: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    agentId: str
    message: str
    sessionId: Optional[str] = None
    userId: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ChatResponse(BaseModel):
    text: str
    agentId: str
    sessionId: str
    metadata: Optional[Dict[str, Any]] = None

class HealthResponse(BaseModel):
    status: str
    service: str
    database: str

class BulkPositionsRequest(BaseModel):
    startDate: datetime
    endDate: datetime
    intervalHours: float = 1.0
    latitude: float = 0.0
    longitude: float = 0.0

class BulkPositionsResponse(BaseModel):
    samples: List[Dict[str, Any]]
    count: int
    degraded: bool = False
