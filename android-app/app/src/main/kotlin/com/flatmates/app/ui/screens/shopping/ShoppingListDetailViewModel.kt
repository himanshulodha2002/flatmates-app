package com.flatmates.app.ui.screens.shopping

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.domain.repository.ShoppingRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import java.util.UUID
import javax.inject.Inject

/**
 * UI State for the Shopping List Detail screen.
 */
data class ShoppingListDetailUiState(
    val shoppingList: ShoppingList? = null,
    val items: List<ShoppingListItem> = emptyList(),
    val isLoading: Boolean = true,
    val error: String? = null,
    val showAddItemSheet: Boolean = false
)

/**
 * ViewModel for the Shopping List Detail screen.
 */
@HiltViewModel
class ShoppingListDetailViewModel @Inject constructor(
    savedStateHandle: SavedStateHandle,
    private val shoppingRepository: ShoppingRepository
) : ViewModel() {
    
    private val listId: String = savedStateHandle.get<String>("listId") ?: ""
    
    private val _uiState = MutableStateFlow(ShoppingListDetailUiState())
    val uiState: StateFlow<ShoppingListDetailUiState> = _uiState.asStateFlow()
    
    init {
        loadShoppingList()
    }
    
    private fun loadShoppingList() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                // Load the shopping list
                shoppingRepository.getShoppingListById(listId)
                    .collect { list ->
                        _uiState.update { 
                            it.copy(
                                shoppingList = list,
                                items = list?.items ?: emptyList(),
                                isLoading = false
                            ) 
                        }
                    }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "Failed to load shopping list"
                    ) 
                }
            }
        }
    }
    
    /**
     * Add a new item to the shopping list.
     */
    fun addItem(
        name: String,
        quantity: Double,
        unit: String?,
        category: String?
    ) {
        viewModelScope.launch {
            val now = Clock.System.now()
            
            val item = ShoppingListItem(
                id = UUID.randomUUID().toString(),
                shoppingListId = listId,
                name = name,
                quantity = quantity,
                unit = unit,
                category = category,
                createdBy = "", // Will be set from user context
                createdAt = now,
                updatedAt = now
            )
            
            shoppingRepository.addItem(item)
            _uiState.update { it.copy(showAddItemSheet = false) }
        }
    }
    
    /**
     * Toggle the purchased status of an item.
     */
    fun toggleItem(itemId: String) {
        viewModelScope.launch {
            shoppingRepository.toggleItemPurchased(itemId)
        }
    }
    
    /**
     * Delete an item from the shopping list.
     */
    fun deleteItem(itemId: String) {
        viewModelScope.launch {
            shoppingRepository.deleteItem(itemId)
        }
    }
    
    /**
     * Show the add item bottom sheet.
     */
    fun showAddItemSheet() {
        _uiState.update { it.copy(showAddItemSheet = true) }
    }
    
    /**
     * Hide the add item bottom sheet.
     */
    fun hideAddItemSheet() {
        _uiState.update { it.copy(showAddItemSheet = false) }
    }
}
