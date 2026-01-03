"""
Main FastAPI application for Flatmates App.
"""

import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.core.database import get_db
from app.core.logging import setup_logging, get_logger, log_context, clear_log_context
from app.core.metrics import (
    get_metrics,
    initialize_metrics,
    HTTP_REQUESTS_TOTAL,
    HTTP_REQUEST_DURATION_SECONDS,
    HTTP_REQUESTS_IN_PROGRESS,
)
from app.core.sentry import init_sentry, capture_exception
from app.api.v1.api import api_router

# Initialize Sentry FIRST (before anything else)
sentry_enabled = init_sentry()

# Setup structured logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info(
        "Starting Flatmates App API", 
        version=settings.VERSION, 
        environment=settings.ENVIRONMENT,
        sentry_enabled=sentry_enabled,
    )
    
    # Initialize metrics
    initialize_metrics(settings.VERSION)
    
    # Test database connection
    try:
        db = next(get_db())
        db.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        db.close()
    except Exception as e:
        logger.error("Database connection failed", error=str(e))
        capture_exception(e, context="database_startup")

    yield

    # Shutdown
    logger.info("Shutting down Flatmates App API")


# Create FastAPI app instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API for managing flatmate todos, shopping lists, and expenses",
    version=settings.VERSION,
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" if settings.is_development else None,
    lifespan=lifespan,
)


# =============================================================================
# Middleware
# =============================================================================

@app.middleware("http")
async def logging_middleware(request: Request, call_next):
    """Add request logging and metrics."""
    # Generate request ID
    request_id = str(uuid.uuid4())[:8]
    
    # Add context for all logs in this request
    log_context(
        request_id=request_id,
        method=request.method,
        path=request.url.path,
    )
    
    # Get endpoint for metrics (normalize path parameters)
    endpoint = request.url.path
    method = request.method
    
    # Track request in progress
    HTTP_REQUESTS_IN_PROGRESS.labels(method=method, endpoint=endpoint).inc()
    
    start_time = time.perf_counter()
    
    try:
        response = await call_next(request)
        
        # Calculate duration
        duration = time.perf_counter() - start_time
        
        # Record metrics
        HTTP_REQUESTS_TOTAL.labels(
            method=method,
            endpoint=endpoint,
            status_code=response.status_code
        ).inc()
        
        HTTP_REQUEST_DURATION_SECONDS.labels(
            method=method,
            endpoint=endpoint
        ).observe(duration)
        
        # Log request (skip health checks in production)
        if not (settings.is_production and endpoint == "/health"):
            logger.info(
                "Request completed",
                status_code=response.status_code,
                duration_ms=round(duration * 1000, 2),
            )
        
        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        
        return response
        
    except Exception as e:
        duration = time.perf_counter() - start_time
        logger.error(
            "Request failed",
            error=str(e),
            duration_ms=round(duration * 1000, 2),
        )
        raise
        
    finally:
        HTTP_REQUESTS_IN_PROGRESS.labels(method=method, endpoint=endpoint).dec()
        clear_log_context()


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS if settings.BACKEND_CORS_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =============================================================================
# Core Endpoints
# =============================================================================

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint to verify API and database status.

    Returns:
        JSON response with health status
    """
    health = {
        "status": "healthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
    }
    
    try:
        # Test database connection
        db.execute(text("SELECT 1"))
        health["database"] = "connected"
    except Exception:
        health["database"] = "disconnected"
        health["status"] = "degraded"

    return health


@app.get("/")
async def root():
    """
    Root endpoint with API information.

    Returns:
        JSON response with API details
    """
    return {
        "message": "Welcome to Flatmates App API",
        "version": settings.VERSION,
        "docs": "/docs" if settings.is_development else None,
        "health": "/health",
    }


@app.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.
    
    Returns:
        Prometheus-formatted metrics
    """
    if not settings.ENABLE_METRICS:
        return Response(content="Metrics disabled", status_code=404)
    return get_metrics()


# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)
