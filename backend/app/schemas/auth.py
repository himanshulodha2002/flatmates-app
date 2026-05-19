"""
Pydantic schemas for authentication.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, UUID4, ConfigDict


class UserResponse(BaseModel):
    """Schema for user response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID4
    email: str
    full_name: str
    google_id: str
    profile_picture_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    expires_in: int = 604800  # 7 days in seconds
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request."""
    
    refresh_token: str


class RefreshTokenResponse(BaseModel):
    """Schema for refresh token response."""
    
    access_token: str
    expires_in: int = 604800  # 7 days in seconds


class GoogleTokenRequest(BaseModel):
    """Schema for Google token request."""

    id_token: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
