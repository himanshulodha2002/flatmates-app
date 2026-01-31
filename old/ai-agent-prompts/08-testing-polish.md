# Task 8: Testing & Polish (Quality Assurance & Final Touches)

## Metadata
- **Can run in parallel with**: No - this is the final task
- **Dependencies**: ALL previous tasks (1-7) must be complete
- **Estimated time**: 3-4 hours
- **Priority**: HIGH (ensures production readiness)

---

## Prompt

You are implementing tests, error handling improvements, and final polish for the Flatmates Android app. This includes unit tests, integration tests, edge case handling, and UI/UX improvements.

### Repository Information
- **Repository**: `/workspaces/flatmates-app`
- **Android Path**: `/workspaces/flatmates-app/android-app`

### Package Structure to Create/Modify

```
app/src/
├── main/kotlin/com/flatmates/app/
│   └── ui/
│       ├── components/
│       │   └── ErrorView.kt
│       └── MainActivity.kt (add error handling)
├── test/kotlin/com/flatmates/app/
│   ├── data/
│   │   ├── repository/
│   │   │   ├── TodoRepositoryTest.kt
│   │   │   ├── ShoppingRepositoryTest.kt
│   │   │   └── ExpenseRepositoryTest.kt
│   │   └── sync/
│   │       └── SyncWorkerTest.kt
│   ├── domain/
│   │   └── usecase/
│   │       └── TodoUseCasesTest.kt
│   └── ui/
│       └── viewmodel/
│           ├── HomeViewModelTest.kt
│           ├── TodosViewModelTest.kt
│           └── ShoppingViewModelTest.kt
└── androidTest/kotlin/com/flatmates/app/
    ├── data/local/
    │   ├── TodoDaoTest.kt
    │   ├── ShoppingDaoTest.kt
    │   └── ExpenseDaoTest.kt
    └── ui/
        └── screen/
            ├── HomeScreenTest.kt
            └── TodosScreenTest.kt
```

### Tasks

#### 1. Add Test Dependencies

Update `app/build.gradle.kts`:

```kotlin
dependencies {
    // Existing dependencies...
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
    testImplementation("io.mockk:mockk:1.13.8")
    testImplementation("app.cash.turbine:turbine:1.0.0")
    testImplementation("com.google.truth:truth:1.1.5")
    
    // Android Testing
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
    androidTestImplementation("androidx.compose.ui:ui-test-junit4")
    androidTestImplementation("androidx.room:room-testing:2.6.1")
    androidTestImplementation("io.mockk:mockk-android:1.13.8")
    androidTestImplementation("com.google.truth:truth:1.1.5")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

#### 2. Create Repository Tests

`test/kotlin/com/flatmates/app/data/repository/TodoRepositoryTest.kt`:

```kotlin
package com.flatmates.app.data.repository

import app.cash.turbine.test
import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.dao.TodoDao
import com.flatmates.app.data.local.entity.TodoEntity
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.util.Result
import com.google.common.truth.Truth.assertThat
import io.mockk.*
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.serialization.json.Json
import org.junit.Before
import org.junit.Test

class TodoRepositoryTest {
    
    private lateinit var todoDao: TodoDao
    private lateinit var syncQueueDao: SyncQueueDao
    private lateinit var json: Json
    private lateinit var repository: TodoRepositoryImpl
    
    private val testHouseholdId = "household-123"
    private val now = Clock.System.now()
    
    @Before
    fun setup() {
        todoDao = mockk(relaxed = true)
        syncQueueDao = mockk(relaxed = true)
        json = Json { ignoreUnknownKeys = true }
        repository = TodoRepositoryImpl(todoDao, syncQueueDao, json)
    }
    
