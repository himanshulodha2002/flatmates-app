package com.flatmates.app.ui.screens.shopping

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.outlined.ShoppingBag
import androidx.compose.material3.Checkbox
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.flatmates.app.domain.model.ShoppingListItem
import com.flatmates.app.ui.components.EmptyState
import com.flatmates.app.ui.components.FlatmatesCard
import com.flatmates.app.ui.components.LoadingState
import com.flatmates.app.ui.components.SwipeableItem
import com.flatmates.app.ui.screens.shopping.components.AddItemSheet
import com.flatmates.app.ui.theme.Dimensions

/**
 * Detail screen for viewing and managing items in a shopping list.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingListDetailScreen(
    listId: String,
    navController: NavHostController,
    viewModel: ShoppingListDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    Text(uiState.shoppingList?.name ?: "Shopping List")
                },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.showAddItemSheet() },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add item")
            }
        }
    ) { paddingValues ->
        when {
            uiState.isLoading -> {
                LoadingState(message = "Loading items...")
            }
            uiState.shoppingList == null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text("Shopping list not found")
                }
            }
            else -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                ) {
                    // Progress header
                    val list = uiState.shoppingList!!
                    if (list.itemCount > 0) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = Dimensions.screenPadding)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "${list.purchasedCount} of ${list.itemCount} items",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = "${(list.progress * 100).toInt()}%",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.primary,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            Spacer(modifier = Modifier.height(Dimensions.spacingXs))
                            LinearProgressIndicator(
                                progress = { list.progress },
                                modifier = Modifier.fillMaxWidth(),
                                color = MaterialTheme.colorScheme.primary,
                                trackColor = MaterialTheme.colorScheme.outlineVariant
                            )
                        }
                        Spacer(modifier = Modifier.height(Dimensions.spacingMd))
                    }
                    
                    // Items list
                    if (uiState.items.isEmpty()) {
                        EmptyState(
                            icon = Icons.Outlined.ShoppingBag,
                            title = "No items yet",
                            subtitle = "Tap + to add items to this list"
                        )
                    } else {
                        LazyColumn(
                            contentPadding = PaddingValues(horizontal = Dimensions.screenPadding),
                            verticalArrangement = Arrangement.spacedBy(Dimensions.spacingXs)
                        ) {
                            items(uiState.items, key = { it.id }) { item ->
                                SwipeableItem(
                                    onDelete = { viewModel.deleteItem(item.id) }
                                ) {
                                    ShoppingItemRow(
                                        item = item,
                                        onToggle = { viewModel.toggleItem(item.id) }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    // Add item bottom sheet
    if (uiState.showAddItemSheet) {
        AddItemSheet(
            onDismiss = { viewModel.hideAddItemSheet() },
            onSave = { name, quantity, unit, category ->
                viewModel.addItem(name, quantity, unit, category)
            }
        )
    }
}

@Composable
private fun ShoppingItemRow(
    item: ShoppingListItem,
    onToggle: () -> Unit
) {
    FlatmatesCard {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(
                    horizontal = Dimensions.listItemPaddingHorizontal,
                    vertical = Dimensions.listItemPaddingVertical
                ),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = item.isPurchased,
                onCheckedChange = { onToggle() }
            )
            
            Spacer(modifier = Modifier.width(Dimensions.spacingSm))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.name,
                    style = MaterialTheme.typography.bodyLarge,
                    textDecoration = if (item.isPurchased) {
                        TextDecoration.LineThrough
                    } else {
                        TextDecoration.None
                    },
                    color = if (item.isPurchased) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    }
                )
                
                if (item.quantity != 1.0 || item.unit != null) {
                    Text(
                        text = item.displayQuantity,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            item.category?.let { category ->
                Text(
                    text = category,
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
