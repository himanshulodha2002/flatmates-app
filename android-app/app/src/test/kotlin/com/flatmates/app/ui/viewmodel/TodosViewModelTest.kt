package com.flatmates.app.ui.viewmodel

import app.cash.turbine.test
import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.ui.screens.todos.TodoFilter
import com.flatmates.app.ui.screens.todos.TodosViewModel
import com.flatmates.app.domain.util.Result
import com.google.common.truth.Truth.assertThat
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.*
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class TodosViewModelTest {
    
    private lateinit var householdRepository: HouseholdRepository
    private lateinit var todoRepository: TodoRepository
    private lateinit var viewModel: TodosViewModel
    
    private val testDispatcher = StandardTestDispatcher()
    private val testHouseholdId = "household-123"
    private val now: Instant = Clock.System.now()
    
    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        householdRepository = mockk()
        todoRepository = mockk()
        
        // Default mocks
        coEvery { householdRepository.getActiveHousehold() } returns flowOf(
            Household(id = testHouseholdId, name = "Test House", createdBy = "user-1", createdAt = now)
        )
        coEvery { todoRepository.getTodos(testHouseholdId) } returns flowOf(emptyList())
    }
    
    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }
    
    @Test
    fun `initial state shows loading then todos`() = runTest {
        // Given
        val todos = listOf(createTodo("1", "Task 1"))
        coEvery { todoRepository.getTodos(testHouseholdId) } returns flowOf(todos)
        
        // When
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state.isLoading).isFalse()
            assertThat(state.todos).hasSize(1)
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `setFilter to COMPLETED filters todos correctly`() = runTest {
        // Given
        val todos = listOf(
            createTodo("1", "Pending Task", status = TodoStatus.PENDING),
            createTodo("2", "Completed Task", status = TodoStatus.COMPLETED)
        )
        coEvery { todoRepository.getTodos(testHouseholdId) } returns flowOf(todos)
        
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // When
        viewModel.setFilter(TodoFilter.COMPLETED)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state.filter).isEqualTo(TodoFilter.COMPLETED)
            assertThat(state.todos).hasSize(1)
            assertThat(state.todos[0].title).isEqualTo("Completed Task")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `setFilter to PENDING filters todos correctly`() = runTest {
        // Given
        val todos = listOf(
            createTodo("1", "Pending Task", status = TodoStatus.PENDING),
            createTodo("2", "Completed Task", status = TodoStatus.COMPLETED)
        )
        coEvery { todoRepository.getTodos(testHouseholdId) } returns flowOf(todos)
        
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // When
        viewModel.setFilter(TodoFilter.PENDING)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state.filter).isEqualTo(TodoFilter.PENDING)
            assertThat(state.todos).hasSize(1)
            assertThat(state.todos[0].title).isEqualTo("Pending Task")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `setFilter to ALL shows all todos`() = runTest {
        // Given
        val todos = listOf(
            createTodo("1", "Pending Task", status = TodoStatus.PENDING),
            createTodo("2", "Completed Task", status = TodoStatus.COMPLETED)
        )
        coEvery { todoRepository.getTodos(testHouseholdId) } returns flowOf(todos)
        
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // Set filter to completed first
        viewModel.setFilter(TodoFilter.COMPLETED)
        advanceUntilIdle()
        
        // When - set back to ALL
        viewModel.setFilter(TodoFilter.ALL)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state.filter).isEqualTo(TodoFilter.ALL)
            assertThat(state.todos).hasSize(2)
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `completeTodo calls repository`() = runTest {
        // Given
        coEvery { todoRepository.completeTodo(any()) } returns Result.Success(
            createTodo("1", "Task", status = TodoStatus.COMPLETED)
        )
        
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // When
        viewModel.completeTodo("todo-1")
        advanceUntilIdle()
        
        // Then
        coVerify { todoRepository.completeTodo("todo-1") }
    }
    
    @Test
    fun `deleteTodo calls repository`() = runTest {
        // Given
        coEvery { todoRepository.deleteTodo(any()) } returns Result.Success(Unit)
        
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // When
        viewModel.deleteTodo("todo-1")
        advanceUntilIdle()
        
        // Then
        coVerify { todoRepository.deleteTodo("todo-1") }
    }
    
    @Test
    fun `showAddSheet updates state`() = runTest {
        // Given
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // When
        viewModel.showAddSheet()
        
        // Then
        viewModel.uiState.test {
            assertThat(awaitItem().showAddSheet).isTrue()
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `hideAddSheet updates state`() = runTest {
        // Given
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        viewModel.showAddSheet()
        
        // When
        viewModel.hideAddSheet()
        
        // Then
        viewModel.uiState.test {
            assertThat(awaitItem().showAddSheet).isFalse()
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `empty todos list shows correctly`() = runTest {
        // Given
        coEvery { todoRepository.getTodos(testHouseholdId) } returns flowOf(emptyList())
        
        // When
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state.todos).isEmpty()
            assertThat(state.isLoading).isFalse()
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    private fun createTodo(
        id: String,
        title: String,
        status: TodoStatus = TodoStatus.PENDING
    ) = Todo(
        id = id,
        householdId = testHouseholdId,
        title = title,
        status = status,
        priority = TodoPriority.MEDIUM,
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
}
