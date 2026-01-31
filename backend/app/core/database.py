"""
Database configuration and session management.
SQLAlchemy setup for PostgreSQL with async support.
Optimized for Neon serverless PostgreSQL with retry logic for cold starts.
"""

from datetime import datetime, timezone
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from sqlalchemy.exc import OperationalError, InterfaceError
from typing import Generator
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from app.core.config import settings


def utc_now() -> datetime:
    """
    Return current UTC time as a naive datetime (no timezone info).
    
    This is preferred for SQLite compatibility. PostgreSQL will handle
    timezone-aware datetimes correctly, but SQLite strips timezone info.
    Use this instead of deprecated datetime.utcnow().
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


# Detect sqlite and build connect_args appropriately
# For SQLite: check_same_thread=False for multithreaded environments
# For PostgreSQL (Neon serverless): connection timeouts and keepalives
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    # PostgreSQL connection settings optimized for Neon serverless
    connect_args = {
        "connect_timeout": 10,      # Timeout for initial connection
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    }

# Connection pool settings optimized for serverless databases
pool_settings = {}
if not settings.DATABASE_URL.startswith("sqlite"):
    pool_settings = {
        "pool_size": 5,             # Smaller pool for serverless
        "max_overflow": 10,         # Allow burst connections
        "pool_recycle": 300,        # Recycle connections every 5 min
        "pool_timeout": 30,         # Wait up to 30s for connection
    }

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    echo=False,  # Set to True for SQL query logging during development
    connect_args=connect_args,
    **pool_settings,
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for declarative models
Base = declarative_base()


@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((OperationalError, InterfaceError)),
    reraise=True
)
def get_db_with_retry() -> Session:
    """
    Get database session with retry logic for Neon cold starts.
    
    Neon serverless PostgreSQL can take 2-5 seconds to wake from idle.
    This function retries up to 3 times with exponential backoff.
    
    Returns:
        Database session that has been verified to work
        
    Raises:
        OperationalError: If connection fails after all retries
    """
    db = SessionLocal()
    try:
        # Test connection to wake up Neon if needed
        db.execute(text("SELECT 1"))
        return db
    except Exception:
        db.close()
        raise


def get_db() -> Generator:
    """
    Dependency function to get database session.

    Usage:
        @app.get("/items")
        def read_items(db: Session = Depends(get_db)):
            ...

    Yields:
        Database session that automatically closes after use
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_resilient() -> Generator:
    """
    Dependency function to get database session with retry logic.
    
    Use this for critical endpoints that need to handle Neon cold starts.
    For most endpoints, use get_db() instead.

    Yields:
        Database session with retry logic that automatically closes after use
    """
    db = get_db_with_retry()
    try:
        yield db
    finally:
        db.close()
