package com.flatmates.app.data.local

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import app.cash.turbine.test
import com.flatmates.app.data.local.dao.HouseholdDao
import com.flatmates.app.data.local.dao.TodoDao
import com.flatmates.app.data.local.database.FlatmatesDatabase
import com.flatmates.app.data.local.entity.HouseholdEntity
import com.flatmates.app.data.local.entity.TodoEntity
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TodoDaoTest {
    
    private lateinit var database: FlatmatesDatabase
    private lateinit var todoDao: TodoDao
    private lateinit var householdDao: HouseholdDao
    
    private val testHouseholdId = "test-household"
    private val now: Instant = Clock.System.now()
    
    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, FlatmatesDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        todoDao = database.todoDao()
        householdDao = database.householdDao()
        
        // Insert required household first (foreign key)
        runTest {
            householdDao.insertHousehold(
                HouseholdEntity(
                    id = testHouseholdId,
                    name = "Test Household",
                    createdBy = "user-1",
                    createdAt = now
                )
            )
        }
    }
    
    @After
    fun tearDown() {
        database.close()
    }
    
    @Test
    fun insertAndRetrieveTodo() = runTest {
        // Given
        val todo = createTodoEntity("1", "Test Task")
        
        // When
        todoDao.insert(todo)
        
        // Then
        todoDao.getTodosByHousehold(testHouseholdId).test {
            val todos = awaitItem()
            assertThat(todos).hasSize(1)
            assertThat(todos[0].title).isEqualTo("Test Task")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun insertMultipleTodos() = runTest {
        // Given
        val todo1 = createTodoEntity("1", "Task 1")
        val todo2 = createTodoEntity("2", "Task 2")
        val todo3 = createTodoEntity("3", "Task 3")
        
        // When
        todoDao.insertAll(listOf(todo1, todo2, todo3))
        
        // Then
        todoDao.getTodosByHousehold(testHouseholdId).test {
            val todos = awaitItem()
            assertThat(todos).hasSize(3)
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun filterByStatus() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Pending", status = "PENDING"))
        todoDao.insert(createTodoEntity("2", "Completed", status = "COMPLETED"))
        
        // When/Then
        todoDao.getTodosByStatus(testHouseholdId, "PENDING").test {
            val todos = awaitItem()
            assertThat(todos).hasSize(1)
            assertThat(todos[0].title).isEqualTo("Pending")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun pendingDeleteTodosAreFiltered() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Visible"))
        todoDao.insert(createTodoEntity("2", "Deleted", syncStatus = "PENDING_DELETE"))
        
        // When/Then
        todoDao.getTodosByHousehold(testHouseholdId).test {
            val todos = awaitItem()
            assertThat(todos).hasSize(1)
            assertThat(todos[0].title).isEqualTo("Visible")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun updateSyncStatus() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Task", syncStatus = "PENDING_CREATE"))
        
        // When
        todoDao.updateSyncStatus("1", "SYNCED")
        
        // Then
        todoDao.getTodoById("1").test {
            val todo = awaitItem()
            assertThat(todo?.syncStatus).isEqualTo("SYNCED")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun getPendingSyncTodosReturnsUnsynced() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Synced", syncStatus = "SYNCED"))
        todoDao.insert(createTodoEntity("2", "Pending", syncStatus = "PENDING_CREATE"))
        todoDao.insert(createTodoEntity("3", "Updating", syncStatus = "PENDING_UPDATE"))
        
        // When
        val pending = todoDao.getPendingSyncTodos()
        
        // Then
        assertThat(pending).hasSize(2)
        assertThat(pending.map { it.id }).containsExactly("2", "3")
    }
    
    @Test
    fun deleteTodo() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Task"))
        
        // When
        todoDao.delete("1")
        
        // Then
        todoDao.getTodosByHousehold(testHouseholdId).test {
            assertThat(awaitItem()).isEmpty()
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun updateTodo() = runTest {
        // Given
        val original = createTodoEntity("1", "Original Title")
        todoDao.insert(original)
        
        // When
        val updated = original.copy(title = "Updated Title")
        todoDao.update(updated)
        
        // Then
        todoDao.getTodoById("1").test {
            val todo = awaitItem()
            assertThat(todo?.title).isEqualTo("Updated Title")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun getTodoByIdReturnsCorrectTodo() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Task 1"))
        todoDao.insert(createTodoEntity("2", "Task 2"))
        
        // When/Then
        todoDao.getTodoById("2").test {
            val todo = awaitItem()
            assertThat(todo?.id).isEqualTo("2")
            assertThat(todo?.title).isEqualTo("Task 2")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun getTodoByIdReturnsNullForNonExistent() = runTest {
        // Given - no todos inserted
        
        // When/Then
        todoDao.getTodoById("non-existent").test {
            val todo = awaitItem()
            assertThat(todo).isNull()
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun deleteAllForHousehold() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Task 1"))
        todoDao.insert(createTodoEntity("2", "Task 2"))
        
        // When
        todoDao.deleteAllForHousehold(testHouseholdId)
        
        // Then
        todoDao.getTodosByHousehold(testHouseholdId).test {
            assertThat(awaitItem()).isEmpty()
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    private fun createTodoEntity(
        id: String,
        title: String,
        status: String = "PENDING",
        syncStatus: String = "SYNCED"
    ) = TodoEntity(
        id = id,
        householdId = testHouseholdId,
        title = title,
        status = status,
        priority = "MEDIUM",
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now,
        syncStatus = syncStatus
    )
}
