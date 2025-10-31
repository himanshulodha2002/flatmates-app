# Todos API Documentation

## Overview

The Todos API provides endpoints for managing collaborative todo lists within households. Users can create todo lists, add items, assign tasks, set priorities and due dates, and track completion status.

## Prerequisites

- User must be authenticated with a valid JWT token
- User must be a member of a household to access todos endpoints

## Base URL

```
/api/v1/todos
```

## Endpoints

### 1. Create Todo List

Create a new todo list for the current user's household.

**Endpoint:** `POST /lists`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "Weekly Tasks"
}
```

**Response:** `201 Created`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "household_id": "123e4567-e89b-12d3-a456-426614174001",
  "name": "Weekly Tasks",
  "created_by": "123e4567-e89b-12d3-a456-426614174002",
  "created_at": "2025-10-31T22:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - User is not a member of any household
- `401 Unauthorized` - Invalid or missing authentication token

---

### 2. Get All Todo Lists

Retrieve all todo lists for the current user's household.

**Endpoint:** `GET /lists`

**Authentication:** Required

**Response:** `200 OK`
```json
[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "household_id": "123e4567-e89b-12d3-a456-426614174001",
    "name": "Weekly Tasks",
    "created_by": "123e4567-e89b-12d3-a456-426614174002",
    "created_at": "2025-10-31T22:00:00Z",
    "items": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174003",
        "list_id": "123e4567-e89b-12d3-a456-426614174000",
        "title": "Buy groceries",
        "description": "Get milk, eggs, and bread",
        "due_date": "2025-11-01T12:00:00Z",
        "priority": "high",
        "assigned_user_id": "123e4567-e89b-12d3-a456-426614174002",
        "is_completed": false,
        "completed_at": null,
        "created_at": "2025-10-31T22:00:00Z",
        "updated_at": "2025-10-31T22:00:00Z"
      }
    ]
  }
]
```

**Error Responses:**
- `404 Not Found` - User is not a member of any household
- `401 Unauthorized` - Invalid or missing authentication token

---

### 3. Get Todo List by ID

Retrieve a specific todo list with all its items.

**Endpoint:** `GET /lists/{list_id}`

**Authentication:** Required

**Path Parameters:**
- `list_id` (UUID) - The ID of the todo list

**Response:** `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "household_id": "123e4567-e89b-12d3-a456-426614174001",
  "name": "Weekly Tasks",
  "created_by": "123e4567-e89b-12d3-a456-426614174002",
  "created_at": "2025-10-31T22:00:00Z",
  "items": [...]
}
```

**Error Responses:**
- `404 Not Found` - Todo list not found or doesn't belong to user's household
- `401 Unauthorized` - Invalid or missing authentication token

---

### 4. Create Todo Item

Create a new todo item in a specific list.

**Endpoint:** `POST /lists/{list_id}/items`

**Authentication:** Required

**Path Parameters:**
- `list_id` (UUID) - The ID of the todo list

**Request Body:**
```json
{
  "title": "Buy groceries",
  "description": "Get milk, eggs, and bread",
  "due_date": "2025-11-01T12:00:00Z",
  "priority": "high",
  "assigned_user_id": "123e4567-e89b-12d3-a456-426614174002"
}
```

**Field Details:**
- `title` (string, required) - The title of the todo item
- `description` (string, optional) - Detailed description of the task
- `due_date` (ISO 8601 datetime, optional) - When the task is due
- `priority` (enum, optional) - Priority level: `low`, `medium`, or `high`. Default: `medium`
- `assigned_user_id` (UUID, optional) - User assigned to the task (must be household member)

**Response:** `201 Created`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "list_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Buy groceries",
  "description": "Get milk, eggs, and bread",
  "due_date": "2025-11-01T12:00:00Z",
  "priority": "high",
  "assigned_user_id": "123e4567-e89b-12d3-a456-426614174002",
  "is_completed": false,
  "completed_at": null,
  "created_at": "2025-10-31T22:00:00Z",
  "updated_at": "2025-10-31T22:00:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Todo list not found
- `400 Bad Request` - Assigned user is not a member of the household
- `401 Unauthorized` - Invalid or missing authentication token

---

### 5. Update Todo Item

Update a todo item's details or toggle its completion status.

**Endpoint:** `PATCH /items/{item_id}`

**Authentication:** Required

**Path Parameters:**
- `item_id` (UUID) - The ID of the todo item

**Request Body:** (all fields optional)
```json
{
  "title": "Buy groceries and snacks",
  "description": "Updated description",
  "due_date": "2025-11-02T12:00:00Z",
  "priority": "medium",
  "assigned_user_id": "123e4567-e89b-12d3-a456-426614174002",
  "is_completed": true
}
```

**Permissions:**
- Assignee can toggle `is_completed`
- List creator can update any field
- Household owner can update any field

**Response:** `200 OK`
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174003",
  "list_id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Buy groceries and snacks",
  "description": "Updated description",
  "due_date": "2025-11-02T12:00:00Z",
  "priority": "medium",
  "assigned_user_id": "123e4567-e89b-12d3-a456-426614174002",
  "is_completed": true,
  "completed_at": "2025-10-31T22:30:00Z",
  "created_at": "2025-10-31T22:00:00Z",
  "updated_at": "2025-10-31T22:30:00Z"
}
```

**Error Responses:**
- `404 Not Found` - Todo item not found
- `403 Forbidden` - User doesn't have permission to update the item
- `400 Bad Request` - Assigned user is not a member of the household
- `401 Unauthorized` - Invalid or missing authentication token

---

### 6. Delete Todo Item

Delete a todo item from a list.

**Endpoint:** `DELETE /items/{item_id}`

**Authentication:** Required

**Path Parameters:**
- `item_id` (UUID) - The ID of the todo item

**Permissions:**
- Only the list creator or household owner can delete items

**Response:** `204 No Content`

**Error Responses:**
- `404 Not Found` - Todo item not found
- `403 Forbidden` - Only list creator or household owner can delete items
- `401 Unauthorized` - Invalid or missing authentication token

---

## Data Models

### TodoList

```typescript
{
  id: UUID;
  household_id: UUID;
  name: string;
  created_by: UUID;
  created_at: datetime;
  items?: TodoItem[];
}
```

### TodoItem

```typescript
{
  id: UUID;
  list_id: UUID;
  title: string;
  description?: string;
  due_date?: datetime;
  priority: 'low' | 'medium' | 'high';
  assigned_user_id?: UUID;
  is_completed: boolean;
  completed_at?: datetime;
  created_at: datetime;
  updated_at: datetime;
}
```

## Priority Levels

- **low** - Tasks that can be done when time permits
- **medium** - Standard priority tasks (default)
- **high** - Urgent tasks that need immediate attention

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Examples

### Creating a Complete Todo Workflow

1. **Create a todo list:**
```bash
curl -X POST http://localhost:8000/api/v1/todos/lists \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Household Chores"}'
```

2. **Add a todo item:**
```bash
curl -X POST http://localhost:8000/api/v1/todos/lists/{list_id}/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Clean kitchen",
    "priority": "high",
    "due_date": "2025-11-01T18:00:00Z"
  }'
```

3. **Mark item as complete:**
```bash
curl -X PATCH http://localhost:8000/api/v1/todos/items/{item_id} \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_completed": true}'
```

4. **Delete completed item:**
```bash
curl -X DELETE http://localhost:8000/api/v1/todos/items/{item_id} \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Error Handling

All errors follow the standard FastAPI error format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content (successful deletion)
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `422` - Validation Error (invalid data format)
