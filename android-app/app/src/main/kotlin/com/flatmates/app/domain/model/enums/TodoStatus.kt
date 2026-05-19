package com.flatmates.app.domain.model.enums

enum class TodoStatus {
    PENDING,
    IN_PROGRESS,
    COMPLETED;
    
    companion object {
        fun fromString(value: String): TodoStatus = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: PENDING
    }
}
