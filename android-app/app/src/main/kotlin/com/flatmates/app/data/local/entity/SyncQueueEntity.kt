package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val entityType: String,      // "todo", "shopping_item", "expense", etc.
    val entityId: String,
    val operation: String,       // "CREATE", "UPDATE", "DELETE"
    val payload: String,         // JSON of the entity
    val createdAt: Long = System.currentTimeMillis(),
    val retryCount: Int = 0,
    val lastError: String? = null
)
