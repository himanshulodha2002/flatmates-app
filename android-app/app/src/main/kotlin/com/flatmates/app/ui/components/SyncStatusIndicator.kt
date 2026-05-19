package com.flatmates.app.ui.components

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cloud
import androidx.compose.material.icons.filled.CloudDone
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.flatmates.app.ui.theme.Dimensions
import com.flatmates.app.ui.theme.Error
import com.flatmates.app.ui.theme.Success
import com.flatmates.app.ui.theme.Warning

/**
 * Sync status enum for UI display
 */
enum class SyncStatus {
    SYNCED,
    SYNCING,
    PENDING,
    ERROR,
    OFFLINE
}

@Composable
fun SyncStatusIndicator(
    status: SyncStatus,
    modifier: Modifier = Modifier,
    showLabel: Boolean = true
) {
    val icon: ImageVector
    val label: String
    val color = when (status) {
        SyncStatus.SYNCED -> {
            icon = Icons.Default.CloudDone
            label = "Synced"
            Success
        }
        SyncStatus.SYNCING -> {
            icon = Icons.Default.Sync
            label = "Syncing..."
            MaterialTheme.colorScheme.primary
        }
        SyncStatus.PENDING -> {
            icon = Icons.Default.Cloud
            label = "Pending"
            Warning
        }
        SyncStatus.ERROR -> {
            icon = Icons.Default.CloudOff
            label = "Sync error"
            Error
        }
        SyncStatus.OFFLINE -> {
            icon = Icons.Default.CloudOff
            label = "Offline"
            MaterialTheme.colorScheme.onSurfaceVariant
        }
    }
    
    val backgroundColor by animateColorAsState(
        targetValue = color.copy(alpha = 0.1f),
        label = "sync_status_bg"
    )
    
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(Dimensions.chipRadius))
            .background(backgroundColor)
            .padding(
                horizontal = if (showLabel) Dimensions.chipPaddingHorizontal else 8.dp,
                vertical = Dimensions.chipPaddingVertical
            ),
        horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingXs),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = label,
            modifier = Modifier.size(Dimensions.iconSizeSmall),
            tint = color
        )
        
        if (showLabel) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = color
            )
        }
    }
}
