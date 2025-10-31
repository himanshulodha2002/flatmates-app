"""
Household model for grouping flatmates together.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime
from sqlalchemy.orm import relationship

from app.models.base import Base
from app.models.user import GUID


class Household(Base):
    """Household model for grouping flatmates together."""

    __tablename__ = "households"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    members = relationship("User", back_populates="household")
    shopping_lists = relationship("ShoppingList", back_populates="household", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Household(id={self.id}, name={self.name})>"
