"""
Main FastAPI application for Flatmates App.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import engine, get_db
from app.db.base import Base


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup: Test database connection
    try:
        db = next(get_db())
        db.execute("SELECT 1")
        print("✓ Database connection successful")
        db.close()
    except Exception as e:
        print(f"✗ Database connection failed: {e}")
        print("Make sure PostgreSQL is running and DATABASE_URL is correct")

    yield

    # Shutdown: Clean up resources if needed
    print("Shutting down...")


# Create FastAPI app instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for managing flatmate todos, shopping lists, and expenses",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS if settings.BACKEND_CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify API and database status.

    Returns:
        JSON response with health status
    """
    try:
        # Test database connection
        db.execute("SELECT 1")
        db_status = "connected"
    except Exception:
        # Don't expose internal error details in production
        db_status = "disconnected"

    return {"status": "healthy", "database": db_status}


@app.get("/")
async def root():
    """
    Root endpoint with API information.

    Returns:
        JSON response with API details
    """
    return {
        "message": "Welcome to Flatmates App API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# Include API v1 router
from app.api.v1.api import api_router
app.include_router(api_router, prefix=settings.API_V1_STR)
