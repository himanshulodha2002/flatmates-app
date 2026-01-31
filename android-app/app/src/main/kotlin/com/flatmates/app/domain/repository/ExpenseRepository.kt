package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.Expense
import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.Instant
import java.math.BigDecimal

interface ExpenseRepository {
    fun getExpenses(householdId: String): Flow<List<Expense>>
    fun getExpensesByCategory(householdId: String, category: ExpenseCategory): Flow<List<Expense>>
    fun getExpensesByDateRange(householdId: String, startDate: Instant, endDate: Instant): Flow<List<Expense>>
    fun getExpenseById(expenseId: String): Flow<Expense?>
    
    fun getTotalExpenses(householdId: String): Flow<BigDecimal>
    fun getTotalOwed(userId: String): Flow<BigDecimal>
    fun getTotalOwing(userId: String): Flow<BigDecimal>
    
    suspend fun createExpense(expense: Expense): Result<Expense>
    suspend fun updateExpense(expense: Expense): Result<Expense>
    suspend fun deleteExpense(expenseId: String): Result<Unit>
    suspend fun settleExpenseSplit(splitId: String): Result<Unit>
}
