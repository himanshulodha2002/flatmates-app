package com.flatmates.app.ui.screens.expenses

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.domain.model.enums.SplitType
import com.flatmates.app.ui.components.LoadingState
import com.flatmates.app.ui.theme.Dimensions

/**
 * Screen for adding a new expense with split configuration.
 */
@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun AddExpenseScreen(
    navController: NavHostController,
    viewModel: AddExpenseViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val snackbarHostState = remember { SnackbarHostState() }
    
    // Handle save success
    LaunchedEffect(uiState.isSaved) {
        if (uiState.isSaved) {
            navController.popBackStack()
        }
    }
    
    // Show error in snackbar
    LaunchedEffect(uiState.error) {
        uiState.error?.let { error ->
            snackbarHostState.showSnackbar(error)
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add Expense") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { paddingValues ->
        if (uiState.isLoading) {
            LoadingState(message = "Loading...")
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(Dimensions.screenPadding),
                verticalArrangement = Arrangement.spacedBy(Dimensions.spacingMd)
            ) {
                // Amount input
                item {
                    OutlinedTextField(
                        value = uiState.amount,
                        onValueChange = { viewModel.setAmount(it) },
                        label = { Text("Amount") },
                        prefix = { Text("$") },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true
                    )
                }
                
                // Description input
                item {
                    OutlinedTextField(
                        value = uiState.description,
                        onValueChange = { viewModel.setDescription(it) },
                        label = { Text("Description") },
                        placeholder = { Text("What was this expense for?") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
                
                // Category selection
                item {
                    Text(
                        text = "Category",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(Dimensions.spacingXs))
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm),
                        verticalArrangement = Arrangement.spacedBy(Dimensions.spacingXs)
                    ) {
                        ExpenseCategory.entries.forEach { category ->
                            FilterChip(
                                selected = uiState.category == category,
                                onClick = { viewModel.setCategory(category) },
                                label = { Text(category.displayName) }
                            )
                        }
                    }
                }
                
                // Split type selection
                item {
                    Text(
                        text = "Split Type",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(Dimensions.spacingXs))
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
                    ) {
                        SplitType.entries.forEach { splitType ->
                            FilterChip(
                                selected = uiState.splitType == splitType,
                                onClick = { viewModel.setSplitType(splitType) },
                                label = { Text(splitType.displayName) }
                            )
                        }
                    }
                }
                
                // Member selection
                item {
                    Text(
                        text = "Split Between",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Medium
                    )
                    Spacer(modifier = Modifier.height(Dimensions.spacingXs))
                    FlowRow(
                        horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm),
                        verticalArrangement = Arrangement.spacedBy(Dimensions.spacingXs)
                    ) {
                        uiState.householdMembers.forEach { member ->
                            FilterChip(
                                selected = member.id in uiState.selectedMembers,
                                onClick = { viewModel.toggleMember(member.id) },
                                label = { Text(member.displayName) }
                            )
                        }
                    }
                }
                
                // Save button
                item {
                    Spacer(modifier = Modifier.height(Dimensions.spacingMd))
                    Button(
                        onClick = { viewModel.saveExpense() },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !uiState.isSaving && 
                                 uiState.amount.isNotBlank() && 
                                 uiState.description.isNotBlank()
                    ) {
                        Text(if (uiState.isSaving) "Saving..." else "Save Expense")
                    }
                }
            }
        }
    }
}
