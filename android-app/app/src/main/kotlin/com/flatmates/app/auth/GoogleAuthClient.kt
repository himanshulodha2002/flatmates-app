package com.flatmates.app.auth

import android.content.Context
import android.content.Intent
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
        } catch (e: ApiException) {
            when (e.statusCode) {
                CommonStatusCodes.CANCELED -> null
                CommonStatusCodes.NETWORK_ERROR -> null
                else -> null
            }
        } catch (e: Exception) {
            null
        }
    }
    
    fun getIdTokenFromIntent(intent: Intent): String? {
        return try {
            val credential = signInClient.getSignInCredentialFromIntent(intent)
            credential.googleIdToken
        } catch (e: ApiException) {
            null
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
    
    fun getSignInClient(): SignInClient = signInClient
}
