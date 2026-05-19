package com.flatmates.app.ui.screens.expenses.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Celebration
import androidx.compose.material.icons.outlined.CleaningServices
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.LocalGroceryStore
import androidx.compose.material.icons.outlined.MoreHoriz
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Restaurant
import androidx.compose.material.icons.outlined.Router
import androidx.compose.material.icons.outlined.DirectionsBus
import androidx.compose.material.icons.outlined.Build
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.flatmates.app.domain.model.enums.ExpenseCategory
import com.flatmates.app.ui.theme.CategoryEntertainment
import com.flatmates.app.ui.theme.CategoryFood
import com.flatmates.app.ui.theme.CategoryGroceries
import com.flatmates.app.ui.theme.CategoryOther
import com.flatmates.app.ui.theme.CategoryRent
import com.flatmates.app.ui.theme.CategoryTransportation
import com.flatmates.app.ui.theme.CategoryUtilities

/**
 * Displays a category-specific icon with background color.
 */
@Composable
fun CategoryIcon(
    category: ExpenseCategory,
    modifier: Modifier = Modifier
) {
    val (icon, backgroundColor) = when (category) {
        ExpenseCategory.GROCERIES -> Icons.Outlined.LocalGroceryStore to CategoryGroceries
        ExpenseCategory.UTILITIES -> Icons.Outlined.Receipt to CategoryUtilities
        ExpenseCategory.RENT -> Icons.Outlined.Home to CategoryRent
        ExpenseCategory.INTERNET -> Icons.Outlined.Router to CategoryUtilities
        ExpenseCategory.CLEANING -> Icons.Outlined.CleaningServices to CategoryOther
        ExpenseCategory.MAINTENANCE -> Icons.Outlined.Build to CategoryOther
        ExpenseCategory.ENTERTAINMENT -> Icons.Outlined.Celebration to CategoryEntertainment
        ExpenseCategory.FOOD -> Icons.Outlined.Restaurant to CategoryFood
        ExpenseCategory.TRANSPORTATION -> Icons.Outlined.DirectionsBus to CategoryTransportation
        ExpenseCategory.OTHER -> Icons.Outlined.MoreHoriz to CategoryOther
    }
    
    Box(
        modifier = modifier
            .size(40.dp)
            .clip(RoundedCornerShape(10.dp))
            .background(backgroundColor.copy(alpha = 0.15f)),
        contentAlignment = Alignment.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = category.displayName,
            tint = backgroundColor,
            modifier = Modifier.size(22.dp)
        )
    }
}
