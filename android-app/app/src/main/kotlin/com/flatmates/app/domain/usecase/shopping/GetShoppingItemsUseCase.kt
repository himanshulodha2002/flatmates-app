package com.flatmates.app.domain.usecase.shopping

import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.domain.repository.ShoppingRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetShoppingItemsUseCase @Inject constructor(
    private val shoppingRepository: ShoppingRepository
) {
    operator fun invoke(listId: String): Flow<List<ShoppingListItem>> {
        return shoppingRepository.getShoppingItems(listId)
    }
}
