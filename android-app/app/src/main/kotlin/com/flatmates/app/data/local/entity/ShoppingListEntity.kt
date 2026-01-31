package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant

@Entity(
    tableName = "shopping_lists",
    foreignKeys = [
        ForeignKey(
            entity = HouseholdEntity::class,
            parentColumns = ["id"],
            childColumns = ["householdId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("householdId"), Index("status")]
)
data class ShoppingListEntity(
    @PrimaryKey
    val id: String,
    val householdId: String,
    val name: String,
    val description: String? = null,
    val status: String = "ACTIVE", // "ACTIVE", "ARCHIVED"
    val createdBy: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
