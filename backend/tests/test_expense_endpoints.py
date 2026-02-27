"""
Tests for expense endpoints.
"""
import uuid
from decimal import Decimal

import pytest
from app.models.expense import Expense, ExpenseSplit, ExpenseCategory, SplitType, PaymentMethod


class TestCreateExpense:
    def test_create_equal_split_expense(self, client, household, user1, auth1):
        response = client.post(
            "/api/v1/expenses/",
            json={
                "household_id": str(household.id),
                "amount": "50.00",
                "description": "Groceries",
                "category": "groceries",
                "split_type": "equal",
            },
            headers=auth1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["description"] == "Groceries"
        assert Decimal(data["amount"]) == Decimal("50.00")
        assert data["split_type"] == "equal"
        # Should have 2 splits (user1 + user2 in household fixture)
        assert len(data["splits"]) == 2
        # Creator's split should be auto-settled
        creator_split = next(s for s in data["splits"] if s["user_id"] == str(user1.id))
        assert creator_split["is_settled"] is True

    def test_create_personal_expense(self, client, household, auth1):
        response = client.post(
            "/api/v1/expenses/",
            json={
                "household_id": str(household.id),
                "amount": "25.00",
                "description": "Coffee",
                "is_personal": True,
            },
            headers=auth1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["is_personal"] is True
        assert len(data["splits"]) == 0

    def test_create_custom_split_expense(self, client, household, user1, user2, auth1):
        response = client.post(
            "/api/v1/expenses/",
            json={
                "household_id": str(household.id),
                "amount": "100.00",
                "description": "Rent deposit",
                "split_type": "custom",
                "splits": [
                    {"user_id": str(user1.id), "amount_owed": "60.00"},
                    {"user_id": str(user2.id), "amount_owed": "40.00"},
                ],
            },
            headers=auth1,
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data["splits"]) == 2

    def test_create_custom_split_wrong_total(self, client, household, user1, user2, auth1):
        response = client.post(
            "/api/v1/expenses/",
            json={
                "household_id": str(household.id),
                "amount": "100.00",
                "description": "Bad split",
                "split_type": "custom",
                "splits": [
                    {"user_id": str(user1.id), "amount_owed": "60.00"},
                    {"user_id": str(user2.id), "amount_owed": "30.00"},
                ],
            },
            headers=auth1,
        )
        assert response.status_code == 400

    def test_create_expense_non_member(self, client, household, auth3):
        response = client.post(
            "/api/v1/expenses/",
            json={
                "household_id": str(household.id),
                "amount": "10.00",
                "description": "Unauthorized",
            },
            headers=auth3,
        )
        assert response.status_code == 403

    def test_create_expense_no_auth(self, client, household):
        response = client.post(
            "/api/v1/expenses/",
            json={
                "household_id": str(household.id),
                "amount": "10.00",
                "description": "No auth",
            },
        )
        assert response.status_code in (401, 403)


class TestListExpenses:
    def _create_expenses(self, db_session, household, user1):
        for i, cat in enumerate(["groceries", "utilities", "rent"]):
            e = Expense(
                household_id=household.id,
                created_by=user1.id,
                amount=Decimal(f"{(i + 1) * 10}.00"),
                description=f"Expense {i}",
                category=cat,
                split_type=SplitType.EQUAL,
            )
            db_session.add(e)
        db_session.commit()

    def test_list_expenses(self, client, household, user1, auth1, db_session):
        self._create_expenses(db_session, household, user1)
        response = client.get(
            f"/api/v1/expenses/?household_id={household.id}", headers=auth1
        )
        assert response.status_code == 200
        assert len(response.json()) == 3

    def test_list_expenses_filter_category(self, client, household, user1, auth1, db_session):
        self._create_expenses(db_session, household, user1)
        response = client.get(
            f"/api/v1/expenses/?household_id={household.id}&category=groceries",
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert all(e["category"] == "groceries" for e in data)

    def test_list_expenses_non_member(self, client, household, auth3):
        response = client.get(
            f"/api/v1/expenses/?household_id={household.id}", headers=auth3
        )
        # Non-member is rejected by membership verification
        assert response.status_code == 403


class TestGetExpense:
    def test_get_expense(self, client, household, user1, auth1, db_session):
        e = Expense(
            household_id=household.id,
            created_by=user1.id,
            amount=Decimal("50.00"),
            description="Detail test",
            category=ExpenseCategory.GROCERIES,
            split_type=SplitType.EQUAL,
        )
        db_session.add(e)
        db_session.commit()
        db_session.refresh(e)

        response = client.get(f"/api/v1/expenses/{e.id}", headers=auth1)
        assert response.status_code == 200
        assert response.json()["description"] == "Detail test"

    def test_get_expense_not_found(self, client, auth1):
        response = client.get(f"/api/v1/expenses/{uuid.uuid4()}", headers=auth1)
        assert response.status_code == 404


class TestUpdateExpense:
    def test_update_expense_by_creator(self, client, household, user1, auth1, db_session):
        e = Expense(
            household_id=household.id,
            created_by=user1.id,
            amount=Decimal("50.00"),
            description="Original",
            category=ExpenseCategory.OTHER,
            split_type=SplitType.EQUAL,
        )
        db_session.add(e)
        db_session.commit()
        db_session.refresh(e)

        response = client.patch(
            f"/api/v1/expenses/{e.id}",
            json={"description": "Updated", "amount": "75.00"},
            headers=auth1,
        )
        assert response.status_code == 200
        assert response.json()["description"] == "Updated"
        assert Decimal(response.json()["amount"]) == Decimal("75.00")

    def test_update_expense_by_non_creator(self, client, household, user1, auth2, db_session):
        e = Expense(
            household_id=household.id,
            created_by=user1.id,
            amount=Decimal("50.00"),
            description="Not yours",
            category=ExpenseCategory.OTHER,
            split_type=SplitType.EQUAL,
        )
        db_session.add(e)
        db_session.commit()
        db_session.refresh(e)

        response = client.patch(
            f"/api/v1/expenses/{e.id}",
            json={"description": "Hacked"},
            headers=auth2,
        )
        assert response.status_code == 403


class TestDeleteExpense:
    def test_delete_expense(self, client, household, user1, auth1, db_session):
        e = Expense(
            household_id=household.id,
            created_by=user1.id,
            amount=Decimal("10.00"),
            description="Delete me",
            category=ExpenseCategory.OTHER,
            split_type=SplitType.EQUAL,
        )
        db_session.add(e)
        db_session.commit()
        db_session.refresh(e)

        response = client.delete(f"/api/v1/expenses/{e.id}", headers=auth1)
        assert response.status_code == 204

    def test_delete_expense_by_non_creator(self, client, household, user1, auth2, db_session):
        e = Expense(
            household_id=household.id,
            created_by=user1.id,
            amount=Decimal("10.00"),
            description="Not deletable",
            category=ExpenseCategory.OTHER,
            split_type=SplitType.EQUAL,
        )
        db_session.add(e)
        db_session.commit()
        db_session.refresh(e)

        response = client.delete(f"/api/v1/expenses/{e.id}", headers=auth2)
        assert response.status_code == 403


class TestSettleExpense:
    def test_settle_splits(self, client, household, user1, user2, auth1, db_session):
        e = Expense(
            household_id=household.id,
            created_by=user1.id,
            amount=Decimal("100.00"),
            description="To settle",
            category=ExpenseCategory.OTHER,
            split_type=SplitType.EQUAL,
        )
        db_session.add(e)
        db_session.flush()

        split1 = ExpenseSplit(
            expense_id=e.id,
            user_id=user1.id,
            amount_owed=Decimal("50.00"),
            is_settled=True,
        )
        split2 = ExpenseSplit(
            expense_id=e.id,
            user_id=user2.id,
            amount_owed=Decimal("50.00"),
            is_settled=False,
        )
        db_session.add_all([split1, split2])
        db_session.commit()
        db_session.refresh(split2)

        response = client.post(
            f"/api/v1/expenses/{e.id}/settle",
            json={"split_ids": [str(split2.id)]},
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["settled_count"] == 1


class TestHouseholdSummary:
    def test_summary(self, client, household, user1, user2, auth1, db_session):
        e = Expense(
            household_id=household.id,
            created_by=user1.id,
            amount=Decimal("100.00"),
            description="Summary test",
            category=ExpenseCategory.GROCERIES,
            split_type=SplitType.EQUAL,
            is_personal=False,
        )
        db_session.add(e)
        db_session.flush()

        for uid in [user1.id, user2.id]:
            db_session.add(
                ExpenseSplit(
                    expense_id=e.id,
                    user_id=uid,
                    amount_owed=Decimal("50.00"),
                    is_settled=(uid == user1.id),
                )
            )
        db_session.commit()

        response = client.get(
            f"/api/v1/expenses/households/{household.id}/summary", headers=auth1
        )
        assert response.status_code == 200
        data = response.json()
        assert Decimal(data["total_expenses"]) == Decimal("100.00")
        assert data["expense_count"] == 1
        assert len(data["user_balances"]) == 2


class TestPersonalAnalytics:
    def test_analytics_own_user(self, client, household, user1, auth1, db_session):
        e = Expense(
            household_id=household.id,
            created_by=user1.id,
            amount=Decimal("30.00"),
            description="Analytics test",
            category=ExpenseCategory.FOOD,
            split_type=SplitType.EQUAL,
        )
        db_session.add(e)
        db_session.commit()

        response = client.get(
            f"/api/v1/expenses/users/{user1.id}/analytics?months=1", headers=auth1
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == str(user1.id)

    def test_analytics_other_user_forbidden(self, client, household, user1, user2, auth1):
        response = client.get(
            f"/api/v1/expenses/users/{user2.id}/analytics", headers=auth1
        )
        assert response.status_code == 403
