package com.flatmates.app.di

import com.flatmates.app.data.repository.AuthRepositoryImpl
import com.flatmates.app.data.repository.ExpenseRepositoryImpl
import com.flatmates.app.data.repository.HouseholdRepositoryImpl
import com.flatmates.app.data.repository.ShoppingRepositoryImpl
import com.flatmates.app.data.repository.TodoRepositoryImpl
import com.flatmates.app.data.repository.UserRepositoryImpl
import com.flatmates.app.domain.repository.AuthRepository
import com.flatmates.app.domain.repository.ExpenseRepository
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.repository.ShoppingRepository
import com.flatmates.app.domain.repository.TodoRepository
import com.flatmates.app.domain.repository.UserRepository
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindUserRepository(
        userRepositoryImpl: UserRepositoryImpl
    ): UserRepository

    @Binds
    @Singleton
    abstract fun bindAuthRepository(
        authRepositoryImpl: AuthRepositoryImpl
    ): AuthRepository

    @Binds
    @Singleton
    abstract fun bindTodoRepository(
        todoRepositoryImpl: TodoRepositoryImpl
    ): TodoRepository

    @Binds
    @Singleton
    abstract fun bindShoppingRepository(
        shoppingRepositoryImpl: ShoppingRepositoryImpl
    ): ShoppingRepository

    @Binds
    @Singleton
    abstract fun bindExpenseRepository(
        expenseRepositoryImpl: ExpenseRepositoryImpl
    ): ExpenseRepository

    @Binds
    @Singleton
    abstract fun bindHouseholdRepository(
        householdRepositoryImpl: HouseholdRepositoryImpl
    ): HouseholdRepository
}
