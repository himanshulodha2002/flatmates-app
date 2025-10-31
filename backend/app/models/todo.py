"""
Todo models for managing collaborative todo lists.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base
from app.models.user import GUID


class TodoPriority(str, enum.Enum):
    """Priority levels for todo items."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TodoList(Base):
    """TodoList model for organizing todos."""

    __tablename__ = "todo_lists"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(GUID(), ForeignKey('households.id', ondelete='CASCADE'), nullable=False)
    name = Column(String, nullable=False)
    created_by = Column(GUID(), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="todo_lists")
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("TodoItem", back_populates="todo_list", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<TodoList(id={self.id}, name={self.name})>"


class TodoItem(Base):
    """TodoItem model for individual todo tasks."""

    __tablename__ = "todo_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    list_id = Column(GUID(), ForeignKey('todo_lists.id', ondelete='CASCADE'), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime, nullable=True)
    priority = Column(SQLEnum(TodoPriority), default=TodoPriority.MEDIUM, nullable=False)
    assigned_user_id = Column(GUID(), ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    todo_list = relationship("TodoList", back_populates="items")
    assigned_user = relationship("User", foreign_keys=[assigned_user_id])

    def __repr__(self):
        return f"<TodoItem(id={self.id}, title={self.title}, completed={self.is_completed})>"
