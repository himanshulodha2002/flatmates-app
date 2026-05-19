package com.flatmates.app.domain.usecase.household

import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.repository.HouseholdRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetHouseholdsUseCase @Inject constructor(
    private val householdRepository: HouseholdRepository
) {
    operator fun invoke(): Flow<List<Household>> {
        return householdRepository.getHouseholds()
    }
}
