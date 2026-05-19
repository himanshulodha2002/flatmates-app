package com.flatmates.app.domain.usecase.auth

import com.flatmates.app.domain.model.User
import com.flatmates.app.domain.repository.AuthRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetCurrentUserUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    operator fun invoke(): Flow<User?> {
        return authRepository.currentUser
    }
}
