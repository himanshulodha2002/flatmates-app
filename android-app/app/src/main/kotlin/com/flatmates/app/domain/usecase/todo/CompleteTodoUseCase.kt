package com.flatmates.app.domain.usecase.todo

import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.domain.util.Result
import javax.inject.Inject

class CompleteTodoUseCase @Inject constructor(
    private val todoRepository: TodoRepository
) {
    suspend operator fun invoke(todoId: String): Result<Todo> {
        return todoRepository.completeTodo(todoId)
    }
}
