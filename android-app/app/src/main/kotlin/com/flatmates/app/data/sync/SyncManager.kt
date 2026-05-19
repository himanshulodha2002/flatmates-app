package com.flatmates.app.data.sync

import android.content.Context
import androidx.lifecycle.asFlow
import androidx.work.*
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import java.util.concurrent.TimeUnit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    private val workManager = WorkManager.getInstance(context)
    
    companion object {
        const val SYNC_WORK_NAME = "flatmates_sync"
        const val IMMEDIATE_SYNC_TAG = "immediate_sync"
        private const val PERIODIC_SYNC_INTERVAL_MINUTES = 15L
        private const val FLEX_INTERVAL_MINUTES = 5L
    }
    
    fun getSyncStatus(): Flow<SyncStatus> {
        return workManager.getWorkInfosForUniqueWorkLiveData(SYNC_WORK_NAME)
            .asFlow()
            .map { workInfos ->
                val workInfo = workInfos.firstOrNull()
                when (workInfo?.state) {
                    WorkInfo.State.RUNNING -> SyncStatus.SYNCING
                    WorkInfo.State.ENQUEUED -> SyncStatus.PENDING
                    WorkInfo.State.FAILED -> SyncStatus.FAILED
                    WorkInfo.State.SUCCEEDED -> SyncStatus.SYNCED
                    WorkInfo.State.BLOCKED -> SyncStatus.PENDING
                    WorkInfo.State.CANCELLED -> SyncStatus.IDLE
                    null -> SyncStatus.IDLE
                }
            }
    }
    
    fun getImmediateSyncStatus(): Flow<SyncStatus> {
        return workManager.getWorkInfosByTagLiveData(IMMEDIATE_SYNC_TAG)
            .asFlow()
            .map { workInfos ->
                val workInfo = workInfos.lastOrNull()
                when (workInfo?.state) {
                    WorkInfo.State.RUNNING -> SyncStatus.SYNCING
                    WorkInfo.State.ENQUEUED -> SyncStatus.PENDING
                    WorkInfo.State.FAILED -> SyncStatus.FAILED
                    WorkInfo.State.SUCCEEDED -> SyncStatus.SYNCED
                    WorkInfo.State.BLOCKED -> SyncStatus.PENDING
                    WorkInfo.State.CANCELLED -> SyncStatus.IDLE
                    null -> SyncStatus.IDLE
                }
            }
    }
    
    fun schedulePeriodicSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()
        
        val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
            PERIODIC_SYNC_INTERVAL_MINUTES, TimeUnit.MINUTES,
            FLEX_INTERVAL_MINUTES, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                WorkRequest.MIN_BACKOFF_MILLIS,
                TimeUnit.MILLISECONDS
            )
            .build()
        
        workManager.enqueueUniquePeriodicWork(
            SYNC_WORK_NAME,
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
    }
    
    fun requestImmediateSync() {
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()
        
        val syncRequest = OneTimeWorkRequestBuilder<SyncWorker>()
            .setConstraints(constraints)
            .addTag(IMMEDIATE_SYNC_TAG)
            .setExpedited(OutOfQuotaPolicy.RUN_AS_NON_EXPEDITED_WORK_REQUEST)
            .build()
        
        workManager.enqueue(syncRequest)
    }
    
    fun cancelSync() {
        workManager.cancelUniqueWork(SYNC_WORK_NAME)
    }
    
    fun cancelImmediateSync() {
        workManager.cancelAllWorkByTag(IMMEDIATE_SYNC_TAG)
    }
    
    fun cancelAllSync() {
        cancelSync()
        cancelImmediateSync()
    }
}

enum class SyncStatus {
    IDLE,
    PENDING,
    SYNCING,
    SYNCED,
    FAILED
}
