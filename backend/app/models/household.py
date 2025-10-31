"""
Household model for managing shared living spaces.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.user import GUID


class Household(Base):
    """Household model for grouping flatmates together."""

    __tablename__ = "households"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships will be added as needed
    
    def __repr__(self):
        return f"<Household(id={self.id}, name={self.name})>"


class HouseholdMember(Base):
    """Association table for household members."""

    __tablename__ = "household_members"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(GUID(), ForeignKey("households.id"), nullable=False)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<HouseholdMember(household_id={self.household_id}, user_id={self.user_id})>"
