package com.flatmates.app.domain.model.enums

enum class MemberRole {
    OWNER,
    MEMBER;
    
    companion object {
        fun fromString(value: String): MemberRole = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: MEMBER
    }
}
