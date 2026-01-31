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
