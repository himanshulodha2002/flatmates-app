package com.flatmates.app.ui.screens.shopping

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.ShoppingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import java.util.UUID
import javax.inject.Inject

/**
 * UI State for the Shopping screen.
 */
data class ShoppingUiState(
    val shoppingLists: List<ShoppingList> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val showAddListSheet: Boolean = false
)

/**
 * ViewModel for the Shopping screen.
 * Manages shopping lists and their items.
 */
@HiltViewModel
class ShoppingViewModel @Inject constructor(
    private val householdRepository: HouseholdRepository,
    private val shoppingRepository: ShoppingRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ShoppingUiState())
    val uiState: StateFlow<ShoppingUiState> = _uiState.asStateFlow()
    
    private var currentHouseholdId: String? = null
    
    init {
        loadShoppingLists()
    }
    
    private fun loadShoppingLists() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            try {
                householdRepository.getActiveHousehold()
                    .filterNotNull()
                    .collectLatest { household ->
                        currentHouseholdId = household.id
                        shoppingRepository.getShoppingLists(household.id)
                            .collect { lists ->
                                _uiState.update { 
                                    it.copy(
                                        shoppingLists = lists,
                                        isLoading = false
                                    ) 
                                }
                            }
                    }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "Failed to load shopping lists"
                    ) 
                }
            }
        }
    }
    
    /**
     * Create a new shopping list.
     */
    fun createList(name: String, description: String?) {
        viewModelScope.launch {
            val householdId = currentHouseholdId ?: return@launch
            val now = Clock.System.now()
            
            val list = ShoppingList(
                id = UUID.randomUUID().toString(),
                householdId = householdId,
                name = name,
                description = description,
                createdBy = "", // Will be set from user context
                createdAt = now,
                updatedAt = now
            )
            
            shoppingRepository.createList(list)
            _uiState.update { it.copy(showAddListSheet = false) }
        }
    }
    
    /**
     * Delete a shopping list.
     */
    fun deleteList(listId: String) {
        viewModelScope.launch {
            shoppingRepository.deleteList(listId)
        }
    }
    
    /**
     * Show the add list bottom sheet.
     */
    fun showAddListSheet() {
        _uiState.update { it.copy(showAddListSheet = true) }
    }
    
    /**
     * Hide the add list bottom sheet.
     */
    fun hideAddListSheet() {
        _uiState.update { it.copy(showAddListSheet = false) }
    }
}
