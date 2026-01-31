# Task 5: Data Layer (Room Database + Repository Implementation)

## Metadata
- **Can run in parallel with**: Task 4 (UI Theme)
- **Dependencies**: Task 2 (Android Setup), Task 3 (Domain Models) must be complete
- **Estimated time**: 3-4 hours
- **Priority**: HIGH (enables offline-first functionality)

---

## Prompt

You are implementing the local-first data layer using Room database with sync support for the Flatmates Android app.

### Repository Information
- **Repository**: `/workspaces/flatmates-app`
- **Android Path**: `/workspaces/flatmates-app/android-app`
- **Domain Models**: `/workspaces/flatmates-app/android-app/app/src/main/kotlin/com/flatmates/app/domain/model/`

### Package Structure to Create

```
app/src/main/kotlin/com/flatmates/app/
├── data/
│   ├── local/
│   │   ├── database/
│   │   │   ├── FlatmatesDatabase.kt
│   │   │   ├── Converters.kt
│   │   │   └── DatabaseMigrations.kt
│   │   ├── entity/
│   │   │   ├── UserEntity.kt
│   │   │   ├── HouseholdEntity.kt
│   │   │   ├── HouseholdMemberEntity.kt
│   │   │   ├── TodoEntity.kt
│   │   │   ├── ShoppingListEntity.kt
│   │   │   ├── ShoppingListItemEntity.kt
│   │   │   ├── ExpenseEntity.kt
│   │   │   ├── ExpenseSplitEntity.kt
│   │   │   └── SyncQueueEntity.kt
│   │   ├── dao/
│   │   │   ├── UserDao.kt
│   │   │   ├── HouseholdDao.kt
│   │   │   ├── TodoDao.kt
│   │   │   ├── ShoppingDao.kt
│   │   │   ├── ExpenseDao.kt
│   │   │   └── SyncQueueDao.kt
│   │   └── datastore/
│   │       └── UserPreferences.kt
│   ├── mapper/
│   │   ├── UserMapper.kt
│   │   ├── HouseholdMapper.kt
│   │   ├── TodoMapper.kt
│   │   ├── ShoppingMapper.kt
│   │   └── ExpenseMapper.kt
│   └── repository/
│       ├── TodoRepositoryImpl.kt
│       ├── ShoppingRepositoryImpl.kt
│       ├── ExpenseRepositoryImpl.kt
│       └── HouseholdRepositoryImpl.kt
└── di/
    ├── DatabaseModule.kt
    └── RepositoryModule.kt
```

### Sync Status Enum

```kotlin
enum class SyncStatus {
    SYNCED,          // In sync with server
    PENDING_CREATE,  // Created locally, not yet synced
    PENDING_UPDATE,  // Modified locally, not yet synced
    PENDING_DELETE,  // Deleted locally, not yet synced
    CONFLICT         // Conflict detected during sync
}
```

### Tasks

#### 1. Create Type Converters

`data/local/database/Converters.kt`:

```kotlin
package com.flatmates.app.data.local.database

import androidx.room.TypeConverter
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import java.math.BigDecimal

class Converters {
    
    // Instant converters
    @TypeConverter
    fun fromInstant(value: Instant?): Long? = value?.toEpochMilliseconds()
    
    @TypeConverter
    fun toInstant(value: Long?): Instant? = value?.let { Instant.fromEpochMilliseconds(it) }
    
    // LocalDate converters
    @TypeConverter
    fun fromLocalDate(value: LocalDate?): String? = value?.toString()
    
    @TypeConverter
    fun toLocalDate(value: String?): LocalDate? = value?.let { LocalDate.parse(it) }
    
    // BigDecimal converters
    @TypeConverter
    fun fromBigDecimal(value: BigDecimal?): String? = value?.toPlainString()
    
    @TypeConverter
    fun toBigDecimal(value: String?): BigDecimal? = value?.let { BigDecimal(it) }
    
    // List<String> converters (for simple string lists)
    @TypeConverter
    fun fromStringList(value: List<String>?): String? = value?.joinToString(",")
    
    @TypeConverter
    fun toStringList(value: String?): List<String>? = 
        value?.takeIf { it.isNotEmpty() }?.split(",")
}
```

