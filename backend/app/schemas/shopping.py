"""
Pydantic schemas for shopping lists and items.
"""
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field


# Shopping Item Schemas
class ShoppingItemBase(BaseModel):
    """Base schema for shopping item."""
    name: str = Field(..., min_length=1, max_length=255)
    quantity: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=50)


class ShoppingItemCreate(ShoppingItemBase):
    """Schema for creating a shopping item."""
    pass


class ShoppingItemUpdate(BaseModel):
    """Schema for updating a shopping item."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    quantity: Optional[str] = Field(None, max_length=50)
    category: Optional[str] = Field(None, max_length=50)
    is_purchased: Optional[bool] = None


class ShoppingItemResponse(ShoppingItemBase):
    """Schema for shopping item response."""
    id: UUID
    list_id: UUID
    is_purchased: bool
    purchased_by: Optional[UUID] = None
    purchased_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Shopping List Schemas
class ShoppingListBase(BaseModel):
    """Base schema for shopping list."""
    name: str = Field(..., min_length=1, max_length=255)


class ShoppingListCreate(ShoppingListBase):
    """Schema for creating a shopping list."""
    pass


class ShoppingListResponse(ShoppingListBase):
    """Schema for shopping list response."""
    id: UUID
    household_id: UUID
    created_by: UUID
    created_at: datetime
    items: List[ShoppingItemResponse] = []

    class Config:
        from_attributes = True


class ShoppingListSummary(ShoppingListBase):
    """Schema for shopping list summary (without items)."""
    id: UUID
    household_id: UUID
    created_by: UUID
    created_at: datetime
    item_count: Optional[int] = 0
    purchased_count: Optional[int] = 0

    class Config:
        from_attributes = True
