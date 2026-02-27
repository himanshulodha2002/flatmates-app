"""
Tests for shopping list endpoints.
"""
import uuid
from decimal import Decimal

import pytest
from app.models.shopping import ShoppingList, ShoppingListItem, ShoppingListStatus, ItemCategory


class TestCreateShoppingList:
    def test_create_shopping_list(self, client, household, user1, auth1):
        response = client.post(
            "/api/v1/shopping-lists/",
            json={
                "household_id": str(household.id),
                "name": "Weekly Groceries",
                "description": "Regular grocery run",
            },
            headers=auth1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Weekly Groceries"
        assert data["description"] == "Regular grocery run"
        assert data["status"] == "active"
        assert data["household_id"] == str(household.id)

    def test_create_shopping_list_minimal(self, client, household, auth1):
        response = client.post(
            "/api/v1/shopping-lists/",
            json={"household_id": str(household.id), "name": "Quick list"},
            headers=auth1,
        )
        assert response.status_code == 201
        assert response.json()["name"] == "Quick list"
        assert response.json()["description"] is None

    def test_create_shopping_list_non_member(self, client, household, auth3):
        response = client.post(
            "/api/v1/shopping-lists/",
            json={"household_id": str(household.id), "name": "Unauthorized"},
            headers=auth3,
        )
        assert response.status_code == 403

    def test_create_shopping_list_no_auth(self, client, household):
        response = client.post(
            "/api/v1/shopping-lists/",
            json={"household_id": str(household.id), "name": "No auth"},
        )
        assert response.status_code in (401, 403)

    def test_create_shopping_list_empty_name(self, client, household, auth1):
        response = client.post(
            "/api/v1/shopping-lists/",
            json={"household_id": str(household.id), "name": ""},
            headers=auth1,
        )
        assert response.status_code == 422


class TestListShoppingLists:
    def _create_lists(self, db_session, household, user1):
        lists = []
        for i, status in enumerate([ShoppingListStatus.ACTIVE, ShoppingListStatus.ACTIVE, ShoppingListStatus.ARCHIVED]):
            sl = ShoppingList(
                household_id=household.id,
                name=f"List {i}",
                status=status,
                created_by=user1.id,
            )
            db_session.add(sl)
            lists.append(sl)
        db_session.commit()
        return lists

    def test_list_shopping_lists(self, client, household, user1, auth1, db_session):
        self._create_lists(db_session, household, user1)
        response = client.get(
            f"/api/v1/shopping-lists/?household_id={household.id}", headers=auth1
        )
        assert response.status_code == 200
        # Default excludes archived
        assert len(response.json()) == 2

    def test_list_shopping_lists_include_archived(self, client, household, user1, auth1, db_session):
        self._create_lists(db_session, household, user1)
        response = client.get(
            f"/api/v1/shopping-lists/?household_id={household.id}&include_archived=true",
            headers=auth1,
        )
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_list_shopping_lists_filter_status(self, client, household, user1, auth1, db_session):
        self._create_lists(db_session, household, user1)
        response = client.get(
            f"/api/v1/shopping-lists/?household_id={household.id}&status=archived",
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["status"] == "archived"

    def test_list_shopping_lists_non_member(self, client, household, auth3):
        response = client.get(
            f"/api/v1/shopping-lists/?household_id={household.id}", headers=auth3
        )
        assert response.status_code == 403


class TestGetShoppingList:
    def test_get_shopping_list_with_items(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Detail list", created_by=user1.id
        )
        db_session.add(sl)
        db_session.flush()

        item = ShoppingListItem(
            shopping_list_id=sl.id,
            name="Milk",
            quantity=2.0,
            unit="liters",
            category="dairy",
            created_by=user1.id,
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(sl)

        response = client.get(f"/api/v1/shopping-lists/{sl.id}", headers=auth1)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Detail list"
        assert len(data["items"]) == 1
        assert data["items"][0]["name"] == "Milk"
        assert data["created_by_name"] == "Alice Smith"

    def test_get_shopping_list_not_found(self, client, auth1):
        response = client.get(f"/api/v1/shopping-lists/{uuid.uuid4()}", headers=auth1)
        assert response.status_code == 404

    def test_get_shopping_list_non_member(self, client, household, user1, auth3, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Secret list", created_by=user1.id
        )
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)

        response = client.get(f"/api/v1/shopping-lists/{sl.id}", headers=auth3)
        assert response.status_code == 403


class TestUpdateShoppingList:
    def test_update_shopping_list(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Original", created_by=user1.id
        )
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)

        response = client.put(
            f"/api/v1/shopping-lists/{sl.id}",
            json={"name": "Updated", "description": "New desc"},
            headers=auth1,
        )
        assert response.status_code == 200
        assert response.json()["name"] == "Updated"
        assert response.json()["description"] == "New desc"

    def test_archive_shopping_list(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="To archive", created_by=user1.id
        )
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)

        response = client.put(
            f"/api/v1/shopping-lists/{sl.id}",
            json={"status": "archived"},
            headers=auth1,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "archived"


class TestDeleteShoppingList:
    def test_delete_shopping_list(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Delete me", created_by=user1.id
        )
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)

        response = client.delete(f"/api/v1/shopping-lists/{sl.id}", headers=auth1)
        assert response.status_code == 204

    def test_delete_shopping_list_not_found(self, client, auth1):
        response = client.delete(f"/api/v1/shopping-lists/{uuid.uuid4()}", headers=auth1)
        assert response.status_code == 404