#### 2. Create Entities

`data/local/entity/SyncQueueEntity.kt`:

```kotlin
package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "sync_queue")
data class SyncQueueEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val entityType: String,      // "todo", "shopping_item", "expense", etc.
    val entityId: String,
    val operation: String,       // "CREATE", "UPDATE", "DELETE"
    val payload: String,         // JSON of the entity
    val createdAt: Long = System.currentTimeMillis(),
    val retryCount: Int = 0,
    val lastError: String? = null
)
```

`data/local/entity/UserEntity.kt`:

```kotlin
package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey
    val id: String,
    val email: String,
    val fullName: String,
    val googleId: String? = null,
    val profilePictureUrl: String? = null,
    val isActive: Boolean = true,
    val createdAt: Instant? = null,
    val updatedAt: Instant? = null,
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
```

`data/local/entity/HouseholdEntity.kt`:

```kotlin
package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant

@Entity(tableName = "households")
data class HouseholdEntity(
    @PrimaryKey
    val id: String,
    val name: String,
    val createdBy: String,
    val createdAt: Instant,
    val isActive: Boolean = false, // Is this the currently selected household?
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
```

`data/local/entity/HouseholdMemberEntity.kt`:

```kotlin
package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant

@Entity(
    tableName = "household_members",
    foreignKeys = [
        ForeignKey(
            entity = HouseholdEntity::class,
            parentColumns = ["id"],
            childColumns = ["householdId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("householdId"), Index("userId")]
)
data class HouseholdMemberEntity(
    @PrimaryKey
    val id: String,
    val userId: String,
    val householdId: String,
    val role: String, // "OWNER", "MEMBER"
    val joinedAt: Instant,
    // Denormalized user info
    val email: String? = null,
    val fullName: String? = null,
    val profilePictureUrl: String? = null,
    // Sync metadata
    val syncStatus: String = "SYNCED"
)
```

`data/local/entity/TodoEntity.kt`:

```kotlin
package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate

@Entity(
    tableName = "todos",
    foreignKeys = [
        ForeignKey(
            entity = HouseholdEntity::class,
            parentColumns = ["id"],
            childColumns = ["householdId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [
        Index("householdId"),
        Index("status"),
        Index("dueDate"),
        Index("assignedToId")
    ]
)
data class TodoEntity(
    @PrimaryKey
    val id: String,
    val householdId: String,
    val title: String,
    val description: String? = null,
    val status: String = "PENDING", // "PENDING", "IN_PROGRESS", "COMPLETED"
    val priority: String = "MEDIUM", // "LOW", "MEDIUM", "HIGH"
    val dueDate: LocalDate? = null,
    val assignedToId: String? = null,
    val createdBy: String,
    val recurringPattern: String? = null,
    val recurringUntil: LocalDate? = null,
    val completedAt: Instant? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Denormalized
    val assignedToName: String? = null,
    val createdByName: String? = null,
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
```

`data/local/entity/ShoppingListEntity.kt`:

```kotlin
package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant

@Entity(
    tableName = "shopping_lists",
    foreignKeys = [
        ForeignKey(
            entity = HouseholdEntity::class,
            parentColumns = ["id"],
            childColumns = ["householdId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("householdId"), Index("status")]
)
data class ShoppingListEntity(
    @PrimaryKey
    val id: String,
    val householdId: String,
    val name: String,
    val description: String? = null,
    val status: String = "ACTIVE", // "ACTIVE", "ARCHIVED"
    val createdBy: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
```

`data/local/entity/ShoppingListItemEntity.kt`:

