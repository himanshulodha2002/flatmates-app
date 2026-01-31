# Task 4: UI Theme & Design System

## Metadata
- **Can run in parallel with**: Task 3 (Domain Models), Task 5 (Data Layer)
- **Dependencies**: Task 2 (Android Project Setup) must be complete
- **Estimated time**: 2-3 hours
- **Priority**: HIGH (all screens depend on this)

---

## Prompt

You are implementing a TickTick-inspired minimalist design system for the Flatmates Android app using Jetpack Compose and Material 3.

### Repository Information
- **Repository**: `/workspaces/flatmates-app`
- **Android Path**: `/workspaces/flatmates-app/android-app`

### Design Reference: TickTick-Style Minimalism

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Primary | `#4772FA` | `#7C9FFF` |
| Background | `#F8F9FA` | `#121212` |
| Surface | `#FFFFFF` | `#1E1E1E` |
| Text Primary | `#1A1A1A` | `#E6E6E6` |
| Text Secondary | `#757575` | `#B3B3B3` |
| Divider | `#E0E0E0` | `#3D3D3D` |

| Priority | Color |
|----------|-------|
| High | `#F44336` |
| Medium | `#FF9800` |
| Low | `#2196F3` |
| None | `#9E9E9E` |

| Dimension | Value |
|-----------|-------|
| Screen Padding | `16.dp` |
| Card Radius | `12.dp` |
| Chip Radius | `16.dp` |
| Item Spacing | `8.dp` |
| Section Spacing | `24.dp` |
| FAB Size | `56.dp` |
| Icon Size (nav) | `24.dp` |
| Icon Size (inline) | `18.dp` |
| Min Touch Target | `48.dp` |

### Package Structure to Create

```
app/src/main/kotlin/com/flatmates/app/ui/
├── theme/
│   ├── Color.kt
│   ├── Type.kt
│   ├── Dimensions.kt
│   ├── Theme.kt
│   └── Shape.kt
└── components/
    ├── FlatmatesCard.kt
    ├── PriorityCheckbox.kt
    ├── PriorityIndicator.kt
    ├── TaskItem.kt
    ├── ShoppingItem.kt
    ├── ExpenseItem.kt
    ├── SwipeableItem.kt
    ├── EmptyState.kt
    ├── LoadingState.kt
    ├── ErrorState.kt
    ├── SyncStatusIndicator.kt
    ├── FlatmatesFAB.kt
    ├── BottomNavBar.kt
    ├── TopAppBar.kt
    └── SearchBar.kt
```

### Tasks

#### 1. Create Color Definitions

`ui/theme/Color.kt`:

```kotlin
package com.flatmates.app.ui.theme

import androidx.compose.ui.graphics.Color

// Primary Brand Colors
val Primary = Color(0xFF4772FA)
val PrimaryLight = Color(0xFF7C9FFF)
val PrimaryDark = Color(0xFF1A4AD4)
val PrimaryContainer = Color(0xFFE3EAFF)
val OnPrimaryContainer = Color(0xFF001A6E)

// Neutral Colors - Light
val BackgroundLight = Color(0xFFF8F9FA)
val SurfaceLight = Color(0xFFFFFFFF)
val SurfaceVariantLight = Color(0xFFF5F5F5)
val OnBackgroundLight = Color(0xFF1A1A1A)
val OnSurfaceLight = Color(0xFF1A1A1A)
val OnSurfaceVariantLight = Color(0xFF757575)
val OutlineLight = Color(0xFFE0E0E0)
val OutlineVariantLight = Color(0xFFF0F0F0)

// Neutral Colors - Dark
val BackgroundDark = Color(0xFF121212)
val SurfaceDark = Color(0xFF1E1E1E)
val SurfaceVariantDark = Color(0xFF2D2D2D)
val OnBackgroundDark = Color(0xFFE6E6E6)
val OnSurfaceDark = Color(0xFFE6E6E6)
val OnSurfaceVariantDark = Color(0xFFB3B3B3)
val OutlineDark = Color(0xFF3D3D3D)
val OutlineVariantDark = Color(0xFF2D2D2D)

// Priority Colors
val PriorityHigh = Color(0xFFF44336)
val PriorityMedium = Color(0xFFFF9800)
val PriorityLow = Color(0xFF2196F3)
val PriorityNone = Color(0xFF9E9E9E)

// Status Colors
val Success = Color(0xFF4CAF50)
val Warning = Color(0xFFFFC107)
val Error = Color(0xFFF44336)
val Info = Color(0xFF2196F3)

// Category Colors (for expenses)
val CategoryGroceries = Color(0xFF66BB6A)
val CategoryUtilities = Color(0xFF42A5F5)
val CategoryRent = Color(0xFFAB47BC)
val CategoryEntertainment = Color(0xFFFF7043)
val CategoryFood = Color(0xFFFFCA28)
val CategoryTransportation = Color(0xFF26C6DA)
val CategoryOther = Color(0xFF78909C)
```

