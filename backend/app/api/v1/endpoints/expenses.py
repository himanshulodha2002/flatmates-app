"""
Expense management endpoints.
"""

import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, extract

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.household import Household, HouseholdMember
from app.models.expense import Expense, ExpenseSplit, ExpenseCategory, SplitType
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
    ExpenseWithSplits,
    ExpenseSplitResponse,
    SettleExpenseRequest,
    SettlementResponse,
    ExpenseSummary,
    UserBalance,
    PersonalExpenseAnalytics,
    MonthlyExpenseStats,
)

router = APIRouter()


def verify_household_membership(
    household_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> HouseholdMember:
    """
    Verify user is a member of the household.

    Args:
        household_id: ID of the household
        current_user: Current authenticated user
        db: Database session

    Returns:
        HouseholdMember object

    Raises:
        HTTPException: If user is not a member
    """
    member = (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == current_user.id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this household",
        )

    return member


def calculate_equal_splits(amount: Decimal, user_ids: List[uuid.UUID]) -> dict[uuid.UUID, Decimal]:
    """Calculate equal splits for an expense."""
    if not user_ids:
        raise ValueError("User IDs list cannot be empty")

    split_amount = amount / len(user_ids)
    # Round to 2 decimal places
    split_amount = Decimal(str(round(float(split_amount), 2)))

    return {user_id: split_amount for user_id in user_ids}


@router.post("/", response_model=ExpenseWithSplits, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_data: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new expense.

    - For personal expenses (is_personal=True), no splits are created
    - For equal splits, splits are automatically calculated among all household members
    - For custom/percentage splits, splits must be provided and must sum to total amount
    """
    # Verify user is a member of the household
    verify_household_membership(expense_data.household_id, current_user, db)

    # Create expense
    expense = Expense(
        household_id=expense_data.household_id,
        created_by=current_user.id,
        amount=expense_data.amount,
        description=expense_data.description,
        category=expense_data.category,
        payment_method=expense_data.payment_method,
        date=expense_data.date or datetime.utcnow(),
        split_type=expense_data.split_type,
        is_personal=expense_data.is_personal,
    )

    db.add(expense)
    db.flush()  # Get the expense ID

    # Create splits based on split type
    if not expense_data.is_personal:
        if expense_data.split_type == SplitType.EQUAL:
            # Get all household members
            members = (
                db.query(HouseholdMember)
                .filter(HouseholdMember.household_id == expense_data.household_id)
                .all()
            )
            user_ids = [member.user_id for member in members]

            # Calculate equal splits
            splits_dict = calculate_equal_splits(expense_data.amount, user_ids)

            # Create split records
            for user_id, amount_owed in splits_dict.items():
                split = ExpenseSplit(
                    expense_id=expense.id,
                    user_id=user_id,
                    amount_owed=amount_owed,
                    is_settled=(user_id == current_user.id),  # Creator is auto-settled
                    settled_at=datetime.utcnow() if user_id == current_user.id else None,
                )
                db.add(split)

        elif expense_data.split_type in [SplitType.CUSTOM, SplitType.PERCENTAGE]:
            if not expense_data.splits:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Custom splits are required for {expense_data.split_type} split type",
                )

            # Verify splits sum to total amount
            total_splits = sum(split.amount_owed for split in expense_data.splits)
            if abs(float(total_splits) - float(expense_data.amount)) > 0.01:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Splits must sum to total amount. Got {total_splits}, expected {expense_data.amount}",
                )

            # Create custom split records
            for split_data in expense_data.splits:
                # Verify user is a household member
                verify_household_membership(expense_data.household_id, User(id=split_data.user_id), db)

                split = ExpenseSplit(
                    expense_id=expense.id,
                    user_id=split_data.user_id,
                    amount_owed=split_data.amount_owed,
                    is_settled=(split_data.user_id == current_user.id),
                    settled_at=datetime.utcnow() if split_data.user_id == current_user.id else None,
                )
                db.add(split)

    db.commit()
    db.refresh(expense)

    # Fetch with splits and user details
    return get_expense_with_details(expense.id, db)


@router.get("/", response_model=List[ExpenseResponse])
def list_expenses(
    household_id: Optional[uuid.UUID] = Query(None, description="Filter by household"),
    category: Optional[ExpenseCategory] = Query(None, description="Filter by category"),
    is_personal: Optional[bool] = Query(None, description="Filter personal expenses"),
    start_date: Optional[datetime] = Query(None, description="Filter expenses from date"),
    end_date: Optional[datetime] = Query(None, description="Filter expenses until date"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List expenses with optional filters.

    - If household_id is provided, only expenses for that household are returned
    - If is_personal=True, only personal expenses are returned
    - If is_personal=False, only shared expenses are returned
    """
    query = db.query(Expense).join(
        HouseholdMember,
        and_(
            HouseholdMember.household_id == Expense.household_id,
            HouseholdMember.user_id == current_user.id,
        ),
    )

    # Apply filters
    if household_id:
        verify_household_membership(household_id, current_user, db)
        query = query.filter(Expense.household_id == household_id)

    if category:
        query = query.filter(Expense.category == category)

    if is_personal is not None:
        query = query.filter(Expense.is_personal == is_personal)

    if start_date:
        query = query.filter(Expense.date >= start_date)

    if end_date:
        query = query.filter(Expense.date <= end_date)

    # Order by date descending
    query = query.order_by(Expense.date.desc())

    expenses = query.offset(skip).limit(limit).all()

    # Enrich with creator details
    result = []
    for expense in expenses:
        expense_dict = {
            "id": expense.id,
            "household_id": expense.household_id,
            "created_by": expense.created_by,
            "amount": expense.amount,
            "description": expense.description,
            "category": expense.category,
            "payment_method": expense.payment_method,
            "date": expense.date,
            "split_type": expense.split_type,
            "is_personal": expense.is_personal,
            "created_at": expense.created_at,
            "updated_at": expense.updated_at,
            "creator_name": expense.creator.full_name,
            "creator_email": expense.creator.email,
        }
        result.append(ExpenseResponse(**expense_dict))

    return result


@router.get("/{expense_id}", response_model=ExpenseWithSplits)
def get_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get expense details with splits."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    # Verify user is a member of the household
    verify_household_membership(expense.household_id, current_user, db)

    return get_expense_with_details(expense_id, db)


def get_expense_with_details(expense_id: uuid.UUID, db: Session) -> ExpenseWithSplits:
    """Helper to get expense with all details."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()

    # Get splits with user details
    splits = db.query(ExpenseSplit, User).join(
        User, ExpenseSplit.user_id == User.id
    ).filter(ExpenseSplit.expense_id == expense_id).all()

    split_responses = []
    for split, user in splits:
        split_responses.append(
            ExpenseSplitResponse(
                id=split.id,
                expense_id=split.expense_id,
                user_id=split.user_id,
                amount_owed=split.amount_owed,
                is_settled=split.is_settled,
                settled_at=split.settled_at,
                created_at=split.created_at,
                user_email=user.email,
                user_name=user.full_name,
            )
        )

    return ExpenseWithSplits(
        id=expense.id,
        household_id=expense.household_id,
        created_by=expense.created_by,
        amount=expense.amount,
        description=expense.description,
        category=expense.category,
        payment_method=expense.payment_method,
        date=expense.date,
        split_type=expense.split_type,
        is_personal=expense.is_personal,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
        creator_name=expense.creator.full_name,
        creator_email=expense.creator.email,
        splits=split_responses,
    )


@router.patch("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: uuid.UUID,
    expense_update: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update an expense (only creator can update)."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    # Verify user is the creator
    if expense.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator can update this expense",
        )

    # Update fields
    if expense_update.amount is not None:
        expense.amount = expense_update.amount
    if expense_update.description is not None:
        expense.description = expense_update.description
    if expense_update.category is not None:
        expense.category = expense_update.category
    if expense_update.payment_method is not None:
        expense.payment_method = expense_update.payment_method
    if expense_update.date is not None:
        expense.date = expense_update.date

    expense.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(expense)

    return ExpenseResponse(
        id=expense.id,
        household_id=expense.household_id,
        created_by=expense.created_by,
        amount=expense.amount,
        description=expense.description,
        category=expense.category,
        payment_method=expense.payment_method,
        date=expense.date,
        split_type=expense.split_type,
        is_personal=expense.is_personal,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
        creator_name=expense.creator.full_name,
        creator_email=expense.creator.email,
    )


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete an expense (only creator can delete)."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    # Verify user is the creator
    if expense.created_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator can delete this expense",
        )

    db.delete(expense)
    db.commit()

    return None


@router.post("/{expense_id}/settle", response_model=SettlementResponse)
def settle_expense(
    expense_id: uuid.UUID,
    settle_request: SettleExpenseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Settle expense splits."""
    expense = db.query(Expense).filter(Expense.id == expense_id).first()

    if not expense:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Expense not found",
        )

    # Verify user is a member of the household
    verify_household_membership(expense.household_id, current_user, db)

    # Get splits to settle
    splits = (
        db.query(ExpenseSplit)
        .filter(
            ExpenseSplit.id.in_(settle_request.split_ids),
            ExpenseSplit.expense_id == expense_id,
        )
        .all()
    )

    if len(splits) != len(settle_request.split_ids):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Some split IDs were not found",
        )

    # Settle the splits
    settled_ids = []
    for split in splits:
        if not split.is_settled:
            split.is_settled = True
            split.settled_at = datetime.utcnow()
            settled_ids.append(split.id)

    db.commit()

    return SettlementResponse(
        settled_count=len(settled_ids),
        split_ids=settled_ids,
        message=f"Successfully settled {len(settled_ids)} split(s)",
    )


