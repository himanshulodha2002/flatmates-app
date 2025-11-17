"""
Expense models for tracking shared household expenses.
"""

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Numeric, Boolean, JSON
from sqlalchemy.orm import relationship
from typing import Optional

from app.models.base import Base
from app.models.user import GUID


class Expense(Base):
    """Expense model for storing household expenses."""

    __tablename__ = "expenses"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(
        GUID(), ForeignKey("households.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)  # Supports up to 99,999,999.99
    category = Column(String, nullable=False, index=True)  # AI-suggested or manual
    subcategory = Column(String, nullable=True)
    tags = Column(JSON, nullable=True)  # Array of tags for filtering

    # AI categorization metadata
    ai_categorized = Column(Boolean, default=False)
    ai_confidence = Column(Numeric(3, 2), nullable=True)  # 0.00 to 1.00
    ai_reasoning = Column(Text, nullable=True)

    # Receipt data
    receipt_url = Column(String, nullable=True)  # URL to stored receipt image
    receipt_data = Column(JSON, nullable=True)  # OCR extracted data

    # Expense details
    expense_date = Column(DateTime, nullable=False, index=True)
    paid_by_id = Column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)

    # Split information (for future enhancement)
    split_type = Column(String, nullable=True)  # "equal", "percentage", "custom"
    split_data = Column(JSON, nullable=True)  # Details of how expense is split

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    household = relationship("Household", back_populates="expenses")
    paid_by = relationship("User", foreign_keys=[paid_by_id])
    creator = relationship("User", foreign_keys=[created_by])

    def __repr__(self):
        return f"<Expense {self.title} - ${self.amount} ({self.category})>"
