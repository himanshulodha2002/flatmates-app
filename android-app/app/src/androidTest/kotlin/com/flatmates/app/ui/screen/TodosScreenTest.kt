package com.flatmates.app.ui.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.navigation.compose.rememberNavController
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.ui.screens.todos.TodoFilter
import com.flatmates.app.ui.screens.todos.TodosScreen
import com.flatmates.app.ui.screens.todos.TodosUiState
import com.flatmates.app.ui.screens.todos.TodosViewModel
import com.flatmates.app.ui.theme.FlatmatesTheme
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.junit.Rule
import org.junit.Test

class TodosScreenTest {
    
    @get:Rule
    val composeTestRule = createComposeRule()
    
    private val now: Instant = Clock.System.now()
    
    @Test
    fun displaysTodosWhenLoaded() {
        // Given
        val todos = listOf(
            createTodo("1", "Buy groceries"),
            createTodo("2", "Clean kitchen")
        )
        val viewModel = createMockViewModel(todos = todos)
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        
        // Then
        composeTestRule.onNodeWithText("Buy groceries").assertIsDisplayed()
        composeTestRule.onNodeWithText("Clean kitchen").assertIsDisplayed()
    }
    
    @Test
    fun showsEmptyStateWhenNoTodos() {
        // Given
        val viewModel = createMockViewModel(todos = emptyList())
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        
        // Then
        composeTestRule.onNodeWithText("No tasks").assertIsDisplayed()
        composeTestRule.onNodeWithText("Tap + to add a new task").assertIsDisplayed()
    }
    
    @Test
    fun showsLoadingIndicator() {
        // Given
        val viewModel = createMockViewModel(isLoading = true)
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        
        // Then - check for loading text instead of progress bar
        composeTestRule.onNodeWithText("Loading tasks...").assertIsDisplayed()
    }
    
    @Test
    fun filterChipsAreDisplayed() {
        // Given
        val viewModel = createMockViewModel()
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        
        // Then
        composeTestRule.onNodeWithText("All").assertIsDisplayed()
        composeTestRule.onNodeWithText("Pending").assertIsDisplayed()
        composeTestRule.onNodeWithText("Completed").assertIsDisplayed()
    }
    
    @Test
    fun fabOpensAddSheet() {
        // Given
        val viewModel = createMockViewModel()
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("Add task").performClick()
        
        // Then
        verify { viewModel.showAddSheet() }
    }
    
    @Test
    fun displaysTasksHeader() {
        // Given
        val viewModel = createMockViewModel()
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        
        // Then
        composeTestRule.onNodeWithText("Tasks").assertIsDisplayed()
    }
    
    @Test
    fun filterChipClickChangesFilter() {
        // Given
        val viewModel = createMockViewModel()
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        composeTestRule.onNodeWithText("Completed").performClick()
        
        // Then
        verify { viewModel.setFilter(TodoFilter.COMPLETED) }
    }
    
    private fun createMockViewModel(
        todos: List<Todo> = emptyList(),
        isLoading: Boolean = false,
        filter: TodoFilter = TodoFilter.ALL
    ): TodosViewModel {
        val viewModel = mockk<TodosViewModel>(relaxed = true)
        val uiState = MutableStateFlow(
            TodosUiState(
                todos = todos,
                filter = filter,
                isLoading = isLoading
            )
        )
        every { viewModel.uiState } returns uiState
        return viewModel
    }
    
    private fun createTodo(id: String, title: String) = Todo(
        id = id,
        householdId = "household-1",
        title = title,
        status = TodoStatus.PENDING,
        priority = TodoPriority.MEDIUM,
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
}
