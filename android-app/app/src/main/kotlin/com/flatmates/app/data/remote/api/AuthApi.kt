package com.flatmates.app.data.remote.api

import com.flatmates.app.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface AuthApi {
    
    @POST("api/v1/auth/google/mobile")
    suspend fun googleSignIn(
        @Body request: GoogleAuthRequest
    ): Response<AuthResponse>
    
    @POST("api/v1/auth/refresh")
    suspend fun refreshToken(
        @Body request: RefreshTokenRequest
    ): Response<RefreshTokenResponse>
    
    @GET("api/v1/auth/me")
    suspend fun getCurrentUser(): Response<UserDto>
}
