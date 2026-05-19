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
import androidx.compose.material.icons.outlined.ShoppingCart
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
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
import com.flatmates.app.domain.model.ShoppingList
import com.flatmates.app.ui.components.EmptyState
import com.flatmates.app.ui.components.FlatmatesCard
import com.flatmates.app.ui.components.LoadingState
import com.flatmates.app.ui.components.SwipeableItem
import com.flatmates.app.ui.navigation.Routes
import com.flatmates.app.ui.screens.shopping.components.AddShoppingListSheet
import com.flatmates.app.ui.theme.Dimensions

/**
 * Shopping screen showing all shopping lists.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingScreen(
    navController: NavHostController,
    viewModel: ShoppingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { viewModel.showAddListSheet() },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Add shopping list")
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
                text = "Shopping",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(Dimensions.screenPadding)
            )
            
            when {
                uiState.isLoading -> {
                    LoadingState(message = "Loading shopping lists...")
                }
                uiState.shoppingLists.isEmpty() -> {
                    EmptyState(
                        icon = Icons.Outlined.ShoppingCart,
                        title = "No shopping lists",
                        subtitle = "Tap + to create a new list"
                    )
                }
                else -> {
                    ShoppingListsContent(
                        lists = uiState.shoppingLists,
                        onClick = { listId -> 
                            navController.navigate(Routes.ShoppingListDetail.createRoute(listId))
                        },
                        onDelete = { listId -> viewModel.deleteList(listId) }
                    )
                }
            }
        }
    }
    
    // Add list bottom sheet
    if (uiState.showAddListSheet) {
        AddShoppingListSheet(
            onDismiss = { viewModel.hideAddListSheet() },
            onSave = { name, description ->
                viewModel.createList(name, description)
            }
        )
    }
}

@Composable
private fun ShoppingListsContent(
    lists: List<ShoppingList>,
    onClick: (String) -> Unit,
    onDelete: (String) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(horizontal = Dimensions.screenPadding),
        verticalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
    ) {
        items(lists, key = { it.id }) { list ->
            SwipeableItem(
                onDelete = { onDelete(list.id) }
            ) {
                ShoppingListCard(
                    list = list,
                    onClick = { onClick(list.id) }
                )
            }
        }
    }
}

@Composable
private fun ShoppingListCard(
    list: ShoppingList,
    onClick: () -> Unit
) {
    FlatmatesCard(onClick = onClick) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Dimensions.cardPadding)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = list.name,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.SemiBold
                    )
                    
                    list.description?.let { desc ->
                        Text(
                            text = desc,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
                
                // Item count badge
                Text(
                    text = "${list.purchasedCount}/${list.itemCount}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            if (list.itemCount > 0) {
                Spacer(modifier = Modifier.height(Dimensions.spacingSm))
                LinearProgressIndicator(
                    progress = { list.progress },
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.outlineVariant
                )
            }
        }
    }
}
