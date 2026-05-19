package com.flatmates.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
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
    
    @Query("SELECT * FROM shopping_lists WHERE id = :listId")
    suspend fun getShoppingListByIdOnce(listId: String): ShoppingListEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertList(list: ShoppingListEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLists(lists: List<ShoppingListEntity>)
    
    @Update
    suspend fun updateList(list: ShoppingListEntity)
    
    @Query("DELETE FROM shopping_lists WHERE id = :id")
    suspend fun deleteList(id: String)
    
    @Query("UPDATE shopping_lists SET syncStatus = :status WHERE id = :id")
    suspend fun updateListSyncStatus(id: String, status: String)
    
    // Shopping Items
    @Query("SELECT * FROM shopping_list_items WHERE shoppingListId = :listId AND syncStatus != 'PENDING_DELETE' ORDER BY isPurchased ASC, position ASC")
    fun getShoppingItems(listId: String): Flow<List<ShoppingListItemEntity>>
    
    @Query("SELECT * FROM shopping_list_items WHERE id = :itemId")
    fun getShoppingItemById(itemId: String): Flow<ShoppingListItemEntity?>
    
    @Query("SELECT * FROM shopping_list_items WHERE id = :itemId")
    suspend fun getShoppingItemByIdOnce(itemId: String): ShoppingListItemEntity?
    
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
    
    @Query("UPDATE shopping_list_items SET isPurchased = :isPurchased, checkedOffAt = :checkedOffAt, checkedOffByName = :checkedOffByName, syncStatus = :syncStatus WHERE id = :id")
    suspend fun toggleItemPurchased(
        id: String,
        isPurchased: Boolean,
        checkedOffAt: Long?,
        checkedOffByName: String?,
        syncStatus: String
    )
    
    // Pending sync
    @Query("SELECT * FROM shopping_lists WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSyncLists(): List<ShoppingListEntity>
    
    @Query("SELECT * FROM shopping_list_items WHERE syncStatus != 'SYNCED'")
    suspend fun getPendingSyncItems(): List<ShoppingListItemEntity>
}
