package com.flatmates.app.domain.usecase.shopping

import com.flatmates.app.domain.repository.ShoppingRepository
import com.flatmates.app.domain.util.Result
import javax.inject.Inject

class DeleteShoppingItemUseCase @Inject constructor(
    private val shoppingRepository: ShoppingRepository
) {
    suspend operator fun invoke(itemId: String): Result<Unit> {
        return shoppingRepository.deleteItem(itemId)
    }
}
