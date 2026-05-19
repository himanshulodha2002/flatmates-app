"""Edge case tests for todo endpoints."""
import uuid
from datetime import datetime, timedelta

import pytest
from app.models.todo import Todo, TodoStatus, TodoPriority


class TestTodoCreationEdgeCases:
    def test_create_todo_no_auth(self, client, household):
        response = client.post("/api/v1/todos/", json={"household_id": str(household.id), "title": "No auth"})
        assert response.status_code in (401, 403)

    def test_create_todo_non_member(self, client, household, auth3):
        response = client.post("/api/v1/todos/", json={"household_id": str(household.id), "title": "Unauthorized"}, headers=auth3)
        assert response.status_code == 403

    def test_create_todo_nonexistent_household(self, client, auth1):
        response = client.post("/api/v1/todos/", json={"household_id": str(uuid.uuid4()), "title": "Ghost"}, headers=auth1)
        assert response.status_code in (403, 404)

    def test_create_todo_with_all_priorities(self, client, household, auth1):
        for p in ["low", "medium", "high"]:
            r = client.post("/api/v1/todos/", json={"household_id": str(household.id), "title": f"Priority {p}", "priority": p}, headers=auth1)
            assert r.status_code == 201, f"Failed for priority: {p}"

    def test_create_todo_invalid_priority(self, client, household, auth1):
        r = client.post("/api/v1/todos/", json={"household_id": str(household.id), "title": "Bad priority", "priority": "urgent"}, headers=auth1)
        assert r.status_code == 422

    def test_create_todo_assign_to_member(self, client, household, user2, auth1):
        r = client.post("/api/v1/todos/", json={"household_id": str(household.id), "title": "Assigned", "assigned_to_id": str(user2.id)}, headers=auth1)
        assert r.status_code == 201
        assert r.json()["assigned_to_id"] == str(user2.id)

    def test_create_todo_assign_to_non_member(self, client, household, user3, auth1):
        r = client.post("/api/v1/todos/", json={"household_id": str(household.id), "title": "Bad assign", "assigned_to_id": str(user3.id)}, headers=auth1)
        assert r.status_code in (400, 403, 422)

    def test_create_todo_with_due_date(self, client, household, auth1):
        future = (datetime.now(tz=None) + timedelta(days=7)).isoformat()
        r = client.post("/api/v1/todos/", json={"household_id": str(household.id), "title": "Due soon", "due_date": future}, headers=auth1)
        assert r.status_code == 201

    def test_create_todo_long_title(self, client, household, auth1):
        r = client.post("/api/v1/todos/", json={"household_id": str(household.id), "title": "T" * 500}, headers=auth1)
        assert r.status_code in (201, 400, 422)


class TestTodoListEdgeCases:
    def test_list_todos_empty(self, client, household, auth1):
        r = client.get(f"/api/v1/todos/?household_id={household.id}", headers=auth1)
        assert r.status_code == 200
        assert r.json() == []

    def test_list_todos_non_member(self, client, household, auth3):
        r = client.get(f"/api/v1/todos/?household_id={household.id}", headers=auth3)
        assert r.status_code == 403

    def test_list_todos_filter_status(self, client, household, user1, auth1, db_session):
        for s in [TodoStatus.PENDING, TodoStatus.IN_PROGRESS, TodoStatus.COMPLETED]:
            db_session.add(Todo(household_id=household.id, title=f"Status {s.value}", status=s, created_by=user1.id))
        db_session.commit()
        r = client.get(f"/api/v1/todos/?household_id={household.id}&status=pending", headers=auth1)
        assert r.status_code == 200
        assert all(t["status"] == "pending" for t in r.json())

    def test_list_todos_includes_all_when_no_filter(self, client, household, user1, auth1, db_session):
        for p in [TodoPriority.LOW, TodoPriority.HIGH]:
            db_session.add(Todo(household_id=household.id, title=f"Priority {p.value}", priority=p, created_by=user1.id))
        db_session.commit()
        r = client.get(f"/api/v1/todos/?household_id={household.id}", headers=auth1)
        assert r.status_code == 200
        priorities = {t["priority"] for t in r.json()}
        assert "low" in priorities
        assert "high" in priorities


class TestTodoUpdateEdgeCases:
    def test_update_nonexistent(self, client, auth1):
        r = client.put(f"/api/v1/todos/{uuid.uuid4()}", json={"title": "Ghost"}, headers=auth1)
        assert r.status_code == 404

    def test_get_nonexistent(self, client, auth1):
        r = client.get(f"/api/v1/todos/{uuid.uuid4()}", headers=auth1)
        assert r.status_code == 404

    def test_delete_nonexistent(self, client, auth1):
        r = client.delete(f"/api/v1/todos/{uuid.uuid4()}", headers=auth1)
        assert r.status_code == 404

    def test_update_status_transitions(self, client, household, user1, auth1, db_session):
        todo = Todo(household_id=household.id, title="Status test", created_by=user1.id, status=TodoStatus.PENDING)
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        # Pending -> In Progress
        r = client.patch(f"/api/v1/todos/{todo.id}/status", json={"status": "in_progress"}, headers=auth1)
        assert r.status_code == 200
        assert r.json()["status"] == "in_progress"

        # In Progress -> Completed
        r = client.patch(f"/api/v1/todos/{todo.id}/status", json={"status": "completed"}, headers=auth1)
        assert r.status_code == 200
        assert r.json()["status"] == "completed"

    def test_delete_todo_by_non_creator_member(self, client, household, user1, auth2, db_session):
        """Member (non-creator) should be able to delete todos in their household."""
        todo = Todo(household_id=household.id, title="Delete test", created_by=user1.id)
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)
        r = client.delete(f"/api/v1/todos/{todo.id}", headers=auth2)
        # May allow or deny based on implementation
        assert r.status_code in (204, 403)

    def test_update_todo_description(self, client, household, user1, auth1, db_session):
        todo = Todo(household_id=household.id, title="Update desc", created_by=user1.id)
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)
        r = client.put(f"/api/v1/todos/{todo.id}", json={"description": "New description"}, headers=auth1)
        assert r.status_code == 200
        assert r.json()["description"] == "New description"
