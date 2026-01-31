package com.flatmates.app.domain.usecase.todo

import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.domain.util.Result
import kotlinx.datetime.Clock
import javax.inject.Inject

class UpdateTodoUseCase @Inject constructor(
    private val todoRepository: TodoRepository
) {
    suspend operator fun invoke(todo: Todo): Result<Todo> {
        val updatedTodo = todo.copy(
            title = todo.title.trim(),
            description = todo.description?.trim(),
            updatedAt = Clock.System.now()
        )
        return todoRepository.updateTodo(updatedTodo)
    }
}
