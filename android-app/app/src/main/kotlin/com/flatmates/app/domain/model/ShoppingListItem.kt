package com.flatmates.app.domain.model

import kotlinx.datetime.Instant
import java.math.BigDecimal

data class ShoppingListItem(
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
    val checkedOffAt: Instant? = null
) {
    val displayQuantity: String
        get() = if (unit != null) "$quantity $unit" else quantity.toString()
}
