"""
Tests for sync endpoints.
"""
import uuid
import time

import pytest
from app.models.todo import Todo, TodoStatus, TodoPriority
from app.models.shopping import ShoppingList, ShoppingListItem, ShoppingListStatus
from app.models.expense import Expense, ExpenseSplit, ExpenseCategory, SplitType
from decimal import Decimal
from datetime import datetime, timezone, timedelta


class TestSyncEndpoint:
    """Tests for the POST /api/v1/sync/ endpoint."""

    def test_sync_empty_request(self, client, household, user1, auth1):
        """Sync with no changes should return current server data."""
        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {},
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert "server_timestamp" in data
        assert isinstance(data["todos"], list)
        assert isinstance(data["shopping_lists"], list)
        assert isinstance(data["shopping_items"], list)
        assert isinstance(data["expenses"], list)
        assert isinstance(data["conflicts"], list)

    def test_sync_non_member(self, client, household, auth3):
        """Non-members should be rejected."""
        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {},
            },
            headers=auth3,
        )
        assert response.status_code == 403

    def test_sync_no_auth(self, client, household):
        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {},
            },
        )
        assert response.status_code in (401, 403)


class TestSyncFetchData:
    """Tests for fetching data updated since last sync."""

    def test_fetch_todos_since_sync(self, client, household, user1, auth1, db_session):
        """Todos created after last_sync should be returned."""
        todo = Todo(
            household_id=household.id,
            title="Sync todo",
            status=TodoStatus.PENDING,
            priority=TodoPriority.MEDIUM,
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()

        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {},
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["todos"]) >= 1
        titles = [t["title"] for t in data["todos"]]
        assert "Sync todo" in titles

    def test_fetch_shopping_lists_since_sync(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id,
            name="Sync shopping list",
            created_by=user1.id,
        )
        db_session.add(sl)
        db_session.commit()

        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {},
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["shopping_lists"]) >= 1

    def test_fetch_shopping_items_since_sync(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id,
            name="Sync items list",
            created_by=user1.id,
        )
        db_session.add(sl)
        db_session.flush()

        item = ShoppingListItem(
            shopping_list_id=sl.id,
            name="Sync item",
            created_by=user1.id,
        )
        db_session.add(item)
        db_session.commit()

        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {},
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["shopping_items"]) >= 1

    def test_fetch_expenses_since_sync(self, client, household, user1, auth1, db_session):
        expense = Expense(
            household_id=household.id,
            created_by=user1.id,
            amount=Decimal("25.00"),
            description="Sync expense",
            category=ExpenseCategory.GROCERIES,
            split_type=SplitType.EQUAL,
        )
        db_session.add(expense)
        db_session.commit()

        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {},
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["expenses"]) >= 1

    def test_recent_sync_returns_no_old_data(self, client, household, user1, auth1, db_session):
        """If last_sync_timestamp is recent, old data should not be returned."""
        todo = Todo(
            household_id=household.id,
            title="Old todo",
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()

        # Use a timestamp far in the future
        future_ts = int((time.time() + 86400) * 1000)
        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": future_ts,
                "household_id": str(household.id),
                "changes": {},
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["todos"]) == 0


class TestSyncCreateChanges:
    """Tests for pushing create changes via sync."""

    def test_create_todo_via_sync(self, client, household, user1, auth1):
        todo_id = str(uuid.uuid4())
        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {
                    "todos": {
                        "created": [
                            {
                                "id": todo_id,
                                "title": "Synced todo",
                                "status": "PENDING",
                                "priority": "HIGH",
                            }
                        ],
                        "updated": [],
                        "deleted": [],
                    }
                },
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        # The created todo should appear in the response
        titles = [t["title"] for t in data["todos"]]
        assert "Synced todo" in titles

    def test_create_shopping_list_via_sync(self, client, household, user1, auth1):
        list_id = str(uuid.uuid4())
        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {
                    "shopping_lists": {
                        "created": [
                            {
                                "id": list_id,
                                "name": "Synced list",
                                "status": "ACTIVE",
                            }
                        ],
                        "updated": [],
                        "deleted": [],
                    }
                },
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        names = [sl["name"] for sl in data["shopping_lists"]]
        assert "Synced list" in names

    def test_create_expense_via_sync(self, client, household, user1, auth1):
        expense_id = str(uuid.uuid4())
        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {
                    "expenses": {
                        "created": [
                            {
                                "id": expense_id,
                                "amount": 42.50,
                                "description": "Synced expense",
                                "category": "GROCERIES",
                                "split_type": "EQUAL",
                            }
                        ],
                        "updated": [],
                        "deleted": [],
                    }
                },
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        descriptions = [e["description"] for e in data["expenses"]]
        assert "Synced expense" in descriptions


class TestSyncUpdateChanges:
    """Tests for pushing update changes via sync."""

    def test_update_todo_via_sync(self, client, household, user1, auth1, db_session):
        todo = Todo(
            household_id=household.id,
            title="Before update",
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {
                    "todos": {
                        "created": [],
                        "updated": [
                            {
                                "id": str(todo.id),
                                "title": "After update",
                                "status": "COMPLETED",
                            }
                        ],
                        "deleted": [],
                    }
                },
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        updated = [t for t in data["todos"] if t["id"] == str(todo.id)]
        assert len(updated) == 1
        assert updated[0]["title"] == "After update"
        assert updated[0]["status"] == "completed"


class TestSyncDeleteChanges:
    """Tests for pushing delete changes via sync."""

    def test_delete_todo_via_sync(self, client, household, user1, auth1, db_session):
        todo = Todo(
            household_id=household.id,
            title="To be deleted",
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {
                    "todos": {
                        "created": [],
                        "updated": [],
                        "deleted": [str(todo.id)],
                    }
                },
            },
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        # Deleted todo should not appear
        ids = [t["id"] for t in data["todos"]]
        assert str(todo.id) not in ids

    def test_delete_shopping_list_via_sync(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id,
            name="Delete via sync",
            created_by=user1.id,
        )
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)

        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {
                    "shopping_lists": {
                        "created": [],
                        "updated": [],
                        "deleted": [str(sl.id)],
                    }
                },
            },
            headers=auth1,
        )
        assert response.status_code == 200


class TestSyncServerTimestamp:
    """Test that server_timestamp is returned and valid."""

    def test_server_timestamp_is_current(self, client, household, auth1):
        before = int(time.time() * 1000)
        response = client.post(
            "/api/v1/sync/",
            json={
                "last_sync_timestamp": 0,
                "household_id": str(household.id),
                "changes": {},
            },
            headers=auth1,
        )
        after = int(time.time() * 1000)

        data = response.json()
        ts = data["server_timestamp"]
        assert before <= ts <= after + 1000  # 1s tolerance
