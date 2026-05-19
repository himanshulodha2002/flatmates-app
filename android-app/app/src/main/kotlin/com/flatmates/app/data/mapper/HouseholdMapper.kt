package com.flatmates.app.data.mapper

import com.flatmates.app.data.local.entity.HouseholdEntity
import com.flatmates.app.data.local.entity.HouseholdMemberEntity
import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.model.HouseholdMember
import com.flatmates.app.domain.model.enums.MemberRole

fun HouseholdEntity.toDomain(members: List<HouseholdMember> = emptyList()): Household = Household(
    id = id,
    name = name,
    createdBy = createdBy,
    createdAt = createdAt,
    members = members
)

fun Household.toEntity(
    isActive: Boolean = false,
    syncStatus: String = "SYNCED",
    lastModifiedLocally: Long? = null
): HouseholdEntity = HouseholdEntity(
    id = id,
    name = name,
    createdBy = createdBy,
    createdAt = createdAt,
    isActive = isActive,
    syncStatus = syncStatus,
    lastModifiedLocally = lastModifiedLocally
)

fun HouseholdMemberEntity.toDomain(): HouseholdMember = HouseholdMember(
    id = id,
    userId = userId,
    householdId = householdId,
    role = MemberRole.fromString(role),
    joinedAt = joinedAt,
    email = email,
    fullName = fullName,
    profilePictureUrl = profilePictureUrl
)

fun HouseholdMember.toEntity(
    syncStatus: String = "SYNCED"
): HouseholdMemberEntity = HouseholdMemberEntity(
    id = id,
    userId = userId,
    householdId = householdId,
    role = role.name,
    joinedAt = joinedAt,
    email = email,
    fullName = fullName,
    profilePictureUrl = profilePictureUrl,
    syncStatus = syncStatus
)

fun List<HouseholdEntity>.toDomainList(): List<Household> = map { it.toDomain() }
fun List<HouseholdMemberEntity>.toMemberDomainList(): List<HouseholdMember> = map { it.toDomain() }
