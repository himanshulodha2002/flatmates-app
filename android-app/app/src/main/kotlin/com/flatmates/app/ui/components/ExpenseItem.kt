package com.flatmates.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextOverflow
import com.flatmates.app.ui.theme.CategoryFood
import com.flatmates.app.ui.theme.CategoryGroceries
import com.flatmates.app.ui.theme.CategoryOther
import com.flatmates.app.ui.theme.CategoryRent
import com.flatmates.app.ui.theme.CategoryUtilities
import com.flatmates.app.ui.theme.Dimensions
import kotlinx.datetime.LocalDate
import java.text.NumberFormat
import java.util.Currency
import java.util.Locale

/**
 * Expense category enum for UI display
 */
enum class ExpenseCategory {
    GROCERIES,
    UTILITIES,
    RENT,
    FOOD,
    OTHER
}

/**
 * Data class for displaying expense items in the UI.
 */
data class ExpenseItemData(
    val id: String,
    val description: String,
    val amount: Double,
    val category: ExpenseCategory = ExpenseCategory.OTHER,
    val paidByName: String,
    val date: LocalDate,
    val isSettled: Boolean = false
)

@Composable
fun ExpenseItem(
    expense: ExpenseItemData,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    currencyCode: String = "USD"
) {
    val categoryColor = when (expense.category) {
        ExpenseCategory.GROCERIES -> CategoryGroceries
        ExpenseCategory.UTILITIES -> CategoryUtilities
        ExpenseCategory.RENT -> CategoryRent
        ExpenseCategory.FOOD -> CategoryFood
        ExpenseCategory.OTHER -> CategoryOther
    }
    
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
        // Category icon
        Box(
            modifier = Modifier
                .size(Dimensions.avatarSizeMedium)
                .clip(CircleShape)
                .background(categoryColor.copy(alpha = 0.15f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Outlined.Receipt,
                contentDescription = null,
                modifier = Modifier.size(Dimensions.iconSizeMedium),
                tint = categoryColor
            )
        }
        
        Spacer(modifier = Modifier.width(Dimensions.spacingSm))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = expense.description,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurface,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            
            Row(
                horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingXs),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Paid by ${expense.paidByName}",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Text(
                    text = "•",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Text(
                    text = formatDate(expense.date),
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        
        // Amount
        Text(
            text = formatCurrency(expense.amount, currencyCode),
            style = MaterialTheme.typography.titleMedium,
            color = if (expense.isSettled) {
                MaterialTheme.colorScheme.onSurfaceVariant
            } else {
                MaterialTheme.colorScheme.onSurface
            }
        )
    }
}

private fun formatCurrency(amount: Double, currencyCode: String): String {
    return try {
        val format = NumberFormat.getCurrencyInstance(Locale.getDefault())
        format.currency = Currency.getInstance(currencyCode)
        format.format(amount)
    } catch (e: Exception) {
        "$${String.format(Locale.getDefault(), "%.2f", amount)}"
    }
}

private fun formatDate(date: LocalDate): String {
    return "${date.monthNumber}/${date.dayOfMonth}"
}
