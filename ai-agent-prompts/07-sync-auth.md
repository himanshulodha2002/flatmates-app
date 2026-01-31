# Task 7: Sync & Authentication (Google Sign-In + WorkManager Sync)

## Metadata
- **Can run in parallel with**: No - requires Tasks 1-6
- **Dependencies**: Tasks 1-6 must be complete
- **Estimated time**: 4-5 hours
- **Priority**: HIGH (enables multi-user functionality)

---

## Prompt

You are implementing authentication (Google Sign-In) and background sync using WorkManager for the Flatmates Android app. The app uses a local-first architecture where all data is stored locally and synced to the server when connectivity is available.

### Repository Information
- **Repository**: `/workspaces/flatmates-app`
- **Android Path**: `/workspaces/flatmates-app/android-app`
- **Backend API**: Deployed at the URL stored in `BuildConfig.API_BASE_URL`
- **Backend Code**: `/workspaces/flatmates-app/backend/app/api/v1/endpoints/`

### Package Structure to Create

```
app/src/main/kotlin/com/flatmates/app/
├── data/
│   ├── remote/
│   │   ├── api/
│   │   │   ├── FlatmatesApi.kt
│   │   │   ├── AuthApi.kt
│   │   │   └── SyncApi.kt
│   │   ├── dto/
│   │   │   ├── AuthDtos.kt
│   │   │   ├── SyncDtos.kt
│   │   │   └── ApiResponse.kt
│   │   └── interceptor/
│   │       ├── AuthInterceptor.kt
│   │       └── NetworkInterceptor.kt
│   └── sync/
│       ├── SyncManager.kt
│       └── SyncWorker.kt
├── domain/
│   └── repository/
│       └── AuthRepository.kt
├── di/
│   └── NetworkModule.kt
├── auth/
│   ├── GoogleAuthClient.kt
│   ├── AuthManager.kt
│   └── TokenManager.kt
└── ui/
    └── screens/
        ├── auth/
        │   ├── LoginScreen.kt
        │   ├── LoginViewModel.kt
        │   └── OnboardingScreen.kt
        └── ...
```

### Backend API Reference

```
# Auth Endpoints
POST /api/v1/auth/google        - Google OAuth login
POST /api/v1/auth/refresh       - Refresh access token
GET  /api/v1/auth/me            - Get current user

# Batch Sync Endpoint (from Task 1)
POST /api/v1/sync               - Sync multiple entities

# Existing Endpoints (use for fallback)
GET/POST /api/v1/todos
GET/POST /api/v1/shopping-lists
GET/POST /api/v1/expenses
GET/POST /api/v1/households
```

### Tasks

#### 1. Create Network DTOs

`data/remote/dto/ApiResponse.kt`:

```kotlin
package com.flatmates.app.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class ApiResponse<T>(
    val success: Boolean,
    val data: T? = null,
    val error: ApiError? = null
)

@Serializable
data class ApiError(
    val code: String,
    val message: String,
    val details: Map<String, String>? = null
)

@Serializable
data class PaginatedResponse<T>(
    val items: List<T>,
    val total: Int,
    val page: Int,
    val pageSize: Int,
    val hasMore: Boolean
)
```

`data/remote/dto/AuthDtos.kt`:

```kotlin
package com.flatmates.app.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class GoogleAuthRequest(
    val idToken: String
)

@Serializable
data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val tokenType: String = "Bearer",
    val expiresIn: Long,
    val user: UserDto
)

@Serializable
data class UserDto(
    val id: String,
    val email: String,
    val fullName: String,
    val profilePictureUrl: String? = null,
    val googleId: String? = null,
    val isActive: Boolean = true,
    val createdAt: String? = null,
    val updatedAt: String? = null
)

@Serializable
data class RefreshTokenRequest(
    val refreshToken: String
)

@Serializable
data class RefreshTokenResponse(
    val accessToken: String,
    val expiresIn: Long
)
```

`data/remote/dto/SyncDtos.kt`:

