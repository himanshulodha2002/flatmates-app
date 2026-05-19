package com.flatmates.app.domain.model

import kotlinx.datetime.Instant

data class User(
    val id: String,
    val email: String,
    val fullName: String,
    val googleId: String? = null,
    val profilePictureUrl: String? = null,
    val isActive: Boolean = true,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null
) {
    val initials: String
        get() = fullName
            .split(" ")
            .take(2)
            .mapNotNull { it.firstOrNull()?.uppercase() }
            .joinToString("")
}
