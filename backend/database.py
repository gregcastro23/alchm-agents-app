from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# DSN resolution order:
#   1. DIRECT_URL  — preferred. Should be the raw postgres:// URL from Prisma's
#                    "direct connection" config. SQLAlchemy speaks this natively.
#   2. DATABASE_URL — only if it's a SQLAlchemy-compatible postgres scheme.
#                     Prisma Accelerate's `prisma+postgres://` scheme is NOT
#                     understood by SQLAlchemy and we explicitly skip it.
#   3. SQLite local file — local dev only. Refused on Railway.
#
# When DATABASE_URL is `prisma+postgres://...` and DIRECT_URL is unset, the
# previous code silently fell through to a container-local SQLite file —
# which meant every Railway redeploy lost all conversation history. We now
# raise loudly in that case so the misconfiguration is caught at boot.

DIRECT_URL = os.getenv("DIRECT_URL")
DATABASE_URL = os.getenv("DATABASE_URL")
IS_RAILWAY = bool(os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_PROJECT_ID"))
# Opt-in bridge: set ALLOW_SQLITE_FALLBACK=true on Railway to suppress the
# hard-fail when a usable Postgres DSN is missing. Use this only as a
# transitional measure — conversations written to ephemeral SQLite are
# lost on every redeploy.
ALLOW_SQLITE_FALLBACK = os.getenv("ALLOW_SQLITE_FALLBACK", "false").lower() == "true"


def _looks_like_sqlalchemy_postgres(url: Optional[str]) -> bool:
    if not url:
        return False
    return url.startswith("postgres://") or url.startswith("postgresql://")


def _normalize_postgres_scheme(url: str) -> str:
    """SQLAlchemy 2.x dropped the bare `postgres://` scheme — normalize to
    `postgresql://` so URLs from Heroku/Prisma/Render land on the psycopg2
    driver instead of raising NoSuchModuleError at engine creation."""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


def _resolve_dsn() -> str:
    if _looks_like_sqlalchemy_postgres(DIRECT_URL):
        return _normalize_postgres_scheme(DIRECT_URL)  # type: ignore[arg-type]
    if _looks_like_sqlalchemy_postgres(DATABASE_URL):
        return _normalize_postgres_scheme(DATABASE_URL)  # type: ignore[arg-type]
    if IS_RAILWAY and not ALLOW_SQLITE_FALLBACK:
        raise RuntimeError(
            "Refusing to start: no SQLAlchemy-compatible Postgres DSN configured. "
            "On Railway, set DIRECT_URL to the raw postgres:// URL (Prisma "
            "Accelerate's prisma+postgres:// scheme is not supported here), or "
            "set ALLOW_SQLITE_FALLBACK=true as a transitional bridge. "
            f"DATABASE_URL={DATABASE_URL!r} DIRECT_URL={DIRECT_URL!r}"
        )
    if IS_RAILWAY:
        print(
            "WARNING: ALLOW_SQLITE_FALLBACK=true on Railway. Conversations will "
            "be written to ephemeral container-local SQLite and lost on redeploy. "
            "This is a transitional bridge — set DIRECT_URL to fix permanently.",
            flush=True,
        )
    # Local dev (no env vars set), or Railway with the opt-in bridge enabled.
    return "sqlite:///./planetary_agents.db"


SQLALCHEMY_DATABASE_URL = _resolve_dsn()

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
    if SQLALCHEMY_DATABASE_URL.startswith("sqlite")
    else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