```kotlin
package com.flatmates.app.data.remote.dto

import kotlinx.serialization.Serializable

@Serializable
data class SyncRequest(
    val lastSyncTimestamp: Long,
    val householdId: String,
    val changes: SyncChanges
)

@Serializable
data class SyncChanges(
    val todos: EntityChanges<TodoDto>? = null,
    val shoppingLists: EntityChanges<ShoppingListDto>? = null,
    val shoppingItems: EntityChanges<ShoppingItemDto>? = null,
    val expenses: EntityChanges<ExpenseDto>? = null
)

@Serializable
data class EntityChanges<T>(
    val created: List<T> = emptyList(),
    val updated: List<T> = emptyList(),
    val deleted: List<String> = emptyList()
)

@Serializable
data class SyncResponse(
    val serverTimestamp: Long,
    val todos: List<TodoDto> = emptyList(),
    val shoppingLists: List<ShoppingListDto> = emptyList(),
    val shoppingItems: List<ShoppingItemDto> = emptyList(),
    val expenses: List<ExpenseDto> = emptyList(),
    val conflicts: List<SyncConflict> = emptyList()
)

@Serializable
data class SyncConflict(
    val entityType: String,
    val entityId: String,
    val localVersion: String,
    val serverVersion: String,
    val conflictType: String // "UPDATE_UPDATE", "DELETE_UPDATE", etc.
)

// Entity DTOs matching backend schemas
@Serializable
data class TodoDto(
    val id: String,
    val householdId: String,
    val title: String,
    val description: String? = null,
    val status: String = "PENDING",
    val priority: String = "MEDIUM",
    val dueDate: String? = null,
    val assignedToId: String? = null,
    val createdBy: String,
    val completedAt: String? = null,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class ShoppingListDto(
    val id: String,
    val householdId: String,
    val name: String,
    val description: String? = null,
    val status: String = "ACTIVE",
    val createdBy: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class ShoppingItemDto(
    val id: String,
    val shoppingListId: String,
    val name: String,
    val quantity: Double = 1.0,
    val unit: String? = null,
    val category: String? = null,
    val isPurchased: Boolean = false,
    val price: String? = null,
    val createdBy: String,
    val createdAt: String,
    val updatedAt: String
)

@Serializable
data class ExpenseDto(
    val id: String,
    val householdId: String,
    val createdBy: String,
    val amount: String,
    val description: String,
    val category: String = "OTHER",
    val splitType: String = "EQUAL",
    val date: String,
    val createdAt: String,
    val updatedAt: String,
    val splits: List<ExpenseSplitDto> = emptyList()
)

@Serializable
data class ExpenseSplitDto(
    val id: String,
    val expenseId: String,
    val userId: String,
    val amountOwed: String,
    val isSettled: Boolean = false,
    val settledAt: String? = null
)
```

#### 2. Create API Interfaces

`data/remote/api/AuthApi.kt`:

```kotlin
package com.flatmates.app.data.remote.api

import com.flatmates.app.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface AuthApi {
    
    @POST("api/v1/auth/google")
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
```

`data/remote/api/SyncApi.kt`:

```kotlin
package com.flatmates.app.data.remote.api

import com.flatmates.app.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface SyncApi {
    
    @POST("api/v1/sync")
    suspend fun syncAll(
        @Body request: SyncRequest
    ): Response<SyncResponse>
    
    // Fallback individual endpoints
    @GET("api/v1/todos")
    suspend fun getTodos(
        @Query("household_id") householdId: String
    ): Response<List<TodoDto>>
    
    @POST("api/v1/todos")
    suspend fun createTodo(
        @Body todo: TodoDto
    ): Response<TodoDto>
    
    @PUT("api/v1/todos/{id}")
    suspend fun updateTodo(
        @Path("id") id: String,
        @Body todo: TodoDto
    ): Response<TodoDto>
    
    @DELETE("api/v1/todos/{id}")
    suspend fun deleteTodo(
        @Path("id") id: String
    ): Response<Unit>
    
    // Similar for shopping lists, shopping items, expenses...
}
```

