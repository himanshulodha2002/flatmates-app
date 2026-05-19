package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow

interface ShoppingRepository {
    fun getShoppingLists(householdId: String): Flow<List<ShoppingList>>
    fun getShoppingListById(listId: String): Flow<ShoppingList?>
    fun getShoppingItems(listId: String): Flow<List<ShoppingListItem>>
    fun getShoppingItemById(itemId: String): Flow<ShoppingListItem?>
    
    suspend fun createList(list: ShoppingList): Result<ShoppingList>
    suspend fun updateList(list: ShoppingList): Result<ShoppingList>
    suspend fun deleteList(listId: String): Result<Unit>
    
    suspend fun addItem(item: ShoppingListItem): Result<ShoppingListItem>
    suspend fun updateItem(item: ShoppingListItem): Result<ShoppingListItem>
    suspend fun toggleItemPurchased(itemId: String): Result<ShoppingListItem>
    suspend fun deleteItem(itemId: String): Result<Unit>
}
