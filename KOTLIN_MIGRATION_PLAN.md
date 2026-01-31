# Flatmates App: Native Kotlin Migration & Local-First Architecture Plan

## Executive Summary

This document outlines a comprehensive plan to migrate the Flatmates App from React Native/Expo to **native Android using Kotlin**, while implementing a **local-first architecture** that minimizes backend dependency. The goal is to create a fast, reliable, offline-capable app with optional cloud sync.

> ⚠️ **IMPORTANT: Multi-User Collaboration Reality Check**
> 
> This app is fundamentally a **collaborative household app**. While local-first works great for single-user features, **multi-user scenarios require careful sync design**. See [Section 8: Multi-User Sync Challenges](#8-multi-user-sync-challenges) for honest assessment.

---

## Table of Contents

1. [Current Architecture Analysis](#1-current-architecture-analysis)
2. [Why Kotlin/Native Android?](#2-why-kotlinnative-android)
3. [Local-First Architecture Strategy](#3-local-first-architecture-strategy)
4. [Backend Dependency Analysis](#4-backend-dependency-analysis)
5. [Proposed Native Architecture](#5-proposed-native-architecture)
6. [Technology Stack Recommendations](#6-technology-stack-recommendations)
7. [Data Layer Design](#7-data-layer-design)
8. [Multi-User Sync Challenges](#8-multi-user-sync-challenges)
9. [Sync Strategy](#9-sync-strategy)
10. [Migration Phases](#10-migration-phases)
11. [Risks and Mitigations](#11-risks-and-mitigations)
12. [Timeline Estimates](#12-timeline-estimates)
13. [Cost Optimization Strategy](#13-cost-optimization-strategy-azure-container-apps--neon-db)
14. [AI Agent Execution Plan](#14-ai-agent-execution-plan)
15. [Appendix: Key Decisions](#appendix-key-decisions)

---

## 1. Current Architecture Analysis

### Mobile App (React Native + Expo)
- **Framework**: React Native 0.81.5 with Expo ~54.0
- **Language**: TypeScript
- **State Management**: Redux Toolkit with Redux Persist
- **UI**: React Native Paper (Material Design 3)
- **Navigation**: Expo Router (file-based)
- **Storage**: AsyncStorage (via Redux Persist)
- **Auth**: Google Sign-In (@react-native-google-signin)

### Current Data Models
| Entity | Description |
|--------|-------------|
| **User** | Google OAuth users with profile info |
| **Household** | Groups/homes with members |
| **HouseholdMember** | User-household relationships with roles |
| **HouseholdInvite** | Email-based invite tokens |
| **Todo** | Tasks with priorities, assignments, recurring |
| **ShoppingList** | Collaborative shopping lists |
| **ShoppingListItem** | Individual items with categories |
| **Expense** | Shared/personal expenses with splits |
| **ExpenseSplit** | Per-user expense allocations |

### Existing Local Storage (Partial Implementation)
The app already has a `localDataService.ts` that provides offline CRUD for:
- Todos
- Shopping Lists & Items
- Expenses

**Key Observation**: The app already uses Redux Persist for offline caching, indicating partial local-first readiness.

### Backend (FastAPI + PostgreSQL)
- **Authentication**: Google OAuth token verification, JWT issuance
- **AI Features**: Expense categorization, Receipt OCR, Task suggestions (Gemini/OpenAI)
- **Data Storage**: PostgreSQL with SQLAlchemy ORM
- **API**: RESTful endpoints for all entities

---

## 2. Why Kotlin/Native Android?

### Benefits of Native Kotlin Over React Native

| Aspect | React Native | Native Kotlin |
|--------|--------------|---------------|
| **Performance** | JS bridge overhead, slower startup | Direct hardware access, faster |
| **App Size** | ~40-60MB (with Hermes) | ~10-25MB |
| **Battery Usage** | Higher due to JS runtime | Optimized native APIs |
| **Database** | AsyncStorage (limited) | Room (SQLite with type safety) |
| **Background Sync** | Limited, unreliable | WorkManager (reliable) |
| **Offline Support** | Possible but hacky | First-class support |
| **UI Polish** | Good but not native feel | True Material You design |
| **Updates** | OTA possible (Expo) | Play Store only |
| **Maintenance** | Dependency hell frequent | More stable ecosystem |

### Modern Kotlin Advantages

1. **Kotlin Multiplatform (KMP)** - Future iOS support with shared business logic
2. **Jetpack Compose** - Declarative UI (similar DX to React)
3. **Coroutines + Flow** - Native async/reactive programming
4. **Room Database** - Type-safe SQLite with compile-time verification
5. **Hilt/Koin** - Mature dependency injection
6. **WorkManager** - Reliable background processing

### When Native May NOT Be Best
- If iOS is equally important (consider KMP or Flutter)
- If rapid iteration with OTA updates is critical
- If team only knows JavaScript/TypeScript

---

## 3. Local-First Architecture Strategy

### Core Principles

```
┌─────────────────────────────────────────────────────────────┐
│                    LOCAL-FIRST PHILOSOPHY                   │
├─────────────────────────────────────────────────────────────┤
│ 1. Data lives on device FIRST (single source of truth)     │
│ 2. App works 100% offline (no loading spinners)            │
│ 3. Sync is opportunistic, not blocking                     │
│ 4. Conflicts are handled gracefully                        │
│ 5. Backend is optional (for sync/backup/sharing)           │
└─────────────────────────────────────────────────────────────┘
```

### What Can Be Fully Local

| Feature | Local Feasibility | Notes |
|---------|-------------------|-------|
| Todos | ✅ 100% Local | CRUD, filtering, recurring |
| Shopping Lists | ✅ 100% Local | Items, categories, positions |
| Personal Expenses | ✅ 100% Local | Tracking, categories, analytics |
| User Preferences | ✅ 100% Local | Theme, notifications, defaults |
| Categories | ✅ 100% Local | Custom categories per household |

### What Requires Backend (Minimal)

| Feature | Why Backend Needed | Solution |
|---------|-------------------|----------|
| **Google OAuth** | Identity verification | Use once, cache credentials locally |
| **Household Sync** | Multi-user collaboration | Sync when online, queue changes offline |
| **Expense Splitting** | Settlement calculations | Calculate locally, sync settlements |
| **Invites** | Email delivery | Queue invite, send when online |
| **AI Features** | Requires API calls | Optional enhancement, not core |

### Local-First Data Flow

```
┌────────────────────────────────────────────────────────────────┐
│                         USER ACTION                            │
│                     (Create/Update/Delete)                     │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                    LOCAL DATABASE (Room)                       │
│              Immediate write, instant UI update                │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      SYNC QUEUE                                │
│           Record change with timestamp + operation type        │
└─────────────────────────────┬──────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                 BACKGROUND SYNC (WorkManager)                  │
│      When online: push queued changes, pull remote updates     │
└────────────────────────────────────────────────────────────────┘
```

---

## 4. Backend Dependency Analysis

### Current Backend Endpoints

```
/api/v1/
├── auth/
│   └── google/mobile     → Google token verification, JWT issue
├── users/
│   └── me                → Get/update current user
├── households/
│   ├── /                 → Create, list households
│   ├── /{id}             → Get, update, delete household
│   ├── /{id}/members     → List, add, remove members
│   └── /{id}/invites     → Create, accept invites
├── todos/
│   ├── /                 → CRUD todos (filtered by household)
│   └── /stats            → Todo statistics
├── shopping/
│   ├── lists/            → CRUD shopping lists
│   └── items/            → CRUD shopping items
├── expenses/
│   ├── /                 → CRUD expenses
│   ├── /summary          → Expense summaries
│   ├── /ai/categorize    → AI categorization
│   └── /ai/ocr           → Receipt scanning
└── health                → Health check
```

### Backend Dependency Classification

#### 🔴 REQUIRED (Cannot Remove)
1. **Google OAuth Verification** - Initial login only
2. **Household Member Sync** - For collaborative features
3. **Invite Token Generation** - Email-based invites

#### 🟡 OPTIONAL (Nice to Have)
1. **AI Categorization** - Can use local heuristics instead
2. **Receipt OCR** - Can use on-device ML Kit
3. **Push Notifications** - Firebase/local notifications

#### 🟢 CAN BE LOCAL (Full Offline)
1. **All CRUD Operations** - Todos, Shopping, Expenses
2. **Statistics/Analytics** - Calculate from local data
3. **User Preferences** - Stored locally
4. **Recurring Tasks** - Generated locally

---

## 5. Proposed Native Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         UI LAYER                                │
│                     Jetpack Compose                             │
│                                                                 │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│   │  Home    │ │  Todos   │ │ Shopping │ │ Expenses │          │
│   └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘          │
└────────┼────────────┼────────────┼────────────┼─────────────────┘
         │            │            │            │
         └────────────┴────────────┴────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VIEWMODEL LAYER                            │
│              StateFlow, Coroutines, Hilt Injection              │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REPOSITORY LAYER                           │
│           Single Source of Truth, Offline-First Logic           │
└───────────────┬─────────────────────────────┬───────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌────────────────────────────────┐
│    LOCAL DATA SOURCE      │   │     REMOTE DATA SOURCE         │
│    Room Database          │   │     Retrofit + OkHttp          │
│    DataStore (Prefs)      │   │     (Optional Sync)            │
└───────────────────────────┘   └────────────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────────────────────────────────────┐
│                      SYNC ENGINE                               │
│           WorkManager + Conflict Resolution                    │
└───────────────────────────────────────────────────────────────┘
```

### Package Structure

```
com.flatmates.app/
├── di/                          # Dependency Injection (Hilt)
│   ├── AppModule.kt
│   ├── DatabaseModule.kt
│   └── NetworkModule.kt
│
├── data/
│   ├── local/
│   │   ├── database/
│   │   │   ├── FlatmatesDatabase.kt
│   │   │   ├── dao/
│   │   │   │   ├── TodoDao.kt
│   │   │   │   ├── ShoppingDao.kt
│   │   │   │   ├── ExpenseDao.kt
│   │   │   │   └── HouseholdDao.kt
│   │   │   └── entities/
│   │   │       ├── TodoEntity.kt
│   │   │       ├── ShoppingListEntity.kt
│   │   │       └── ...
│   │   └── datastore/
│   │       └── UserPreferences.kt
│   │
│   ├── remote/
│   │   ├── api/
│   │   │   └── FlatmatesApi.kt
│   │   └── dto/
│   │       └── ...
│   │
│   ├── repository/
│   │   ├── TodoRepository.kt
│   │   ├── ShoppingRepository.kt
│   │   ├── ExpenseRepository.kt
│   │   └── AuthRepository.kt
│   │
│   └── sync/
│       ├── SyncManager.kt
│       ├── SyncWorker.kt
│       └── ConflictResolver.kt
│
├── domain/
│   ├── model/
│   │   ├── Todo.kt
│   │   ├── ShoppingList.kt
│   │   ├── Expense.kt
│   │   └── ...
│   └── usecase/
│       ├── todo/
│       ├── shopping/
│       └── expense/
│
├── ui/
│   ├── theme/
│   │   └── Theme.kt
│   ├── navigation/
│   │   └── NavGraph.kt
│   ├── screens/
│   │   ├── home/
│   │   ├── todos/
│   │   ├── shopping/
│   │   ├── expenses/
│   │   └── profile/
│   └── components/
│       └── common/
│
└── util/
    ├── DateUtils.kt
    ├── CurrencyUtils.kt
    └── Extensions.kt
```

---

## 6. Technology Stack Recommendations

### Core Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Language** | Kotlin 1.9+ | Modern, null-safe, coroutines |
| **UI** | Jetpack Compose | Declarative, reactive, Material 3 |
| **Navigation** | Navigation Compose | Type-safe, official solution |
| **DI** | Hilt | Official Android DI, lifecycle-aware |
| **Database** | Room 2.6+ | SQLite with type safety, Flow support |
| **Preferences** | DataStore | Replace SharedPreferences, async |
| **Networking** | Retrofit + OkHttp | Industry standard, interceptors |
| **Serialization** | Kotlinx Serialization | Kotlin-native, fast |
| **Async** | Coroutines + Flow | Structured concurrency, reactive |
| **Background** | WorkManager | Guaranteed execution, constraints |

### Additional Libraries

| Purpose | Library | Notes |
|---------|---------|-------|
| **Image Loading** | Coil | Kotlin-first, Compose support |
| **Auth** | Google Sign-In | Official Google library |
| **Analytics** | Firebase (optional) | If needed |
| **OCR (Local)** | ML Kit | On-device text recognition |
| **Date/Time** | kotlinx-datetime | Multiplatform-ready |
| **Testing** | JUnit5, Turbine, MockK | Modern test stack |

---

## 7. Data Layer Design

### Room Database Schema

```kotlin
@Entity(tableName = "todos")
data class TodoEntity(
    @PrimaryKey val id: String,
    val householdId: String,
    val title: String,
    val description: String?,
    val status: TodoStatus,
    val priority: TodoPriority,
    val dueDate: Long?,
    val assignedToId: String?,
    val createdBy: String,
    val recurringPattern: String?,
    val completedAt: Long?,
    val createdAt: Long,
    val updatedAt: Long,
    
    // Sync metadata
    val syncStatus: SyncStatus = SyncStatus.SYNCED,
    val locallyModifiedAt: Long? = null,
    val remoteVersion: Int = 0
)

enum class SyncStatus {
    SYNCED,          // In sync with server
    PENDING_CREATE,  // Created locally, not yet synced
    PENDING_UPDATE,  // Modified locally, not yet synced
    PENDING_DELETE,  // Deleted locally, not yet synced
    CONFLICT         // Conflict detected during sync
}
```

### Sync Queue Table

```kotlin
@Entity(tableName = "sync_queue")
data class SyncQueueEntry(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val entityType: String,      // "todo", "expense", etc.
    val entityId: String,
    val operation: SyncOperation,
    val payload: String,         // JSON of the change
    val createdAt: Long,
    val retryCount: Int = 0,
    val lastError: String? = null
)

enum class SyncOperation {
    CREATE, UPDATE, DELETE
}
```

### Repository Pattern Example

```kotlin
class TodoRepository(
    private val todoDao: TodoDao,
    private val syncQueue: SyncQueueDao,
    private val api: FlatmatesApi,
    private val syncManager: SyncManager
) {
    // Local-first: Always read from local
    fun getTodos(householdId: String): Flow<List<Todo>> =
        todoDao.getTodosByHousehold(householdId)
            .map { entities -> entities.map { it.toDomain() } }
    
    // Write to local, queue for sync
    suspend fun createTodo(todo: Todo): Result<Todo> {
        val entity = todo.toEntity().copy(
            syncStatus = SyncStatus.PENDING_CREATE
        )
        todoDao.insert(entity)
        syncQueue.enqueue(SyncQueueEntry(
            entityType = "todo",
            entityId = entity.id,
            operation = SyncOperation.CREATE,
            payload = entity.toJson()
        ))
        syncManager.requestSync() // Trigger background sync
        return Result.success(entity.toDomain())
    }
}
```

---

## 8. Multi-User Sync Challenges

> ⚠️ **This section is critical** - Local-first works great for single-user apps, but Flatmates is fundamentally collaborative. Here's an honest assessment.

### The Core Problem

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLATMATES = COLLABORATION                   │
├─────────────────────────────────────────────────────────────────┤
│  • 3 flatmates share ONE shopping list                         │
│  • Alice adds "Milk" offline                                   │
│  • Bob adds "Milk" offline (same time)                         │
│  • Charlie checks off "Eggs" offline                           │
│  • All sync at once → CONFLICTS!                               │
└─────────────────────────────────────────────────────────────────┘
```

### Scenario Analysis

| Feature | Multi-User Complexity | Can Be Local-First? |
|---------|----------------------|---------------------|
| **Personal Todos** | Low | ✅ Yes, fully |
| **Shared Todos** | Medium | ⚠️ Needs sync |
| **Shopping Lists** | High (real-time needed) | ⚠️ Needs frequent sync |
| **Expense Tracking** | Medium | ⚠️ Needs sync |
| **Expense Splitting** | Very High (money!) | ❌ Server authoritative |
| **Settlements** | Very High | ❌ Server must validate |
| **Household Members** | High | ❌ Server authoritative |

### Specific Multi-User Challenges

#### 1. Shopping List Race Conditions
```
PROBLEM: Two flatmates add items simultaneously while offline

Alice's Phone (Offline):
  - Adds "Milk" at position 5
  - Adds "Bread" at position 6

Bob's Phone (Offline):
  - Adds "Eggs" at position 5
  - Marks "Butter" as purchased

When both sync:
  - Position conflicts
  - Potential duplicates
  - Purchased status conflicts
```

**Solution Options**:
| Option | Pros | Cons |
|--------|------|------|
| Last-write-wins | Simple | Loses data |
| Server merge | Preserves all | Complex logic |
| CRDTs | No conflicts | Overkill, complex |
| Real-time sync | Best UX | Needs WebSocket, backend |

**Recommendation**: Server-side merge with conflict detection UI

#### 2. Expense Split Calculations
```
PROBLEM: Expenses require split calculations across all household members

Current Backend Logic:
  1. Get ALL household members from server
  2. Calculate equal/custom splits
  3. Create ExpenseSplit records per user
  4. Track who has settled

This CANNOT be fully local because:
  - You don't know all members (one might have joined while you're offline)
  - Split amounts must be consistent across all users' apps
  - Settlement status must be authoritative
```

**Solution**: **Server is the source of truth for expense splits**
```
LOCAL: Create expense with amount, description, category
       ↓ (sync)
SERVER: Calculate splits based on current members
       ↓ (sync back)
LOCAL: Receive expense WITH split assignments
```

#### 3. Household Membership Changes
```
PROBLEM: User joins/leaves household while others are offline

Scenario:
  - David leaves the household
  - Alice (offline) assigns a todo to David
  - Alice syncs → Invalid assignment!
```

**Solution**: 
- Validate assignments on server
- Return errors for invalid references
- UI shows "Member no longer in household"

#### 4. Real-Time Expectations
```
PROBLEM: Users expect to see each other's changes quickly

Shopping List UX Expectation:
  - Alice adds "Milk"
  - Bob sees it within seconds (not next sync)
  
Without real-time, users will:
  - Buy duplicate items
  - Miss task updates
  - Have outdated expense views
```

**Options**:
| Approach | Backend Load | User Experience |
|----------|--------------|-----------------|
| Poll every 30s | Medium | Acceptable |
| Poll every 5s | High | Good |
| WebSocket | Low (persistent) | Best |
| Push notifications trigger pull | Low | Good |

**Recommendation**: Push notification triggers immediate sync pull

### What This Means for "Local-First"

#### ✅ CAN Be Truly Local-First
- **Personal expenses** (is_personal=true)
- **Draft items** (not yet shared)
- **User preferences**
- **Offline viewing** of cached data
- **UI/theme settings**

#### ⚠️ Local-First with Background Sync
- **Todos** (with conflict resolution)
- **Shopping list items** (with merge logic)
- **Expense creation** (splits calculated on sync)

#### ❌ MUST Be Server-Authoritative
- **Expense split calculations** (money accuracy)
- **Settlement status** (both parties must agree)
- **Household membership** (security)
- **Invite acceptance** (validation)

### Recommended Hybrid Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     HYBRID LOCAL-FIRST                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   TIER 1: FULLY LOCAL                                          │
│   ├── User preferences                                          │
│   ├── Draft/personal items                                      │
│   └── UI state                                                  │
│                                                                 │
│   TIER 2: LOCAL + SYNC                                         │
│   ├── Todos (local write, background sync)                     │
│   ├── Shopping items (local write, merge on sync)              │
│   └── Expense metadata (local, splits from server)             │
│                                                                 │
│   TIER 3: SERVER-FIRST                                         │
│   ├── Expense splits → Server calculates                       │
│   ├── Settlements → Server validates                           │
│   ├── Household members → Server authoritative                 │
│   └── Invites → Server sends email                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Sync Frequency Recommendations

| Feature | Sync Strategy | Frequency |
|---------|--------------|-----------|
| Shopping Lists | Push notification + pull | Real-time |
| Todos | Background sync | Every 5 min |
| Expenses | Background sync | Every 15 min |
| Settlements | On-demand | User initiated |
| Household | On app open | Once per session |

### Conflict Resolution UI

Users MUST be informed of conflicts:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Sync Conflict Detected                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  "Buy Groceries" was modified by both you and Alice            │
│                                                                 │
│  Your version:                   Alice's version:              │
│  ┌─────────────────────┐         ┌─────────────────────┐       │
│  │ Status: Completed   │         │ Status: In Progress │       │
│  │ Due: Today          │         │ Due: Tomorrow       │       │
│  └─────────────────────┘         └─────────────────────┘       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Keep Mine    │  │ Keep Theirs  │  │   Merge      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Bottom Line: Will It Work for Multiple People?

**YES, but with caveats:**

| Aspect | Assessment |
|--------|------------|
| **Offline single-user** | ✅ Works perfectly |
| **Online multi-user** | ✅ Works with proper sync |
| **Offline multi-user** | ⚠️ Works with conflict resolution |
| **Real-time collaboration** | ⚠️ Needs push notifications or WebSocket |
| **Money features** | ⚠️ Server must be authoritative |

**Key Requirements for Multi-User Success**:
1. ✅ Robust conflict resolution (not just last-write-wins)
2. ✅ Clear sync status indicators in UI
3. ✅ Push notifications for immediate sync triggers
4. ✅ Server-authoritative expense splits
5. ✅ Offline queue with retry logic
6. ✅ User-friendly conflict resolution UI

---

## 9. Sync Strategy

### Conflict Resolution Policies

| Scenario | Strategy |
|----------|----------|
| **Same field, same time** | Last-write-wins with timestamp |
| **Different fields** | Merge changes |
| **Delete vs Update** | Delete wins (configurable) |
| **Expense splits** | Server is authoritative (money matters) |

### Sync Flow

```
1. APP STARTS
   │
   └──► Check last sync time
         │
         ├──► If > 5 minutes: Queue background sync
         └──► If > 24 hours: Force sync on next network
         
2. USER MAKES CHANGE
   │
   ├──► Write to Room immediately
   ├──► Add to sync queue
   └──► Trigger WorkManager (with network constraint)
   
3. BACKGROUND SYNC (WorkManager)
   │
   ├──► Process sync queue (oldest first)
   │     │
   │     ├──► POST/PUT/DELETE to server
   │     ├──► On success: Remove from queue, update syncStatus
   │     └──► On conflict: Mark CONFLICT, notify user
   │
   └──► Pull remote changes
         │
         ├──► Compare timestamps
         └──► Merge or flag conflicts
         
4. PUSH NOTIFICATION RECEIVED
   │
   └──► Trigger immediate pull for affected entity
```

### WorkManager Implementation

```kotlin
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val syncManager: SyncManager
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            syncManager.syncAll()
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure()
            }
        }
    }
}

// Schedule periodic sync
val syncRequest = PeriodicWorkRequestBuilder<SyncWorker>(
    repeatInterval = 15, 
    repeatIntervalTimeUnit = TimeUnit.MINUTES
).setConstraints(
    Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .setRequiresBatteryNotLow(true)
        .build()
).build()

WorkManager.getInstance(context)
    .enqueueUniquePeriodicWork(
        "flatmates_sync",
        ExistingPeriodicWorkPolicy.KEEP,
        syncRequest
    )
```

---

## 10. Migration Phases

### Phase 1: Foundation (Weeks 1-3)
**Goal**: Set up native project structure and local database

- [ ] Create new Android project with Kotlin + Compose
- [ ] Set up Hilt dependency injection
- [ ] Implement Room database with all entities
- [ ] Create DataStore for user preferences
- [ ] Implement dark theme with Material 3
- [ ] Set up navigation structure (5 tabs)

**Deliverable**: Empty app shell with working database

---

### Phase 2: Core Local Features (Weeks 4-6)
**Goal**: Implement full local-first functionality

- [ ] Todo CRUD with local persistence
- [ ] Shopping list management
- [ ] Expense tracking (local only)
- [ ] Local statistics and summaries
- [ ] Recurring task generation
- [ ] Search and filtering

**Deliverable**: Fully functional offline app (single user)

---

### Phase 3: Authentication (Week 7)
**Goal**: Implement Google Sign-In with local caching

- [ ] Google Sign-In integration
- [ ] Token storage in DataStore
- [ ] Offline session persistence
- [ ] Backend JWT exchange (single call)
- [ ] Profile management

**Deliverable**: Working authentication with minimal backend calls

---

### Phase 4: Sync Engine (Weeks 8-10)
**Goal**: Implement background sync and conflict resolution

- [ ] Sync queue implementation
- [ ] WorkManager setup
- [ ] Retrofit API client
- [ ] Conflict resolution logic
- [ ] Sync status indicators in UI
- [ ] Manual sync trigger

**Deliverable**: Full offline + sync capability

---

### Phase 5: Household Features (Weeks 11-12)
**Goal**: Multi-user collaboration

- [ ] Household creation/joining
- [ ] Member management
- [ ] Invite system (email queuing)
- [ ] Role-based permissions
- [ ] Household switching

**Deliverable**: Complete multi-user experience

---

### Phase 6: Polish & Optional Features (Weeks 13-14)
**Goal**: Add nice-to-have features and polish

- [ ] On-device OCR (ML Kit) for receipts
- [ ] Local AI categorization (heuristics/TFLite)
- [ ] Notifications (local + FCM)
- [ ] Widget support
- [ ] App shortcuts
- [ ] Accessibility improvements

**Deliverable**: Production-ready app

---

### Phase 7: Testing & Release (Weeks 15-16)
**Goal**: Comprehensive testing and Play Store release

- [ ] Unit tests (ViewModels, Repositories)
- [ ] Integration tests (Room, Sync)
- [ ] UI tests (Compose)
- [ ] Beta testing
- [ ] Play Store submission
- [ ] Migrate existing users

**Deliverable**: Published app

---

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **iOS users abandoned** | High | Plan Kotlin Multiplatform for Phase 2 |
| **Sync conflicts** | Medium | Strong conflict UI, user control |
| **Learning curve** | Medium | Team training, good documentation |
| **Backend API changes** | Medium | Version API, backward compatibility |
| **Data migration issues** | High | Export/import feature, migration scripts |
| **Play Store rejection** | Low | Follow guidelines, test thoroughly |

---

## 12. Timeline Estimates

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Foundation | 3 weeks | Week 3 |
| Phase 2: Local Features | 3 weeks | Week 6 |
| Phase 3: Authentication | 1 week | Week 7 |
| Phase 4: Sync Engine | 3 weeks | Week 10 |
| Phase 5: Households | 2 weeks | Week 12 |
| Phase 6: Polish | 2 weeks | Week 14 |
| Phase 7: Testing/Release | 2 weeks | Week 16 |

**Total Estimated Time**: 16 weeks (4 months)

**Team Recommendation**: 
- 1 Senior Android Developer (full-time)
- 1 Backend Developer (part-time, sync endpoints)
- 1 Designer (part-time, Compose UI)

---

## 13. Cost Optimization Strategy (Azure Container Apps + Neon DB)

### Current Infrastructure

Your setup is already cost-optimized:

```
┌─────────────────────────────────────────────────────────────────┐
│                   CURRENT DEPLOYMENT                            │
├─────────────────────────────────────────────────────────────────┤
│  Backend: Azure Container Apps (Consumption plan)              │
│           - Scale to 0 when idle = $0                          │
│           - Pay per request + vCPU-second                      │
│           - FREE tier: 180K vCPU-sec, 2M requests/month        │
│                                                                │
│  Database: Neon PostgreSQL (Serverless)                        │
│           - FREE tier: 0.5 GB storage, 3 GB RAM                │
│           - Auto-suspend after 5 min idle                      │
│           - Pay only when queries run                          │
└─────────────────────────────────────────────────────────────────┘
```

### Cost Impact of Local-First Architecture

| Aspect | Before (Current) | After (Local-First) | Savings |
|--------|-----------------|---------------------|---------|
| **API Calls** | Every user action | Only sync batches | ~70-80% |
| **DB Queries** | Per request | Batched sync | ~60-70% |
| **Container Runtime** | Frequent wake-ups | Periodic sync | ~50% |
| **Cold Starts** | Many (scale to 0) | Fewer (batched) | Better UX |

### Estimated Monthly Costs

#### Scenario: 10 Active Flatmates (3 households)

| Cost Component | Current (React Native) | With Local-First Kotlin |
|----------------|----------------------|-------------------------|
| **Azure Container Apps** | ~$3-5/mo | ~$1-2/mo |
| **Neon DB** | FREE tier | FREE tier |
| **Gemini AI (optional)** | ~$0-2/mo | ~$0-1/mo |
| **Total** | **~$3-7/mo** | **~$1-3/mo** |

#### Scenario: 100 Active Users

| Cost Component | Current | With Local-First |
|----------------|---------|------------------|
| **Azure Container Apps** | ~$15-25/mo | ~$5-10/mo |
| **Neon DB** | ~$0-10/mo | ~$0-5/mo |
| **Total** | **~$15-35/mo** | **~$5-15/mo** |

### Specific Cost Optimizations

#### 1. Reduce API Call Frequency

```
BEFORE (Every action hits API):
  User adds todo → POST /api/v1/todos → DB write → Response
  User adds item → POST /api/v1/shopping/items → DB write → Response
  User checks item → PUT /api/v1/shopping/items/{id} → DB write → Response
  
  = 3 API calls, 3 container wake-ups, 3 DB connections

AFTER (Batch sync):
  User adds todo → Local DB
  User adds item → Local DB  
  User checks item → Local DB
  [Background sync every 5 min]
  → Single POST /api/v1/sync with 3 changes
  
  = 1 API call, 1 container wake-up, 1 DB transaction
```

#### 2. Optimize Sync Endpoint

Create a new batched sync endpoint to reduce roundtrips:

```python
# backend/app/api/v1/endpoints/sync.py

@router.post("/sync")
async def batch_sync(
    sync_data: SyncRequest,  # Contains all pending changes
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Single endpoint for all sync operations.
    Reduces API calls from N to 1.
    """
    results = {
        "todos": [],
        "shopping_items": [],
        "expenses": [],
        "server_timestamp": utc_now()
    }
    
    # Process all creates/updates/deletes in single transaction
    for todo in sync_data.todos:
        # Process and add to results
        pass
    
    # Pull changes since last_sync_at
    if sync_data.last_sync_at:
        results["todos"] = get_todos_since(sync_data.last_sync_at)
        # etc.
    
    return results
```

#### 3. Reduce Container Wake-ups

| Strategy | Implementation |
|----------|---------------|
| **Batch notifications** | Collect 5 min of changes, single push |
| **Client-side aggregation** | Queue changes, sync every 5-15 min |
| **Conditional sync** | Only sync if pending changes exist |
| **Smart scheduling** | Avoid sync during sleep hours |

#### 4. Minimize Neon DB Costs

Neon charges for:
- Compute time (when queries run)
- Storage (persistent)
- Data transfer

Optimizations:
```
┌────────────────────────────────────────────────────────────────┐
│  NEON DB OPTIMIZATION                                          │
├────────────────────────────────────────────────────────────────┤
│  ✅ Keep data local → fewer DB queries                        │
│  ✅ Batch writes → single transaction vs many                 │
│  ✅ Use Neon's auto-suspend → no cost when idle               │
│  ✅ Clean up old data → reduce storage                        │
│  ✅ Efficient queries → faster = cheaper                      │
└────────────────────────────────────────────────────────────────┘
```

#### 5. Optional: Move AI to On-Device

Current AI costs (Gemini API):
- Expense categorization: ~$0.001/request
- Receipt OCR: ~$0.005/request

Local alternatives (FREE):
| Feature | Cloud API | On-Device Alternative |
|---------|-----------|----------------------|
| Expense categorization | Gemini | Keyword matching + TFLite model |
| Receipt OCR | Gemini Vision | ML Kit Text Recognition |
| Task suggestions | Gemini | Rule-based heuristics |

### Recommended Architecture for Cost Efficiency

```
┌─────────────────────────────────────────────────────────────────┐
│                    COST-OPTIMIZED ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MOBILE APP (Kotlin)                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Room DB (Primary)    →  All data lives here            │   │
│  │  ML Kit (OCR)         →  Free on-device                 │   │
│  │  WorkManager          →  Batched sync every 5-15 min    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              │ Single batched sync call         │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Azure Container Apps (scales to 0)                     │   │
│  │  POST /api/v1/sync  →  All changes in one request       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              │ Single DB transaction            │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Neon PostgreSQL (auto-suspends)                        │   │
│  │  Batched writes = minimal compute time                  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Push Notifications (Cost-Effective)

For multi-user sync notifications:

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| **Firebase Cloud Messaging** | FREE | Reliable, works with scale-to-0 | Google dependency |
| **Azure Notification Hubs** | FREE tier (1M pushes) | Azure native | More setup |
| **OneSignal** | FREE tier (10K users) | Easy setup | Third party |

**Recommendation**: Use FCM - it's free and can wake your app to trigger sync without waking the container.

```
User A makes change → Sync to server → Server sends FCM to User B
                                        ↓
User B's app receives FCM → Triggers sync → Pulls changes
                           (Container already awake from User A's sync!)
```

### Cost Monitoring

Add these to track spending:

1. **Azure Cost Management**: Set budget alerts at $5, $10, $20
2. **Neon Dashboard**: Monitor compute hours
3. **App Analytics**: Track sync frequency per user

### Summary: Expected Cost Savings

| Traffic Level | Current | With Local-First | Savings |
|---------------|---------|------------------|---------|
| **Low (10 users)** | $3-7/mo | $1-3/mo | ~50-60% |
| **Medium (100 users)** | $15-35/mo | $5-15/mo | ~55-65% |
| **High (1000 users)** | $100-200/mo | $30-70/mo | ~60-70% |

**The local-first approach is not just about offline support - it's a significant cost optimization strategy for pay-per-use infrastructure like Azure Container Apps + Neon DB.**

---

## 14. AI Agent Execution Plan

> 🤖 **This section is specifically designed for AI agent execution (GitHub Copilot Coding Agent or similar)**

### Overview

The implementation will be split into **6 parallel-safe task groups** that can be executed by AI agents. Each group has clear inputs, outputs, and success criteria.

### Current Issues to Fix
1. **Backend API errors** - Connection handling, error responses, Neon DB cold starts
2. **Reliability** - Proper error handling, retries, health checks
3. **Testing** - Comprehensive test coverage

### Design System: TickTick-Inspired

```
┌─────────────────────────────────────────────────────────────────┐
│                    DESIGN SPECIFICATIONS                        │
├─────────────────────────────────────────────────────────────────┤
│  Primary Color:    #4772FA (TickTick Blue)                     │
│  Background:       #F8F9FA (Light) / #121212 (Dark)            │
│  Surface:          #FFFFFF (Light) / #1E1E1E (Dark)            │
│  Text Primary:     #1A1A1A (Light) / #E6E6E6 (Dark)            │
│  Text Secondary:   #757575 (Light) / #B3B3B3 (Dark)            │
│                                                                 │
│  Priority Colors:                                               │
│  - High:   #F44336 (Red)                                       │
│  - Medium: #FF9800 (Orange)                                    │
│  - Low:    #2196F3 (Blue)                                      │
│  - None:   #9E9E9E (Gray)                                      │
│                                                                 │
│  Corner Radius:    12.dp (cards), 16.dp (chips)                │
│  Screen Padding:   16.dp                                        │
│  FAB Size:         56.dp                                        │
│                                                                 │
│  Typography: System (Roboto on Android)                         │
│  - Title: 20sp SemiBold                                        │
│  - Body: 16sp Regular                                          │
│  - Label: 12sp Medium                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

### Task Group Execution Order

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION PHASES                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PHASE 1: Can run in PARALLEL                                  │
│  ┌─────────────────┐  ┌─────────────────┐                      │
│  │ Task 1: Backend │  │ Task 2: Android │                      │
│  │ Reliability Fix │  │ Project Setup   │                      │
│  └────────┬────────┘  └────────┬────────┘                      │
│           │                    │                                │
│           └────────────────────┘                                │
│                    │                                            │
│  PHASE 2: After Task 2 completes                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Task 3: Core    │  │ Task 4: UI      │  │ Task 5: Data    │ │
│  │ Domain Models   │  │ Theme + Design  │  │ Layer (Room)    │ │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘ │
│           │                    │                    │           │
│           └────────────────────┴────────────────────┘           │
│                    │ (Can run in PARALLEL)                      │
│                    │                                            │
│  PHASE 3: After Phase 2 completes                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Task 6: Feature Screens                │   │
│  │  (Todos, Shopping, Expenses, Household, Profile)        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                    │                                            │
│  PHASE 4: After all complete                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Task 7: Sync + Auth                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                    │                                            │
│  PHASE 5: Final                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Task 8: Testing + Polish               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### TASK 1: Backend Reliability Fix

**Can run in parallel with**: Task 2
**Estimated time**: 2-3 hours

#### Prompt for AI Agent:

```
You are fixing reliability issues in a FastAPI backend deployed on Azure Container Apps with Neon PostgreSQL (serverless).

CURRENT ISSUES:
1. API errors (500s, timeouts)
2. Neon DB cold start delays (can take 2-5 seconds)
3. Missing proper error handling
4. No retry logic for transient failures

REPOSITORY: /workspaces/flatmates-app
BACKEND PATH: /workspaces/flatmates-app/backend

TASKS:
1. Add database connection retry logic in app/core/database.py:
   - Add connection pool settings for serverless DB
   - Add retry with exponential backoff for Neon cold starts
   - Set pool_pre_ping=True, pool_recycle=300

2. Add proper error handling in app/main.py:
   - Global exception handler that returns JSON errors
   - Request ID tracking for debugging
   - Proper CORS for mobile app

3. Update all endpoints in app/api/v1/endpoints/:
   - Add try/except with proper HTTP error responses
   - Add request validation
   - Add timeout handling

4. Add health check improvements:
   - Deep health check that tests DB connection
   - Return DB latency in health response

5. Add database retry decorator in app/core/database.py:
   ```python
   from tenacity import retry, stop_after_attempt, wait_exponential
   
   @retry(
       stop=stop_after_attempt(3),
       wait=wait_exponential(multiplier=1, min=1, max=10)
   )
   def get_db_with_retry():
       ...
   ```

6. Update requirements.txt to add:
   - tenacity (for retries)
   
7. Add comprehensive tests in tests/:
   - Test health endpoint
   - Test error handling
   - Test retry logic (mock DB failures)

SUCCESS CRITERIA:
- All tests pass
- Health endpoint returns {"status": "healthy", "database": "connected", "latency_ms": X}
- API errors return proper JSON with error codes
- DB connection survives Neon cold starts

DO NOT:
- Change the API contract (keep same endpoints/responses)
- Remove any existing functionality
- Modify the database schema
```

---

### TASK 2: Android Project Setup

**Can run in parallel with**: Task 1
**Estimated time**: 1-2 hours

#### Prompt for AI Agent:

```
You are creating a new native Android project using Kotlin and Jetpack Compose.

REPOSITORY: /workspaces/flatmates-app
CREATE NEW FOLDER: /workspaces/flatmates-app/android-app

PROJECT SPECIFICATIONS:
- Package name: com.flatmates.app
- Min SDK: 26 (Android 8.0)
- Target SDK: 34 (Android 14)
- Kotlin version: 1.9.22
- Compose BOM: 2024.02.00

TASKS:
1. Create the Android project structure:
   ```
   android-app/
   ├── app/
   │   ├── build.gradle.kts
   │   ├── proguard-rules.pro
   │   └── src/
   │       ├── main/
   │       │   ├── AndroidManifest.xml
   │       │   ├── kotlin/com/flatmates/app/
   │       │   │   ├── FlatmatesApplication.kt
   │       │   │   └── MainActivity.kt
   │       │   └── res/
   │       │       ├── values/
   │       │       │   ├── strings.xml
   │       │       │   ├── colors.xml
   │       │       │   └── themes.xml
   │       │       ├── mipmap-*/ (app icons)
   │       │       └── drawable/
   │       ├── test/
   │       └── androidTest/
   ├── build.gradle.kts (project level)
   ├── settings.gradle.kts
   ├── gradle.properties
   └── gradle/
       └── wrapper/
   ```

2. Configure dependencies in app/build.gradle.kts:
   ```kotlin
   dependencies {
       // Compose
       implementation(platform("androidx.compose:compose-bom:2024.02.00"))
       implementation("androidx.compose.ui:ui")
       implementation("androidx.compose.ui:ui-graphics")
       implementation("androidx.compose.ui:ui-tooling-preview")
       implementation("androidx.compose.material3:material3")
       implementation("androidx.activity:activity-compose:1.8.2")
       implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
       implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
       
       // Navigation
       implementation("androidx.navigation:navigation-compose:2.7.7")
       
       // Room (local database)
       implementation("androidx.room:room-runtime:2.6.1")
       implementation("androidx.room:room-ktx:2.6.1")
       ksp("androidx.room:room-compiler:2.6.1")
       
       // DataStore (preferences)
       implementation("androidx.datastore:datastore-preferences:1.0.0")
       
       // Hilt (dependency injection)
       implementation("com.google.dagger:hilt-android:2.50")
       ksp("com.google.dagger:hilt-android-compiler:2.50")
       implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
       
       // Retrofit (networking)
       implementation("com.squareup.retrofit2:retrofit:2.9.0")
       implementation("com.squareup.retrofit2:converter-kotlinx-serialization:2.9.0")
       implementation("com.squareup.okhttp3:okhttp:4.12.0")
       implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
       
       // Kotlinx Serialization
       implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.2")
       
       // Kotlinx DateTime
       implementation("org.jetbrains.kotlinx:kotlinx-datetime:0.5.0")
       
       // WorkManager (background sync)
       implementation("androidx.work:work-runtime-ktx:2.9.0")
       implementation("androidx.hilt:hilt-work:1.1.0")
       ksp("androidx.hilt:hilt-compiler:1.1.0")
       
       // Google Sign-In
       implementation("com.google.android.gms:play-services-auth:20.7.0")
       
       // Coil (image loading)
       implementation("io.coil-kt:coil-compose:2.5.0")
       
       // Testing
       testImplementation("junit:junit:4.13.2")
       testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
       testImplementation("app.cash.turbine:turbine:1.0.0")
       testImplementation("io.mockk:mockk:1.13.9")
       androidTestImplementation("androidx.test.ext:junit:1.1.5")
       androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
       androidTestImplementation(platform("androidx.compose:compose-bom:2024.02.00"))
       androidTestImplementation("androidx.compose.ui:ui-test-junit4")
       debugImplementation("androidx.compose.ui:ui-tooling")
       debugImplementation("androidx.compose.ui:ui-test-manifest")
   }
   ```

3. Configure Hilt in FlatmatesApplication.kt:
   ```kotlin
   @HiltAndroidApp
   class FlatmatesApplication : Application()
   ```

4. Create basic MainActivity.kt with Compose setup

5. Add Internet permission in AndroidManifest.xml

6. Create .gitignore for Android project

SUCCESS CRITERIA:
- Project builds successfully with `./gradlew build`
- App launches showing blank screen (placeholder)
- All dependencies resolve correctly
- Hilt is properly configured

DO NOT:
- Add any UI screens yet (just placeholder)
- Add any business logic
- Connect to backend
```

---

### TASK 3: Core Domain Models

**Depends on**: Task 2 completed
**Can run in parallel with**: Task 4, Task 5
**Estimated time**: 1-2 hours

#### Prompt for AI Agent:

```
You are implementing domain models for the Flatmates Android app.

REPOSITORY: /workspaces/flatmates-app
ANDROID PATH: /workspaces/flatmates-app/android-app

REFERENCE: Check backend models at /workspaces/flatmates-app/backend/app/models/ for data structure

TASKS:
1. Create domain models in app/src/main/kotlin/com/flatmates/app/domain/model/:
   
   User.kt:
   ```kotlin
   data class User(
       val id: String,
       val email: String,
       val fullName: String,
       val profilePictureUrl: String?,
       val isActive: Boolean = true
   )
   ```
   
   Household.kt, HouseholdMember.kt (with MemberRole enum)
   
   Todo.kt (with TodoStatus and TodoPriority enums)
   
   ShoppingList.kt, ShoppingListItem.kt
   
   Expense.kt, ExpenseSplit.kt (with ExpenseCategory, SplitType, PaymentMethod enums)

2. Create sealed classes for Results in domain/util/:
   ```kotlin
   sealed class Result<out T> {
       data class Success<T>(val data: T) : Result<T>()
       data class Error(val exception: Throwable, val message: String? = null) : Result<Nothing>()
       object Loading : Result<Nothing>()
   }
   ```

3. Create repository interfaces in domain/repository/:
   - TodoRepository
   - ShoppingRepository
   - ExpenseRepository
   - HouseholdRepository
   - AuthRepository

4. Create use cases in domain/usecase/ for:
   - Todo: GetTodos, CreateTodo, UpdateTodo, DeleteTodo, CompleteTodo
   - Shopping: GetShoppingLists, CreateList, AddItem, ToggleItemPurchased
   - Expense: GetExpenses, CreateExpense, GetExpenseSummary
   - Household: GetHouseholds, CreateHousehold, JoinHousehold

SUCCESS CRITERIA:
- All models match backend schema
- Repository interfaces are clean abstractions
- Use cases follow single responsibility principle
- Code compiles without errors

DO NOT:
- Implement repository classes (just interfaces)
- Add UI code
- Add database code
```

---

### TASK 4: UI Theme & Design System

**Depends on**: Task 2 completed
**Can run in parallel with**: Task 3, Task 5
**Estimated time**: 2-3 hours

#### Prompt for AI Agent:

```
You are implementing a TickTick-inspired design system for the Flatmates Android app.

REPOSITORY: /workspaces/flatmates-app
ANDROID PATH: /workspaces/flatmates-app/android-app

DESIGN SPECIFICATIONS (TickTick-inspired, minimalist):

Colors:
- Primary: #4772FA (Blue)
- Background Light: #F8F9FA
- Background Dark: #121212
- Surface Light: #FFFFFF
- Surface Dark: #1E1E1E
- Text Primary Light: #1A1A1A
- Text Primary Dark: #E6E6E6
- Text Secondary: #757575 / #B3B3B3
- Priority High: #F44336
- Priority Medium: #FF9800
- Priority Low: #2196F3
- Error: #F44336
- Success: #4CAF50

TASKS:
1. Create theme in app/src/main/kotlin/com/flatmates/app/ui/theme/:
   
   Color.kt - All color definitions
   
   Type.kt - Typography:
   - HeadlineLarge: 24sp Bold
   - TitleLarge: 20sp SemiBold
   - TitleMedium: 16sp Medium
   - BodyLarge: 16sp Regular
   - BodyMedium: 14sp Regular
   - LabelMedium: 12sp Medium
   
   Theme.kt - Light and Dark themes with Material3
   
   Dimensions.kt:
   ```kotlin
   object Dimensions {
       val screenPadding = 16.dp
       val cardRadius = 12.dp
       val itemSpacing = 8.dp
       val sectionSpacing = 24.dp
       val fabSize = 56.dp
       val iconSizeSmall = 18.dp
       val iconSizeMedium = 24.dp
       val minTouchTarget = 48.dp
   }
   ```

2. Create reusable components in ui/components/:
   
   FlatmatesCard.kt - Styled card with subtle elevation
   
   PriorityCheckbox.kt - Circular checkbox with priority color ring
   
   TaskItem.kt - Task row with checkbox, title, due date, subtask count
   
   SwipeableItem.kt - Swipe-to-complete and swipe-to-delete
   
   EmptyState.kt - Centered icon + message for empty lists
   
   LoadingState.kt - Centered circular progress
   
   ErrorState.kt - Error message with retry button
   
   FlatmatesFAB.kt - Styled floating action button
   
   BottomNavBar.kt - 5-tab navigation (Today, Lists, Expenses, Household, Profile)

3. Create icon resources or use Material Icons

SUCCESS CRITERIA:
- Theme switches correctly between light/dark
- Components look clean and minimal (TickTick-style)
- All components are reusable
- Preview works in Android Studio

DO NOT:
- Implement screens (just components)
- Add business logic
- Connect to data layer
```

---

### TASK 5: Data Layer (Room + Repository)

**Depends on**: Task 2, Task 3 completed
**Can run in parallel with**: Task 4
**Estimated time**: 3-4 hours

#### Prompt for AI Agent:

```
You are implementing the local-first data layer using Room database.

REPOSITORY: /workspaces/flatmates-app
ANDROID PATH: /workspaces/flatmates-app/android-app

REFERENCE: Domain models from /android-app/app/src/main/kotlin/com/flatmates/app/domain/model/

TASKS:
1. Create Room entities in data/local/entity/:
   
   Each entity needs sync metadata:
   ```kotlin
   @Entity(tableName = "todos")
   data class TodoEntity(
       @PrimaryKey val id: String,
       val householdId: String,
       val title: String,
       val description: String?,
       val status: String, // Store enum as string
       val priority: String,
       val dueDate: Long?, // Store as epoch millis
       val assignedToId: String?,
       val createdBy: String,
       val recurringPattern: String?,
       val completedAt: Long?,
       val createdAt: Long,
       val updatedAt: Long,
       // Sync metadata
       val syncStatus: String = "SYNCED", // SYNCED, PENDING_CREATE, PENDING_UPDATE, PENDING_DELETE
       val lastModifiedLocally: Long? = null
   )
   ```
   
   Create: UserEntity, HouseholdEntity, HouseholdMemberEntity, TodoEntity, 
           ShoppingListEntity, ShoppingListItemEntity, ExpenseEntity, ExpenseSplitEntity

2. Create DAOs in data/local/dao/:
   
   TodoDao.kt:
   ```kotlin
   @Dao
   interface TodoDao {
       @Query("SELECT * FROM todos WHERE householdId = :householdId ORDER BY createdAt DESC")
       fun getTodosByHousehold(householdId: String): Flow<List<TodoEntity>>
       
       @Query("SELECT * FROM todos WHERE syncStatus != 'SYNCED'")
       suspend fun getPendingSyncTodos(): List<TodoEntity>
       
       @Insert(onConflict = OnConflictStrategy.REPLACE)
       suspend fun insert(todo: TodoEntity)
       
       @Update
       suspend fun update(todo: TodoEntity)
       
       @Query("DELETE FROM todos WHERE id = :id")
       suspend fun delete(id: String)
       
       @Query("UPDATE todos SET syncStatus = :status WHERE id = :id")
       suspend fun updateSyncStatus(id: String, status: String)
   }
   ```
   
   Create similar DAOs for all entities

3. Create database in data/local/database/:
   
   FlatmatesDatabase.kt:
   ```kotlin
   @Database(
       entities = [
           UserEntity::class,
           HouseholdEntity::class,
           // ... all entities
       ],
       version = 1,
       exportSchema = true
   )
   @TypeConverters(Converters::class)
   abstract class FlatmatesDatabase : RoomDatabase() {
       abstract fun todoDao(): TodoDao
       // ... all DAOs
   }
   ```
   
   Converters.kt for type conversions

4. Create mappers in data/mapper/:
   - TodoMapper.kt (Entity <-> Domain model)
   - Same for all entities

5. Implement repository classes in data/repository/:
   
   TodoRepositoryImpl.kt:
   ```kotlin
   class TodoRepositoryImpl @Inject constructor(
       private val todoDao: TodoDao,
       private val syncQueue: SyncQueueDao
   ) : TodoRepository {
       
       override fun getTodos(householdId: String): Flow<List<Todo>> =
           todoDao.getTodosByHousehold(householdId)
               .map { entities -> entities.map { it.toDomain() } }
       
       override suspend fun createTodo(todo: Todo): Result<Todo> {
           val entity = todo.toEntity().copy(
               syncStatus = "PENDING_CREATE",
               lastModifiedLocally = System.currentTimeMillis()
           )
           todoDao.insert(entity)
           return Result.Success(entity.toDomain())
       }
       // ... other methods
   }
   ```

6. Create sync queue table:
   ```kotlin
   @Entity(tableName = "sync_queue")
   data class SyncQueueEntity(
       @PrimaryKey(autoGenerate = true) val id: Long = 0,
       val entityType: String,
       val entityId: String,
       val operation: String, // CREATE, UPDATE, DELETE
       val payload: String, // JSON
       val createdAt: Long,
       val retryCount: Int = 0
   )
   ```

7. Create Hilt modules in di/:
   - DatabaseModule.kt (provides Database, DAOs)
   - RepositoryModule.kt (binds Repository implementations)

8. Add tests in test/:
   - TodoDaoTest
   - TodoRepositoryTest

SUCCESS CRITERIA:
- Database builds with Room compiler
- All DAOs have proper queries
- Repository implements local-first pattern
- Tests pass

DO NOT:
- Add networking code
- Add UI code
- Implement sync logic (just queue)
```

---

### TASK 6: Feature Screens

**Depends on**: Task 3, 4, 5 completed
**Estimated time**: 4-5 hours

#### Prompt for AI Agent:

```
You are implementing feature screens for the Flatmates Android app.

REPOSITORY: /workspaces/flatmates-app
ANDROID PATH: /workspaces/flatmates-app/android-app

DESIGN: TickTick-inspired minimalist UI
- Use components from ui/components/
- Use theme from ui/theme/
- Clean, lots of whitespace
- Swipe gestures for actions

TASKS:
1. Create navigation in ui/navigation/:
   
   NavGraph.kt with routes:
   - today (default)
   - todos
   - shopping
   - expenses
   - household
   - profile
   - todo_detail/{id}
   - shopping_list/{id}
   - expense_detail/{id}
   - add_todo
   - add_expense
   - add_shopping_item

2. Create screens in ui/screens/:

   TODAY SCREEN (ui/screens/today/):
   - TodayScreen.kt - Shows today's tasks, overdue items
   - TodayViewModel.kt
   - Grouped by: Overdue, Today, Tomorrow
   - FAB to add task

   TODOS SCREEN (ui/screens/todos/):
   - TodosScreen.kt - All todos grouped by list
   - TodoDetailScreen.kt - View/edit single todo
   - AddTodoScreen.kt - Create new todo (bottom sheet preferred)
   - TodosViewModel.kt
   - Features: Filter by status, priority, assignee
   - Swipe left to delete, right to complete

   SHOPPING SCREEN (ui/screens/shopping/):
   - ShoppingScreen.kt - List of shopping lists
   - ShoppingListScreen.kt - Items in a list
   - AddShoppingItemSheet.kt - Bottom sheet to add item
   - ShoppingViewModel.kt
   - Group items by category
   - Checkbox to mark purchased
   - Strikethrough for purchased items

   EXPENSES SCREEN (ui/screens/expenses/):
   - ExpensesScreen.kt - List of expenses with summary card at top
   - ExpenseDetailScreen.kt - View expense with splits
   - AddExpenseScreen.kt - Create expense
   - ExpensesViewModel.kt
   - Summary card: "You owe $X" / "You are owed $X"
   - Filter by category, date range

   HOUSEHOLD SCREEN (ui/screens/household/):
   - HouseholdScreen.kt - Current household, members list
   - CreateHouseholdScreen.kt
   - JoinHouseholdScreen.kt
   - InviteMemberSheet.kt
   - HouseholdViewModel.kt

   PROFILE SCREEN (ui/screens/profile/):
   - ProfileScreen.kt - User info, settings
   - Profile picture, name, email
   - Switch household
   - Logout button
   - App version

3. Create MainScreen.kt with:
   - Scaffold with BottomNavBar
   - NavHost for screen navigation
   - FAB that changes based on current screen

4. Update MainActivity.kt to use MainScreen

SUCCESS CRITERIA:
- All screens render correctly
- Navigation works between all screens
- ViewModels connect to repositories
- UI matches TickTick style (minimal, clean)
- Empty states show when no data
- Loading states work

DO NOT:
- Implement authentication flow
- Implement sync logic
- Connect to backend API
```

---

### TASK 7: Sync & Authentication

**Depends on**: All previous tasks
**Estimated time**: 4-5 hours

#### Prompt for AI Agent:

```
You are implementing authentication and sync for the Flatmates Android app.

REPOSITORY: /workspaces/flatmates-app
ANDROID PATH: /workspaces/flatmates-app/android-app
BACKEND: /workspaces/flatmates-app/backend

BACKEND API BASE: Will be configured via BuildConfig.API_BASE_URL

TASKS:
1. Create API layer in data/remote/:
   
   api/FlatmatesApi.kt:
   ```kotlin
   interface FlatmatesApi {
       @POST("auth/google/mobile")
       suspend fun googleLogin(@Body request: GoogleLoginRequest): TokenResponse
       
       @GET("users/me")
       suspend fun getCurrentUser(): UserResponse
       
       @GET("households")
       suspend fun getHouseholds(): List<HouseholdResponse>
       
       // Batch sync endpoint
       @POST("sync")
       suspend fun sync(@Body request: SyncRequest): SyncResponse
       
       // Individual endpoints as fallback
       @GET("todos")
       suspend fun getTodos(@Query("household_id") householdId: String): List<TodoResponse>
       
       @POST("todos")
       suspend fun createTodo(@Body request: CreateTodoRequest): TodoResponse
       
       // ... other endpoints
   }
   ```
   
   dto/ - Request/Response data classes matching backend schemas

2. Create auth in data/auth/:
   
   GoogleAuthManager.kt:
   ```kotlin
   class GoogleAuthManager @Inject constructor(
       @ApplicationContext private val context: Context
   ) {
       private val signInClient: GoogleSignInClient
       
       suspend fun signIn(activity: Activity): Result<GoogleSignInAccount>
       suspend fun signOut()
       fun isSignedIn(): Boolean
   }
   ```
   
   TokenManager.kt (using DataStore):
   - Store JWT token
   - Store refresh token
   - Check token expiry
   
   AuthInterceptor.kt:
   - Add Bearer token to requests
   - Handle 401 responses

3. Create sync in data/sync/:
   
   SyncManager.kt:
   ```kotlin
   class SyncManager @Inject constructor(
       private val api: FlatmatesApi,
       private val database: FlatmatesDatabase,
       private val workManager: WorkManager
   ) {
       suspend fun syncAll(): Result<Unit>
       suspend fun syncTodos(): Result<Unit>
       suspend fun syncShopping(): Result<Unit>
       suspend fun syncExpenses(): Result<Unit>
       
       fun schedulePeriodSync()
       fun requestImmediateSync()
   }
   ```
   
   SyncWorker.kt (WorkManager):
   - Runs every 15 minutes when online
   - Processes sync queue
   - Pulls remote changes

4. Create login screen in ui/screens/auth/:
   
   LoginScreen.kt:
   - App logo
   - "Sign in with Google" button
   - Loading state during auth
   - Error handling
   
   AuthViewModel.kt

5. Update navigation:
   - Add auth check at app start
   - Redirect to login if not authenticated
   - Redirect to main if authenticated

6. Add NetworkModule.kt in di/:
   - Retrofit instance
   - OkHttpClient with AuthInterceptor
   - API instance

7. Handle offline/online states:
   - Show sync status indicator
   - Queue changes when offline
   - Sync when back online

SUCCESS CRITERIA:
- Google Sign-In works
- JWT token stored securely
- API calls work with auth
- Sync runs in background
- Offline mode works (local operations succeed)

DO NOT:
- Skip error handling
- Store tokens insecurely
- Block UI during sync
```

---

### TASK 8: Testing & Polish

**Depends on**: All previous tasks
**Estimated time**: 3-4 hours

#### Prompt for AI Agent:

```
You are adding tests and polish to the Flatmates Android app.

REPOSITORY: /workspaces/flatmates-app
ANDROID PATH: /workspaces/flatmates-app/android-app

TASKS:
1. Unit Tests in test/:
   
   Domain:
   - UseCaseTests for each use case
   
   Data:
   - RepositoryTests (with fake DAOs)
   - MapperTests
   
   ViewModel:
   - TodayViewModelTest
   - TodosViewModelTest
   - ExpensesViewModelTest
   - ShoppingViewModelTest
   
   Use:
   - JUnit4/5
   - Mockk for mocking
   - Turbine for Flow testing
   - kotlinx-coroutines-test

2. Integration Tests in androidTest/:
   
   - DatabaseMigrationTest
   - FullSyncFlowTest
   - NavigationTest

3. UI Tests in androidTest/:
   
   - LoginScreenTest
   - TodosScreenTest
   - Add instrumented tests with Compose testing

4. Error Handling Polish:
   
   - Network error messages (user-friendly)
   - Retry buttons on failure
   - Offline indicator in app bar
   - Sync status in settings

5. Loading States:
   
   - Skeleton loading for lists
   - Pull-to-refresh on all list screens
   - Progress indicator during operations

6. Empty States:
   
   - Custom empty state for each screen
   - Encouraging copy ("No tasks today - enjoy your free time!")

7. Accessibility:
   
   - Content descriptions on all icons
   - Proper contrast ratios
   - Touch target sizes (48dp minimum)

8. Performance:
   
   - LazyColumn for all lists
   - Proper key usage in lists
   - Avoid recomposition issues

9. Create README.md in android-app/:
   
   - Build instructions
   - Architecture overview
   - Testing instructions
   - Release build steps

SUCCESS CRITERIA:
- >70% code coverage
- All tests pass
- App handles errors gracefully
- No ANR or crash scenarios
- Accessibility scanner passes

DO NOT:
- Skip edge cases
- Leave TODOs in production code
- Ignore lint warnings
```

---

### Parallel Execution Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION SUMMARY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  RUN IN PARALLEL:                                              │
│  ├── Task 1 (Backend)     ─┬─► Wait for both                   │
│  └── Task 2 (Android Setup)┘                                   │
│                                                                 │
│  THEN RUN IN PARALLEL:                                         │
│  ├── Task 3 (Domain Models)─┬─► Wait for all                   │
│  ├── Task 4 (UI Theme)     ─┤                                  │
│  └── Task 5 (Data Layer)   ─┘  (Task 5 needs Task 3 models)    │
│                                                                 │
│  THEN RUN SEQUENTIAL:                                          │
│  └── Task 6 (Feature Screens) ─► Needs all above               │
│                                                                 │
│  THEN RUN SEQUENTIAL:                                          │
│  └── Task 7 (Sync & Auth)     ─► Needs screens                 │
│                                                                 │
│  FINALLY:                                                       │
│  └── Task 8 (Testing & Polish) ─► Needs everything             │
│                                                                 │
│  TOTAL TASKS: 8                                                 │
│  PARALLELIZABLE: Tasks 1+2, Tasks 3+4+5                        │
│  ESTIMATED TIME: 20-25 hours (AI agent)                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Quick Start Commands

After each task, verify with:

```bash
# Task 1 (Backend)
cd backend && python -m pytest tests/ -v

# Task 2-8 (Android)
cd android-app && ./gradlew build
cd android-app && ./gradlew test
cd android-app && ./gradlew connectedAndroidTest
```

---

## Appendix: Key Decisions

### Decision 1: Kotlin vs Flutter vs React Native
**Decision**: Native Kotlin
**Rationale**: Best performance, local-first support, Android-native experience

### Decision 2: Room vs Realm vs SQLDelight
**Decision**: Room
**Rationale**: Official Jetpack, best Compose integration, familiar SQL

### Decision 3: Hilt vs Koin
**Decision**: Hilt
**Rationale**: Compile-time safety, official Android support

### Decision 4: Sync Strategy
**Decision**: Last-write-wins with merge for non-conflicting fields
**Rationale**: Simple to implement, predictable behavior

### Decision 5: AI Features
**Decision**: Optional, use on-device ML Kit where possible
**Rationale**: Reduces backend dependency, works offline

---

## Next Steps

1. **Immediate**: Get stakeholder approval on this plan
2. **Week 1**: Set up Android project, configure CI/CD
3. **Ongoing**: Document API contract between app and backend
4. **Future**: Consider Kotlin Multiplatform for iOS

---

*Document Version: 1.0*
*Created: January 31, 2026*
*Author: GitHub Copilot*
