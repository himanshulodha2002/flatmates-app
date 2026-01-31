package com.flatmates.app.domain.util

sealed class Result<out T> {
    data class Success<T>(val data: T) : Result<T>()
    data class Error(
        val exception: Throwable? = null,
        val message: String? = null
    ) : Result<Nothing>()
    data object Loading : Result<Nothing>()
    
    val isSuccess: Boolean get() = this is Success
    val isError: Boolean get() = this is Error
    val isLoading: Boolean get() = this is Loading
    
    fun getOrNull(): T? = (this as? Success)?.data
    
    fun getOrThrow(): T = when (this) {
        is Success -> data
        is Error -> throw exception ?: IllegalStateException(message ?: "Unknown error")
        is Loading -> throw IllegalStateException("Result is still loading")
    }
    
    inline fun <R> map(transform: (T) -> R): Result<R> = when (this) {
        is Success -> Success(transform(data))
        is Error -> this
        is Loading -> Loading
    }
    
    inline fun onSuccess(action: (T) -> Unit): Result<T> {
        if (this is Success) action(data)
        return this
    }
    
    inline fun onError(action: (Throwable?, String?) -> Unit): Result<T> {
        if (this is Error) action(exception, message)
        return this
    }
}

// Extension to convert to Flow
fun <T> Result<T>.asFlow(): kotlinx.coroutines.flow.Flow<Result<T>> = 
    kotlinx.coroutines.flow.flowOf(this)
