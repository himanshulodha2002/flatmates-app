# Task 6: Feature Screens (Jetpack Compose UI Implementation)

## Metadata
- **Can run in parallel with**: No - requires all previous tasks
- **Dependencies**: Tasks 2-5 (Project Setup, Domain Models, UI Theme, Data Layer)
- **Estimated time**: 4-5 hours
- **Priority**: HIGH

---

## Prompt

You are implementing the main feature screens for the Flatmates Android app using Jetpack Compose with a TickTick-inspired minimalist design.

### Repository Information
- **Repository**: `/workspaces/flatmates-app`
- **Android Path**: `/workspaces/flatmates-app/android-app`
- **Theme**: `/workspaces/flatmates-app/android-app/app/src/main/kotlin/com/flatmates/app/ui/theme/`
- **Domain Models**: `/workspaces/flatmates-app/android-app/app/src/main/kotlin/com/flatmates/app/domain/model/`
- **Repositories**: `/workspaces/flatmates-app/android-app/app/src/main/kotlin/com/flatmates/app/data/repository/`

### Package Structure to Create

```
app/src/main/kotlin/com/flatmates/app/
├── ui/
│   ├── navigation/
│   │   ├── AppNavigation.kt
│   │   ├── BottomNavBar.kt
│   │   └── Routes.kt
│   ├── screens/
│   │   ├── home/
│   │   │   ├── HomeScreen.kt
│   │   │   ├── HomeViewModel.kt
│   │   │   └── components/
│   │   │       ├── QuickActionsCard.kt
│   │   │       ├── OverdueSection.kt
│   │   │       └── SummaryCard.kt
│   │   ├── todos/
│   │   │   ├── TodosScreen.kt
│   │   │   ├── TodosViewModel.kt
│   │   │   ├── TodoDetailScreen.kt
│   │   │   └── components/
│   │   │       ├── TodoItem.kt
│   │   │       ├── TodoFilterChips.kt
│   │   │       └── AddTodoSheet.kt
│   │   ├── shopping/
│   │   │   ├── ShoppingScreen.kt
│   │   │   ├── ShoppingViewModel.kt
│   │   │   ├── ShoppingListDetail.kt
│   │   │   └── components/
│   │   │       ├── ShoppingListCard.kt
│   │   │       ├── ShoppingItem.kt
│   │   │       └── AddItemSheet.kt
│   │   ├── expenses/
│   │   │   ├── ExpensesScreen.kt
│   │   │   ├── ExpensesViewModel.kt
│   │   │   ├── AddExpenseScreen.kt
│   │   │   └── components/
│   │   │       ├── ExpenseCard.kt
│   │   │       ├── BalanceSummary.kt
│   │   │       └── CategoryIcon.kt
│   │   └── profile/
│   │       ├── ProfileScreen.kt
│   │       ├── ProfileViewModel.kt
│   │       └── components/
│   │           ├── HouseholdSwitcher.kt
│   │           └── SettingsItem.kt
│   └── MainActivity.kt
```

### TickTick-Inspired Design Reference

```kotlin
// Colors (from Theme)
object FlatmatesColors {
    val Primary = Color(0xFF4772FA)           // TickTick Blue
    val PriorityHigh = Color(0xFFE53935)      // Red
    val PriorityMedium = Color(0xFFFFA726)    // Orange  
    val PriorityLow = Color(0xFF42A5F5)       // Blue
    val Background = Color(0xFFF8F9FA)        // Light gray
    val Surface = Color.White
    val OnSurface = Color(0xFF1A1A1A)
    val OnSurfaceVariant = Color(0xFF666666)
    val Divider = Color(0xFFEEEEEE)
}

// Spacing
object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 16.dp
    val lg = 24.dp
    val xl = 32.dp
}

// Card style
fun Modifier.flatmatesCard() = this
    .fillMaxWidth()
    .clip(RoundedCornerShape(12.dp))
    .background(Color.White)
    .padding(16.dp)
```

### Tasks

#### 1. Create Navigation Structure

`ui/navigation/Routes.kt`:

