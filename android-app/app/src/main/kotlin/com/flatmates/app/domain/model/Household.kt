package com.flatmates.app.domain.model

import kotlinx.datetime.Instant

data class Household(
    val id: String,
    val name: String,
    val createdBy: String,
    val createdAt: Instant,
    val members: List<HouseholdMember> = emptyList()
) {
    val memberCount: Int get() = members.size
}
