package com.flatmates.app.data.local.database

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

/**
 * Database migrations for FlatmatesDatabase.
 * 
 * When making schema changes:
 * 1. Increment the database version in FlatmatesDatabase
 * 2. Create a new migration object here
 * 3. Add the migration to the Room.databaseBuilder in DatabaseModule
 */
object DatabaseMigrations {
    
    // Placeholder for future migrations
    // Example:
    // val MIGRATION_1_2 = object : Migration(1, 2) {
    //     override fun migrate(db: SupportSQLiteDatabase) {
    //         db.execSQL("ALTER TABLE todos ADD COLUMN new_column TEXT")
    //     }
    // }
    
    /**
     * Get all migrations in order.
     */
    fun getAllMigrations(): Array<Migration> = arrayOf(
        // Add migrations here as they are created
        // MIGRATION_1_2,
        // MIGRATION_2_3,
    )
}
