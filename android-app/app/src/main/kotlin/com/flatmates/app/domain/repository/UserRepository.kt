package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.User
import com.flatmates.app.domain.util.Result

interface UserRepository {
    suspend fun getCurrentUser(): Result<User>
    suspend fun updateUser(user: User): Result<User>
}
