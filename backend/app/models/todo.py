"""
Todo models for managing tasks in households.
"""

import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base
from app.models.user import GUID
from app.core.database import utc_now


class TodoStatus(str, enum.Enum):
    """Enum for todo statuses."""

    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class TodoPriority(str, enum.Enum):
    """Enum for todo priorities."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Todo(Base):
    """Todo model for storing household tasks."""

    __tablename__ = "todos"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(
        GUID(), ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(TodoStatus), nullable=False, default=TodoStatus.PENDING, index=True)
    priority = Column(SQLEnum(TodoPriority), nullable=False, default=TodoPriority.MEDIUM)
    due_date = Column(DateTime, nullable=True, index=True)
    assigned_to_id = Column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    recurring_pattern = Column(String, nullable=True)  # e.g., "daily", "weekly", "monthly"
    recurring_until = Column(DateTime, nullable=True)
    parent_todo_id = Column(
        GUID(), ForeignKey("todos.id", ondelete="SET NULL"), nullable=True
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    household = relationship("Household")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    created_by_user = relationship("User", foreign_keys=[created_by])
    parent_todo = relationship("Todo", remote_side=[id], backref="recurring_instances")

    def __repr__(self):
        return f"<Todo(id={self.id}, title={self.title}, status={self.status})>"
