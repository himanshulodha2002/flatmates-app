package com.flatmates.app.data.repository

import com.flatmates.app.data.local.dao.HouseholdDao
import com.flatmates.app.data.local.dao.SyncQueueDao
import com.flatmates.app.data.local.entity.SyncQueueEntity
import com.flatmates.app.data.mapper.toDomain
import com.flatmates.app.data.mapper.toDomainList
import com.flatmates.app.data.mapper.toEntity
import com.flatmates.app.data.mapper.toMemberDomainList
import com.flatmates.app.domain.model.Household
import com.flatmates.app.domain.model.HouseholdMember
import com.flatmates.app.domain.repository.HouseholdRepository
import com.flatmates.app.domain.util.Result
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import javax.inject.Inject

class HouseholdRepositoryImpl @Inject constructor(
    private val householdDao: HouseholdDao,
    private val syncQueueDao: SyncQueueDao
) : HouseholdRepository {
    
    override fun getHouseholds(): Flow<List<Household>> =
        householdDao.getHouseholds().map { it.toDomainList() }
    
    override fun getActiveHousehold(): Flow<Household?> =
        householdDao.getActiveHousehold().map { entity ->
            entity?.let { household ->
                val members = householdDao.getHouseholdMembers(household.id).first()
                household.toDomain(members.toMemberDomainList())
            }
        }
    
    override fun getHouseholdById(householdId: String): Flow<Household?> =
        combine(
            householdDao.getHouseholdById(householdId),
            householdDao.getHouseholdMembers(householdId)
        ) { household, members ->
            household?.toDomain(members.toMemberDomainList())
        }
    
    override fun getHouseholdMembers(householdId: String): Flow<List<HouseholdMember>> =
        householdDao.getHouseholdMembers(householdId).map { it.toMemberDomainList() }
    
    override suspend fun createHousehold(household: Household): Result<Household> {
        return try {
            val entity = household.toEntity(
                isActive = true, // New household is active by default
                syncStatus = "PENDING_CREATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            
            // Deactivate other households first
            householdDao.deactivateAllHouseholds()
            householdDao.insertHousehold(entity)
            
            // Insert members
            household.members.forEach { member ->
                householdDao.insertMember(member.toEntity())
            }
            
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "household",
                entityId = household.id,
                operation = "CREATE",
                payload = "{\"id\":\"${household.id}\",\"name\":\"${household.name}\"}"
            ))
            
            Result.Success(entity.toDomain(household.members))
        } catch (e: Exception) {
            Result.Error(e, "Failed to create household")
        }
    }
    
    override suspend fun updateHousehold(household: Household): Result<Household> {
        return try {
            val existing = householdDao.getActiveHouseholdOnce()
            val entity = household.toEntity(
                isActive = existing?.id == household.id,
                syncStatus = "PENDING_UPDATE",
                lastModifiedLocally = System.currentTimeMillis()
            )
            householdDao.insertHousehold(entity)
            
            syncQueueDao.removeByEntity(household.id, "household")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "household",
                entityId = household.id,
                operation = "UPDATE",
                payload = "{\"id\":\"${household.id}\",\"name\":\"${household.name}\"}"
            ))
            
            Result.Success(entity.toDomain(household.members))
        } catch (e: Exception) {
            Result.Error(e, "Failed to update household")
        }
    }
    
    override suspend fun deleteHousehold(householdId: String): Result<Unit> {
        return try {
            householdDao.deleteHousehold(householdId)
            
            syncQueueDao.removeByEntity(householdId, "household")
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "household",
                entityId = householdId,
                operation = "DELETE",
                payload = householdId
            ))
            
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to delete household")
        }
    }
    
    override suspend fun switchActiveHousehold(householdId: String): Result<Unit> {
        return try {
            householdDao.switchActiveHousehold(householdId)
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to switch household")
        }
    }
    
    override suspend fun addMember(member: HouseholdMember): Result<HouseholdMember> {
        return try {
            val entity = member.toEntity(syncStatus = "PENDING_CREATE")
            householdDao.insertMember(entity)
            
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "household_member",
                entityId = member.id,
                operation = "CREATE",
                payload = "{\"id\":\"${member.id}\",\"householdId\":\"${member.householdId}\",\"userId\":\"${member.userId}\"}"
            ))
            
            Result.Success(entity.toDomain())
        } catch (e: Exception) {
            Result.Error(e, "Failed to add member")
        }
    }
    
    override suspend fun removeMember(memberId: String): Result<Unit> {
        return try {
            householdDao.deleteMember(memberId)
            
            syncQueueDao.enqueue(SyncQueueEntity(
                entityType = "household_member",
                entityId = memberId,
                operation = "DELETE",
                payload = memberId
            ))
            
            Result.Success(Unit)
        } catch (e: Exception) {
            Result.Error(e, "Failed to remove member")
        }
    }
}
