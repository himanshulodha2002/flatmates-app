package com.flatmates.app.domain.model

import com.flatmates.app.domain.model.enums.ShoppingListStatus
import kotlinx.datetime.Instant

data class ShoppingList(
    val id: String,
    val householdId: String,
    val name: String,
    val description: String? = null,
    val status: ShoppingListStatus = ShoppingListStatus.ACTIVE,
    val createdBy: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Items in this list
    val items: List<ShoppingListItem> = emptyList()
) {
    val isArchived: Boolean get() = status == ShoppingListStatus.ARCHIVED
    val itemCount: Int get() = items.size
    val purchasedCount: Int get() = items.count { it.isPurchased }
    val progress: Float get() = if (itemCount > 0) purchasedCount.toFloat() / itemCount else 0f
}
