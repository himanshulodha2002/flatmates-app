package com.flatmates.app.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarToday
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.ui.theme.Dimensions
import com.flatmates.app.ui.theme.PriorityHigh
import kotlinx.datetime.LocalDate

/**
 * Simple data class for displaying tasks in the UI.
 * This is a UI model that doesn't depend on the full domain model.
 */
data class TaskDisplayData(
    val id: String,
    val title: String,
    val isCompleted: Boolean,
    val priority: TodoPriority,
    val dueDate: LocalDate? = null,
    val assignedToName: String? = null,
    val isOverdue: Boolean = false
)

@Composable
fun TaskItem(
    task: TaskDisplayData,
    onCheckedChange: (Boolean) -> Unit,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(
                horizontal = Dimensions.listItemPaddingHorizontal,
                vertical = Dimensions.listItemPaddingVertical
            ),
        verticalAlignment = Alignment.Top
    ) {
        PriorityCheckbox(
            checked = task.isCompleted,
            priority = task.priority,
            onCheckedChange = onCheckedChange
        )
        
        Spacer(modifier = Modifier.width(Dimensions.spacingSm))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = task.title,
                style = MaterialTheme.typography.bodyLarge,
                textDecoration = if (task.isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                color = if (task.isCompleted) {
                    MaterialTheme.colorScheme.onSurfaceVariant
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            // Due date row
            if (task.dueDate != null || task.assignedToName != null) {
                Spacer(modifier = Modifier.height(Dimensions.spacingXs))
                
                Row(
                    horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    task.dueDate?.let { date ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Outlined.CalendarToday,
                                contentDescription = null,
                                modifier = Modifier.size(Dimensions.iconSizeSmall),
                                tint = if (task.isOverdue) PriorityHigh else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = formatDueDate(date),
                                style = MaterialTheme.typography.labelMedium,
                                color = if (task.isOverdue) PriorityHigh else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    
                    task.assignedToName?.let { name ->
                        Text(
                            text = "• $name",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }
    }
}

private fun formatDueDate(date: LocalDate): String {
    return "${date.monthNumber}/${date.dayOfMonth}"
}
