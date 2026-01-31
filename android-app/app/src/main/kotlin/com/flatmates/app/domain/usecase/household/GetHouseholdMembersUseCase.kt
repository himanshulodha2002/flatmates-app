package com.flatmates.app.domain.usecase.household

import com.flatmates.app.domain.model.HouseholdMember
import com.flatmates.app.domain.repository.HouseholdRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetHouseholdMembersUseCase @Inject constructor(
    private val householdRepository: HouseholdRepository
) {
    operator fun invoke(householdId: String): Flow<List<HouseholdMember>> {
        return householdRepository.getHouseholdMembers(householdId)
    }
}
