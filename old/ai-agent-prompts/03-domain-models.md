# Task 3: Core Domain Models

## Metadata
- **Can run in parallel with**: Task 4 (UI Theme), Task 5 (Data Layer - start after this)
- **Dependencies**: Task 2 (Android Project Setup) must be complete
- **Estimated time**: 1-2 hours
- **Priority**: HIGH (foundation for data and UI layers)

---

## Prompt

You are implementing domain models and use cases for the Flatmates Android app following Clean Architecture principles.

### Repository Information
- **Repository**: `/workspaces/flatmates-app`
- **Android Path**: `/workspaces/flatmates-app/android-app`
- **Reference Backend Models**: `/workspaces/flatmates-app/backend/app/models/`

### Package Structure to Create

```
app/src/main/kotlin/com/flatmates/app/
├── domain/
│   ├── model/
│   │   ├── User.kt
│   │   ├── Household.kt
│   │   ├── HouseholdMember.kt
│   │   ├── Todo.kt
│   │   ├── ShoppingList.kt
│   │   ├── ShoppingListItem.kt
│   │   ├── Expense.kt
│   │   ├── ExpenseSplit.kt
│   │   └── enums/
│   │       ├── MemberRole.kt
│   │       ├── TodoStatus.kt
│   │       ├── TodoPriority.kt
│   │       ├── ShoppingListStatus.kt
│   │       ├── ExpenseCategory.kt
│   │       ├── SplitType.kt
│   │       └── PaymentMethod.kt
│   ├── repository/
│   │   ├── AuthRepository.kt
│   │   ├── UserRepository.kt
│   │   ├── HouseholdRepository.kt
│   │   ├── TodoRepository.kt
│   │   ├── ShoppingRepository.kt
│   │   └── ExpenseRepository.kt
│   ├── usecase/
│   │   ├── auth/
│   │   │   ├── SignInWithGoogleUseCase.kt
│   │   │   ├── SignOutUseCase.kt
│   │   │   └── GetCurrentUserUseCase.kt
│   │   ├── household/
│   │   │   ├── GetHouseholdsUseCase.kt
│   │   │   ├── CreateHouseholdUseCase.kt
│   │   │   ├── JoinHouseholdUseCase.kt
│   │   │   └── GetHouseholdMembersUseCase.kt
│   │   ├── todo/
│   │   │   ├── GetTodosUseCase.kt
│   │   │   ├── GetTodayTodosUseCase.kt
│   │   │   ├── CreateTodoUseCase.kt
│   │   │   ├── UpdateTodoUseCase.kt
│   │   │   ├── CompleteTodoUseCase.kt
│   │   │   └── DeleteTodoUseCase.kt
│   │   ├── shopping/
│   │   │   ├── GetShoppingListsUseCase.kt
│   │   │   ├── CreateShoppingListUseCase.kt
│   │   │   ├── GetShoppingItemsUseCase.kt
│   │   │   ├── AddShoppingItemUseCase.kt
│   │   │   ├── ToggleItemPurchasedUseCase.kt
│   │   │   └── DeleteShoppingItemUseCase.kt
│   │   └── expense/
│   │       ├── GetExpensesUseCase.kt
│   │       ├── CreateExpenseUseCase.kt
│   │       ├── GetExpenseSummaryUseCase.kt
│   │       └── SettleExpenseUseCase.kt
│   └── util/
│       └── Result.kt
```

### Tasks

#### 1. Create Result Wrapper

`domain/util/Result.kt`:

