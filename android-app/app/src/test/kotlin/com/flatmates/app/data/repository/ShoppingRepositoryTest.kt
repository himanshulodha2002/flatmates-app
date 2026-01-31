package com.flatmates.app.data.repository

import app.cash.turbine.test
import com.flatmates.app.data.local.dao.ShoppingDao
import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.entity.ShoppingListEntity
import com.flatmates.app.data.local.entity.ShoppingListItemEntity
import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.domain.model.enums.ShoppingListStatus
import com.flatmates.app.domain.util.Result
import com.google.common.truth.Truth.assertThat
import io.mockk.*
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import org.junit.Before
import org.junit.Test

class ShoppingRepositoryTest {
    
    private lateinit var shoppingDao: ShoppingDao
    private lateinit var syncQueueDao: SyncQueueDao
    private lateinit var repository: ShoppingRepositoryImpl
    
    private val testHouseholdId = "household-123"
    private val testListId = "list-123"
    private val now: Instant = Clock.System.now()
    
    @Before
    fun setup() {
        shoppingDao = mockk(relaxed = true)
        syncQueueDao = mockk(relaxed = true)
        repository = ShoppingRepositoryImpl(shoppingDao, syncQueueDao)
    }
    
    @Test
    fun `getShoppingLists returns mapped domain models`() = runTest {
        // Given
        val entities = listOf(
            createShoppingListEntity("1", "Groceries"),
            createShoppingListEntity("2", "Supplies")
        )
        coEvery { shoppingDao.getActiveShoppingLists(testHouseholdId) } returns flowOf(entities)
        
        // When/Then
        repository.getShoppingLists(testHouseholdId).test {
            val lists = awaitItem()
            assertThat(lists).hasSize(2)
            assertThat(lists[0].name).isEqualTo("Groceries")
            assertThat(lists[1].name).isEqualTo("Supplies")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `getShoppingLists returns empty list when none exist`() = runTest {
        // Given
        coEvery { shoppingDao.getActiveShoppingLists(testHouseholdId) } returns flowOf(emptyList())
        
        // When/Then
        repository.getShoppingLists(testHouseholdId).test {
            val lists = awaitItem()
            assertThat(lists).isEmpty()
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `createList inserts entity and adds to sync queue`() = runTest {
        // Given
        val list = createShoppingList("new-list", "New List")
        
        // When
        val result = repository.createList(list)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { shoppingDao.insertList(any()) }
        coVerify { syncQueueDao.enqueue(match { it.operation == "CREATE" && it.entityType == "shopping_list" }) }
    }
    
    @Test
    fun `deleteList marks as pending delete`() = runTest {
        // Given
        val listId = "list-123"
        
        // When
        val result = repository.deleteList(listId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { shoppingDao.updateListSyncStatus(listId, "PENDING_DELETE") }
        coVerify { syncQueueDao.enqueue(match { it.operation == "DELETE" && it.entityType == "shopping_list" }) }
    }
    
    @Test
    fun `addItem inserts item and adds to sync queue`() = runTest {
        // Given
        val item = createShoppingItem("item-1", "Milk")
        
        // When
        val result = repository.addItem(item)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { shoppingDao.insertItem(any()) }
        coVerify { syncQueueDao.enqueue(match { it.operation == "CREATE" && it.entityType == "shopping_item" }) }
    }
    
    @Test
    fun `toggleItemPurchased updates item correctly`() = runTest {
        // Given
        val itemId = "item-123"
        val entity = createShoppingItemEntity(itemId, "Milk", isPurchased = false)
        coEvery { shoppingDao.getShoppingItemByIdOnce(itemId) } returns entity
        
        // When
        val result = repository.toggleItemPurchased(itemId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { shoppingDao.updateItem(match { it.isPurchased }) }
    }
    
    @Test
    fun `toggleItemPurchased returns error when item not found`() = runTest {
        // Given
        val itemId = "non-existent-id"
        coEvery { shoppingDao.getShoppingItemByIdOnce(itemId) } returns null
        
        // When
        val result = repository.toggleItemPurchased(itemId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Error::class.java)
        assertThat((result as Result.Error).message).isEqualTo("Item not found")
    }
    
    @Test
    fun `createList handles database error gracefully`() = runTest {
        // Given
        val list = createShoppingList("new-list", "New List")
        coEvery { shoppingDao.insertList(any()) } throws RuntimeException("DB Error")
        
        // When
        val result = repository.createList(list)
        
        // Then
        assertThat(result).isInstanceOf(Result.Error::class.java)
        assertThat((result as Result.Error).message).contains("Failed to create")
    }
    
    @Test
    fun `getShoppingItems returns items for list`() = runTest {
        // Given
        val items = listOf(
            createShoppingItemEntity("1", "Milk"),
            createShoppingItemEntity("2", "Bread")
        )
        coEvery { shoppingDao.getShoppingItems(testListId) } returns flowOf(items)
        
        // When/Then
        repository.getShoppingItems(testListId).test {
            val returnedItems = awaitItem()
            assertThat(returnedItems).hasSize(2)
            assertThat(returnedItems[0].name).isEqualTo("Milk")
            assertThat(returnedItems[1].name).isEqualTo("Bread")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    // Helper functions
    private fun createShoppingListEntity(id: String, name: String) = ShoppingListEntity(
        id = id,
        householdId = testHouseholdId,
        name = name,
        status = "ACTIVE",
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
    
    private fun createShoppingList(id: String, name: String) = ShoppingList(
        id = id,
        householdId = testHouseholdId,
        name = name,
        status = ShoppingListStatus.ACTIVE,
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
    
    private fun createShoppingItemEntity(
        id: String,
        name: String,
        isPurchased: Boolean = false
    ) = ShoppingListItemEntity(
        id = id,
        shoppingListId = testListId,
        name = name,
        quantity = 1.0,
        isPurchased = isPurchased,
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
    
    private fun createShoppingItem(id: String, name: String) = ShoppingListItem(
        id = id,
        shoppingListId = testListId,
        name = name,
        quantity = 1.0,
        isPurchased = false,
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
}
