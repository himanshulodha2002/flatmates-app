package com.flatmates.app.ui.screens.auth

import android.content.Intent
import androidx.activity.result.IntentSenderRequest
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.auth.AuthManager
import com.flatmates.app.auth.GoogleAuthClient
import com.flatmates.app.data.sync.SyncManager
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
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            val intentSender = googleAuthClient.beginSignIn()
            if (intentSender != null) {
                _events.emit(LoginEvent.ShowSignInIntent(intentSender))
            } else {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        error = "Google Sign-In is unavailable. Please check your Google Play Services."
                    )
                }
            }
        }
    }
    
    fun handleSignInResult(intent: Intent?) {
        viewModelScope.launch {
            if (intent == null) {
                _uiState.update { it.copy(isLoading = false, error = "Sign-in was cancelled") }
                return@launch
            }
            
            val idToken = googleAuthClient.getIdTokenFromIntent(intent)
            if (idToken == null) {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        error = "Failed to get credentials from Google"
                    ) 
                }
                return@launch
            }
            
            when (val result = authManager.signInWithGoogle(idToken)) {
                is Result.Success -> {
                    _uiState.update { it.copy(isLoading = false, isLoggedIn = true) }
                    syncManager.schedulePeriodicSync()
                    syncManager.requestImmediateSync()
                    _events.emit(LoginEvent.NavigateToHome)
                }
                is Result.Error -> {
                    val errorMessage = result.message ?: result.exception?.message ?: "Sign-in failed"
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
