from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use SQLite by default for local development if DATABASE_URL is not set
# For production on Railway, this should be set to a Postgres URL
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./planetary_agents.db")

if SQLALCHEMY_DATABASE_URL.startswith("postgresql"):
    # Ensure it uses the correct driver for SQLAlchemy
    if not SQLALCHEMY_DATABASE_URL.startswith("postgresql://"):
         # Fix for Railway/Neon URLs that might missing the protocol part in some contexts
         pass

try:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False} if SQLALCHEMY_DATABASE_URL.startswith("sqlite") else {}
    )
    # Test connection
    engine.connect()
except Exception as e:
    print(f"Warning: Failed to connect to DATABASE_URL: {e}")
    print("Falling back to local SQLite...")
    SQLALCHEMY_DATABASE_URL = "sqlite:///./planetary_agents.db"
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
