package com.flatmates.app.domain.model.enums

enum class SplitType(val displayName: String) {
    EQUAL("Split Equally"),
    CUSTOM("Custom Amounts"),
    PERCENTAGE("By Percentage");
    
    companion object {
        fun fromString(value: String): SplitType = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: EQUAL
    }
}