```kotlin
package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant
import java.math.BigDecimal

@Entity(
    tableName = "shopping_list_items",
    foreignKeys = [
        ForeignKey(
            entity = ShoppingListEntity::class,
            parentColumns = ["id"],
            childColumns = ["shoppingListId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("shoppingListId"), Index("isPurchased"), Index("category")]
)
data class ShoppingListItemEntity(
    @PrimaryKey
    val id: String,
    val shoppingListId: String,
    val name: String,
    val quantity: Double = 1.0,
    val unit: String? = null,
    val category: String? = null,
    val isPurchased: Boolean = false,
    val assignedToId: String? = null,
    val price: BigDecimal? = null,
    val notes: String? = null,
    val isRecurring: Boolean = false,
    val recurringPattern: String? = null,
    val position: Int = 0,
    val createdBy: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Denormalized
    val assignedToName: String? = null,
    val checkedOffByName: String? = null,
    val checkedOffAt: Instant? = null,
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
```

`data/local/entity/ExpenseEntity.kt`:

```kotlin
package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant
import java.math.BigDecimal

@Entity(
    tableName = "expenses",
    foreignKeys = [
        ForeignKey(
            entity = HouseholdEntity::class,
            parentColumns = ["id"],
            childColumns = ["householdId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("householdId"), Index("category"), Index("date")]
)
data class ExpenseEntity(
    @PrimaryKey
    val id: String,
    val householdId: String,
    val createdBy: String,
    val amount: BigDecimal,
    val description: String,
    val category: String = "OTHER",
    val paymentMethod: String = "CASH",
    val date: Instant,
    val splitType: String = "EQUAL",
    val isPersonal: Boolean = false,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Denormalized
    val creatorName: String? = null,
    val creatorEmail: String? = null,
    // Sync metadata
    val syncStatus: String = "SYNCED",
    val lastModifiedLocally: Long? = null
)
```

`data/local/entity/ExpenseSplitEntity.kt`:

```kotlin
package com.flatmates.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import kotlinx.datetime.Instant
import java.math.BigDecimal

@Entity(
    tableName = "expense_splits",
    foreignKeys = [
        ForeignKey(
            entity = ExpenseEntity::class,
            parentColumns = ["id"],
            childColumns = ["expenseId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("expenseId"), Index("userId")]
)
data class ExpenseSplitEntity(
    @PrimaryKey
    val id: String,
    val expenseId: String,
    val userId: String,
    val amountOwed: BigDecimal,
    val isSettled: Boolean = false,
    val settledAt: Instant? = null,
    val createdAt: Instant,
    // Denormalized
    val userName: String? = null,
    val userEmail: String? = null
)
```

#### 3. Create DAOs

`data/local/dao/TodoDao.kt`:

```kotlin
package com.flatmates.app.data.local.dao

import androidx.room.*
import com.flatmates.app.data.local.entity.TodoEntity
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.LocalDate

@Dao
interface TodoDao {
    
    @Query("SELECT * FROM todos WHERE householdId = :householdId AND syncStatus != 'PENDING_DELETE' ORDER BY createdAt DESC")
    fun getTodosByHousehold(householdId: String): Flow<List<TodoEntity>>
    
    @Query("SELECT * FROM todos WHERE householdId = :householdId AND status = :status AND syncStatus != 'PENDING_DELETE' ORDER BY createdAt DESC")
    fun getTodosByStatus(householdId: String, status: String): Flow<List<TodoEntity>>
    
    @Query("SELECT * FROM todos WHERE householdId = :householdId AND dueDate = :date AND syncStatus != 'PENDING_DELETE' ORDER BY priority DESC")
    fun getTodosForDate(householdId: String, date: LocalDate): Flow<List<TodoEntity>>
    
    @Query("SELECT * FROM todos WHERE householdId = :householdId AND dueDate < :today AND status != 'COMPLETED' AND syncStatus != 'PENDING_DELETE' ORDER BY dueDate ASC")
    fun getOverdueTodos(householdId: String, today: LocalDate): Flow<List<TodoEntity>>
    
    @Query("SELECT * FROM todos WHERE id = :todoId")
    fun getTodoById(todoId: String): Flow<TodoEntity?>
    
    @Query("SELECT * FROM todos WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSyncTodos(): List<TodoEntity>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(todo: TodoEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(todos: List<TodoEntity>)
    
    @Update
    suspend fun update(todo: TodoEntity)
    
    @Query("DELETE FROM todos WHERE id = :id")
    suspend fun delete(id: String)
    
    @Query("UPDATE todos SET syncStatus = :status WHERE id = :id")
    suspend fun updateSyncStatus(id: String, status: String)
    
    @Query("DELETE FROM todos WHERE householdId = :householdId")
    suspend fun deleteAllForHousehold(householdId: String)
}
```

