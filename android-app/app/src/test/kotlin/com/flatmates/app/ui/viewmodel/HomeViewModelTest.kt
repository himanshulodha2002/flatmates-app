package com.flatmates.app.ui.viewmodel

import app.cash.turbine.test
import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.ShoppingListStatus
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.ShoppingRepository
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.domain.util.Result
import com.flatmates.app.ui.screens.home.HomeViewModel
import com.google.common.truth.Truth.assertThat
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.*
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class HomeViewModelTest {
    
    private lateinit var householdRepository: HouseholdRepository
    private lateinit var todoRepository: TodoRepository
    private lateinit var shoppingRepository: ShoppingRepository
    private lateinit var expenseRepository: ExpenseRepository
    private lateinit var viewModel: HomeViewModel
    
    private val testDispatcher = StandardTestDispatcher()
    private val testHouseholdId = "household-123"
    private val now: Instant = Clock.System.now()
    private val today: LocalDate = now.toLocalDateTime(TimeZone.currentSystemDefault()).date
    
    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        householdRepository = mockk()
        todoRepository = mockk()
        shoppingRepository = mockk()
        expenseRepository = mockk()
        
        // Default mocks
        coEvery { householdRepository.getActiveHousehold() } returns flowOf(
            Household(id = testHouseholdId, name = "Test House", createdBy = "user-1", createdAt = now)
        )
        coEvery { todoRepository.getOverdueTodos(testHouseholdId) } returns flowOf(emptyList())
        coEvery { todoRepository.getTodosForDate(testHouseholdId, any()) } returns flowOf(emptyList())
        coEvery { shoppingRepository.getShoppingLists(testHouseholdId) } returns flowOf(emptyList())
    }
    
    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }
    
    @Test
    fun `initial state loads household name`() = runTest {
        // When
        viewModel = HomeViewModel(householdRepository, todoRepository, shoppingRepository, expenseRepository)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state.householdName).isEqualTo("Test House")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `loads overdue todos`() = runTest {
        // Given
        val overdueTodos = listOf(createTodo("1", "Overdue Task"))
        coEvery { todoRepository.getOverdueTodos(testHouseholdId) } returns flowOf(overdueTodos)
        
        // When
        viewModel = HomeViewModel(householdRepository, todoRepository, shoppingRepository, expenseRepository)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state.overdueTodos).hasSize(1)
            assertThat(state.overdueTodos[0].title).isEqualTo("Overdue Task")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `loads today's todos`() = runTest {
        // Given
        val todayTodos = listOf(createTodo("1", "Today's Task"))
        coEvery { todoRepository.getTodosForDate(testHouseholdId, any()) } returns flowOf(todayTodos)
        
        // When
        viewModel = HomeViewModel(householdRepository, todoRepository, shoppingRepository, expenseRepository)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state.todaysTodos).hasSize(1)
            assertThat(state.todaysTodos[0].title).isEqualTo("Today's Task")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `completeTodo calls repository`() = runTest {
        // Given
        coEvery { todoRepository.completeTodo(any()) } returns Result.Success(
            createTodo("1", "Task", status = TodoStatus.COMPLETED)
        )
        
        viewModel = HomeViewModel(householdRepository, todoRepository, shoppingRepository, expenseRepository)
        advanceUntilIdle()
        
        // When
        viewModel.completeTodo("todo-1")
        advanceUntilIdle()
        
        // Then
        coVerify { todoRepository.completeTodo("todo-1") }
    }
    
    @Test
    fun `refresh reloads data`() = runTest {
        // Given
        viewModel = HomeViewModel(householdRepository, todoRepository, shoppingRepository, expenseRepository)
        advanceUntilIdle()
        
        // Reset verifications
        clearMocks(householdRepository, answers = false)
        coEvery { householdRepository.getActiveHousehold() } returns flowOf(
            Household(id = testHouseholdId, name = "Test House", createdBy = "user-1", createdAt = now)
        )
        
        // When
        viewModel.refresh()
        advanceUntilIdle()
        
        // Then - householdRepository should be called again
        coVerify { householdRepository.getActiveHousehold() }
    }
    
    @Test
    fun `loading state is updated correctly`() = runTest {
        // When
        viewModel = HomeViewModel(householdRepository, todoRepository, shoppingRepository, expenseRepository)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
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
