"""
Pydantic schemas for Household models.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class HouseholdBase(BaseModel):
    """Base schema for Household."""
    name: str


class HouseholdCreate(HouseholdBase):
    """Schema for creating a Household."""
    pass


class HouseholdUpdate(BaseModel):
    """Schema for updating a Household."""
    name: Optional[str] = None


class HouseholdMemberResponse(BaseModel):
    """Schema for household member information."""
    id: UUID
    email: str
    full_name: str
    profile_picture_url: Optional[str] = None
    joined_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class HouseholdResponse(HouseholdBase):
    """Schema for Household response."""
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class HouseholdDetailResponse(HouseholdResponse):
    """Schema for detailed Household response with members."""
    members: list[HouseholdMemberResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
