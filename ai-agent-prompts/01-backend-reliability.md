# Task 1: Backend Reliability Fix

## Metadata
- **Can run in parallel with**: Task 2 (Android Project Setup)
- **Dependencies**: None
- **Estimated time**: 2-3 hours
- **Priority**: HIGH (fixes current deployment issues)

---

## Prompt

You are fixing reliability issues in a FastAPI backend deployed on Azure Container Apps with Neon PostgreSQL (serverless).

### Current Issues
1. API errors (500s, timeouts)
2. Neon DB cold start delays (can take 2-5 seconds when waking from idle)
3. Missing proper error handling
4. No retry logic for transient failures

### Repository Information
- **Repository**: `/workspaces/flatmates-app`
- **Backend Path**: `/workspaces/flatmates-app/backend`
- **Main Entry**: `backend/app/main.py`
- **Database Config**: `backend/app/core/database.py`
- **API Endpoints**: `backend/app/api/v1/endpoints/`

### Tasks

#### 1. Add Database Connection Retry Logic

Update `app/core/database.py`:

```python
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from sqlalchemy.exc import OperationalError, InterfaceError

# Connection pool settings optimized for Neon serverless
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,           # Verify connections before using
    pool_size=5,                   # Smaller pool for serverless
    max_overflow=10,               # Allow burst connections
    pool_recycle=300,              # Recycle connections every 5 min
    pool_timeout=30,               # Wait up to 30s for connection
    connect_args={
        "connect_timeout": 10,     # Timeout for initial connection
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 5,
    } if not settings.DATABASE_URL.startswith("sqlite") else {},
    echo=False,
)

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=1, max=10),
    retry=retry_if_exception_type((OperationalError, InterfaceError)),
    reraise=True
)
def get_db_with_retry():
    """Get database session with retry for cold starts."""
    db = SessionLocal()
    try:
        # Test connection
        db.execute(text("SELECT 1"))
        return db
    except Exception:
        db.close()
        raise
```

#### 2. Add Global Exception Handler

Update `app/main.py`:

```python
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import uuid
import traceback

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions."""
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
    """Handle database errors specifically."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    logger.error("Database error", request_id=request_id, error=str(exc))
    
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
```

#### 3. Add Request ID Middleware

```python
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    """Add request ID to all requests for tracing."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    
    # Add to logging context
    log_context(request_id=request_id)
    
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    
    # Clear context
    clear_log_context()
    
    return response
```

#### 4. Improve Health Check Endpoint

Create or update `app/api/v1/endpoints/health.py`:

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import time

from app.api.deps import get_db
from app.core.config import settings

router = APIRouter()

@router.get("/health")
async def health_check():
    """Basic health check."""
    return {"status": "healthy", "version": settings.VERSION}

@router.get("/health/deep")
async def deep_health_check(db: Session = Depends(get_db)):
    """Deep health check including database connectivity."""
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
    
    overall_status = "healthy" if all(
        v == "healthy" for k, v in checks.items() 
        if k.endswith("database") or k == "api"
    ) else "unhealthy"
    
    return {
        "status": overall_status,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "checks": checks
    }
```

#### 5. Add Timeout Handling to Endpoints

Wrap slow operations with timeout:

```python
import asyncio
from functools import wraps

def with_timeout(seconds: int = 30):
    """Decorator to add timeout to async functions."""
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
```

#### 6. Update Requirements

Add to `requirements.txt`:

```
tenacity>=8.2.0
```

#### 7. Add Comprehensive Tests

Create `tests/test_reliability.py`:

```python
import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy.exc import OperationalError
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_health_endpoint():
    """Test basic health check."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_deep_health_endpoint():
    """Test deep health check with DB."""
    response = client.get("/api/v1/health/deep")
    assert response.status_code == 200
    data = response.json()
    assert "database_latency_ms" in data["checks"]

def test_request_id_header():
    """Test that request ID is returned."""
    response = client.get("/api/v1/health")
    assert "X-Request-ID" in response.headers

def test_custom_request_id():
    """Test that custom request ID is preserved."""
    custom_id = "test-request-123"
    response = client.get(
        "/api/v1/health",
        headers={"X-Request-ID": custom_id}
    )
    assert response.headers["X-Request-ID"] == custom_id

def test_validation_error_format():
    """Test that validation errors return proper format."""
    response = client.post(
        "/api/v1/todos/",
        json={"invalid": "data"}
    )
    assert response.status_code == 422
    data = response.json()
    assert data["error"] == "validation_error"
    assert "details" in data

@patch('app.core.database.SessionLocal')
def test_database_retry_on_cold_start(mock_session):
    """Test that database retries on cold start errors."""
    # First call fails, second succeeds
    mock_session.side_effect = [
        OperationalError("connection failed", None, None),
        MagicMock()
    ]
    
    # The retry logic should handle this
    # Add your specific test implementation

def test_error_response_format():
    """Test that 500 errors return proper JSON."""
    # Trigger an error and verify format
    # This depends on your specific endpoint implementation
    pass
```

### Success Criteria

- [ ] All existing tests still pass
- [ ] New reliability tests pass
- [ ] Health endpoint returns: `{"status": "healthy", "database": "connected", "latency_ms": X}`
- [ ] API errors return proper JSON with `error`, `message`, and `request_id` fields
- [ ] Database connection survives Neon cold starts (tested with 5+ second delays)
- [ ] Request IDs are tracked in logs and responses
- [ ] No breaking changes to existing API contract

### Do NOT

- Change the API contract (keep same endpoints/responses)
- Remove any existing functionality
- Modify the database schema
- Change authentication logic
- Add new features (only fix reliability)

### Verification

```bash
cd /workspaces/flatmates-app/backend
pip install -r requirements.txt
python -m pytest tests/ -v
python -m pytest tests/test_reliability.py -v

# Manual test
uvicorn app.main:app --reload
curl http://localhost:8000/api/v1/health/deep
```
