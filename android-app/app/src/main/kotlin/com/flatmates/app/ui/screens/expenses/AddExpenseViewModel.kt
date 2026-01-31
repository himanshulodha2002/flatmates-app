package com.flatmates.app.ui.screens.expenses

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.Expense
import com.flatmates.app.domain.model.ExpenseSplit
import com.flatmates.app.domain.model.HouseholdMember
import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.domain.model.enums.PaymentMethod
import com.flatmates.app.domain.model.enums.SplitType
import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import java.math.BigDecimal
import java.util.UUID
import javax.inject.Inject

/**
 * UI State for the Add Expense screen.
 */
data class AddExpenseUiState(
    val amount: String = "",
    val description: String = "",
    val category: ExpenseCategory = ExpenseCategory.OTHER,
    val splitType: SplitType = SplitType.EQUAL,
    val householdMembers: List<HouseholdMember> = emptyList(),
    val selectedMembers: Set<String> = emptySet(),
    val isLoading: Boolean = true,
    val isSaving: Boolean = false,
    val error: String? = null,
    val isSaved: Boolean = false
)

/**
 * ViewModel for the Add Expense screen.
 */
@HiltViewModel
class AddExpenseViewModel @Inject constructor(
    private val householdRepository: HouseholdRepository,
    private val expenseRepository: ExpenseRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(AddExpenseUiState())
    val uiState: StateFlow<AddExpenseUiState> = _uiState.asStateFlow()
    
    private var currentHouseholdId: String? = null
    private var currentUserId: String = ""
    
    init {
        loadHouseholdMembers()
    }
    
    private fun loadHouseholdMembers() {
        viewModelScope.launch {
            try {
                householdRepository.getActiveHousehold()
                    .filterNotNull()
                    .first()
                    .let { household ->
                        currentHouseholdId = household.id
                        
                        householdRepository.getHouseholdMembers(household.id)
                            .collect { members ->
                                _uiState.update { 
                                    it.copy(
                                        householdMembers = members,
                                        selectedMembers = members.map { m -> m.id }.toSet(),
                                        isLoading = false
                                    ) 
                                }
                            }
                    }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "Failed to load members"
                    ) 
                }
            }
        }
    }
    
    fun setAmount(amount: String) {
        _uiState.update { it.copy(amount = amount) }
    }
    
    fun setDescription(description: String) {
        _uiState.update { it.copy(description = description) }
    }
    
    fun setCategory(category: ExpenseCategory) {
        _uiState.update { it.copy(category = category) }
    }
    
    fun setSplitType(splitType: SplitType) {
        _uiState.update { it.copy(splitType = splitType) }
    }
    
    fun toggleMember(memberId: String) {
        _uiState.update { state ->
            val newSelected = if (memberId in state.selectedMembers) {
                state.selectedMembers - memberId
            } else {
                state.selectedMembers + memberId
            }
            state.copy(selectedMembers = newSelected)
        }
    }
    
    /**
     * Save the expense.
     */
    fun saveExpense() {
        val state = _uiState.value
        val amount = state.amount.toBigDecimalOrNull()
        
        if (amount == null || amount <= BigDecimal.ZERO) {
            _uiState.update { it.copy(error = "Please enter a valid amount") }
            return
        }
        
        if (state.description.isBlank()) {
            _uiState.update { it.copy(error = "Please enter a description") }
            return
        }
        
        if (state.selectedMembers.isEmpty()) {
            _uiState.update { it.copy(error = "Please select at least one member") }
            return
        }
        
        viewModelScope.launch {
            _uiState.update { it.copy(isSaving = true, error = null) }
            
            try {
                val householdId = currentHouseholdId ?: throw Exception("No household selected")
                val now = Clock.System.now()
                
                // Calculate splits
                val splitAmount = amount.divide(
                    BigDecimal(state.selectedMembers.size),
                    2,
                    java.math.RoundingMode.HALF_UP
                )
                
                val splits = state.selectedMembers.map { memberId ->
                    ExpenseSplit(
                        id = UUID.randomUUID().toString(),
                        expenseId = "", // Will be set after expense creation
                        userId = memberId,
                        amountOwed = splitAmount,
                        createdAt = now
                    )
                }
                
                val expense = Expense(
                    id = UUID.randomUUID().toString(),
                    householdId = householdId,
                    createdBy = currentUserId,
                    amount = amount,
                    description = state.description,
                    category = state.category,
                    paymentMethod = PaymentMethod.CASH,
                    date = now,
                    splitType = state.splitType,
                    createdAt = now,
                    updatedAt = now,
                    splits = splits
                )
                
                expenseRepository.createExpense(expense)
                _uiState.update { it.copy(isSaving = false, isSaved = true) }
                
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isSaving = false, 
                        error = e.message ?: "Failed to save expense"
                    ) 
                }
            }
        }
    }
}
