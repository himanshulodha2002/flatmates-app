package com.flatmates.app.ui.screens.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.repository.AuthRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.usecase.household.CreateHouseholdUseCase
import com.flatmates.app.domain.usecase.household.JoinHouseholdUseCase
import com.flatmates.app.domain.util.Result
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

enum class SetupStep {
    Choice,
    CreateHousehold,
    JoinHousehold
}

data class HouseholdSetupUiState(
    val currentStep: SetupStep = SetupStep.Choice,
    val householdName: String = "",
    val inviteCode: String = "",
    val isLoading: Boolean = false,
    val error: String? = null,
    val isSetupComplete: Boolean = false
)

@HiltViewModel
class HouseholdSetupViewModel @Inject constructor(
    private val createHouseholdUseCase: CreateHouseholdUseCase,
    private val joinHouseholdUseCase: JoinHouseholdUseCase,
    private val householdRepository: HouseholdRepository,
    private val authRepository: AuthRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(HouseholdSetupUiState())
    val uiState: StateFlow<HouseholdSetupUiState> = _uiState.asStateFlow()
    
    fun navigateToChoice() {
        _uiState.update { it.copy(currentStep = SetupStep.Choice) }
    }
    
    fun navigateToCreate() {
        _uiState.update { it.copy(currentStep = SetupStep.CreateHousehold) }
    }
    
    fun navigateToJoin() {
        _uiState.update { it.copy(currentStep = SetupStep.JoinHousehold) }
    }
    
    fun updateHouseholdName(name: String) {
        _uiState.update { it.copy(householdName = name) }
    }
    
    fun updateInviteCode(code: String) {
        _uiState.update { it.copy(inviteCode = code) }
    }
    
    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
    
    fun createHousehold() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            val currentUser = authRepository.currentUser.first()
            if (currentUser == null) {
                _uiState.update { 
                    it.copy(isLoading = false, error = "You must be logged in to create a household") 
                }
                return@launch
            }
            
            when (val result = createHouseholdUseCase(
                name = _uiState.value.householdName,
                createdBy = currentUser.id
            )) {
                is Result.Success -> {
                    // Set this as the active household
                    householdRepository.switchActiveHousehold(result.data.id)
                    _uiState.update { 
                        it.copy(isLoading = false, isSetupComplete = true) 
                    }
                }
                is Result.Error -> {
                    _uiState.update { 
                        it.copy(
                            isLoading = false, 
                            error = result.message ?: "Failed to create household"
                        ) 
                    }
                }
                is Result.Loading -> {
                    // Ignore
                }
            }
        }
    }
    
    fun joinHousehold() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            when (val result = joinHouseholdUseCase(_uiState.value.inviteCode)) {
                is Result.Success -> {
                    // Set the joined household as active
                    householdRepository.switchActiveHousehold(result.data.id)
                    _uiState.update { 
                        it.copy(isLoading = false, isSetupComplete = true) 
                    }
                }
                is Result.Error -> {
                    _uiState.update { 
                        it.copy(
                            isLoading = false, 
                            error = result.message ?: "Failed to join household. Please check your invite code."
                        ) 
                    }
                }
                is Result.Loading -> {
                    // Ignore
                }
            }
        }
    }
}
