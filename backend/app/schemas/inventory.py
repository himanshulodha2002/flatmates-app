"""
Pydantic schemas for inventory management.
"""

from datetime import datetime, date
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.inventory import InventoryCategory, InventoryLocation


# Inventory Item schemas
class InventoryItemCreate(BaseModel):
    """Schema for creating an inventory item."""

    household_id: UUID = Field(..., description="Household ID")
    name: str = Field(..., min_length=1, max_length=200, description="Item name")
    quantity: float = Field(..., gt=0, description="Item quantity")
    unit: str = Field(..., min_length=1, max_length=50, description="Unit of measurement (kg, liters, pieces, etc.)")
    category: InventoryCategory = Field(..., description="Item category")
    location: InventoryLocation = Field(..., description="Storage location")
    expiry_date: Optional[date] = Field(None, description="Expiry date")
    purchase_date: Optional[date] = Field(None, description="Purchase date")
    low_stock_threshold: Optional[float] = Field(None, ge=0, description="Alert threshold for low stock")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")


class InventoryItemUpdate(BaseModel):
    """Schema for updating an inventory item."""

    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Item name")
    quantity: Optional[float] = Field(None, gt=0, description="Item quantity")
    unit: Optional[str] = Field(None, min_length=1, max_length=50, description="Unit of measurement")
    category: Optional[InventoryCategory] = Field(None, description="Item category")
    location: Optional[InventoryLocation] = Field(None, description="Storage location")
    expiry_date: Optional[date] = Field(None, description="Expiry date")
    purchase_date: Optional[date] = Field(None, description="Purchase date")
    low_stock_threshold: Optional[float] = Field(None, ge=0, description="Alert threshold for low stock")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")


class InventoryItemConsume(BaseModel):
    """Schema for consuming/reducing inventory item quantity."""

    quantity: float = Field(..., gt=0, description="Quantity to consume")


class InventoryItemResponse(BaseModel):
    """Response schema for inventory item operations."""

    id: UUID
    household_id: UUID
    name: str
    quantity: float
    unit: str
    category: InventoryCategory
    location: InventoryLocation
    expiry_date: Optional[date] = None
    purchase_date: Optional[date] = None
    low_stock_threshold: Optional[float] = None
    notes: Optional[str] = None
    added_by: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InventoryItemWithDetails(BaseModel):
    """Inventory item schema with user details."""

    id: UUID
    household_id: UUID
    name: str
    quantity: float
    unit: str
    category: InventoryCategory
    location: InventoryLocation
    expiry_date: Optional[date] = None
    purchase_date: Optional[date] = None
    low_stock_threshold: Optional[float] = None
    notes: Optional[str] = None
    added_by: UUID
    added_by_name: str
    added_by_email: str
    created_at: datetime
    updated_at: datetime
    is_expiring_soon: bool = False  # True if expiring within 7 days
    is_low_stock: bool = False  # True if below threshold
    days_until_expiry: Optional[int] = None

    class Config:
        from_attributes = True


class InventoryFilterParams(BaseModel):
    """Query parameters for filtering inventory items."""

    category: Optional[InventoryCategory] = None
    location: Optional[InventoryLocation] = None
    expiring_soon: Optional[bool] = Field(None, description="Filter items expiring within 7 days")
    low_stock: Optional[bool] = Field(None, description="Filter items below low stock threshold")


class InventoryStats(BaseModel):
    """Statistics for inventory."""

    total_items: int
    expiring_soon_count: int  # Items expiring within 7 days
    low_stock_count: int  # Items below threshold
    expired_count: int  # Items past expiry date
    category_counts: dict[str, int]  # category -> item count
    location_counts: dict[str, int]  # location -> item count
