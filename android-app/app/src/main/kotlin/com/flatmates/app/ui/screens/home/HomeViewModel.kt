package com.flatmates.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.ShoppingRepository
import com.flatmates.app.domain.repository.TodoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import java.math.BigDecimal
import java.util.UUID
import javax.inject.Inject

/**
 * UI State for the Home screen.
 */
data class HomeUiState(
    val householdName: String = "",
    val overdueTodos: List<Todo> = emptyList(),
    val todaysTodos: List<Todo> = emptyList(),
    val shoppingItemsCount: Int = 0,
    val totalOwed: BigDecimal = BigDecimal.ZERO,
    val totalOwing: BigDecimal = BigDecimal.ZERO,
    val isLoading: Boolean = true,
    val error: String? = null,
    val pendingSyncCount: Int = 0,
    val showAddTodoSheet: Boolean = false
)

/**
 * ViewModel for the Home screen.
 * Aggregates data from multiple repositories to show an overview.
 */
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val householdRepository: HouseholdRepository,
    private val todoRepository: TodoRepository,
    private val shoppingRepository: ShoppingRepository,
    private val expenseRepository: ExpenseRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    init {
        loadHomeData()
    }
    
    private fun loadHomeData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            try {
                householdRepository.getActiveHousehold()
                    .collect { household ->
                        if (household == null) {
                            // No household yet - show empty state
                            _uiState.update { 
                                it.copy(
                                    isLoading = false,
                                    householdName = "No Household",
                                    overdueTodos = emptyList(),
                                    todaysTodos = emptyList(),
                                    shoppingItemsCount = 0
                                ) 
                            }
                            return@collect
                        }
                        
                        _uiState.update { it.copy(householdName = household.name) }
                        
                        // Load todos
                        launch {
                            todoRepository.getOverdueTodos(household.id)
                                .collect { overdue ->
                                    _uiState.update { it.copy(overdueTodos = overdue) }
                                }
                        }
                        
                        launch {
                            val today = Clock.System.now()
                                .toLocalDateTime(TimeZone.currentSystemDefault())
                                .date
                            todoRepository.getTodosForDate(household.id, today)
                                .collect { todayTodos ->
                                    _uiState.update { it.copy(todaysTodos = todayTodos) }
                                }
                        }
                        
                        // Load shopping count
                        launch {
                            shoppingRepository.getShoppingLists(household.id)
                                .collect { lists ->
                                    val count = lists.flatMap { it.items }
                                        .count { !it.isPurchased }
                                    _uiState.update { 
                                        it.copy(shoppingItemsCount = count, isLoading = false) 
                                    }
                                }
                        }
                    }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "Failed to load data"
                    ) 
                }
            }
        }
    }
    
    /**
     * Mark a todo as completed.
     */
    fun completeTodo(todoId: String) {
        viewModelScope.launch {
            todoRepository.completeTodo(todoId)
        }
    }
    
    /**
     * Refresh home screen data.
     */
    fun refresh() {
        loadHomeData()
    }
    
    /**
     * Show the add todo bottom sheet.
     */
    fun showAddTodoSheet() {
        _uiState.update { it.copy(showAddTodoSheet = true) }
    }
    
    /**
     * Hide the add todo bottom sheet.
     */
    fun hideAddTodoSheet() {
        _uiState.update { it.copy(showAddTodoSheet = false) }
    }
    
    /**
     * Create a new todo from the home screen.
     */
    fun createTodo(
        title: String,
        description: String?,
        priority: TodoPriority,
        dueDate: LocalDate?
    ) {
        viewModelScope.launch {
            val household = householdRepository.getActiveHousehold()
                .filterNotNull()
                .first()
            
            val now = Clock.System.now()
            val todo = Todo(
                id = UUID.randomUUID().toString(),
                householdId = household.id,
                title = title,
                description = description,
                status = TodoStatus.PENDING,
                priority = priority,
                dueDate = dueDate,
                assignedToId = null,
                createdBy = "",
                createdAt = now,
                updatedAt = now
            )
            
            todoRepository.createTodo(todo)
            _uiState.update { it.copy(showAddTodoSheet = false) }
        }
    }
}