```kotlin
package com.flatmates.app.ui.navigation

sealed class Routes(val route: String) {
    // Auth
    object Login : Routes("login")
    object Onboarding : Routes("onboarding")
    
    // Main tabs
    object Home : Routes("home")
    object Todos : Routes("todos")
    object Shopping : Routes("shopping")
    object Expenses : Routes("expenses")
    object Profile : Routes("profile")
    
    // Detail screens
    object TodoDetail : Routes("todos/{todoId}") {
        fun createRoute(todoId: String) = "todos/$todoId"
    }
    object ShoppingListDetail : Routes("shopping/{listId}") {
        fun createRoute(listId: String) = "shopping/$listId"
    }
    object AddExpense : Routes("expenses/add")
    object ExpenseDetail : Routes("expenses/{expenseId}") {
        fun createRoute(expenseId: String) = "expenses/$expenseId"
    }
}
```

`ui/navigation/BottomNavBar.kt`:

```kotlin
package com.flatmates.app.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.navigation.NavHostController
import androidx.navigation.compose.currentBackStackEntryAsState

data class BottomNavItem(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
)

@Composable
fun BottomNavBar(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    val items = listOf(
        BottomNavItem(Routes.Home.route, "Home", Icons.Filled.Home, Icons.Outlined.Home),
        BottomNavItem(Routes.Todos.route, "Tasks", Icons.Filled.CheckCircle, Icons.Outlined.CheckCircle),
        BottomNavItem(Routes.Shopping.route, "Shopping", Icons.Filled.ShoppingCart, Icons.Outlined.ShoppingCart),
        BottomNavItem(Routes.Expenses.route, "Expenses", Icons.Filled.Receipt, Icons.Outlined.Receipt),
        BottomNavItem(Routes.Profile.route, "Profile", Icons.Filled.Person, Icons.Outlined.Person)
    )
    
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    
    NavigationBar(
        modifier = modifier,
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp
    ) {
        items.forEach { item ->
            val selected = currentRoute == item.route
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.label
                    )
                },
                label = { Text(item.label, style = MaterialTheme.typography.labelSmall) },
                selected = selected,
                onClick = {
                    if (currentRoute != item.route) {
                        navController.navigate(item.route) {
                            popUpTo(Routes.Home.route) { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    indicatorColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                )
            )
        }
    }
}
```

`ui/navigation/AppNavigation.kt`:

```kotlin
package com.flatmates.app.ui.navigation

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.flatmates.app.ui.screens.home.HomeScreen
import com.flatmates.app.ui.screens.todos.TodosScreen
import com.flatmates.app.ui.screens.todos.TodoDetailScreen
import com.flatmates.app.ui.screens.shopping.ShoppingScreen
import com.flatmates.app.ui.screens.shopping.ShoppingListDetail
import com.flatmates.app.ui.screens.expenses.ExpensesScreen
import com.flatmates.app.ui.screens.expenses.AddExpenseScreen
import com.flatmates.app.ui.screens.profile.ProfileScreen

@Composable
fun AppNavigation(
    isLoggedIn: Boolean,
    modifier: Modifier = Modifier
) {
    val navController = rememberNavController()
    
    if (!isLoggedIn) {
        // Auth flow handled separately
        return
    }
    
    Scaffold(
        bottomBar = { BottomNavBar(navController = navController) },
        modifier = modifier
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = Routes.Home.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            // Main tabs
            composable(Routes.Home.route) {
                HomeScreen(navController = navController)
            }
            composable(Routes.Todos.route) {
                TodosScreen(navController = navController)
            }
            composable(Routes.Shopping.route) {
                ShoppingScreen(navController = navController)
            }
            composable(Routes.Expenses.route) {
                ExpensesScreen(navController = navController)
            }
            composable(Routes.Profile.route) {
                ProfileScreen(navController = navController)
            }
            
            // Detail screens
            composable(Routes.TodoDetail.route) { backStackEntry ->
                val todoId = backStackEntry.arguments?.getString("todoId") ?: return@composable
                TodoDetailScreen(todoId = todoId, navController = navController)
            }
            composable(Routes.ShoppingListDetail.route) { backStackEntry ->
                val listId = backStackEntry.arguments?.getString("listId") ?: return@composable
                ShoppingListDetail(listId = listId, navController = navController)
            }
            composable(Routes.AddExpense.route) {
                AddExpenseScreen(navController = navController)
            }
        }
    }
}
```

