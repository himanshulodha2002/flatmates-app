package com.flatmates.app.auth

import com.flatmates.app.data.local.dao.UserDao
import com.flatmates.app.data.remote.api.AuthApi
import com.flatmates.app.data.remote.dto.GoogleAuthRequest
import com.flatmates.app.data.remote.dto.RefreshTokenRequest
import com.flatmates.app.data.remote.mapper.toEntity
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthManager @Inject constructor(
    private val authApi: AuthApi,
    private val tokenManager: TokenManager,
    private val googleAuthClient: GoogleAuthClient,
    private val userDao: UserDao
) {
    
    val isLoggedIn: Flow<Boolean> = tokenManager.isLoggedIn
    
    val userId: Flow<String?> = tokenManager.userId
    
    suspend fun signInWithGoogle(idToken: String): Result<Unit> {
        return try {
            val response = authApi.googleSignIn(GoogleAuthRequest(idToken))
            
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                
                // Save tokens
                tokenManager.saveTokens(
                    accessToken = authResponse.accessToken,
                    refreshToken = authResponse.refreshToken ?: authResponse.accessToken, // Use access token as fallback
                    expiresIn = authResponse.expiresIn,
                    userId = authResponse.user.id
                )
                
                // Save user to local database
                userDao.insert(authResponse.user.toEntity())
                
                Result.Success(Unit)
            } else {
                val errorBody = response.errorBody()?.string()
                Result.Error(message = errorBody ?: "Sign in failed")
            }
        } catch (e: Exception) {
            Result.Error(e, "Network error during sign in: ${e.message}")
        }
    }
    
    suspend fun refreshToken(): Result<Unit> {
        return try {
            val refreshToken = tokenManager.getRefreshToken()
                ?: return Result.Error(message = "No refresh token available")
            
            val response = authApi.refreshToken(RefreshTokenRequest(refreshToken))
            
            if (response.isSuccessful && response.body() != null) {
                val tokenResponse = response.body()!!
                tokenManager.updateAccessToken(
                    tokenResponse.accessToken,
                    tokenResponse.expiresIn
                )
                Result.Success(Unit)
            } else {
                // Refresh failed, user needs to re-login
                tokenManager.clearTokens()
                Result.Error(message = "Session expired, please sign in again")
            }
        } catch (e: Exception) {
            Result.Error(e, "Failed to refresh token: ${e.message}")
        }
    }
    
    suspend fun signOut() {
        try {
            googleAuthClient.signOut()
        } catch (e: Exception) {
            // Ignore Google sign out errors
        }
        tokenManager.clearTokens()
        userDao.deleteAll()
    }
    
    suspend fun getCurrentUser() = try {
        val response = authApi.getCurrentUser()
        if (response.isSuccessful && response.body() != null) {
            val userDto = response.body()!!
            userDao.insert(userDto.toEntity())
            Result.Success(userDto)
        } else {
            Result.Error(message = "Failed to get current user")
        }
    } catch (e: Exception) {
        Result.Error(e, "Network error: ${e.message}")
    }
    
    suspend fun isTokenValid(): Boolean {
        return tokenManager.hasValidToken()
    }
}
