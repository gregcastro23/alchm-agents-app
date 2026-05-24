from pydantic import BaseModel
from typing import List, Optional, Dict, Any, Union
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
    birthYear: Optional[int] = None
    deathYear: Optional[int] = None
    
    consciousnessLevel: Optional[str] = None
    monicaConstant: Optional[float] = None
    dominantElement: Optional[str] = None
    dominantModality: Optional[str] = None
    
    specialty: Optional[str] = None
    wisdomDomains: Optional[List[str]] = []
    
    avatar: Optional[str] = None
    color: Optional[str] = None
    symbol: Optional[str] = None
    
    personalityCore: Optional[Dict[str, Any]] = None
    personalityShadows: Optional[List[Dict[str, Any]]] = None
    personalityGifts: Optional[List[Dict[str, Any]]] = None
    personalityChallenges: Optional[List[Dict[str, Any]]] = None
    traits: Optional[Union[List[str], Dict[str, Any]]] = None

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
    id: Union[str, int]
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
    id: Union[str, int]
    createdAt: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    agentId: str
    message: str
    sessionId: Optional[str] = None
    userId: Optional[str] = None
    context: Optional[Dict[str, Any]] = None
    # Verbatim system prompt assembled by the TS persona builder.
    # When present, backend skips the Python template and uses this directly.
    systemPromptOverride: Optional[str] = None
    # Stable hash of the persona content — drives prompt-cache reuse.
    personaCacheKey: Optional[str] = None
    # Cost tier: 'free' | 'cheap_fast' | 'primary' | 'reflective'.
    # Default applied server-side is 'cheap_fast' (Haiku 4.5).
    modelTier: Optional[str] = None

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

class PhilosophersStonePositionsRequest(BaseModel):
    year: Optional[int] = None
    month: Optional[int] = None
    day: Optional[int] = None
    hour: Optional[int] = None
    minute: Optional[int] = None
    customPlanets: Optional[Dict[str, Any]] = None

class PhilosophersStonePositionsResponse(BaseModel):
    elementalProperties: Dict[str, float]
    thermodynamicProperties: Dict[str, float]
    esms: Dict[str, float]
    planetaryMomentum: Dict[str, float]
    kalchm: float
    monica: float
    score: float
    normalized: bool
    confidence: float
    metadata: Dict[str, Any]
    perPlanet: Optional[Dict[str, Any]] = None

class AgentSyncPayload(BaseModel):
    agentId: str
    displayName: str
    email: Optional[str] = None
    title: Optional[str] = None
    avatar: Optional[str] = None
    color: Optional[str] = None
    symbol: Optional[str] = None

class AgentSyncResponse(BaseModel):
    success: bool
    agentId: str
    action: str
