"""
Shopping list management endpoints.
"""

import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from decimal import Decimal

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.household import HouseholdMember
from app.models.shopping import ShoppingList, ShoppingListItem, ItemCategory, ShoppingListStatus
from app.schemas.shopping import (
    ShoppingListCreate,
    ShoppingListUpdate,
    ShoppingListResponse,
    ShoppingListWithItems,
    ShoppingListItemCreate,
    ShoppingListItemUpdate,
    ShoppingListItemPurchaseUpdate,
    ShoppingListItemResponse,
    ShoppingListItemWithDetails,
    ItemCategoryCreate,
    ItemCategoryResponse,
    ShoppingListStats,
)

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


def verify_shopping_list_access(
    shopping_list_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> ShoppingList:
    """
    Verify user has access to the shopping list.

    Args:
        shopping_list_id: ID of the shopping list
        current_user: Current authenticated user
        db: Database session

    Returns:
        ShoppingList object if user has access

    Raises:
        HTTPException: If shopping list not found or user doesn't have access
    """
    shopping_list = db.query(ShoppingList).filter(ShoppingList.id == shopping_list_id).first()
    if not shopping_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )

    # Verify user is a member of the household
    verify_household_access(shopping_list.household_id, current_user, db)

    return shopping_list


# ============ Shopping List Endpoints ============

