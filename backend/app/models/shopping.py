"""
Shopping list models for collaborative shopping management.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as SQLEnum, Boolean, Float, Numeric, Integer, UniqueConstraint
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base
from app.models.user import GUID


class ShoppingListStatus(str, enum.Enum):
    """Enum for shopping list statuses."""

    ACTIVE = "active"
    ARCHIVED = "archived"


class ItemCategory(Base):
    """Category model for shopping list items."""

    __tablename__ = "item_categories"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    icon = Column(String, nullable=True)
    color = Column(String, nullable=True)
    household_id = Column(
        GUID(), ForeignKey("households.id", ondelete="CASCADE"), nullable=True, index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    household = relationship("Household")

    __table_args__ = (
        UniqueConstraint('name', 'household_id', name='uq_category_name_household'),
    )

    def __repr__(self):
        return f"<ItemCategory(id={self.id}, name={self.name})>"


class ShoppingList(Base):
    """Shopping list model for storing household shopping lists."""

    __tablename__ = "shopping_lists"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(
        GUID(), ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(SQLEnum(ShoppingListStatus), nullable=False, default=ShoppingListStatus.ACTIVE, index=True)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    household = relationship("Household")
    created_by_user = relationship("User", foreign_keys=[created_by])
    items = relationship("ShoppingListItem", back_populates="shopping_list", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ShoppingList(id={self.id}, name={self.name}, status={self.status})>"


class ShoppingListItem(Base):
    """Shopping list item model for storing individual items."""

    __tablename__ = "shopping_list_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    shopping_list_id = Column(
        GUID(), ForeignKey("shopping_lists.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name = Column(String, nullable=False)
    quantity = Column(Float, nullable=False, default=1.0)
    unit = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    is_purchased = Column(Boolean, nullable=False, default=False, index=True)
    assigned_to_id = Column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    price = Column(Numeric(10, 2), nullable=True)
    notes = Column(Text, nullable=True)
    is_recurring = Column(Boolean, nullable=False, default=False)
    recurring_pattern = Column(String, nullable=True)  # e.g., "weekly", "monthly"
    recurring_until = Column(DateTime, nullable=True)
    last_recurring_date = Column(DateTime, nullable=True)
    checked_off_by = Column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    checked_off_at = Column(DateTime, nullable=True)
    position = Column(Integer, nullable=False, default=0, index=True)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    shopping_list = relationship("ShoppingList", back_populates="items")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    checked_off_by_user = relationship("User", foreign_keys=[checked_off_by])
    created_by_user = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<ShoppingListItem(id={self.id}, name={self.name}, is_purchased={self.is_purchased})>"
