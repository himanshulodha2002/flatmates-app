"""
Tests for shopping API endpoints.
"""
import uuid
from datetime import datetime

from app.models.user import User
from app.models.household import Household, HouseholdMember
from app.models.shopping import ShoppingList, ShoppingItem
from app.core.security import create_access_token


def test_create_shopping_list(client, db_session):
    """Test creating a shopping list."""
    # Setup user, household, and membership
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(name="Test Flat", created_by=user.id)
    db_session.add(household)
    db_session.commit()
    
    member = HouseholdMember(household_id=household.id, user_id=user.id)
    db_session.add(member)
    db_session.commit()
    
    # Create access token
    token = create_access_token(data={"sub": str(user.id)})
    
    # Create shopping list
    response = client.post(
        "/api/v1/shopping/lists",
        json={"name": "Weekly Groceries"},
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Weekly Groceries"
    assert data["household_id"] == str(household.id)
    assert data["created_by"] == str(user.id)


def test_create_shopping_list_no_household(client, db_session):
    """Test creating a shopping list without being in a household."""
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    token = create_access_token(data={"sub": str(user.id)})
    
    response = client.post(
        "/api/v1/shopping/lists",
        json={"name": "Weekly Groceries"},
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 403
    assert "household" in response.json()["detail"].lower()


def test_list_shopping_lists(client, db_session):
    """Test listing shopping lists."""
    # Setup
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(name="Test Flat", created_by=user.id)
    db_session.add(household)
    db_session.commit()
    
    member = HouseholdMember(household_id=household.id, user_id=user.id)
    db_session.add(member)
    db_session.commit()
    
    # Create shopping lists
    list1 = ShoppingList(household_id=household.id, name="Groceries", created_by=user.id)
    list2 = ShoppingList(household_id=household.id, name="Hardware", created_by=user.id)
    db_session.add_all([list1, list2])
    db_session.commit()
    
    token = create_access_token(data={"sub": str(user.id)})
    
    response = client.get(
        "/api/v1/shopping/lists",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    assert any(item["name"] == "Groceries" for item in data)
    assert any(item["name"] == "Hardware" for item in data)


def test_get_shopping_list(client, db_session):
    """Test getting a specific shopping list."""
    # Setup
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(name="Test Flat", created_by=user.id)
    db_session.add(household)
    db_session.commit()
    
    member = HouseholdMember(household_id=household.id, user_id=user.id)
    db_session.add(member)
    db_session.commit()
    
    shopping_list = ShoppingList(household_id=household.id, name="Groceries", created_by=user.id)
    db_session.add(shopping_list)
    db_session.commit()
    
    # Add items
    item1 = ShoppingItem(list_id=shopping_list.id, name="Milk", quantity="2 liters", category="Dairy")
    item2 = ShoppingItem(list_id=shopping_list.id, name="Bread", quantity="1 loaf", category="Bakery")
    db_session.add_all([item1, item2])
    db_session.commit()
    
    token = create_access_token(data={"sub": str(user.id)})
    
    response = client.get(
        f"/api/v1/shopping/lists/{shopping_list.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Groceries"
    assert len(data["items"]) == 2


def test_add_item_to_list(client, db_session):
    """Test adding an item to a shopping list."""
    # Setup
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(name="Test Flat", created_by=user.id)
    db_session.add(household)
    db_session.commit()
    
    member = HouseholdMember(household_id=household.id, user_id=user.id)
    db_session.add(member)
    db_session.commit()
    
    shopping_list = ShoppingList(household_id=household.id, name="Groceries", created_by=user.id)
    db_session.add(shopping_list)
    db_session.commit()
    
    token = create_access_token(data={"sub": str(user.id)})
    
    response = client.post(
        f"/api/v1/shopping/lists/{shopping_list.id}/items",
        json={
            "name": "Milk",
            "quantity": "2 liters",
            "category": "Dairy"
        },
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Milk"
    assert data["quantity"] == "2 liters"
    assert data["category"] == "Dairy"
    assert data["is_purchased"] is False


def test_update_shopping_item(client, db_session):
    """Test updating a shopping item."""
    # Setup
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(name="Test Flat", created_by=user.id)
    db_session.add(household)
    db_session.commit()
    
    member = HouseholdMember(household_id=household.id, user_id=user.id)
    db_session.add(member)
    db_session.commit()
    
    shopping_list = ShoppingList(household_id=household.id, name="Groceries", created_by=user.id)
    db_session.add(shopping_list)
    db_session.commit()
    
    item = ShoppingItem(list_id=shopping_list.id, name="Milk", quantity="1 liter")
    db_session.add(item)
    db_session.commit()
    
    token = create_access_token(data={"sub": str(user.id)})
    
    response = client.patch(
        f"/api/v1/shopping/items/{item.id}",
        json={"quantity": "2 liters"},
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["quantity"] == "2 liters"


def test_mark_item_purchased(client, db_session):
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
    
    household = Household(name="Test Flat", created_by=user.id)
    db_session.add(household)
    db_session.commit()
    
    member = HouseholdMember(household_id=household.id, user_id=user.id)
    db_session.add(member)
    db_session.commit()
    
    shopping_list = ShoppingList(household_id=household.id, name="Groceries", created_by=user.id)
    db_session.add(shopping_list)
    db_session.commit()
    
    item = ShoppingItem(list_id=shopping_list.id, name="Milk", is_purchased=False)
    db_session.add(item)
    db_session.commit()
    
    token = create_access_token(data={"sub": str(user.id)})
    
    response = client.patch(
        f"/api/v1/shopping/items/{item.id}",
        json={"is_purchased": True},
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_purchased"] is True
    assert data["purchased_by"] == str(user.id)
    assert data["purchased_at"] is not None


def test_delete_shopping_item(client, db_session):
    """Test deleting a shopping item."""
    # Setup
    user = User(
        email="test@example.com",
        full_name="Test User",
        google_id="google123",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(name="Test Flat", created_by=user.id)
    db_session.add(household)
    db_session.commit()
    
    member = HouseholdMember(household_id=household.id, user_id=user.id)
    db_session.add(member)
    db_session.commit()
    
    shopping_list = ShoppingList(household_id=household.id, name="Groceries", created_by=user.id)
    db_session.add(shopping_list)
    db_session.commit()
    
    item = ShoppingItem(list_id=shopping_list.id, name="Milk")
    db_session.add(item)
    db_session.commit()
    
    item_id = item.id
    token = create_access_token(data={"sub": str(user.id)})
    
    response = client.delete(
        f"/api/v1/shopping/items/{item_id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 204
    
    # Verify item is deleted
    deleted_item = db_session.query(ShoppingItem).filter(ShoppingItem.id == item_id).first()
    assert deleted_item is None


def test_cannot_access_other_household_list(client, db_session):
    """Test that users cannot access shopping lists from other households."""
    # Setup two users and households
    user1 = User(email="user1@example.com", full_name="User 1", google_id="google1", is_active=True)
    user2 = User(email="user2@example.com", full_name="User 2", google_id="google2", is_active=True)
    db_session.add_all([user1, user2])
    db_session.commit()
    
    household1 = Household(name="Flat 1", created_by=user1.id)
    household2 = Household(name="Flat 2", created_by=user2.id)
    db_session.add_all([household1, household2])
    db_session.commit()
    
    member1 = HouseholdMember(household_id=household1.id, user_id=user1.id)
    member2 = HouseholdMember(household_id=household2.id, user_id=user2.id)
    db_session.add_all([member1, member2])
    db_session.commit()
    
    shopping_list = ShoppingList(household_id=household1.id, name="List 1", created_by=user1.id)
    db_session.add(shopping_list)
    db_session.commit()
    
    # User 2 tries to access User 1's list
    token = create_access_token(data={"sub": str(user2.id)})
    
    response = client.get(
        f"/api/v1/shopping/lists/{shopping_list.id}",
        headers={"Authorization": f"Bearer {token}"},
    )
    
    assert response.status_code == 404