@router.post("/", response_model=ShoppingListResponse, status_code=status.HTTP_201_CREATED)
def create_shopping_list(
    list_data: ShoppingListCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new shopping list.
    User must be a member of the household.
    """
    # Verify household access
    verify_household_access(list_data.household_id, current_user, db)

    # Create shopping list
    shopping_list = ShoppingList(
        household_id=list_data.household_id,
        name=list_data.name,
        description=list_data.description,
        created_by=current_user.id,
    )
    db.add(shopping_list)
    db.commit()
    db.refresh(shopping_list)

    return shopping_list


@router.get("/", response_model=List[ShoppingListResponse])
def list_shopping_lists(
    household_id: uuid.UUID = Query(..., description="Household ID to filter shopping lists"),
    status_filter: Optional[ShoppingListStatus] = Query(None, alias="status", description="Filter by status"),
    include_archived: bool = Query(False, description="Include archived lists"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List shopping lists for a household with optional filters.
    """
    # Verify household access
    verify_household_access(household_id, current_user, db)

    # Build query
    query = db.query(ShoppingList).filter(ShoppingList.household_id == household_id)

    # Apply filters
    if status_filter:
        query = query.filter(ShoppingList.status == status_filter)
    elif not include_archived:
        query = query.filter(ShoppingList.status == ShoppingListStatus.ACTIVE)

    # Order by created_at desc (newest first)
    shopping_lists = query.order_by(ShoppingList.created_at.desc()).all()

    return shopping_lists


@router.get("/{list_id}", response_model=ShoppingListWithItems)
def get_shopping_list(
    list_id: uuid.UUID,
    category: Optional[str] = Query(None, description="Filter items by category"),
    is_purchased: Optional[bool] = Query(None, description="Filter by purchase status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get details of a specific shopping list with items.
    """
    shopping_list = verify_shopping_list_access(list_id, current_user, db)

    # Get creator details
    creator = db.query(User).filter(User.id == shopping_list.created_by).first()

    # Build item query
    items_query = db.query(ShoppingListItem).filter(ShoppingListItem.shopping_list_id == list_id)

    # Apply filters
    if category:
        items_query = items_query.filter(ShoppingListItem.category == category)
    if is_purchased is not None:
        items_query = items_query.filter(ShoppingListItem.is_purchased == is_purchased)

    # Order by position, then created_at
    items = items_query.order_by(
        ShoppingListItem.is_purchased.asc(),
        ShoppingListItem.position.asc(),
        ShoppingListItem.created_at.asc()
    ).all()

    # Build response with details
    items_with_details = []
    for item in items:
        item_creator = db.query(User).filter(User.id == item.created_by).first()
        assigned_user = None
        if item.assigned_to_id:
            assigned_user = db.query(User).filter(User.id == item.assigned_to_id).first()
        checked_off_user = None
        if item.checked_off_by:
            checked_off_user = db.query(User).filter(User.id == item.checked_off_by).first()

        item_details = ShoppingListItemWithDetails(
            id=item.id,
            shopping_list_id=item.shopping_list_id,
            name=item.name,
            quantity=item.quantity,
            unit=item.unit,
            category=item.category,
            is_purchased=item.is_purchased,
            assigned_to_id=item.assigned_to_id,
            assigned_to_name=assigned_user.full_name if assigned_user else None,
            assigned_to_email=assigned_user.email if assigned_user else None,
            price=item.price,
            notes=item.notes,
            is_recurring=item.is_recurring,
            recurring_pattern=item.recurring_pattern,
            recurring_until=item.recurring_until,
            last_recurring_date=item.last_recurring_date,
            checked_off_by=item.checked_off_by,
            checked_off_by_name=checked_off_user.full_name if checked_off_user else None,
            checked_off_at=item.checked_off_at,
            position=item.position,
            created_by=item.created_by,
            created_by_name=item_creator.full_name,
            created_by_email=item_creator.email,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
        items_with_details.append(item_details)

    return ShoppingListWithItems(
        id=shopping_list.id,
        household_id=shopping_list.household_id,
        name=shopping_list.name,
        description=shopping_list.description,
        status=shopping_list.status,
        created_by=shopping_list.created_by,
        created_by_name=creator.full_name,
        created_by_email=creator.email,
        created_at=shopping_list.created_at,
        updated_at=shopping_list.updated_at,
        items=items_with_details,
    )


@router.put("/{list_id}", response_model=ShoppingListResponse)
def update_shopping_list(
    list_id: uuid.UUID,
    list_data: ShoppingListUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a shopping list.
    """
    shopping_list = verify_shopping_list_access(list_id, current_user, db)

    # Update fields
    if list_data.name is not None:
        shopping_list.name = list_data.name
    if list_data.description is not None:
        shopping_list.description = list_data.description
    if list_data.status is not None:
        shopping_list.status = list_data.status

    shopping_list.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(shopping_list)

    return shopping_list


@router.delete("/{list_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_list(
    list_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a shopping list.
    """
    shopping_list = verify_shopping_list_access(list_id, current_user, db)

    db.delete(shopping_list)
    db.commit()

    return None


@router.get("/{list_id}/stats", response_model=ShoppingListStats)
def get_shopping_list_stats(
    list_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get statistics for a shopping list.
    """
    shopping_list = verify_shopping_list_access(list_id, current_user, db)

    # Get items
    items = db.query(ShoppingListItem).filter(ShoppingListItem.shopping_list_id == list_id).all()

    total_items = len(items)
    purchased_items = sum(1 for item in items if item.is_purchased)
    pending_items = total_items - purchased_items

    # Calculate total price
    total_price = sum(item.price for item in items if item.price) if items else None

    # Count by category
    categories = {}
    for item in items:
        cat = item.category or "Uncategorized"
        categories[cat] = categories.get(cat, 0) + 1

    return ShoppingListStats(
        total_items=total_items,
        purchased_items=purchased_items,
        pending_items=pending_items,
        total_price=total_price,
        categories=categories,
    )


# ============ Shopping List Item Endpoints ============

@router.post("/{list_id}/items", response_model=ShoppingListItemResponse, status_code=status.HTTP_201_CREATED)
def create_shopping_list_item(
    list_id: uuid.UUID,
    item_data: ShoppingListItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Add an item to a shopping list.
    """
    shopping_list = verify_shopping_list_access(list_id, current_user, db)

    # Verify assigned user is a member if assigned_to_id is provided
    if item_data.assigned_to_id:
        assigned_member = (
            db.query(HouseholdMember)
            .filter(
                HouseholdMember.household_id == shopping_list.household_id,
                HouseholdMember.user_id == item_data.assigned_to_id
            )
            .first()
        )
        if not assigned_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user is not a member of this household"
            )

    # Create item
    item = ShoppingListItem(
        shopping_list_id=list_id,
        name=item_data.name,
        quantity=item_data.quantity,
        unit=item_data.unit,
        category=item_data.category,
        assigned_to_id=item_data.assigned_to_id,
        price=item_data.price,
        notes=item_data.notes,
        is_recurring=item_data.is_recurring,
        recurring_pattern=item_data.recurring_pattern,
        recurring_until=item_data.recurring_until,
        position=item_data.position,
        created_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get("/{list_id}/items", response_model=List[ShoppingListItemResponse])
def list_shopping_list_items(
    list_id: uuid.UUID,
    category: Optional[str] = Query(None, description="Filter by category"),
    is_purchased: Optional[bool] = Query(None, description="Filter by purchase status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all items for a shopping list.
    """
    shopping_list = verify_shopping_list_access(list_id, current_user, db)

    # Build query
    query = db.query(ShoppingListItem).filter(ShoppingListItem.shopping_list_id == list_id)

    # Apply filters
    if category:
        query = query.filter(ShoppingListItem.category == category)
    if is_purchased is not None:
        query = query.filter(ShoppingListItem.is_purchased == is_purchased)

    # Order by position
    items = query.order_by(
        ShoppingListItem.is_purchased.asc(),
        ShoppingListItem.position.asc(),
        ShoppingListItem.created_at.asc()
    ).all()

    return items


@router.put("/{list_id}/items/{item_id}", response_model=ShoppingListItemResponse)
def update_shopping_list_item(
    list_id: uuid.UUID,
    item_id: uuid.UUID,
    item_data: ShoppingListItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a shopping list item.
    """
    shopping_list = verify_shopping_list_access(list_id, current_user, db)

    item = db.query(ShoppingListItem).filter(
        ShoppingListItem.id == item_id,
        ShoppingListItem.shopping_list_id == list_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    # Verify assigned user is a member if assigned_to_id is provided
    if item_data.assigned_to_id is not None:
        assigned_member = (
            db.query(HouseholdMember)
            .filter(
                HouseholdMember.household_id == shopping_list.household_id,
                HouseholdMember.user_id == item_data.assigned_to_id
            )
            .first()
        )
        if not assigned_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user is not a member of this household"
            )

    # Update fields
    if item_data.name is not None:
        item.name = item_data.name
    if item_data.quantity is not None:
        item.quantity = item_data.quantity
    if item_data.unit is not None:
        item.unit = item_data.unit
    if item_data.category is not None:
        item.category = item_data.category
    if item_data.is_purchased is not None:
        item.is_purchased = item_data.is_purchased
        if item_data.is_purchased:
            item.checked_off_by = current_user.id
            item.checked_off_at = datetime.utcnow()
        else:
            item.checked_off_by = None
            item.checked_off_at = None
    if item_data.assigned_to_id is not None:
        item.assigned_to_id = item_data.assigned_to_id
    if item_data.price is not None:
        item.price = item_data.price
    if item_data.notes is not None:
        item.notes = item_data.notes
    if item_data.is_recurring is not None:
        item.is_recurring = item_data.is_recurring
    if item_data.recurring_pattern is not None:
        item.recurring_pattern = item_data.recurring_pattern
    if item_data.recurring_until is not None:
        item.recurring_until = item_data.recurring_until
    if item_data.position is not None:
        item.position = item_data.position

    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)

    return item


@router.patch("/{list_id}/items/{item_id}/purchase", response_model=ShoppingListItemResponse)
def toggle_item_purchase_status(
    list_id: uuid.UUID,
    item_id: uuid.UUID,
    purchase_data: ShoppingListItemPurchaseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mark an item as purchased or unpurchased.
    This endpoint is optimized for real-time collaborative checkoffs.
    """
    shopping_list = verify_shopping_list_access(list_id, current_user, db)

    item = db.query(ShoppingListItem).filter(
        ShoppingListItem.id == item_id,
        ShoppingListItem.shopping_list_id == list_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    item.is_purchased = purchase_data.is_purchased
    if purchase_data.is_purchased:
        item.checked_off_by = current_user.id
        item.checked_off_at = datetime.utcnow()
    else:
        item.checked_off_by = None
        item.checked_off_at = None

    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{list_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_list_item(
    list_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a shopping list item.
    """
    shopping_list = verify_shopping_list_access(list_id, current_user, db)

    item = db.query(ShoppingListItem).filter(
        ShoppingListItem.id == item_id,
        ShoppingListItem.shopping_list_id == list_id
    ).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    db.delete(item)
    db.commit()

    return None


# ============ Item Category Endpoints ============

@router.get("/categories", response_model=List[ItemCategoryResponse])
def list_item_categories(
    household_id: Optional[uuid.UUID] = Query(None, description="Household ID for custom categories"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List all item categories (global + household-specific).
    """
    # Get global categories
    query = db.query(ItemCategory).filter(ItemCategory.household_id.is_(None))

    # Add household-specific categories if household_id provided
    if household_id:
        verify_household_access(household_id, current_user, db)
        household_query = db.query(ItemCategory).filter(ItemCategory.household_id == household_id)
        categories = query.all() + household_query.all()
    else:
        categories = query.all()

    return categories


@router.post("/categories", response_model=ItemCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_item_category(
    category_data: ItemCategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a custom item category for a household.
    """
    if category_data.household_id:
        verify_household_access(category_data.household_id, current_user, db)

    # Check if category already exists
    existing = db.query(ItemCategory).filter(
        ItemCategory.name == category_data.name,
        ItemCategory.household_id == category_data.household_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )

    category = ItemCategory(
        name=category_data.name,
        icon=category_data.icon,
        color=category_data.color,
        household_id=category_data.household_id,
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    return category
