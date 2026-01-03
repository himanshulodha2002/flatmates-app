"""
Todo management endpoints.
"""

import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.household import HouseholdMember
from app.models.todo import Todo, TodoStatus
from app.schemas.todo import (
    TodoCreate,
    TodoUpdate,
    TodoStatusUpdate,
    TodoResponse,
    TodoWithDetails,
)
from app.core.database import utc_now

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


def verify_todo_access(
    todo_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> Todo:
    """
    Verify user has access to the todo.

    Args:
        todo_id: ID of the todo
        current_user: Current authenticated user
        db: Database session

    Returns:
        Todo object if user has access

    Raises:
        HTTPException: If todo not found or user doesn't have access
    """
    todo = db.query(Todo).filter(Todo.id == todo_id).first()
    if not todo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found"
        )

    # Verify user is a member of the household
    verify_household_access(todo.household_id, current_user, db)

    return todo


@router.post("/", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
def create_todo(
    todo_data: TodoCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new todo.
    User must be a member of the household.
    """
    # Verify household access
    verify_household_access(todo_data.household_id, current_user, db)

    # Verify assigned user is a member if assigned_to_id is provided
    if todo_data.assigned_to_id:
        assigned_member = (
            db.query(HouseholdMember)
            .filter(
                HouseholdMember.household_id == todo_data.household_id,
                HouseholdMember.user_id == todo_data.assigned_to_id
            )
            .first()
        )
        if not assigned_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user is not a member of this household"
            )

    # Create todo
    todo = Todo(
        household_id=todo_data.household_id,
        title=todo_data.title,
        description=todo_data.description,
        priority=todo_data.priority,
        due_date=todo_data.due_date,
        assigned_to_id=todo_data.assigned_to_id,
        created_by=current_user.id,
        recurring_pattern=todo_data.recurring_pattern,
        recurring_until=todo_data.recurring_until,
    )
    db.add(todo)
    db.commit()
    db.refresh(todo)

    return todo


@router.get("/", response_model=List[TodoResponse])
def list_todos(
    household_id: uuid.UUID = Query(..., description="Household ID to filter todos"),
    status_filter: Optional[TodoStatus] = Query(None, alias="status", description="Filter by status"),
    assigned_to_me: Optional[bool] = Query(False, description="Show only todos assigned to me"),
    include_completed: bool = Query(True, description="Include completed todos"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List todos for a household with optional filters.
    """
    # Verify household access
    verify_household_access(household_id, current_user, db)

    # Build query
    query = db.query(Todo).filter(Todo.household_id == household_id)

    # Apply filters
    if status_filter:
        query = query.filter(Todo.status == status_filter)
    elif not include_completed:
        query = query.filter(Todo.status != TodoStatus.COMPLETED)

    if assigned_to_me:
        query = query.filter(
            or_(
                Todo.assigned_to_id == current_user.id,
                Todo.assigned_to_id.is_(None)
            )
        )

    # Order by priority (high first), then due_date (earliest first), then created_at
    todos = query.order_by(
        Todo.status.asc(),
        Todo.priority.desc(),
        Todo.due_date.asc().nullslast(),
        Todo.created_at.desc()
    ).all()

    return todos


@router.get("/{todo_id}", response_model=TodoWithDetails)
def get_todo(
    todo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get details of a specific todo with user information.
    """
    todo = verify_todo_access(todo_id, current_user, db)

    # Get creator details
    creator = db.query(User).filter(User.id == todo.created_by).first()

    # Get assigned user details if assigned
    assigned_to_name = None
    assigned_to_email = None
    if todo.assigned_to_id:
        assigned_user = db.query(User).filter(User.id == todo.assigned_to_id).first()
        if assigned_user:
            assigned_to_name = assigned_user.full_name
            assigned_to_email = assigned_user.email

    return TodoWithDetails(
        id=todo.id,
        household_id=todo.household_id,
        title=todo.title,
        description=todo.description,
        status=todo.status,
        priority=todo.priority,
        due_date=todo.due_date,
        assigned_to_id=todo.assigned_to_id,
        assigned_to_name=assigned_to_name,
        assigned_to_email=assigned_to_email,
        created_by=todo.created_by,
        created_by_name=creator.full_name,
        created_by_email=creator.email,
        recurring_pattern=todo.recurring_pattern,
        recurring_until=todo.recurring_until,
        parent_todo_id=todo.parent_todo_id,
        completed_at=todo.completed_at,
        created_at=todo.created_at,
        updated_at=todo.updated_at,
    )


@router.put("/{todo_id}", response_model=TodoResponse)
def update_todo(
    todo_id: uuid.UUID,
    todo_data: TodoUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a todo.
    User must be a member of the household.
    """
    todo = verify_todo_access(todo_id, current_user, db)

    # Verify assigned user is a member if assigned_to_id is being updated
    if todo_data.assigned_to_id is not None:
        assigned_member = (
            db.query(HouseholdMember)
            .filter(
                HouseholdMember.household_id == todo.household_id,
                HouseholdMember.user_id == todo_data.assigned_to_id
            )
            .first()
        )
        if not assigned_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user is not a member of this household"
            )

    # Update fields
    update_data = todo_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(todo, field, value)

    # Handle status change to completed
    if todo_data.status == TodoStatus.COMPLETED and todo.completed_at is None:
        todo.completed_at = utc_now()
    elif todo_data.status != TodoStatus.COMPLETED and todo.completed_at is not None:
        todo.completed_at = None

    todo.updated_at = utc_now()
    db.commit()
    db.refresh(todo)

    return todo


@router.patch("/{todo_id}/status", response_model=TodoResponse)
def update_todo_status(
    todo_id: uuid.UUID,
    status_data: TodoStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update only the status of a todo.
    """
    todo = verify_todo_access(todo_id, current_user, db)

    # Update status
    todo.status = status_data.status

    # Handle completed_at timestamp
    if status_data.status == TodoStatus.COMPLETED and todo.completed_at is None:
        todo.completed_at = utc_now()
    elif status_data.status != TodoStatus.COMPLETED and todo.completed_at is not None:
        todo.completed_at = None

    todo.updated_at = utc_now()
    db.commit()
    db.refresh(todo)

    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(
    todo_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a todo.
    User must be a member of the household.
    """
    todo = verify_todo_access(todo_id, current_user, db)

    db.delete(todo)
    db.commit()

    return None


@router.get("/household/{household_id}/stats")
def get_todo_stats(
    household_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get todo statistics for a household.
    """
    # Verify household access
    verify_household_access(household_id, current_user, db)

    # Get counts by status
    pending_count = db.query(Todo).filter(
        Todo.household_id == household_id,
        Todo.status == TodoStatus.PENDING
    ).count()

    in_progress_count = db.query(Todo).filter(
        Todo.household_id == household_id,
        Todo.status == TodoStatus.IN_PROGRESS
    ).count()

    completed_count = db.query(Todo).filter(
        Todo.household_id == household_id,
        Todo.status == TodoStatus.COMPLETED
    ).count()

    # Get overdue todos
    overdue_count = db.query(Todo).filter(
        and_(
            Todo.household_id == household_id,
            Todo.status != TodoStatus.COMPLETED,
            Todo.due_date < utc_now()
        )
    ).count()

    return {
        "pending": pending_count,
        "in_progress": in_progress_count,
        "completed": completed_count,
        "overdue": overdue_count,
        "total": pending_count + in_progress_count + completed_count,
    }
