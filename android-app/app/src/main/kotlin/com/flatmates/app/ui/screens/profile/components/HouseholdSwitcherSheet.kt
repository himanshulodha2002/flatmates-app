package com.flatmates.app.ui.screens.profile.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Link
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.flatmates.app.domain.model.Household
import com.flatmates.app.ui.theme.Dimensions

/**
 * Bottom sheet for switching between households.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HouseholdSwitcherSheet(
    households: List<Household>,
    currentHouseholdId: String?,
    onSelect: (String) -> Unit,
    onCreateNew: () -> Unit,
    onJoinHousehold: () -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = Dimensions.spacingMd)
        ) {
            Text(
                text = "Switch Household",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(horizontal = Dimensions.spacingLg)
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            
            // Existing households
            households.forEach { household ->
                val isSelected = household.id == currentHouseholdId
                
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelect(household.id) }
                        .padding(
                            horizontal = Dimensions.spacingLg,
                            vertical = Dimensions.spacingMd
                        ),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Home,
                        contentDescription = null,
                        tint = if (isSelected) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant
                        }
                    )
                    Spacer(modifier = Modifier.width(Dimensions.spacingMd))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = household.name,
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = if (isSelected) FontWeight.Medium else FontWeight.Normal,
                            color = if (isSelected) {
                                MaterialTheme.colorScheme.primary
                            } else {
                                MaterialTheme.colorScheme.onSurface
                            }
                        )
                        Text(
                            text = "${household.memberCount} members",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    if (isSelected) {
                        Icon(
                            imageVector = Icons.Default.Check,
                            contentDescription = "Selected",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    }
                }
                
                HorizontalDivider(
                    modifier = Modifier.padding(horizontal = Dimensions.spacingLg),
                    color = MaterialTheme.colorScheme.outlineVariant
                )
            }
            
            // Create new household option
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onCreateNew() }
                    .padding(
                        horizontal = Dimensions.spacingLg,
                        vertical = Dimensions.spacingMd
                    ),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Add,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
                Spacer(modifier = Modifier.width(Dimensions.spacingMd))
                Text(
                    text = "Create New Household",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.primary
                )
            }
            
            HorizontalDivider(
                modifier = Modifier.padding(horizontal = Dimensions.spacingLg),
                color = MaterialTheme.colorScheme.outlineVariant
            )
            
            // Join household option
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onJoinHousehold() }
                    .padding(
                        horizontal = Dimensions.spacingLg,
                        vertical = Dimensions.spacingMd
                    ),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.Link,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.secondary
                )
                Spacer(modifier = Modifier.width(Dimensions.spacingMd))
                Text(
                    text = "Join Household with Code",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Medium,
                    color = MaterialTheme.colorScheme.secondary
                )
            }
            
            Spacer(modifier = Modifier.height(Dimensions.spacingXl))
        }
    }
}
