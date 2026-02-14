package com.flatmates.app.ui.navigation

import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.flatmates.app.ui.screens.auth.LoginScreen
import com.flatmates.app.ui.screens.expenses.AddExpenseScreen
import com.flatmates.app.ui.screens.expenses.ExpensesScreen
import com.flatmates.app.ui.screens.home.HomeScreen
import com.flatmates.app.ui.screens.onboarding.HouseholdSetupScreen
import com.flatmates.app.ui.screens.profile.ProfileScreen
import com.flatmates.app.ui.screens.shopping.ShoppingListDetailScreen
import com.flatmates.app.ui.screens.shopping.ShoppingScreen
import com.flatmates.app.ui.screens.todos.TodoDetailScreen
import com.flatmates.app.ui.screens.todos.TodosScreen

/**
 * Main navigation composable for the Flatmates app.
 * Handles navigation between all screens with a bottom navigation bar.
 */
@Composable
fun AppNavigation(
    isLoggedIn: Boolean = false,
    hasHousehold: Boolean = false,
    onLoginSuccess: () -> Unit = {},
    onHouseholdSetupComplete: () -> Unit = {},
    modifier: Modifier = Modifier
) {
    val navController = rememberNavController()
    
    // Show login screen if not logged in
    if (!isLoggedIn) {
        LoginScreen(
            onLoginSuccess = onLoginSuccess
        )
        return
    }
    
    // Show household setup if logged in but no household
    if (!hasHousehold) {
        HouseholdSetupScreen(
            onSetupComplete = onHouseholdSetupComplete
        )
        return
    }
    
    // Show main app content
    Scaffold(
        bottomBar = { NavBottomBar(navController = navController) },
        modifier = modifier
    ) { paddingValues ->
        AppNavHost(
            navController = navController,
            modifier = Modifier.padding(paddingValues)
        )
    }
}

@Composable
private fun AppNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Routes.Home.route,
        modifier = modifier
    ) {
        // Main tabs
        composable(Routes.Home.route) {
            HomeScreen(navController = navController)
        }
        
        composable(Routes.Todos.route) {
            TodosScreen(navController = navController)
        }
        
        composable(Routes.Shopping.route) {
            ShoppingScreen(navController = navController)
        }
        
        composable(Routes.Expenses.route) {
            ExpensesScreen(navController = navController)
        }
        
        composable(Routes.Profile.route) {
            ProfileScreen(navController = navController)
        }
        
        // Detail screens
        composable(
            route = Routes.TodoDetail.route,
            arguments = listOf(navArgument("todoId") { type = NavType.StringType })
        ) { backStackEntry ->
            val todoId = backStackEntry.arguments?.getString("todoId") ?: return@composable
            TodoDetailScreen(
                todoId = todoId,
                navController = navController
            )
        }
        
        composable(
            route = Routes.ShoppingListDetail.route,
            arguments = listOf(navArgument("listId") { type = NavType.StringType })
        ) { backStackEntry ->
            val listId = backStackEntry.arguments?.getString("listId") ?: return@composable
            ShoppingListDetailScreen(
                listId = listId,
                navController = navController
            )
        }
        
        composable(Routes.AddExpense.route) {
            AddExpenseScreen(navController = navController)
        }
    }
}
