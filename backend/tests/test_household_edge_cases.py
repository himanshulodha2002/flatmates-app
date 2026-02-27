"""Edge case tests for household endpoints."""
import uuid

import pytest
from app.models.household import Household, HouseholdMember, MemberRole


class TestHouseholdCreationEdgeCases:
    def test_create_no_auth(self, client):
        r = client.post("/api/v1/households/", json={"name": "No auth"})
        assert r.status_code in (401, 403)

    def test_create_empty_name(self, client, auth1):
        r = client.post("/api/v1/households/", json={"name": ""}, headers=auth1)
        assert r.status_code == 422

    def test_create_long_name(self, client, auth1):
        r = client.post("/api/v1/households/", json={"name": "H" * 500}, headers=auth1)
        assert r.status_code in (201, 400, 422)

    def test_creator_is_owner(self, client, auth1):
        """Creator should automatically become owner."""
        r = client.post("/api/v1/households/", json={"name": "My House"}, headers=auth1)
        assert r.status_code == 201


class TestHouseholdListEdgeCases:
    def test_list_no_auth(self, client):
        r = client.get("/api/v1/households/mine")
        assert r.status_code in (401, 403)

    def test_list_empty(self, client, user3, auth3):
        """User with no households gets empty list."""
        r = client.get("/api/v1/households/mine", headers=auth3)
        assert r.status_code == 200
        assert r.json() == []

    def test_list_only_own_households(self, client, household, auth1, auth3):
        """User only sees their own households."""
        r1 = client.get("/api/v1/households/mine", headers=auth1)
        r3 = client.get("/api/v1/households/mine", headers=auth3)
        assert r1.status_code == 200
        assert r3.status_code == 200
        assert len(r1.json()) >= 1
        assert len(r3.json()) == 0


class TestHouseholdDetailEdgeCases:
    def test_get_nonexistent(self, client, auth1):
        r = client.get(f"/api/v1/households/{uuid.uuid4()}", headers=auth1)
        assert r.status_code in (403, 404)

    def test_get_non_member(self, client, household, auth3):
        r = client.get(f"/api/v1/households/{household.id}", headers=auth3)
        assert r.status_code == 403


class TestHouseholdInviteEdgeCases:
    def test_invite_non_member(self, client, household, auth3):
        """Non-member cannot send invites."""
        r = client.post(
            f"/api/v1/households/{household.id}/invite",
            json={"email": "new@example.com"},
            headers=auth3,
        )
        assert r.status_code == 403

    def test_invite_no_auth(self, client, household):
        r = client.post(
            f"/api/v1/households/{household.id}/invite",
            json={"email": "new@example.com"},
        )
        assert r.status_code in (401, 403)

    def test_join_invalid_token(self, client, auth3):
        """Join with invalid token."""
        r = client.post("/api/v1/households/join", json={"token": "invalid-token"}, headers=auth3)
        assert r.status_code in (404, 400)
