package com.flatmates.app.ui.navigation

/**
 * Navigation routes for the Flatmates app.
 * Uses sealed class for type-safe navigation.
 */
sealed class Routes(val route: String) {
    // Auth
    data object Login : Routes("login")
    data object Onboarding : Routes("onboarding")
    
    // Main tabs
    data object Home : Routes("home")
    data object Todos : Routes("todos")
    data object Shopping : Routes("shopping")
    data object Expenses : Routes("expenses")
    data object Profile : Routes("profile")
    
    // Detail screens
    data object TodoDetail : Routes("todos/{todoId}") {
        fun createRoute(todoId: String) = "todos/$todoId"
    }
    
    data object ShoppingListDetail : Routes("shopping/{listId}") {
        fun createRoute(listId: String) = "shopping/$listId"
    }
    
    data object AddExpense : Routes("expenses/add")
    
    data object ExpenseDetail : Routes("expenses/{expenseId}") {
        fun createRoute(expenseId: String) = "expenses/$expenseId"
    }
}
