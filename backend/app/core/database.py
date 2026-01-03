"""
Database configuration and session management.
SQLAlchemy setup for PostgreSQL with async support.
"""

from datetime import datetime, timezone
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from typing import Generator

from app.core.config import settings


def utc_now() -> datetime:
    """
    Return current UTC time as a naive datetime (no timezone info).
    
    This is preferred for SQLite compatibility. PostgreSQL will handle
    timezone-aware datetimes correctly, but SQLite strips timezone info.
    Use this instead of deprecated datetime.utcnow().
    """
    return datetime.now(timezone.utc).replace(tzinfo=None)


# Detect sqlite and pass special connect_args required for SQLite in multithreaded
# environments (e.g., dev server). For SQLite URLs, set check_same_thread=False.
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    echo=False,  # Set to True for SQL query logging during development
    connect_args=connect_args,
)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for declarative models
Base = declarative_base()


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
