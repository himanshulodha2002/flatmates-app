package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant
import java.math.BigDecimal

@Entity(
    tableName = "expenses",
    foreignKeys = [
        ForeignKey(
            entity = HouseholdEntity::class,
            parentColumns = ["id"],
            childColumns = ["householdId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("householdId"), Index("category"), Index("date")]
)
data class ExpenseEntity(
    @PrimaryKey
    val id: String,
    val householdId: String,
    val createdBy: String,
    val amount: BigDecimal,
    val description: String,
    val category: String = "OTHER",
    val paymentMethod: String = "CASH",
    val date: Instant,
    val splitType: String = "EQUAL",
    val isPersonal: Boolean = false,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Denormalized
    val creatorName: String? = null,
    val creatorEmail: String? = null,
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