```kotlin
package com.flatmates.app.domain.util

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(
        val exception: Throwable? = null,
        val message: String? = null
    ) : Result<Nothing>()
    data object Loading : Result<Nothing>()
    
    val isSuccess: Boolean get() = this is Success
    val isError: Boolean get() = this is Error
    val isLoading: Boolean get() = this is Loading
    
    fun getOrNull(): T? = (this as? Success)?.data
    
    fun getOrThrow(): T = when (this) {
        is Success -> data
        is Error -> throw exception ?: IllegalStateException(message ?: "Unknown error")
        is Loading -> throw IllegalStateException("Result is still loading")
    }
    
    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> this
        is Loading -> Loading
    }
    
    inline fun onSuccess(action: (T) -> Unit): Result<T> {
        if (this is Success) action(data)
        return this
    }
    
    inline fun onError(action: (Throwable?, String?) -> Unit): Result<T> {
        if (this is Error) action(exception, message)
        return this
    }
}

// Extension to convert to Flow
fun <T> Result<T>.asFlow(): kotlinx.coroutines.flow.Flow<Result<T>> = 
    kotlinx.coroutines.flow.flowOf(this)
```

#### 2. Create Enums

`domain/model/enums/MemberRole.kt`:
```kotlin
package com.flatmates.app.domain.model.enums

enum class MemberRole {
    OWNER,
    MEMBER;
    
    companion object {
        fun fromString(value: String): MemberRole = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: MEMBER
    }
}
```

`domain/model/enums/TodoStatus.kt`:
```kotlin
package com.flatmates.app.domain.model.enums

enum class TodoStatus {
    PENDING,
    IN_PROGRESS,
    COMPLETED;
    
    companion object {
        fun fromString(value: String): TodoStatus = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: PENDING
    }
}
```

`domain/model/enums/TodoPriority.kt`:
```kotlin
package com.flatmates.app.domain.model.enums

enum class TodoPriority {
    LOW,
    MEDIUM,
    HIGH;
    
    companion object {
        fun fromString(value: String): TodoPriority = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: MEDIUM
    }
}
```

`domain/model/enums/ShoppingListStatus.kt`:
```kotlin
package com.flatmates.app.domain.model.enums

enum class ShoppingListStatus {
    ACTIVE,
    ARCHIVED;
    
    companion object {
        fun fromString(value: String): ShoppingListStatus = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: ACTIVE
    }
}
```

`domain/model/enums/ExpenseCategory.kt`:
```kotlin
package com.flatmates.app.domain.model.enums

enum class ExpenseCategory(val displayName: String) {
    GROCERIES("Groceries"),
    UTILITIES("Utilities"),
    RENT("Rent"),
    INTERNET("Internet"),
    CLEANING("Cleaning"),
    MAINTENANCE("Maintenance"),
    ENTERTAINMENT("Entertainment"),
    FOOD("Food"),
    TRANSPORTATION("Transportation"),
    OTHER("Other");
    
    companion object {
        fun fromString(value: String): ExpenseCategory = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: OTHER
    }
}
```

`domain/model/enums/SplitType.kt`:
```kotlin
package com.flatmates.app.domain.model.enums

enum class SplitType(val displayName: String) {
    EQUAL("Split Equally"),
    CUSTOM("Custom Amounts"),
    PERCENTAGE("By Percentage");
    
    companion object {
        fun fromString(value: String): SplitType = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: EQUAL
    }
}
```

`domain/model/enums/PaymentMethod.kt`:
```kotlin
package com.flatmates.app.domain.model.enums

enum class PaymentMethod(val displayName: String) {
    CASH("Cash"),
    CARD("Card"),
    BANK_TRANSFER("Bank Transfer"),
    DIGITAL_WALLET("Digital Wallet"),
    OTHER("Other");
    
    companion object {
        fun fromString(value: String): PaymentMethod = 
            entries.find { it.name.equals(value, ignoreCase = true) } ?: CASH
    }
}
```

#### 3. Create Domain Models

`domain/model/User.kt`:
```kotlin
package com.flatmates.app.domain.model

data class User(
    val id: String,
    val email: String,
    val fullName: String,
    val googleId: String? = null,
    val profilePictureUrl: String? = null,
    val isActive: Boolean = true,
    val createdAt: kotlinx.datetime.Instant? = null,
    val updatedAt: kotlinx.datetime.Instant? = null
) {
    val initials: String
        get() = fullName
            .split(" ")
            .take(2)
            .mapNotNull { it.firstOrNull()?.uppercase() }
            .joinToString("")
}
```

