package com.flatmates.app.ui.screens.todos.components

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.ui.theme.Dimensions
import com.flatmates.app.ui.theme.PriorityHigh
import com.flatmates.app.ui.theme.PriorityLow
import com.flatmates.app.ui.theme.PriorityMedium
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

/**
 * Bottom sheet for adding a new todo.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTodoSheet(
    onDismiss: () -> Unit,
    onSave: (title: String, description: String?, priority: TodoPriority, dueDate: LocalDate?) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf(TodoPriority.MEDIUM) }
    var selectedDate by remember { mutableStateOf<LocalDate?>(null) }
    
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
                text = "New Task",
                style = MaterialTheme.typography.titleLarge
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingLg))
            
            // Title
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Task name") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            
            // Description
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Description (optional)") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            
            // Priority selector
            Text(
                text = "Priority",
                style = MaterialTheme.typography.labelMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingXs))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
            ) {
                TodoPriority.entries.forEach { p ->
                    FilterChip(
                        selected = priority == p,
                        onClick = { priority = p },
                        label = { Text(p.name) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = when (p) {
                                TodoPriority.HIGH -> PriorityHigh.copy(alpha = 0.1f)
                                TodoPriority.MEDIUM -> PriorityMedium.copy(alpha = 0.1f)
                                TodoPriority.LOW -> PriorityLow.copy(alpha = 0.1f)
                            }
                        )
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            
            // Due date
            OutlinedButton(
                onClick = { 
                    // TODO: Show date picker
                    // For now, set to today's date as placeholder
                    selectedDate = Clock.System.now()
                        .toLocalDateTime(TimeZone.currentSystemDefault()).date
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.CalendarToday, contentDescription = null)
                Spacer(Modifier.width(8.dp))
                Text(selectedDate?.toString() ?: "Set due date")
            }
            
            Spacer(modifier = Modifier.height(Dimensions.spacingXl))
            
            // Save button
            Button(
                onClick = {
                    if (title.isNotBlank()) {
                        onSave(
                            title, 
                            description.takeIf { it.isNotBlank() }, 
                            priority, 
                            selectedDate
                        )
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = title.isNotBlank()
            ) {
                Text("Save")
            }
            
            Spacer(modifier = Modifier.height(Dimensions.spacingLg))
        }
    }
}
