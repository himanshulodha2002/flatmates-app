package com.flatmates.app.domain.usecase.auth

import com.flatmates.app.domain.repository.AuthRepository
import com.flatmates.app.domain.util.Result
import javax.inject.Inject

class SignOutUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(): Result<Unit> {
        return authRepository.signOut()
    }
}
