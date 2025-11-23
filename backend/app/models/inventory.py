"""
Inventory models for tracking groceries and food items in stock.
"""

import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Text, DateTime, Date, ForeignKey, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base
from app.models.user import GUID


class InventoryCategory(str, enum.Enum):
    """Enum for inventory item categories."""

    DAIRY = "dairy"
    VEGETABLES = "vegetables"
    FRUITS = "fruits"
    MEAT = "meat"
    SEAFOOD = "seafood"
    GRAINS = "grains"
    PANTRY = "pantry"
    BEVERAGES = "beverages"
    FROZEN = "frozen"
    SNACKS = "snacks"
    CONDIMENTS = "condiments"
    OTHER = "other"


class InventoryLocation(str, enum.Enum):
    """Enum for inventory item storage locations."""

    FRIDGE = "fridge"
    FREEZER = "freezer"
    PANTRY = "pantry"
    KITCHEN_CABINET = "kitchen_cabinet"
    OTHER = "other"


class InventoryItem(Base):
    """Inventory item model for tracking groceries and food items in stock."""

    __tablename__ = "inventory_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(
        GUID(), ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)  # e.g., "kg", "liters", "pieces", "units"
    category = Column(SQLEnum(InventoryCategory), nullable=False, index=True)
    location = Column(SQLEnum(InventoryLocation), nullable=False, index=True)
    expiry_date = Column(Date, nullable=True, index=True)
    purchase_date = Column(Date, nullable=True)
    low_stock_threshold = Column(Float, nullable=True)  # Alert when quantity falls below this
    notes = Column(Text, nullable=True)
    added_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    household = relationship("Household")
    added_by_user = relationship("User", foreign_keys=[added_by])

    def __repr__(self):
        return f"<InventoryItem(id={self.id}, name={self.name}, quantity={self.quantity}, location={self.location})>"
