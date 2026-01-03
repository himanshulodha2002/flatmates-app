"""
Pydantic schemas for todo management.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

from app.models.todo import TodoStatus, TodoPriority


# Todo schemas
class TodoCreate(BaseModel):
    """Schema for creating a todo."""

    household_id: UUID = Field(..., description="Household ID")
    title: str = Field(..., min_length=1, max_length=200, description="Todo title")
    description: Optional[str] = Field(None, max_length=2000, description="Todo description")
    priority: TodoPriority = Field(TodoPriority.MEDIUM, description="Todo priority")
    due_date: Optional[datetime] = Field(None, description="Due date")
    assigned_to_id: Optional[UUID] = Field(None, description="User ID to assign the todo to")
    recurring_pattern: Optional[str] = Field(
        None,
        max_length=50,
        description="Recurring pattern (e.g., 'daily', 'weekly', 'monthly')"
    )
    recurring_until: Optional[datetime] = Field(None, description="End date for recurring todos")


class TodoUpdate(BaseModel):
    """Schema for updating a todo."""

    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Todo title")
    description: Optional[str] = Field(None, max_length=2000, description="Todo description")
    status: Optional[TodoStatus] = Field(None, description="Todo status")
    priority: Optional[TodoPriority] = Field(None, description="Todo priority")
    due_date: Optional[datetime] = Field(None, description="Due date")
    assigned_to_id: Optional[UUID] = Field(None, description="User ID to assign the todo to")
    recurring_pattern: Optional[str] = Field(
        None,
        max_length=50,
        description="Recurring pattern (e.g., 'daily', 'weekly', 'monthly')"
    )
    recurring_until: Optional[datetime] = Field(None, description="End date for recurring todos")


class TodoStatusUpdate(BaseModel):
    """Schema for updating todo status."""

    status: TodoStatus = Field(..., description="New todo status")


class TodoResponse(BaseModel):
    """Response schema for todo operations."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    title: str
    description: Optional[str] = None
    status: TodoStatus
    priority: TodoPriority
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[UUID] = None
    created_by: UUID
    recurring_pattern: Optional[str] = None
    recurring_until: Optional[datetime] = None
    parent_todo_id: Optional[UUID] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TodoWithDetails(BaseModel):
    """Todo schema with user details."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    title: str
    description: Optional[str] = None
    status: TodoStatus
    priority: TodoPriority
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[UUID] = None
    assigned_to_name: Optional[str] = None
    assigned_to_email: Optional[str] = None
    created_by: UUID
    created_by_name: str
    created_by_email: str
    recurring_pattern: Optional[str] = None
    recurring_until: Optional[datetime] = None
    parent_todo_id: Optional[UUID] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class TodoListResponse(BaseModel):
    """Response schema for list of todos with pagination."""

    todos: list[TodoResponse]
    total: int
    page: int
    page_size: int


class TodoFilterParams(BaseModel):
    """Query parameters for filtering todos."""

    status: Optional[TodoStatus] = None
    priority: Optional[TodoPriority] = None
    assigned_to_id: Optional[UUID] = None
    due_before: Optional[datetime] = None
    due_after: Optional[datetime] = None
    include_completed: bool = True
