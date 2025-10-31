"""
Shopping list API endpoints.
"""
from typing import List
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.api.deps import get_db, get_current_user, require_household_membership
from app.models.user import User
from app.models.shopping import ShoppingList, ShoppingItem
from app.schemas.shopping import (
    ShoppingListCreate,
    ShoppingListResponse,
    ShoppingListSummary,
    ShoppingItemCreate,
    ShoppingItemUpdate,
    ShoppingItemResponse,
)

router = APIRouter()


@router.post("/lists", response_model=ShoppingListResponse, status_code=status.HTTP_201_CREATED)
def create_shopping_list(
    shopping_list: ShoppingListCreate,
    household_id: UUID = Depends(require_household_membership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new shopping list for the household."""
    db_list = ShoppingList(
        household_id=household_id,
        name=shopping_list.name,
        created_by=current_user.id,
    )
    db.add(db_list)
    db.commit()
    db.refresh(db_list)
    return db_list


@router.get("/lists", response_model=List[ShoppingListSummary])
def list_shopping_lists(
    household_id: UUID = Depends(require_household_membership),
    db: Session = Depends(get_db),
):
    """List all shopping lists for the current household."""
    lists = db.query(ShoppingList).filter(
        ShoppingList.household_id == household_id
    ).all()
    
    # Add item counts to each list
    result = []
    for shopping_list in lists:
        items = db.query(ShoppingItem).filter(
            ShoppingItem.list_id == shopping_list.id
        ).all()
        
        list_dict = {
            "id": shopping_list.id,
            "household_id": shopping_list.household_id,
            "name": shopping_list.name,
            "created_by": shopping_list.created_by,
            "created_at": shopping_list.created_at,
            "item_count": len(items),
            "purchased_count": sum(1 for item in items if item.is_purchased),
        }
        result.append(ShoppingListSummary(**list_dict))
    
    return result


@router.get("/lists/{list_id}", response_model=ShoppingListResponse)
def get_shopping_list(
    list_id: UUID,
    household_id: UUID = Depends(require_household_membership),
    db: Session = Depends(get_db),
):
    """Get a specific shopping list with all its items."""
    shopping_list = db.query(ShoppingList).filter(
        ShoppingList.id == list_id,
        ShoppingList.household_id == household_id,
    ).first()
    
    if not shopping_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )
    
    return shopping_list


@router.post("/lists/{list_id}/items", response_model=ShoppingItemResponse, status_code=status.HTTP_201_CREATED)
def add_item_to_list(
    list_id: UUID,
    item: ShoppingItemCreate,
    household_id: UUID = Depends(require_household_membership),
    db: Session = Depends(get_db),
):
    """Add a new item to a shopping list."""
    # Verify the list exists and belongs to the household
    shopping_list = db.query(ShoppingList).filter(
        ShoppingList.id == list_id,
        ShoppingList.household_id == household_id,
    ).first()
    
    if not shopping_list:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping list not found"
        )
    
    db_item = ShoppingItem(
        list_id=list_id,
        name=item.name,
        quantity=item.quantity,
        category=item.category,
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item


@router.patch("/items/{item_id}", response_model=ShoppingItemResponse)
def update_shopping_item(
    item_id: UUID,
    item_update: ShoppingItemUpdate,
    household_id: UUID = Depends(require_household_membership),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a shopping item."""
    # Get the item and verify it belongs to a list in the household
    db_item = db.query(ShoppingItem).join(ShoppingList).filter(
        ShoppingItem.id == item_id,
        ShoppingList.household_id == household_id,
    ).first()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping item not found"
        )
    
    # Update fields
    update_data = item_update.model_dump(exclude_unset=True)
    
    # Handle purchased status change
    if "is_purchased" in update_data:
        if update_data["is_purchased"] and not db_item.is_purchased:
            # Mark as purchased
            db_item.purchased_by = current_user.id
            db_item.purchased_at = datetime.utcnow()
        elif not update_data["is_purchased"] and db_item.is_purchased:
            # Mark as unpurchased
            db_item.purchased_by = None
            db_item.purchased_at = None
    
    # Update other fields
    for field, value in update_data.items():
        if field != "is_purchased":
            setattr(db_item, field, value)
        else:
            db_item.is_purchased = value
    
    db.commit()
    db.refresh(db_item)
    return db_item


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shopping_item(
    item_id: UUID,
    household_id: UUID = Depends(require_household_membership),
    db: Session = Depends(get_db),
):
    """Delete a shopping item."""
    # Get the item and verify it belongs to a list in the household
    db_item = db.query(ShoppingItem).join(ShoppingList).filter(
        ShoppingItem.id == item_id,
        ShoppingList.household_id == household_id,
    ).first()
    
    if not db_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Shopping item not found"
        )
    
    db.delete(db_item)
    db.commit()
    return None
