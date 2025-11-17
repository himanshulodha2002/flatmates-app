"""
Expense management endpoints with AI integration.
"""

import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from decimal import Decimal

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.household import HouseholdMember
from app.models.expense import Expense
from app.models.todo import Todo
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseWithDetails,
    ExpenseStats,
    AICategorizeRequest,
    AICategorizeResponse,
    ReceiptOCRResponse,
    TaskSuggestionsResponse,
    TaskSuggestion,
)
from app.services.gemini_service import gemini_service

router = APIRouter()


def verify_household_access(
    household_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> HouseholdMember:
    """
    Verify user has access to the household.

    Args:
        household_id: ID of the household
        current_user: Current authenticated user
        db: Database session

    Returns:
        HouseholdMember object if user is a member

    Raises:
        HTTPException: If user is not a member
    """
    member = (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == current_user.id
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this household"
        )

    return member


def verify_expense_access(
    expense_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> Expense:
    """
    Verify user has access to the expense.

    Args:
        expense_id: ID of the expense
        current_user: Current authenticated user
        db: Database session

    Returns:
        Expense object if user has access

    Raises:
        HTTPException: If user doesn't have access or expense doesn't exist
    """
    expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found"
        )

    # Check if user is a member of the household
    verify_household_access(expense.household_id, current_user, db)

    return expense


@router.post("/", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new expense with optional AI categorization.
    """
    # Verify household access
    verify_household_access(expense_data.household_id, current_user, db)

    # Use AI categorization if requested and category not provided
    ai_result = None
    if expense_data.use_ai_categorization and not expense_data.category:
        ai_result = await gemini_service.categorize_expense(
            description=f"{expense_data.title} - {expense_data.description or ''}",
            amount=float(expense_data.amount),
            context=None
        )

    # Create expense
    expense = Expense(
        id=uuid.uuid4(),
        household_id=expense_data.household_id,
        title=expense_data.title,
        description=expense_data.description,
        amount=expense_data.amount,
        category=expense_data.category or (ai_result["category"] if ai_result else "Other"),
        subcategory=expense_data.subcategory or (ai_result.get("subcategory") if ai_result else None),
        tags=expense_data.tags or (ai_result.get("suggested_tags") if ai_result else None),
        ai_categorized=ai_result is not None,
        ai_confidence=Decimal(str(ai_result["confidence"])) if ai_result else None,
        ai_reasoning=ai_result.get("reasoning") if ai_result else None,
        expense_date=expense_data.expense_date,
        paid_by_id=expense_data.paid_by_id or current_user.id,
        created_by=current_user.id,
        split_type=expense_data.split_type,
        split_data=expense_data.split_data,
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    return expense


@router.get("/", response_model=List[ExpenseResponse])
def list_expenses(
    household_id: Optional[uuid.UUID] = Query(None, description="Filter by household ID"),
    category: Optional[str] = Query(None, description="Filter by category"),
    paid_by_id: Optional[uuid.UUID] = Query(None, description="Filter by who paid"),
    start_date: Optional[datetime] = Query(None, description="Filter by start date"),
    end_date: Optional[datetime] = Query(None, description="Filter by end date"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List expenses with optional filters.
    """
    # Get user's household if not specified
    if not household_id:
        member = db.query(HouseholdMember).filter(
            HouseholdMember.user_id == current_user.id
        ).first()
        if not member:
            return []
        household_id = member.household_id
    else:
        # Verify household access
        verify_household_access(household_id, current_user, db)

    # Build query
    query = db.query(Expense).filter(Expense.household_id == household_id)

    if category:
        query = query.filter(Expense.category == category)

    if paid_by_id:
        query = query.filter(Expense.paid_by_id == paid_by_id)

    if start_date:
        query = query.filter(Expense.expense_date >= start_date)

    if end_date:
        query = query.filter(Expense.expense_date <= end_date)

    # Order by expense date (most recent first)
    expenses = query.order_by(Expense.expense_date.desc()).all()

    return expenses


@router.get("/{expense_id}", response_model=ExpenseWithDetails)
def get_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific expense with user details.
    """
    expense = verify_expense_access(expense_id, current_user, db)

    # Get user details
    paid_by = db.query(User).filter(User.id == expense.paid_by_id).first() if expense.paid_by_id else None
    created_by = db.query(User).filter(User.id == expense.created_by).first()

    expense_dict = {
        "id": expense.id,
        "household_id": expense.household_id,
        "title": expense.title,
        "description": expense.description,
        "amount": expense.amount,
        "category": expense.category,
        "subcategory": expense.subcategory,
        "tags": expense.tags,
        "ai_categorized": expense.ai_categorized,
        "ai_confidence": expense.ai_confidence,
        "ai_reasoning": expense.ai_reasoning,
        "receipt_url": expense.receipt_url,
        "receipt_data": expense.receipt_data,
        "expense_date": expense.expense_date,
        "paid_by_id": expense.paid_by_id,
        "created_by": expense.created_by,
        "split_type": expense.split_type,
        "split_data": expense.split_data,
        "created_at": expense.created_at,
        "updated_at": expense.updated_at,
        "paid_by_name": paid_by.full_name if paid_by else None,
        "paid_by_email": paid_by.email if paid_by else None,
        "created_by_name": created_by.full_name if created_by else None,
        "created_by_email": created_by.email if created_by else None,
    }

    return ExpenseWithDetails(**expense_dict)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: uuid.UUID,
    expense_data: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an expense.
    """
    expense = verify_expense_access(expense_id, current_user, db)

    # Update fields
    update_data = expense_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(expense, field, value)

    db.commit()
    db.refresh(expense)

    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete an expense.
    """
    expense = verify_expense_access(expense_id, current_user, db)

    db.delete(expense)
    db.commit()

    return None


@router.get("/household/{household_id}/stats", response_model=ExpenseStats)
def get_expense_stats(
    household_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get expense statistics for a household.
    """
    verify_household_access(household_id, current_user, db)

    # Total expenses
    total_expenses = db.query(func.count(Expense.id)).filter(
        Expense.household_id == household_id
    ).scalar()

    # Total amount
    total_amount = db.query(func.sum(Expense.amount)).filter(
        Expense.household_id == household_id
    ).scalar() or Decimal("0.00")

    # Category breakdown
    category_results = db.query(
        Expense.category,
        func.sum(Expense.amount)
    ).filter(
        Expense.household_id == household_id
    ).group_by(Expense.category).all()

    category_breakdown = {cat: amount for cat, amount in category_results}

    # Monthly total (current month)
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    next_month = month_start + timedelta(days=32)
    month_end = datetime(next_month.year, next_month.month, 1)

    monthly_total = db.query(func.sum(Expense.amount)).filter(
        and_(
            Expense.household_id == household_id,
            Expense.expense_date >= month_start,
            Expense.expense_date < month_end
        )
    ).scalar() or Decimal("0.00")

    return ExpenseStats(
        total_expenses=total_expenses,
        total_amount=total_amount,
        category_breakdown=category_breakdown,
        monthly_total=monthly_total,
    )


@router.post("/ai/categorize", response_model=AICategorizeResponse)
async def categorize_with_ai(
    request: AICategorizeRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Get AI categorization for an expense without creating it.
    """
    result = await gemini_service.categorize_expense(
        description=request.description,
        amount=float(request.amount),
        context=request.context
    )

    return AICategorizeResponse(**result)


@router.post("/ai/ocr", response_model=ReceiptOCRResponse)
async def extract_receipt_data(
    file: UploadFile = File(..., description="Receipt image"),
    current_user: User = Depends(get_current_user),
):
    """
    Extract expense data from a receipt image using OCR.
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )

    # Read file
    image_data = await file.read()

    # Perform OCR
    result = await gemini_service.extract_receipt_data(
        image_data=image_data,
        mime_type=file.content_type
    )

    return ReceiptOCRResponse(**result)


@router.post("/ai/suggest-tasks", response_model=TaskSuggestionsResponse)
async def suggest_tasks(
    household_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get AI-powered task suggestions based on household context.
    """
    verify_household_access(household_id, current_user, db)

    # Get household context
    member_count = db.query(func.count(HouseholdMember.id)).filter(
        HouseholdMember.household_id == household_id
    ).scalar()

    # Get recent tasks
    recent_tasks = db.query(Todo).filter(
        Todo.household_id == household_id
    ).order_by(Todo.created_at.desc()).limit(10).all()

    task_list = [
        {
            "title": task.title,
            "status": task.status.value,
            "priority": task.priority.value,
        }
        for task in recent_tasks
    ]

    # Get recent expenses
    recent_expenses = db.query(Expense).filter(
        Expense.household_id == household_id
    ).order_by(Expense.expense_date.desc()).limit(10).all()

    expense_list = [
        {
            "description": exp.title,
            "amount": float(exp.amount),
            "category": exp.category,
        }
        for exp in recent_expenses
    ]

    # Get AI suggestions
    suggestions_raw = await gemini_service.suggest_tasks(
        household_context={"member_count": member_count},
        existing_tasks=task_list,
        recent_expenses=expense_list
    )

    suggestions = [TaskSuggestion(**s) for s in suggestions_raw]

    return TaskSuggestionsResponse(
        suggestions=suggestions,
        count=len(suggestions)
    )