#### 2. Create Home Screen

`ui/screens/home/HomeViewModel.kt`:

```kotlin
package com.flatmates.app.ui.screens.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.ShoppingRepository
import com.flatmates.app.domain.repository.TodoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.math.BigDecimal
import javax.inject.Inject

data class HomeUiState(
    val householdName: String = "",
    val overdueTodos: List<Todo> = emptyList(),
    val todaysTodos: List<Todo> = emptyList(),
    val shoppingItemsCount: Int = 0,
    val totalOwed: BigDecimal = BigDecimal.ZERO,
    val totalOwing: BigDecimal = BigDecimal.ZERO,
    val isLoading: Boolean = true,
    val error: String? = null,
    val pendingSyncCount: Int = 0
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val householdRepository: HouseholdRepository,
    private val todoRepository: TodoRepository,
    private val shoppingRepository: ShoppingRepository,
    private val expenseRepository: ExpenseRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
    
    init {
        loadHomeData()
    }
    
    private fun loadHomeData() {
        viewModelScope.launch {
            householdRepository.getActiveHousehold()
                .filterNotNull()
                .collectLatest { household ->
                    _uiState.update { it.copy(householdName = household.name) }
                    
                    // Combine data from multiple sources
                    combine(
                        todoRepository.getOverdueTodos(household.id),
                        todoRepository.getTodosForToday(household.id),
                        shoppingRepository.getTotalUnpurchasedItems(household.id),
                        expenseRepository.getBalanceSummary(household.id)
                    ) { overdue, today, shoppingCount, balance ->
                        _uiState.update {
                            it.copy(
                                overdueTodos = overdue,
                                todaysTodos = today,
                                shoppingItemsCount = shoppingCount,
                                totalOwed = balance.owed,
                                totalOwing = balance.owing,
                                isLoading = false
                            )
                        }
                    }.collect()
                }
        }
    }
    
    fun completeTodo(todoId: String) {
        viewModelScope.launch {
            todoRepository.completeTodo(todoId)
        }
    }
    
    fun refresh() {
        _uiState.update { it.copy(isLoading = true) }
        loadHomeData()
    }
}
```

`ui/screens/home/HomeScreen.kt`:

```kotlin
package com.flatmates.app.ui.screens.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.flatmates.app.ui.components.FlatmatesCard
import com.flatmates.app.ui.components.TaskItem
import com.flatmates.app.ui.navigation.Routes
import com.flatmates.app.ui.theme.Spacing

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Spacing.md),
        contentPadding = PaddingValues(vertical = Spacing.md),
        verticalArrangement = Arrangement.spacedBy(Spacing.md)
    ) {
        // Header
        item {
            Text(
                text = uiState.householdName.ifEmpty { "Welcome" },
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            if (uiState.pendingSyncCount > 0) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(top = Spacing.xs)
                ) {
                    Icon(
                        imageVector = Icons.Default.CloudOff,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(14.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${uiState.pendingSyncCount} changes pending sync",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        
        // Quick Actions
        item {
            QuickActionsRow(
                onTodoClick = { navController.navigate(Routes.Todos.route) },
                onShoppingClick = { navController.navigate(Routes.Shopping.route) },
                onExpenseClick = { navController.navigate(Routes.AddExpense.route) }
            )
        }
        
        // Overdue Tasks
        if (uiState.overdueTodos.isNotEmpty()) {
            item {
                SectionHeader(
                    title = "Overdue",
                    icon = Icons.Default.Warning,
                    iconTint = MaterialTheme.colorScheme.error
                )
            }
            items(uiState.overdueTodos.take(3)) { todo ->
                TaskItem(
                    todo = todo,
                    onToggle = { viewModel.completeTodo(todo.id) },
                    onClick = { navController.navigate(Routes.TodoDetail.createRoute(todo.id)) }
                )
            }
        }
        
        // Today's Tasks
        if (uiState.todaysTodos.isNotEmpty()) {
            item {
                SectionHeader(title = "Today")
            }
            items(uiState.todaysTodos) { todo ->
                TaskItem(
                    todo = todo,
                    onToggle = { viewModel.completeTodo(todo.id) },
                    onClick = { navController.navigate(Routes.TodoDetail.createRoute(todo.id)) }
                )
            }
        }
        
        // Summary Cards
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
            ) {
                SummaryCard(
                    modifier = Modifier.weight(1f),
                    title = "Shopping",
                    value = "${uiState.shoppingItemsCount} items",
                    icon = Icons.Default.ShoppingCart,
                    onClick = { navController.navigate(Routes.Shopping.route) }
                )
                SummaryCard(
                    modifier = Modifier.weight(1f),
                    title = "You Owe",
                    value = "$${uiState.totalOwed}",
                    icon = Icons.Default.ArrowUpward,
                    iconTint = MaterialTheme.colorScheme.error,
                    onClick = { navController.navigate(Routes.Expenses.route) }
                )
            }
        }
    }
}

@Composable
private fun QuickActionsRow(
    onTodoClick: () -> Unit,
    onShoppingClick: () -> Unit,
    onExpenseClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
    ) {
        QuickActionButton(
            modifier = Modifier.weight(1f),
            icon = Icons.Default.Add,
            label = "Task",
            onClick = onTodoClick
        )
        QuickActionButton(
            modifier = Modifier.weight(1f),
            icon = Icons.Default.AddShoppingCart,
            label = "Item",
            onClick = onShoppingClick
        )
        QuickActionButton(
            modifier = Modifier.weight(1f),
            icon = Icons.Default.AttachMoney,
            label = "Expense",
            onClick = onExpenseClick
        )
    }
}

@Composable
private fun QuickActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(56.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(8.dp))
        Text(label)
    }
}

@Composable
private fun SectionHeader(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector? = null,
    iconTint: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = Spacing.sm)
    ) {
        if (icon != null) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconTint,
                modifier = Modifier.size(20.dp)
            )
            Spacer(Modifier.width(8.dp))
        }
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}

@Composable
private fun SummaryCard(
    title: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    iconTint: Color = MaterialTheme.colorScheme.primary
) {
    FlatmatesCard(
        onClick = onClick,
        modifier = modifier
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(Spacing.md)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconTint,
                modifier = Modifier.size(24.dp)
            )
            Spacer(Modifier.width(12.dp))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = value,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}
```

#### 3. Create Todos Screen

`ui/screens/todos/TodosViewModel.kt`:

