package com.flatmates.app.ui.screens.shopping.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import com.flatmates.app.ui.theme.Dimensions

/**
 * Bottom sheet for creating a new shopping list.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddShoppingListSheet(
    onDismiss: () -> Unit,
    onSave: (name: String, description: String?) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Dimensions.spacingLg)
        ) {
            Text(
                text = "New Shopping List",
                style = MaterialTheme.typography.titleLarge
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingLg))
            
            OutlinedTextField(
                value = name,
                onValueChange = { name = it },
                label = { Text("List name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Description (optional)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingXl))
            
            Button(
                onClick = {
                    if (name.isNotBlank()) {
                        onSave(name, description.takeIf { it.isNotBlank() })
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = name.isNotBlank()
            ) {
                Text("Create List")
            }
            
            Spacer(modifier = Modifier.height(Dimensions.spacingLg))
        }
    }
}
