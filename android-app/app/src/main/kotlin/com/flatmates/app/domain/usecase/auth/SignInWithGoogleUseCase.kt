package com.flatmates.app.domain.usecase.auth

import com.flatmates.app.domain.model.User
import com.flatmates.app.domain.repository.AuthRepository
import com.flatmates.app.domain.util.Result
import javax.inject.Inject

class SignInWithGoogleUseCase @Inject constructor(
    private val authRepository: AuthRepository
) {
    suspend operator fun invoke(idToken: String): Result<User> {
        return authRepository.signInWithGoogle(idToken)
    }
}