`domain/model/Household.kt`:
```kotlin
package com.flatmates.app.domain.model

import kotlinx.datetime.Instant

data class Household(
    val id: String,
    val name: String,
    val createdBy: String,
    val createdAt: Instant,
    val memberCount: Int = 0
)
```

`domain/model/HouseholdMember.kt`:
```kotlin
package com.flatmates.app.domain.model

import com.flatmates.app.domain.model.enums.MemberRole
import kotlinx.datetime.Instant

data class HouseholdMember(
    val id: String,
    val userId: String,
    val householdId: String,
    val role: MemberRole,
    val joinedAt: Instant,
    // Denormalized user info for display
    val email: String? = null,
    val fullName: String? = null,
    val profilePictureUrl: String? = null
) {
    val isOwner: Boolean get() = role == MemberRole.OWNER
}
```

`domain/model/Todo.kt`:
```kotlin
package com.flatmates.app.domain.model

import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

data class Todo(
    val id: String,
    val householdId: String,
    val title: String,
    val description: String? = null,
    val status: TodoStatus = TodoStatus.PENDING,
    val priority: TodoPriority = TodoPriority.MEDIUM,
    val dueDate: LocalDate? = null,
    val assignedToId: String? = null,
    val createdBy: String,
    val recurringPattern: String? = null,
    val recurringUntil: LocalDate? = null,
    val completedAt: Instant? = null,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Denormalized info for display
    val assignedToName: String? = null,
    val createdByName: String? = null
) {
    val isCompleted: Boolean get() = status == TodoStatus.COMPLETED
    
    val isOverdue: Boolean get() {
        if (isCompleted) return false
        val today = Clock.System.now()
            .toLocalDateTime(TimeZone.currentSystemDefault())
            .date
        return dueDate?.let { it < today } ?: false
    }
    
    val isDueToday: Boolean get() {
        val today = Clock.System.now()
            .toLocalDateTime(TimeZone.currentSystemDefault())
            .date
        return dueDate == today
    }
    
    val isRecurring: Boolean get() = recurringPattern != null
}
```

`domain/model/ShoppingList.kt`:
```kotlin
package com.flatmates.app.domain.model

import com.flatmates.app.domain.model.enums.ShoppingListStatus
import kotlinx.datetime.Instant

data class ShoppingList(
    val id: String,
    val householdId: String,
    val name: String,
    val description: String? = null,
    val status: ShoppingListStatus = ShoppingListStatus.ACTIVE,
    val createdBy: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Computed
    val itemCount: Int = 0,
    val purchasedCount: Int = 0
) {
    val isArchived: Boolean get() = status == ShoppingListStatus.ARCHIVED
    val progress: Float get() = if (itemCount > 0) purchasedCount.toFloat() / itemCount else 0f
}
```

`domain/model/ShoppingListItem.kt`:
```kotlin
package com.flatmates.app.domain.model

import kotlinx.datetime.Instant
import java.math.BigDecimal

data class ShoppingListItem(
    val id: String,
    val shoppingListId: String,
    val name: String,
    val quantity: Double = 1.0,
    val unit: String? = null,
    val category: String? = null,
    val isPurchased: Boolean = false,
    val assignedToId: String? = null,
    val price: BigDecimal? = null,
    val notes: String? = null,
    val isRecurring: Boolean = false,
    val recurringPattern: String? = null,
    val position: Int = 0,
    val createdBy: String,
    val createdAt: Instant,
    val updatedAt: Instant,
    // Denormalized
    val assignedToName: String? = null,
    val checkedOffByName: String? = null,
    val checkedOffAt: Instant? = null
) {
    val displayQuantity: String
        get() = if (unit != null) "$quantity $unit" else quantity.toString()
}
```

`domain/model/Expense.kt`:
```kotlin
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
```

`domain/model/ExpenseSplit.kt`:
```kotlin
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
```

