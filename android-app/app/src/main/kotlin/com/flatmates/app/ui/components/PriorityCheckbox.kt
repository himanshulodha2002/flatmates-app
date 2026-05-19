package com.flatmates.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.ui.theme.Dimensions
import com.flatmates.app.ui.theme.PriorityHigh
import com.flatmates.app.ui.theme.PriorityLow
import com.flatmates.app.ui.theme.PriorityMedium

@Composable
fun PriorityCheckbox(
    checked: Boolean,
    priority: TodoPriority,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier
) {
    val priorityColor = when (priority) {
        TodoPriority.HIGH -> PriorityHigh
        TodoPriority.MEDIUM -> PriorityMedium
        TodoPriority.LOW -> PriorityLow
    }
    
    val backgroundColor by animateColorAsState(
        targetValue = if (checked) priorityColor else Color.Transparent,
        animationSpec = tween(200),
        label = "checkbox_bg"
    )
    
    Box(
        modifier = modifier
            .size(Dimensions.checkboxSize)
            .clip(CircleShape)
            .border(Dimensions.checkboxBorderWidth, priorityColor, CircleShape)
            .background(backgroundColor)
            .clickable(role = Role.Checkbox) { onCheckedChange(!checked) },
        contentAlignment = Alignment.Center
    ) {
        if (checked) {
            Icon(
                imageVector = Icons.Default.Check,
                contentDescription = "Completed",
                tint = Color.White,
                modifier = Modifier.size(16.dp)
            )
        }
    }
}
