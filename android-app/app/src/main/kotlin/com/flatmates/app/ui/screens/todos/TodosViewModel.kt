package com.flatmates.app.ui.screens.todos

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.repository.HouseholdRepository
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
import java.util.UUID
import javax.inject.Inject

/**
 * Filter options for the todos list.
 */
enum class TodoFilter {
    ALL, PENDING, COMPLETED, TODAY, OVERDUE
}

/**
 * UI State for the Todos screen.
 */
data class TodosUiState(
    val todos: List<Todo> = emptyList(),
    val filter: TodoFilter = TodoFilter.ALL,
    val isLoading: Boolean = true,
    val error: String? = null,
    val showAddSheet: Boolean = false
)

/**
 * ViewModel for the Todos screen.
 * Manages todo list, filtering, and CRUD operations.
 */
@HiltViewModel
class TodosViewModel @Inject constructor(
    private val householdRepository: HouseholdRepository,
    private val todoRepository: TodoRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(TodosUiState())
    val uiState: StateFlow<TodosUiState> = _uiState.asStateFlow()
    
    private var currentHouseholdId: String? = null
    private var allTodos: List<Todo> = emptyList()
    
    init {
        loadTodos()
    }
    
    private fun loadTodos() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            try {
                householdRepository.getActiveHousehold()
                    .filterNotNull()
                    .collectLatest { household ->
                        currentHouseholdId = household.id
                        todoRepository.getTodos(household.id)
                            .collect { todos ->
                                allTodos = todos
                                _uiState.update {
                                    it.copy(
                                        todos = filterTodos(todos, it.filter),
                                        isLoading = false
                                    )
                                }
                            }
                    }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "Failed to load todos"
                    ) 
                }
            }
        }
    }
    
    /**
     * Set the current filter and update the displayed todos.
     */
    fun setFilter(filter: TodoFilter) {
        _uiState.update {
            it.copy(
                filter = filter,
                todos = filterTodos(allTodos, filter)
            )
        }
    }
    
    private fun filterTodos(todos: List<Todo>, filter: TodoFilter): List<Todo> {
        val today = Clock.System.now()
            .toLocalDateTime(TimeZone.currentSystemDefault())
            .date
            
        return when (filter) {
            TodoFilter.ALL -> todos
            TodoFilter.PENDING -> todos.filter { it.status == TodoStatus.PENDING }
            TodoFilter.COMPLETED -> todos.filter { it.status == TodoStatus.COMPLETED }
            TodoFilter.TODAY -> todos.filter { it.dueDate == today }
            TodoFilter.OVERDUE -> todos.filter { 
                it.dueDate != null && it.dueDate < today && it.status != TodoStatus.COMPLETED 
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
     * Create a new todo.
     */
    fun createTodo(
        title: String,
        description: String?,
        priority: TodoPriority,
        dueDate: LocalDate?
    ) {
        viewModelScope.launch {
            val householdId = currentHouseholdId ?: return@launch
            val now = Clock.System.now()
            
            val todo = Todo(
                id = UUID.randomUUID().toString(),
                householdId = householdId,
                title = title,
                description = description,
                status = TodoStatus.PENDING,
                priority = priority,
                dueDate = dueDate,
                assignedToId = null,
                createdBy = "", // Will be set from user context
                createdAt = now,
                updatedAt = now
            )
            
            todoRepository.createTodo(todo)
            _uiState.update { it.copy(showAddSheet = false) }
        }
    }
    
    /**
     * Delete a todo.
     */
    fun deleteTodo(todoId: String) {
        viewModelScope.launch {
            todoRepository.deleteTodo(todoId)
        }
    }
    
    /**
     * Show the add todo bottom sheet.
     */
    fun showAddSheet() {
        _uiState.update { it.copy(showAddSheet = true) }
    }
    
    /**
     * Hide the add todo bottom sheet.
     */
    fun hideAddSheet() {
        _uiState.update { it.copy(showAddSheet = false) }
    }
}
