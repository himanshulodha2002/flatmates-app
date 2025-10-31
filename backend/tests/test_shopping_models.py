"""
Tests for shopping models.
"""
import uuid
from datetime import datetime
import pytest

from app.models.user import User
from app.models.household import Household, HouseholdMember
from app.models.shopping import ShoppingList, ShoppingItem


def test_create_household(db_session):
    """Test creating a household."""
    # Create a user
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    # Create household
    household = Household(
        name="Test Flat",
        created_by=user.id,
    )
    db_session.add(household)
    db_session.commit()
    
    assert household.id is not None
    assert household.name == "Test Flat"
    assert household.created_by == user.id


def test_create_household_member(db_session):
    """Test creating a household member."""
    # Create user and household
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(
        name="Test Flat",
        created_by=user.id,
    )
    db_session.add(household)
    db_session.commit()
    
    # Create membership
    member = HouseholdMember(
        household_id=household.id,
        user_id=user.id,
    )
    db_session.add(member)
    db_session.commit()
    
    assert member.id is not None
    assert member.household_id == household.id
    assert member.user_id == user.id


def test_create_shopping_list(db_session):
    """Test creating a shopping list."""
    # Setup user and household
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(
        name="Test Flat",
        created_by=user.id,
    )
    db_session.add(household)
    db_session.commit()
    
    # Create shopping list
    shopping_list = ShoppingList(
        household_id=household.id,
        name="Weekly Groceries",
        created_by=user.id,
    )
    db_session.add(shopping_list)
    db_session.commit()
    
    assert shopping_list.id is not None
    assert shopping_list.name == "Weekly Groceries"
    assert shopping_list.household_id == household.id


def test_create_shopping_item(db_session):
    """Test creating a shopping item."""
    # Setup user, household, and list
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(
        name="Test Flat",
        created_by=user.id,
    )
    db_session.add(household)
    db_session.commit()
    
    shopping_list = ShoppingList(
        household_id=household.id,
        name="Weekly Groceries",
        created_by=user.id,
    )
    db_session.add(shopping_list)
    db_session.commit()
    
    # Create shopping item
    item = ShoppingItem(
        list_id=shopping_list.id,
        name="Milk",
        quantity="2 liters",
        category="Dairy",
        is_purchased=False,
    )
    db_session.add(item)
    db_session.commit()
    
    assert item.id is not None
    assert item.name == "Milk"
    assert item.quantity == "2 liters"
    assert item.category == "Dairy"
    assert item.is_purchased is False
    assert item.purchased_by is None
    assert item.purchased_at is None


def test_mark_item_purchased(db_session):
    """Test marking an item as purchased."""
    # Setup
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(
        name="Test Flat",
        created_by=user.id,
    )
    db_session.add(household)
    db_session.commit()
    
    shopping_list = ShoppingList(
        household_id=household.id,
        name="Weekly Groceries",
        created_by=user.id,
    )
    db_session.add(shopping_list)
    db_session.commit()
    
    item = ShoppingItem(
        list_id=shopping_list.id,
        name="Milk",
        quantity="2 liters",
        category="Dairy",
        is_purchased=False,
    )
    db_session.add(item)
    db_session.commit()
    
    # Mark as purchased
    item.is_purchased = True
    item.purchased_by = user.id
    item.purchased_at = datetime.utcnow()
    db_session.commit()
    
    assert item.is_purchased is True
    assert item.purchased_by == user.id
    assert item.purchased_at is not None


def test_shopping_list_items_relationship(db_session):
    """Test the relationship between shopping lists and items."""
    # Setup
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(
        name="Test Flat",
        created_by=user.id,
    )
    db_session.add(household)
    db_session.commit()
    
    shopping_list = ShoppingList(
        household_id=household.id,
        name="Weekly Groceries",
        created_by=user.id,
    )
    db_session.add(shopping_list)
    db_session.commit()
    
    # Add multiple items
    item1 = ShoppingItem(list_id=shopping_list.id, name="Milk", quantity="2 liters")
    item2 = ShoppingItem(list_id=shopping_list.id, name="Bread", quantity="1 loaf")
    item3 = ShoppingItem(list_id=shopping_list.id, name="Eggs", quantity="1 dozen")
    
    db_session.add_all([item1, item2, item3])
    db_session.commit()
    
    # Refresh to load relationship
    db_session.refresh(shopping_list)
    
    assert len(shopping_list.items) == 3
    assert item1 in shopping_list.items
    assert item2 in shopping_list.items
    assert item3 in shopping_list.items


def test_delete_shopping_list_cascades(db_session):
    """Test that deleting a shopping list deletes its items."""
    # Setup
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(
        name="Test Flat",
        created_by=user.id,
    )
    db_session.add(household)
    db_session.commit()
    
    shopping_list = ShoppingList(
        household_id=household.id,
        name="Weekly Groceries",
        created_by=user.id,
    )
    db_session.add(shopping_list)
    db_session.commit()
    
    # Add items
    item1 = ShoppingItem(list_id=shopping_list.id, name="Milk")
    item2 = ShoppingItem(list_id=shopping_list.id, name="Bread")
    db_session.add_all([item1, item2])
    db_session.commit()
    
    list_id = shopping_list.id
    item1_id = item1.id
    item2_id = item2.id
    
    # Delete list
    db_session.delete(shopping_list)
    db_session.commit()
    
    # Verify items are also deleted
    assert db_session.query(ShoppingList).filter(ShoppingList.id == list_id).first() is None
    assert db_session.query(ShoppingItem).filter(ShoppingItem.id == item1_id).first() is None
    assert db_session.query(ShoppingItem).filter(ShoppingItem.id == item2_id).first() is None
