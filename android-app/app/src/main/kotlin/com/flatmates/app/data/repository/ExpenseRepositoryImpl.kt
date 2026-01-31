package com.flatmates.app.data.repository

import com.flatmates.app.data.local.dao.ExpenseDao
import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.entity.SyncQueueEntity
import com.flatmates.app.data.mapper.toDomain
import com.flatmates.app.data.mapper.toEntity
import com.flatmates.app.data.mapper.toExpenseWithSplitsDomainList
import com.flatmates.app.domain.model.Expense
import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import java.math.BigDecimal
import javax.inject.Inject

class ExpenseRepositoryImpl @Inject constructor(
    private val expenseDao: ExpenseDao,
    private val syncQueueDao: SyncQueueDao
) : ExpenseRepository {
    
    override fun getExpenses(householdId: String): Flow<List<Expense>> =
        expenseDao.getExpenses(householdId).map { it.toExpenseWithSplitsDomainList() }
    
    override fun getExpensesByCategory(householdId: String, category: ExpenseCategory): Flow<List<Expense>> =
        expenseDao.getExpensesByCategory(householdId, category.name).map { entities ->
            entities.map { it.toDomain() }
        }
    
    override fun getExpensesByDateRange(
        householdId: String,
        startDate: Instant,
        endDate: Instant
    ): Flow<List<Expense>> =
        expenseDao.getExpensesByDateRange(householdId, startDate, endDate).map { entities ->
            entities.map { it.toDomain() }
        }
    
    override fun getExpenseById(expenseId: String): Flow<Expense?> =
        expenseDao.getExpenseById(expenseId).map { it?.toDomain() }
    
    override fun getTotalExpenses(householdId: String): Flow<BigDecimal> =
        expenseDao.getTotalExpenses(householdId).map { BigDecimal.valueOf(it) }
    
    override fun getTotalOwed(userId: String): Flow<BigDecimal> =
        expenseDao.getTotalOwed(userId).map { BigDecimal.valueOf(it) }
    
    override fun getTotalOwing(userId: String): Flow<BigDecimal> =
        expenseDao.getTotalOwing(userId).map { BigDecimal.valueOf(it) }
    
    override suspend fun createExpense(expense: Expense): Result<Expense> {
        return try {
            val entity = expense.toEntity(
                syncStatus = "PENDING_CREATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            val splitEntities = expense.splits.map { it.toEntity() }
            
            expenseDao.insertExpenseWithSplits(entity, splitEntities)
            
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "expense",
                entityId = expense.id,
                operation = "CREATE",
                payload = "{\"id\":\"${expense.id}\",\"amount\":${expense.amount}}"
            ))
            
            Result.Success(entity.toDomain(expense.splits))
        } catch (e: Exception) {
            Result.Error(e, "Failed to create expense")
        }
    }
    
    override suspend fun updateExpense(expense: Expense): Result<Expense> {
        return try {
            val now = Clock.System.now()
            val updated = expense.copy(updatedAt = now)
            val entity = updated.toEntity(
                syncStatus = "PENDING_UPDATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            val splitEntities = expense.splits.map { it.toEntity() }
            
            // Delete old splits and insert new ones
            expenseDao.deleteSplitsForExpense(expense.id)
            expenseDao.insertExpenseWithSplits(entity, splitEntities)
            
            syncQueueDao.removeByEntity(expense.id, "expense")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "expense",
                entityId = expense.id,
                operation = "UPDATE",
                payload = "{\"id\":\"${expense.id}\",\"amount\":${expense.amount}}"
            ))
            
            Result.Success(entity.toDomain(expense.splits))
        } catch (e: Exception) {
            Result.Error(e, "Failed to update expense")
        }
    }
    
    override suspend fun deleteExpense(expenseId: String): Result<Unit> {
        return try {
            expenseDao.updateSyncStatus(expenseId, "PENDING_DELETE")
            
            syncQueueDao.removeByEntity(expenseId, "expense")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "expense",
                entityId = expenseId,
                operation = "DELETE",
                payload = expenseId
            ))
            
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to delete expense")
        }
    }
    
    override suspend fun settleExpenseSplit(splitId: String): Result<Unit> {
        return try {
            val now = Clock.System.now()
            expenseDao.settleSplit(splitId, now)
            
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "expense_split",
                entityId = splitId,
                operation = "UPDATE",
                payload = "{\"id\":\"$splitId\",\"isSettled\":true}"
            ))
            
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to settle expense split")
        }
    }
}
