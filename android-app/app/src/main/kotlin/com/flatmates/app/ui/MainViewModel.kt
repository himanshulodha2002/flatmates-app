package com.flatmates.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.auth.AuthManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MainUiState(
    val isLoggedIn: Boolean = false,
    val isLoading: Boolean = true
)

@HiltViewModel
class MainViewModel @Inject constructor(
    private val authManager: AuthManager
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()
    
    init {
        viewModelScope.launch {
            authManager.isLoggedIn.collect { isLoggedIn ->
                _uiState.value = MainUiState(
                    isLoggedIn = isLoggedIn,
                    isLoading = false
                )
            }
        }
    }
    
    fun onLoginSuccess() {
        // Force refresh the state - the Flow should already have updated,
        // but this ensures the UI recomposes
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoggedIn = true)
        }
    }
}
