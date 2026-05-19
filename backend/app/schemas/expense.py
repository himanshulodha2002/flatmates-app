"""
Pydantic schemas for expense management.
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

from app.models.expense import ExpenseCategory, SplitType, PaymentMethod


# Split schemas
class ExpenseSplitCreate(BaseModel):
    """Schema for creating an expense split."""

    user_id: UUID
    amount_owed: Decimal = Field(..., gt=0, description="Amount owed by this user")


class ExpenseSplitUpdate(BaseModel):
    """Schema for updating an expense split."""

    amount_owed: Optional[Decimal] = Field(None, gt=0, description="Amount owed by this user")
    is_settled: Optional[bool] = None


class ExpenseSplitResponse(BaseModel):
    """Schema for expense split response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    expense_id: UUID
    user_id: UUID
    amount_owed: Decimal
    is_settled: bool
    settled_at: Optional[datetime] = None
    created_at: datetime
    # User details (populated from join)
    user_email: Optional[str] = None
    user_name: Optional[str] = None


# Expense schemas
class ExpenseCreate(BaseModel):
    """Schema for creating an expense."""

    household_id: UUID
    amount: Decimal = Field(..., gt=0, description="Total expense amount")
    description: str = Field(..., min_length=1, max_length=500, description="Expense description")
    category: ExpenseCategory = ExpenseCategory.OTHER
    payment_method: PaymentMethod = PaymentMethod.CASH
    date: Optional[datetime] = None
    split_type: SplitType = SplitType.EQUAL
    is_personal: bool = False
    splits: Optional[List[ExpenseSplitCreate]] = Field(
        None, description="Custom splits (required for custom/percentage split types)"
    )


class ExpenseUpdate(BaseModel):
    """Schema for updating an expense."""

    amount: Optional[Decimal] = Field(None, gt=0, description="Total expense amount")
    description: Optional[str] = Field(None, min_length=1, max_length=500)
    category: Optional[ExpenseCategory] = None
    payment_method: Optional[PaymentMethod] = None
    date: Optional[datetime] = None


class ExpenseResponse(BaseModel):
    """Schema for expense response."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    created_by: UUID
    amount: Decimal
    description: str
    category: ExpenseCategory
    payment_method: PaymentMethod
    date: datetime
    split_type: SplitType
    is_personal: bool
    created_at: datetime
    updated_at: datetime
    # Creator details
    creator_name: Optional[str] = None
    creator_email: Optional[str] = None


class ExpenseWithSplits(BaseModel):
    """Schema for expense with splits details."""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    household_id: UUID
    created_by: UUID
    amount: Decimal
    description: str
    category: ExpenseCategory
    payment_method: PaymentMethod
    date: datetime
    split_type: SplitType
    is_personal: bool
    created_at: datetime
    updated_at: datetime
    # Creator details
    creator_name: Optional[str] = None
    creator_email: Optional[str] = None
    # Splits
    splits: List[ExpenseSplitResponse]


# Settlement schemas
class SettleExpenseRequest(BaseModel):
    """Schema for settling expense splits."""

    split_ids: List[UUID] = Field(..., min_length=1, description="IDs of splits to settle")


class SettlementResponse(BaseModel):
    """Schema for settlement operation response."""

    settled_count: int
    split_ids: List[UUID]
    message: str


# Summary/Analytics schemas
class UserBalance(BaseModel):
    """Schema for user balance in household."""

    user_id: UUID
    user_name: str
    user_email: str
    total_paid: Decimal  # Total amount this user paid for expenses
    total_owed: Decimal  # Total amount this user owes to others
    balance: Decimal  # Net balance (positive = owed to user, negative = user owes)


class ExpenseSummary(BaseModel):
    """Schema for household expense summary."""

    household_id: UUID
    total_expenses: Decimal
    total_settled: Decimal
    total_pending: Decimal
    expense_count: int
    user_balances: List[UserBalance]


class MonthlyExpenseStats(BaseModel):
    """Schema for monthly expense statistics."""

    year: int
    month: int
    total_amount: Decimal
    expense_count: int
    category_breakdown: dict[ExpenseCategory, Decimal]
    average_expense: Decimal


class PersonalExpenseAnalytics(BaseModel):
    """Schema for personal expense analytics."""

    user_id: UUID
    household_id: Optional[UUID] = None
    period_start: datetime
    period_end: datetime
    total_spent: Decimal
    total_paid_for_others: Decimal
    total_owed_by_user: Decimal
    net_balance: Decimal
    expense_count: int
    category_breakdown: dict[ExpenseCategory, Decimal]
    monthly_stats: List[MonthlyExpenseStats]


# AI Suggestion schemas
class TaskSuggestion(BaseModel):
    """Schema for a single task suggestion from AI."""

    title: str
    description: str
    priority: str = Field(..., pattern="^(low|medium|high)$")
    category: str = Field(..., pattern="^(chores|financial|shopping|maintenance|other)$")
    reasoning: str


class TaskSuggestionsResponse(BaseModel):
    """Schema for task suggestions response."""

    suggestions: List[TaskSuggestion]
