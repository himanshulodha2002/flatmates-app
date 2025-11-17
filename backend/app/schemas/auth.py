"""
Pydantic schemas for authentication.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, UUID4


class UserResponse(BaseModel):
    """Schema for user response."""

    id: UUID4
    email: str
    full_name: str
    google_id: str
    profile_picture_url: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for token response."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GoogleTokenRequest(BaseModel):
    """Schema for Google token request."""

    id_token: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""

    full_name: Optional[str] = None
    profile_picture_url: Optional[str] = None