`data/local/dao/ShoppingDao.kt`:

```kotlin
package com.flatmates.app.data.local.dao

import androidx.room.*
import com.flatmates.app.data.local.entity.ShoppingListEntity
import com.flatmates.app.data.local.entity.ShoppingListItemEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ShoppingDao {
    
    // Shopping Lists
    @Query("SELECT * FROM shopping_lists WHERE householdId = :householdId AND syncStatus != 'PENDING_DELETE' ORDER BY updatedAt DESC")
    fun getShoppingLists(householdId: String): Flow<List<ShoppingListEntity>>
    
    @Query("SELECT * FROM shopping_lists WHERE householdId = :householdId AND status = 'ACTIVE' AND syncStatus != 'PENDING_DELETE' ORDER BY updatedAt DESC")
    fun getActiveShoppingLists(householdId: String): Flow<List<ShoppingListEntity>>
    
    @Query("SELECT * FROM shopping_lists WHERE id = :listId")
    fun getShoppingListById(listId: String): Flow<ShoppingListEntity?>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertList(list: ShoppingListEntity)
    
    @Update
    suspend fun updateList(list: ShoppingListEntity)
    
    @Query("DELETE FROM shopping_lists WHERE id = :id")
    suspend fun deleteList(id: String)
    
    // Shopping Items
    @Query("SELECT * FROM shopping_list_items WHERE shoppingListId = :listId AND syncStatus != 'PENDING_DELETE' ORDER BY isPurchased ASC, position ASC")
    fun getShoppingItems(listId: String): Flow<List<ShoppingListItemEntity>>
    
    @Query("SELECT * FROM shopping_list_items WHERE id = :itemId")
    fun getShoppingItemById(itemId: String): Flow<ShoppingListItemEntity?>
    
    @Query("SELECT COUNT(*) FROM shopping_list_items WHERE shoppingListId = :listId AND syncStatus != 'PENDING_DELETE'")
    fun getItemCount(listId: String): Flow<Int>
    
    @Query("SELECT COUNT(*) FROM shopping_list_items WHERE shoppingListId = :listId AND isPurchased = 1 AND syncStatus != 'PENDING_DELETE'")
    fun getPurchasedCount(listId: String): Flow<Int>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItem(item: ShoppingListItemEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertItems(items: List<ShoppingListItemEntity>)
    
    @Update
    suspend fun updateItem(item: ShoppingListItemEntity)
    
    @Query("DELETE FROM shopping_list_items WHERE id = :id")
    suspend fun deleteItem(id: String)
    
    @Query("UPDATE shopping_list_items SET syncStatus = :status WHERE id = :id")
    suspend fun updateItemSyncStatus(id: String, status: String)
    
    // Pending sync
    @Query("SELECT * FROM shopping_lists WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSyncLists(): List<ShoppingListEntity>
    
    @Query("SELECT * FROM shopping_list_items WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSyncItems(): List<ShoppingListItemEntity>
}
```

`data/local/dao/ExpenseDao.kt`:

```kotlin
package com.flatmates.app.data.local.dao

import androidx.room.*
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
    
    // Summary queries
    @Query("SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE householdId = :householdId AND syncStatus != 'PENDING_DELETE'")
    fun getTotalExpenses(householdId: String): Flow<BigDecimal>
    
    @Query("SELECT COALESCE(SUM(amountOwed), 0) FROM expense_splits WHERE userId = :userId AND isSettled = 0")
    fun getTotalOwed(userId: String): Flow<BigDecimal>
    
    @Query("SELECT COALESCE(SUM(es.amountOwed), 0) FROM expense_splits es INNER JOIN expenses e ON es.expenseId = e.id WHERE e.createdBy = :userId AND es.userId != :userId AND es.isSettled = 0")
    fun getTotalOwing(userId: String): Flow<BigDecimal>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertExpense(expense: ExpenseEntity)
    
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
    
    @Query("UPDATE expense_splits SET isSettled = 1, settledAt = :settledAt WHERE id = :splitId")
    suspend fun settleSplit(splitId: String, settledAt: Instant)
    
    // Pending sync
    @Query("SELECT * FROM expenses WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSyncExpenses(): List<ExpenseEntity>
}
```

