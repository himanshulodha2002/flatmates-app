"""
Tests for todo models and API endpoints.
"""
import uuid
from datetime import datetime, timedelta
from app.models.user import User
from app.models.household import Household
from app.models.todo import TodoList, TodoItem, TodoPriority
from app.core.security import create_access_token


def test_create_household(db_session):
    """Test creating a household."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        google_id="test-google-id"
    )
    db_session.add(user)
    db_session.commit()
    
    household = Household(
        id=uuid.uuid4(),
        name="Test Household",
        owner_id=user.id
    )
    db_session.add(household)
    household.members.append(user)
    db_session.commit()
    
    assert household.id is not None
    assert household.name == "Test Household"
    assert household.owner_id == user.id
    assert len(household.members) == 1


def test_create_todo_list(db_session):
    """Test creating a todo list."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        google_id="test-google-id"
    )
    db_session.add(user)
    
    household = Household(
        id=uuid.uuid4(),
        name="Test Household",
        owner_id=user.id
    )
    db_session.add(household)
    household.members.append(user)
    db_session.commit()
    
    todo_list = TodoList(
        id=uuid.uuid4(),
        household_id=household.id,
        name="Shopping List",
        created_by=user.id
    )
    db_session.add(todo_list)
    db_session.commit()
    
    assert todo_list.id is not None
    assert todo_list.name == "Shopping List"
    assert todo_list.household_id == household.id


def test_create_todo_item(db_session):
    """Test creating a todo item."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        google_id="test-google-id"
    )
    db_session.add(user)
    
    household = Household(
        id=uuid.uuid4(),
        name="Test Household",
        owner_id=user.id
    )
    db_session.add(household)
    household.members.append(user)
    
    todo_list = TodoList(
        id=uuid.uuid4(),
        household_id=household.id,
        name="Shopping List",
        created_by=user.id
    )
    db_session.add(todo_list)
    db_session.commit()
    
    todo_item = TodoItem(
        id=uuid.uuid4(),
        list_id=todo_list.id,
        title="Buy milk",
        description="Get 2% milk",
        priority=TodoPriority.HIGH,
        assigned_user_id=user.id
    )
    db_session.add(todo_item)
    db_session.commit()
    
    assert todo_item.id is not None
    assert todo_item.title == "Buy milk"
    assert todo_item.priority == TodoPriority.HIGH
    assert not todo_item.is_completed


def test_create_todo_list_endpoint(client, db_session):
    """Test creating a todo list via API."""
    # Create user and household
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        google_id="test-google-id"
    )
    db_session.add(user)
    
    household = Household(
        id=uuid.uuid4(),
        name="Test Household",
        owner_id=user.id
    )
    db_session.add(household)
    household.members.append(user)
    db_session.commit()
    
    # Create access token
    token = create_access_token(data={"sub": str(user.id)})
    
    # Create todo list
    response = client.post(
        "/api/v1/todos/lists",
        json={"name": "My Todo List"},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "My Todo List"
    assert data["household_id"] == str(household.id)


def test_get_todo_lists_endpoint(client, db_session):
    """Test getting all todo lists via API."""
    # Create user and household
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        google_id="test-google-id"
    )
    db_session.add(user)
    
    household = Household(
        id=uuid.uuid4(),
        name="Test Household",
        owner_id=user.id
    )
    db_session.add(household)
    household.members.append(user)
    
    # Create todo lists
    todo_list1 = TodoList(
        id=uuid.uuid4(),
        household_id=household.id,
        name="List 1",
        created_by=user.id
    )
    todo_list2 = TodoList(
        id=uuid.uuid4(),
        household_id=household.id,
        name="List 2",
        created_by=user.id
    )
    db_session.add(todo_list1)
    db_session.add(todo_list2)
    db_session.commit()
    
    # Create access token
    token = create_access_token(data={"sub": str(user.id)})
    
    # Get todo lists
    response = client.get(
        "/api/v1/todos/lists",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2


def test_create_todo_item_endpoint(client, db_session):
    """Test creating a todo item via API."""
    # Create user and household
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        google_id="test-google-id"
    )
    db_session.add(user)
    
    household = Household(
        id=uuid.uuid4(),
        name="Test Household",
        owner_id=user.id
    )
    db_session.add(household)
    household.members.append(user)
    
    todo_list = TodoList(
        id=uuid.uuid4(),
        household_id=household.id,
        name="Shopping List",
        created_by=user.id
    )
    db_session.add(todo_list)
    db_session.commit()
    
    # Create access token
    token = create_access_token(data={"sub": str(user.id)})
    
    # Create todo item
    due_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
    response = client.post(
        f"/api/v1/todos/lists/{todo_list.id}/items",
        json={
            "title": "Buy milk",
            "description": "Get 2% milk",
            "priority": "high",
            "due_date": due_date,
            "assigned_user_id": str(user.id)
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Buy milk"
    assert data["priority"] == "high"
    assert not data["is_completed"]


def test_update_todo_item_endpoint(client, db_session):
    """Test updating a todo item via API."""
    # Create user and household
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        google_id="test-google-id"
    )
    db_session.add(user)
    
    household = Household(
        id=uuid.uuid4(),
        name="Test Household",
        owner_id=user.id
    )
    db_session.add(household)
    household.members.append(user)
    
    todo_list = TodoList(
        id=uuid.uuid4(),
        household_id=household.id,
        name="Shopping List",
        created_by=user.id
    )
    db_session.add(todo_list)
    
    todo_item = TodoItem(
        id=uuid.uuid4(),
        list_id=todo_list.id,
        title="Buy milk",
        assigned_user_id=user.id
    )
    db_session.add(todo_item)
    db_session.commit()
    
    # Create access token
    token = create_access_token(data={"sub": str(user.id)})
    
    # Update todo item to mark as completed
    response = client.patch(
        f"/api/v1/todos/items/{todo_item.id}",
        json={"is_completed": True},
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["is_completed"] is True
    assert data["completed_at"] is not None


def test_delete_todo_item_endpoint(client, db_session):
    """Test deleting a todo item via API."""
    # Create user and household
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        google_id="test-google-id"
    )
    db_session.add(user)
    
    household = Household(
        id=uuid.uuid4(),
        name="Test Household",
        owner_id=user.id
    )
    db_session.add(household)
    household.members.append(user)
    
    todo_list = TodoList(
        id=uuid.uuid4(),
        household_id=household.id,
        name="Shopping List",
        created_by=user.id
    )
    db_session.add(todo_list)
    
    todo_item = TodoItem(
        id=uuid.uuid4(),
        list_id=todo_list.id,
        title="Buy milk"
    )
    db_session.add(todo_item)
    db_session.commit()
    
    # Create access token
    token = create_access_token(data={"sub": str(user.id)})
    
    # Delete todo item (as creator)
    response = client.delete(
        f"/api/v1/todos/items/{todo_item.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 204


def test_user_without_household_cannot_access_todos(client, db_session):
    """Test that a user without a household cannot access todos."""
    # Create user without household
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        google_id="test-google-id"
    )
    db_session.add(user)
    db_session.commit()
    
    # Create access token
    token = create_access_token(data={"sub": str(user.id)})
    
    # Try to get todo lists
    response = client.get(
        "/api/v1/todos/lists",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 404
    assert "not a member of any household" in response.json()["detail"]
