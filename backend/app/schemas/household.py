"""
Pydantic schemas for household management.
"""
from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

from app.models.household import MemberRole, InviteStatus


# Household schemas
class HouseholdCreate(BaseModel):
    """Schema for creating a household."""
    name: str = Field(..., min_length=1, max_length=100, description="Household name")


class HouseholdUpdate(BaseModel):
    """Schema for updating a household."""
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Household name")


class HouseholdBase(BaseModel):
    """Base household schema."""
    id: UUID
    name: str
    created_by: UUID
    created_at: datetime

    class Config:
        from_attributes = True


# Member schemas
class MemberBase(BaseModel):
    """Base member schema."""
    id: UUID
    user_id: UUID
    household_id: UUID
    role: MemberRole
    joined_at: datetime

    class Config:
        from_attributes = True


class MemberWithUser(BaseModel):
    """Member schema with user details."""
    id: UUID
    user_id: UUID
    role: MemberRole
    joined_at: datetime
    email: str
    full_name: str
    profile_picture_url: Optional[str] = None

    class Config:
        from_attributes = True


class MemberRoleUpdate(BaseModel):
    """Schema for updating member role."""
    role: MemberRole


# Invite schemas
class InviteCreate(BaseModel):
    """Schema for creating an invite."""
    email: EmailStr


class InviteResponse(BaseModel):
    """Schema for invite response."""
    id: UUID
    household_id: UUID
    email: str
    token: str
    status: InviteStatus
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class JoinHouseholdRequest(BaseModel):
    """Schema for joining a household via invite token."""
    token: str


# Combined schemas
class HouseholdWithMembers(BaseModel):
    """Household schema with members list."""
    id: UUID
    name: str
    created_by: UUID
    created_at: datetime
    members: List[MemberWithUser]

    class Config:
        from_attributes = True


class HouseholdResponse(BaseModel):
    """Response schema for household operations."""
    id: UUID
    name: str
    created_by: UUID
    created_at: datetime
    member_count: Optional[int] = None

    class Config:
        from_attributes = True
