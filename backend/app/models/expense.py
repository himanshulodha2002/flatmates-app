"""
Expense models for tracking shared and personal expenses.
"""

import uuid
from decimal import Decimal
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum as SQLEnum, Boolean, Numeric
from sqlalchemy.orm import relationship
import enum

from app.models.base import Base
from app.models.user import GUID
from app.core.database import utc_now


class ExpenseCategory(str, enum.Enum):
    """Enum for expense categories."""

    GROCERIES = "groceries"
    UTILITIES = "utilities"
    RENT = "rent"
    INTERNET = "internet"
    CLEANING = "cleaning"
    MAINTENANCE = "maintenance"
    ENTERTAINMENT = "entertainment"
    FOOD = "food"
    TRANSPORTATION = "transportation"
    OTHER = "other"


class SplitType(str, enum.Enum):
    """Enum for expense split types."""

    EQUAL = "equal"
    CUSTOM = "custom"
    PERCENTAGE = "percentage"


class PaymentMethod(str, enum.Enum):
    """Enum for payment methods."""

    CASH = "cash"
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    DIGITAL_WALLET = "digital_wallet"
    OTHER = "other"


class Expense(Base):
    """Expense model for storing expense data."""

    __tablename__ = "expenses"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    household_id = Column(GUID(), ForeignKey("households.id"), nullable=False, index=True)
    created_by = Column(GUID(), ForeignKey("users.id"), nullable=False)

    # Expense details
    amount = Column(Numeric(10, 2), nullable=False)  # Total amount
    description = Column(String, nullable=False)
    category = Column(SQLEnum(ExpenseCategory), nullable=False, default=ExpenseCategory.OTHER)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False, default=PaymentMethod.CASH)
    date = Column(DateTime(timezone=True), nullable=False, default=utc_now)

    # Split configuration
    split_type = Column(SQLEnum(SplitType), nullable=False, default=SplitType.EQUAL)
    is_personal = Column(Boolean, default=False, nullable=False)  # True for personal expenses

    # Metadata
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    household = relationship("Household")
    creator = relationship("User", foreign_keys=[created_by])
    splits = relationship(
        "ExpenseSplit", back_populates="expense", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Expense(id={self.id}, amount={self.amount}, description={self.description})>"


class ExpenseSplit(Base):
    """ExpenseSplit model for tracking who owes what for each expense."""

    __tablename__ = "expense_splits"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4, index=True)
    expense_id = Column(GUID(), ForeignKey("expenses.id"), nullable=False, index=True)
    user_id = Column(GUID(), ForeignKey("users.id"), nullable=False, index=True)

    # Split details
    amount_owed = Column(Numeric(10, 2), nullable=False)  # Amount this user owes
    is_settled = Column(Boolean, default=False, nullable=False)
    settled_at = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relationships
    expense = relationship("Expense", back_populates="splits")
    user = relationship("User")

    def __repr__(self):
        return f"<ExpenseSplit(expense_id={self.expense_id}, user_id={self.user_id}, amount_owed={self.amount_owed})>"
