"""
Household models for managing flatmate groups.
"""

import uuid
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base
from app.models.user import GUID
from app.core.database import utc_now


class MemberRole(str, enum.Enum):
    """Enum for household member roles."""

    OWNER = "owner"
    MEMBER = "member"


class InviteStatus(str, enum.Enum):
    """Enum for invite statuses."""

    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"


class Household(Base):
    """Household model for storing household/group data."""

    __tablename__ = "households"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    members = relationship(
        "HouseholdMember", back_populates="household", cascade="all, delete-orphan"
    )
    invites = relationship(
        "HouseholdInvite", back_populates="household", cascade="all, delete-orphan"
    )
    expenses = relationship(
        "Expense", back_populates="household", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Household(id={self.id}, name={self.name})>"


class HouseholdMember(Base):
    """HouseholdMember model for user-to-household relationships."""

    __tablename__ = "household_members"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False)
    household_id = Column(GUID(), ForeignKey("households.id"), nullable=False)
    role = Column(SQLEnum(MemberRole), nullable=False, default=MemberRole.MEMBER)
    joined_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="members")
    user = relationship("User")

    # Constraints
    __table_args__ = (UniqueConstraint("user_id", "household_id", name="uix_user_household"),)

    def __repr__(self):
        return f"<HouseholdMember(user_id={self.user_id}, household_id={self.household_id}, role={self.role})>"


class HouseholdInvite(Base):
    """HouseholdInvite model for inviting users to households."""

    __tablename__ = "household_invites"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(GUID(), ForeignKey("households.id"), nullable=False)
    email = Column(String, nullable=False)
    token = Column(String, unique=True, nullable=False, index=True)
    status = Column(SQLEnum(InviteStatus), nullable=False, default=InviteStatus.PENDING)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="invites")

    def __repr__(self):
        return f"<HouseholdInvite(email={self.email}, household_id={self.household_id}, status={self.status})>"