#### 4. Create Repository Interfaces

`domain/repository/AuthRepository.kt`:
```kotlin
package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.User
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    val isAuthenticated: Flow<Boolean>
    val currentUser: Flow<User?>
    
    suspend fun signInWithGoogle(idToken: String): Result<User>
    suspend fun signOut(): Result<Unit>
    suspend fun refreshToken(): Result<Unit>
}
```

`domain/repository/UserRepository.kt`:
```kotlin
package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.User
import com.flatmates.app.domain.util.Result

interface UserRepository {
    suspend fun getCurrentUser(): Result<User>
    suspend fun updateUser(user: User): Result<User>
}
```

`domain/repository/HouseholdRepository.kt`:
```kotlin
package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.model.HouseholdMember
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow

interface HouseholdRepository {
    fun getHouseholds(): Flow<List<Household>>
    fun getActiveHousehold(): Flow<Household?>
    fun getHouseholdMembers(householdId: String): Flow<List<HouseholdMember>>
    
    suspend fun createHousehold(name: String): Result<Household>
    suspend fun joinHousehold(inviteToken: String): Result<Household>
    suspend fun setActiveHousehold(householdId: String): Result<Unit>
    suspend fun inviteMember(householdId: String, email: String): Result<Unit>
    suspend fun removeMember(householdId: String, memberId: String): Result<Unit>
    suspend fun leaveHousehold(householdId: String): Result<Unit>
}
```

`domain/repository/TodoRepository.kt`:
```kotlin
package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.LocalDate

interface TodoRepository {
    fun getTodos(householdId: String): Flow<List<Todo>>
    fun getTodosByStatus(householdId: String, status: TodoStatus): Flow<List<Todo>>
    fun getTodosForDate(householdId: String, date: LocalDate): Flow<List<Todo>>
    fun getOverdueTodos(householdId: String): Flow<List<Todo>>
    fun getTodoById(todoId: String): Flow<Todo?>
    
    suspend fun createTodo(todo: Todo): Result<Todo>
    suspend fun updateTodo(todo: Todo): Result<Todo>
    suspend fun completeTodo(todoId: String): Result<Todo>
    suspend fun deleteTodo(todoId: String): Result<Unit>
}
```

`domain/repository/ShoppingRepository.kt`:
```kotlin
package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow

interface ShoppingRepository {
    fun getShoppingLists(householdId: String): Flow<List<ShoppingList>>
    fun getActiveShoppingLists(householdId: String): Flow<List<ShoppingList>>
    fun getShoppingListById(listId: String): Flow<ShoppingList?>
    fun getShoppingItems(listId: String): Flow<List<ShoppingListItem>>
    
    suspend fun createShoppingList(householdId: String, name: String, description: String?): Result<ShoppingList>
    suspend fun archiveShoppingList(listId: String): Result<Unit>
    suspend fun deleteShoppingList(listId: String): Result<Unit>
    
    suspend fun addItem(listId: String, item: ShoppingListItem): Result<ShoppingListItem>
    suspend fun updateItem(item: ShoppingListItem): Result<ShoppingListItem>
    suspend fun toggleItemPurchased(itemId: String): Result<ShoppingListItem>
    suspend fun deleteItem(itemId: String): Result<Unit>
}
```

`domain/repository/ExpenseRepository.kt`:
```kotlin
package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.Expense
import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.datetime.Instant
import java.math.BigDecimal

data class ExpenseSummary(
    val totalExpenses: BigDecimal,
    val totalOwed: BigDecimal,
    val totalOwing: BigDecimal,
    val netBalance: BigDecimal,
    val byCategory: Map<ExpenseCategory, BigDecimal>
)

interface ExpenseRepository {
    fun getExpenses(householdId: String): Flow<List<Expense>>
    fun getExpensesByCategory(householdId: String, category: ExpenseCategory): Flow<List<Expense>>
    fun getExpensesByDateRange(householdId: String, start: Instant, end: Instant): Flow<List<Expense>>
    fun getExpenseById(expenseId: String): Flow<Expense?>
    fun getExpenseSummary(householdId: String): Flow<ExpenseSummary>
    
    suspend fun createExpense(expense: Expense): Result<Expense>
    suspend fun updateExpense(expense: Expense): Result<Expense>
    suspend fun deleteExpense(expenseId: String): Result<Unit>
    suspend fun settleExpense(expenseId: String, splitId: String): Result<Unit>
}
```

