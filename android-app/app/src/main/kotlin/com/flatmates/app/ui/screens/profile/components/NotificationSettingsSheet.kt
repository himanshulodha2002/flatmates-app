package com.flatmates.app.ui.screens.profile.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.flatmates.app.ui.theme.Dimensions

/**
 * Bottom sheet for notification settings.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationSettingsSheet(
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    
    // In a real app, these would be persisted to DataStore/SharedPreferences
    var taskReminders by remember { mutableStateOf(true) }
    var expenseUpdates by remember { mutableStateOf(true) }
    var shoppingUpdates by remember { mutableStateOf(true) }
    var householdActivity by remember { mutableStateOf(false) }
    
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimensions.spacingLg)
                .padding(bottom = Dimensions.spacingXl)
        ) {
            Text(
                text = "Notification Settings",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingSm))
            
            Text(
                text = "Choose which notifications you want to receive",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingLg))
            
            NotificationToggle(
                title = "Task Reminders",
                description = "Get notified about upcoming and overdue tasks",
                checked = taskReminders,
                onCheckedChange = { taskReminders = it }
            )
            
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            
            NotificationToggle(
                title = "Expense Updates",
                description = "New expenses and payment reminders",
                checked = expenseUpdates,
                onCheckedChange = { expenseUpdates = it }
            )
            
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            
            NotificationToggle(
                title = "Shopping List Updates",
                description = "Items added or completed on shared lists",
                checked = shoppingUpdates,
                onCheckedChange = { shoppingUpdates = it }
            )
            
            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant)
            
            NotificationToggle(
                title = "Household Activity",
                description = "Members joining or leaving",
                checked = householdActivity,
                onCheckedChange = { householdActivity = it }
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
        }
    }
}

@Composable
private fun NotificationToggle(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = Dimensions.spacingMd),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}