```kotlin
package com.flatmates.app.ui.screens.todos

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.domain.model.enums.TodoStatus
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.TodoRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime
import java.util.UUID
import javax.inject.Inject

enum class TodoFilter {
    ALL, PENDING, COMPLETED, TODAY, OVERDUE
}

data class TodosUiState(
    val todos: List<Todo> = emptyList(),
    val filter: TodoFilter = TodoFilter.ALL,
    val isLoading: Boolean = true,
    val error: String? = null,
    val showAddSheet: Boolean = false
)

@HiltViewModel
class TodosViewModel @Inject constructor(
    private val householdRepository: HouseholdRepository,
    private val todoRepository: TodoRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(TodosUiState())
    val uiState: StateFlow<TodosUiState> = _uiState.asStateFlow()
    
    private var currentHouseholdId: String? = null
    
    init {
        loadTodos()
    }
    
    private fun loadTodos() {
        viewModelScope.launch {
            householdRepository.getActiveHousehold()
                .filterNotNull()
                .collectLatest { household ->
                    currentHouseholdId = household.id
                    todoRepository.getTodos(household.id)
                        .collect { todos ->
                            _uiState.update {
                                it.copy(
                                    todos = filterTodos(todos, it.filter),
                                    isLoading = false
                                )
                            }
                        }
                }
        }
    }
    
    fun setFilter(filter: TodoFilter) {
        viewModelScope.launch {
            val householdId = currentHouseholdId ?: return@launch
            todoRepository.getTodos(householdId).first().let { todos ->
                _uiState.update {
                    it.copy(
                        filter = filter,
                        todos = filterTodos(todos, filter)
                    )
                }
            }
        }
    }
    
    private fun filterTodos(todos: List<Todo>, filter: TodoFilter): List<Todo> {
        val today = Clock.System.now()
            .toLocalDateTime(TimeZone.currentSystemDefault())
            .date
        return when (filter) {
            TodoFilter.ALL -> todos
            TodoFilter.PENDING -> todos.filter { it.status == TodoStatus.PENDING }
            TodoFilter.COMPLETED -> todos.filter { it.status == TodoStatus.COMPLETED }
            TodoFilter.TODAY -> todos.filter { it.dueDate == today }
            TodoFilter.OVERDUE -> todos.filter { 
                it.dueDate != null && it.dueDate < today && it.status != TodoStatus.COMPLETED 
            }
        }
    }
    
    fun completeTodo(todoId: String) {
        viewModelScope.launch {
            todoRepository.completeTodo(todoId)
        }
    }
    
    fun createTodo(
        title: String,
        description: String?,
        priority: TodoPriority,
        dueDate: LocalDate?
    ) {
        viewModelScope.launch {
            val householdId = currentHouseholdId ?: return@launch
            val now = Clock.System.now()
            val todo = Todo(
                id = UUID.randomUUID().toString(),
                householdId = householdId,
                title = title,
                description = description,
                status = TodoStatus.PENDING,
                priority = priority,
                dueDate = dueDate,
                assignedToId = null,
                createdBy = "", // Will be set from user context
                createdAt = now,
                updatedAt = now
            )
            todoRepository.createTodo(todo)
            _uiState.update { it.copy(showAddSheet = false) }
        }
    }
    
    fun deleteTodo(todoId: String) {
        viewModelScope.launch {
            todoRepository.deleteTodo(todoId)
        }
    }
    
    fun showAddSheet() {
        _uiState.update { it.copy(showAddSheet = true) }
    }
    
    fun hideAddSheet() {
        _uiState.update { it.copy(showAddSheet = false) }
    }
}
```

`ui/screens/todos/TodosScreen.kt`:

```kotlin
package com.flatmates.app.ui.screens.todos

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.flatmates.app.ui.components.SwipeableTaskItem
import com.flatmates.app.ui.navigation.Routes
import com.flatmates.app.ui.screens.todos.components.AddTodoSheet
import com.flatmates.app.ui.theme.Spacing

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodosScreen(
    navController: NavHostController,
    viewModel: TodosViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.showAddSheet() },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add task")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Header
            Text(
                text = "Tasks",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(Spacing.md)
            )
            
            // Filter chips
            LazyRow(
                contentPadding = PaddingValues(horizontal = Spacing.md),
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
            ) {
                items(TodoFilter.values()) { filter ->
                    FilterChip(
                        selected = uiState.filter == filter,
                        onClick = { viewModel.setFilter(filter) },
                        label = { Text(filter.name.lowercase().replaceFirstChar { it.uppercase() }) }
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(Spacing.md))
            
            // Todo list
            if (uiState.isLoading) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (uiState.todos.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "No tasks",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "Tap + to add a new task",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(horizontal = Spacing.md),
                    verticalArrangement = Arrangement.spacedBy(Spacing.sm)
                ) {
                    items(uiState.todos, key = { it.id }) { todo ->
                        SwipeableTaskItem(
                            todo = todo,
                            onToggle = { viewModel.completeTodo(todo.id) },
                            onClick = { navController.navigate(Routes.TodoDetail.createRoute(todo.id)) },
                            onDelete = { viewModel.deleteTodo(todo.id) }
                        )
                    }
                }
            }
        }
    }
    
    // Add todo bottom sheet
    if (uiState.showAddSheet) {
        AddTodoSheet(
            onDismiss = { viewModel.hideAddSheet() },
            onSave = { title, desc, priority, dueDate ->
                viewModel.createTodo(title, desc, priority, dueDate)
            }
        )
    }
}
```

`ui/screens/todos/components/AddTodoSheet.kt`:

