package com.flatmates.app.data.repository

import app.cash.turbine.test
import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.dao.TodoDao
import com.flatmates.app.data.local.entity.TodoEntity
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.util.Result
import com.google.common.truth.Truth.assertThat
import io.mockk.*
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.serialization.json.Json
import org.junit.Before
import org.junit.Test

class TodoRepositoryTest {
    
    private lateinit var todoDao: TodoDao
    private lateinit var syncQueueDao: SyncQueueDao
    private lateinit var json: Json
    private lateinit var repository: TodoRepositoryImpl
    
    private val testHouseholdId = "household-123"
    private val now: Instant = Clock.System.now()
    
    @Before
    fun setup() {
        todoDao = mockk(relaxed = true)
        syncQueueDao = mockk(relaxed = true)
        json = Json { ignoreUnknownKeys = true }
        repository = TodoRepositoryImpl(todoDao, syncQueueDao, json)
    }
    
    @Test
    fun `getTodos returns mapped domain models`() = runTest {
        // Given
        val entities = listOf(
            createTodoEntity("1", "Task 1"),
            createTodoEntity("2", "Task 2")
        )
        coEvery { todoDao.getTodosByHousehold(testHouseholdId) } returns flowOf(entities)
        
        // When/Then
        repository.getTodos(testHouseholdId).test {
            val todos = awaitItem()
            assertThat(todos).hasSize(2)
            assertThat(todos[0].title).isEqualTo("Task 1")
            assertThat(todos[1].title).isEqualTo("Task 2")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `getTodos returns empty list when no todos exist`() = runTest {
        // Given
        coEvery { todoDao.getTodosByHousehold(testHouseholdId) } returns flowOf(emptyList())
        
        // When/Then
        repository.getTodos(testHouseholdId).test {
            val todos = awaitItem()
            assertThat(todos).isEmpty()
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `createTodo inserts entity and adds to sync queue`() = runTest {
        // Given
        val todo = createTodo("new-id", "New Task")
        
        // When
        val result = repository.createTodo(todo)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { todoDao.insert(any()) }
        coVerify { syncQueueDao.enqueue(match { it.operation == "CREATE" }) }
    }
    
    @Test
    fun `completeTodo updates status and syncs`() = runTest {
        // Given
        val todoId = "todo-123"
        val entity = createTodoEntity(todoId, "Task")
        coEvery { todoDao.getTodoByIdOnce(todoId) } returns entity
        
        // When
        val result = repository.completeTodo(todoId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { 
            todoDao.update(match { 
                it.status == "COMPLETED" && it.completedAt != null 
            }) 
        }
    }
    
    @Test
    fun `completeTodo returns error when todo not found`() = runTest {
        // Given
        val todoId = "non-existent-id"
        coEvery { todoDao.getTodoByIdOnce(todoId) } returns null
        
        // When
        val result = repository.completeTodo(todoId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Error::class.java)
        assertThat((result as Result.Error).message).isEqualTo("Todo not found")
    }
    
    @Test
    fun `deleteTodo marks as pending delete`() = runTest {
        // Given
        val todoId = "todo-123"
        
        // When
        val result = repository.deleteTodo(todoId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { todoDao.updateSyncStatus(todoId, "PENDING_DELETE") }
        coVerify { syncQueueDao.enqueue(match { it.operation == "DELETE" }) }
    }
    
    @Test
    fun `createTodo handles database error gracefully`() = runTest {
        // Given
        val todo = createTodo("new-id", "New Task")
        coEvery { todoDao.insert(any()) } throws RuntimeException("DB Error")
        
        // When
        val result = repository.createTodo(todo)
        
        // Then
        assertThat(result).isInstanceOf(Result.Error::class.java)
        assertThat((result as Result.Error).message).contains("Failed to create")
    }
    
    @Test
    fun `updateTodo updates entity and adds to sync queue`() = runTest {
        // Given
        val todo = createTodo("existing-id", "Updated Task")
        
        // When
        val result = repository.updateTodo(todo)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { todoDao.update(any()) }
        coVerify { syncQueueDao.removeByEntity("existing-id", "todo") }
        coVerify { syncQueueDao.enqueue(match { it.operation == "UPDATE" }) }
    }
    
    @Test
    fun `deleteTodo handles database error gracefully`() = runTest {
        // Given
        val todoId = "todo-123"
        coEvery { todoDao.updateSyncStatus(any(), any()) } throws RuntimeException("DB Error")
        
        // When
        val result = repository.deleteTodo(todoId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Error::class.java)
        assertThat((result as Result.Error).message).contains("Failed to delete")
    }
    
    // Helper functions
    private fun createTodoEntity(id: String, title: String) = TodoEntity(
        id = id,
        householdId = testHouseholdId,
        title = title,
        status = "PENDING",
        priority = "MEDIUM",
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
    
    private fun createTodo(id: String, title: String) = Todo(
        id = id,
        householdId = testHouseholdId,
        title = title,
        status = TodoStatus.PENDING,
        priority = TodoPriority.MEDIUM,
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
}
