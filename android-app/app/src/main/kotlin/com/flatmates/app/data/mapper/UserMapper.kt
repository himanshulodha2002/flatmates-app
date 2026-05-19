package com.flatmates.app.data.mapper

import com.flatmates.app.data.local.entity.UserEntity
import com.flatmates.app.domain.model.User

fun UserEntity.toDomain(): User = User(
    id = id,
    email = email,
    fullName = fullName,
    googleId = googleId,
    profilePictureUrl = profilePictureUrl,
    isActive = isActive,
    createdAt = createdAt,
    updatedAt = updatedAt
)

fun User.toEntity(
    syncStatus: String = "SYNCED",
    lastModifiedLocally: Long? = null
): UserEntity = UserEntity(
    id = id,
    email = email,
    fullName = fullName,
    googleId = googleId,
    profilePictureUrl = profilePictureUrl,
    isActive = isActive,
    createdAt = createdAt,
    updatedAt = updatedAt,
    syncStatus = syncStatus,
    lastModifiedLocally = lastModifiedLocally
)

fun List<UserEntity>.toDomainList(): List<User> = map { it.toDomain() }
