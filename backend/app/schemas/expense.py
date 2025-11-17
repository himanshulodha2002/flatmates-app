"""
Pydantic schemas for expense management.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field
from decimal import Decimal


# Expense schemas
class ExpenseCreate(BaseModel):
    """Schema for creating an expense."""

    household_id: UUID = Field(..., description="Household ID")
    title: str = Field(..., min_length=1, max_length=200, description="Expense title")
    description: Optional[str] = Field(None, max_length=2000, description="Expense description")
    amount: Decimal = Field(..., gt=0, description="Expense amount")
    category: Optional[str] = Field(None, max_length=100, description="Expense category (AI will suggest if not provided)")
    subcategory: Optional[str] = Field(None, max_length=100, description="Expense subcategory")
    tags: Optional[List[str]] = Field(None, description="Tags for filtering")
    expense_date: datetime = Field(..., description="Date of expense")
    paid_by_id: Optional[UUID] = Field(None, description="User ID who paid")
    split_type: Optional[str] = Field(None, description="Split type: equal, percentage, custom")
    split_data: Optional[Dict[str, Any]] = Field(None, description="Split details")
    use_ai_categorization: bool = Field(True, description="Whether to use AI for categorization")


class ExpenseUpdate(BaseModel):
    """Schema for updating an expense."""

    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Expense title")
    description: Optional[str] = Field(None, max_length=2000, description="Expense description")
    amount: Optional[Decimal] = Field(None, gt=0, description="Expense amount")
    category: Optional[str] = Field(None, max_length=100, description="Expense category")
    subcategory: Optional[str] = Field(None, max_length=100, description="Expense subcategory")
    tags: Optional[List[str]] = Field(None, description="Tags for filtering")
    expense_date: Optional[datetime] = Field(None, description="Date of expense")
    paid_by_id: Optional[UUID] = Field(None, description="User ID who paid")
    split_type: Optional[str] = Field(None, description="Split type: equal, percentage, custom")
    split_data: Optional[Dict[str, Any]] = Field(None, description="Split details")


class ExpenseResponse(BaseModel):
    """Response schema for expense operations."""

    id: UUID
    household_id: UUID
    title: str
    description: Optional[str] = None
    amount: Decimal
    category: str
    subcategory: Optional[str] = None
    tags: Optional[List[str]] = None
    ai_categorized: bool = False
    ai_confidence: Optional[Decimal] = None
    ai_reasoning: Optional[str] = None
    receipt_url: Optional[str] = None
    receipt_data: Optional[Dict[str, Any]] = None
    expense_date: datetime
    paid_by_id: Optional[UUID] = None
    created_by: UUID
    split_type: Optional[str] = None
    split_data: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ExpenseWithDetails(ExpenseResponse):
    """Expense response with user details."""

    paid_by_name: Optional[str] = None
    paid_by_email: Optional[str] = None
    created_by_name: Optional[str] = None
    created_by_email: Optional[str] = None


class ExpenseStats(BaseModel):
    """Statistics for expenses."""

    total_expenses: int
    total_amount: Decimal
    category_breakdown: Dict[str, Decimal]
    monthly_total: Decimal
    user_balances: Optional[Dict[str, Decimal]] = None


class AICategorizeRequest(BaseModel):
    """Request schema for AI categorization."""

    description: str = Field(..., min_length=1, max_length=500, description="Expense description")
    amount: Decimal = Field(..., gt=0, description="Expense amount")
    context: Optional[str] = Field(None, max_length=500, description="Additional context")


class AICategorizeResponse(BaseModel):
    """Response schema for AI categorization."""

    category: str
    subcategory: Optional[str] = None
    confidence: float
    reasoning: str
    suggested_tags: List[str]


class ReceiptOCRResponse(BaseModel):
    """Response schema for receipt OCR."""

    success: bool
    merchant: Optional[str] = None
    date: Optional[str] = None
    total: Optional[Decimal] = None
    currency: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = None
    tax: Optional[Decimal] = None
    payment_method: Optional[str] = None
    confidence: Optional[float] = None
    notes: Optional[str] = None
    error: Optional[str] = None


class TaskSuggestion(BaseModel):
    """Schema for AI task suggestions."""

    title: str
    description: str
    priority: str  # low, medium, high
    category: str
    reasoning: str


class TaskSuggestionsResponse(BaseModel):
    """Response schema for task suggestions."""

    suggestions: List[TaskSuggestion]
    count: int
