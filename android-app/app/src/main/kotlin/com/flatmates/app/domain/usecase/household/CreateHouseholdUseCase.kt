package com.flatmates.app.domain.usecase.household

import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.util.Result
import kotlinx.datetime.Clock
import java.util.UUID
import javax.inject.Inject

class CreateHouseholdUseCase @Inject constructor(
    private val householdRepository: HouseholdRepository
) {
    suspend operator fun invoke(name: String, createdBy: String): Result<Household> {
        val trimmedName = name.trim()
        if (trimmedName.isBlank()) {
            return Result.Error(message = "Household name cannot be empty")
        }
        
        val now = Clock.System.now()
        val household = Household(
            id = UUID.randomUUID().toString(),
            name = trimmedName,
            createdBy = createdBy,
            createdAt = now
        )
        
        return householdRepository.createHousehold(household)
    }
}
