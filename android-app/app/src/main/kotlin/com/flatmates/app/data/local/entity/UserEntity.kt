package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    val id: String,
    val email: String,
    val fullName: String,
    val googleId: String? = null,
    val profilePictureUrl: String? = null,
    val isActive: Boolean = true,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null,
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
