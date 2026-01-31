package com.flatmates.app.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.flatmates.app.data.local.entity.HouseholdEntity
import com.flatmates.app.data.local.entity.HouseholdMemberEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface HouseholdDao {
    
    @Query("SELECT * FROM households ORDER BY name ASC")
    fun getHouseholds(): Flow<List<HouseholdEntity>>
    
    @Query("SELECT * FROM households WHERE isActive = 1 LIMIT 1")
    fun getActiveHousehold(): Flow<HouseholdEntity?>
    
    @Query("SELECT * FROM households WHERE isActive = 1 LIMIT 1")
    suspend fun getActiveHouseholdOnce(): HouseholdEntity?
    
    @Query("SELECT * FROM households WHERE id = :id")
    fun getHouseholdById(id: String): Flow<HouseholdEntity?>
    
    @Query("SELECT * FROM household_members WHERE householdId = :householdId")
    fun getHouseholdMembers(householdId: String): Flow<List<HouseholdMemberEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertHousehold(household: HouseholdEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMember(member: HouseholdMemberEntity)
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMembers(members: List<HouseholdMemberEntity>)
    
    @Query("UPDATE households SET isActive = 0")
    suspend fun deactivateAllHouseholds()
    
    @Query("UPDATE households SET isActive = 1 WHERE id = :id")
    suspend fun setActiveHousehold(id: String)
    
    @Transaction
    suspend fun switchActiveHousehold(id: String) {
        deactivateAllHouseholds()
        setActiveHousehold(id)
    }
    
    @Query("DELETE FROM households WHERE id = :id")
    suspend fun deleteHousehold(id: String)
    
    @Query("DELETE FROM household_members WHERE id = :id")
    suspend fun deleteMember(id: String)
    
    @Query("DELETE FROM household_members WHERE householdId = :householdId")
    suspend fun deleteAllMembersForHousehold(householdId: String)
}
