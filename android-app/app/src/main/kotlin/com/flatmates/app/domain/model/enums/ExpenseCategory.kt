package com.flatmates.app.domain.model.enums

enum class ExpenseCategory(val displayName: String) {
    GROCERIES("Groceries"),
    UTILITIES("Utilities"),
    RENT("Rent"),
    INTERNET("Internet"),
    CLEANING("Cleaning"),
    MAINTENANCE("Maintenance"),
    ENTERTAINMENT("Entertainment"),
    FOOD("Food"),
    TRANSPORTATION("Transportation"),
    OTHER("Other");
    
    companion object {
        fun fromString(value: String): ExpenseCategory = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: OTHER
    }
}