class TestShoppingListStats:
    def test_stats(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Stats list", created_by=user1.id
        )
        db_session.add(sl)
        db_session.flush()

        items = [
            ShoppingListItem(
                shopping_list_id=sl.id,
                name="Milk",
                category="dairy",
                is_purchased=True,
                price=Decimal("3.50"),
                created_by=user1.id,
            ),
            ShoppingListItem(
                shopping_list_id=sl.id,
                name="Bread",
                category="bakery",
                is_purchased=False,
                price=Decimal("2.00"),
                created_by=user1.id,
            ),
            ShoppingListItem(
                shopping_list_id=sl.id,
                name="Cheese",
                category="dairy",
                is_purchased=False,
                created_by=user1.id,
            ),
        ]
        db_session.add_all(items)
        db_session.commit()
        db_session.refresh(sl)

        response = client.get(f"/api/v1/shopping-lists/{sl.id}/stats", headers=auth1)
        assert response.status_code == 200
        data = response.json()
        assert data["total_items"] == 3
        assert data["purchased_items"] == 1
        assert data["pending_items"] == 2
        assert data["categories"]["dairy"] == 2
        assert data["categories"]["bakery"] == 1


# ============ Shopping List Item Tests ============


class TestCreateShoppingListItem:
    def _make_list(self, db_session, household, user1):
        sl = ShoppingList(
            household_id=household.id, name="Item test list", created_by=user1.id
        )
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)
        return sl

    def test_create_item(self, client, household, user1, auth1, db_session):
        sl = self._make_list(db_session, household, user1)
        response = client.post(
            f"/api/v1/shopping-lists/{sl.id}/items",
            json={"name": "Apples", "quantity": 5, "unit": "pcs", "category": "fruit"},
            headers=auth1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Apples"
        assert data["quantity"] == 5.0
        assert data["unit"] == "pcs"
        assert data["is_purchased"] is False

    def test_create_item_minimal(self, client, household, user1, auth1, db_session):
        sl = self._make_list(db_session, household, user1)
        response = client.post(
            f"/api/v1/shopping-lists/{sl.id}/items",
            json={"name": "Butter"},
            headers=auth1,
        )
        assert response.status_code == 201
        assert response.json()["quantity"] == 1.0

    def test_create_item_with_assignment(self, client, household, user1, user2, auth1, db_session):
        sl = self._make_list(db_session, household, user1)
        response = client.post(
            f"/api/v1/shopping-lists/{sl.id}/items",
            json={"name": "Assigned item", "assigned_to_id": str(user2.id)},
            headers=auth1,
        )
        assert response.status_code == 201
        assert response.json()["assigned_to_id"] == str(user2.id)

    def test_create_item_assign_non_member(self, client, household, user1, user3, auth1, db_session):
        sl = self._make_list(db_session, household, user1)
        response = client.post(
            f"/api/v1/shopping-lists/{sl.id}/items",
            json={"name": "Bad assign", "assigned_to_id": str(user3.id)},
            headers=auth1,
        )
        assert response.status_code == 400

    def test_create_item_non_member(self, client, household, user1, auth3, db_session):
        sl = self._make_list(db_session, household, user1)
        response = client.post(
            f"/api/v1/shopping-lists/{sl.id}/items",
            json={"name": "Unauthorized"},
            headers=auth3,
        )
        assert response.status_code == 403


class TestListShoppingListItems:
    def test_list_items(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Items list", created_by=user1.id
        )
        db_session.add(sl)
        db_session.flush()

        for name, purchased in [("Milk", True), ("Eggs", False), ("Bread", False)]:
            db_session.add(
                ShoppingListItem(
                    shopping_list_id=sl.id,
                    name=name,
                    is_purchased=purchased,
                    created_by=user1.id,
                )
            )
        db_session.commit()
        db_session.refresh(sl)

        response = client.get(
            f"/api/v1/shopping-lists/{sl.id}/items", headers=auth1
        )
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_list_items_filter_purchased(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Filter list", created_by=user1.id
        )
        db_session.add(sl)
        db_session.flush()

        for name, purchased in [("Milk", True), ("Eggs", False)]:
            db_session.add(
                ShoppingListItem(
                    shopping_list_id=sl.id,
                    name=name,
                    is_purchased=purchased,
                    created_by=user1.id,
                )
            )
        db_session.commit()

        response = client.get(
            f"/api/v1/shopping-lists/{sl.id}/items?is_purchased=false", headers=auth1
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Eggs"


class TestUpdateShoppingListItem:
    def _make_list_with_item(self, db_session, household, user1):
        sl = ShoppingList(
            household_id=household.id, name="Update test", created_by=user1.id
        )
        db_session.add(sl)
        db_session.flush()

        item = ShoppingListItem(
            shopping_list_id=sl.id, name="Original item", created_by=user1.id
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(sl)
        db_session.refresh(item)
        return sl, item

    def test_update_item(self, client, household, user1, auth1, db_session):
        sl, item = self._make_list_with_item(db_session, household, user1)
        response = client.put(
            f"/api/v1/shopping-lists/{sl.id}/items/{item.id}",
            json={"name": "Updated item", "quantity": 3, "unit": "kg"},
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated item"
        assert data["quantity"] == 3.0
        assert data["unit"] == "kg"

    def test_update_item_not_found(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Empty list", created_by=user1.id
        )
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)

        response = client.put(
            f"/api/v1/shopping-lists/{sl.id}/items/{uuid.uuid4()}",
            json={"name": "Ghost"},
            headers=auth1,
        )
        assert response.status_code == 404

    def test_update_item_mark_purchased(self, client, household, user1, auth1, db_session):
        sl, item = self._make_list_with_item(db_session, household, user1)
        response = client.put(
            f"/api/v1/shopping-lists/{sl.id}/items/{item.id}",
            json={"is_purchased": True},
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_purchased"] is True
        assert data["checked_off_by"] is not None
        assert data["checked_off_at"] is not None


class TestToggleItemPurchase:
    def test_toggle_purchase(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Toggle test", created_by=user1.id
        )
        db_session.add(sl)
        db_session.flush()

        item = ShoppingListItem(
            shopping_list_id=sl.id, name="Toggle item", created_by=user1.id
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(sl)
        db_session.refresh(item)

        # Mark purchased
        r1 = client.patch(
            f"/api/v1/shopping-lists/{sl.id}/items/{item.id}/purchase",
            json={"is_purchased": True},
            headers=auth1,
        )
        assert r1.status_code == 200
        assert r1.json()["is_purchased"] is True
        assert r1.json()["checked_off_by"] is not None

        # Un-purchase
        r2 = client.patch(
            f"/api/v1/shopping-lists/{sl.id}/items/{item.id}/purchase",
            json={"is_purchased": False},
            headers=auth1,
        )
        assert r2.status_code == 200
        assert r2.json()["is_purchased"] is False
        assert r2.json()["checked_off_by"] is None

    def test_toggle_purchase_not_found(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Empty", created_by=user1.id
        )
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)

        response = client.patch(
            f"/api/v1/shopping-lists/{sl.id}/items/{uuid.uuid4()}/purchase",
            json={"is_purchased": True},
            headers=auth1,
        )
        assert response.status_code == 404


class TestDeleteShoppingListItem:
    def test_delete_item(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Delete item test", created_by=user1.id
        )
        db_session.add(sl)
        db_session.flush()

        item = ShoppingListItem(
            shopping_list_id=sl.id, name="Delete me", created_by=user1.id
        )
        db_session.add(item)
        db_session.commit()
        db_session.refresh(sl)
        db_session.refresh(item)

        response = client.delete(
            f"/api/v1/shopping-lists/{sl.id}/items/{item.id}", headers=auth1
        )
        assert response.status_code == 204

    def test_delete_item_not_found(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(
            household_id=household.id, name="Empty", created_by=user1.id
        )
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)

        response = client.delete(
            f"/api/v1/shopping-lists/{sl.id}/items/{uuid.uuid4()}", headers=auth1
        )
        assert response.status_code == 404


# ============ Item Category Tests ============


class TestItemCategories:
    def test_create_category(self, client, household, auth1):
        response = client.post(
            "/api/v1/shopping-lists/categories",
            json={
                "name": "Organic",
                "icon": "🌿",
                "color": "#00FF00",
                "household_id": str(household.id),
            },
            headers=auth1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Organic"
        assert data["icon"] == "🌿"

    def test_create_duplicate_category(self, client, household, auth1, db_session):
        cat = ItemCategory(
            name="Existing", household_id=household.id
        )
        db_session.add(cat)
        db_session.commit()

        response = client.post(
            "/api/v1/shopping-lists/categories",
            json={"name": "Existing", "household_id": str(household.id)},
            headers=auth1,
        )
        assert response.status_code == 400

    def test_list_categories(self, client, household, user1, auth1, db_session):
        db_session.add(ItemCategory(name="Global Cat", household_id=None))
        db_session.add(ItemCategory(name="Household Cat", household_id=household.id))
        db_session.commit()

        response = client.get(
            f"/api/v1/shopping-lists/categories?household_id={household.id}",
            headers=auth1,
        )
        assert response.status_code == 200
        assert len(response.json()) == 2
