package com.flatmates.app.data.repository

import com.flatmates.app.data.local.dao.UserDao
import com.flatmates.app.data.mapper.toDomain
import com.flatmates.app.data.mapper.toEntity
import com.flatmates.app.domain.model.User
import com.flatmates.app.domain.repository.UserRepository
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.firstOrNull
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepositoryImpl @Inject constructor(
    private val userDao: UserDao
) : UserRepository {

    override suspend fun getCurrentUser(): Result<User> {
        return try {
            val userEntity = userDao.getCurrentUser().firstOrNull()
            if (userEntity != null) {
                Result.Success(userEntity.toDomain())
            } else {
                Result.Error(Exception("No current user found"))
            }
        } catch (e: Exception) {
            Result.Error(e)
        }
    }

    override suspend fun updateUser(user: User): Result<User> {
        return try {
            userDao.insert(user.toEntity())
            Result.Success(user)
        } catch (e: Exception) {
            Result.Error(e)
        }
    }
}
