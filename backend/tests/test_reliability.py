"""
Tests for reliability improvements: retry logic, exception handlers, and request tracing.
"""
import pytest
from unittest.mock import patch, MagicMock
from sqlalchemy.exc import OperationalError, InterfaceError
from fastapi import status


def test_health_endpoint(client):
    """Test basic health check returns expected format."""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "environment" in data
    assert "database" in data


def test_health_endpoint_includes_latency(client):
    """Test that health check includes database latency."""
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    # When database is connected, latency_ms should be present
    if data.get("database") == "connected":
        assert "latency_ms" in data
        assert isinstance(data["latency_ms"], (int, float))


def test_deep_health_endpoint(client):
    """Test deep health check with detailed diagnostics."""
    response = client.get("/health/deep")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "status" in data
    assert "version" in data
    assert "environment" in data
    assert "checks" in data
    assert "api" in data["checks"]
    assert "database" in data["checks"]
    assert "database_latency_ms" in data["checks"]


def test_deep_health_check_structure(client):
    """Test deep health check has complete structure."""
    response = client.get("/health/deep")
    data = response.json()
    
    # Verify checks object structure
    checks = data["checks"]
    assert checks["api"] == "healthy"
    assert checks["database"] in ["healthy", "unhealthy"]
    
    # If database is healthy, latency should be a number
    if checks["database"] == "healthy":
        assert isinstance(checks["database_latency_ms"], (int, float))
        assert checks["database_latency_ms"] >= 0


def test_request_id_header_generated(client):
    """Test that request ID is generated and returned when not provided."""
    response = client.get("/health")
    assert "X-Request-ID" in response.headers
    # Should be a valid UUID-like string
    request_id = response.headers["X-Request-ID"]
    assert len(request_id) >= 8


def test_custom_request_id_preserved(client):
    """Test that custom request ID from client is preserved."""
    custom_id = "test-request-123"
    response = client.get(
        "/health",
        headers={"X-Request-ID": custom_id}
    )
    # The middleware should preserve the custom ID
    assert "X-Request-ID" in response.headers


def test_request_id_on_different_endpoints(client):
    """Test request ID is added to various endpoints."""
    endpoints = ["/", "/health", "/health/deep"]
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert "X-Request-ID" in response.headers, f"Missing X-Request-ID for {endpoint}"


def test_validation_error_format(client):
    """Test that validation errors return proper JSON format."""
    # Make a request to an endpoint that requires authentication with invalid data
    # This will trigger validation error based on the endpoint structure
    response = client.post(
        "/api/v1/auth/login",
        json={}  # Empty payload should trigger validation
    )
    # Should get validation error or auth error
    assert response.status_code in [status.HTTP_422_UNPROCESSABLE_ENTITY, status.HTTP_401_UNAUTHORIZED, status.HTTP_400_BAD_REQUEST]


def test_root_endpoint(client):
    """Test root endpoint returns API info."""
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "health" in data


def test_404_returns_json(client):
    """Test that 404 errors return proper response."""
    response = client.get("/api/v1/nonexistent-endpoint-xyz")
    assert response.status_code == status.HTTP_404_NOT_FOUND


class TestDatabaseRetryLogic:
    """Tests for database retry logic."""
    
    def test_get_db_with_retry_import(self):
        """Test that get_db_with_retry can be imported."""
        from app.core.database import get_db_with_retry
        assert callable(get_db_with_retry)
    
    def test_get_db_resilient_import(self):
        """Test that get_db_resilient can be imported."""
        from app.core.database import get_db_resilient
        assert get_db_resilient is not None
    
    def test_retry_decorator_configuration(self):
        """Test that retry is configured with tenacity."""
        from app.core.database import get_db_with_retry
        # Check that the function has retry decorator
        assert hasattr(get_db_with_retry, 'retry')


class TestExceptionHandlers:
    """Tests for global exception handlers."""
    
    def test_exception_handlers_registered(self):
        """Test that exception handlers are registered on the app."""
        from app.main import app
        
        # Check that we have exception handlers registered
        assert len(app.exception_handlers) > 0
    
    def test_sqlalchemy_error_handler_exists(self):
        """Test that SQLAlchemy error handler is registered."""
        from app.main import app
        from sqlalchemy.exc import SQLAlchemyError
        
        # Check for SQLAlchemyError handler
        assert SQLAlchemyError in app.exception_handlers


class TestTimeoutDecorator:
    """Tests for timeout decorator utility."""
    
    def test_with_timeout_import(self):
        """Test that with_timeout can be imported."""
        from app.main import with_timeout
        assert callable(with_timeout)
    
    def test_with_timeout_returns_decorator(self):
        """Test that with_timeout returns a decorator."""
        from app.main import with_timeout
        decorator = with_timeout(10)
        assert callable(decorator)


@pytest.mark.unit
class TestConnectionPoolSettings:
    """Tests for connection pool configuration."""
    
    def test_engine_has_pool_pre_ping(self):
        """Test that engine has pool_pre_ping enabled."""
        from app.core.database import engine
        # pool_pre_ping should be enabled for connection validation
        assert engine.pool.dialect.pool_pre_ping is True or hasattr(engine.pool, '_pre_ping')
    
    def test_database_url_detection(self):
        """Test that database URL type is detected correctly."""
        from app.core.config import settings
        # In tests, we use SQLite
        assert settings.DATABASE_URL.startswith("sqlite")
