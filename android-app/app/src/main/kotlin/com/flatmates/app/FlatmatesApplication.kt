package com.flatmates.app

import android.app.Application
import androidx.hilt.work.HiltWorkerFactory
import androidx.work.Configuration
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class FlatmatesApplication : Application(), Configuration.Provider {
    
    @Inject
    lateinit var workerFactory: HiltWorkerFactory
    
    override fun onCreate() {
        super.onCreate()
        // Initialize any app-wide dependencies here
    }
    
    override val workManagerConfiguration: Configuration
        get() = Configuration.Builder()
            .setWorkerFactory(workerFactory)
            .setMinimumLoggingLevel(android.util.Log.DEBUG)
            .build()
}
