"""
Shopping list models for collaborative shopping.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.user import GUID


class ShoppingList(Base):
    """Shopping list model."""

    __tablename__ = "shopping_lists"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(GUID(), ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    created_by = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="shopping_lists")
    creator = relationship("User", foreign_keys=[created_by])
    items = relationship("ShoppingItem", back_populates="shopping_list", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<ShoppingList(id={self.id}, name={self.name})>"


class ShoppingItem(Base):
    """Shopping item model."""

    __tablename__ = "shopping_items"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    list_id = Column(GUID(), ForeignKey("shopping_lists.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    quantity = Column(String, nullable=True)  # Free text like "2 kg", "3 bottles", etc.
    category = Column(String, nullable=True)
    is_purchased = Column(Boolean, default=False, nullable=False)
    purchased_by = Column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    purchased_at = Column(DateTime, nullable=True)

    # Relationships
    shopping_list = relationship("ShoppingList", back_populates="items")
    purchaser = relationship("User", foreign_keys=[purchased_by])

    def __repr__(self):
        return f"<ShoppingItem(id={self.id}, name={self.name}, is_purchased={self.is_purchased})>"
