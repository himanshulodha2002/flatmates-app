"""
Shopping models for collaborative shopping lists.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.user import GUID


class ShoppingList(Base):
    """Shopping list model for household shopping."""

    __tablename__ = "shopping_lists"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(GUID(), ForeignKey("households.id"), nullable=False)
    name = Column(String, nullable=False)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    items = relationship("ShoppingItem", back_populates="shopping_list", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ShoppingList(id={self.id}, name={self.name})>"


class ShoppingItem(Base):
    """Shopping item model for items in a shopping list."""

    __tablename__ = "shopping_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    list_id = Column(GUID(), ForeignKey("shopping_lists.id"), nullable=False)
    name = Column(String, nullable=False)
    quantity = Column(String, nullable=True)  # Free text like "2 kg", "1 dozen", etc.
    category = Column(String, nullable=True)  # Categories like "Dairy", "Vegetables", etc.
    is_purchased = Column(Boolean, default=False, nullable=False)
    purchased_by = Column(GUID(), ForeignKey("users.id"), nullable=True)
    purchased_at = Column(DateTime, nullable=True)

    # Relationships
    shopping_list = relationship("ShoppingList", back_populates="items")

    def __repr__(self):
        return f"<ShoppingItem(id={self.id}, name={self.name}, is_purchased={self.is_purchased})>"
