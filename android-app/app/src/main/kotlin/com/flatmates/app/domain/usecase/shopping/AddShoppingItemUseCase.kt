package com.flatmates.app.domain.usecase.shopping

import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.domain.repository.ShoppingRepository
import com.flatmates.app.domain.util.Result
import kotlinx.datetime.Clock
import java.util.UUID
import javax.inject.Inject

data class AddShoppingItemParams(
    val listId: String,
    val name: String,
    val quantity: Double = 1.0,
    val unit: String? = null,
    val category: String? = null,
    val createdBy: String
)

class AddShoppingItemUseCase @Inject constructor(
    private val shoppingRepository: ShoppingRepository
) {
    suspend operator fun invoke(params: AddShoppingItemParams): Result<ShoppingListItem> {
        val trimmedName = params.name.trim()
        if (trimmedName.isBlank()) {
            return Result.Error(message = "Item name cannot be empty")
        }
        
        val now = Clock.System.now()
        val item = ShoppingListItem(
            id = UUID.randomUUID().toString(),
            shoppingListId = params.listId,
            name = trimmedName,
            quantity = params.quantity,
            unit = params.unit?.trim(),
            category = params.category?.trim(),
            createdBy = params.createdBy,
            createdAt = now,
            updatedAt = now
        )
        
        return shoppingRepository.addItem(item)
    }
}
