"""
Main FastAPI application for Flatmates App.
"""

import asyncio
import time
import traceback
import uuid
from contextlib import asynccontextmanager
from functools import wraps

from fastapi import FastAPI, Depends, Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

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
# Exception Handlers
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions with proper JSON response."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    # Log the error
    logger.error(
        "Unhandled exception",
        request_id=request_id,
        path=request.url.path,
        method=request.method,
        error=str(exc),
        traceback=traceback.format_exc()
    )
    
    # Capture in Sentry
    capture_exception(exc, context={
        "request_id": request_id,
        "path": request.url.path
    })
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "internal_server_error",
            "message": "An unexpected error occurred",
            "request_id": request_id
        }
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handle database errors specifically with retry guidance."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    logger.error(
        "Database error",
        request_id=request_id,
        path=request.url.path,
        error=str(exc)
    )
    
    # Capture in Sentry
    capture_exception(exc, context={
        "request_id": request_id,
        "path": request.url.path,
        "error_type": "database_error"
    })
    
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "error": "database_error",
            "message": "Database temporarily unavailable. Please retry.",
            "request_id": request_id,
            "retry_after": 5
        },
        headers={"Retry-After": "5"}
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors with clear messages."""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": "validation_error",
            "message": "Invalid request data",
            "details": exc.errors()
        }
    )


# =============================================================================
# Utility Functions
# =============================================================================

def with_timeout(seconds: int = 30):
    """
    Decorator to add timeout to async functions.
    
    Usage:
        @with_timeout(10)
        async def slow_operation():
            ...
    
    Args:
        seconds: Maximum time to wait before timing out
        
    Returns:
        Decorated function with timeout handling
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await asyncio.wait_for(
                    func(*args, **kwargs),
                    timeout=seconds
                )
            except asyncio.TimeoutError:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail="Request timed out"
                )
        return wrapper
    return decorator


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
        # Test database connection and measure latency
        start = time.perf_counter()
        db.execute(text("SELECT 1"))
        latency = (time.perf_counter() - start) * 1000
        health["database"] = "connected"
        health["latency_ms"] = round(latency, 2)
    except Exception:
        health["database"] = "disconnected"
        health["status"] = "degraded"

    return health


@app.get("/health/deep")
async def deep_health_check(db: Session = Depends(get_db)):
    """
    Deep health check including database connectivity with detailed diagnostics.
    
    Returns:
        JSON response with detailed health information including:
        - Overall status
        - Individual component checks
        - Database latency metrics
    """
    checks = {
        "api": "healthy",
        "database": "unknown",
        "database_latency_ms": None
    }
    
    try:
        start = time.perf_counter()
        db.execute(text("SELECT 1"))
        latency = (time.perf_counter() - start) * 1000
        
        checks["database"] = "healthy"
        checks["database_latency_ms"] = round(latency, 2)
    except Exception as e:
        checks["database"] = "unhealthy"
        checks["database_error"] = str(e)
    
    # Determine overall status
    overall_status = "healthy" if all(
        v == "healthy" for k, v in checks.items() 
        if k == "database" or k == "api"
    ) else "unhealthy"
    
    return {
        "status": overall_status,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": checks
    }


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
