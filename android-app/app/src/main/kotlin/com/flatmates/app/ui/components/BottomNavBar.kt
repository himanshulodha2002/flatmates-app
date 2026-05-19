package com.flatmates.app.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.FormatListBulleted
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Receipt
import androidx.compose.material.icons.filled.Today
import androidx.compose.material.icons.outlined.FormatListBulleted
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Receipt
import androidx.compose.material.icons.outlined.Today
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

sealed class BottomNavItem(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    data object Today : BottomNavItem(
        route = "today",
        label = "Today",
        selectedIcon = Icons.Filled.Today,
        unselectedIcon = Icons.Outlined.Today
    )
    
    data object Lists : BottomNavItem(
        route = "lists",
        label = "Lists",
        selectedIcon = Icons.Filled.FormatListBulleted,
        unselectedIcon = Icons.Outlined.FormatListBulleted
    )
    
    data object Expenses : BottomNavItem(
        route = "expenses",
        label = "Expenses",
        selectedIcon = Icons.Filled.Receipt,
        unselectedIcon = Icons.Outlined.Receipt
    )
    
    data object Household : BottomNavItem(
        route = "household",
        label = "Home",
        selectedIcon = Icons.Filled.Home,
        unselectedIcon = Icons.Outlined.Home
    )
    
    data object Profile : BottomNavItem(
        route = "profile",
        label = "Profile",
        selectedIcon = Icons.Filled.Person,
        unselectedIcon = Icons.Outlined.Person
    )
}

@Composable
fun BottomNavBar(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        BottomNavItem.Today,
        BottomNavItem.Lists,
        BottomNavItem.Expenses,
        BottomNavItem.Household,
        BottomNavItem.Profile
    )
    
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface,
        tonalElevation = 0.dp
    ) {
        items.forEach { item ->
            val selected = currentRoute == item.route
            
            NavigationBarItem(
                selected = selected,
                onClick = { onNavigate(item.route) },
                icon = {
                    Icon(
                        imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                        contentDescription = item.label
                    )
                },
                label = {
                    Text(
                        text = item.label,
                        style = MaterialTheme.typography.labelSmall
                    )
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    indicatorColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.1f)
                )
            )
        }
    }
}
