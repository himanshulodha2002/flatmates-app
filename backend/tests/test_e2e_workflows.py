"""
End-to-end workflow tests.

These tests exercise complete user workflows across multiple API endpoints,
verifying that the full request lifecycle works correctly from household
creation through feature usage and cleanup.
"""
import uuid

import pytest


# ──── Helpers ────


def create_household(client, auth, name="Test Apartment"):
    """Create a household and return the response JSON."""
    resp = client.post("/api/v1/households/", json={"name": name}, headers=auth)
    assert resp.status_code == 201, resp.text
    data = resp.json()
    assert data["name"] == name
    return data


def create_todo(client, auth, household_id, title, **kwargs):
    """Create a todo and return the response JSON."""
    body = {"household_id": household_id, "title": title, **kwargs}
    resp = client.post("/api/v1/todos/", json=body, headers=auth)
    assert resp.status_code == 201, resp.text
    return resp.json()


def create_expense(client, auth, household_id, amount, description, **kwargs):
    """Create an expense and return the response JSON."""
    body = {
        "household_id": household_id,
        "amount": str(amount),
        "description": description,
        **kwargs,
    }
    resp = client.post("/api/v1/expenses/", json=body, headers=auth)
    assert resp.status_code == 201, resp.text
    return resp.json()


def create_shopping_list(client, auth, household_id, name, **kwargs):
    """Create a shopping list and return the response JSON."""
    body = {"household_id": household_id, "name": name, **kwargs}
    resp = client.post("/api/v1/shopping-lists/", json=body, headers=auth)
    assert resp.status_code == 201, resp.text
    return resp.json()


def add_shopping_item(client, auth, list_id, name, **kwargs):
    """Add an item to a shopping list and return the response JSON."""
    body = {"name": name, **kwargs}
    resp = client.post(
        f"/api/v1/shopping-lists/{list_id}/items", json=body, headers=auth
    )
    assert resp.status_code == 201, resp.text
    return resp.json()


# ──── E2E: Household Lifecycle ────


class TestHouseholdLifecycle:
    """Full household lifecycle: create → invite → join → manage → leave."""

    def test_create_and_list_household(self, client, user1, auth1):
        """User creates a household and sees it in their list."""
        household = create_household(client, auth1, "Downtown Flat")

        resp = client.get("/api/v1/households/mine", headers=auth1)
        assert resp.status_code == 200
        households = resp.json()
        assert any(h["id"] == household["id"] for h in households)

    def test_invite_join_and_verify_members(
        self, client, user1, user2, user3, auth1, auth2, auth3, db_session
    ):
        """Owner invites a user, they join, and both are visible as members."""
        household = create_household(client, auth1)
        hid = household["id"]

        # Owner invites user3 by email
        resp = client.post(
            f"/api/v1/households/{hid}/invite",
            json={"email": "charlie@example.com"},
            headers=auth1,
        )
        assert resp.status_code == 200
        invite = resp.json()
        token = invite["token"]

        # User3 joins with invite token
        resp = client.post(
            "/api/v1/households/join",
            json={"token": token},
            headers=auth3,
        )
        assert resp.status_code == 200

        # Verify all members
        resp = client.get(f"/api/v1/households/{hid}", headers=auth1)
        assert resp.status_code == 200
        members = resp.json()["members"]
        member_emails = {m["email"] for m in members}
        assert "alice@example.com" in member_emails
        assert "charlie@example.com" in member_emails

    def test_member_leaves_household(self, client, user1, user2, auth1, auth2):
        """A member can leave a household they belong to."""
        household = create_household(client, auth1)
        hid = household["id"]

        # Invite and join user2
        resp = client.post(
            f"/api/v1/households/{hid}/invite",
            json={"email": "bob@example.com"},
            headers=auth1,
        )
        assert resp.status_code == 200
        token = resp.json()["token"]

        resp = client.post(
            "/api/v1/households/join",
            json={"token": token},
            headers=auth2,
        )
        assert resp.status_code == 200

        # User2 leaves
        resp = client.post(f"/api/v1/households/{hid}/leave", headers=auth2)
        assert resp.status_code == 204

        # Verify user2 is no longer a member
        resp = client.get(f"/api/v1/households/{hid}", headers=auth1)
        assert resp.status_code == 200
        member_emails = {m["email"] for m in resp.json()["members"]}
        assert "bob@example.com" not in member_emails

    def test_owner_removes_member(self, client, user1, user2, auth1, auth2):
        """Owner can remove a member from the household."""
        household = create_household(client, auth1)
        hid = household["id"]

        # Invite user2
        resp = client.post(
            f"/api/v1/households/{hid}/invite",
            json={"email": "bob@example.com"},
            headers=auth1,
        )
        token = resp.json()["token"]
        client.post(
            "/api/v1/households/join",
            json={"token": token},
            headers=auth2,
        )

        # Get user2's member id
        resp = client.get(f"/api/v1/households/{hid}", headers=auth1)
        members = resp.json()["members"]
        bob_member = next(m for m in members if m["email"] == "bob@example.com")

        # Owner removes user2
        resp = client.delete(
            f"/api/v1/households/{hid}/members/{bob_member['id']}",
            headers=auth1,
        )
        assert resp.status_code == 204


