package com.flatmates.app.data.remote.api

import com.flatmates.app.data.remote.dto.*
import retrofit2.Response
import retrofit2.http.*

interface FlatmatesApi : AuthApi, SyncApi {
    
    // Households
    @GET("api/v1/households/mine")
    suspend fun getHouseholds(): Response<List<HouseholdDto>>
    
    @POST("api/v1/households")
    suspend fun createHousehold(
        @Body household: CreateHouseholdRequest
    ): Response<HouseholdDto>
    
    @POST("api/v1/households/join")
    suspend fun joinHousehold(
        @Body request: JoinHouseholdRequest
    ): Response<HouseholdDto>
    
    @GET("api/v1/households/{id}/members")
    suspend fun getHouseholdMembers(
        @Path("id") householdId: String
    ): Response<List<HouseholdMemberDto>>
    
    @GET("api/v1/households/{id}")
    suspend fun getHousehold(
        @Path("id") householdId: String
    ): Response<HouseholdDto>
    
    @PUT("api/v1/households/{id}")
    suspend fun updateHousehold(
        @Path("id") householdId: String,
        @Body household: CreateHouseholdRequest
    ): Response<HouseholdDto>
    
    @DELETE("api/v1/households/{id}")
    suspend fun deleteHousehold(
        @Path("id") householdId: String
    ): Response<Unit>
    
    @POST("api/v1/households/{id}/invite")
    suspend fun createInvite(
        @Path("id") householdId: String,
        @Body request: InviteCreateRequest
    ): Response<InviteDto>
    
    @DELETE("api/v1/households/{id}/members/{memberId}")
    suspend fun removeMember(
        @Path("id") householdId: String,
        @Path("memberId") memberId: String
    ): Response<Unit>
    
    @POST("api/v1/households/{id}/leave")
    suspend fun leaveHousehold(
        @Path("id") householdId: String
    ): Response<Unit>
}
