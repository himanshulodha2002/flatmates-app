package com.flatmates.app.data.repository

import app.cash.turbine.test
import com.flatmates.app.data.local.dao.ExpenseDao
import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.entity.ExpenseEntity
import com.flatmates.app.domain.model.Expense
import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.domain.util.Result
import com.google.common.truth.Truth.assertThat
import io.mockk.*
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.junit.Before
import org.junit.Test
import java.math.BigDecimal

class ExpenseRepositoryTest {
    
    private lateinit var expenseDao: ExpenseDao
    private lateinit var syncQueueDao: SyncQueueDao
    private lateinit var repository: ExpenseRepositoryImpl
    
    private val testHouseholdId = "household-123"
    private val now: Instant = Clock.System.now()
    
    @Before
    fun setup() {
        expenseDao = mockk(relaxed = true)
        syncQueueDao = mockk(relaxed = true)
        repository = ExpenseRepositoryImpl(expenseDao, syncQueueDao)
    }
    
    @Test
    fun `createExpense inserts expense with splits and adds to sync queue`() = runTest {
        // Given
        val expense = createExpense("expense-1", BigDecimal("50.00"))
        
        // When
        val result = repository.createExpense(expense)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { expenseDao.insertExpenseWithSplits(any(), any()) }
        coVerify { syncQueueDao.enqueue(match { it.operation == "CREATE" && it.entityType == "expense" }) }
    }
    
    @Test
    fun `deleteExpense marks as pending delete`() = runTest {
        // Given
        val expenseId = "expense-123"
        
        // When
        val result = repository.deleteExpense(expenseId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { expenseDao.updateSyncStatus(expenseId, "PENDING_DELETE") }
        coVerify { syncQueueDao.enqueue(match { it.operation == "DELETE" && it.entityType == "expense" }) }
    }
    
    @Test
    fun `settleExpenseSplit marks split as settled`() = runTest {
        // Given
        val splitId = "split-123"
        
        // When
        val result = repository.settleExpenseSplit(splitId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { expenseDao.settleSplit(splitId, any()) }
        coVerify { syncQueueDao.enqueue(match { it.entityType == "expense_split" }) }
    }
    
    @Test
    fun `getTotalExpenses returns correct sum`() = runTest {
        // Given
        coEvery { expenseDao.getTotalExpenses(testHouseholdId) } returns flowOf(150.50)
        
        // When/Then
        repository.getTotalExpenses(testHouseholdId).test {
            val total = awaitItem()
            assertThat(total).isEqualTo(BigDecimal.valueOf(150.50))
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `createExpense handles database error gracefully`() = runTest {
        // Given
        val expense = createExpense("expense-1", BigDecimal("50.00"))
        coEvery { expenseDao.insertExpenseWithSplits(any(), any()) } throws RuntimeException("DB Error")
        
        // When
        val result = repository.createExpense(expense)
        
        // Then
        assertThat(result).isInstanceOf(Result.Error::class.java)
        assertThat((result as Result.Error).message).contains("Failed to create")
    }
    
    @Test
    fun `deleteExpense handles database error gracefully`() = runTest {
        // Given
        val expenseId = "expense-123"
        coEvery { expenseDao.updateSyncStatus(any(), any()) } throws RuntimeException("DB Error")
        
        // When
        val result = repository.deleteExpense(expenseId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Error::class.java)
        assertThat((result as Result.Error).message).contains("Failed to delete")
    }
    
    @Test
    fun `settleExpenseSplit handles database error gracefully`() = runTest {
        // Given
        val splitId = "split-123"
        coEvery { expenseDao.settleSplit(any(), any()) } throws RuntimeException("DB Error")
        
        // When
        val result = repository.settleExpenseSplit(splitId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Error::class.java)
        assertThat((result as Result.Error).message).contains("Failed to settle")
    }
    
    // Helper functions
    private fun createExpenseEntity(id: String, amount: BigDecimal) = ExpenseEntity(
        id = id,
        householdId = testHouseholdId,
        description = "Test Expense",
        amount = amount,
        category = "GROCERIES",
        createdBy = "user-1",
        date = now,
        createdAt = now,
        updatedAt = now
    )
    
    private fun createExpense(id: String, amount: BigDecimal) = Expense(
        id = id,
        householdId = testHouseholdId,
        description = "Test Expense",
        amount = amount,
        category = ExpenseCategory.GROCERIES,
        createdBy = "user-1",
        date = now,
        createdAt = now,
        updatedAt = now,
        splits = emptyList()
    )
}
