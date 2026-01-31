package com.flatmates.app.domain.usecase.expense

import com.flatmates.app.domain.model.Expense
import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.domain.model.enums.PaymentMethod
import com.flatmates.app.domain.model.enums.SplitType
import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.first
import kotlinx.datetime.Clock
import java.math.BigDecimal
import java.util.UUID
import javax.inject.Inject

data class CreateExpenseParams(
    val amount: BigDecimal,
    val description: String,
    val category: ExpenseCategory = ExpenseCategory.OTHER,
    val paymentMethod: PaymentMethod = PaymentMethod.CASH,
    val splitType: SplitType = SplitType.EQUAL,
    val createdBy: String
)

class CreateExpenseUseCase @Inject constructor(
    private val expenseRepository: ExpenseRepository,
    private val householdRepository: HouseholdRepository
) {
    suspend operator fun invoke(params: CreateExpenseParams): Result<Expense> {
        if (params.amount <= BigDecimal.ZERO) {
            return Result.Error(message = "Amount must be greater than zero")
        }
        
        val trimmedDescription = params.description.trim()
        if (trimmedDescription.isBlank()) {
            return Result.Error(message = "Description cannot be empty")
        }
        
        val household = householdRepository.getActiveHousehold().first()
            ?: return Result.Error(message = "No active household selected")
        
        val now = Clock.System.now()
        val expense = Expense(
            id = UUID.randomUUID().toString(),
            householdId = household.id,
            createdBy = params.createdBy,
            amount = params.amount,
            description = trimmedDescription,
            category = params.category,
            paymentMethod = params.paymentMethod,
            date = now,
            splitType = params.splitType,
            createdAt = now,
            updatedAt = now
        )
        
        return expenseRepository.createExpense(expense)
    }
}
