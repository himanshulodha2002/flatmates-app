package com.flatmates.app.domain.model

import com.flatmates.app.domain.model.enums.MemberRole
import kotlinx.datetime.Instant

data class HouseholdMember(
    val id: String,
    val userId: String,
    val householdId: String,
    val role: MemberRole,
    val joinedAt: Instant,
    // Denormalized user info for display
    val email: String? = null,
    val fullName: String? = null,
    val profilePictureUrl: String? = null
) {
    val isOwner: Boolean get() = role == MemberRole.OWNER
    
    val displayName: String get() = fullName ?: email ?: "Unknown"
    
    val initials: String
        get() = displayName
            .split(" ")
            .take(2)
            .mapNotNull { it.firstOrNull()?.uppercase() }
            .joinToString("")
}