```kotlin
package com.flatmates.app.ui.screens.todos.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.ui.theme.Spacing
import kotlinx.datetime.LocalDate

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTodoSheet(
    onDismiss: () -> Unit,
    onSave: (title: String, description: String?, priority: TodoPriority, dueDate: LocalDate?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf(TodoPriority.MEDIUM) }
    var showDatePicker by remember { mutableStateOf(false) }
    var selectedDate by remember { mutableStateOf<LocalDate?>(null) }
    
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Spacing.lg)
        ) {
            Text(
                text = "New Task",
                style = MaterialTheme.typography.titleLarge
            )
            
            Spacer(modifier = Modifier.height(Spacing.lg))
            
            // Title
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Task name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(Spacing.md))
            
            // Description
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Description (optional)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2
            )
            
            Spacer(modifier = Modifier.height(Spacing.md))
            
            // Priority selector
            Text(
                text = "Priority",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Spacing.sm)
            ) {
                TodoPriority.values().forEach { p ->
                    FilterChip(
                        selected = priority == p,
                        onClick = { priority = p },
                        label = { Text(p.name) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = when (p) {
                                TodoPriority.HIGH -> MaterialTheme.colorScheme.error.copy(alpha = 0.1f)
                                TodoPriority.MEDIUM -> MaterialTheme.colorScheme.tertiary.copy(alpha = 0.1f)
                                TodoPriority.LOW -> MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                            }
                        )
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(Spacing.md))
            
            // Due date
            OutlinedButton(
                onClick = { showDatePicker = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.CalendarToday, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(selectedDate?.toString() ?: "Set due date")
            }
            
            Spacer(modifier = Modifier.height(Spacing.xl))
            
            // Save button
            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        onSave(title, description.takeIf { it.isNotBlank() }, priority, selectedDate)
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = title.isNotBlank()
            ) {
                Text("Save")
            }
            
            Spacer(modifier = Modifier.height(Spacing.lg))
        }
    }
    
    // Date picker dialog would go here
}
```

#### 4. Create Shopping Screen

Similar pattern to Todos - implement:
- `ShoppingScreen.kt` - List of shopping lists
- `ShoppingViewModel.kt` - State management
- `ShoppingListDetail.kt` - Items in a list with add/toggle functionality
- `components/ShoppingItem.kt` - Individual item with checkbox
- `components/AddItemSheet.kt` - Add new item bottom sheet

Key features:
- Swipe to delete items
- Quick add with just a name
- Category grouping (optional)
- Progress indicator (X/Y items purchased)

#### 5. Create Expenses Screen

Implement:
- `ExpensesScreen.kt` - List of expenses with balance summary
- `ExpensesViewModel.kt` - State management
- `AddExpenseScreen.kt` - Full screen for adding expense with split configuration
- `components/ExpenseCard.kt` - Expense display with category icon
- `components/BalanceSummary.kt` - You owe / Owed to you cards
- `components/CategoryIcon.kt` - Category-specific icons

Key features:
- Balance summary at top (who owes whom)
- Category-based icons and filtering
- Split configuration (equal, exact amounts, percentages)
- Quick expense (just amount and description)

#### 6. Create Profile Screen

Implement:
- `ProfileScreen.kt` - User info, household switcher, settings
- `ProfileViewModel.kt` - State management
- `components/HouseholdSwitcher.kt` - Switch between households
- `components/SettingsItem.kt` - Reusable settings row

Key features:
- Current user avatar and name
- Current household with switch option
- Sync status indicator
- Sign out option
- About/version info

### Success Criteria

- [ ] All 5 main screens (Home, Todos, Shopping, Expenses, Profile) are implemented
- [ ] Navigation between screens works correctly
- [ ] Bottom navigation highlights current tab
- [ ] All screens use the TickTick-inspired theme
- [ ] ViewModels use Hilt injection
- [ ] Data flows from repositories through ViewModels to UI
- [ ] Empty states are handled
- [ ] Loading states are shown appropriately
- [ ] Swipe-to-delete works on todos and shopping items
- [ ] Add item sheets work for todos and shopping items
- [ ] App compiles without errors

### Do NOT

- Implement actual authentication (that's Task 7)
- Implement network sync (that's Task 7)
- Add complex animations
- Implement dark mode (can be done in polish phase)

### Verification

```bash
cd /workspaces/flatmates-app/android-app

# Build to verify Compose compiles
./gradlew compileDebugKotlin

# Run preview tests
./gradlew test
```
