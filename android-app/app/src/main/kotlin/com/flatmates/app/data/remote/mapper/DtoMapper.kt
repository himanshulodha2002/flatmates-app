package com.flatmates.app.data.remote.mapper

import com.flatmates.app.data.local.entity.ExpenseEntity
import com.flatmates.app.data.local.entity.ExpenseSplitEntity
import com.flatmates.app.data.local.entity.ShoppingListEntity
import com.flatmates.app.data.local.entity.ShoppingListItemEntity
import com.flatmates.app.data.local.entity.TodoEntity
import com.flatmates.app.data.local.entity.UserEntity
import com.flatmates.app.data.remote.dto.*
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import java.math.BigDecimal

// ==================== User Mappers ====================

fun UserDto.toEntity(): UserEntity = UserEntity(
    id = id,
    email = email,
    fullName = fullName,
    googleId = googleId,
    profilePictureUrl = profilePictureUrl,
    isActive = isActive,
    createdAt = createdAt?.let { parseInstant(it) },
    updatedAt = updatedAt?.let { parseInstant(it) },
    syncStatus = "SYNCED"
)

// ==================== Todo Mappers ====================

fun TodoDto.toEntity(): TodoEntity = TodoEntity(
    id = id,
    householdId = householdId,
    title = title,
    description = description,
    status = status,
    priority = priority,
    dueDate = dueDate?.let { parseLocalDate(it) },
    assignedToId = assignedToId,
    createdBy = createdBy,
    completedAt = completedAt?.let { parseInstant(it) },
    createdAt = parseInstant(createdAt),
    updatedAt = parseInstant(updatedAt),
    syncStatus = "SYNCED"
)

fun TodoEntity.toDto(): TodoDto = TodoDto(
    id = id,
    householdId = householdId,
    title = title,
    description = description,
    status = status,
    priority = priority,
    dueDate = dueDate?.toString(),
    assignedToId = assignedToId,
    createdBy = createdBy,
    completedAt = completedAt?.toString(),
    createdAt = createdAt.toString(),
    updatedAt = updatedAt.toString()
)

// ==================== Shopping List Mappers ====================

fun ShoppingListDto.toEntity(): ShoppingListEntity = ShoppingListEntity(
    id = id,
    householdId = householdId,
    name = name,
    description = description,
    status = status,
    createdBy = createdBy,
    createdAt = parseInstant(createdAt),
    updatedAt = parseInstant(updatedAt),
    syncStatus = "SYNCED"
)

fun ShoppingListEntity.toDto(): ShoppingListDto = ShoppingListDto(
    id = id,
    householdId = householdId,
    name = name,
    description = description,
    status = status,
    createdBy = createdBy,
    createdAt = createdAt.toString(),
    updatedAt = updatedAt.toString()
)

// ==================== Shopping Item Mappers ====================

fun ShoppingItemDto.toEntity(): ShoppingListItemEntity = ShoppingListItemEntity(
    id = id,
    shoppingListId = shoppingListId,
    name = name,
    quantity = quantity,
    unit = unit,
    category = category,
    isPurchased = isPurchased,
    price = price?.let { BigDecimal(it) },
    createdBy = createdBy,
    createdAt = parseInstant(createdAt),
    updatedAt = parseInstant(updatedAt),
    syncStatus = "SYNCED"
)

fun ShoppingListItemEntity.toDto(): ShoppingItemDto = ShoppingItemDto(
    id = id,
    shoppingListId = shoppingListId,
    name = name,
    quantity = quantity,
    unit = unit,
    category = category,
    isPurchased = isPurchased,
    price = price?.toString(),
    createdBy = createdBy,
    createdAt = createdAt.toString(),
    updatedAt = updatedAt.toString()
)

// ==================== Expense Mappers ====================

fun ExpenseDto.toEntity(): ExpenseEntity = ExpenseEntity(
    id = id,
    householdId = householdId,
    createdBy = createdBy,
    amount = BigDecimal(amount),
    description = description,
    category = category,
    splitType = splitType,
    date = parseInstant(date),
    createdAt = parseInstant(createdAt),
    updatedAt = parseInstant(updatedAt),
    syncStatus = "SYNCED"
)

fun ExpenseEntity.toDto(): ExpenseDto = ExpenseDto(
    id = id,
    householdId = householdId,
    createdBy = createdBy,
    amount = amount.toString(),
    description = description,
    category = category,
    splitType = splitType,
    date = date.toString(),
    createdAt = createdAt.toString(),
    updatedAt = updatedAt.toString(),
    splits = emptyList()
)

fun ExpenseSplitDto.toEntity(): ExpenseSplitEntity = ExpenseSplitEntity(
    id = id,
    expenseId = expenseId,
    userId = userId,
    amountOwed = BigDecimal(amountOwed),
    isSettled = isSettled,
    settledAt = settledAt?.let { parseInstant(it) },
    createdAt = Instant.fromEpochMilliseconds(System.currentTimeMillis())
)

// ==================== Helper Functions ====================

private fun parseInstant(isoString: String): Instant {
    return try {
        Instant.parse(isoString)
    } catch (e: Exception) {
        Instant.fromEpochMilliseconds(System.currentTimeMillis())
    }
}

private fun parseLocalDate(dateString: String): LocalDate {
    return try {
        LocalDate.parse(dateString)
    } catch (e: Exception) {
        Clock.System.now()
            .toLocalDateTime(TimeZone.currentSystemDefault())
            .date
    }
}
