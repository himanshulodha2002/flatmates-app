"""
Inventory management endpoints for tracking groceries and food items.
"""

import uuid
from datetime import datetime, date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.household import HouseholdMember
from app.models.inventory import InventoryItem, InventoryCategory, InventoryLocation
from app.schemas.inventory import (
    InventoryItemCreate,
    InventoryItemUpdate,
    InventoryItemConsume,
    InventoryItemResponse,
    InventoryItemWithDetails,
    InventoryFilterParams,
    InventoryStats,
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


def verify_inventory_item_access(
    item_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> InventoryItem:
    """
    Verify user has access to the inventory item.

    Args:
        item_id: ID of the inventory item
        current_user: Current authenticated user
        db: Database session

    Returns:
        InventoryItem object if user has access

    Raises:
        HTTPException: If item not found or user doesn't have access
    """
    item = db.query(InventoryItem).filter(InventoryItem.id == item_id).first()
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Inventory item not found"
        )

    # Verify user is a member of the household
    verify_household_access(item.household_id, current_user, db)

    return item


def calculate_item_details(item: InventoryItem) -> dict:
    """Calculate additional details for an inventory item."""
    today = date.today()
    is_expiring_soon = False
    is_low_stock = False
    days_until_expiry = None

    if item.expiry_date:
        days_until_expiry = (item.expiry_date - today).days
        is_expiring_soon = 0 <= days_until_expiry <= 7

    if item.low_stock_threshold is not None:
        is_low_stock = item.quantity <= item.low_stock_threshold

    return {
        "is_expiring_soon": is_expiring_soon,
        "is_low_stock": is_low_stock,
        "days_until_expiry": days_until_expiry,
    }


# ============ Inventory Item Endpoints ============

@router.post("/", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(
    item_data: InventoryItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new inventory item.
    User must be a member of the household.
    """
    # Verify household access
    verify_household_access(item_data.household_id, current_user, db)

    # Create inventory item
    item = InventoryItem(
        household_id=item_data.household_id,
        name=item_data.name,
        quantity=item_data.quantity,
        unit=item_data.unit,
        category=item_data.category,
        location=item_data.location,
        expiry_date=item_data.expiry_date,
        purchase_date=item_data.purchase_date,
        low_stock_threshold=item_data.low_stock_threshold,
        notes=item_data.notes,
        added_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@router.get("/", response_model=List[InventoryItemWithDetails])
def list_inventory_items(
    household_id: uuid.UUID = Query(..., description="Household ID to filter inventory items"),
    category: Optional[InventoryCategory] = Query(None, description="Filter by category"),
    location: Optional[InventoryLocation] = Query(None, description="Filter by location"),
    expiring_soon: Optional[bool] = Query(None, description="Filter items expiring within 7 days"),
    low_stock: Optional[bool] = Query(None, description="Filter items below low stock threshold"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    List inventory items for a household with optional filters.
    """
    # Verify household access
    verify_household_access(household_id, current_user, db)

    # Build query
    query = (
        db.query(
            InventoryItem,
            User.full_name.label("added_by_name"),
            User.email.label("added_by_email"),
        )
        .join(User, InventoryItem.added_by == User.id)
        .filter(InventoryItem.household_id == household_id)
    )

    # Apply filters
    if category:
        query = query.filter(InventoryItem.category == category)

    if location:
        query = query.filter(InventoryItem.location == location)

    if expiring_soon is not None:
        today = date.today()
        soon = today + timedelta(days=7)
        if expiring_soon:
            query = query.filter(
                InventoryItem.expiry_date.isnot(None),
                InventoryItem.expiry_date >= today,
                InventoryItem.expiry_date <= soon
            )

    # Execute query
    results = query.order_by(InventoryItem.created_at.desc()).all()

    # Build response with additional details
    items_with_details = []
    for item, added_by_name, added_by_email in results:
        details = calculate_item_details(item)

        # Apply low stock filter if needed
        if low_stock is not None and details["is_low_stock"] != low_stock:
            continue

        item_dict = {
            "id": item.id,
            "household_id": item.household_id,
            "name": item.name,
            "quantity": item.quantity,
            "unit": item.unit,
            "category": item.category,
            "location": item.location,
            "expiry_date": item.expiry_date,
            "purchase_date": item.purchase_date,
            "low_stock_threshold": item.low_stock_threshold,
            "notes": item.notes,
            "added_by": item.added_by,
            "added_by_name": added_by_name,
            "added_by_email": added_by_email,
            "created_at": item.created_at,
            "updated_at": item.updated_at,
            **details,
        }
        items_with_details.append(InventoryItemWithDetails(**item_dict))

    return items_with_details


@router.get("/stats", response_model=InventoryStats)
def get_inventory_stats(
    household_id: uuid.UUID = Query(..., description="Household ID"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get inventory statistics for a household.
    """
    # Verify household access
    verify_household_access(household_id, current_user, db)

    # Get all items
    items = db.query(InventoryItem).filter(InventoryItem.household_id == household_id).all()

    today = date.today()
    soon = today + timedelta(days=7)

    total_items = len(items)
    expiring_soon_count = 0
    low_stock_count = 0
    expired_count = 0
    category_counts = {}
    location_counts = {}

    for item in items:
        # Category counts
        category_str = item.category.value if item.category else "other"
        category_counts[category_str] = category_counts.get(category_str, 0) + 1

        # Location counts
        location_str = item.location.value if item.location else "other"
        location_counts[location_str] = location_counts.get(location_str, 0) + 1

        # Expiring soon
        if item.expiry_date:
            if item.expiry_date < today:
                expired_count += 1
            elif today <= item.expiry_date <= soon:
                expiring_soon_count += 1

        # Low stock
        if item.low_stock_threshold is not None and item.quantity <= item.low_stock_threshold:
            low_stock_count += 1

    return InventoryStats(
        total_items=total_items,
        expiring_soon_count=expiring_soon_count,
        low_stock_count=low_stock_count,
        expired_count=expired_count,
        category_counts=category_counts,
        location_counts=location_counts,
    )


@router.get("/{item_id}", response_model=InventoryItemWithDetails)
def get_inventory_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get a specific inventory item by ID.
    """
    # Verify access
    item = verify_inventory_item_access(item_id, current_user, db)

    # Get user details
    user = db.query(User).filter(User.id == item.added_by).first()

    # Calculate additional details
    details = calculate_item_details(item)

    item_dict = {
        "id": item.id,
        "household_id": item.household_id,
        "name": item.name,
        "quantity": item.quantity,
        "unit": item.unit,
        "category": item.category,
        "location": item.location,
        "expiry_date": item.expiry_date,
        "purchase_date": item.purchase_date,
        "low_stock_threshold": item.low_stock_threshold,
        "notes": item.notes,
        "added_by": item.added_by,
        "added_by_name": user.full_name if user else "Unknown",
        "added_by_email": user.email if user else "unknown@example.com",
        "created_at": item.created_at,
        "updated_at": item.updated_at,
        **details,
    }

    return InventoryItemWithDetails(**item_dict)


@router.patch("/{item_id}", response_model=InventoryItemResponse)
def update_inventory_item(
    item_id: uuid.UUID,
    item_update: InventoryItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update an inventory item.
    """
    # Verify access
    item = verify_inventory_item_access(item_id, current_user, db)

    # Update fields
    update_data = item_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(item, field, value)

    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)

    return item


@router.post("/{item_id}/consume", response_model=InventoryItemResponse)
def consume_inventory_item(
    item_id: uuid.UUID,
    consume_data: InventoryItemConsume,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Consume/reduce quantity of an inventory item.
    If quantity reaches 0 or below, the item is deleted.
    """
    # Verify access
    item = verify_inventory_item_access(item_id, current_user, db)

    # Reduce quantity
    new_quantity = item.quantity - consume_data.quantity

    if new_quantity <= 0:
        # Delete item if quantity is 0 or negative
        db.delete(item)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="Item consumed completely and removed from inventory"
        )

    item.quantity = new_quantity
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)

    return item


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_inventory_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete an inventory item.
    """
    # Verify access
    item = verify_inventory_item_access(item_id, current_user, db)

    db.delete(item)
    db.commit()

    return None
