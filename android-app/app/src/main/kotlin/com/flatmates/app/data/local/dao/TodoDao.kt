package com.flatmates.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
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
    
    @Query("SELECT * FROM todos WHERE id = :todoId")
    suspend fun getTodoByIdOnce(todoId: String): TodoEntity?
    
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
