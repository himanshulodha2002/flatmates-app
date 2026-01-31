package com.flatmates.app.domain.model

import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

data class Todo(
    val id: String,
    val householdId: String,
    val title: String,
    val description: String? = null,
    val status: TodoStatus = TodoStatus.PENDING,
    val priority: TodoPriority = TodoPriority.MEDIUM,
    val dueDate: LocalDate? = null,
    val assignedToId: String? = null,
    val createdBy: String,
    val recurringPattern: String? = null,
    val recurringUntil: LocalDate? = null,
    val completedAt: Instant? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Denormalized info for display
    val assignedToName: String? = null,
    val createdByName: String? = null
) {
    val isCompleted: Boolean get() = status == TodoStatus.COMPLETED
    
    val isOverdue: Boolean get() {
        if (isCompleted) return false
        val today = Clock.System.now()
            .toLocalDateTime(TimeZone.currentSystemDefault())
            .date
        return dueDate?.let { it < today } ?: false
    }
    
    val isDueToday: Boolean get() {
        val today = Clock.System.now()
            .toLocalDateTime(TimeZone.currentSystemDefault())
            .date
        return dueDate == today
    }
    
    val isRecurring: Boolean get() = recurringPattern != null
}
