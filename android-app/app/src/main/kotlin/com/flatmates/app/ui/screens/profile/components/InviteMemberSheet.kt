package com.flatmates.app.ui.screens.profile.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Share
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.flatmates.app.ui.theme.Dimensions

/**
 * Bottom sheet for inviting members to a household.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun InviteMemberSheet(
    householdName: String,
    inviteToken: String?,
    isLoading: Boolean,
    error: String?,
    onCreateInvite: (email: String) -> Unit,
    onCreatePublicInvite: () -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val context = LocalContext.current
    val focusManager = LocalFocusManager.current
    var email by remember { mutableStateOf("") }
    var mode by remember { mutableStateOf("public") } // "public" or "email"
    
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = MaterialTheme.colorScheme.surface
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = Dimensions.spacingLg)
                .padding(bottom = Dimensions.spacingXl)
        ) {
            Text(
                text = "Invite to $householdName",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingSm))
            
            Text(
                text = "Choose how to invite your flatmates",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            
            Spacer(modifier = Modifier.height(Dimensions.spacingLg))
            
            // Mode selection buttons
            if (inviteToken == null) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = Dimensions.spacingMd),
                    horizontalArrangement = Arrangement.spacedBy(Dimensions.spacingSm)
                ) {
                    FilledTonalButton(
                        onClick = { mode = "public" },
                        modifier = Modifier.weight(1f),
                        colors = if (mode == "public") {
                            ButtonDefaults.filledTonalButtonColors()
                        } else {
                            ButtonDefaults.filledTonalButtonColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        }
                    ) {
                        Text("Public Code")
                    }
                    
                    FilledTonalButton(
                        onClick = { mode = "email" },
                        modifier = Modifier.weight(1f),
                        colors = if (mode == "email") {
                            ButtonDefaults.filledTonalButtonColors()
                        } else {
                            ButtonDefaults.filledTonalButtonColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        }
                    ) {
                        Text("Email")
                    }
                }
                
                Spacer(modifier = Modifier.height(Dimensions.spacingMd))
            }
            
            // Public mode content
            if (mode == "public" && inviteToken == null) {
                Text(
                    text = "Generate a shareable invite code",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = Dimensions.spacingMd)
                )
                
                Button(
                    onClick = onCreatePublicInvite,
                    enabled = !isLoading,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text("Generate Code")
                }
            } else if (mode == "email" && inviteToken == null) {
                // Email mode content
                Text(
                    text = "Send an invite to a specific email address",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = Dimensions.spacingMd)
                )
                
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email address") },
                    placeholder = { Text("flatmate@example.com") },
                    leadingIcon = {
                        Icon(Icons.Default.Email, contentDescription = null)
                    },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Done
                    ),
                    keyboardActions = KeyboardActions(
                        onDone = {
                            focusManager.clearFocus()
                            if (email.isNotBlank()) {
                                onCreateInvite(email)
                            }
                        }
                    ),
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isLoading
                )
                
                if (error != null) {
                    Spacer(modifier = Modifier.height(Dimensions.spacingSm))
                    Text(
                        text = error,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                
                Spacer(modifier = Modifier.height(Dimensions.spacingMd))
                
                Button(
                    onClick = { onCreateInvite(email) },
                    enabled = email.isNotBlank() && !isLoading,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isLoading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                    }
                    Text("Send Invite")
                }
            }
            
            // Show invite created success
            if (inviteToken != null) {
                HorizontalDivider(modifier = Modifier.padding(vertical = Dimensions.spacingMd))
                
                Text(
                    text = "✅ Invite Created!",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.primary
                )
                
                Spacer(modifier = Modifier.height(Dimensions.spacingSm))
                
                Text(
                    text = "Share this invite code with your flatmate:",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                Spacer(modifier = Modifier.height(Dimensions.spacingMd))
                
                // Invite code display
                Text(
                    text = inviteToken,
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(Dimensions.spacingLg))
                
                // Action buttons
                Row(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    // Copy button
                    FilledTonalButton(
                        onClick = {
                            copyToClipboard(context, inviteToken)
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            Icons.Default.ContentCopy,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Copy")
                    }
                    
                    Spacer(modifier = Modifier.width(Dimensions.spacingMd))
                    
                    // Share button
                    Button(
                        onClick = {
                            shareInvite(context, householdName, inviteToken)
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(
                            Icons.Default.Share,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Share")
                    }
                }
                
                Spacer(modifier = Modifier.height(Dimensions.spacingMd))
                
                Text(
                    text = "The invite expires in 7 days.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        }
    }
}

private fun copyToClipboard(context: Context, text: String) {
    val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
    val clip = ClipData.newPlainText("Invite Code", text)
    clipboard.setPrimaryClip(clip)
}

private fun shareInvite(context: Context, householdName: String, token: String) {
    val shareText = """
        Join my household "$householdName" on Flatmates!
        
        Use this invite code: $token
        
        Download the app and enter this code to join.
    """.trimIndent()
    
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "text/plain"
        putExtra(Intent.EXTRA_SUBJECT, "Join $householdName on Flatmates")
        putExtra(Intent.EXTRA_TEXT, shareText)
    }
    context.startActivity(Intent.createChooser(intent, "Share invite"))
}