#### 2. Create Typography

`ui/theme/Type.kt`:

```kotlin
package com.flatmates.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val Typography = Typography(
    // Large titles (screen titles)
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 28.sp,
        lineHeight = 36.sp,
        letterSpacing = 0.sp
    ),
    
    // Medium headlines
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 24.sp,
        lineHeight = 32.sp,
        letterSpacing = 0.sp
    ),
    
    // Section titles
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 20.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.sp
    ),
    
    // Card titles, list item titles
    titleMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp
    ),
    
    // Small titles
    titleSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    ),
    
    // Main body text
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    ),
    
    // Secondary body text
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp
    ),
    
    // Small body text
    bodySmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.4.sp
    ),
    
    // Labels, tags, chips
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    ),
    
    // Small labels (dates, metadata)
    labelMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
        letterSpacing = 0.5.sp
    ),
    
    // Tiny labels
    labelSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 10.sp,
        lineHeight = 14.sp,
        letterSpacing = 0.5.sp
    )
)
```

#### 3. Create Dimensions

`ui/theme/Dimensions.kt`:

```kotlin
package com.flatmates.app.ui.theme

import androidx.compose.ui.unit.dp

object Dimensions {
    // Screen
    val screenPadding = 16.dp
    val screenPaddingSmall = 12.dp
    
    // Cards
    val cardRadius = 12.dp
    val cardElevation = 1.dp
    val cardPadding = 16.dp
    
    // Chips
    val chipRadius = 16.dp
    val chipPaddingHorizontal = 12.dp
    val chipPaddingVertical = 6.dp
    
    // Spacing
    val spacingXs = 4.dp
    val spacingSm = 8.dp
    val spacingMd = 16.dp
    val spacingLg = 24.dp
    val spacingXl = 32.dp
    
    // List items
    val listItemPaddingVertical = 12.dp
    val listItemPaddingHorizontal = 16.dp
    val listItemMinHeight = 56.dp
    
    // Dividers
    val dividerThickness = 1.dp
    
    // Icons
    val iconSizeSmall = 18.dp
    val iconSizeMedium = 24.dp
    val iconSizeLarge = 32.dp
    
    // Touch targets
    val minTouchTarget = 48.dp
    
    // FAB
    val fabSize = 56.dp
    val fabIconSize = 24.dp
    
    // Bottom nav
    val bottomNavHeight = 80.dp
    
    // Checkbox
    val checkboxSize = 24.dp
    val checkboxBorderWidth = 2.dp
    
    // Avatar
    val avatarSizeSmall = 32.dp
    val avatarSizeMedium = 40.dp
    val avatarSizeLarge = 56.dp
    
    // Progress
    val progressIndicatorSize = 48.dp
}
```

#### 4. Create Shapes

`ui/theme/Shape.kt`:

```kotlin
package com.flatmates.app.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val Shapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(24.dp)
)
```

#### 5. Create Theme

`ui/theme/Theme.kt`:

```kotlin
package com.flatmates.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = Primary,
    onPrimary = SurfaceLight,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = OnPrimaryContainer,
    
    secondary = Primary,
    onSecondary = SurfaceLight,
    
    background = BackgroundLight,
    onBackground = OnBackgroundLight,
    
    surface = SurfaceLight,
    onSurface = OnSurfaceLight,
    surfaceVariant = SurfaceVariantLight,
    onSurfaceVariant = OnSurfaceVariantLight,
    
    error = Error,
    onError = SurfaceLight,
    
    outline = OutlineLight,
    outlineVariant = OutlineVariantLight
)

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryLight,
    onPrimary = SurfaceDark,
    primaryContainer = PrimaryDark,
    onPrimaryContainer = PrimaryContainer,
    
    secondary = PrimaryLight,
    onSecondary = SurfaceDark,
    
    background = BackgroundDark,
    onBackground = OnBackgroundDark,
    
    surface = SurfaceDark,
    onSurface = OnSurfaceDark,
    surfaceVariant = SurfaceVariantDark,
    onSurfaceVariant = OnSurfaceVariantDark,
    
    error = Error,
    onError = SurfaceDark,
    
    outline = OutlineDark,
    outlineVariant = OutlineVariantDark
)

@Composable
fun FlatmatesTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }
    
    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = Shapes,
        content = content
    )
}
```

#### 6. Create Core Components

`ui/components/FlatmatesCard.kt`:

```kotlin
package com.flatmates.app.ui.components

import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.flatmates.app.ui.theme.Dimensions

@Composable
fun FlatmatesCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    if (onClick != null) {
        Card(
            onClick = onClick,
            modifier = modifier,
            shape = MaterialTheme.shapes.medium,
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            ),
            elevation = CardDefaults.cardElevation(
                defaultElevation = Dimensions.cardElevation
            ),
            content = content
        )
    } else {
        Card(
            modifier = modifier,
            shape = MaterialTheme.shapes.medium,
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.surface
            ),
            elevation = CardDefaults.cardElevation(
                defaultElevation = Dimensions.cardElevation
            ),
            content = content
        )
    }
}
```

`ui/components/PriorityCheckbox.kt`:

```kotlin
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
import com.flatmates.app.ui.theme.*

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
```

`ui/components/TaskItem.kt`:

```kotlin
package com.flatmates.app.ui.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CalendarToday
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.flatmates.app.domain.model.Todo
import com.flatmates.app.ui.theme.*
import kotlinx.datetime.LocalDate
import kotlinx.datetime.format

@Composable
fun TaskItem(
    todo: Todo,
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
            checked = todo.isCompleted,
            priority = todo.priority,
            onCheckedChange = onCheckedChange
        )
        
        Spacer(modifier = Modifier.width(Dimensions.spacingSm))
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = todo.title,
                style = MaterialTheme.typography.bodyLarge,
                textDecoration = if (todo.isCompleted) TextDecoration.LineThrough else TextDecoration.None,
                color = if (todo.isCompleted) {
                    MaterialTheme.colorScheme.onSurfaceVariant
                } else {
                    MaterialTheme.colorScheme.onSurface
                },
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            
            // Due date row
            if (todo.dueDate != null || todo.assignedToName != null) {
                Spacer(modifier = Modifier.height(Dimensions.spacingXs))
                
                Row(
                    horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    todo.dueDate?.let { date ->
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                imageVector = Icons.Outlined.CalendarToday,
                                contentDescription = null,
                                modifier = Modifier.size(Dimensions.iconSizeSmall),
                                tint = if (todo.isOverdue) PriorityHigh else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.width(4.dp))
                            Text(
                                text = formatDueDate(date),
                                style = MaterialTheme.typography.labelMedium,
                                color = if (todo.isOverdue) PriorityHigh else MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    
                    todo.assignedToName?.let { name ->
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
    // Simplified - you may want to use a proper formatter
    return "${date.monthNumber}/${date.dayOfMonth}"
}
```

`ui/components/EmptyState.kt`:

```kotlin
package com.flatmates.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.CheckCircle
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.flatmates.app.ui.theme.Dimensions

@Composable
fun EmptyState(
    icon: ImageVector = Icons.Outlined.CheckCircle,
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
    action: @Composable (() -> Unit)? = null
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(Dimensions.spacingXl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = MaterialTheme.colorScheme.outlineVariant
        )
        
        Spacer(modifier = Modifier.height(Dimensions.spacingLg))
        
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        subtitle?.let {
            Spacer(modifier = Modifier.height(Dimensions.spacingSm))
            Text(
                text = it,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
        
        action?.let {
            Spacer(modifier = Modifier.height(Dimensions.spacingLg))
            it()
        }
    }
}
```

`ui/components/LoadingState.kt`:

```kotlin
package com.flatmates.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.flatmates.app.ui.theme.Dimensions

@Composable
fun LoadingState(
    message: String? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        CircularProgressIndicator(
            modifier = Modifier.size(Dimensions.progressIndicatorSize),
            color = MaterialTheme.colorScheme.primary
        )
        
        message?.let {
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            Text(
                text = it,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
```

`ui/components/ErrorState.kt`:

```kotlin
package com.flatmates.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ErrorOutline
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.flatmates.app.ui.theme.Dimensions
import com.flatmates.app.ui.theme.Error

@Composable
fun ErrorState(
    message: String,
    onRetry: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(Dimensions.spacingXl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Outlined.ErrorOutline,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = Error
        )
        
        Spacer(modifier = Modifier.height(Dimensions.spacingMd))
        
        Text(
            text = "Something went wrong",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onSurface
        )
        
        Spacer(modifier = Modifier.height(Dimensions.spacingSm))
        
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center
        )
        
        onRetry?.let {
            Spacer(modifier = Modifier.height(Dimensions.spacingLg))
            
            Button(
                onClick = it,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary
                )
            ) {
                Text("Try Again")
            }
        }
    }
}
```

`ui/components/BottomNavBar.kt`:

```kotlin
package com.flatmates.app.ui.components

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
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
```

`ui/components/FlatmatesFAB.kt`:

```kotlin
package com.flatmates.app.ui.components

import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector

@Composable
fun FlatmatesFAB(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector = Icons.Default.Add,
    contentDescription: String = "Add"
) {
    FloatingActionButton(
        onClick = onClick,
        modifier = modifier,
        shape = CircleShape,
        containerColor = MaterialTheme.colorScheme.primary,
        contentColor = MaterialTheme.colorScheme.onPrimary
    ) {
        Icon(
            imageVector = icon,
            contentDescription = contentDescription
        )
    }
}
```

#### 7. Update MainActivity to Use Theme

Update `MainActivity.kt`:

```kotlin
package com.flatmates.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.flatmates.app.ui.components.BottomNavBar
import com.flatmates.app.ui.components.FlatmatesFAB
import com.flatmates.app.ui.theme.FlatmatesTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        
        setContent {
            FlatmatesTheme {
                MainScreen()
            }
        }
    }
}

@Composable
fun MainScreen() {
    var currentRoute by remember { mutableStateOf("today") }
    
    Scaffold(
        bottomBar = {
            BottomNavBar(
                currentRoute = currentRoute,
                onNavigate = { currentRoute = it }
            )
        },
        floatingActionButton = {
            FlatmatesFAB(onClick = { /* TODO */ })
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "Current: $currentRoute",
                style = MaterialTheme.typography.headlineMedium
            )
        }
    }
}
```

### Success Criteria

- [ ] Theme switches correctly between light and dark mode
- [ ] All colors match the TickTick-inspired palette
- [ ] Typography is clean and readable
- [ ] Components render correctly in both themes
- [ ] Bottom navigation works and highlights current tab
- [ ] FAB is properly styled
- [ ] Empty, Loading, and Error states look clean
- [ ] Compose previews work

### Do NOT

- Implement actual screens (just placeholder)
- Add business logic
- Connect to data layer
- Add navigation (beyond bottom nav demo)

### Verification

```bash
cd /workspaces/flatmates-app/android-app
./gradlew compileDebugKotlin
./gradlew assembleDebug
```

Launch the app and verify:
1. Bottom nav appears with 5 tabs
2. FAB appears in bottom-right
3. Theme follows system dark/light mode
4. Tapping tabs changes the displayed route text