`data/remote/api/FlatmatesApi.kt`:

```kotlin
package com.flatmates.app.data.remote.api

import com.flatmates.app.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface FlatmatesApi : AuthApi, SyncApi {
    
    // Households
    @GET("api/v1/households")
    suspend fun getHouseholds(): Response<List<HouseholdDto>>
    
    @POST("api/v1/households")
    suspend fun createHousehold(
        @Body household: CreateHouseholdRequest
    ): Response<HouseholdDto>
    
    @POST("api/v1/households/join")
    suspend fun joinHousehold(
        @Body request: JoinHouseholdRequest
    ): Response<HouseholdDto>
    
    @GET("api/v1/households/{id}/members")
    suspend fun getHouseholdMembers(
        @Path("id") householdId: String
    ): Response<List<HouseholdMemberDto>>
}

@kotlinx.serialization.Serializable
data class HouseholdDto(
    val id: String,
    val name: String,
    val createdBy: String,
    val createdAt: String,
    val inviteCode: String? = null
)

@kotlinx.serialization.Serializable
data class CreateHouseholdRequest(
    val name: String
)

@kotlinx.serialization.Serializable
data class JoinHouseholdRequest(
    val inviteCode: String
)

@kotlinx.serialization.Serializable
data class HouseholdMemberDto(
    val id: String,
    val userId: String,
    val householdId: String,
    val role: String,
    val joinedAt: String,
    val user: UserDto? = null
)
```

#### 3. Create Interceptors

`data/remote/interceptor/AuthInterceptor.kt`:

```kotlin
package com.flatmates.app.data.remote.interceptor

import com.flatmates.app.auth.TokenManager
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response
import javax.inject.Inject

class AuthInterceptor @Inject constructor(
    private val tokenManager: TokenManager
) : Interceptor {
    
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()
        
        // Skip auth for login/refresh endpoints
        if (originalRequest.url.encodedPath.contains("/auth/")) {
            return chain.proceed(originalRequest)
        }
        
        val token = runBlocking { tokenManager.getAccessToken() }
        
        return if (token != null) {
            val authenticatedRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            chain.proceed(authenticatedRequest)
        } else {
            chain.proceed(originalRequest)
        }
    }
}
```

`data/remote/interceptor/NetworkInterceptor.kt`:

```kotlin
package com.flatmates.app.data.remote.interceptor

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import dagger.hilt.android.qualifiers.ApplicationContext
import okhttp3.Interceptor
import okhttp3.Response
import java.io.IOException
import javax.inject.Inject

class NetworkInterceptor @Inject constructor(
    @ApplicationContext private val context: Context
) : Interceptor {
    
    override fun intercept(chain: Interceptor.Chain): Response {
        if (!isConnected()) {
            throw NoConnectivityException()
        }
        return chain.proceed(chain.request())
    }
    
    private fun isConnected(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }
}

class NoConnectivityException : IOException("No internet connection")
```

#### 4. Create Token Manager

`auth/TokenManager.kt`:

```kotlin
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
}
```

#### 5. Create Google Auth Client

`auth/GoogleAuthClient.kt`:

```kotlin
package com.flatmates.app.auth

import android.content.Context
import android.content.Intent
import androidx.activity.result.IntentSenderRequest
import com.google.android.gms.auth.api.identity.BeginSignInRequest
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.auth.api.identity.SignInClient
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton
import com.flatmates.app.BuildConfig

@Singleton
class GoogleAuthClient @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    private val signInClient: SignInClient = Identity.getSignInClient(context)
    
    suspend fun beginSignIn(): IntentSenderRequest? {
        return try {
            val request = BeginSignInRequest.builder()
                .setGoogleIdTokenRequestOptions(
                    BeginSignInRequest.GoogleIdTokenRequestOptions.builder()
                        .setSupported(true)
                        .setServerClientId(BuildConfig.GOOGLE_WEB_CLIENT_ID)
                        .setFilterByAuthorizedAccounts(false)
                        .build()
                )
                .setAutoSelectEnabled(true)
                .build()
            
            val result = signInClient.beginSignIn(request).await()
            IntentSenderRequest.Builder(result.pendingIntent.intentSender).build()
        } catch (e: Exception) {
            null
        }
    }
    
    fun getIdTokenFromIntent(intent: Intent): String? {
        return try {
            val credential = signInClient.getSignInCredentialFromIntent(intent)
            credential.googleIdToken
        } catch (e: Exception) {
            null
        }
    }
    
    suspend fun signOut() {
        try {
            signInClient.signOut().await()
        } catch (e: Exception) {
            // Ignore errors during sign out
        }
    }
}
```

#### 6. Create Auth Manager

`auth/AuthManager.kt`:

```kotlin
package com.flatmates.app.auth

import com.flatmates.app.data.local.dao.UserDao
import com.flatmates.app.data.mapper.toEntity
import com.flatmates.app.data.remote.api.AuthApi
import com.flatmates.app.data.remote.dto.GoogleAuthRequest
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
    
    suspend fun signInWithGoogle(idToken: String): Result<Unit> {
        return try {
            val response = authApi.googleSignIn(GoogleAuthRequest(idToken))
            
            if (response.isSuccessful && response.body() != null) {
                val authResponse = response.body()!!
                
                // Save tokens
                tokenManager.saveTokens(
                    accessToken = authResponse.accessToken,
                    refreshToken = authResponse.refreshToken,
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
            Result.Error(e, "Network error during sign in")
        }
    }
    
    suspend fun refreshToken(): Result<Unit> {
        return try {
            val refreshToken = tokenManager.getRefreshToken()
                ?: return Result.Error(message = "No refresh token")
            
            val response = authApi.refreshToken(
                com.flatmates.app.data.remote.dto.RefreshTokenRequest(refreshToken)
            )
            
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
                Result.Error(message = "Session expired")
            }
        } catch (e: Exception) {
            Result.Error(e, "Failed to refresh token")
        }
    }
    
    suspend fun signOut() {
        googleAuthClient.signOut()
        tokenManager.clearTokens()
        userDao.deleteAll()
    }
}
```

#### 7. Create Sync Manager & Worker

`data/sync/SyncManager.kt`:

```kotlin
package com.flatmates.app.data.sync

import android.content.Context
import androidx.work.*
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    private val workManager = WorkManager.getInstance(context)
    
    companion object {
        const val SYNC_WORK_NAME = "flatmates_sync"
        const val IMMEDIATE_SYNC_TAG = "immediate_sync"
    }
    
    fun getSyncStatus(): Flow<SyncStatus> {
        return workManager.getWorkInfosForUniqueWorkLiveData(SYNC_WORK_NAME)
            .asFlow()
            .map { workInfos ->
                val workInfo = workInfos.firstOrNull()
                when (workInfo?.state) {
                    WorkInfo.State.RUNNING -> SyncStatus.SYNCING
                    WorkInfo.State.ENQUEUED -> SyncStatus.PENDING
                    WorkInfo.State.FAILED -> SyncStatus.FAILED
                    WorkInfo.State.SUCCEEDED -> SyncStatus.SYNCED
                    else -> SyncStatus.IDLE
                }
            }
    }
    
    fun schedulePeriodicSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()
        
        val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
            15, TimeUnit.MINUTES, // Minimum periodic interval
            5, TimeUnit.MINUTES   // Flex interval
        )
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                WorkRequest.MIN_BACKOFF_MILLIS,
                TimeUnit.MILLISECONDS
            )
            .build()
        
        workManager.enqueueUniquePeriodicWork(
            SYNC_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
    }
    
    fun requestImmediateSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        
        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .addTag(IMMEDIATE_SYNC_TAG)
            .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .build()
        
        workManager.enqueue(syncRequest)
    }
    
    fun cancelSync() {
        workManager.cancelUniqueWork(SYNC_WORK_NAME)
    }
}

enum class SyncStatus {
    IDLE, PENDING, SYNCING, SYNCED, FAILED
}
```