# ──── E2E: Expense Workflow ────


class TestExpenseWorkflow:
    """Full expense lifecycle: create → split → verify summary → settle."""

    def test_create_equal_split_and_settle(
        self, client, user1, user2, auth1, auth2, household
    ):
        """Create an equally-split expense, verify balances, then settle."""
        hid = str(household.id)

        # User1 pays $100 for groceries, split equally
        expense = create_expense(
            client,
            auth1,
            hid,
            "100.00",
            "Weekly groceries",
            category="groceries",
            split_type="equal",
        )
        expense_id = expense["id"]

        # Verify expense details
        resp = client.get(f"/api/v1/expenses/{expense_id}", headers=auth1)
        assert resp.status_code == 200
        detail = resp.json()
        assert detail["description"] == "Weekly groceries"
        assert len(detail["splits"]) == 2

        # Check household expense summary
        resp = client.get(
            f"/api/v1/expenses/households/{hid}/summary", headers=auth1
        )
        assert resp.status_code == 200

        # Settle the expense
        split_ids = [s["id"] for s in detail["splits"]]
        resp = client.post(
            f"/api/v1/expenses/{expense_id}/settle",
            json={"split_ids": split_ids},
            headers=auth1,
        )
        assert resp.status_code == 200

    def test_custom_split_expense(
        self, client, user1, user2, auth1, household
    ):
        """Create an expense with custom split amounts."""
        hid = str(household.id)

        expense = create_expense(
            client,
            auth1,
            hid,
            "150.00",
            "Electricity bill",
            category="utilities",
            split_type="custom",
            splits=[
                {"user_id": str(user1.id), "amount_owed": "90.00"},
                {"user_id": str(user2.id), "amount_owed": "60.00"},
            ],
        )
        assert expense["split_type"] == "custom"

        # Verify individual splits
        resp = client.get(f"/api/v1/expenses/{expense['id']}", headers=auth1)
        splits = resp.json()["splits"]
        amounts = sorted([s["amount_owed"] for s in splits])
        assert amounts == sorted(["60.00", "90.00"])

    def test_multiple_expenses_and_list(
        self, client, user1, user2, auth1, auth2, household
    ):
        """Create multiple expenses and verify listing with filters."""
        hid = str(household.id)

        # Both users create expenses
        create_expense(client, auth1, hid, "50.00", "Lunch", category="food")
        create_expense(
            client, auth2, hid, "30.00", "Coffee", category="food"
        )
        create_expense(
            client, auth1, hid, "200.00", "Rent", category="rent"
        )

        # List all expenses for household
        resp = client.get(
            f"/api/v1/expenses/?household_id={hid}", headers=auth1
        )
        assert resp.status_code == 200
        expenses = resp.json()
        assert len(expenses) >= 3

    def test_delete_expense(self, client, user1, auth1, household):
        """Create and delete an expense."""
        hid = str(household.id)
        expense = create_expense(
            client, auth1, hid, "25.00", "Snacks"
        )

        resp = client.delete(
            f"/api/v1/expenses/{expense['id']}", headers=auth1
        )
        assert resp.status_code == 204

        # Confirm it's gone
        resp = client.get(
            f"/api/v1/expenses/{expense['id']}", headers=auth1
        )
        assert resp.status_code == 404


