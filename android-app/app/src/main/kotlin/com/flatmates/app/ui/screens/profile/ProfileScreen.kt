package com.flatmates.app.ui.screens.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.CloudQueue
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.PersonAdd
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Divider
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.flatmates.app.ui.components.FlatmatesCard
import com.flatmates.app.ui.components.LoadingState
import com.flatmates.app.ui.screens.profile.components.AboutSheet
import com.flatmates.app.ui.screens.profile.components.CreateHouseholdSheet
import com.flatmates.app.ui.screens.profile.components.HouseholdSwitcherSheet
import com.flatmates.app.ui.screens.profile.components.InviteMemberSheet
import com.flatmates.app.ui.screens.profile.components.JoinHouseholdSheet
import com.flatmates.app.ui.theme.Dimensions

/**
 * Profile screen showing user info, household switching, and settings.
 */
@Composable
fun ProfileScreen(
    navController: NavHostController,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showSignOutDialog by remember { mutableStateOf(false) }
    
    if (uiState.isLoading) {
        LoadingState(message = "Loading profile...")
        return
    }
    
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Dimensions.screenPadding),
        verticalArrangement = Arrangement.spacedBy(Dimensions.spacingMd)
    ) {
        // Header
        item {
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            Text(
                text = "Profile",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
        }
        
        // User info card
        item {
            UserInfoCard(
                name = uiState.user?.fullName ?: "User",
                email = uiState.user?.email ?: "",
                initials = uiState.user?.initials ?: "?"
            )
        }
        
        // Current household card
        item {
            FlatmatesCard(
                onClick = { viewModel.showHouseholdSwitcher() }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(Dimensions.cardPadding),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Home,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(Dimensions.spacingMd))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Current Household",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = uiState.currentHousehold?.name ?: "No household",
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = "Switch household",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        
        // Invite members card
        item {
            FlatmatesCard(
                onClick = { viewModel.showInviteMember() }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(Dimensions.cardPadding),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.PersonAdd,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.secondary
                    )
                    Spacer(modifier = Modifier.width(Dimensions.spacingMd))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(
                            text = "Invite Flatmates",
                            style = MaterialTheme.typography.bodyLarge,
                            fontWeight = FontWeight.Medium
                        )
                        Text(
                            text = "Add members to your household",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Icon(
                        imageVector = Icons.Default.ChevronRight,
                        contentDescription = "Invite members",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
        
        // Sync status
        item {
            SyncStatusCard(
                pendingSyncCount = uiState.pendingSyncCount,
                isSyncing = uiState.isSyncing,
                onSyncClick = { viewModel.syncNow() }
            )
        }
        
        // About section
        item {
            Spacer(modifier = Modifier.height(Dimensions.spacingSm))
            Text(
                text = "About",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold
            )
        }
        
        item {
            FlatmatesCard {
                Column {
                    SettingsItem(
                        icon = Icons.Default.Info,
                        title = "About Flatmates",
                        subtitle = "Version 1.0.0",
                        onClick = { viewModel.showAbout() }
                    )
                }
            }
        }
        
        // Sign out
        item {
            Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            FlatmatesCard(
                onClick = { showSignOutDialog = true }
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(Dimensions.cardPadding),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.Logout,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.error
                    )
                    Spacer(modifier = Modifier.width(Dimensions.spacingMd))
                    Text(
                        text = "Sign Out",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
            Spacer(modifier = Modifier.height(Dimensions.spacingXl))
        }
    }
    
    // Household switcher sheet
    if (uiState.showHouseholdSwitcher) {
        HouseholdSwitcherSheet(
            households = uiState.households,
            currentHouseholdId = uiState.currentHousehold?.id,
            onSelect = { viewModel.switchHousehold(it) },
            onCreateNew = { viewModel.showCreateHousehold() },
            onJoinHousehold = { viewModel.showJoinHousehold() },
            onDismiss = { viewModel.hideHouseholdSwitcher() }
        )
    }
    
    // Create household sheet
    if (uiState.showCreateHousehold) {
        CreateHouseholdSheet(
            isLoading = uiState.isCreatingHousehold,
            error = uiState.createHouseholdError,
            onCreate = { name -> viewModel.createHousehold(name) },
            onDismiss = { viewModel.hideCreateHousehold() }
        )
    }
    
    // Join household sheet
    if (uiState.showJoinHousehold) {
        JoinHouseholdSheet(
            isLoading = uiState.isJoiningHousehold,
            error = uiState.joinHouseholdError,
            onJoin = { code -> viewModel.joinHousehold(code) },
            onDismiss = { viewModel.hideJoinHousehold() }
        )
    }
    
    // Invite member sheet
    if (uiState.showInviteMember) {
        InviteMemberSheet(
            householdName = uiState.currentHousehold?.name ?: "Household",
            inviteToken = uiState.inviteToken,
            isLoading = uiState.isCreatingInvite,
            error = uiState.inviteError,
            onCreateInvite = { email -> viewModel.createInvite(email) },
            onCreatePublicInvite = { viewModel.createPublicInvite() },
            onDismiss = { viewModel.hideInviteMember() }
        )
    }
    
    // About sheet
    if (uiState.showAbout) {
        AboutSheet(
            onDismiss = { viewModel.hideAbout() }
        )
    }
    
    // Sign out confirmation dialog
    if (showSignOutDialog) {
        AlertDialog(
            onDismissRequest = { showSignOutDialog = false },
            title = { Text("Sign Out") },
            text = { Text("Are you sure you want to sign out?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        viewModel.signOut()
                        showSignOutDialog = false
                    }
                ) {
                    Text("Sign Out", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showSignOutDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun UserInfoCard(
    name: String,
    email: String,
    initials: String
) {
    FlatmatesCard {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Dimensions.cardPadding),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar
            Box(
                modifier = Modifier
                    .size(60.dp)
                    .clip(CircleShape)
                    .background(MaterialTheme.colorScheme.primaryContainer),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = initials,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onPrimaryContainer,
                    fontWeight = FontWeight.Bold
                )
            }
            
            Spacer(modifier = Modifier.width(Dimensions.spacingMd))
            
            Column {
                Text(
                    text = name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = email,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun SyncStatusCard(
    pendingSyncCount: Int,
    isSyncing: Boolean = false,
    onSyncClick: () -> Unit = {}
) {
    FlatmatesCard(
        onClick = onSyncClick
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(Dimensions.cardPadding),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = if (isSyncing) {
                    Icons.Default.Sync
                } else if (pendingSyncCount > 0) {
                    Icons.Default.CloudOff
                } else {
                    Icons.Default.CloudQueue
                },
                contentDescription = null,
                tint = if (pendingSyncCount > 0) {
                    MaterialTheme.colorScheme.error
                } else {
                    MaterialTheme.colorScheme.primary
                }
            )
            Spacer(modifier = Modifier.width(Dimensions.spacingMd))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Sync Status",
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = when {
                        isSyncing -> "Syncing..."
                        pendingSyncCount > 0 -> "$pendingSyncCount changes pending"
                        else -> "All changes synced"
                    },
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            if (pendingSyncCount > 0 || isSyncing) {
                Icon(
                    imageVector = Icons.Default.Sync,
                    contentDescription = "Sync now",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
}

@Composable
private fun SettingsItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(Dimensions.cardPadding),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.width(Dimensions.spacingMd))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Icon(
            imageVector = Icons.Default.ChevronRight,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
