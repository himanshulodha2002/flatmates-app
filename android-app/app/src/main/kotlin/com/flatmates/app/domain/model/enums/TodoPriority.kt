package com.flatmates.app.domain.model.enums

enum class TodoPriority {
    LOW,
    MEDIUM,
    HIGH;
    
    companion object {
        fun fromString(value: String): TodoPriority = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: MEDIUM
    }
}
