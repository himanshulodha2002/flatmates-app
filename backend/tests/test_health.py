"""
Tests for health check endpoint.
"""
import pytest
from fastapi import status


def test_health_check(client):
    """
    Test that health check endpoint returns correct response.
    """
    response = client.get("/health")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "status" in data
    assert data["status"] == "healthy"
    assert "database" in data


def test_root_endpoint(client):
    """
    Test that root endpoint returns API information.
    """
    response = client.get("/")
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "docs" in data
    assert "health" in data
    assert data["docs"] == "/docs"
    assert data["health"] == "/health"


@pytest.mark.unit
def test_health_check_structure(client):
    """
    Test that health check has the expected structure.
    """
    response = client.get("/health")
    data = response.json()
    
    # Check required fields
    required_fields = ["status", "database"]
    for field in required_fields:
        assert field in data, f"Missing required field: {field}"
    
    # Check data types
    assert isinstance(data["status"], str)
    assert isinstance(data["database"], str)
