package com.flatmates.app.data.mapper

import com.flatmates.app.data.local.entity.ShoppingListEntity
import com.flatmates.app.data.local.entity.ShoppingListItemEntity
import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.domain.model.enums.ShoppingListStatus

fun ShoppingListEntity.toDomain(items: List<ShoppingListItem> = emptyList()): ShoppingList = ShoppingList(
    id = id,
    householdId = householdId,
    name = name,
    description = description,
    status = ShoppingListStatus.fromString(status),
    createdBy = createdBy,
    createdAt = createdAt,
    updatedAt = updatedAt,
    items = items
)

fun ShoppingList.toEntity(
    syncStatus: String = "SYNCED",
    lastModifiedLocally: Long? = null
): ShoppingListEntity = ShoppingListEntity(
    id = id,
    householdId = householdId,
    name = name,
    description = description,
    status = status.name,
    createdBy = createdBy,
    createdAt = createdAt,
    updatedAt = updatedAt,
    syncStatus = syncStatus,
    lastModifiedLocally = lastModifiedLocally
)

fun ShoppingListItemEntity.toDomain(): ShoppingListItem = ShoppingListItem(
    id = id,
    shoppingListId = shoppingListId,
    name = name,
    quantity = quantity,
    unit = unit,
    category = category,
    isPurchased = isPurchased,
    assignedToId = assignedToId,
    price = price,
    notes = notes,
    isRecurring = isRecurring,
    recurringPattern = recurringPattern,
    position = position,
    createdBy = createdBy,
    createdAt = createdAt,
    updatedAt = updatedAt,
    assignedToName = assignedToName,
    checkedOffByName = checkedOffByName,
    checkedOffAt = checkedOffAt
)

fun ShoppingListItem.toEntity(
    syncStatus: String = "SYNCED",
    lastModifiedLocally: Long? = null
): ShoppingListItemEntity = ShoppingListItemEntity(
    id = id,
    shoppingListId = shoppingListId,
    name = name,
    quantity = quantity,
    unit = unit,
    category = category,
    isPurchased = isPurchased,
    assignedToId = assignedToId,
    price = price,
    notes = notes,
    isRecurring = isRecurring,
    recurringPattern = recurringPattern,
    position = position,
    createdBy = createdBy,
    createdAt = createdAt,
    updatedAt = updatedAt,
    assignedToName = assignedToName,
    checkedOffByName = checkedOffByName,
    checkedOffAt = checkedOffAt,
    syncStatus = syncStatus,
    lastModifiedLocally = lastModifiedLocally
)

fun List<ShoppingListEntity>.toDomainList(): List<ShoppingList> = map { it.toDomain() }
fun List<ShoppingListItemEntity>.toItemDomainList(): List<ShoppingListItem> = map { it.toDomain() }
