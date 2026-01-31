package com.flatmates.app.data.remote.api

import com.flatmates.app.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface SyncApi {
    
    @POST("api/v1/sync")
    suspend fun syncAll(
        @Body request: SyncRequest
    ): Response<SyncResponse>
    
    // Fallback individual endpoints - Todos
    @GET("api/v1/todos")
    suspend fun getTodos(
        @Query("household_id") householdId: String
    ): Response<List<TodoDto>>
    
    @POST("api/v1/todos")
    suspend fun createTodo(
        @Body todo: TodoDto
    ): Response<TodoDto>
    
    @PUT("api/v1/todos/{id}")
    suspend fun updateTodo(
        @Path("id") id: String,
        @Body todo: TodoDto
    ): Response<TodoDto>
    
    @DELETE("api/v1/todos/{id}")
    suspend fun deleteTodo(
        @Path("id") id: String
    ): Response<Unit>
    
    // Fallback individual endpoints - Shopping Lists
    @GET("api/v1/shopping-lists")
    suspend fun getShoppingLists(
        @Query("household_id") householdId: String
    ): Response<List<ShoppingListDto>>
    
    @POST("api/v1/shopping-lists")
    suspend fun createShoppingList(
        @Body shoppingList: ShoppingListDto
    ): Response<ShoppingListDto>
    
    @PUT("api/v1/shopping-lists/{id}")
    suspend fun updateShoppingList(
        @Path("id") id: String,
        @Body shoppingList: ShoppingListDto
    ): Response<ShoppingListDto>
    
    @DELETE("api/v1/shopping-lists/{id}")
    suspend fun deleteShoppingList(
        @Path("id") id: String
    ): Response<Unit>
    
    // Fallback individual endpoints - Shopping Items
    @GET("api/v1/shopping-lists/{listId}/items")
    suspend fun getShoppingItems(
        @Path("listId") listId: String
    ): Response<List<ShoppingItemDto>>
    
    @POST("api/v1/shopping-lists/{listId}/items")
    suspend fun createShoppingItem(
        @Path("listId") listId: String,
        @Body item: ShoppingItemDto
    ): Response<ShoppingItemDto>
    
    @PUT("api/v1/shopping-items/{id}")
    suspend fun updateShoppingItem(
        @Path("id") id: String,
        @Body item: ShoppingItemDto
    ): Response<ShoppingItemDto>
    
    @DELETE("api/v1/shopping-items/{id}")
    suspend fun deleteShoppingItem(
        @Path("id") id: String
    ): Response<Unit>
    
    // Fallback individual endpoints - Expenses
    @GET("api/v1/expenses")
    suspend fun getExpenses(
        @Query("household_id") householdId: String
    ): Response<List<ExpenseDto>>
    
    @POST("api/v1/expenses")
    suspend fun createExpense(
        @Body expense: ExpenseDto
    ): Response<ExpenseDto>
    
    @PUT("api/v1/expenses/{id}")
    suspend fun updateExpense(
        @Path("id") id: String,
        @Body expense: ExpenseDto
    ): Response<ExpenseDto>
    
    @DELETE("api/v1/expenses/{id}")
    suspend fun deleteExpense(
        @Path("id") id: String
    ): Response<Unit>
}
