package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.LocalDate

interface TodoRepository {
    fun getTodos(householdId: String): Flow<List<Todo>>
    fun getTodosByStatus(householdId: String, status: TodoStatus): Flow<List<Todo>>
    fun getTodosForDate(householdId: String, date: LocalDate): Flow<List<Todo>>
    fun getOverdueTodos(householdId: String): Flow<List<Todo>>
    fun getTodoById(todoId: String): Flow<Todo?>
    
    suspend fun createTodo(todo: Todo): Result<Todo>
    suspend fun updateTodo(todo: Todo): Result<Todo>
    suspend fun completeTodo(todoId: String): Result<Todo>
    suspend fun deleteTodo(todoId: String): Result<Unit>
}
