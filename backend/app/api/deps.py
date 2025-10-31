"""
API dependencies for FastAPI endpoints.
Common dependencies used across multiple endpoints.
"""
from typing import Generator
from sqlalchemy.orm import Session

from app.core.database import get_db

# Re-export commonly used dependencies
__all__ = ["get_db"]
