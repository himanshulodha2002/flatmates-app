package com.flatmates.app.data.local.preferences

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(
    name = "flatmates_preferences"
)

@Singleton
class UserPreferencesDataStore @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private object PreferenceKeys {
        val AUTH_TOKEN = stringPreferencesKey("auth_token")
        val REFRESH_TOKEN = stringPreferencesKey("refresh_token")
        val CURRENT_USER_ID = stringPreferencesKey("current_user_id")
        val ACTIVE_HOUSEHOLD_ID = stringPreferencesKey("active_household_id")
        val IS_FIRST_LAUNCH = booleanPreferencesKey("is_first_launch")
        val DARK_MODE = stringPreferencesKey("dark_mode") // "system", "light", "dark"
        val NOTIFICATIONS_ENABLED = booleanPreferencesKey("notifications_enabled")
        val LAST_SYNC_TIMESTAMP = stringPreferencesKey("last_sync_timestamp")
    }

    // Auth Token
    val authToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferenceKeys.AUTH_TOKEN]
    }

    suspend fun setAuthToken(token: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.AUTH_TOKEN] = token
        }
    }

    // Refresh Token
    val refreshToken: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferenceKeys.REFRESH_TOKEN]
    }

    suspend fun setRefreshToken(token: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.REFRESH_TOKEN] = token
        }
    }

    // Current User ID
    val currentUserId: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferenceKeys.CURRENT_USER_ID]
    }

    suspend fun setCurrentUserId(userId: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.CURRENT_USER_ID] = userId
        }
    }

    // Active Household ID
    val activeHouseholdId: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferenceKeys.ACTIVE_HOUSEHOLD_ID]
    }

    suspend fun setActiveHouseholdId(householdId: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.ACTIVE_HOUSEHOLD_ID] = householdId
        }
    }

    // First Launch Flag
    val isFirstLaunch: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferenceKeys.IS_FIRST_LAUNCH] ?: true
    }

    suspend fun setFirstLaunchComplete() {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.IS_FIRST_LAUNCH] = false
        }
    }

    // Dark Mode Setting
    val darkMode: Flow<DarkModeSetting> = context.dataStore.data.map { preferences ->
        when (preferences[PreferenceKeys.DARK_MODE]) {
            "light" -> DarkModeSetting.LIGHT
            "dark" -> DarkModeSetting.DARK
            else -> DarkModeSetting.SYSTEM
        }
    }

    suspend fun setDarkMode(setting: DarkModeSetting) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.DARK_MODE] = when (setting) {
                DarkModeSetting.SYSTEM -> "system"
                DarkModeSetting.LIGHT -> "light"
                DarkModeSetting.DARK -> "dark"
            }
        }
    }

    // Notifications Enabled
    val notificationsEnabled: Flow<Boolean> = context.dataStore.data.map { preferences ->
        preferences[PreferenceKeys.NOTIFICATIONS_ENABLED] ?: true
    }

    suspend fun setNotificationsEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.NOTIFICATIONS_ENABLED] = enabled
        }
    }

    // Last Sync Timestamp
    val lastSyncTimestamp: Flow<String?> = context.dataStore.data.map { preferences ->
        preferences[PreferenceKeys.LAST_SYNC_TIMESTAMP]
    }

    suspend fun setLastSyncTimestamp(timestamp: String) {
        context.dataStore.edit { preferences ->
            preferences[PreferenceKeys.LAST_SYNC_TIMESTAMP] = timestamp
        }
    }

    // Clear all auth data (for logout)
    suspend fun clearAuthData() {
        context.dataStore.edit { preferences ->
            preferences.remove(PreferenceKeys.AUTH_TOKEN)
            preferences.remove(PreferenceKeys.REFRESH_TOKEN)
            preferences.remove(PreferenceKeys.CURRENT_USER_ID)
        }
    }

    // Clear all preferences
    suspend fun clearAll() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}

enum class DarkModeSetting {
    SYSTEM,
    LIGHT,
    DARK
}
