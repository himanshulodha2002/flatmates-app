package com.flatmates.app.auth

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.activity.result.IntentSenderRequest
import com.google.android.gms.auth.api.identity.BeginSignInRequest
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.auth.api.identity.SignInClient
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.CommonStatusCodes
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton
import com.flatmates.app.BuildConfig

private const val TAG = "GoogleAuthClient"

@Singleton
class GoogleAuthClient @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    private val signInClient: SignInClient = Identity.getSignInClient(context)
    
    suspend fun beginSignIn(): BeginSignInResult {
        return try {
            Log.d(TAG, "Starting Google Sign-In with client ID: ${BuildConfig.GOOGLE_WEB_CLIENT_ID}")
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
            Log.d(TAG, "Sign-in intent created successfully")
            BeginSignInResult.Success(IntentSenderRequest.Builder(result.pendingIntent.intentSender).build())
        } catch (e: ApiException) {
            Log.e(TAG, "ApiException during beginSignIn: statusCode=${e.statusCode}, message=${e.message}", e)
            when (e.statusCode) {
                CommonStatusCodes.CANCELED -> BeginSignInResult.Cancelled
                CommonStatusCodes.NETWORK_ERROR -> BeginSignInResult.Error("Network error. Please check your connection.")
                16 -> BeginSignInResult.Error("Google Sign-In not configured. Please check OAuth setup in Google Cloud Console.")
                else -> BeginSignInResult.Error("Sign-in failed (code: ${e.statusCode}): ${e.message}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Exception during beginSignIn", e)
            BeginSignInResult.Error("Sign-in failed: ${e.message}")
        }
    }
    
    fun getIdTokenFromIntent(intent: Intent): GetTokenResult {
        return try {
            val credential = signInClient.getSignInCredentialFromIntent(intent)
            val token = credential.googleIdToken
            if (token != null) {
                Log.d(TAG, "Successfully retrieved ID token from intent")
                GetTokenResult.Success(token)
            } else {
                Log.e(TAG, "Credential retrieved but googleIdToken is null")
                GetTokenResult.Error("No ID token in credential. This may be an OAuth configuration issue.")
            }
        } catch (e: ApiException) {
            Log.e(TAG, "ApiException getting credential: statusCode=${e.statusCode}", e)
            GetTokenResult.Error("Failed to get credential (code: ${e.statusCode}): ${e.message}")
        } catch (e: Exception) {
            Log.e(TAG, "Exception getting credential", e)
            GetTokenResult.Error("Failed to get credential: ${e.message}")
        }
    }
    
    suspend fun signOut() {
        try {
            signInClient.signOut().await()
        } catch (e: Exception) {
            // Ignore errors during sign out
        }
    }
    
    fun getSignInClient(): SignInClient = signInClient
}

sealed class BeginSignInResult {
    data class Success(val intentSenderRequest: IntentSenderRequest) : BeginSignInResult()
    data class Error(val message: String) : BeginSignInResult()
    data object Cancelled : BeginSignInResult()
}

sealed class GetTokenResult {
    data class Success(val idToken: String) : GetTokenResult()
    data class Error(val message: String) : GetTokenResult()
}
