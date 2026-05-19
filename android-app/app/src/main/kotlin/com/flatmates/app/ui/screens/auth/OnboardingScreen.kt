package com.flatmates.app.ui.screens.auth

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.launch

data class OnboardingPage(
    val icon: ImageVector,
    val title: String,
    val description: String
)

private val onboardingPages = listOf(
    OnboardingPage(
        icon = Icons.Default.Home,
        title = "Welcome to Flatmates",
        description = "The easiest way to manage your shared home with roommates"
    ),
    OnboardingPage(
        icon = Icons.Default.CheckCircle,
        title = "Track Tasks Together",
        description = "Create and assign household tasks, set due dates, and never miss a chore"
    ),
    OnboardingPage(
        icon = Icons.Default.ShoppingCart,
        title = "Shared Shopping Lists",
        description = "Create shopping lists, add items, and check them off in real-time"
    ),
    OnboardingPage(
        icon = Icons.Default.AttachMoney,
        title = "Split Expenses Fairly",
        description = "Track shared expenses and settle up easily with your flatmates"
    )
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun OnboardingScreen(
    onComplete: () -> Unit
) {
    val pagerState = rememberPagerState(pageCount = { onboardingPages.size })
    val coroutineScope = rememberCoroutineScope()
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(24.dp)
    ) {
        // Skip button
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.End
        ) {
            TextButton(onClick = onComplete) {
                Text("Skip")
            }
        }
        
        // Pager
        HorizontalPager(
            state = pagerState,
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
        ) { page ->
            OnboardingPageContent(
                page = onboardingPages[page]
            )
        }
        
        // Page indicators
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 24.dp),
            horizontalArrangement = Arrangement.Center
        ) {
            repeat(onboardingPages.size) { index ->
                val isSelected = pagerState.currentPage == index
                Box(
                    modifier = Modifier
                        .padding(horizontal = 4.dp)
                        .size(if (isSelected) 12.dp else 8.dp)
                        .background(
                            color = if (isSelected) 
                                MaterialTheme.colorScheme.primary 
                            else 
                                MaterialTheme.colorScheme.surfaceVariant,
                            shape = MaterialTheme.shapes.small
                        )
                )
            }
        }
        
        // Navigation buttons
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            // Back button
            AnimatedVisibility(visible = pagerState.currentPage > 0) {
                TextButton(
                    onClick = {
                        coroutineScope.launch {
                            pagerState.animateScrollToPage(pagerState.currentPage - 1)
                        }
                    }
                ) {
                    Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Back")
                }
            }
            
            if (pagerState.currentPage == 0) {
                Spacer(modifier = Modifier.weight(1f))
            }
            
            // Next/Get Started button
            Button(
                onClick = {
                    if (pagerState.currentPage == onboardingPages.size - 1) {
                        onComplete()
                    } else {
                        coroutineScope.launch {
                            pagerState.animateScrollToPage(pagerState.currentPage + 1)
                        }
                    }
                }
            ) {
                Text(
                    if (pagerState.currentPage == onboardingPages.size - 1) 
                        "Get Started" 
                    else 
                        "Next"
                )
                if (pagerState.currentPage < onboardingPages.size - 1) {
                    Spacer(modifier = Modifier.width(8.dp))
                    Icon(Icons.Default.ArrowForward, contentDescription = "Next")
                }
            }
        }
    }
}

@Composable
private fun OnboardingPageContent(
    page: OnboardingPage
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Icon
        Surface(
            modifier = Modifier.size(160.dp),
            shape = MaterialTheme.shapes.extraLarge,
            color = MaterialTheme.colorScheme.primaryContainer
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.fillMaxSize()
            ) {
                Image(
                    imageVector = page.icon,
                    contentDescription = null,
                    modifier = Modifier.size(80.dp),
                    colorFilter = ColorFilter.tint(MaterialTheme.colorScheme.onPrimaryContainer)
                )
            }
        }
        
        Spacer(modifier = Modifier.height(48.dp))
        
        // Title
        Text(
            text = page.title,
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onBackground
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Description
        Text(
            text = page.description,
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
