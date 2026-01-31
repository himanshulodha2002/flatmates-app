package com.flatmates.app.ui.screens.todos

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.ui.components.EmptyState
import com.flatmates.app.ui.components.FlatmatesCard
import com.flatmates.app.ui.components.LoadingState
import com.flatmates.app.ui.components.SwipeableItem
import com.flatmates.app.ui.components.TaskDisplayData
import com.flatmates.app.ui.components.TaskItem
import com.flatmates.app.ui.navigation.Routes
import com.flatmates.app.ui.screens.todos.components.AddTodoSheet
import com.flatmates.app.ui.theme.Dimensions

/**
 * Todos screen showing all tasks with filtering capabilities.
 */
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
                modifier = Modifier.padding(Dimensions.screenPadding)
            )
            
            // Filter chips
            FilterChipsRow(
                currentFilter = uiState.filter,
                onFilterSelected = { viewModel.setFilter(it) }
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            
            // Content
            when {
                uiState.isLoading -> {
                    LoadingState(message = "Loading tasks...")
                }
                uiState.todos.isEmpty() -> {
                    EmptyState(
                        icon = Icons.Outlined.CheckCircle,
                        title = "No tasks",
                        subtitle = "Tap + to add a new task"
                    )
                }
                else -> {
                    TodoList(
                        todos = uiState.todos,
                        onToggle = { viewModel.completeTodo(it) },
                        onClick = { navController.navigate(Routes.TodoDetail.createRoute(it)) },
                        onDelete = { viewModel.deleteTodo(it) }
                    )
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

@Composable
private fun FilterChipsRow(
    currentFilter: TodoFilter,
    onFilterSelected: (TodoFilter) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = Dimensions.screenPadding),
        horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
    ) {
        items(TodoFilter.entries) { filter ->
            FilterChip(
                selected = currentFilter == filter,
                onClick = { onFilterSelected(filter) },
                label = { 
                    Text(
                        filter.name.lowercase().replaceFirstChar { it.uppercase() }
                    ) 
                }
            )
        }
    }
}

@Composable
private fun TodoList(
    todos: List<Todo>,
    onToggle: (String) -> Unit,
    onClick: (String) -> Unit,
    onDelete: (String) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(horizontal = Dimensions.screenPadding),
        verticalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
    ) {
        items(todos, key = { it.id }) { todo ->
            SwipeableTodoItem(
                todo = todo,
                onToggle = { onToggle(todo.id) },
                onClick = { onClick(todo.id) },
                onDelete = { onDelete(todo.id) }
            )
        }
    }
}

@Composable
private fun SwipeableTodoItem(
    todo: Todo,
    onToggle: () -> Unit,
    onClick: () -> Unit,
    onDelete: () -> Unit
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
    
    SwipeableItem(
        onDelete = onDelete
    ) {
        FlatmatesCard(onClick = onClick) {
            TaskItem(
                task = taskData,
                onCheckedChange = { onToggle() },
                onClick = onClick
            )
        }
    }
}
