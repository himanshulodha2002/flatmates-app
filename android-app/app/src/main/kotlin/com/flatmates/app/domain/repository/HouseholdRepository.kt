package com.flatmates.app.domain.repository

import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.model.HouseholdMember
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow

interface HouseholdRepository {
    fun getHouseholds(): Flow<List<Household>>
    fun getActiveHousehold(): Flow<Household?>
    fun getHouseholdById(householdId: String): Flow<Household?>
    fun getHouseholdMembers(householdId: String): Flow<List<HouseholdMember>>
    
    suspend fun createHousehold(household: Household): Result<Household>
    suspend fun updateHousehold(household: Household): Result<Household>
    suspend fun deleteHousehold(householdId: String): Result<Unit>
    suspend fun switchActiveHousehold(householdId: String): Result<Unit>
    suspend fun addMember(member: HouseholdMember): Result<HouseholdMember>
    suspend fun removeMember(memberId: String): Result<Unit>
}
