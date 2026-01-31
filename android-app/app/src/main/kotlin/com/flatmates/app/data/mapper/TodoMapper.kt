package com.flatmates.app.data.mapper

import com.flatmates.app.data.local.entity.TodoEntity
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus

fun TodoEntity.toDomain(): Todo = Todo(
    id = id,
    householdId = householdId,
    title = title,
    description = description,
    status = TodoStatus.fromString(status),
    priority = TodoPriority.fromString(priority),
    dueDate = dueDate,
    assignedToId = assignedToId,
    createdBy = createdBy,
    recurringPattern = recurringPattern,
    recurringUntil = recurringUntil,
    completedAt = completedAt,
    createdAt = createdAt,
    updatedAt = updatedAt,
    assignedToName = assignedToName,
    createdByName = createdByName
)

fun Todo.toEntity(
    syncStatus: String = "SYNCED",
    lastModifiedLocally: Long? = null
): TodoEntity = TodoEntity(
    id = id,
    householdId = householdId,
    title = title,
    description = description,
    status = status.name,
    priority = priority.name,
    dueDate = dueDate,
    assignedToId = assignedToId,
    createdBy = createdBy,
    recurringPattern = recurringPattern,
    recurringUntil = recurringUntil,
    completedAt = completedAt,
    createdAt = createdAt,
    updatedAt = updatedAt,
    assignedToName = assignedToName,
    createdByName = createdByName,
    syncStatus = syncStatus,
    lastModifiedLocally = lastModifiedLocally
)

fun List<TodoEntity>.toDomainList(): List<Todo> = map { it.toDomain() }