`data/sync/SyncWorker.kt`:

```kotlin
package com.flatmates.app.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.flatmates.app.data.local.dao.*
import com.flatmates.app.data.local.datastore.UserPreferences
import com.flatmates.app.data.mapper.*
import com.flatmates.app.data.remote.api.SyncApi
import com.flatmates.app.data.remote.dto.*
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val syncApi: SyncApi,
    private val todoDao: TodoDao,
    private val shoppingDao: ShoppingDao,
    private val expenseDao: ExpenseDao,
    private val syncQueueDao: SyncQueueDao,
    private val householdDao: HouseholdDao,
    private val userPreferences: UserPreferences
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            val householdId = householdDao.getActiveHousehold()
                ?.let { flow -> 
                    var result: String? = null
                    flow.collect { result = it?.id; return@collect }
                    result
                } ?: return@withContext Result.success() // No household, nothing to sync
            
            val lastSyncTimestamp = userPreferences.getLastSyncTimestamp()
            
            // Gather local changes from sync queue
            val pendingChanges = gatherPendingChanges()
            
            // Build sync request
            val syncRequest = SyncRequest(
                lastSyncTimestamp = lastSyncTimestamp,
                householdId = householdId,
                changes = pendingChanges
            )
            
            // Make API call
            val response = syncApi.syncAll(syncRequest)
            
            if (response.isSuccessful && response.body() != null) {
                val syncResponse = response.body()!!
                
                // Apply server changes to local database
                applyServerChanges(syncResponse)
                
                // Handle conflicts (server wins for now)
                handleConflicts(syncResponse.conflicts)
                
                // Clear sync queue for successfully synced items
                syncQueueDao.clearAll()
                
                // Update last sync timestamp
                userPreferences.setLastSyncTimestamp(syncResponse.serverTimestamp)
                
                Result.success()
            } else {
                // Retry with backoff
                Result.retry()
            }
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
    
    private suspend fun gatherPendingChanges(): SyncChanges {
        val pendingTodos = todoDao.getPendingSyncTodos()
        val pendingShoppingLists = shoppingDao.getPendingSyncLists()
        val pendingShoppingItems = shoppingDao.getPendingSyncItems()
        val pendingExpenses = expenseDao.getPendingSyncExpenses()
        
        return SyncChanges(
            todos = EntityChanges(
                created = pendingTodos
                    .filter { it.syncStatus == "PENDING_CREATE" }
                    .map { it.toDto() },
                updated = pendingTodos
                    .filter { it.syncStatus == "PENDING_UPDATE" }
                    .map { it.toDto() },
                deleted = pendingTodos
                    .filter { it.syncStatus == "PENDING_DELETE" }
                    .map { it.id }
            ),
            shoppingLists = EntityChanges(
                created = pendingShoppingLists
                    .filter { it.syncStatus == "PENDING_CREATE" }
                    .map { it.toDto() },
                updated = pendingShoppingLists
                    .filter { it.syncStatus == "PENDING_UPDATE" }
                    .map { it.toDto() },
                deleted = pendingShoppingLists
                    .filter { it.syncStatus == "PENDING_DELETE" }
                    .map { it.id }
            ),
            shoppingItems = EntityChanges(
                created = pendingShoppingItems
                    .filter { it.syncStatus == "PENDING_CREATE" }
                    .map { it.toDto() },
                updated = pendingShoppingItems
                    .filter { it.syncStatus == "PENDING_UPDATE" }
                    .map { it.toDto() },
                deleted = pendingShoppingItems
                    .filter { it.syncStatus == "PENDING_DELETE" }
                    .map { it.id }
            ),
            expenses = EntityChanges(
                created = pendingExpenses
                    .filter { it.syncStatus == "PENDING_CREATE" }
                    .map { it.toDto() },
                updated = pendingExpenses
                    .filter { it.syncStatus == "PENDING_UPDATE" }
                    .map { it.toDto() },
                deleted = pendingExpenses
                    .filter { it.syncStatus == "PENDING_DELETE" }
                    .map { it.id }
            )
        )
    }
    
    private suspend fun applyServerChanges(response: SyncResponse) {
        // Apply todos
        response.todos.forEach { dto ->
            val entity = dto.toEntity()
            todoDao.insert(entity)
        }
        
        // Apply shopping lists
        response.shoppingLists.forEach { dto ->
            val entity = dto.toEntity()
            shoppingDao.insertList(entity)
        }
        
        // Apply shopping items
        response.shoppingItems.forEach { dto ->
            val entity = dto.toEntity()
            shoppingDao.insertItem(entity)
        }
        
        // Apply expenses
        response.expenses.forEach { dto ->
            val entity = dto.toEntity()
            expenseDao.insertExpense(entity)
        }
    }
    
    private suspend fun handleConflicts(conflicts: List<SyncConflict>) {
        // For now, server wins - local changes are discarded
        // In future, could show conflicts to user
        conflicts.forEach { conflict ->
            when (conflict.entityType) {
                "todo" -> todoDao.updateSyncStatus(conflict.entityId, "SYNCED")
                "shopping_item" -> shoppingDao.updateItemSyncStatus(conflict.entityId, "SYNCED")
                // etc.
            }
        }
    }
}
```

