package com.flatmates.app.ui.screens.expenses

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.Expense
import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.filterNotNull
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.math.BigDecimal
import javax.inject.Inject

/**
 * Filter options for expenses.
 */
enum class ExpenseFilter {
    ALL, GROCERIES, UTILITIES, RENT, ENTERTAINMENT, FOOD, OTHER
}

/**
 * UI State for the Expenses screen.
 */
data class ExpensesUiState(
    val expenses: List<Expense> = emptyList(),
    val filter: ExpenseFilter = ExpenseFilter.ALL,
    val totalOwed: BigDecimal = BigDecimal.ZERO,
    val totalOwing: BigDecimal = BigDecimal.ZERO,
    val isLoading: Boolean = true,
    val error: String? = null,
    val currentUserId: String = ""
)

/**
 * ViewModel for the Expenses screen.
 * Manages expense list and balance calculations.
 */
@HiltViewModel
class ExpensesViewModel @Inject constructor(
    private val householdRepository: HouseholdRepository,
    private val expenseRepository: ExpenseRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(ExpensesUiState())
    val uiState: StateFlow<ExpensesUiState> = _uiState.asStateFlow()
    
    private var currentHouseholdId: String? = null
    private var allExpenses: List<Expense> = emptyList()
    
    init {
        loadExpenses()
    }
    
    private fun loadExpenses() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            
            try {
                householdRepository.getActiveHousehold()
                    .filterNotNull()
                    .collectLatest { household ->
                        currentHouseholdId = household.id
                        
                        // Load expenses
                        expenseRepository.getExpenses(household.id)
                            .collect { expenses ->
                                allExpenses = expenses
                                _uiState.update { 
                                    it.copy(
                                        expenses = filterExpenses(expenses, it.filter),
                                        isLoading = false
                                    ) 
                                }
                            }
                    }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false, 
                        error = e.message ?: "Failed to load expenses"
                    ) 
                }
            }
        }
    }
    
    /**
     * Set the current filter and update the displayed expenses.
     */
    fun setFilter(filter: ExpenseFilter) {
        _uiState.update {
            it.copy(
                filter = filter,
                expenses = filterExpenses(allExpenses, filter)
            )
        }
    }
    
    private fun filterExpenses(expenses: List<Expense>, filter: ExpenseFilter): List<Expense> {
        return when (filter) {
            ExpenseFilter.ALL -> expenses
            ExpenseFilter.GROCERIES -> expenses.filter { it.category == ExpenseCategory.GROCERIES }
            ExpenseFilter.UTILITIES -> expenses.filter { it.category == ExpenseCategory.UTILITIES }
            ExpenseFilter.RENT -> expenses.filter { it.category == ExpenseCategory.RENT }
            ExpenseFilter.ENTERTAINMENT -> expenses.filter { it.category == ExpenseCategory.ENTERTAINMENT }
            ExpenseFilter.FOOD -> expenses.filter { it.category == ExpenseCategory.FOOD }
            ExpenseFilter.OTHER -> expenses.filter { it.category == ExpenseCategory.OTHER }
        }
    }
    
    /**
     * Delete an expense.
     */
    fun deleteExpense(expenseId: String) {
        viewModelScope.launch {
            expenseRepository.deleteExpense(expenseId)
        }
    }
}
