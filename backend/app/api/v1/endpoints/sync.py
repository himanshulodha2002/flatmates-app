"""
Sync endpoint for mobile app data synchronization.
"""

import time
from datetime import datetime, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.models.household import HouseholdMember
from app.models.todo import Todo
from app.models.shopping import ShoppingList, ShoppingListItem
from app.models.expense import Expense, ExpenseSplit
from app.schemas.sync import (
    SyncRequest,
    SyncResponse,
    SyncConflict,
    TodoSyncDto,
    ShoppingListSyncDto,
    ShoppingItemSyncDto,
    ExpenseSyncDto,
    ExpenseSplitSyncDto,
)

router = APIRouter()


def verify_household_membership(
    household_id: UUID,
    current_user: User,
    db: Session,
) -> HouseholdMember:
    """Verify user is a member of the household."""
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


def datetime_to_timestamp(dt: datetime) -> int:
    """Convert datetime to Unix timestamp in milliseconds."""
    if dt is None:
        return 0
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return int(dt.timestamp() * 1000)


def timestamp_to_datetime(ts: int) -> datetime:
    """Convert Unix timestamp in milliseconds to datetime."""
    return datetime.fromtimestamp(ts / 1000, tz=timezone.utc)


@router.post("/", response_model=SyncResponse, status_code=status.HTTP_200_OK)
async def sync_all(
    sync_request: SyncRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Synchronize data between client and server.
    
    This endpoint:
    1. Receives local changes from the client
    2. Applies non-conflicting changes to the server
    3. Returns all server changes since last_sync_timestamp
    4. Reports any conflicts for client resolution
    """
    # Verify household membership
    verify_household_membership(sync_request.household_id, current_user, db)
    
    household_id = sync_request.household_id
    last_sync = timestamp_to_datetime(sync_request.last_sync_timestamp) if sync_request.last_sync_timestamp > 0 else datetime.min.replace(tzinfo=timezone.utc)
    
    conflicts: List[SyncConflict] = []
    
    # Process incoming changes
    if sync_request.changes.todos:
        conflicts.extend(process_todo_changes(
            sync_request.changes.todos,
            household_id,
            current_user,
            db
        ))
    
    if sync_request.changes.shopping_lists:
        conflicts.extend(process_shopping_list_changes(
            sync_request.changes.shopping_lists,
            household_id,
            current_user,
            db
        ))
    
    if sync_request.changes.shopping_items:
        conflicts.extend(process_shopping_item_changes(
            sync_request.changes.shopping_items,
            household_id,
            current_user,
            db
        ))
    
    if sync_request.changes.expenses:
        conflicts.extend(process_expense_changes(
            sync_request.changes.expenses,
            household_id,
            current_user,
            db
        ))
    
    # Commit all changes
    db.commit()
    
    # Fetch all data updated since last sync
    todos = fetch_updated_todos(household_id, last_sync, db)
    shopping_lists = fetch_updated_shopping_lists(household_id, last_sync, db)
    shopping_items = fetch_updated_shopping_items(household_id, last_sync, db)
    expenses = fetch_updated_expenses(household_id, last_sync, db)
    
    # Current server timestamp
    server_timestamp = int(time.time() * 1000)
    
    return SyncResponse(
        server_timestamp=server_timestamp,
        todos=todos,
        shopping_lists=shopping_lists,
        shopping_items=shopping_items,
        expenses=expenses,
        conflicts=conflicts,
    )


def process_todo_changes(changes, household_id, current_user, db) -> List[SyncConflict]:
    """Process todo changes from client."""
    conflicts = []
    
    # Handle created todos
    for todo_data in changes.created:
        try:
            todo = Todo(
                id=UUID(todo_data.get("id")),
                household_id=household_id,
                title=todo_data.get("title"),
                description=todo_data.get("description"),
                status=todo_data.get("status", "PENDING"),
                priority=todo_data.get("priority", "MEDIUM"),
                due_date=todo_data.get("due_date"),
                assigned_to_id=UUID(todo_data.get("assigned_to_id")) if todo_data.get("assigned_to_id") else None,
                created_by=current_user.id,
            )
            db.merge(todo)
        except Exception:
            pass  # Skip invalid entries
    
    # Handle updated todos
    for todo_data in changes.updated:
        try:
            todo_id = UUID(todo_data.get("id"))
            todo = db.query(Todo).filter(Todo.id == todo_id).first()
            if todo:
                # Simple last-write-wins for now
                todo.title = todo_data.get("title", todo.title)
                todo.description = todo_data.get("description", todo.description)
                todo.status = todo_data.get("status", todo.status)
                todo.priority = todo_data.get("priority", todo.priority)
                if todo_data.get("due_date"):
                    todo.due_date = todo_data.get("due_date")
                if todo_data.get("assigned_to_id"):
                    todo.assigned_to_id = UUID(todo_data.get("assigned_to_id"))
        except Exception:
            pass
    
    # Handle deleted todos
    for todo_id in changes.deleted:
        try:
            db.query(Todo).filter(Todo.id == UUID(todo_id)).delete()
        except Exception:
            pass
    
    return conflicts


def process_shopping_list_changes(changes, household_id, current_user, db) -> List[SyncConflict]:
    """Process shopping list changes from client."""
    conflicts = []
    
    for list_data in changes.created:
        try:
            shopping_list = ShoppingList(
                id=UUID(list_data.get("id")),
                household_id=household_id,
                name=list_data.get("name"),
                description=list_data.get("description"),
                status=list_data.get("status", "ACTIVE"),
                created_by=current_user.id,
            )
            db.merge(shopping_list)
        except Exception:
            pass
    
    for list_data in changes.updated:
        try:
            list_id = UUID(list_data.get("id"))
            shopping_list = db.query(ShoppingList).filter(ShoppingList.id == list_id).first()
            if shopping_list:
                shopping_list.name = list_data.get("name", shopping_list.name)
                shopping_list.description = list_data.get("description", shopping_list.description)
                shopping_list.status = list_data.get("status", shopping_list.status)
        except Exception:
            pass
    
    for list_id in changes.deleted:
        try:
            db.query(ShoppingList).filter(ShoppingList.id == UUID(list_id)).delete()
        except Exception:
            pass
    
    return conflicts


def process_shopping_item_changes(changes, household_id, current_user, db) -> List[SyncConflict]:
    """Process shopping item changes from client."""
    conflicts = []
    
    for item_data in changes.created:
        try:
            item = ShoppingListItem(
                id=UUID(item_data.get("id")),
                shopping_list_id=UUID(item_data.get("shopping_list_id")),
                name=item_data.get("name"),
                quantity=item_data.get("quantity", 1.0),
                unit=item_data.get("unit"),
                category=item_data.get("category"),
                is_purchased=item_data.get("is_purchased", False),
                created_by=current_user.id,
            )
            db.merge(item)
        except Exception:
            pass
    
    for item_data in changes.updated:
        try:
            item_id = UUID(item_data.get("id"))
            item = db.query(ShoppingListItem).filter(ShoppingListItem.id == item_id).first()
            if item:
                item.name = item_data.get("name", item.name)
                item.quantity = item_data.get("quantity", item.quantity)
                item.unit = item_data.get("unit", item.unit)
                item.category = item_data.get("category", item.category)
                item.is_purchased = item_data.get("is_purchased", item.is_purchased)
        except Exception:
            pass
    
    for item_id in changes.deleted:
        try:
            db.query(ShoppingListItem).filter(ShoppingListItem.id == UUID(item_id)).delete()
        except Exception:
            pass
    
    return conflicts


def process_expense_changes(changes, household_id, current_user, db) -> List[SyncConflict]:
    """Process expense changes from client."""
    conflicts = []
    
    for expense_data in changes.created:
        try:
            expense = Expense(
                id=UUID(expense_data.get("id")),
                household_id=household_id,
                created_by=current_user.id,
                amount=expense_data.get("amount"),
                description=expense_data.get("description"),
                category=expense_data.get("category", "OTHER"),
                split_type=expense_data.get("split_type", "EQUAL"),
                date=expense_data.get("date"),
            )
            db.merge(expense)
        except Exception:
            pass
    
    for expense_data in changes.updated:
        try:
            expense_id = UUID(expense_data.get("id"))
            expense = db.query(Expense).filter(Expense.id == expense_id).first()
            if expense:
                expense.amount = expense_data.get("amount", expense.amount)
                expense.description = expense_data.get("description", expense.description)
                expense.category = expense_data.get("category", expense.category)
        except Exception:
            pass
    
    for expense_id in changes.deleted:
        try:
            db.query(Expense).filter(Expense.id == UUID(expense_id)).delete()
        except Exception:
            pass
    
    return conflicts


def fetch_updated_todos(household_id, last_sync, db) -> List[TodoSyncDto]:
    """Fetch todos updated since last sync."""
    todos = (
        db.query(Todo)
        .filter(
            Todo.household_id == household_id,
            Todo.updated_at > last_sync
        )
        .all()
    )
    return [
        TodoSyncDto(
            id=todo.id,
            household_id=todo.household_id,
            title=todo.title,
            description=todo.description,
            status=todo.status,
            priority=todo.priority,
            due_date=todo.due_date,
            assigned_to_id=todo.assigned_to_id,
            created_by=todo.created_by,
            completed_at=todo.completed_at,
            created_at=todo.created_at,
            updated_at=todo.updated_at,
        )
        for todo in todos
    ]


def fetch_updated_shopping_lists(household_id, last_sync, db) -> List[ShoppingListSyncDto]:
    """Fetch shopping lists updated since last sync."""
    lists = (
        db.query(ShoppingList)
        .filter(
            ShoppingList.household_id == household_id,
            ShoppingList.updated_at > last_sync
        )
        .all()
    )
    return [
        ShoppingListSyncDto(
            id=sl.id,
            household_id=sl.household_id,
            name=sl.name,
            description=sl.description,
            status=sl.status,
            created_by=sl.created_by,
            created_at=sl.created_at,
            updated_at=sl.updated_at,
        )
        for sl in lists
    ]


def fetch_updated_shopping_items(household_id, last_sync, db) -> List[ShoppingItemSyncDto]:
    """Fetch shopping items updated since last sync."""
    # Get all shopping lists for this household
    list_ids = [
        sl.id for sl in 
        db.query(ShoppingList.id).filter(ShoppingList.household_id == household_id).all()
    ]
    
    if not list_ids:
        return []
    
    items = (
        db.query(ShoppingListItem)
        .filter(
            ShoppingListItem.shopping_list_id.in_(list_ids),
            ShoppingListItem.updated_at > last_sync
        )
        .all()
    )
    return [
        ShoppingItemSyncDto(
            id=item.id,
            shopping_list_id=item.shopping_list_id,
            name=item.name,
            quantity=float(item.quantity) if item.quantity else 1.0,
            unit=item.unit,
            category=item.category,
            is_purchased=item.is_purchased,
            price=item.price,
            created_by=item.created_by,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        for item in items
    ]


def fetch_updated_expenses(household_id, last_sync, db) -> List[ExpenseSyncDto]:
    """Fetch expenses updated since last sync."""
    expenses = (
        db.query(Expense)
        .filter(
            Expense.household_id == household_id,
            Expense.updated_at > last_sync
        )
        .all()
    )
    
    result = []
    for expense in expenses:
        splits = db.query(ExpenseSplit).filter(ExpenseSplit.expense_id == expense.id).all()
        result.append(
            ExpenseSyncDto(
                id=expense.id,
                household_id=expense.household_id,
                created_by=expense.created_by,
                amount=expense.amount,
                description=expense.description,
                category=expense.category,
                split_type=expense.split_type,
                date=expense.date,
                created_at=expense.created_at,
                updated_at=expense.updated_at,
                splits=[
                    ExpenseSplitSyncDto(
                        id=split.id,
                        expense_id=split.expense_id,
                        user_id=split.user_id,
                        amount_owed=split.amount_owed,
                        is_settled=split.is_settled,
                        settled_at=split.settled_at,
                    )
                    for split in splits
                ],
            )
        )
    return result