@router.get("/households/{household_id}/summary", response_model=ExpenseSummary)
def get_household_summary(
    household_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get expense summary for a household."""
    # Verify user is a member
    verify_household_membership(household_id, current_user, db)

    # Get all expenses for household (excluding personal)
    expenses = (
        db.query(Expense)
        .filter(
            Expense.household_id == household_id,
            Expense.is_personal == False,
        )
        .all()
    )

    total_expenses = sum(expense.amount for expense in expenses)
    expense_count = len(expenses)

    # Get all splits for these expenses
    expense_ids = [expense.id for expense in expenses]
    splits = (
        db.query(ExpenseSplit)
        .filter(ExpenseSplit.expense_id.in_(expense_ids))
        .all()
    )

    total_settled = sum(split.amount_owed for split in splits if split.is_settled)
    total_pending = sum(split.amount_owed for split in splits if not split.is_settled)

    # Calculate user balances
    members = db.query(HouseholdMember, User).join(
        User, HouseholdMember.user_id == User.id
    ).filter(HouseholdMember.household_id == household_id).all()

    user_balances = []
    for member, user in members:
        # Total paid by user (expenses they created)
        total_paid = sum(
            expense.amount
            for expense in expenses
            if expense.created_by == user.id
        )

        # Total owed by user
        total_owed = sum(
            split.amount_owed
            for split in splits
            if split.user_id == user.id
        )

        balance = total_paid - total_owed

        user_balances.append(
            UserBalance(
                user_id=user.id,
                user_name=user.full_name,
                user_email=user.email,
                total_paid=Decimal(str(total_paid)),
                total_owed=Decimal(str(total_owed)),
                balance=Decimal(str(balance)),
            )
        )

    return ExpenseSummary(
        household_id=household_id,
        total_expenses=Decimal(str(total_expenses)),
        total_settled=Decimal(str(total_settled)),
        total_pending=Decimal(str(total_pending)),
        expense_count=expense_count,
        user_balances=user_balances,
    )


@router.get("/users/{user_id}/analytics", response_model=PersonalExpenseAnalytics)
def get_personal_analytics(
    user_id: uuid.UUID,
    household_id: Optional[uuid.UUID] = Query(None, description="Filter by household"),
    months: int = Query(1, ge=1, le=12, description="Number of months to analyze"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get personal expense analytics for a user.

    - Only the user themselves can view their analytics
    - Returns monthly breakdown and category analysis
    """
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view your own analytics",
        )

    period_end = datetime.utcnow()
    period_start = period_end - timedelta(days=30 * months)

    # Build query
    query = db.query(Expense).join(
        HouseholdMember,
        and_(
            HouseholdMember.household_id == Expense.household_id,
            HouseholdMember.user_id == current_user.id,
        ),
    ).filter(
        Expense.date >= period_start,
        Expense.date <= period_end,
    )

    if household_id:
        verify_household_membership(household_id, current_user, db)
        query = query.filter(Expense.household_id == household_id)

    expenses = query.all()

    # Calculate totals
    total_paid_for_others = sum(
        expense.amount for expense in expenses
        if expense.created_by == current_user.id and not expense.is_personal
    )

    total_spent = sum(
        expense.amount for expense in expenses
        if expense.created_by == current_user.id
    )

    # Get user's splits
    expense_ids = [expense.id for expense in expenses]
    user_splits = (
        db.query(ExpenseSplit)
        .filter(
            ExpenseSplit.expense_id.in_(expense_ids),
            ExpenseSplit.user_id == current_user.id,
        )
        .all()
    )

    total_owed_by_user = sum(split.amount_owed for split in user_splits)
    net_balance = Decimal(str(total_paid_for_others - total_owed_by_user))

    # Category breakdown
    category_totals: dict[ExpenseCategory, Decimal] = {}
    for expense in expenses:
        if expense.created_by == current_user.id or any(
            split.user_id == current_user.id for split in expense.splits
        ):
            if expense.category not in category_totals:
                category_totals[expense.category] = Decimal("0")
            category_totals[expense.category] += expense.amount

    # Monthly stats
    monthly_stats = []
    for month_offset in range(months):
        month_start = period_start + timedelta(days=30 * month_offset)
        month_end = month_start + timedelta(days=30)

        month_expenses = [
            e for e in expenses
            if month_start <= e.date < month_end
        ]

        if month_expenses:
            month_total = sum(e.amount for e in month_expenses)
            month_categories: dict[ExpenseCategory, Decimal] = {}

            for expense in month_expenses:
                if expense.category not in month_categories:
                    month_categories[expense.category] = Decimal("0")
                month_categories[expense.category] += expense.amount

            monthly_stats.append(
                MonthlyExpenseStats(
                    year=month_start.year,
                    month=month_start.month,
                    total_amount=Decimal(str(month_total)),
                    expense_count=len(month_expenses),
                    category_breakdown=month_categories,
                    average_expense=Decimal(str(month_total / len(month_expenses))),
                )
            )

    return PersonalExpenseAnalytics(
        user_id=current_user.id,
        household_id=household_id,
        period_start=period_start,
        period_end=period_end,
        total_spent=Decimal(str(total_spent)),
        total_paid_for_others=Decimal(str(total_paid_for_others)),
        total_owed_by_user=Decimal(str(total_owed_by_user)),
        net_balance=net_balance,
        expense_count=len(expenses),
        category_breakdown=category_totals,
        monthly_stats=monthly_stats,
    )
