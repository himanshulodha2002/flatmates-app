package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant

@Entity(tableName = "households")
data class HouseholdEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val createdBy: String,
    val createdAt: Instant,
    val isActive: Boolean = false, // Is this the currently selected household?
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
