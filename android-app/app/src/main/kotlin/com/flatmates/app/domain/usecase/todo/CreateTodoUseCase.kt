package com.flatmates.app.domain.usecase.todo

import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.domain.util.Result
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import java.util.UUID
import javax.inject.Inject

data class CreateTodoParams(
    val householdId: String,
    val title: String,
    val description: String? = null,
    val priority: TodoPriority = TodoPriority.MEDIUM,
    val dueDate: LocalDate? = null,
    val assignedToId: String? = null,
    val createdBy: String
)

class CreateTodoUseCase @Inject constructor(
    private val todoRepository: TodoRepository
) {
    suspend operator fun invoke(params: CreateTodoParams): Result<Todo> {
        val now = Clock.System.now()
        
        val todo = Todo(
            id = UUID.randomUUID().toString(),
            householdId = params.householdId,
            title = params.title.trim(),
            description = params.description?.trim(),
            status = TodoStatus.PENDING,
            priority = params.priority,
            dueDate = params.dueDate,
            assignedToId = params.assignedToId,
            createdBy = params.createdBy,
            createdAt = now,
            updatedAt = now
        )
        
        return todoRepository.createTodo(todo)
    }
}
