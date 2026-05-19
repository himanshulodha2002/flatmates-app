package com.flatmates.app.domain.model

import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.domain.model.enums.PaymentMethod
import com.flatmates.app.domain.model.enums.SplitType
import kotlinx.datetime.Instant
import java.math.BigDecimal

data class Expense(
    val id: String,
    val householdId: String,
    val createdBy: String,
    val amount: BigDecimal,
    val description: String,
    val category: ExpenseCategory = ExpenseCategory.OTHER,
    val paymentMethod: PaymentMethod = PaymentMethod.CASH,
    val date: Instant,
    val splitType: SplitType = SplitType.EQUAL,
    val isPersonal: Boolean = false,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Denormalized
    val creatorName: String? = null,
    val creatorEmail: String? = null,
    val splits: List<ExpenseSplit> = emptyList()
) {
    val formattedAmount: String
        get() = "$${amount.setScale(2)}"
}
