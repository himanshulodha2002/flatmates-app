package com.flatmates.app.domain.model

import kotlinx.datetime.Instant
import java.math.BigDecimal

data class ExpenseSplit(
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
) {
    val formattedAmount: String
        get() = "$${amountOwed.setScale(2)}"
}
