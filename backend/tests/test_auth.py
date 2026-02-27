"""
Tests for authentication functionality.
"""
import pytest
from app.core.security import (
    verify_password,
    get_password_hash,
    create_access_token,
    decode_access_token
)


@pytest.mark.unit
def test_password_hashing():
    """
    Test password hashing and verification.
    """
    password = "testpassword123"
    hashed = get_password_hash(password)
    
    # Hashed password should be different from original
    assert hashed != password
    
    # Should be able to verify correct password
    assert verify_password(password, hashed) is True
    
    # Should reject incorrect password
    assert verify_password("wrongpassword", hashed) is False


@pytest.mark.unit
def test_create_access_token():
    """
    Test JWT token creation.
    """
    data = {"sub": "user@example.com"}
    token = create_access_token(data)
    
    # Token should be a non-empty string
    assert isinstance(token, str)
    assert len(token) > 0


@pytest.mark.unit
def test_decode_access_token():
    """
    Test JWT token decoding.
    """
    test_data = {"sub": "user@example.com", "user_id": 123}
    token = create_access_token(test_data)
    
    # Decode token
    decoded = decode_access_token(token)
    
    # Check that original data is preserved
    assert decoded is not None
    assert decoded.get("sub") == test_data["sub"]
    assert decoded.get("user_id") == test_data["user_id"]


@pytest.mark.unit
def test_decode_invalid_token():
    """
    Test decoding of invalid token.
    """
    invalid_token = "invalid.token.here"
    decoded = decode_access_token(invalid_token)
    
    # Should return None for invalid token
    assert decoded is None


class TestTokenEdgeCases:
    """Tests for JWT token edge cases."""

    def test_expired_token_returns_none(self):
        """Test that expired tokens return None."""
        from app.core.security import create_access_token, decode_access_token
        from datetime import timedelta
        token = create_access_token({"sub": "user123"}, expires_delta=timedelta(seconds=-1))
        decoded = decode_access_token(token)
        assert decoded is None

    def test_token_with_empty_subject(self):
        """Test token with empty subject string."""
        from app.core.security import create_access_token, decode_access_token
        token = create_access_token({"sub": ""})
        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == ""

    def test_token_with_extra_claims(self):
        """Test token preserves extra claims."""
        from app.core.security import create_access_token, decode_access_token
        token = create_access_token({"sub": "user123", "role": "admin", "household_id": "abc"})
        decoded = decode_access_token(token)
        assert decoded["sub"] == "user123"
        assert decoded["role"] == "admin"
        assert decoded["household_id"] == "abc"

    def test_verify_token_raises_on_invalid(self):
        """Test verify_token raises JWTError on invalid token."""
        from app.core.security import verify_token
        from jose import JWTError
        import pytest
        with pytest.raises(JWTError):
            verify_token("invalid.token.value")

    def test_verify_token_raises_on_missing_subject(self):
        """Test verify_token raises JWTError when sub is missing."""
        from app.core.security import verify_token, create_access_token
        from jose import JWTError
        import pytest
        # Create token without 'sub' claim
        from jose import jwt
        from app.core.config import settings
        from datetime import datetime, timedelta, timezone
        token = jwt.encode(
            {"data": "no-subject", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
            settings.SECRET_KEY,
            algorithm=settings.ALGORITHM,
        )
        with pytest.raises(JWTError, match="Token missing subject"):
            verify_token(token)


class TestAuthEndpointEdgeCases:
    """Tests for auth endpoint edge cases."""

    def test_get_me_no_auth(self, client):
        """Test /auth/me without authentication."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code in (401, 403)

    def test_get_me_invalid_token(self, client):
        """Test /auth/me with invalid bearer token."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token-here"},
        )
        assert response.status_code in (401, 403)

    def test_get_me_malformed_auth_header(self, client):
        """Test /auth/me with malformed Authorization header."""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "NotBearer sometoken"},
        )
        assert response.status_code in (401, 403)

    def test_get_me_valid_user(self, client, user1, auth1):
        """Test /auth/me returns correct user data."""
        response = client.get("/api/v1/auth/me", headers=auth1)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "alice@example.com"
        assert data["full_name"] == "Alice Smith"

    def test_google_mobile_empty_token(self, client):
        """Test Google mobile auth with empty token."""
        response = client.post(
            "/api/v1/auth/google/mobile",
            json={"id_token": ""},
        )
        assert response.status_code in (400, 401, 422)

    def test_google_mobile_missing_token(self, client):
        """Test Google mobile auth with missing token field."""
        response = client.post(
            "/api/v1/auth/google/mobile",
            json={},
        )
        assert response.status_code == 422

    def test_logout_no_auth(self, client):
        """Test logout without authentication."""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code in (401, 403)

    def test_logout_valid(self, client, user1, auth1):
        """Test logout with valid auth."""
        response = client.post("/api/v1/auth/logout", headers=auth1)
        assert response.status_code == 200

    def test_update_me_valid(self, client, user1, auth1):
        """Test updating user profile."""
        response = client.patch(
            "/api/v1/auth/me",
            json={"full_name": "Alice Updated"},
            headers=auth1,
        )
        assert response.status_code == 200
        assert response.json()["full_name"] == "Alice Updated"

    def test_update_me_no_auth(self, client):
        """Test updating profile without auth."""
        response = client.patch(
            "/api/v1/auth/me",
            json={"full_name": "Hacker"},
        )
        assert response.status_code in (401, 403)
