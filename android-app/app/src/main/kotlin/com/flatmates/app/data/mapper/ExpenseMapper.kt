package com.flatmates.app.data.mapper

import com.flatmates.app.data.local.dao.ExpenseWithSplits
import com.flatmates.app.data.local.entity.ExpenseEntity
import com.flatmates.app.data.local.entity.ExpenseSplitEntity
import com.flatmates.app.domain.model.Expense
import com.flatmates.app.domain.model.ExpenseSplit
import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.domain.model.enums.PaymentMethod
import com.flatmates.app.domain.model.enums.SplitType

fun ExpenseEntity.toDomain(splits: List<ExpenseSplit> = emptyList()): Expense = Expense(
    id = id,
    householdId = householdId,
    createdBy = createdBy,
    amount = amount,
    description = description,
    category = ExpenseCategory.fromString(category),
    paymentMethod = PaymentMethod.fromString(paymentMethod),
    date = date,
    splitType = SplitType.fromString(splitType),
    isPersonal = isPersonal,
    createdAt = createdAt,
    updatedAt = updatedAt,
    creatorName = creatorName,
    creatorEmail = creatorEmail,
    splits = splits
)

fun Expense.toEntity(
    syncStatus: String = "SYNCED",
    lastModifiedLocally: Long? = null
): ExpenseEntity = ExpenseEntity(
    id = id,
    householdId = householdId,
    createdBy = createdBy,
    amount = amount,
    description = description,
    category = category.name,
    paymentMethod = paymentMethod.name,
    date = date,
    splitType = splitType.name,
    isPersonal = isPersonal,
    createdAt = createdAt,
    updatedAt = updatedAt,
    creatorName = creatorName,
    creatorEmail = creatorEmail,
    syncStatus = syncStatus,
    lastModifiedLocally = lastModifiedLocally
)

fun ExpenseSplitEntity.toDomain(): ExpenseSplit = ExpenseSplit(
    id = id,
    expenseId = expenseId,
    userId = userId,
    amountOwed = amountOwed,
    isSettled = isSettled,
    settledAt = settledAt,
    createdAt = createdAt,
    userName = userName,
    userEmail = userEmail
)

fun ExpenseSplit.toEntity(): ExpenseSplitEntity = ExpenseSplitEntity(
    id = id,
    expenseId = expenseId,
    userId = userId,
    amountOwed = amountOwed,
    isSettled = isSettled,
    settledAt = settledAt,
    createdAt = createdAt,
    userName = userName,
    userEmail = userEmail
)

fun ExpenseWithSplits.toDomain(): Expense = expense.toDomain(splits.map { it.toDomain() })

fun List<ExpenseEntity>.toDomainList(): List<Expense> = map { it.toDomain() }
fun List<ExpenseSplitEntity>.toSplitDomainList(): List<ExpenseSplit> = map { it.toDomain() }
fun List<ExpenseWithSplits>.toExpenseWithSplitsDomainList(): List<Expense> = map { it.toDomain() }