# ──── E2E: Shopping List Workflow ────


class TestShoppingListWorkflow:
    """Full shopping lifecycle: create list → add items → purchase → stats."""

    def test_full_shopping_flow(
        self, client, user1, user2, auth1, auth2, household
    ):
        """Create list, add items, mark purchased, check stats."""
        hid = str(household.id)

        # Create shopping list
        slist = create_shopping_list(
            client, auth1, hid, "Weekly Groceries", description="Saturday run"
        )
        list_id = slist["id"]

        # Add multiple items
        item1 = add_shopping_item(
            client, auth1, list_id, "Milk", quantity=2, unit="liters"
        )
        item2 = add_shopping_item(
            client, auth2, list_id, "Bread", quantity=1, unit="loaf"
        )
        item3 = add_shopping_item(
            client, auth1, list_id, "Eggs", quantity=12, unit="pcs"
        )

        # List items
        resp = client.get(
            f"/api/v1/shopping-lists/{list_id}/items", headers=auth1
        )
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) >= 3

        # Mark items as purchased
        for item in [item1, item2]:
            resp = client.patch(
                f"/api/v1/shopping-lists/{list_id}/items/{item['id']}/purchase",
                json={"is_purchased": True},
                headers=auth1,
            )
            assert resp.status_code == 200

        # Check stats
        resp = client.get(
            f"/api/v1/shopping-lists/{list_id}/stats", headers=auth1
        )
        assert resp.status_code == 200
        stats = resp.json()
        assert stats["purchased_items"] == 2
        assert stats["total_items"] == 3

    def test_update_and_delete_items(
        self, client, user1, auth1, household
    ):
        """Update item details and delete an item."""
        hid = str(household.id)
        slist = create_shopping_list(client, auth1, hid, "Quick List")
        list_id = slist["id"]

        item = add_shopping_item(client, auth1, list_id, "Apples", quantity=5)

        # Update the item
        resp = client.put(
            f"/api/v1/shopping-lists/{list_id}/items/{item['id']}",
            json={"name": "Green Apples", "quantity": 10},
            headers=auth1,
        )
        assert resp.status_code == 200
        assert resp.json()["name"] == "Green Apples"

        # Delete the item
        resp = client.delete(
            f"/api/v1/shopping-lists/{list_id}/items/{item['id']}",
            headers=auth1,
        )
        assert resp.status_code == 204

    def test_delete_shopping_list(self, client, user1, auth1, household):
        """Create and delete a shopping list."""
        hid = str(household.id)
        slist = create_shopping_list(client, auth1, hid, "Temp List")

        resp = client.delete(
            f"/api/v1/shopping-lists/{slist['id']}", headers=auth1
        )
        assert resp.status_code == 204


# ──── E2E: Todo Workflow ────


