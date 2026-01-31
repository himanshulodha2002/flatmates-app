package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant

@Entity(
    tableName = "household_members",
    foreignKeys = [
        ForeignKey(
            entity = HouseholdEntity::class,
            parentColumns = ["id"],
            childColumns = ["householdId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("householdId"), Index("userId")]
)
data class HouseholdMemberEntity(
    @PrimaryKey
    val id: String,
    val userId: String,
    val householdId: String,
    val role: String, // "OWNER", "MEMBER"
    val joinedAt: Instant,
    // Denormalized user info
    val email: String? = null,
    val fullName: String? = null,
    val profilePictureUrl: String? = null,
    // Sync metadata
    val syncStatus: String = "SYNCED"
)