#### 5. Create Key Use Cases

`domain/usecase/todo/GetTodayTodosUseCase.kt`:
```kotlin
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
```

`domain/usecase/todo/CreateTodoUseCase.kt`:
```kotlin
package com.flatmates.app.domain.usecase.todo

import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.domain.util.Result
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import java.util.UUID
import javax.inject.Inject

data class CreateTodoParams(
    val householdId: String,
    val title: String,
    val description: String? = null,
    val priority: TodoPriority = TodoPriority.MEDIUM,
    val dueDate: LocalDate? = null,
    val assignedToId: String? = null,
    val createdBy: String
)

class CreateTodoUseCase @Inject constructor(
    private val todoRepository: TodoRepository
) {
    suspend operator fun invoke(params: CreateTodoParams): Result<Todo> {
        val now = Clock.System.now()
        
        val todo = Todo(
            id = UUID.randomUUID().toString(),
            householdId = params.householdId,
            title = params.title.trim(),
            description = params.description?.trim(),
            status = TodoStatus.PENDING,
            priority = params.priority,
            dueDate = params.dueDate,
            assignedToId = params.assignedToId,
            createdBy = params.createdBy,
            createdAt = now,
            updatedAt = now
        )
        
        return todoRepository.createTodo(todo)
    }
}
```

`domain/usecase/todo/CompleteTodoUseCase.kt`:
```kotlin
package com.flatmates.app.domain.usecase.todo

import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.domain.util.Result
import javax.inject.Inject

class CompleteTodoUseCase @Inject constructor(
    private val todoRepository: TodoRepository
) {
    suspend operator fun invoke(todoId: String): Result<Todo> {
        return todoRepository.completeTodo(todoId)
    }
}
```

`domain/usecase/expense/GetExpenseSummaryUseCase.kt`:
```kotlin
package com.flatmates.app.domain.usecase.expense

import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.repository.ExpenseSummary
import com.flatmates.app.domain.repository.HouseholdRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import java.math.BigDecimal
import javax.inject.Inject

class GetExpenseSummaryUseCase @Inject constructor(
    private val expenseRepository: ExpenseRepository,
    private val householdRepository: HouseholdRepository
) {
    @OptIn(ExperimentalCoroutinesApi::class)
    operator fun invoke(): Flow<ExpenseSummary> {
        return householdRepository.getActiveHousehold().flatMapLatest { household ->
            if (household != null) {
                expenseRepository.getExpenseSummary(household.id)
            } else {
                flowOf(ExpenseSummary(
                    totalExpenses = BigDecimal.ZERO,
                    totalOwed = BigDecimal.ZERO,
                    totalOwing = BigDecimal.ZERO,
                    netBalance = BigDecimal.ZERO,
                    byCategory = emptyMap()
                ))
            }
        }
    }
}
```

### Success Criteria

- [ ] All domain models match the backend schema
- [ ] All enums have proper fromString() parsing
- [ ] Repository interfaces are clean abstractions (no implementation details)
- [ ] Use cases follow single responsibility principle
- [ ] All code compiles without errors
- [ ] Proper use of kotlinx-datetime for date/time handling
- [ ] Proper use of BigDecimal for monetary values

### Do NOT

- Implement repository classes (just interfaces)
- Add UI code
- Add database entities (Room)
- Add networking code
- Add Hilt modules (those come in Task 5)

### Verification

```bash
cd /workspaces/flatmates-app/android-app
./gradlew compileDebugKotlin
```

All Kotlin files should compile without errors.
