from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, Boolean, ForeignKey
from sqlalchemy.orm import relationship, DeclarativeBase
from datetime import datetime, timezone

class Base(DeclarativeBase):
    pass

class HistoricalAgent(Base):
    __tablename__ = "historical_agents"

    id = Column(Integer, primary_key=True, index=True)
    agentId = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    title = Column(String)
    
    # Birth data
    birthDate = Column(DateTime)
    birthTime = Column(String)
    birthLocation = Column(JSON) # {lat, lon, name}
    birthYear = Column(Integer)
    deathYear = Column(Integer)
    
    # Historical context
    historicalEra = Column(String)
    culture = Column(String)
    geography = Column(String)
    
    # Consciousness profile
    consciousnessLevel = Column(String)
    monicaConstant = Column(Float)
    dominantElement = Column(String)
    dominantModality = Column(String)
    signature = Column(String)
    
    # Monica Constant components
    spiritScore = Column(Float)
    essenceScore = Column(Float)
    matterScore = Column(Float)
    substanceScore = Column(Float)
    
    # Personality data
    personalityCore = Column(JSON)
    personalityShadows = Column(JSON)
    personalityGifts = Column(JSON)
    personalityChallenges = Column(JSON)
    currentMood = Column(String)
    evolutionStage = Column(Integer, default=0)
    traits = Column(JSON)
    
    background = Column(JSON)
    specialty = Column(String)
    wisdomDomains = Column(JSON)
    skills = Column(JSON)
    teachingStyle = Column(String)
    resonanceType = Column(String)
    uniquePower = Column(String)
    
    # Appearance
    avatar = Column(String)
    color = Column(String)
    symbol = Column(String)
    aura = Column(JSON)
    
    # Birth chart
    natalChart = Column(JSON)
    
    # Monica's creation story
    monicaCreationStory = Column(String)
    
    # Performance optimization
    searchableText = Column(String)
    popularityScore = Column(Float, default=0.5)
    
    # Statistics
    conversations = Column(Integer, default=0)
    wisdomShared = Column(Integer, default=0)
    resonanceScore = Column(Float, default=0.5)
    evolutionPoints = Column(Integer, default=0)
    lastActive = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    isActive = Column(Boolean, default=True)
    
    # Metadata
    version = Column(String, default="2.0.0")
    craftedBy = Column(String, default="philosopher-stone")
    
    # Relationships
    recentConversations = relationship("AgentConversation", back_populates="agent")

class AgentConversation(Base):
    __tablename__ = "agent_conversations"

    id = Column(Integer, primary_key=True, index=True)
    agentId = Column(String, ForeignKey("historical_agents.agentId"), nullable=False)
    sessionId = Column(String, nullable=False)
    userId = Column(String)
    userMessage = Column(String, nullable=False)
    agentResponse = Column(String, nullable=False)
    
    createdAt = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    contextData = Column(JSON)
    
    responseTime = Column(Float)
    modelUsed = Column(String)
    temperature = Column(Float)
    tokenCount = Column(Integer)
    
    agentMood = Column(String)
    evolutionStage = Column(Integer)
    consciousnessLevel = Column(String)
    
    agent = relationship("HistoricalAgent", back_populates="recentConversations")
