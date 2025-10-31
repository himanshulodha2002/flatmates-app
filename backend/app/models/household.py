"""
Household model for managing shared living spaces.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.user import GUID


# Association table for household members
household_members = Table(
    'household_members',
    Base.metadata,
    Column('household_id', GUID(), ForeignKey('households.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', GUID(), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('joined_at', DateTime, default=datetime.utcnow, nullable=False)
)


class Household(Base):
    """Household model for storing shared living space data."""

    __tablename__ = "households"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(GUID(), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_households")
    members = relationship("User", secondary=household_members, back_populates="households")
    todo_lists = relationship("TodoList", back_populates="household", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Household(id={self.id}, name={self.name})>"
