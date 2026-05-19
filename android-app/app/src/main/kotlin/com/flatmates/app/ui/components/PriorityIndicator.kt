package com.flatmates.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.flatmates.app.domain.model.enums.TodoPriority
import com.flatmates.app.ui.theme.PriorityHigh
import com.flatmates.app.ui.theme.PriorityLow
import com.flatmates.app.ui.theme.PriorityMedium
import com.flatmates.app.ui.theme.PriorityNone

@Composable
fun PriorityIndicator(
    priority: TodoPriority?,
    modifier: Modifier = Modifier,
    size: Dp = 8.dp
) {
    val color = when (priority) {
        TodoPriority.HIGH -> PriorityHigh
        TodoPriority.MEDIUM -> PriorityMedium
        TodoPriority.LOW -> PriorityLow
        null -> PriorityNone
    }
    
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(color)
    )
}
