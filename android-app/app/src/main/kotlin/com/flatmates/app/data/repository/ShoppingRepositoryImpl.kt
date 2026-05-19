package com.flatmates.app.data.repository

import com.flatmates.app.data.local.dao.ShoppingDao
import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.entity.SyncQueueEntity
import com.flatmates.app.data.mapper.toDomain
import com.flatmates.app.data.mapper.toDomainList
import com.flatmates.app.data.mapper.toEntity
import com.flatmates.app.data.mapper.toItemDomainList
import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.domain.repository.ShoppingRepository
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.datetime.Clock
import javax.inject.Inject

class ShoppingRepositoryImpl @Inject constructor(
    private val shoppingDao: ShoppingDao,
    private val syncQueueDao: SyncQueueDao
) : ShoppingRepository {
    
    override fun getShoppingLists(householdId: String): Flow<List<ShoppingList>> =
        shoppingDao.getActiveShoppingLists(householdId).map { it.toDomainList() }
    
    override fun getShoppingListById(listId: String): Flow<ShoppingList?> =
        shoppingDao.getShoppingListById(listId).map { it?.toDomain() }
    
    override fun getShoppingItems(listId: String): Flow<List<ShoppingListItem>> =
        shoppingDao.getShoppingItems(listId).map { it.toItemDomainList() }
    
    override fun getShoppingItemById(itemId: String): Flow<ShoppingListItem?> =
        shoppingDao.getShoppingItemById(itemId).map { it?.toDomain() }
    
    override suspend fun createList(list: ShoppingList): Result<ShoppingList> {
        return try {
            val entity = list.toEntity(
                syncStatus = "PENDING_CREATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            shoppingDao.insertList(entity)
            
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "shopping_list",
                entityId = list.id,
                operation = "CREATE",
                payload = "{\"id\":\"${list.id}\",\"name\":\"${list.name}\"}"
            ))
            
            Result.Success(entity.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to create shopping list")
        }
    }
    
    override suspend fun updateList(list: ShoppingList): Result<ShoppingList> {
        return try {
            val now = Clock.System.now()
            val updated = list.copy(updatedAt = now)
            val entity = updated.toEntity(
                syncStatus = "PENDING_UPDATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            shoppingDao.updateList(entity)
            
            syncQueueDao.removeByEntity(list.id, "shopping_list")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "shopping_list",
                entityId = list.id,
                operation = "UPDATE",
                payload = "{\"id\":\"${list.id}\",\"name\":\"${list.name}\"}"
            ))
            
            Result.Success(entity.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to update shopping list")
        }
    }
    
    override suspend fun deleteList(listId: String): Result<Unit> {
        return try {
            shoppingDao.updateListSyncStatus(listId, "PENDING_DELETE")
            
            syncQueueDao.removeByEntity(listId, "shopping_list")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "shopping_list",
                entityId = listId,
                operation = "DELETE",
                payload = listId
            ))
            
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to delete shopping list")
        }
    }
    
    override suspend fun addItem(item: ShoppingListItem): Result<ShoppingListItem> {
        return try {
            val entity = item.toEntity(
                syncStatus = "PENDING_CREATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            shoppingDao.insertItem(entity)
            
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "shopping_item",
                entityId = item.id,
                operation = "CREATE",
                payload = "{\"id\":\"${item.id}\",\"name\":\"${item.name}\"}"
            ))
            
            Result.Success(entity.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to add item")
        }
    }
    
    override suspend fun updateItem(item: ShoppingListItem): Result<ShoppingListItem> {
        return try {
            val now = Clock.System.now()
            val updated = item.copy(updatedAt = now)
            val entity = updated.toEntity(
                syncStatus = "PENDING_UPDATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            shoppingDao.updateItem(entity)
            
            syncQueueDao.removeByEntity(item.id, "shopping_item")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "shopping_item",
                entityId = item.id,
                operation = "UPDATE",
                payload = "{\"id\":\"${item.id}\",\"name\":\"${item.name}\"}"
            ))
            
            Result.Success(entity.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to update item")
        }
    }
    
    override suspend fun toggleItemPurchased(itemId: String): Result<ShoppingListItem> {
        return try {
            val entity = shoppingDao.getShoppingItemByIdOnce(itemId)
                ?: return Result.Error(message = "Item not found")
            
            val now = Clock.System.now()
            val updated = entity.copy(
                isPurchased = !entity.isPurchased,
                checkedOffAt = if (!entity.isPurchased) now else null,
                updatedAt = now,
                syncStatus = "PENDING_UPDATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            shoppingDao.updateItem(updated)
            
            syncQueueDao.removeByEntity(itemId, "shopping_item")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "shopping_item",
                entityId = itemId,
                operation = "UPDATE",
                payload = "{\"id\":\"$itemId\",\"isPurchased\":${updated.isPurchased}}"
            ))
            
            Result.Success(updated.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to toggle item")
        }
    }
    
    override suspend fun deleteItem(itemId: String): Result<Unit> {
        return try {
            shoppingDao.updateItemSyncStatus(itemId, "PENDING_DELETE")
            
            syncQueueDao.removeByEntity(itemId, "shopping_item")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "shopping_item",
                entityId = itemId,
                operation = "DELETE",
                payload = itemId
            ))
            
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to delete item")
        }
    }
}
