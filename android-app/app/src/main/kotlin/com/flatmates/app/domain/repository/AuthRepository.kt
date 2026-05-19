package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.User
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    val isAuthenticated: Flow<Boolean>
    val currentUser: Flow<User?>
    
    suspend fun signInWithGoogle(idToken: String): Result<User>
    suspend fun signOut(): Result<Unit>
    suspend fun refreshToken(): Result<Unit>
}
