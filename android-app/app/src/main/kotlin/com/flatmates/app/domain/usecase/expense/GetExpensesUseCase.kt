package com.flatmates.app.domain.usecase.expense

import com.flatmates.app.domain.model.Expense
import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import javax.inject.Inject

class GetExpensesUseCase @Inject constructor(
    private val expenseRepository: ExpenseRepository,
    private val householdRepository: HouseholdRepository
) {
    @OptIn(ExperimentalCoroutinesApi::class)
    operator fun invoke(): Flow<List<Expense>> {
        return householdRepository.getActiveHousehold().flatMapLatest { household ->
            if (household != null) {
                expenseRepository.getExpenses(household.id)
            } else {
                flowOf(emptyList())
            }
        }
    }
}
