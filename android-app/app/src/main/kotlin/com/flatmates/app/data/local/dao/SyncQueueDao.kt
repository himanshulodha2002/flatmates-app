package com.flatmates.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.flatmates.app.data.local.entity.SyncQueueEntity

@Dao
interface SyncQueueDao {
    
    @Query("SELECT * FROM sync_queue ORDER BY createdAt ASC")
    suspend fun getAllPending(): List<SyncQueueEntity>
    
    @Query("SELECT * FROM sync_queue WHERE entityType = :type ORDER BY createdAt ASC")
    suspend fun getPendingByType(type: String): List<SyncQueueEntity>
    
    @Query("SELECT COUNT(*) FROM sync_queue")
    suspend fun getPendingCount(): Int
    
    @Query("SELECT COUNT(*) FROM sync_queue")
    fun getPendingCountFlow(): kotlinx.coroutines.flow.Flow<Int>
    
    @Insert
    suspend fun enqueue(entry: SyncQueueEntity)
    
    @Query("DELETE FROM sync_queue WHERE id = :id")
    suspend fun remove(id: Long)
    
    @Query("DELETE FROM sync_queue WHERE entityId = :entityId AND entityType = :entityType")
    suspend fun removeByEntity(entityId: String, entityType: String)
    
    @Query("UPDATE sync_queue SET retryCount = retryCount + 1, lastError = :error WHERE id = :id")
    suspend fun incrementRetry(id: Long, error: String?)
    
    @Query("DELETE FROM sync_queue")
    suspend fun clearAll()
    
    @Query("SELECT * FROM sync_queue WHERE retryCount < :maxRetries ORDER BY createdAt ASC LIMIT :limit")
    suspend fun getPendingWithRetryLimit(maxRetries: Int, limit: Int): List<SyncQueueEntity>
}
