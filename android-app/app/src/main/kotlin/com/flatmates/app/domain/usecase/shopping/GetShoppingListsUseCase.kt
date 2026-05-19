package com.flatmates.app.domain.usecase.shopping

import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.ShoppingRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import javax.inject.Inject

class GetShoppingListsUseCase @Inject constructor(
    private val shoppingRepository: ShoppingRepository,
    private val householdRepository: HouseholdRepository
) {
    @OptIn(ExperimentalCoroutinesApi::class)
    operator fun invoke(): Flow<List<ShoppingList>> {
        return householdRepository.getActiveHousehold().flatMapLatest { household ->
            if (household != null) {
                shoppingRepository.getShoppingLists(household.id)
            } else {
                flowOf(emptyList())
            }
        }
    }
}
