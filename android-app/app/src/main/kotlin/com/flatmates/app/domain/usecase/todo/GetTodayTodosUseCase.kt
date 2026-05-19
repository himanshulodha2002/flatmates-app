package com.flatmates.app.domain.usecase.todo

import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.TodoRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import javax.inject.Inject

class GetTodayTodosUseCase @Inject constructor(
    private val todoRepository: TodoRepository,
    private val householdRepository: HouseholdRepository
) {
    @OptIn(ExperimentalCoroutinesApi::class)
    operator fun invoke(): Flow<List<Todo>> {
        val today = Clock.System.now()
            .toLocalDateTime(TimeZone.currentSystemDefault())
            .date
            
        return householdRepository.getActiveHousehold().flatMapLatest { household ->
            if (household != null) {
                todoRepository.getTodosForDate(household.id, today)
            } else {
                flowOf(emptyList())
            }
        }
    }
}
