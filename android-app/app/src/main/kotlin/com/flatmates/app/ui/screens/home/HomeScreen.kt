package com.flatmates.app.ui.screens.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.AddShoppingCart
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.filled.AttachMoney
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.ShoppingCart
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.ui.components.EmptyState
import com.flatmates.app.ui.components.FlatmatesCard
import com.flatmates.app.ui.components.LoadingState
import com.flatmates.app.ui.components.TaskDisplayData
import com.flatmates.app.ui.components.TaskItem
import com.flatmates.app.ui.navigation.Routes
import com.flatmates.app.ui.theme.Dimensions

/**
 * Home screen showing an overview of household activities.
 * Displays overdue tasks, today's tasks, and summary cards.
 */
@Composable
fun HomeScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    if (uiState.isLoading) {
        LoadingState(message = "Loading...")
        return
    }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Dimensions.screenPadding),
        contentPadding = PaddingValues(vertical = Dimensions.screenPadding),
        verticalArrangement = Arrangement.spacedBy(Dimensions.spacingMd)
    ) {
        // Header
        item {
            HomeHeader(
                householdName = uiState.householdName,
                pendingSyncCount = uiState.pendingSyncCount
            )
        }
        
        // Quick Actions
        item {
            QuickActionsRow(
                onTodoClick = { navController.navigate(Routes.Todos.route) },
                onShoppingClick = { navController.navigate(Routes.Shopping.route) },
                onExpenseClick = { navController.navigate(Routes.AddExpense.route) }
            )
        }
        
        // Overdue Tasks Section
        if (uiState.overdueTodos.isNotEmpty()) {
            item {
                SectionHeader(
                    title = "Overdue",
                    icon = Icons.Default.Warning,
                    iconTint = MaterialTheme.colorScheme.error
                )
            }
            items(uiState.overdueTodos.take(3)) { todo ->
                TaskItemWrapper(
                    todo = todo,
                    onToggle = { viewModel.completeTodo(todo.id) },
                    onClick = { navController.navigate(Routes.TodoDetail.createRoute(todo.id)) }
                )
            }
        }
        
        // Today's Tasks Section
        if (uiState.todaysTodos.isNotEmpty()) {
            item {
                SectionHeader(title = "Today")
            }
            items(uiState.todaysTodos) { todo ->
                TaskItemWrapper(
                    todo = todo,
                    onToggle = { viewModel.completeTodo(todo.id) },
                    onClick = { navController.navigate(Routes.TodoDetail.createRoute(todo.id)) }
                )
            }
        }
        
        // Empty state when no tasks
        if (uiState.overdueTodos.isEmpty() && uiState.todaysTodos.isEmpty()) {
            item {
                EmptyState(
                    title = "All caught up!",
                    subtitle = "No tasks for today",
                    modifier = Modifier.height(200.dp)
                )
            }
        }
        
        // Summary Cards
        item {
            Spacer(modifier = Modifier.height(Dimensions.spacingSm))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
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
private fun HomeHeader(
    householdName: String,
    pendingSyncCount: Int
) {
    Column {
        Text(
            text = householdName.ifEmpty { "Welcome" },
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        if (pendingSyncCount > 0) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.padding(top = Dimensions.spacingXs)
            ) {
                Icon(
                    imageVector = Icons.Default.CloudOff,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.size(14.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "$pendingSyncCount changes pending sync",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
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
        horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
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
    icon: ImageVector,
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier.height(56.dp),
        shape = RoundedCornerShape(Dimensions.cardRadius)
    ) {
        Icon(icon, contentDescription = null, modifier = Modifier.size(20.dp))
        Spacer(Modifier.width(8.dp))
        Text(label)
    }
}

@Composable
private fun SectionHeader(
    title: String,
    icon: ImageVector? = null,
    iconTint: Color = MaterialTheme.colorScheme.onSurface
) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = Dimensions.spacingSm)
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
    icon: ImageVector,
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
            modifier = Modifier.padding(Dimensions.cardPadding)
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

/**
 * Wrapper to convert domain Todo to TaskDisplayData for the TaskItem component.
 */
@Composable
private fun TaskItemWrapper(
    todo: Todo,
    onToggle: () -> Unit,
    onClick: () -> Unit
) {
    val taskData = TaskDisplayData(
        id = todo.id,
        title = todo.title,
        isCompleted = todo.isCompleted,
        priority = todo.priority,
        dueDate = todo.dueDate,
        assignedToName = todo.assignedToName,
        isOverdue = todo.isOverdue
    )
    
    FlatmatesCard(onClick = onClick) {
        TaskItem(
            task = taskData,
            onCheckedChange = { onToggle() },
            onClick = onClick
        )
    }
}
