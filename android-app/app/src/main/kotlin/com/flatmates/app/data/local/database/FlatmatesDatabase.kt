package com.flatmates.app.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.flatmates.app.data.local.dao.ExpenseDao
import com.flatmates.app.data.local.dao.HouseholdDao
import com.flatmates.app.data.local.dao.ShoppingDao
import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.dao.TodoDao
import com.flatmates.app.data.local.dao.UserDao
import com.flatmates.app.data.local.entity.ExpenseEntity
import com.flatmates.app.data.local.entity.ExpenseSplitEntity
import com.flatmates.app.data.local.entity.HouseholdEntity
import com.flatmates.app.data.local.entity.HouseholdMemberEntity
import com.flatmates.app.data.local.entity.ShoppingListEntity
import com.flatmates.app.data.local.entity.ShoppingListItemEntity
import com.flatmates.app.data.local.entity.SyncQueueEntity
import com.flatmates.app.data.local.entity.TodoEntity
import com.flatmates.app.data.local.entity.UserEntity

@Database(
    entities = [
        UserEntity::class,
        HouseholdEntity::class,
        HouseholdMemberEntity::class,
        TodoEntity::class,
        ShoppingListEntity::class,
        ShoppingListItemEntity::class,
        ExpenseEntity::class,
        ExpenseSplitEntity::class,
        SyncQueueEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class FlatmatesDatabase : RoomDatabase() {
    
    abstract fun userDao(): UserDao
    abstract fun householdDao(): HouseholdDao
    abstract fun todoDao(): TodoDao
    abstract fun shoppingDao(): ShoppingDao
    abstract fun expenseDao(): ExpenseDao
    abstract fun syncQueueDao(): SyncQueueDao
    
    companion object {
        const val DATABASE_NAME = "flatmates_db"
    }
}
