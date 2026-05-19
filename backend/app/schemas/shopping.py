"""
Pydantic schemas for shopping list management.
"""

from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from decimal import Decimal

from app.models.shopping import ShoppingListStatus


# Item Category schemas
class ItemCategoryCreate(BaseModel):
    """Schema for creating an item category."""

    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    icon: Optional[str] = Field(None, max_length=10, description="Category icon (emoji)")
    color: Optional[str] = Field(None, max_length=20, description="Category color (hex code)")
    household_id: Optional[UUID] = Field(None, description="Household ID for custom categories")


class ItemCategoryResponse(BaseModel):
    """Response schema for item category operations."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    icon: Optional[str] = None
    color: Optional[str] = None
    household_id: Optional[UUID] = None
    created_at: datetime


# Shopping List schemas
class ShoppingListCreate(BaseModel):
    """Schema for creating a shopping list."""

    household_id: UUID = Field(..., description="Household ID")
    name: str = Field(..., min_length=1, max_length=200, description="Shopping list name")
    description: Optional[str] = Field(None, max_length=1000, description="Shopping list description")


class ShoppingListUpdate(BaseModel):
    """Schema for updating a shopping list."""

    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Shopping list name")
    description: Optional[str] = Field(None, max_length=1000, description="Shopping list description")
    status: Optional[ShoppingListStatus] = Field(None, description="Shopping list status")


class ShoppingListResponse(BaseModel):
    """Response schema for shopping list operations."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    name: str
    description: Optional[str] = None
    status: ShoppingListStatus
    created_by: UUID
    created_at: datetime
    updated_at: datetime


# Shopping List Item schemas
class ShoppingListItemCreate(BaseModel):
    """Schema for creating a shopping list item."""

    name: str = Field(..., min_length=1, max_length=200, description="Item name")
    quantity: float = Field(1.0, gt=0, description="Item quantity")
    unit: Optional[str] = Field(None, max_length=50, description="Unit of measurement")
    category: Optional[str] = Field(None, max_length=100, description="Item category")
    assigned_to_id: Optional[UUID] = Field(None, description="User ID to assign the item to")
    price: Optional[Decimal] = Field(None, ge=0, description="Item price")
    notes: Optional[str] = Field(None, max_length=500, description="Item notes")
    is_recurring: bool = Field(False, description="Is this item recurring")
    recurring_pattern: Optional[str] = Field(
        None,
        max_length=50,
        description="Recurring pattern (e.g., 'weekly', 'monthly')"
    )
    recurring_until: Optional[datetime] = Field(None, description="End date for recurring items")
    position: int = Field(0, ge=0, description="Item position for ordering")


class ShoppingListItemUpdate(BaseModel):
    """Schema for updating a shopping list item."""

    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Item name")
    quantity: Optional[float] = Field(None, gt=0, description="Item quantity")
    unit: Optional[str] = Field(None, max_length=50, description="Unit of measurement")
    category: Optional[str] = Field(None, max_length=100, description="Item category")
    is_purchased: Optional[bool] = Field(None, description="Is item purchased")
    assigned_to_id: Optional[UUID] = Field(None, description="User ID to assign the item to")
    price: Optional[Decimal] = Field(None, ge=0, description="Item price")
    notes: Optional[str] = Field(None, max_length=500, description="Item notes")
    is_recurring: Optional[bool] = Field(None, description="Is this item recurring")
    recurring_pattern: Optional[str] = Field(
        None,
        max_length=50,
        description="Recurring pattern (e.g., 'weekly', 'monthly')"
    )
    recurring_until: Optional[datetime] = Field(None, description="End date for recurring items")
    position: Optional[int] = Field(None, ge=0, description="Item position for ordering")


class ShoppingListItemPurchaseUpdate(BaseModel):
    """Schema for marking an item as purchased/unpurchased."""

    is_purchased: bool = Field(..., description="Purchase status")


class ShoppingListItemResponse(BaseModel):
    """Response schema for shopping list item operations."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    shopping_list_id: UUID
    name: str
    quantity: float
    unit: Optional[str] = None
    category: Optional[str] = None
    is_purchased: bool
    assigned_to_id: Optional[UUID] = None
    price: Optional[Decimal] = None
    notes: Optional[str] = None
    is_recurring: bool
    recurring_pattern: Optional[str] = None
    recurring_until: Optional[datetime] = None
    last_recurring_date: Optional[datetime] = None
    checked_off_by: Optional[UUID] = None
    checked_off_at: Optional[datetime] = None
    position: int
    created_by: UUID
    created_at: datetime
    updated_at: datetime


class ShoppingListItemWithDetails(BaseModel):
    """Shopping list item schema with user details."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    shopping_list_id: UUID
    name: str
    quantity: float
    unit: Optional[str] = None
    category: Optional[str] = None
    is_purchased: bool
    assigned_to_id: Optional[UUID] = None
    assigned_to_name: Optional[str] = None
    assigned_to_email: Optional[str] = None
    price: Optional[Decimal] = None
    notes: Optional[str] = None
    is_recurring: bool
    recurring_pattern: Optional[str] = None
    recurring_until: Optional[datetime] = None
    last_recurring_date: Optional[datetime] = None
    checked_off_by: Optional[UUID] = None
    checked_off_by_name: Optional[str] = None
    checked_off_at: Optional[datetime] = None
    position: int
    created_by: UUID
    created_by_name: str
    created_by_email: str
    created_at: datetime
    updated_at: datetime


class ShoppingListWithItems(BaseModel):
    """Shopping list schema with all items."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    name: str
    description: Optional[str] = None
    status: ShoppingListStatus
    created_by: UUID
    created_by_name: str
    created_by_email: str
    created_at: datetime
    updated_at: datetime
    items: list[ShoppingListItemWithDetails] = []


class ShoppingListFilterParams(BaseModel):
    """Query parameters for filtering shopping lists."""

    status: Optional[ShoppingListStatus] = None
    include_archived: bool = False


class ShoppingListItemFilterParams(BaseModel):
    """Query parameters for filtering shopping list items."""

    category: Optional[str] = None
    is_purchased: Optional[bool] = None
    assigned_to_id: Optional[UUID] = None
    include_purchased: bool = True


class ShoppingListStats(BaseModel):
    """Statistics for a shopping list."""

    total_items: int
    purchased_items: int
    pending_items: int
    total_price: Optional[Decimal] = None
    categories: dict[str, int]  # category name -> item count
