package com.flatmates.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.auth.AuthManager
import com.flatmates.app.domain.repository.HouseholdRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

data class MainUiState(
    val isLoggedIn: Boolean = false,
    val hasHousehold: Boolean = false,
    val isLoading: Boolean = true
)

@HiltViewModel
class MainViewModel @Inject constructor(
    private val authManager: AuthManager,
    private val householdRepository: HouseholdRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()
    
    init {
        observeAuthState()
    }
    
    private fun observeAuthState() {
        viewModelScope.launch {
            authManager.isLoggedIn.collect { isLoggedIn ->
                if (isLoggedIn) {
                    checkHouseholdStatus()
                } else {
                    _uiState.value = MainUiState(
                        isLoggedIn = false,
                        hasHousehold = false,
                        isLoading = false
                    )
                }
            }
        }
    }
    
    private suspend fun checkHouseholdStatus() {
        try {
            val households = householdRepository.getHouseholds().first()
            val activeHousehold = householdRepository.getActiveHousehold().first()
            
            _uiState.value = MainUiState(
                isLoggedIn = true,
                hasHousehold = households.isNotEmpty() || activeHousehold != null,
                isLoading = false
            )
        } catch (e: Exception) {
            // If there's an error checking, assume no household
            _uiState.value = MainUiState(
                isLoggedIn = true,
                hasHousehold = false,
                isLoading = false
            )
        }
    }
    
    fun onLoginSuccess() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoggedIn = true, isLoading = true)
            checkHouseholdStatus()
        }
    }
    
    fun onHouseholdSetupComplete() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(hasHousehold = true)
        }
    }
    
    fun refreshHouseholdStatus() {
        viewModelScope.launch {
            checkHouseholdStatus()
        }
    }
}
