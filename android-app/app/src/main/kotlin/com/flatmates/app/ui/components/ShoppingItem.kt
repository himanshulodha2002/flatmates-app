package com.flatmates.app.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import com.flatmates.app.ui.theme.Dimensions

/**
 * Data class for displaying shopping items in the UI.
 */
data class ShoppingItemData(
    val id: String,
    val name: String,
    val quantity: Int? = null,
    val unit: String? = null,
    val isPurchased: Boolean = false,
    val addedByName: String? = null
)

@Composable
fun ShoppingItem(
    item: ShoppingItemData,
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
        verticalAlignment = Alignment.CenterVertically
    ) {
        Checkbox(
            checked = item.isPurchased,
            onCheckedChange = onCheckedChange,
            modifier = Modifier.size(Dimensions.checkboxSize),
            colors = CheckboxDefaults.colors(
                checkedColor = MaterialTheme.colorScheme.primary,
                uncheckedColor = MaterialTheme.colorScheme.onSurfaceVariant
            )
        )
        
        Spacer(modifier = Modifier.width(Dimensions.spacingSm))
        
        Column(modifier = Modifier.weight(1f)) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingXs),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = item.name,
                    style = MaterialTheme.typography.bodyLarge,
                    textDecoration = if (item.isPurchased) TextDecoration.LineThrough else TextDecoration.None,
                    color = if (item.isPurchased) {
                        MaterialTheme.colorScheme.onSurfaceVariant
                    } else {
                        MaterialTheme.colorScheme.onSurface
                    },
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f, fill = false)
                )
                
                // Quantity and unit
                if (item.quantity != null) {
                    Text(
                        text = buildString {
                            append("×${item.quantity}")
                            item.unit?.let { append(" $it") }
                        },
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            
            item.addedByName?.let { name ->
                Text(
                    text = "Added by $name",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}
