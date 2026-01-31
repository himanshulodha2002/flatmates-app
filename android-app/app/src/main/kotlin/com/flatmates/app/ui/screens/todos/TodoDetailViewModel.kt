package com.flatmates.app.ui.screens.todos

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.repository.TodoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI State for the Todo Detail screen.
 */
data class TodoDetailUiState(
    val todo: Todo? = null,
    val isLoading: Boolean = true,
    val error: String? = null
)

/**
 * ViewModel for the Todo Detail screen.
 */
@HiltViewModel
class TodoDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val todoRepository: TodoRepository
) : ViewModel() {
    
    private val todoId: String = savedStateHandle.get<String>("todoId") ?: ""
    
    private val _uiState = MutableStateFlow(TodoDetailUiState())
    val uiState: StateFlow<TodoDetailUiState> = _uiState.asStateFlow()
    
    init {
        loadTodo()
    }
    
    private fun loadTodo() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                todoRepository.getTodoById(todoId)
                    .collect { todo ->
                        _uiState.update { 
                            it.copy(todo = todo, isLoading = false) 
                        }
                    }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "Failed to load todo"
                    ) 
                }
            }
        }
    }
    
    /**
     * Toggle the completion status of the todo.
     */
    fun toggleComplete() {
        viewModelScope.launch {
            val currentTodo = _uiState.value.todo ?: return@launch
            
            if (currentTodo.isCompleted) {
                // If completed, we need to uncomplete - update the status
                val updatedTodo = currentTodo.copy(
                    status = com.flatmates.app.domain.model.enums.TodoStatus.PENDING,
                    completedAt = null,
                    updatedAt = kotlinx.datetime.Clock.System.now()
                )
                todoRepository.updateTodo(updatedTodo)
            } else {
                todoRepository.completeTodo(todoId)
            }
        }
    }
    
    /**
     * Delete the todo.
     */
    fun deleteTodo() {
        viewModelScope.launch {
            todoRepository.deleteTodo(todoId)
        }
    }
}
