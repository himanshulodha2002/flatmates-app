"""
Tests for authentication endpoints.
"""
import pytest
from unittest.mock import patch, MagicMock
from app.models.user import User


@pytest.mark.unit
def test_verify_token_function():
    """Test the verify_token function."""
    from app.core.security import verify_token, create_access_token
    from jose import JWTError
    
    # Create a valid token
    test_data = {"sub": "test-user-id"}
    token = create_access_token(test_data)
    
    # Verify token
    payload = verify_token(token)
    assert payload is not None
    assert payload["sub"] == "test-user-id"
    
    # Test invalid token
    with pytest.raises(JWTError):
        verify_token("invalid-token")


@pytest.mark.integration
def test_google_login_endpoint_success(client, db_session):
    """Test successful Google login."""
    # Mock Google token verification
    mock_idinfo = {
        "sub": "google-user-123",
        "email": "test@example.com",
        "name": "Test User",
        "picture": "https://example.com/photo.jpg"
    }
    
    with patch('app.api.v1.endpoints.auth.id_token.verify_oauth2_token', return_value=mock_idinfo):
        response = client.post(
            "/api/v1/auth/google/mobile",
            json={"id_token": "fake-google-token"}
        )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check response structure
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    
    # Check user data
    user_data = data["user"]
    assert user_data["email"] == "test@example.com"
    assert user_data["full_name"] == "Test User"
    assert user_data["google_id"] == "google-user-123"
    assert user_data["profile_picture_url"] == "https://example.com/photo.jpg"
    
    # Verify user was created in database
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    assert user is not None
    assert user.google_id == "google-user-123"


@pytest.mark.integration
def test_google_login_endpoint_invalid_token(client):
    """Test Google login with invalid token."""
    with patch('app.api.v1.endpoints.auth.id_token.verify_oauth2_token', side_effect=ValueError("Invalid token")):
        response = client.post(
            "/api/v1/auth/google/mobile",
            json={"id_token": "invalid-token"}
        )
    
    assert response.status_code == 401
    assert "Invalid Google token" in response.json()["detail"]


@pytest.mark.integration
def test_get_current_user_endpoint(client, db_session):
    """Test getting current user information."""
    from app.core.security import create_access_token
    
    # Create a test user
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google-123",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create access token
    token = create_access_token({"sub": str(user.id)})
    
    # Make request with token
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


@pytest.mark.integration
def test_get_current_user_without_token(client):
    """Test getting current user without token."""
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 403


@pytest.mark.integration
def test_get_current_user_with_invalid_token(client):
    """Test getting current user with invalid token."""
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid-token"}
    )
    assert response.status_code == 401


@pytest.mark.integration
def test_logout_endpoint(client, db_session):
    """Test logout endpoint."""
    from app.core.security import create_access_token
    
    # Create a test user
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google-123",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    
    # Create access token
    token = create_access_token({"sub": str(user.id)})
    
    # Make logout request
    response = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully logged out"


@pytest.mark.integration
def test_google_login_updates_existing_user(client, db_session):
    """Test that Google login updates existing user information."""
    # Create initial user
    user = User(
        email="old@example.com",
        full_name="Old Name",
        google_id="google-user-123",
        profile_picture_url=None,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    
    # Mock Google token with updated info
    mock_idinfo = {
        "sub": "google-user-123",
        "email": "new@example.com",
        "name": "New Name",
        "picture": "https://example.com/new-photo.jpg"
    }
    
    with patch('app.api.v1.endpoints.auth.id_token.verify_oauth2_token', return_value=mock_idinfo):
        response = client.post(
            "/api/v1/auth/google/mobile",
            json={"id_token": "fake-google-token"}
        )
    
    assert response.status_code == 200
    data = response.json()
    
    # Check that user info was updated
    user_data = data["user"]
    assert user_data["email"] == "new@example.com"
    assert user_data["full_name"] == "New Name"
    assert user_data["profile_picture_url"] == "https://example.com/new-photo.jpg"