#### 8. Create Network Module

`di/NetworkModule.kt`:

```kotlin
package com.flatmates.app.di

import com.flatmates.app.BuildConfig
import com.flatmates.app.data.remote.api.FlatmatesApi
import com.flatmates.app.data.remote.interceptor.AuthInterceptor
import com.flatmates.app.data.remote.interceptor.NetworkInterceptor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        networkInterceptor: NetworkInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(networkInterceptor)
            .addInterceptor(authInterceptor)
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    level = if (BuildConfig.DEBUG) {
                        HttpLoggingInterceptor.Level.BODY
                    } else {
                        HttpLoggingInterceptor.Level.NONE
                    }
                }
            )
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        json: Json
    ): Retrofit {
        return Retrofit.Builder()
            .baseUrl(BuildConfig.API_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }
    
    @Provides
    @Singleton
    fun provideFlatmatesApi(retrofit: Retrofit): FlatmatesApi {
        return retrofit.create(FlatmatesApi::class.java)
    }
}
```

#### 9. Create Login Screen

`ui/screens/auth/LoginViewModel.kt`:

```kotlin
package com.flatmates.app.ui.screens.auth

import android.content.Intent
import androidx.activity.result.IntentSenderRequest
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.auth.AuthManager
import com.flatmates.app.auth.GoogleAuthClient
import com.flatmates.app.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class LoginUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLoggedIn: Boolean = false
)

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authManager: AuthManager,
    private val googleAuthClient: GoogleAuthClient
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    private val _signInIntent = MutableSharedFlow<IntentSenderRequest>()
    val signInIntent: SharedFlow<IntentSenderRequest> = _signInIntent.asSharedFlow()
    
    init {
        viewModelScope.launch {
            authManager.isLoggedIn.collect { isLoggedIn ->
                _uiState.update { it.copy(isLoggedIn = isLoggedIn) }
            }
        }
    }
    
    fun startGoogleSignIn() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            val intentSender = googleAuthClient.beginSignIn()
            if (intentSender != null) {
                _signInIntent.emit(intentSender)
            } else {
                _uiState.update { 
                    it.copy(isLoading = false, error = "Google Sign-In unavailable")
                }
            }
        }
    }
    
    fun handleSignInResult(intent: Intent?) {
        viewModelScope.launch {
            if (intent == null) {
                _uiState.update { it.copy(isLoading = false, error = "Sign-in cancelled") }
                return@launch
            }
            
            val idToken = googleAuthClient.getIdTokenFromIntent(intent)
            if (idToken == null) {
                _uiState.update { it.copy(isLoading = false, error = "Failed to get credentials") }
                return@launch
            }
            
            when (val result = authManager.signInWithGoogle(idToken)) {
                is Result.Success -> {
                    _uiState.update { it.copy(isLoading = false, isLoggedIn = true) }
                }
                is Result.Error -> {
                    _uiState.update { 
                        it.copy(isLoading = false, error = result.message ?: "Sign-in failed") 
                    }
                }
            }
        }
    }
    
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
}
```

