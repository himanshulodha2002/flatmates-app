package com.flatmates.app.ui.screens.expenses

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
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowDownward
import androidx.compose.material.icons.filled.ArrowUpward
import androidx.compose.material.icons.outlined.Receipt
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.flatmates.app.domain.model.Expense
import com.flatmates.app.ui.components.EmptyState
import com.flatmates.app.ui.components.FlatmatesCard
import com.flatmates.app.ui.components.LoadingState
import com.flatmates.app.ui.components.SwipeableItem
import com.flatmates.app.ui.navigation.Routes
import com.flatmates.app.ui.screens.expenses.components.CategoryIcon
import com.flatmates.app.ui.theme.Dimensions
import com.flatmates.app.ui.theme.Success
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

/**
 * Expenses screen showing all household expenses with balance summary.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpensesScreen(
    navController: NavHostController,
    viewModel: ExpensesViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate(Routes.AddExpense.route) },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add expense")
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
                text = "Expenses",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(Dimensions.screenPadding)
            )
            
            // Balance summary cards
            BalanceSummaryRow(
                totalOwed = uiState.totalOwed,
                totalOwing = uiState.totalOwing
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            
            // Category filter chips
            CategoryFilterChips(
                currentFilter = uiState.filter,
                onFilterSelected = { viewModel.setFilter(it) }
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            
            // Content
            when {
                uiState.isLoading -> {
                    LoadingState(message = "Loading expenses...")
                }
                uiState.expenses.isEmpty() -> {
                    EmptyState(
                        icon = Icons.Outlined.Receipt,
                        title = "No expenses",
                        subtitle = "Tap + to add a new expense"
                    )
                }
                else -> {
                    ExpensesList(
                        expenses = uiState.expenses,
                        onDelete = { viewModel.deleteExpense(it) }
                    )
                }
            }
        }
    }
}

@Composable
private fun BalanceSummaryRow(
    totalOwed: java.math.BigDecimal,
    totalOwing: java.math.BigDecimal
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = Dimensions.screenPadding),
        horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
    ) {
        BalanceCard(
            modifier = Modifier.weight(1f),
            title = "You Owe",
            amount = totalOwed,
            icon = Icons.Default.ArrowUpward,
            iconTint = MaterialTheme.colorScheme.error
        )
        BalanceCard(
            modifier = Modifier.weight(1f),
            title = "Owed to You",
            amount = totalOwing,
            icon = Icons.Default.ArrowDownward,
            iconTint = Success
        )
    }
}

@Composable
private fun BalanceCard(
    title: String,
    amount: java.math.BigDecimal,
    icon: ImageVector,
    iconTint: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier
) {
    FlatmatesCard(modifier = modifier) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Dimensions.cardPadding),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconTint,
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.width(Dimensions.spacingSm))
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = "$${amount.setScale(2)}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
private fun CategoryFilterChips(
    currentFilter: ExpenseFilter,
    onFilterSelected: (ExpenseFilter) -> Unit
) {
    LazyRow(
        contentPadding = PaddingValues(horizontal = Dimensions.screenPadding),
        horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
    ) {
        items(ExpenseFilter.entries) { filter ->
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
private fun ExpensesList(
    expenses: List<Expense>,
    onDelete: (String) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(horizontal = Dimensions.screenPadding),
        verticalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
    ) {
        items(expenses, key = { it.id }) { expense ->
            SwipeableItem(
                onDelete = { onDelete(expense.id) }
            ) {
                ExpenseCard(expense = expense)
            }
        }
    }
}

@Composable
private fun ExpenseCard(expense: Expense) {
    FlatmatesCard {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Dimensions.cardPadding),
            verticalAlignment = Alignment.CenterVertically
        ) {
            CategoryIcon(category = expense.category)
            
            Spacer(modifier = Modifier.width(Dimensions.spacingMd))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = expense.description,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium
                )
                Row {
                    Text(
                        text = expense.category.displayName,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.width(Dimensions.spacingSm))
                    Text(
                        text = expense.date.toLocalDateTime(TimeZone.currentSystemDefault())
                            .date.toString(),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
                expense.creatorName?.let { name ->
                    Text(
                        text = "Paid by $name",
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            Text(
                text = expense.formattedAmount,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
        }
    }
}
