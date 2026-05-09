from sqlalchemy.orm import Session
import models, schemas, utils
from datetime import datetime

def get_agent(db: Session, agent_id: str):
    return db.query(models.HistoricalAgent).filter(models.HistoricalAgent.agentId == agent_id).first()

def get_agents(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.HistoricalAgent).offset(skip).limit(limit).all()

def create_agent(db: Session, agent: schemas.AgentCreate):
    # Determine era and other metadata
    era_info = utils.determine_historical_era(agent.birthDate.year if agent.birthDate else 2000, agent.agentId)
    
    db_agent = models.HistoricalAgent(
        **agent.dict(),
        historicalEra=era_info['era'],
        culture=era_info['culture'],
        geography=era_info['geography'],
        lastActive=datetime.utcnow()
    )
    db.add(db_agent)
    db.commit()
    db.refresh(db_agent)
    return db_agent

def update_agent(db: Session, agent_id: str, agent_update: schemas.AgentUpdate):
    db_agent = get_agent(db, agent_id)
    if not db_agent:
        return None
    
    update_data = agent_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_agent, key, value)
    
    db_agent.lastActive = datetime.utcnow()
    db.commit()
    db.refresh(db_agent)
    return db_agent

def create_conversation(db: Session, conversation: schemas.ConversationCreate):
    db_conversation = models.AgentConversation(**conversation.dict())
    db.add(db_conversation)
    
    # Update agent stats
    db_agent = get_agent(db, conversation.agentId)
    if db_agent:
        db_agent.conversations += 1
        db_agent.lastActive = datetime.utcnow()
        
    db.commit()
    db.refresh(db_conversation)
    return db_conversation

def get_conversations(db: Session, agent_id: str, skip: int = 0, limit: int = 50):
    return db.query(models.AgentConversation).filter(
        models.AgentConversation.agentId == agent_id
    ).order_by(models.AgentConversation.createdAt.desc()).offset(skip).limit(limit).all()

def get_all_agents(db: Session):
    return db.query(models.HistoricalAgent).all()
