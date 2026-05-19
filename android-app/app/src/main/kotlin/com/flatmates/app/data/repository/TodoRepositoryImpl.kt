package com.flatmates.app.data.repository

import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.dao.TodoDao
import com.flatmates.app.data.local.entity.SyncQueueEntity
import com.flatmates.app.data.mapper.toDomain
import com.flatmates.app.data.mapper.toDomainList
import com.flatmates.app.data.mapper.toEntity
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject

class TodoRepositoryImpl @Inject constructor(
    private val todoDao: TodoDao,
    private val syncQueueDao: SyncQueueDao,
    private val json: Json
) : TodoRepository {
    
    override fun getTodos(householdId: String): Flow<List<Todo>> =
        todoDao.getTodosByHousehold(householdId).map { it.toDomainList() }
    
    override fun getTodosByStatus(householdId: String, status: TodoStatus): Flow<List<Todo>> =
        todoDao.getTodosByStatus(householdId, status.name).map { it.toDomainList() }
    
    override fun getTodosForDate(householdId: String, date: LocalDate): Flow<List<Todo>> =
        todoDao.getTodosForDate(householdId, date).map { it.toDomainList() }
    
    override fun getOverdueTodos(householdId: String): Flow<List<Todo>> {
        val today = Clock.System.now()
            .toLocalDateTime(TimeZone.currentSystemDefault())
            .date
        return todoDao.getOverdueTodos(householdId, today).map { it.toDomainList() }
    }
    
    override fun getTodoById(todoId: String): Flow<Todo?> =
        todoDao.getTodoById(todoId).map { it?.toDomain() }
    
    override suspend fun createTodo(todo: Todo): Result<Todo> {
        return try {
            val entity = todo.toEntity(
                syncStatus = "PENDING_CREATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            todoDao.insert(entity)
            
            // Add to sync queue
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "todo",
                entityId = todo.id,
                operation = "CREATE",
                payload = serializeTodoEntity(entity)
            ))
            
            Result.Success(entity.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to create todo")
        }
    }
    
    override suspend fun updateTodo(todo: Todo): Result<Todo> {
        return try {
            val now = Clock.System.now()
            val updated = todo.copy(updatedAt = now)
            val entity = updated.toEntity(
                syncStatus = "PENDING_UPDATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            todoDao.update(entity)
            
            // Update sync queue
            syncQueueDao.removeByEntity(todo.id, "todo")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "todo",
                entityId = todo.id,
                operation = "UPDATE",
                payload = serializeTodoEntity(entity)
            ))
            
            Result.Success(entity.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to update todo")
        }
    }
    
    override suspend fun completeTodo(todoId: String): Result<Todo> {
        return try {
            val entity = todoDao.getTodoByIdOnce(todoId)
                ?: return Result.Error(message = "Todo not found")
            
            val now = Clock.System.now()
            val updated = entity.copy(
                status = "COMPLETED",
                completedAt = now,
                updatedAt = now,
                syncStatus = "PENDING_UPDATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            todoDao.update(updated)
            
            syncQueueDao.removeByEntity(todoId, "todo")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "todo",
                entityId = todoId,
                operation = "UPDATE",
                payload = serializeTodoEntity(updated)
            ))
            
            Result.Success(updated.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to complete todo")
        }
    }
    
    override suspend fun deleteTodo(todoId: String): Result<Unit> {
        return try {
            todoDao.updateSyncStatus(todoId, "PENDING_DELETE")
            
            syncQueueDao.removeByEntity(todoId, "todo")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "todo",
                entityId = todoId,
                operation = "DELETE",
                payload = todoId
            ))
            
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to delete todo")
        }
    }
    
    // Helper to serialize entity to JSON
    private fun serializeTodoEntity(entity: com.flatmates.app.data.local.entity.TodoEntity): String {
        // Create a simple map for JSON serialization
        return buildString {
            append("{")
            append("\"id\":\"${entity.id}\",")
            append("\"householdId\":\"${entity.householdId}\",")
            append("\"title\":\"${entity.title}\",")
            entity.description?.let { append("\"description\":\"$it\",") }
            append("\"status\":\"${entity.status}\",")
            append("\"priority\":\"${entity.priority}\",")
            entity.dueDate?.let { append("\"dueDate\":\"$it\",") }
            entity.assignedToId?.let { append("\"assignedToId\":\"$it\",") }
            append("\"createdBy\":\"${entity.createdBy}\",")
            append("\"createdAt\":${entity.createdAt.toEpochMilliseconds()},")
            append("\"updatedAt\":${entity.updatedAt.toEpochMilliseconds()}")
            append("}")
        }
    }
}
