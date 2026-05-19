package com.flatmates.app.data.local.dao

import androidx.room.Dao
import androidx.room.Embedded
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Relation
import androidx.room.Transaction
import androidx.room.Update
import com.flatmates.app.data.local.entity.ExpenseEntity
import com.flatmates.app.data.local.entity.ExpenseSplitEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.Instant
import java.math.BigDecimal

data class ExpenseWithSplits(
    @Embedded val expense: ExpenseEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "expenseId"
    )
    val splits: List<ExpenseSplitEntity>
)

@Dao
interface ExpenseDao {
    
    @Transaction
    @Query("SELECT * FROM expenses WHERE householdId = :householdId AND syncStatus != 'PENDING_DELETE' ORDER BY date DESC")
    fun getExpenses(householdId: String): Flow<List<ExpenseWithSplits>>
    
    @Query("SELECT * FROM expenses WHERE householdId = :householdId AND category = :category AND syncStatus != 'PENDING_DELETE' ORDER BY date DESC")
    fun getExpensesByCategory(householdId: String, category: String): Flow<List<ExpenseEntity>>
    
    @Query("SELECT * FROM expenses WHERE householdId = :householdId AND date BETWEEN :start AND :end AND syncStatus != 'PENDING_DELETE' ORDER BY date DESC")
    fun getExpensesByDateRange(householdId: String, start: Instant, end: Instant): Flow<List<ExpenseEntity>>
    
    @Transaction
    @Query("SELECT * FROM expenses WHERE id = :expenseId")
    fun getExpenseById(expenseId: String): Flow<ExpenseWithSplits?>
    
    @Query("SELECT * FROM expenses WHERE id = :expenseId")
    suspend fun getExpenseByIdOnce(expenseId: String): ExpenseEntity?
    
    // Summary queries
    @Query("SELECT COALESCE(SUM(CAST(amount AS REAL)), 0) FROM expenses WHERE householdId = :householdId AND syncStatus != 'PENDING_DELETE'")
    fun getTotalExpenses(householdId: String): Flow<Double>
    
    @Query("SELECT COALESCE(SUM(CAST(amountOwed AS REAL)), 0) FROM expense_splits WHERE userId = :userId AND isSettled = 0")
    fun getTotalOwed(userId: String): Flow<Double>
    
    @Query("SELECT COALESCE(SUM(CAST(es.amountOwed AS REAL)), 0) FROM expense_splits es INNER JOIN expenses e ON es.expenseId = e.id WHERE e.createdBy = :userId AND es.userId != :userId AND es.isSettled = 0")
    fun getTotalOwing(userId: String): Flow<Double>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: ExpenseEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpenses(expenses: List<ExpenseEntity>)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSplits(splits: List<ExpenseSplitEntity>)
    
    @Transaction
    suspend fun insertExpenseWithSplits(expense: ExpenseEntity, splits: List<ExpenseSplitEntity>) {
        insertExpense(expense)
        insertSplits(splits)
    }
    
    @Update
    suspend fun updateExpense(expense: ExpenseEntity)
    
    @Query("DELETE FROM expenses WHERE id = :id")
    suspend fun deleteExpense(id: String)
    
    @Query("UPDATE expenses SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: String)
    
    @Query("UPDATE expense_splits SET isSettled = 1, settledAt = :settledAt WHERE id = :splitId")
    suspend fun settleSplit(splitId: String, settledAt: Instant)
    
    @Query("DELETE FROM expense_splits WHERE expenseId = :expenseId")
    suspend fun deleteSplitsForExpense(expenseId: String)
    
    // Pending sync
    @Query("SELECT * FROM expenses WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSyncExpenses(): List<ExpenseEntity>
}
