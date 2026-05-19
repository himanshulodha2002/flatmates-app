package com.flatmates.app.ui.screens.auth

import android.content.Intent
import android.util.Log
import androidx.activity.result.IntentSenderRequest
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.auth.AuthManager
import com.flatmates.app.auth.BeginSignInResult
import com.flatmates.app.auth.GetTokenResult
import com.flatmates.app.auth.GoogleAuthClient
import com.flatmates.app.data.sync.SyncManager
import com.flatmates.app.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

private const val TAG = "LoginViewModel"

data class LoginUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val isLoggedIn: Boolean = false
)

sealed class LoginEvent {
    data class ShowSignInIntent(val intentSenderRequest: IntentSenderRequest) : LoginEvent()
    data object NavigateToHome : LoginEvent()
    data class ShowError(val message: String) : LoginEvent()
}

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val authManager: AuthManager,
    private val googleAuthClient: GoogleAuthClient,
    private val syncManager: SyncManager
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(LoginUiState())
    val uiState: StateFlow<LoginUiState> = _uiState.asStateFlow()
    
    private val _events = MutableSharedFlow<LoginEvent>()
    val events: SharedFlow<LoginEvent> = _events.asSharedFlow()
    
    init {
        viewModelScope.launch {
            authManager.isLoggedIn.collect { isLoggedIn ->
                _uiState.update { it.copy(isLoggedIn = isLoggedIn) }
                if (isLoggedIn) {
                    // Schedule sync when user is logged in
                    syncManager.schedulePeriodicSync()
                }
            }
        }
    }
    
    fun startGoogleSignIn() {
        viewModelScope.launch {
            Log.d(TAG, "Starting Google Sign-In")
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            when (val result = googleAuthClient.beginSignIn()) {
                is BeginSignInResult.Success -> {
                    Log.d(TAG, "Sign-in intent created, launching...")
                    _events.emit(LoginEvent.ShowSignInIntent(result.intentSenderRequest))
                }
                is BeginSignInResult.Error -> {
                    Log.e(TAG, "Sign-in failed: ${result.message}")
                    _uiState.update { 
                        it.copy(isLoading = false, error = result.message)
                    }
                    _events.emit(LoginEvent.ShowError(result.message))
                }
                is BeginSignInResult.Cancelled -> {
                    Log.d(TAG, "Sign-in was cancelled")
                    _uiState.update { it.copy(isLoading = false) }
                }
            }
        }
    }
    
    fun handleSignInResult(intent: Intent?) {
        viewModelScope.launch {
            Log.d(TAG, "Handling sign-in result, intent=${intent != null}")
            if (intent == null) {
                Log.e(TAG, "Sign-in result intent is null")
                _uiState.update { it.copy(isLoading = false, error = "Sign-in was cancelled") }
                return@launch
            }
            
            when (val tokenResult = googleAuthClient.getIdTokenFromIntent(intent)) {
                is GetTokenResult.Success -> {
                    Log.d(TAG, "Got ID token, sending to backend...")
                    when (val result = authManager.signInWithGoogle(tokenResult.idToken)) {
                        is Result.Success -> {
                            Log.d(TAG, "Backend sign-in successful!")
                            _uiState.update { it.copy(isLoading = false, isLoggedIn = true) }
                            syncManager.schedulePeriodicSync()
                            syncManager.requestImmediateSync()
                            _events.emit(LoginEvent.NavigateToHome)
                        }
                        is Result.Error -> {
                            val errorMessage = result.message ?: result.exception?.message ?: "Sign-in failed"
                            Log.e(TAG, "Backend sign-in failed: $errorMessage")
                            _uiState.update { 
                                it.copy(isLoading = false, error = errorMessage) 
                            }
                            _events.emit(LoginEvent.ShowError(errorMessage))
                        }
                        is Result.Loading -> {
                            // Should not happen
                        }
                    }
                }
                is GetTokenResult.Error -> {
                    Log.e(TAG, "Failed to get ID token: ${tokenResult.message}")
                    _uiState.update { 
                        it.copy(isLoading = false, error = tokenResult.message) 
                    }
                    _events.emit(LoginEvent.ShowError(tokenResult.message))
                }
            }
        }
    }
    
    fun handleSignInCancelled() {
        _uiState.update { it.copy(isLoading = false) }
    }
    
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
    
    fun checkExistingAuth() {
        viewModelScope.launch {
            val isLoggedIn = authManager.isLoggedIn.first()
            if (isLoggedIn) {
                _events.emit(LoginEvent.NavigateToHome)
            }
        }
    }
}
