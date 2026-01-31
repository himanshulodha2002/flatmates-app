package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate

@Entity(
    tableName = "todos",
    foreignKeys = [
        ForeignKey(
            entity = HouseholdEntity::class,
            parentColumns = ["id"],
            childColumns = ["householdId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("householdId"),
        Index("status"),
        Index("dueDate"),
        Index("assignedToId")
    ]
)
data class TodoEntity(
    @PrimaryKey
    val id: String,
    val householdId: String,
    val title: String,
    val description: String? = null,
    val status: String = "PENDING", // "PENDING", "IN_PROGRESS", "COMPLETED"
    val priority: String = "MEDIUM", // "LOW", "MEDIUM", "HIGH"
    val dueDate: LocalDate? = null,
    val assignedToId: String? = null,
    val createdBy: String,
    val recurringPattern: String? = null,
    val recurringUntil: LocalDate? = null,
    val completedAt: Instant? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Denormalized
    val assignedToName: String? = null,
    val createdByName: String? = null,
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
