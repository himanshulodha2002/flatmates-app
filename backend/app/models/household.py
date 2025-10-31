"""
Household models for managing flatmate households.
"""
import uuid
from datetime import datetime, timedelta
from enum import Enum as PyEnum
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, UniqueConstraint
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.user import GUID


class MemberRole(str, PyEnum):
    """Enum for household member roles."""
    OWNER = "owner"
    MEMBER = "member"


class InviteStatus(str, PyEnum):
    """Enum for household invite status."""
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"


class Household(Base):
    """Household model for storing household data."""

    __tablename__ = "households"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    creator = relationship("User", foreign_keys=[created_by])
    members = relationship("HouseholdMember", back_populates="household", cascade="all, delete-orphan")
    invites = relationship("HouseholdInvite", back_populates="household", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Household(id={self.id}, name={self.name})>"


class HouseholdMember(Base):
    """HouseholdMember model for managing household membership."""

    __tablename__ = "household_members"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    household_id = Column(GUID(), ForeignKey("households.id", ondelete="CASCADE"), nullable=False)
    role = Column(Enum(MemberRole), default=MemberRole.MEMBER, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Unique constraint: a user can only be a member of a household once
    __table_args__ = (
        UniqueConstraint('user_id', 'household_id', name='unique_user_household'),
    )

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    household = relationship("Household", back_populates="members")

    def __repr__(self):
        return f"<HouseholdMember(id={self.id}, user_id={self.user_id}, household_id={self.household_id}, role={self.role})>"


class HouseholdInvite(Base):
    """HouseholdInvite model for managing household invitations."""

    __tablename__ = "household_invites"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(GUID(), ForeignKey("households.id", ondelete="CASCADE"), nullable=False)
    email = Column(String, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    status = Column(Enum(InviteStatus), default=InviteStatus.PENDING, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="invites")
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<HouseholdInvite(id={self.id}, email={self.email}, status={self.status})>"

    @property
    def is_expired(self) -> bool:
        """Check if the invite has expired."""
        return datetime.utcnow() > self.expires_at or self.status == InviteStatus.EXPIRED

    @classmethod
    def generate_token(cls) -> str:
        """Generate a unique invite token."""
        return str(uuid.uuid4())

    @classmethod
    def default_expiry(cls) -> datetime:
        """Get default expiry date (7 days from now)."""
        return datetime.utcnow() + timedelta(days=7)
