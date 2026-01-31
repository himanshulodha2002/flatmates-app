package com.flatmates.app.domain.usecase.todo

import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.domain.util.Result
import javax.inject.Inject

class DeleteTodoUseCase @Inject constructor(
    private val todoRepository: TodoRepository
) {
    suspend operator fun invoke(todoId: String): Result<Unit> {
        return todoRepository.deleteTodo(todoId)
    }
}
