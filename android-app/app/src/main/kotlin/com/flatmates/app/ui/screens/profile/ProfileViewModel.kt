package com.flatmates.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.model.User
import com.flatmates.app.domain.repository.AuthRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * UI State for the Profile screen.
 */
data class ProfileUiState(
    val user: User? = null,
    val currentHousehold: Household? = null,
    val households: List<Household> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val showHouseholdSwitcher: Boolean = false,
    val pendingSyncCount: Int = 0
)

/**
 * ViewModel for the Profile screen.
 * Manages user profile and household switching.
 */
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val householdRepository: HouseholdRepository,
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()
    
    init {
        loadProfile()
    }
    
    private fun loadProfile() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            try {
                // Load current user from auth
                launch {
                    authRepository.currentUser
                        .filterNotNull()
                        .collect { user ->
                            _uiState.update { it.copy(user = user) }
                        }
                }
                
                // Load current household
                launch {
                    householdRepository.getActiveHousehold()
                        .collect { household ->
                            _uiState.update { it.copy(currentHousehold = household) }
                        }
                }
                
                // Load all households
                launch {
                    householdRepository.getHouseholds()
                        .collect { households ->
                            _uiState.update { 
                                it.copy(
                                    households = households,
                                    isLoading = false
                                ) 
                            }
                        }
                }
                
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "Failed to load profile"
                    ) 
                }
            }
        }
    }
    
    /**
     * Switch to a different household.
     */
    fun switchHousehold(householdId: String) {
        viewModelScope.launch {
            householdRepository.switchActiveHousehold(householdId)
            _uiState.update { it.copy(showHouseholdSwitcher = false) }
        }
    }
    
    /**
     * Show the household switcher.
     */
    fun showHouseholdSwitcher() {
        _uiState.update { it.copy(showHouseholdSwitcher = true) }
    }
    
    /**
     * Hide the household switcher.
     */
    fun hideHouseholdSwitcher() {
        _uiState.update { it.copy(showHouseholdSwitcher = false) }
    }
    
    /**
     * Sign out the current user.
     */
    fun signOut() {
        viewModelScope.launch {
            authRepository.signOut()
        }
    }
}