`ui/screens/auth/LoginScreen.kt`:

```kotlin
package com.flatmates.app.ui.screens.auth

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.flatmates.app.R
import com.flatmates.app.ui.theme.Spacing

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: LoginViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    val signInLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartIntentSenderForResult()
    ) { result ->
        viewModel.handleSignInResult(result.data)
    }
    
    // Observe sign-in intent
    LaunchedEffect(Unit) {
        viewModel.signInIntent.collect { intentSender ->
            signInLauncher.launch(intentSender)
        }
    }
    
    // Navigate on successful login
    LaunchedEffect(uiState.isLoggedIn) {
        if (uiState.isLoggedIn) {
            onLoginSuccess()
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(Spacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Logo
        Image(
            painter = painterResource(id = R.drawable.ic_logo),
            contentDescription = "Flatmates Logo",
            modifier = Modifier.size(120.dp)
        )
        
        Spacer(modifier = Modifier.height(Spacing.xl))
        
        // Title
        Text(
            text = "Flatmates",
            style = MaterialTheme.typography.headlineLarge,
            fontWeight = FontWeight.Bold
        )
        
        Text(
            text = "Manage your shared home together",
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = Spacing.sm)
        )
        
        Spacer(modifier = Modifier.height(Spacing.xl * 2))
        
        // Google Sign-In button
        OutlinedButton(
            onClick = { viewModel.startGoogleSignIn() },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            enabled = !uiState.isLoading
        ) {
            if (uiState.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    strokeWidth = 2.dp
                )
            } else {
                Image(
                    painter = painterResource(id = R.drawable.ic_google),
                    contentDescription = null,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Text("Continue with Google")
            }
        }
        
        // Error message
        if (uiState.error != null) {
            Spacer(modifier = Modifier.height(Spacing.md))
            Text(
                text = uiState.error!!,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = TextAlign.Center
            )
        }
        
        Spacer(modifier = Modifier.height(Spacing.xl))
        
        // Terms
        Text(
            text = "By continuing, you agree to our Terms of Service and Privacy Policy",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
    }
}
```

### Build Configuration

Add to `app/build.gradle.kts`:

```kotlin
android {
    defaultConfig {
        buildConfigField("String", "API_BASE_URL", "\"${System.getenv("API_BASE_URL") ?: "https://api.example.com/"}\"")
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"${System.getenv("GOOGLE_WEB_CLIENT_ID") ?: ""}\"")
    }
}
```

### Success Criteria

- [ ] Google Sign-In works end-to-end
- [ ] Tokens are securely stored in DataStore
- [ ] Auth interceptor adds Bearer token to requests
- [ ] Token refresh works automatically
- [ ] SyncWorker runs periodically (every 15 min)
- [ ] Immediate sync can be triggered
- [ ] Local changes are synced to server
- [ ] Server changes are applied locally
- [ ] Conflicts are handled (server wins)
- [ ] Offline mode works (queue changes)
- [ ] Network errors are handled gracefully

### Do NOT

- Implement complex conflict resolution UI (server wins is fine)
- Add push notifications (can be done in polish phase)
- Implement real-time sync (WebSocket)
- Add biometric authentication

### Verification

```bash
cd /workspaces/flatmates-app/android-app

# Build
./gradlew assembleDebug

# Run with API URL
API_BASE_URL="https://your-api.example.com" ./gradlew installDebug
```