`data/local/dao/HouseholdDao.kt`:

```kotlin
package com.flatmates.app.data.local.dao

import androidx.room.*
import com.flatmates.app.data.local.entity.HouseholdEntity
import com.flatmates.app.data.local.entity.HouseholdMemberEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface HouseholdDao {
    
    @Query("SELECT * FROM households ORDER BY name ASC")
    fun getHouseholds(): Flow<List<HouseholdEntity>>
    
    @Query("SELECT * FROM households WHERE isActive = 1 LIMIT 1")
    fun getActiveHousehold(): Flow<HouseholdEntity?>
    
    @Query("SELECT * FROM households WHERE id = :id")
    fun getHouseholdById(id: String): Flow<HouseholdEntity?>
    
    @Query("SELECT * FROM household_members WHERE householdId = :householdId")
    fun getHouseholdMembers(householdId: String): Flow<List<HouseholdMemberEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHousehold(household: HouseholdEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMember(member: HouseholdMemberEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMembers(members: List<HouseholdMemberEntity>)
    
    @Query("UPDATE households SET isActive = 0")
    suspend fun deactivateAllHouseholds()
    
    @Query("UPDATE households SET isActive = 1 WHERE id = :id")
    suspend fun setActiveHousehold(id: String)
    
    @Transaction
    suspend fun switchActiveHousehold(id: String) {
        deactivateAllHouseholds()
        setActiveHousehold(id)
    }
    
    @Query("DELETE FROM households WHERE id = :id")
    suspend fun deleteHousehold(id: String)
    
    @Query("DELETE FROM household_members WHERE id = :id")
    suspend fun deleteMember(id: String)
}
```

`data/local/dao/SyncQueueDao.kt`:

```kotlin
package com.flatmates.app.data.local.dao

import androidx.room.*
import com.flatmates.app.data.local.entity.SyncQueueEntity

@Dao
interface SyncQueueDao {
    
    @Query("SELECT * FROM sync_queue ORDER BY createdAt ASC")
    suspend fun getAllPending(): List<SyncQueueEntity>
    
    @Query("SELECT * FROM sync_queue WHERE entityType = :type ORDER BY createdAt ASC")
    suspend fun getPendingByType(type: String): List<SyncQueueEntity>
    
    @Query("SELECT COUNT(*) FROM sync_queue")
    suspend fun getPendingCount(): Int
    
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
}
```

#### 4. Create Database

`data/local/database/FlatmatesDatabase.kt`:

```kotlin
package com.flatmates.app.data.local.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.flatmates.app.data.local.dao.*
import com.flatmates.app.data.local.entity.*

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
    exportSchema = true
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
```

`data/local/dao/UserDao.kt`:

```kotlin
package com.flatmates.app.data.local.dao

import androidx.room.*
import com.flatmates.app.data.local.entity.UserEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface UserDao {
    
    @Query("SELECT * FROM users WHERE id = :id")
    fun getUserById(id: String): Flow<UserEntity?>
    
    @Query("SELECT * FROM users LIMIT 1")
    fun getCurrentUser(): Flow<UserEntity?>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity)
    
    @Update
    suspend fun update(user: UserEntity)
    
    @Query("DELETE FROM users")
    suspend fun deleteAll()
}
```

#### 5. Create Mappers

`data/mapper/TodoMapper.kt`:

```kotlin
package com.flatmates.app.data.mapper

import com.flatmates.app.data.local.entity.TodoEntity
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus

fun TodoEntity.toDomain(): Todo = Todo(
    id = id,
    householdId = householdId,
    title = title,
    description = description,
    status = TodoStatus.fromString(status),
    priority = TodoPriority.fromString(priority),
    dueDate = dueDate,
    assignedToId = assignedToId,
    createdBy = createdBy,
    recurringPattern = recurringPattern,
    recurringUntil = recurringUntil,
    completedAt = completedAt,
    createdAt = createdAt,
    updatedAt = updatedAt,
    assignedToName = assignedToName,
    createdByName = createdByName
)

fun Todo.toEntity(
    syncStatus: String = "SYNCED",
    lastModifiedLocally: Long? = null
): TodoEntity = TodoEntity(
    id = id,
    householdId = householdId,
    title = title,
    description = description,
    status = status.name,
    priority = priority.name,
    dueDate = dueDate,
    assignedToId = assignedToId,
    createdBy = createdBy,
    recurringPattern = recurringPattern,
    recurringUntil = recurringUntil,
    completedAt = completedAt,
    createdAt = createdAt,
    updatedAt = updatedAt,
    assignedToName = assignedToName,
    createdByName = createdByName,
    syncStatus = syncStatus,
    lastModifiedLocally = lastModifiedLocally
)

fun List<TodoEntity>.toDomainList(): List<Todo> = map { it.toDomain() }
```

(Create similar mappers for Shopping, Expense, Household, User)

#### 6. Create Repository Implementation

`data/repository/TodoRepositoryImpl.kt`:

```kotlin
package com.flatmates.app.data.repository

import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.dao.TodoDao
import com.flatmates.app.data.local.entity.SyncQueueEntity
import com.flatmates.app.data.mapper.toDomain
import com.flatmates.app.data.mapper.toDomainList
import com.flatmates.app.data.mapper.toEntity
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject

class TodoRepositoryImpl @Inject constructor(
    private val todoDao: TodoDao,
    private val syncQueueDao: SyncQueueDao,
    private val json: Json
) : TodoRepository {
    
    override fun getTodos(householdId: String): Flow<List<Todo>> =
        todoDao.getTodosByHousehold(householdId).map { it.toDomainList() }
    
    override fun getTodosByStatus(householdId: String, status: TodoStatus): Flow<List<Todo>> =
        todoDao.getTodosByStatus(householdId, status.name).map { it.toDomainList() }
    
    override fun getTodosForDate(householdId: String, date: LocalDate): Flow<List<Todo>> =
        todoDao.getTodosForDate(householdId, date).map { it.toDomainList() }
    
    override fun getOverdueTodos(householdId: String): Flow<List<Todo>> {
        val today = Clock.System.now()
            .toLocalDateTime(TimeZone.currentSystemDefault())
            .date
        return todoDao.getOverdueTodos(householdId, today).map { it.toDomainList() }
    }
    
    override fun getTodoById(todoId: String): Flow<Todo?> =
        todoDao.getTodoById(todoId).map { it?.toDomain() }
    
    override suspend fun createTodo(todo: Todo): Result<Todo> {
        return try {
            val entity = todo.toEntity(
                syncStatus = "PENDING_CREATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            todoDao.insert(entity)
            
            // Add to sync queue
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "todo",
                entityId = todo.id,
                operation = "CREATE",
                payload = json.encodeToString(entity)
            ))
            
            Result.Success(entity.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to create todo")
        }
    }
    
    override suspend fun updateTodo(todo: Todo): Result<Todo> {
        return try {
            val now = Clock.System.now()
            val updated = todo.copy(updatedAt = now)
            val entity = updated.toEntity(
                syncStatus = "PENDING_UPDATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            todoDao.update(entity)
            
            // Update sync queue
            syncQueueDao.removeByEntity(todo.id, "todo")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "todo",
                entityId = todo.id,
                operation = "UPDATE",
                payload = json.encodeToString(entity)
            ))
            
            Result.Success(entity.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to update todo")
        }
    }
    
    override suspend fun completeTodo(todoId: String): Result<Todo> {
        return try {
            val entity = todoDao.getTodoById(todoId).let { flow ->
                var result: com.flatmates.app.data.local.entity.TodoEntity? = null
                flow.collect { result = it; return@collect }
                result
            } ?: return Result.Error(message = "Todo not found")
            
            val now = Clock.System.now()
            val updated = entity.copy(
                status = "COMPLETED",
                completedAt = now,
                updatedAt = now,
                syncStatus = "PENDING_UPDATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            todoDao.update(updated)
            
            syncQueueDao.removeByEntity(todoId, "todo")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "todo",
                entityId = todoId,
                operation = "UPDATE",
                payload = json.encodeToString(updated)
            ))
            
            Result.Success(updated.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to complete todo")
        }
    }
    
    override suspend fun deleteTodo(todoId: String): Result<Unit> {
        return try {
            todoDao.updateSyncStatus(todoId, "PENDING_DELETE")
            
            syncQueueDao.removeByEntity(todoId, "todo")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "todo",
                entityId = todoId,
                operation = "DELETE",
                payload = todoId
            ))
            
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to delete todo")
        }
    }
}
```

