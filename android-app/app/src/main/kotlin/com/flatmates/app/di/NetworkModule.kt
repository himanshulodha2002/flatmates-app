package com.flatmates.app.di

import com.flatmates.app.BuildConfig
import com.flatmates.app.data.remote.api.AuthApi
import com.flatmates.app.data.remote.api.FlatmatesApi
import com.flatmates.app.data.remote.api.SyncApi
import com.flatmates.app.data.remote.interceptor.AuthInterceptor
import com.flatmates.app.data.remote.interceptor.NetworkInterceptor
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.serialization.json.Json
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.kotlinx.serialization.asConverterFactory
import java.util.concurrent.TimeUnit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(
        authInterceptor: AuthInterceptor,
        networkInterceptor: NetworkInterceptor
    ): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(networkInterceptor)
            .addInterceptor(authInterceptor)
            .addInterceptor(
                HttpLoggingInterceptor().apply {
                    level = if (BuildConfig.DEBUG) {
                        HttpLoggingInterceptor.Level.BODY
                    } else {
                        HttpLoggingInterceptor.Level.NONE
                    }
                }
            )
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .retryOnConnectionFailure(true)
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(
        okHttpClient: OkHttpClient,
        json: Json
    ): Retrofit {
        val baseUrl = BuildConfig.API_BASE_URL.let { url ->
            if (url.endsWith("/")) url else "$url/"
        }
        
        return Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(okHttpClient)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }
    
    @Provides
    @Singleton
    fun provideFlatmatesApi(retrofit: Retrofit): FlatmatesApi {
        return retrofit.create(FlatmatesApi::class.java)
    }
    
    @Provides
    @Singleton
    fun provideAuthApi(flatmatesApi: FlatmatesApi): AuthApi {
        return flatmatesApi
    }
    
    @Provides
    @Singleton
    fun provideSyncApi(flatmatesApi: FlatmatesApi): SyncApi {
        return flatmatesApi
    }
}
