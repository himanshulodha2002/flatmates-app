package com.flatmates.app.domain.usecase.shopping

import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.domain.repository.ShoppingRepository
import com.flatmates.app.domain.util.Result
import javax.inject.Inject

class ToggleItemPurchasedUseCase @Inject constructor(
    private val shoppingRepository: ShoppingRepository
) {
    suspend operator fun invoke(itemId: String): Result<ShoppingListItem> {
        return shoppingRepository.toggleItemPurchased(itemId)
    }
}
