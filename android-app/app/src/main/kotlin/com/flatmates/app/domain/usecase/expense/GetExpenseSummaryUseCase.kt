package com.flatmates.app.domain.usecase.expense

import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.UserRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import java.math.BigDecimal
import javax.inject.Inject

data class ExpenseSummary(
    val totalExpenses: BigDecimal,
    val totalOwed: BigDecimal,
    val totalOwing: BigDecimal,
    val netBalance: BigDecimal
)

class GetExpenseSummaryUseCase @Inject constructor(
    private val expenseRepository: ExpenseRepository,
    private val householdRepository: HouseholdRepository,
    private val userRepository: UserRepository
) {
    @OptIn(ExperimentalCoroutinesApi::class)
    operator fun invoke(): Flow<ExpenseSummary> {
        return householdRepository.getActiveHousehold().flatMapLatest { household ->
            if (household != null) {
                // Get current user ID to calculate owed/owing
                val userId = try {
                    userRepository.getCurrentUser().getOrNull()?.id ?: ""
                } catch (e: Exception) {
                    ""
                }
                
                combine(
                    expenseRepository.getTotalExpenses(household.id),
                    expenseRepository.getTotalOwed(userId),
                    expenseRepository.getTotalOwing(userId)
                ) { totalExpenses, totalOwed, totalOwing ->
                    ExpenseSummary(
                        totalExpenses = totalExpenses,
                        totalOwed = totalOwed,
                        totalOwing = totalOwing,
                        netBalance = totalOwing - totalOwed
                    )
                }
            } else {
                flowOf(ExpenseSummary(
                    totalExpenses = BigDecimal.ZERO,
                    totalOwed = BigDecimal.ZERO,
                    totalOwing = BigDecimal.ZERO,
                    netBalance = BigDecimal.ZERO
                ))
            }
        }
    }
}
