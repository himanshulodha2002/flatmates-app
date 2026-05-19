package com.flatmates.app.domain.usecase.shopping

import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.domain.model.enums.ShoppingListStatus
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.ShoppingRepository
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.first
import kotlinx.datetime.Clock
import java.util.UUID
import javax.inject.Inject

class CreateShoppingListUseCase @Inject constructor(
    private val shoppingRepository: ShoppingRepository,
    private val householdRepository: HouseholdRepository
) {
    suspend operator fun invoke(name: String, description: String? = null, createdBy: String): Result<ShoppingList> {
        val trimmedName = name.trim()
        if (trimmedName.isBlank()) {
            return Result.Error(message = "Shopping list name cannot be empty")
        }
        
        val household = householdRepository.getActiveHousehold().first()
            ?: return Result.Error(message = "No active household selected")
        
        val now = Clock.System.now()
        val list = ShoppingList(
            id = UUID.randomUUID().toString(),
            householdId = household.id,
            name = trimmedName,
            description = description?.trim(),
            status = ShoppingListStatus.ACTIVE,
            createdBy = createdBy,
            createdAt = now,
            updatedAt = now
        )
        
        return shoppingRepository.createList(list)
    }
}
