package com.flatmates.app.di

import android.content.Context
import androidx.room.Room
import com.flatmates.app.data.local.dao.ExpenseDao
import com.flatmates.app.data.local.dao.HouseholdDao
import com.flatmates.app.data.local.dao.ShoppingDao
import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.dao.TodoDao
import com.flatmates.app.data.local.dao.UserDao
import com.flatmates.app.data.local.database.FlatmatesDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
        prettyPrint = false
    }

    @Provides
    @Singleton
    fun provideFlatmatesDatabase(
        @ApplicationContext context: Context
    ): FlatmatesDatabase {
        return Room.databaseBuilder(
            context,
            FlatmatesDatabase::class.java,
            "flatmates_database"
        )
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides
    @Singleton
    fun provideUserDao(database: FlatmatesDatabase): UserDao {
        return database.userDao()
    }

    @Provides
    @Singleton
    fun provideHouseholdDao(database: FlatmatesDatabase): HouseholdDao {
        return database.householdDao()
    }

    @Provides
    @Singleton
    fun provideTodoDao(database: FlatmatesDatabase): TodoDao {
        return database.todoDao()
    }

    @Provides
    @Singleton
    fun provideShoppingDao(database: FlatmatesDatabase): ShoppingDao {
        return database.shoppingDao()
    }

    @Provides
    @Singleton
    fun provideExpenseDao(database: FlatmatesDatabase): ExpenseDao {
        return database.expenseDao()
    }

    @Provides
    @Singleton
    fun provideSyncQueueDao(database: FlatmatesDatabase): SyncQueueDao {
        return database.syncQueueDao()
    }
}
