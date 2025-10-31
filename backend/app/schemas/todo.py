"""
Pydantic schemas for Todo models.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict

from app.models.todo import TodoPriority


class TodoListBase(BaseModel):
    """Base schema for TodoList."""
    name: str


class TodoListCreate(TodoListBase):
    """Schema for creating a TodoList."""
    pass


class TodoListResponse(TodoListBase):
    """Schema for TodoList response."""
    id: UUID
    household_id: UUID
    created_by: UUID
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TodoItemBase(BaseModel):
    """Base schema for TodoItem."""
    title: str
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: TodoPriority = TodoPriority.MEDIUM
    assigned_user_id: Optional[UUID] = None


class TodoItemCreate(TodoItemBase):
    """Schema for creating a TodoItem."""
    pass


class TodoItemUpdate(BaseModel):
    """Schema for updating a TodoItem."""
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[TodoPriority] = None
    assigned_user_id: Optional[UUID] = None
    is_completed: Optional[bool] = None


class TodoItemResponse(TodoItemBase):
    """Schema for TodoItem response."""
    id: UUID
    list_id: UUID
    is_completed: bool
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class TodoListWithItemsResponse(TodoListResponse):
    """Schema for TodoList with items."""
    items: list[TodoItemResponse] = []
    
    model_config = ConfigDict(from_attributes=True)
