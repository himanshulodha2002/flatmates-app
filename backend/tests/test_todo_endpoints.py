"""
Tests for todo endpoints.
"""
import uuid
from datetime import datetime, timezone

import pytest
from app.models.todo import Todo, TodoStatus, TodoPriority


class TestCreateTodo:
    def test_create_todo(self, client, household, user1, auth1):
        response = client.post(
            "/api/v1/todos/",
            json={
                "household_id": str(household.id),
                "title": "Buy groceries",
                "description": "Milk, eggs, bread",
                "priority": "high",
            },
            headers=auth1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Buy groceries"
        assert data["description"] == "Milk, eggs, bread"
        assert data["priority"] == "high"
        assert data["status"] == "pending"
        assert data["household_id"] == str(household.id)

    def test_create_todo_minimal(self, client, household, user1, auth1):
        response = client.post(
            "/api/v1/todos/",
            json={"household_id": str(household.id), "title": "Simple task"},
            headers=auth1,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Simple task"
        assert data["priority"] == "medium"

    def test_create_todo_assigned_to_member(self, client, household, user1, user2, auth1):
        response = client.post(
            "/api/v1/todos/",
            json={
                "household_id": str(household.id),
                "title": "Assigned task",
                "assigned_to_id": str(user2.id),
            },
            headers=auth1,
        )
        assert response.status_code == 201
        assert response.json()["assigned_to_id"] == str(user2.id)

    def test_create_todo_assigned_to_non_member(self, client, household, user3, auth1):
        response = client.post(
            "/api/v1/todos/",
            json={
                "household_id": str(household.id),
                "title": "Bad assign",
                "assigned_to_id": str(user3.id),
            },
            headers=auth1,
        )
        assert response.status_code == 400

    def test_create_todo_non_member(self, client, household, auth3):
        response = client.post(
            "/api/v1/todos/",
            json={"household_id": str(household.id), "title": "Unauthorized"},
            headers=auth3,
        )
        assert response.status_code == 403

    def test_create_todo_no_auth(self, client, household):
        response = client.post(
            "/api/v1/todos/",
            json={"household_id": str(household.id), "title": "No auth"},
        )
        assert response.status_code in (401, 403)

    def test_create_todo_empty_title(self, client, household, auth1):
        response = client.post(
            "/api/v1/todos/",
            json={"household_id": str(household.id), "title": ""},
            headers=auth1,
        )
        assert response.status_code == 422


class TestListTodos:
    def _create_todos(self, db_session, household, user1):
        todos = []
        for i, (status, priority) in enumerate([
            (TodoStatus.PENDING, TodoPriority.HIGH),
            (TodoStatus.PENDING, TodoPriority.LOW),
            (TodoStatus.COMPLETED, TodoPriority.MEDIUM),
            (TodoStatus.IN_PROGRESS, TodoPriority.MEDIUM),
        ]):
            t = Todo(
                household_id=household.id,
                title=f"Todo {i}",
                status=status,
                priority=priority,
                created_by=user1.id,
            )
            db_session.add(t)
            todos.append(t)
        db_session.commit()
        return todos

    def test_list_todos(self, client, household, user1, auth1, db_session):
        self._create_todos(db_session, household, user1)
        response = client.get(
            f"/api/v1/todos/?household_id={household.id}", headers=auth1
        )
        assert response.status_code == 200
        assert len(response.json()) == 4

    def test_list_todos_filter_status(self, client, household, user1, auth1, db_session):
        self._create_todos(db_session, household, user1)
        response = client.get(
            f"/api/v1/todos/?household_id={household.id}&status=pending", headers=auth1
        )
        assert response.status_code == 200
        data = response.json()
        assert all(t["status"] == "pending" for t in data)

    def test_list_todos_exclude_completed(self, client, household, user1, auth1, db_session):
        self._create_todos(db_session, household, user1)
        response = client.get(
            f"/api/v1/todos/?household_id={household.id}&include_completed=false",
            headers=auth1,
        )
        assert response.status_code == 200
        data = response.json()
        assert all(t["status"] != "completed" for t in data)

    def test_list_todos_non_member(self, client, household, auth3):
        response = client.get(
            f"/api/v1/todos/?household_id={household.id}", headers=auth3
        )
        assert response.status_code == 403


class TestGetTodo:
    def test_get_todo(self, client, household, user1, auth1, db_session):
        todo = Todo(
            household_id=household.id,
            title="Detailed todo",
            description="Has details",
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        response = client.get(f"/api/v1/todos/{todo.id}", headers=auth1)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Detailed todo"
        assert data["created_by_name"] == "Alice Smith"

    def test_get_todo_not_found(self, client, auth1):
        response = client.get(f"/api/v1/todos/{uuid.uuid4()}", headers=auth1)
        assert response.status_code == 404


class TestUpdateTodo:
    def test_update_todo(self, client, household, user1, auth1, db_session):
        todo = Todo(
            household_id=household.id,
            title="Original",
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        response = client.put(
            f"/api/v1/todos/{todo.id}",
            json={"title": "Updated", "priority": "high"},
            headers=auth1,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated"
        assert response.json()["priority"] == "high"

    def test_update_todo_status_to_completed_sets_timestamp(
        self, client, household, user1, auth1, db_session
    ):
        todo = Todo(
            household_id=household.id,
            title="Complete me",
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        response = client.put(
            f"/api/v1/todos/{todo.id}",
            json={"status": "completed"},
            headers=auth1,
        )
        assert response.status_code == 200
        assert response.json()["completed_at"] is not None

    def test_update_todo_non_member(self, client, household, user1, auth3, db_session):
        todo = Todo(
            household_id=household.id,
            title="Not yours",
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        response = client.put(
            f"/api/v1/todos/{todo.id}",
            json={"title": "Hacked"},
            headers=auth3,
        )
        assert response.status_code == 403


class TestPatchTodoStatus:
    def test_patch_status(self, client, household, user1, auth1, db_session):
        todo = Todo(
            household_id=household.id,
            title="Status change",
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        response = client.patch(
            f"/api/v1/todos/{todo.id}/status",
            json={"status": "in_progress"},
            headers=auth1,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "in_progress"

    def test_patch_status_complete_and_reopen(
        self, client, household, user1, auth1, db_session
    ):
        todo = Todo(
            household_id=household.id,
            title="Toggle",
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        # Complete
        r1 = client.patch(
            f"/api/v1/todos/{todo.id}/status",
            json={"status": "completed"},
            headers=auth1,
        )
        assert r1.json()["completed_at"] is not None

        # Re-open
        r2 = client.patch(
            f"/api/v1/todos/{todo.id}/status",
            json={"status": "pending"},
            headers=auth1,
        )
        assert r2.json()["completed_at"] is None


class TestDeleteTodo:
    def test_delete_todo(self, client, household, user1, auth1, db_session):
        todo = Todo(
            household_id=household.id,
            title="Delete me",
            created_by=user1.id,
        )
        db_session.add(todo)
        db_session.commit()
        db_session.refresh(todo)

        response = client.delete(f"/api/v1/todos/{todo.id}", headers=auth1)
        assert response.status_code == 204

    def test_delete_todo_not_found(self, client, auth1):
        response = client.delete(f"/api/v1/todos/{uuid.uuid4()}", headers=auth1)
        assert response.status_code == 404


class TestTodoStats:
    def test_todo_stats(self, client, household, user1, auth1, db_session):
        for s in [TodoStatus.PENDING, TodoStatus.PENDING, TodoStatus.COMPLETED]:
            db_session.add(
                Todo(
                    household_id=household.id,
                    title=f"Stat {s}",
                    status=s,
                    created_by=user1.id,
                )
            )
        db_session.commit()

        response = client.get(
            f"/api/v1/todos/household/{household.id}/stats", headers=auth1
        )
        assert response.status_code == 200
        data = response.json()
        assert data["pending"] == 2
        assert data["completed"] == 1
        assert data["total"] == 3
