package com.flatmates.app.domain.usecase.household

import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.util.Result
import javax.inject.Inject

/**
 * Use case for joining a household via invite token.
 * Note: This requires network functionality which will be implemented in Task 7.
 */
class JoinHouseholdUseCase @Inject constructor(
    private val householdRepository: HouseholdRepository
) {
    suspend operator fun invoke(inviteToken: String): Result<Household> {
        val trimmedToken = inviteToken.trim()
        if (trimmedToken.isBlank()) {
            return Result.Error(message = "Invite token cannot be empty")
        }
        // TODO: Implement with network layer in Task 7
        // This would involve sending the token to the backend,
        // verifying it, and adding the user to the household
        return Result.Error(message = "Join household functionality not yet implemented")
    }
}
