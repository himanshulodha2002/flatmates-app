package com.flatmates.app.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.model.User
import com.flatmates.app.domain.repository.AuthRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.usecase.household.CreateHouseholdUseCase
import com.flatmates.app.domain.usecase.household.JoinHouseholdUseCase
import com.flatmates.app.domain.util.Result
import com.flatmates.app.data.remote.api.FlatmatesApi
import com.flatmates.app.data.remote.dto.InviteCreateRequest
import com.flatmates.app.data.remote.dto.CreatePublicInviteRequest
import com.flatmates.app.data.sync.SyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
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
    // Dialogs/Sheets visibility
    val showHouseholdSwitcher: Boolean = false,
    val showInviteMember: Boolean = false,
    val showCreateHousehold: Boolean = false,
    val showJoinHousehold: Boolean = false,
    val showNotificationSettings: Boolean = false,
    val showAppearanceSettings: Boolean = false,
    val showAbout: Boolean = false,
    // Invite state
    val isCreatingInvite: Boolean = false,
    val inviteToken: String? = null,
    val inviteError: String? = null,
    // Create household state
    val isCreatingHousehold: Boolean = false,
    val createHouseholdError: String? = null,
    // Join household state
    val isJoiningHousehold: Boolean = false,
    val joinHouseholdError: String? = null,
    // Sync state
    val pendingSyncCount: Int = 0,
    val isSyncing: Boolean = false
)

/**
 * ViewModel for the Profile screen.
 * Manages user profile and household switching.
 */
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val householdRepository: HouseholdRepository,
    private val authRepository: AuthRepository,
    private val api: FlatmatesApi,
    private val createHouseholdUseCase: CreateHouseholdUseCase,
    private val joinHouseholdUseCase: JoinHouseholdUseCase,
    private val syncManager: SyncManager
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
    
    /**
     * Show the invite member sheet.
     */
    fun showInviteMember() {
        _uiState.update { 
            it.copy(
                showInviteMember = true,
                inviteToken = null,
                inviteError = null
            ) 
        }
    }
    
    /**
     * Hide the invite member sheet.
     */
    fun hideInviteMember() {
        _uiState.update { 
            it.copy(
                showInviteMember = false,
                inviteToken = null,
                inviteError = null
            ) 
        }
    }
    
    /**
     * Create an invite for the current household.
     */
    fun createInvite(email: String) {
        val householdId = _uiState.value.currentHousehold?.id ?: return
        
        viewModelScope.launch {
            _uiState.update { it.copy(isCreatingInvite = true, inviteError = null) }
            
            try {
                val response = api.createInvite(householdId, InviteCreateRequest(email))
                if (response.isSuccessful) {
                    val invite = response.body()
                    _uiState.update { 
                        it.copy(
                            isCreatingInvite = false,
                            inviteToken = invite?.token
                        ) 
                    }
                } else {
                    _uiState.update { 
                        it.copy(
                            isCreatingInvite = false,
                            inviteError = "Failed to create invite. Please try again."
                        ) 
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isCreatingInvite = false,
                        inviteError = e.message ?: "Failed to create invite"
                    ) 
                }
            }
        }
    }
    
    /**
     * Create a public invite code for the current household.
     * The code can be shared with anyone who can then join.
     */
    fun createPublicInvite() {
        val householdId = _uiState.value.currentHousehold?.id ?: return
        
        viewModelScope.launch {
            _uiState.update { it.copy(isCreatingInvite = true, inviteError = null) }
            
            try {
                val response = api.createPublicInvite(householdId, CreatePublicInviteRequest())
                if (response.isSuccessful) {
                    val invite = response.body()
                    _uiState.update { 
                        it.copy(
                            isCreatingInvite = false,
                            inviteToken = invite?.token
                        ) 
                    }
                } else {
                    _uiState.update { 
                        it.copy(
                            isCreatingInvite = false,
                            inviteError = "Failed to create invite code. Please try again."
                        ) 
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isCreatingInvite = false,
                        inviteError = e.message ?: "Failed to create invite code"
                    ) 
                }
            }
        }
    }
    
    // ==================== CREATE HOUSEHOLD ====================
    
    fun showCreateHousehold() {
        _uiState.update { 
            it.copy(
                showHouseholdSwitcher = false,
                showCreateHousehold = true,
                createHouseholdError = null
            ) 
        }
    }
    
    fun hideCreateHousehold() {
        _uiState.update { 
            it.copy(
                showCreateHousehold = false,
                createHouseholdError = null
            ) 
        }
    }
    
    fun createHousehold(name: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isCreatingHousehold = true, createHouseholdError = null) }
            
            val currentUser = authRepository.currentUser.first()
            if (currentUser == null) {
                _uiState.update { 
                    it.copy(isCreatingHousehold = false, createHouseholdError = "Not logged in") 
                }
                return@launch
            }
            
            when (val result = createHouseholdUseCase(name, currentUser.id)) {
                is Result.Success -> {
                    householdRepository.switchActiveHousehold(result.data.id)
                    _uiState.update { 
                        it.copy(
                            isCreatingHousehold = false,
                            showCreateHousehold = false
                        ) 
                    }
                }
                is Result.Error -> {
                    _uiState.update { 
                        it.copy(
                            isCreatingHousehold = false,
                            createHouseholdError = result.message ?: "Failed to create household"
                        ) 
                    }
                }
                is Result.Loading -> { /* Ignore */ }
            }
        }
    }
    
    // ==================== JOIN HOUSEHOLD ====================
    
    fun showJoinHousehold() {
        _uiState.update { 
            it.copy(
                showHouseholdSwitcher = false,
                showJoinHousehold = true,
                joinHouseholdError = null
            ) 
        }
    }
    
    fun hideJoinHousehold() {
        _uiState.update { 
            it.copy(
                showJoinHousehold = false,
                joinHouseholdError = null
            ) 
        }
    }
    
    fun joinHousehold(inviteCode: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isJoiningHousehold = true, joinHouseholdError = null) }
            
            when (val result = joinHouseholdUseCase(inviteCode)) {
                is Result.Success -> {
                    householdRepository.switchActiveHousehold(result.data.id)
                    _uiState.update { 
                        it.copy(
                            isJoiningHousehold = false,
                            showJoinHousehold = false
                        ) 
                    }
                }
                is Result.Error -> {
                    _uiState.update { 
                        it.copy(
                            isJoiningHousehold = false,
                            joinHouseholdError = result.message ?: "Invalid invite code"
                        ) 
                    }
                }
                is Result.Loading -> { /* Ignore */ }
            }
        }
    }
    
    // ==================== SETTINGS SHEETS ====================
    
    fun showNotificationSettings() {
        _uiState.update { it.copy(showNotificationSettings = true) }
    }
    
    fun hideNotificationSettings() {
        _uiState.update { it.copy(showNotificationSettings = false) }
    }
    
    fun showAppearanceSettings() {
        _uiState.update { it.copy(showAppearanceSettings = true) }
    }
    
    fun hideAppearanceSettings() {
        _uiState.update { it.copy(showAppearanceSettings = false) }
    }
    
    fun showAbout() {
        _uiState.update { it.copy(showAbout = true) }
    }
    
    fun hideAbout() {
        _uiState.update { it.copy(showAbout = false) }
    }
    
    // ==================== SYNC ====================
    
    fun syncNow() {
        viewModelScope.launch {
            _uiState.update { it.copy(isSyncing = true) }
            syncManager.requestImmediateSync()
            // Give some time for sync to complete
            kotlinx.coroutines.delay(2000)
            _uiState.update { it.copy(isSyncing = false, pendingSyncCount = 0) }
        }
    }
}
