package com.flatmates.app.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class GoogleAuthRequest(
    @SerialName("id_token")
    val idToken: String
)

@Serializable
data class AuthResponse(
    @SerialName("access_token")
    val accessToken: String,
    @SerialName("refresh_token")
    val refreshToken: String? = null,
    @SerialName("token_type")
    val tokenType: String = "Bearer",
    @SerialName("expires_in")
    val expiresIn: Long = 3600, // Default 1 hour if not provided
    val user: UserDto
)

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    @SerialName("full_name")
    val fullName: String,
    @SerialName("profile_picture_url")
    val profilePictureUrl: String? = null,
    @SerialName("google_id")
    val googleId: String? = null,
    @SerialName("is_active")
    val isActive: Boolean = true,
    @SerialName("created_at")
    val createdAt: String? = null,
    @SerialName("updated_at")
    val updatedAt: String? = null
)

@Serializable
data class RefreshTokenRequest(
    @SerialName("refresh_token")
    val refreshToken: String
)

@Serializable
data class RefreshTokenResponse(
    @SerialName("access_token")
    val accessToken: String,
    @SerialName("expires_in")
    val expiresIn: Long
)
