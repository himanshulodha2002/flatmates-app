package com.flatmates.app.domain.model.enums

enum class ShoppingListStatus {
    ACTIVE,
    ARCHIVED;
    
    companion object {
        fun fromString(value: String): ShoppingListStatus = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: ACTIVE
    }
}
