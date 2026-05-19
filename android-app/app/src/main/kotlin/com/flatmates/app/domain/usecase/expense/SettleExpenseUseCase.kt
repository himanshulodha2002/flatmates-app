package com.flatmates.app.domain.usecase.expense

import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.util.Result
import javax.inject.Inject

class SettleExpenseUseCase @Inject constructor(
    private val expenseRepository: ExpenseRepository
) {
    suspend operator fun invoke(splitId: String): Result<Unit> {
        return expenseRepository.settleExpenseSplit(splitId)
    }
}