#### 7. Create Hilt Modules

`di/DatabaseModule.kt`:

```kotlin
package com.flatmates.app.di

import android.content.Context
import androidx.room.Room
import com.flatmates.app.data.local.database.FlatmatesDatabase
import com.flatmates.app.data.local.dao.*
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
    fun provideDatabase(@ApplicationContext context: Context): FlatmatesDatabase {
        return Room.databaseBuilder(
            context,
            FlatmatesDatabase::class.java,
            FlatmatesDatabase.DATABASE_NAME
        ).build()
    }
    
    @Provides
    fun provideUserDao(database: FlatmatesDatabase): UserDao = database.userDao()
    
    @Provides
    fun provideHouseholdDao(database: FlatmatesDatabase): HouseholdDao = database.householdDao()
    
    @Provides
    fun provideTodoDao(database: FlatmatesDatabase): TodoDao = database.todoDao()
    
    @Provides
    fun provideShoppingDao(database: FlatmatesDatabase): ShoppingDao = database.shoppingDao()
    
    @Provides
    fun provideExpenseDao(database: FlatmatesDatabase): ExpenseDao = database.expenseDao()
    
    @Provides
    fun provideSyncQueueDao(database: FlatmatesDatabase): SyncQueueDao = database.syncQueueDao()
    
    @Provides
    @Singleton
    fun provideJson(): Json = Json {
        ignoreUnknownKeys = true
        encodeDefaults = true
    }
}
```

`di/RepositoryModule.kt`:

```kotlin
package com.flatmates.app.di

import com.flatmates.app.data.repository.*
import com.flatmates.app.domain.repository.*
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    
    @Binds
    @Singleton
    abstract fun bindTodoRepository(impl: TodoRepositoryImpl): TodoRepository
    
    // Add bindings for other repositories as they are implemented
    // @Binds
    // @Singleton
    // abstract fun bindShoppingRepository(impl: ShoppingRepositoryImpl): ShoppingRepository
    
    // @Binds
    // @Singleton
    // abstract fun bindExpenseRepository(impl: ExpenseRepositoryImpl): ExpenseRepository
    
    // @Binds
    // @Singleton
    // abstract fun bindHouseholdRepository(impl: HouseholdRepositoryImpl): HouseholdRepository
}
```

### Success Criteria

- [ ] Room database compiles with all entities and DAOs
- [ ] All DAOs have proper queries with Flow return types
- [ ] Mappers correctly convert between Entity and Domain models
- [ ] Repository implements local-first pattern (write locally, queue for sync)
- [ ] Sync queue properly tracks pending operations
- [ ] Hilt modules provide all dependencies
- [ ] Unit tests pass

### Do NOT

- Add networking code (that's Task 7)
- Add UI code
- Implement actual sync logic
- Add authentication

### Verification

```bash
cd /workspaces/flatmates-app/android-app

# Build to verify Room compiles
./gradlew compileDebugKotlin

# Run tests
./gradlew test
```
