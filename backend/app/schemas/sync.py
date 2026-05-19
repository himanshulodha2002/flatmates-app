"""
Pydantic schemas for sync operations.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field
from decimal import Decimal

from app.models.todo import TodoStatus, TodoPriority
from app.models.shopping import ShoppingListStatus
from app.models.expense import ExpenseCategory, SplitType, PaymentMethod


# Entity schemas for sync
class TodoSyncDto(BaseModel):
    """Todo data for sync."""
    id: UUID
    household_id: UUID
    title: str
    description: Optional[str] = None
    status: TodoStatus = TodoStatus.PENDING
    priority: TodoPriority = TodoPriority.MEDIUM
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[UUID] = None
    created_by: UUID
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class ShoppingListSyncDto(BaseModel):
    """Shopping list data for sync."""
    id: UUID
    household_id: UUID
    name: str
    description: Optional[str] = None
    status: ShoppingListStatus = ShoppingListStatus.ACTIVE
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class ShoppingItemSyncDto(BaseModel):
    """Shopping item data for sync."""
    id: UUID
    shopping_list_id: UUID
    name: str
    quantity: float = 1.0
    unit: Optional[str] = None
    category: Optional[str] = None
    is_purchased: bool = False
    price: Optional[Decimal] = None
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class ExpenseSplitSyncDto(BaseModel):
    """Expense split data for sync."""
    id: UUID
    expense_id: UUID
    user_id: UUID
    amount_owed: Decimal
    is_settled: bool = False
    settled_at: Optional[datetime] = None


class ExpenseSyncDto(BaseModel):
    """Expense data for sync."""
    id: UUID
    household_id: UUID
    created_by: UUID
    amount: Decimal
    description: str
    category: ExpenseCategory = ExpenseCategory.OTHER
    split_type: SplitType = SplitType.EQUAL
    date: datetime
    created_at: datetime
    updated_at: datetime
    splits: List[ExpenseSplitSyncDto] = []


# Sync request/response schemas
class EntityChanges(BaseModel):
    """Changes for a single entity type."""
    created: List[dict] = []
    updated: List[dict] = []
    deleted: List[str] = []


class SyncChanges(BaseModel):
    """All entity changes in a sync request."""
    todos: Optional[EntityChanges] = None
    shopping_lists: Optional[EntityChanges] = None
    shopping_items: Optional[EntityChanges] = None
    expenses: Optional[EntityChanges] = None


class SyncRequest(BaseModel):
    """Sync request from client."""
    last_sync_timestamp: int = Field(..., description="Unix timestamp of last sync")
    household_id: UUID = Field(..., description="Household to sync")
    changes: SyncChanges = Field(default_factory=SyncChanges, description="Local changes to push")


class SyncConflict(BaseModel):
    """Represents a sync conflict."""
    entity_type: str
    entity_id: str
    local_version: str
    server_version: str
    conflict_type: str  # "UPDATE_UPDATE", "DELETE_UPDATE", etc.


class SyncResponse(BaseModel):
    """Sync response to client."""
    server_timestamp: int = Field(..., description="Current server timestamp")
    todos: List[TodoSyncDto] = []
    shopping_lists: List[ShoppingListSyncDto] = []
    shopping_items: List[ShoppingItemSyncDto] = []
    expenses: List[ExpenseSyncDto] = []
    conflicts: List[SyncConflict] = []
