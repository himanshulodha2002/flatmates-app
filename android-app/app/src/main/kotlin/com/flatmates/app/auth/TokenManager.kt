package com.flatmates.app.auth

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.authDataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    companion object {
        private val ACCESS_TOKEN = stringPreferencesKey("access_token")
        private val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        private val TOKEN_EXPIRY = longPreferencesKey("token_expiry")
        private val USER_ID = stringPreferencesKey("user_id")
    }
    
    val isLoggedIn: Flow<Boolean> = context.authDataStore.data.map { prefs ->
        prefs[ACCESS_TOKEN] != null
    }
    
    val userId: Flow<String?> = context.authDataStore.data.map { prefs ->
        prefs[USER_ID]
    }
    
    val accessTokenFlow: Flow<String?> = context.authDataStore.data.map { prefs ->
        prefs[ACCESS_TOKEN]
    }
    
    suspend fun getAccessToken(): String? {
        val prefs = context.authDataStore.data.first()
        val expiry = prefs[TOKEN_EXPIRY] ?: 0
        
        // Check if token is expired (with 60 second buffer)
        if (System.currentTimeMillis() > expiry - 60_000) {
            return null // Token expired, caller should refresh
        }
        
        return prefs[ACCESS_TOKEN]
    }
    
    suspend fun getRefreshToken(): String? {
        return context.authDataStore.data.first()[REFRESH_TOKEN]
    }
    
    suspend fun getUserId(): String? {
        return context.authDataStore.data.first()[USER_ID]
    }
    
    suspend fun saveTokens(
        accessToken: String,
        refreshToken: String,
        expiresIn: Long,
        userId: String
    ) {
        context.authDataStore.edit { prefs ->
            prefs[ACCESS_TOKEN] = accessToken
            prefs[REFRESH_TOKEN] = refreshToken
            prefs[TOKEN_EXPIRY] = System.currentTimeMillis() + (expiresIn * 1000)
            prefs[USER_ID] = userId
        }
    }
    
    suspend fun updateAccessToken(accessToken: String, expiresIn: Long) {
        context.authDataStore.edit { prefs ->
            prefs[ACCESS_TOKEN] = accessToken
            prefs[TOKEN_EXPIRY] = System.currentTimeMillis() + (expiresIn * 1000)
        }
    }
    
    suspend fun clearTokens() {
        context.authDataStore.edit { prefs ->
            prefs.remove(ACCESS_TOKEN)
            prefs.remove(REFRESH_TOKEN)
            prefs.remove(TOKEN_EXPIRY)
            prefs.remove(USER_ID)
        }
    }
    
    suspend fun hasValidToken(): Boolean {
        return getAccessToken() != null
    }
    
    suspend fun getTokenExpiry(): Long {
        return context.authDataStore.data.first()[TOKEN_EXPIRY] ?: 0
    }
}
