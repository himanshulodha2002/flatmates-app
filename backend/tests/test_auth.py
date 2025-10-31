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