    @Test
    fun `getTodos returns mapped domain models`() = runTest {
        // Given
        val entities = listOf(
            createTodoEntity("1", "Task 1"),
            createTodoEntity("2", "Task 2")
        )
        coEvery { todoDao.getTodosByHousehold(testHouseholdId) } returns flowOf(entities)
        
        // When/Then
        repository.getTodos(testHouseholdId).test {
            val todos = awaitItem()
            assertThat(todos).hasSize(2)
            assertThat(todos[0].title).isEqualTo("Task 1")
            assertThat(todos[1].title).isEqualTo("Task 2")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `createTodo inserts entity and adds to sync queue`() = runTest {
        // Given
        val todo = createTodo("new-id", "New Task")
        
        // When
        val result = repository.createTodo(todo)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { todoDao.insert(any()) }
        coVerify { syncQueueDao.enqueue(match { it.operation == "CREATE" }) }
    }
    
    @Test
    fun `completeTodo updates status and syncs`() = runTest {
        // Given
        val todoId = "todo-123"
        val entity = createTodoEntity(todoId, "Task")
        coEvery { todoDao.getTodoById(todoId) } returns flowOf(entity)
        
        // When
        val result = repository.completeTodo(todoId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { 
            todoDao.update(match { 
                it.status == "COMPLETED" && it.completedAt != null 
            }) 
        }
    }
    
    @Test
    fun `deleteTodo marks as pending delete`() = runTest {
        // Given
        val todoId = "todo-123"
        
        // When
        val result = repository.deleteTodo(todoId)
        
        // Then
        assertThat(result).isInstanceOf(Result.Success::class.java)
        coVerify { todoDao.updateSyncStatus(todoId, "PENDING_DELETE") }
        coVerify { syncQueueDao.enqueue(match { it.operation == "DELETE" }) }
    }
    
    @Test
    fun `createTodo handles database error gracefully`() = runTest {
        // Given
        val todo = createTodo("new-id", "New Task")
        coEvery { todoDao.insert(any()) } throws RuntimeException("DB Error")
        
        // When
        val result = repository.createTodo(todo)
        
        // Then
        assertThat(result).isInstanceOf(Result.Error::class.java)
        assertThat((result as Result.Error).message).contains("Failed to create")
    }
    
    // Helper functions
    private fun createTodoEntity(id: String, title: String) = TodoEntity(
        id = id,
        householdId = testHouseholdId,
        title = title,
        status = "PENDING",
        priority = "MEDIUM",
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
    
    private fun createTodo(id: String, title: String) = com.flatmates.app.domain.model.Todo(
        id = id,
        householdId = testHouseholdId,
        title = title,
        status = TodoStatus.PENDING,
        priority = TodoPriority.MEDIUM,
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
}
```

#### 3. Create ViewModel Tests

`test/kotlin/com/flatmates/app/ui/viewmodel/TodosViewModelTest.kt`:

```kotlin
package com.flatmates.app.ui.viewmodel

import app.cash.turbine.test
import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.ui.screens.todos.TodoFilter
import com.flatmates.app.ui.screens.todos.TodosViewModel
import com.google.common.truth.Truth.assertThat
import io.mockk.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.*
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import org.junit.After
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class TodosViewModelTest {
    
    private lateinit var householdRepository: HouseholdRepository
    private lateinit var todoRepository: TodoRepository
    private lateinit var viewModel: TodosViewModel
    
    private val testDispatcher = StandardTestDispatcher()
    private val testHouseholdId = "household-123"
    private val now = Clock.System.now()
    
    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        householdRepository = mockk()
        todoRepository = mockk()
        
        // Default mocks
        coEvery { householdRepository.getActiveHousehold() } returns flowOf(
            Household(id = testHouseholdId, name = "Test House", createdBy = "user-1", createdAt = now)
        )
        coEvery { todoRepository.getTodos(testHouseholdId) } returns flowOf(emptyList())
    }
    
    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }
    
    @Test
    fun `initial state shows loading then todos`() = runTest {
        // Given
        val todos = listOf(createTodo("1", "Task 1"))
        coEvery { todoRepository.getTodos(testHouseholdId) } returns flowOf(todos)
        
        // When
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state.isLoading).isFalse()
            assertThat(state.todos).hasSize(1)
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `setFilter filters todos correctly`() = runTest {
        // Given
        val todos = listOf(
            createTodo("1", "Pending Task", status = TodoStatus.PENDING),
            createTodo("2", "Completed Task", status = TodoStatus.COMPLETED)
        )
        coEvery { todoRepository.getTodos(testHouseholdId) } returns flowOf(todos)
        
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // When
        viewModel.setFilter(TodoFilter.COMPLETED)
        advanceUntilIdle()
        
        // Then
        viewModel.uiState.test {
            val state = awaitItem()
            assertThat(state.filter).isEqualTo(TodoFilter.COMPLETED)
            assertThat(state.todos).hasSize(1)
            assertThat(state.todos[0].title).isEqualTo("Completed Task")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun `completeTodo calls repository`() = runTest {
        // Given
        coEvery { todoRepository.completeTodo(any()) } returns com.flatmates.app.domain.util.Result.Success(
            createTodo("1", "Task", status = TodoStatus.COMPLETED)
        )
        
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // When
        viewModel.completeTodo("todo-1")
        advanceUntilIdle()
        
        // Then
        coVerify { todoRepository.completeTodo("todo-1") }
    }
    
    @Test
    fun `showAddSheet updates state`() = runTest {
        // Given
        viewModel = TodosViewModel(householdRepository, todoRepository)
        advanceUntilIdle()
        
        // When
        viewModel.showAddSheet()
        
        // Then
        viewModel.uiState.test {
            assertThat(awaitItem().showAddSheet).isTrue()
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    private fun createTodo(
        id: String,
        title: String,
        status: TodoStatus = TodoStatus.PENDING
    ) = Todo(
        id = id,
        householdId = testHouseholdId,
        title = title,
        status = status,
        priority = TodoPriority.MEDIUM,
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
}
```

#### 4. Create DAO Instrumented Tests

`androidTest/kotlin/com/flatmates/app/data/local/TodoDaoTest.kt`:

```kotlin
package com.flatmates.app.data.local

import android.content.Context
import androidx.room.Room
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import app.cash.turbine.test
import com.flatmates.app.data.local.dao.HouseholdDao
import com.flatmates.app.data.local.dao.TodoDao
import com.flatmates.app.data.local.database.FlatmatesDatabase
import com.flatmates.app.data.local.entity.HouseholdEntity
import com.flatmates.app.data.local.entity.TodoEntity
import com.google.common.truth.Truth.assertThat
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TodoDaoTest {
    
    private lateinit var database: FlatmatesDatabase
    private lateinit var todoDao: TodoDao
    private lateinit var householdDao: HouseholdDao
    
    private val testHouseholdId = "test-household"
    private val now = Clock.System.now()
    
    @Before
    fun setup() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        database = Room.inMemoryDatabaseBuilder(context, FlatmatesDatabase::class.java)
            .allowMainThreadQueries()
            .build()
        todoDao = database.todoDao()
        householdDao = database.householdDao()
        
        // Insert required household first (foreign key)
        runTest {
            householdDao.insertHousehold(
                HouseholdEntity(
                    id = testHouseholdId,
                    name = "Test Household",
                    createdBy = "user-1",
                    createdAt = now
                )
            )
        }
    }
    
    @After
    fun tearDown() {
        database.close()
    }
    
    @Test
    fun insertAndRetrieveTodo() = runTest {
        // Given
        val todo = createTodoEntity("1", "Test Task")
        
        // When
        todoDao.insert(todo)
        
        // Then
        todoDao.getTodosByHousehold(testHouseholdId).test {
            val todos = awaitItem()
            assertThat(todos).hasSize(1)
            assertThat(todos[0].title).isEqualTo("Test Task")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun filterByStatus() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Pending", status = "PENDING"))
        todoDao.insert(createTodoEntity("2", "Completed", status = "COMPLETED"))
        
        // When/Then
        todoDao.getTodosByStatus(testHouseholdId, "PENDING").test {
            val todos = awaitItem()
            assertThat(todos).hasSize(1)
            assertThat(todos[0].title).isEqualTo("Pending")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun pendingDeleteTodosAreFiltered() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Visible"))
        todoDao.insert(createTodoEntity("2", "Deleted", syncStatus = "PENDING_DELETE"))
        
        // When/Then
        todoDao.getTodosByHousehold(testHouseholdId).test {
            val todos = awaitItem()
            assertThat(todos).hasSize(1)
            assertThat(todos[0].title).isEqualTo("Visible")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun updateSyncStatus() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Task", syncStatus = "PENDING_CREATE"))
        
        // When
        todoDao.updateSyncStatus("1", "SYNCED")
        
        // Then
        todoDao.getTodoById("1").test {
            val todo = awaitItem()
            assertThat(todo?.syncStatus).isEqualTo("SYNCED")
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    @Test
    fun getPendingSyncTodosReturnsUnsynced() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Synced", syncStatus = "SYNCED"))
        todoDao.insert(createTodoEntity("2", "Pending", syncStatus = "PENDING_CREATE"))
        todoDao.insert(createTodoEntity("3", "Updating", syncStatus = "PENDING_UPDATE"))
        
        // When
        val pending = todoDao.getPendingSyncTodos()
        
        // Then
        assertThat(pending).hasSize(2)
        assertThat(pending.map { it.id }).containsExactly("2", "3")
    }
    
    @Test
    fun deleteTodo() = runTest {
        // Given
        todoDao.insert(createTodoEntity("1", "Task"))
        
        // When
        todoDao.delete("1")
        
        // Then
        todoDao.getTodosByHousehold(testHouseholdId).test {
            assertThat(awaitItem()).isEmpty()
            cancelAndIgnoreRemainingEvents()
        }
    }
    
    private fun createTodoEntity(
        id: String,
        title: String,
        status: String = "PENDING",
        syncStatus: String = "SYNCED"
    ) = TodoEntity(
        id = id,
        householdId = testHouseholdId,
        title = title,
        status = status,
        priority = "MEDIUM",
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now,
        syncStatus = syncStatus
    )
}
```

#### 5. Create Compose UI Tests

`androidTest/kotlin/com/flatmates/app/ui/screen/TodosScreenTest.kt`:

```kotlin
package com.flatmates.app.ui.screen

import androidx.compose.ui.test.*
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.navigation.compose.rememberNavController
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.ui.screens.todos.TodoFilter
import com.flatmates.app.ui.screens.todos.TodosScreen
import com.flatmates.app.ui.screens.todos.TodosUiState
import com.flatmates.app.ui.screens.todos.TodosViewModel
import com.flatmates.app.ui.theme.FlatmatesTheme
import io.mockk.every
import io.mockk.mockk
import io.mockk.verify
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.datetime.Clock
import org.junit.Rule
import org.junit.Test

class TodosScreenTest {
    
    @get:Rule
    val composeTestRule = createComposeRule()
    
    private val now = Clock.System.now()
    
    @Test
    fun displaysTodosWhenLoaded() {
        // Given
        val todos = listOf(
            createTodo("1", "Buy groceries"),
            createTodo("2", "Clean kitchen")
        )
        val viewModel = createMockViewModel(todos = todos)
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        
        // Then
        composeTestRule.onNodeWithText("Buy groceries").assertIsDisplayed()
        composeTestRule.onNodeWithText("Clean kitchen").assertIsDisplayed()
    }
    
    @Test
    fun showsEmptyStateWhenNoTodos() {
        // Given
        val viewModel = createMockViewModel(todos = emptyList())
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        
        // Then
        composeTestRule.onNodeWithText("No tasks").assertIsDisplayed()
        composeTestRule.onNodeWithText("Tap + to add a new task").assertIsDisplayed()
    }
    
    @Test
    fun showsLoadingIndicator() {
        // Given
        val viewModel = createMockViewModel(isLoading = true)
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        
        // Then
        composeTestRule.onNode(hasProgressBarRangeInfo(ProgressBarRangeInfo.Indeterminate))
            .assertIsDisplayed()
    }
    
    @Test
    fun filterChipsAreDisplayed() {
        // Given
        val viewModel = createMockViewModel()
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        
        // Then
        composeTestRule.onNodeWithText("All").assertIsDisplayed()
        composeTestRule.onNodeWithText("Pending").assertIsDisplayed()
        composeTestRule.onNodeWithText("Completed").assertIsDisplayed()
    }
    
    @Test
    fun fabOpensAddSheet() {
        // Given
        val viewModel = createMockViewModel()
        
        // When
        composeTestRule.setContent {
            FlatmatesTheme {
                TodosScreen(
                    navController = rememberNavController(),
                    viewModel = viewModel
                )
            }
        }
        composeTestRule.onNodeWithContentDescription("Add task").performClick()
        
        // Then
        verify { viewModel.showAddSheet() }
    }
    
    private fun createMockViewModel(
        todos: List<Todo> = emptyList(),
        isLoading: Boolean = false,
        filter: TodoFilter = TodoFilter.ALL
    ): TodosViewModel {
        val viewModel = mockk<TodosViewModel>(relaxed = true)
        val uiState = MutableStateFlow(
            TodosUiState(
                todos = todos,
                filter = filter,
                isLoading = isLoading
            )
        )
        every { viewModel.uiState } returns uiState
        return viewModel
    }
    
    private fun createTodo(id: String, title: String) = Todo(
        id = id,
        householdId = "household-1",
        title = title,
        status = TodoStatus.PENDING,
        priority = TodoPriority.MEDIUM,
        createdBy = "user-1",
        createdAt = now,
        updatedAt = now
    )
}
```

#### 6. Create Error Handling Components

`ui/components/ErrorView.kt`:

```kotlin
package com.flatmates.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.flatmates.app.ui.theme.Spacing

@Composable
fun ErrorView(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(Spacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier.size(64.dp)
        )
        
        Spacer(modifier = Modifier.height(Spacing.md))
        
        Text(
            text = "Something went wrong",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = Spacing.sm)
        )
        
        if (onRetry != null) {
            Spacer(modifier = Modifier.height(Spacing.lg))
            
            OutlinedButton(onClick = onRetry) {
                Icon(
                    imageVector = Icons.Default.Refresh,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text("Try Again")
            }
        }
    }
}

@Composable
fun OfflineBanner(
    modifier: Modifier = Modifier
) {
    Surface(
        color = MaterialTheme.colorScheme.errorContainer,
        modifier = modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(horizontal = Spacing.md, vertical = Spacing.sm),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.CloudOff,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onErrorContainer,
                modifier = Modifier.size(16.dp)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "You're offline. Changes will sync when connected.",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onErrorContainer
            )
        }
    }
}

@Composable
fun SyncStatusIndicator(
    pendingCount: Int,
    isSyncing: Boolean,
    modifier: Modifier = Modifier
) {
    if (pendingCount == 0 && !isSyncing) return
    
    Row(
        modifier = modifier.padding(horizontal = Spacing.md, vertical = Spacing.xs),
        verticalAlignment = Alignment.CenterVertically
    ) {
        if (isSyncing) {
            CircularProgressIndicator(
                modifier = Modifier.size(12.dp),
                strokeWidth = 2.dp
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "Syncing...",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        } else if (pendingCount > 0) {
            Icon(
                imageVector = Icons.Default.CloudOff,
                contentDescription = null,
                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.size(12.dp)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "$pendingCount pending",
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
```

#### 7. Add Network Connectivity Observer

`data/network/NetworkObserver.kt`:

```kotlin
package com.flatmates.app.data.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.distinctUntilChanged
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NetworkObserver @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    private val connectivityManager = 
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
    
    val isConnected: Flow<Boolean> = callbackFlow {
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) {
                trySend(true)
            }
            
            override fun onLost(network: Network) {
                trySend(false)
            }
            
            override fun onCapabilitiesChanged(
                network: Network,
                capabilities: NetworkCapabilities
            ) {
                val connected = capabilities.hasCapability(
                    NetworkCapabilities.NET_CAPABILITY_INTERNET
                )
                trySend(connected)
            }
        }
        
        val request = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()
        
        connectivityManager.registerNetworkCallback(request, callback)
        
        // Send initial state
        val currentlyConnected = connectivityManager.activeNetwork?.let { network ->
            connectivityManager.getNetworkCapabilities(network)
                ?.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
        } ?: false
        trySend(currentlyConnected)
        
        awaitClose {
            connectivityManager.unregisterNetworkCallback(callback)
        }
    }.distinctUntilChanged()
}
```

#### 8. Add Haptic Feedback & Micro-interactions

`ui/util/HapticFeedback.kt`:

```kotlin
package com.flatmates.app.ui.util

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.HapticFeedbackConstants
import android.view.View
import androidx.compose.runtime.Composable
import androidx.compose.ui.hapticfeedback.HapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.platform.LocalView

object HapticFeedbackUtils {
    
    fun performClick(view: View) {
        view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
    }
    
    fun performSuccess(view: View) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            view.performHapticFeedback(HapticFeedbackConstants.CONFIRM)
        } else {
            view.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
        }
    }
    
    fun performError(view: View) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            view.performHapticFeedback(HapticFeedbackConstants.REJECT)
        } else {
            view.performHapticFeedback(HapticFeedbackConstants.LONG_PRESS)
        }
    }
}

@Composable
fun rememberHapticFeedback(): HapticFeedback {
    return LocalHapticFeedback.current
}
```

#### 9. Add ProGuard Rules for Release

Create `app/proguard-rules.pro`:

```proguard
# Keep Kotlin Serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt

-keepclassmembers class kotlinx.serialization.json.** {
    *** Companion;
}
-keepclasseswithmembers class kotlinx.serialization.json.** {
    kotlinx.serialization.KSerializer serializer(...);
}

-keep,includedescriptorclasses class com.flatmates.app.**$$serializer { *; }
-keepclassmembers class com.flatmates.app.** {
    *** Companion;
}
-keepclasseswithmembers class com.flatmates.app.** {
    kotlinx.serialization.KSerializer serializer(...);
}

# Keep Room entities
-keep class com.flatmates.app.data.local.entity.** { *; }

# Keep DTOs
-keep class com.flatmates.app.data.remote.dto.** { *; }

# Retrofit
-keepattributes Signature
-keepattributes Exceptions
-keep class retrofit2.** { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# Hilt
-keep class dagger.hilt.** { *; }
-keep class javax.inject.** { *; }

# Google Sign-In
-keep class com.google.android.gms.** { *; }
```

### Success Criteria

- [ ] All unit tests pass (`./gradlew test`)
- [ ] All instrumented tests pass (`./gradlew connectedAndroidTest`)
- [ ] No crashes on orientation change
- [ ] App works completely offline
- [ ] Proper error messages shown to user
- [ ] Loading states are smooth
- [ ] Empty states are informative
- [ ] Haptic feedback on todo completion
- [ ] Offline banner shows when disconnected
- [ ] Pending sync count shows accurately
- [ ] Release build works with ProGuard
- [ ] No memory leaks in repeated navigation

### Verification Commands

```bash
cd /workspaces/flatmates-app/android-app

# Run all unit tests
./gradlew test

# Run instrumented tests (requires emulator)
./gradlew connectedDebugAndroidTest

# Generate test coverage report
./gradlew jacocoTestReport

# Build release APK
./gradlew assembleRelease

# Lint checks
./gradlew lint

# Check for potential issues
./gradlew detekt
```

### Final Checklist

- [ ] App installs successfully on clean device
- [ ] Google Sign-In flow works end-to-end
- [ ] Creating household works
- [ ] Joining household with invite code works
- [ ] Todos: Create, complete, delete, filter
- [ ] Shopping: Create list, add items, check off items
- [ ] Expenses: Add expense, view balance summary
- [ ] Profile: Switch households, sign out
- [ ] Sync works when coming online
- [ ] App doesn't crash on any screen
- [ ] Back button behavior is correct
- [ ] Deep links work (if implemented)
- [ ] App handles being killed and restored
- [ ] Notifications work (if implemented)
