package com.flatmates.app.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SyncRequest(
    @SerialName("last_sync_timestamp")
    val lastSyncTimestamp: Long,
    @SerialName("household_id")
    val householdId: String,
    val changes: SyncChanges
)

@Serializable
data class SyncChanges(
    val todos: EntityChanges<TodoDto>? = null,
    @SerialName("shopping_lists")
    val shoppingLists: EntityChanges<ShoppingListDto>? = null,
    @SerialName("shopping_items")
    val shoppingItems: EntityChanges<ShoppingItemDto>? = null,
    val expenses: EntityChanges<ExpenseDto>? = null
)

@Serializable
data class EntityChanges<T>(
    val created: List<T> = emptyList(),
    val updated: List<T> = emptyList(),
    val deleted: List<String> = emptyList()
)

@Serializable
data class SyncResponse(
    @SerialName("server_timestamp")
    val serverTimestamp: Long,
    val todos: List<TodoDto> = emptyList(),
    @SerialName("shopping_lists")
    val shoppingLists: List<ShoppingListDto> = emptyList(),
    @SerialName("shopping_items")
    val shoppingItems: List<ShoppingItemDto> = emptyList(),
    val expenses: List<ExpenseDto> = emptyList(),
    val conflicts: List<SyncConflict> = emptyList()
)

@Serializable
data class SyncConflict(
    @SerialName("entity_type")
    val entityType: String,
    @SerialName("entity_id")
    val entityId: String,
    @SerialName("local_version")
    val localVersion: String,
    @SerialName("server_version")
    val serverVersion: String,
    @SerialName("conflict_type")
    val conflictType: String // "UPDATE_UPDATE", "DELETE_UPDATE", etc.
)

// Entity DTOs matching backend schemas
@Serializable
data class TodoDto(
    val id: String,
    @SerialName("household_id")
    val householdId: String,
    val title: String,
    val description: String? = null,
    val status: String = "PENDING",
    val priority: String = "MEDIUM",
    @SerialName("due_date")
    val dueDate: String? = null,
    @SerialName("assigned_to_id")
    val assignedToId: String? = null,
    @SerialName("created_by")
    val createdBy: String,
    @SerialName("completed_at")
    val completedAt: String? = null,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String
)

@Serializable
data class ShoppingListDto(
    val id: String,
    @SerialName("household_id")
    val householdId: String,
    val name: String,
    val description: String? = null,
    val status: String = "ACTIVE",
    @SerialName("created_by")
    val createdBy: String,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String
)

@Serializable
data class ShoppingItemDto(
    val id: String,
    @SerialName("shopping_list_id")
    val shoppingListId: String,
    val name: String,
    val quantity: Double = 1.0,
    val unit: String? = null,
    val category: String? = null,
    @SerialName("is_purchased")
    val isPurchased: Boolean = false,
    val price: String? = null,
    @SerialName("created_by")
    val createdBy: String,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String
)

@Serializable
data class ExpenseDto(
    val id: String,
    @SerialName("household_id")
    val householdId: String,
    @SerialName("created_by")
    val createdBy: String,
    val amount: String,
    val description: String,
    val category: String = "OTHER",
    @SerialName("split_type")
    val splitType: String = "EQUAL",
    val date: String,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String,
    val splits: List<ExpenseSplitDto> = emptyList()
)

@Serializable
data class ExpenseSplitDto(
    val id: String,
    @SerialName("expense_id")
    val expenseId: String,
    @SerialName("user_id")
    val userId: String,
    @SerialName("amount_owed")
    val amountOwed: String,
    @SerialName("is_settled")
    val isSettled: Boolean = false,
    @SerialName("settled_at")
    val settledAt: String? = null
)

@Serializable
data class HouseholdDto(
    val id: String,
    val name: String,
    @SerialName("created_by")
    val createdBy: String,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("invite_code")
    val inviteCode: String? = null
)

@Serializable
data class CreateHouseholdRequest(
    val name: String
)

@Serializable
data class JoinHouseholdRequest(
    @SerialName("invite_code")
    val inviteCode: String
)

@Serializable
data class HouseholdMemberDto(
    val id: String,
    @SerialName("user_id")
    val userId: String,
    @SerialName("household_id")
    val householdId: String,
    val role: String,
    @SerialName("joined_at")
    val joinedAt: String,
    val user: UserDto? = null
)