class TestTodoWorkflow:
    """Full todo lifecycle: create → assign → update status → stats."""

    def test_full_todo_lifecycle(
        self, client, user1, user2, auth1, auth2, household
    ):
        """Create todo, update it, change status through full lifecycle."""
        hid = str(household.id)

        # Create a high-priority todo
        todo = create_todo(
            client,
            auth1,
            hid,
            "Clean kitchen",
            description="Deep clean the kitchen",
            priority="high",
        )
        todo_id = todo["id"]

        # Verify creation
        resp = client.get(f"/api/v1/todos/{todo_id}", headers=auth1)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Clean kitchen"
        assert resp.json()["priority"] == "high"

        # Update the todo
        resp = client.put(
            f"/api/v1/todos/{todo_id}",
            json={
                "title": "Deep clean kitchen",
                "description": "Including oven and fridge",
                "priority": "high",
                "household_id": hid,
            },
            headers=auth1,
        )
        assert resp.status_code == 200
        assert resp.json()["title"] == "Deep clean kitchen"

        # Move through statuses: pending → in_progress → completed
        resp = client.patch(
            f"/api/v1/todos/{todo_id}/status",
            json={"status": "in_progress"},
            headers=auth1,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "in_progress"

        resp = client.patch(
            f"/api/v1/todos/{todo_id}/status",
            json={"status": "completed"},
            headers=auth1,
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"

    def test_todo_stats(self, client, user1, auth1, household):
        """Create multiple todos and verify household stats."""
        hid = str(household.id)

        # Create several todos with different states
        todo1 = create_todo(client, auth1, hid, "Task A", priority="high")
        todo2 = create_todo(client, auth1, hid, "Task B", priority="medium")
        todo3 = create_todo(client, auth1, hid, "Task C", priority="low")

        # Complete one, start another
        client.patch(
            f"/api/v1/todos/{todo1['id']}/status",
            json={"status": "completed"},
            headers=auth1,
        )
        client.patch(
            f"/api/v1/todos/{todo2['id']}/status",
            json={"status": "in_progress"},
            headers=auth1,
        )

        # Check household stats
        resp = client.get(
            f"/api/v1/todos/household/{hid}/stats", headers=auth1
        )
        assert resp.status_code == 200
        stats = resp.json()
        assert stats["total"] == 3
        assert stats["completed"] == 1
        assert stats["in_progress"] == 1
        assert stats["pending"] == 1

    def test_delete_todo(self, client, user1, auth1, household):
        """Create and delete a todo."""
        hid = str(household.id)
        todo = create_todo(client, auth1, hid, "Temporary task")

        resp = client.delete(f"/api/v1/todos/{todo['id']}", headers=auth1)
        assert resp.status_code == 204

        resp = client.get(f"/api/v1/todos/{todo['id']}", headers=auth1)
        assert resp.status_code == 404


# ──── E2E: Multi-User Collaboration ────


class TestMultiUserCollaboration:
    """Two users collaborating within the same household."""

    def test_both_users_see_shared_todos(
        self, client, user1, user2, auth1, auth2, household
    ):
        """Both members create todos and both can see all of them."""
        hid = str(household.id)

        create_todo(client, auth1, hid, "Alice's task")
        create_todo(client, auth2, hid, "Bob's task")

        # Both users see all todos
        for auth in [auth1, auth2]:
            resp = client.get(
                f"/api/v1/todos/?household_id={hid}", headers=auth
            )
            assert resp.status_code == 200
            titles = {t["title"] for t in resp.json()}
            assert "Alice's task" in titles
            assert "Bob's task" in titles

    def test_both_users_see_shared_expenses(
        self, client, user1, user2, auth1, auth2, household
    ):
        """Both members create expenses and both see the full list."""
        hid = str(household.id)

        create_expense(client, auth1, hid, "80.00", "Internet bill")
        create_expense(client, auth2, hid, "45.00", "Cleaning supplies")

        for auth in [auth1, auth2]:
            resp = client.get(
                f"/api/v1/expenses/?household_id={hid}", headers=auth
            )
            assert resp.status_code == 200
            descriptions = {e["description"] for e in resp.json()}
            assert "Internet bill" in descriptions
            assert "Cleaning supplies" in descriptions

    def test_both_users_collaborate_on_shopping(
        self, client, user1, user2, auth1, auth2, household
    ):
        """Both users add items to the same shopping list."""
        hid = str(household.id)
        slist = create_shopping_list(client, auth1, hid, "Shared List")
        list_id = slist["id"]

        add_shopping_item(client, auth1, list_id, "Alice's item")
        add_shopping_item(client, auth2, list_id, "Bob's item")

        resp = client.get(
            f"/api/v1/shopping-lists/{list_id}/items", headers=auth2
        )
        assert resp.status_code == 200
        names = {i["name"] for i in resp.json()}
        assert "Alice's item" in names
        assert "Bob's item" in names

    def test_non_member_cannot_access_household_data(
        self, client, user1, user3, auth1, auth3, household
    ):
        """A user not in the household gets 403 on household resources."""
        hid = str(household.id)

        # User3 can't create a todo in this household
        resp = client.post(
            "/api/v1/todos/",
            json={"household_id": hid, "title": "Unauthorized task"},
            headers=auth3,
        )
        assert resp.status_code == 403

        # User3 can't create expenses
        resp = client.post(
            "/api/v1/expenses/",
            json={
                "household_id": hid,
                "amount": "50.00",
                "description": "Unauthorized expense",
            },
            headers=auth3,
        )
        assert resp.status_code == 403

        # User3 can't create shopping lists
        resp = client.post(
            "/api/v1/shopping-lists/",
            json={"household_id": hid, "name": "Unauthorized list"},
            headers=auth3,
        )
        assert resp.status_code == 403


# ──── E2E: Cross-Feature Workflow ────


class TestCrossFeatureWorkflow:
    """Complete workflow using all features together in one household."""

    def test_full_household_workflow(
        self, client, user1, user2, auth1, auth2, household
    ):
        """
        Simulate a real day in a shared apartment:
        1. Create household todos (chores)
        2. Go shopping (list + items + purchases)
        3. Track expenses from the shopping trip
        4. Complete the chores
        5. Verify all stats
        """
        hid = str(household.id)

        # 1. Create chores for the day
        chore1 = create_todo(
            client, auth1, hid, "Vacuum living room", priority="high"
        )
        chore2 = create_todo(
            client, auth2, hid, "Do laundry", priority="medium"
        )

        # 2. Create shopping list and add items
        grocery_list = create_shopping_list(
            client, auth1, hid, "Saturday Groceries"
        )
        gl_id = grocery_list["id"]

        milk = add_shopping_item(
            client, auth1, gl_id, "Milk", quantity=2, unit="liters"
        )
        pasta = add_shopping_item(
            client, auth2, gl_id, "Pasta", quantity=3, unit="packs"
        )
        sauce = add_shopping_item(
            client, auth1, gl_id, "Tomato Sauce", quantity=2, unit="jars"
        )

        # 3. Go shopping - mark items as purchased
        for item in [milk, pasta, sauce]:
            client.patch(
                f"/api/v1/shopping-lists/{gl_id}/items/{item['id']}/purchase",
                json={"is_purchased": True},
                headers=auth1,
            )

        # 4. Track the expense from shopping
        expense = create_expense(
            client,
            auth1,
            hid,
            "47.50",
            "Saturday groceries",
            category="groceries",
            split_type="equal",
        )

        # 5. Complete the chores
        client.patch(
            f"/api/v1/todos/{chore1['id']}/status",
            json={"status": "completed"},
            headers=auth1,
        )
        client.patch(
            f"/api/v1/todos/{chore2['id']}/status",
            json={"status": "completed"},
            headers=auth2,
        )

        # 6. Verify shopping stats
        resp = client.get(
            f"/api/v1/shopping-lists/{gl_id}/stats", headers=auth1
        )
        assert resp.status_code == 200
        shop_stats = resp.json()
        assert shop_stats["total_items"] == 3
        assert shop_stats["purchased_items"] == 3

        # 7. Verify todo stats
        resp = client.get(
            f"/api/v1/todos/household/{hid}/stats", headers=auth1
        )
        assert resp.status_code == 200
        todo_stats = resp.json()
        assert todo_stats["total"] == 2
        assert todo_stats["completed"] == 2

        # 8. Verify expense exists
        resp = client.get(
            f"/api/v1/expenses/?household_id={hid}", headers=auth1
        )
        assert resp.status_code == 200
        expenses = resp.json()
        assert any(e["description"] == "Saturday groceries" for e in expenses)


# ──── E2E: Authentication Guards ────


class TestAuthenticationGuards:
    """Verify unauthenticated requests are rejected across all endpoints."""

    @pytest.mark.parametrize(
        "method,url",
        [
            ("GET", "/api/v1/households/mine"),
            ("POST", "/api/v1/households/"),
            ("GET", "/api/v1/todos/"),
            ("POST", "/api/v1/todos/"),
            ("GET", "/api/v1/expenses/"),
            ("POST", "/api/v1/expenses/"),
            ("GET", "/api/v1/shopping-lists/"),
            ("POST", "/api/v1/shopping-lists/"),
        ],
    )
    def test_unauthenticated_requests_rejected(self, client, method, url):
        """All protected endpoints reject unauthenticated requests."""
        resp = getattr(client, method.lower())(url)
        assert resp.status_code in (401, 403)
