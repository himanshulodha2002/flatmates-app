package com.flatmates.app.data.sync

import android.content.Context
import androidx.hilt.work.HiltWorker
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters
import com.flatmates.app.data.local.dao.*
import com.flatmates.app.data.local.preferences.UserPreferencesDataStore
import com.flatmates.app.data.remote.api.SyncApi
import com.flatmates.app.data.remote.dto.*
import com.flatmates.app.data.remote.mapper.toDto
import com.flatmates.app.data.remote.mapper.toEntity
import dagger.assisted.Assisted
import dagger.assisted.AssistedInject
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.withContext

@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val syncApi: SyncApi,
    private val todoDao: TodoDao,
    private val shoppingDao: ShoppingDao,
    private val expenseDao: ExpenseDao,
    private val syncQueueDao: SyncQueueDao,
    private val householdDao: HouseholdDao,
    private val userPreferences: UserPreferencesDataStore
) : CoroutineWorker(context, params) {
    
    companion object {
        private const val MAX_RETRY_COUNT = 3
    }
    
    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            // Get active household
            val household = householdDao.getActiveHouseholdOnce()
                ?: return@withContext Result.success() // No household, nothing to sync
            
            val householdId = household.id
            
            // Get last sync timestamp
            val lastSyncTimestampStr = userPreferences.lastSyncTimestamp.first()
            val lastSyncTimestamp = lastSyncTimestampStr?.toLongOrNull() ?: 0L
            
            // Gather local changes from pending sync items
            val pendingChanges = gatherPendingChanges()
            
            // Build sync request
            val syncRequest = SyncRequest(
                lastSyncTimestamp = lastSyncTimestamp,
                householdId = householdId,
                changes = pendingChanges
            )
            
            // Make API call
            val response = syncApi.syncAll(syncRequest)
            
            if (response.isSuccessful && response.body() != null) {
                val syncResponse = response.body()!!
                
                // Apply server changes to local database
                applyServerChanges(syncResponse)
                
                // Handle conflicts (server wins for now)
                handleConflicts(syncResponse.conflicts)
                
                // Clear sync queue for successfully synced items
                syncQueueDao.clearAll()
                
                // Mark all pending items as synced
                markItemsAsSynced()
                
                // Update last sync timestamp
                userPreferences.setLastSyncTimestamp(syncResponse.serverTimestamp.toString())
                
                Result.success()
            } else {
                // Retry with backoff
                if (runAttemptCount < MAX_RETRY_COUNT) {
                    Result.retry()
                } else {
                    Result.failure()
                }
            }
        } catch (e: Exception) {
            if (runAttemptCount < MAX_RETRY_COUNT) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
    
    private suspend fun gatherPendingChanges(): SyncChanges {
        val pendingTodos = todoDao.getPendingSyncTodos()
        val pendingShoppingLists = shoppingDao.getPendingSyncLists()
        val pendingShoppingItems = shoppingDao.getPendingSyncItems()
        val pendingExpenses = expenseDao.getPendingSyncExpenses()
        
        return SyncChanges(
            todos = EntityChanges(
                created = pendingTodos
                    .filter { it.syncStatus == "PENDING_CREATE" }
                    .map { it.toDto() },
                updated = pendingTodos
                    .filter { it.syncStatus == "PENDING_UPDATE" }
                    .map { it.toDto() },
                deleted = pendingTodos
                    .filter { it.syncStatus == "PENDING_DELETE" }
                    .map { it.id }
            ),
            shoppingLists = EntityChanges(
                created = pendingShoppingLists
                    .filter { it.syncStatus == "PENDING_CREATE" }
                    .map { it.toDto() },
                updated = pendingShoppingLists
                    .filter { it.syncStatus == "PENDING_UPDATE" }
                    .map { it.toDto() },
                deleted = pendingShoppingLists
                    .filter { it.syncStatus == "PENDING_DELETE" }
                    .map { it.id }
            ),
            shoppingItems = EntityChanges(
                created = pendingShoppingItems
                    .filter { it.syncStatus == "PENDING_CREATE" }
                    .map { it.toDto() },
                updated = pendingShoppingItems
                    .filter { it.syncStatus == "PENDING_UPDATE" }
                    .map { it.toDto() },
                deleted = pendingShoppingItems
                    .filter { it.syncStatus == "PENDING_DELETE" }
                    .map { it.id }
            ),
            expenses = EntityChanges(
                created = pendingExpenses
                    .filter { it.syncStatus == "PENDING_CREATE" }
                    .map { it.toDto() },
                updated = pendingExpenses
                    .filter { it.syncStatus == "PENDING_UPDATE" }
                    .map { it.toDto() },
                deleted = pendingExpenses
                    .filter { it.syncStatus == "PENDING_DELETE" }
                    .map { it.id }
            )
        )
    }
    
    private suspend fun applyServerChanges(response: SyncResponse) {
        // Apply todos
        response.todos.forEach { dto ->
            val entity = dto.toEntity()
            todoDao.insert(entity)
        }
        
        // Apply shopping lists
        response.shoppingLists.forEach { dto ->
            val entity = dto.toEntity()
            shoppingDao.insertList(entity)
        }
        
        // Apply shopping items
        response.shoppingItems.forEach { dto ->
            val entity = dto.toEntity()
            shoppingDao.insertItem(entity)
        }
        
        // Apply expenses
        response.expenses.forEach { dto ->
            val entity = dto.toEntity()
            expenseDao.insertExpense(entity)
        }
    }
    
    private suspend fun handleConflicts(conflicts: List<SyncConflict>) {
        // For now, server wins - local changes are discarded
        // In future, could show conflicts to user
        conflicts.forEach { conflict ->
            when (conflict.entityType) {
                "todo" -> todoDao.updateSyncStatus(conflict.entityId, "SYNCED")
                "shopping_list" -> shoppingDao.updateListSyncStatus(conflict.entityId, "SYNCED")
                "shopping_item" -> shoppingDao.updateItemSyncStatus(conflict.entityId, "SYNCED")
                "expense" -> expenseDao.updateSyncStatus(conflict.entityId, "SYNCED")
            }
        }
    }
    
    private suspend fun markItemsAsSynced() {
        // Mark all pending items as synced after successful sync
        val pendingTodos = todoDao.getPendingSyncTodos()
        pendingTodos.forEach { todo ->
            if (todo.syncStatus != "PENDING_DELETE") {
                todoDao.updateSyncStatus(todo.id, "SYNCED")
            } else {
                todoDao.delete(todo.id)
            }
        }
        
        val pendingLists = shoppingDao.getPendingSyncLists()
        pendingLists.forEach { list ->
            if (list.syncStatus != "PENDING_DELETE") {
                shoppingDao.updateListSyncStatus(list.id, "SYNCED")
            } else {
                shoppingDao.deleteList(list.id)
            }
        }
        
        val pendingItems = shoppingDao.getPendingSyncItems()
        pendingItems.forEach { item ->
            if (item.syncStatus != "PENDING_DELETE") {
                shoppingDao.updateItemSyncStatus(item.id, "SYNCED")
            } else {
                shoppingDao.deleteItem(item.id)
            }
        }
        
        val pendingExpenses = expenseDao.getPendingSyncExpenses()
        pendingExpenses.forEach { expense ->
            if (expense.syncStatus != "PENDING_DELETE") {
                expenseDao.updateSyncStatus(expense.id, "SYNCED")
            } else {
                expenseDao.deleteExpense(expense.id)
            }
        }
    }
}
