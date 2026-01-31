package com.flatmates.app.data.local.database

import androidx.room.TypeConverter
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import java.math.BigDecimal

class Converters {
    
    // Instant converters
    @TypeConverter
    fun fromInstant(value: Instant?): Long? = value?.toEpochMilliseconds()
    
    @TypeConverter
    fun toInstant(value: Long?): Instant? = value?.let { Instant.fromEpochMilliseconds(it) }
    
    // LocalDate converters
    @TypeConverter
    fun fromLocalDate(value: LocalDate?): String? = value?.toString()
    
    @TypeConverter
    fun toLocalDate(value: String?): LocalDate? = value?.let { LocalDate.parse(it) }
    
    // BigDecimal converters
    @TypeConverter
    fun fromBigDecimal(value: BigDecimal?): String? = value?.toPlainString()
    
    @TypeConverter
    fun toBigDecimal(value: String?): BigDecimal? = value?.let { BigDecimal(it) }
    
    // List<String> converters (for simple string lists)
    @TypeConverter
    fun fromStringList(value: List<String>?): String? = value?.joinToString(",")
    
    @TypeConverter
    fun toStringList(value: String?): List<String>? = 
        value?.takeIf { it.isNotEmpty() }?.split(",")
}
