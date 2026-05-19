package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant
import java.math.BigDecimal

@Entity(
    tableName = "shopping_list_items",
    foreignKeys = [
        ForeignKey(
            entity = ShoppingListEntity::class,
            parentColumns = ["id"],
            childColumns = ["shoppingListId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("shoppingListId"), Index("isPurchased"), Index("category")]
)
data class ShoppingListItemEntity(
    @PrimaryKey
    val id: String,
    val shoppingListId: String,
    val name: String,
    val quantity: Double = 1.0,
    val unit: String? = null,
    val category: String? = null,
    val isPurchased: Boolean = false,
    val assignedToId: String? = null,
    val price: BigDecimal? = null,
    val notes: String? = null,
    val isRecurring: Boolean = false,
    val recurringPattern: String? = null,
    val position: Int = 0,
    val createdBy: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Denormalized
    val assignedToName: String? = null,
    val checkedOffByName: String? = null,
    val checkedOffAt: Instant? = null,
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
