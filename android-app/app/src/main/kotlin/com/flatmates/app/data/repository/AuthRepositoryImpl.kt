package com.flatmates.app.data.repository

import com.flatmates.app.auth.AuthManager
import com.flatmates.app.data.local.dao.UserDao
import com.flatmates.app.data.local.preferences.UserPreferencesDataStore
import com.flatmates.app.data.mapper.toDomain
import com.flatmates.app.data.sync.SyncManager
import com.flatmates.app.domain.model.User
import com.flatmates.app.domain.repository.AuthRepository
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val userDao: UserDao,
    private val userPreferencesDataStore: UserPreferencesDataStore,
    private val authManager: AuthManager,
    private val syncManager: SyncManager
) : AuthRepository {

    override val isAuthenticated: Flow<Boolean> = authManager.isLoggedIn

    override val currentUser: Flow<User?> = 
        userDao.getCurrentUser().map { it?.toDomain() }

    override suspend fun signInWithGoogle(idToken: String): Result<User> {
        return try {
            val result = authManager.signInWithGoogle(idToken)
            when (result) {
                is Result.Success -> {
                    // Get the user from local database
                    val user = userDao.getCurrentUser().first()
                    if (user != null) {
                        // Schedule sync after successful sign-in
                        syncManager.schedulePeriodicSync()
                        syncManager.requestImmediateSync()
                        Result.Success(user.toDomain())
                    } else {
                        Result.Error(message = "User not found after sign-in")
                    }
                }
                is Result.Error -> Result.Error(result.exception, result.message)
                is Result.Loading -> Result.Loading
            }
        } catch (e: Exception) {
            Result.Error(e, "Sign-in failed: ${e.message}")
        }
    }

    override suspend fun signOut(): Result<Unit> {
        return try {
            // Cancel sync jobs
            syncManager.cancelAllSync()
            
            // Sign out via auth manager
            authManager.signOut()
            
            // Clear preferences
            userPreferencesDataStore.clearAuthData()
            
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Sign-out failed: ${e.message}")
        }
    }

    override suspend fun refreshToken(): Result<Unit> {
        return authManager.refreshToken()
    }
}
