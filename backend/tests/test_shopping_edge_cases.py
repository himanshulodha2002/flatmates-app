"""Edge case tests for shopping list endpoints."""
import uuid
from decimal import Decimal

import pytest
from app.models.shopping import ShoppingList, ShoppingListItem, ShoppingListStatus, ItemCategory


class TestShoppingListCreationEdgeCases:
    def test_create_no_auth(self, client, household):
        r = client.post("/api/v1/shopping-lists/", json={"household_id": str(household.id), "name": "No auth"})
        assert r.status_code in (401, 403)

    def test_create_nonexistent_household(self, client, auth1):
        r = client.post("/api/v1/shopping-lists/", json={"household_id": str(uuid.uuid4()), "name": "Ghost"}, headers=auth1)
        assert r.status_code in (403, 404)

    def test_create_with_description(self, client, household, auth1):
        r = client.post("/api/v1/shopping-lists/", json={"household_id": str(household.id), "name": "Detailed", "description": "Test description"}, headers=auth1)
        assert r.status_code == 201
        assert r.json()["description"] == "Test description"

    def test_create_long_name(self, client, household, auth1):
        r = client.post("/api/v1/shopping-lists/", json={"household_id": str(household.id), "name": "N" * 500}, headers=auth1)
        assert r.status_code in (201, 400, 422)


class TestShoppingListItemEdgeCases:
    def _make_list(self, db_session, household, user1):
        sl = ShoppingList(household_id=household.id, name="Test list", created_by=user1.id)
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)
        return sl

    def test_create_item_no_auth(self, client, household, user1, db_session):
        sl = self._make_list(db_session, household, user1)
        r = client.post(f"/api/v1/shopping-lists/{sl.id}/items", json={"name": "No auth"})
        assert r.status_code in (401, 403)

    def test_create_item_with_price(self, client, household, user1, auth1, db_session):
        sl = self._make_list(db_session, household, user1)
        r = client.post(f"/api/v1/shopping-lists/{sl.id}/items", json={"name": "Priced", "price": "5.99"}, headers=auth1)
        assert r.status_code == 201

    def test_create_item_with_all_fields(self, client, household, user1, user2, auth1, db_session):
        sl = self._make_list(db_session, household, user1)
        r = client.post(
            f"/api/v1/shopping-lists/{sl.id}/items",
            json={"name": "Complete", "quantity": 3, "unit": "kg", "category": "meat", "assigned_to_id": str(user2.id)},
            headers=auth1,
        )
        assert r.status_code == 201
        data = r.json()
        assert data["name"] == "Complete"
        assert data["quantity"] == 3.0
        assert data["unit"] == "kg"

    def test_create_item_empty_name(self, client, household, user1, auth1, db_session):
        sl = self._make_list(db_session, household, user1)
        r = client.post(f"/api/v1/shopping-lists/{sl.id}/items", json={"name": ""}, headers=auth1)
        assert r.status_code in (400, 422)

    def test_create_item_nonexistent_list(self, client, auth1):
        r = client.post(f"/api/v1/shopping-lists/{uuid.uuid4()}/items", json={"name": "Ghost"}, headers=auth1)
        assert r.status_code == 404

    def test_list_items_nonexistent_list(self, client, auth1):
        r = client.get(f"/api/v1/shopping-lists/{uuid.uuid4()}/items", headers=auth1)
        assert r.status_code == 404

    def test_purchase_and_unpurchase_flow(self, client, household, user1, auth1, db_session):
        """Test full purchase lifecycle."""
        sl = self._make_list(db_session, household, user1)
        # Create item
        r = client.post(f"/api/v1/shopping-lists/{sl.id}/items", json={"name": "Lifecycle"}, headers=auth1)
        assert r.status_code == 201
        item_id = r.json()["id"]
        
        # Purchase
        r = client.patch(f"/api/v1/shopping-lists/{sl.id}/items/{item_id}/purchase", json={"is_purchased": True}, headers=auth1)
        assert r.status_code == 200
        assert r.json()["is_purchased"] is True
        
        # Unpurchase
        r = client.patch(f"/api/v1/shopping-lists/{sl.id}/items/{item_id}/purchase", json={"is_purchased": False}, headers=auth1)
        assert r.status_code == 200
        assert r.json()["is_purchased"] is False
        
        # Delete
        r = client.delete(f"/api/v1/shopping-lists/{sl.id}/items/{item_id}", headers=auth1)
        assert r.status_code == 204


class TestShoppingListStatsEdgeCases:
    def test_stats_empty_list(self, client, household, user1, auth1, db_session):
        sl = ShoppingList(household_id=household.id, name="Empty stats", created_by=user1.id)
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)
        r = client.get(f"/api/v1/shopping-lists/{sl.id}/stats", headers=auth1)
        assert r.status_code == 200
        assert r.json()["total_items"] == 0
        assert r.json()["purchased_items"] == 0

    def test_stats_nonexistent_list(self, client, auth1):
        r = client.get(f"/api/v1/shopping-lists/{uuid.uuid4()}/stats", headers=auth1)
        assert r.status_code == 404

    def test_stats_non_member(self, client, household, user1, auth3, db_session):
        sl = ShoppingList(household_id=household.id, name="Secret stats", created_by=user1.id)
        db_session.add(sl)
        db_session.commit()
        db_session.refresh(sl)
        r = client.get(f"/api/v1/shopping-lists/{sl.id}/stats", headers=auth3)
        assert r.status_code == 403


class TestCategoryEdgeCases:
    def test_list_categories_no_auth(self, client):
        r = client.get("/api/v1/shopping-lists/categories")
        assert r.status_code in (401, 403)

    def test_list_categories_empty(self, client, auth1):
        r = client.get("/api/v1/shopping-lists/categories", headers=auth1)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_category_no_household(self, client, auth1):
        """Create a global category (no household_id)."""
        r = client.post("/api/v1/shopping-lists/categories", json={"name": "Global Cat"}, headers=auth1)
        assert r.status_code == 201

    def test_create_category_empty_name(self, client, household, auth1):
        r = client.post("/api/v1/shopping-lists/categories", json={"name": "", "household_id": str(household.id)}, headers=auth1)
        assert r.status_code in (400, 422)

    def test_create_category_with_icon_and_color(self, client, household, auth1):
        r = client.post("/api/v1/shopping-lists/categories", json={"name": "Styled", "icon": "🎨", "color": "#FF0000", "household_id": str(household.id)}, headers=auth1)
        assert r.status_code == 201
        assert r.json()["icon"] == "🎨"
        assert r.json()["color"] == "#FF0000"
