# AI Agent Prompts for Flatmates App Migration

## Overview

This folder contains self-contained prompts for AI agents (GitHub Copilot Coding Agent, Claude, etc.) to execute the Flatmates App migration from React Native to native Kotlin Android.

## Execution Order

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION ORDER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ROUND 1: Run in PARALLEL                                      │
│  ├── 01-backend-reliability.md                                 │
│  └── 02-android-project-setup.md                               │
│                                                                 │
│  ROUND 2: Run in PARALLEL (after Round 1 completes)            │
│  ├── 03-domain-models.md                                       │
│  ├── 04-ui-theme-design.md                                     │
│  └── 05-data-layer-room.md  (start after 03 begins)            │
│                                                                 │
│  ROUND 3: Sequential                                           │
│  └── 06-feature-screens.md                                     │
│                                                                 │
│  ROUND 4: Sequential                                           │
│  └── 07-sync-auth.md                                           │
│                                                                 │
│  ROUND 5: Sequential                                           │
│  └── 08-testing-polish.md                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Parallel Execution Guide

| Round | Prompts | Can Run Together? | Wait For |
|-------|---------|-------------------|----------|
| 1 | 01 + 02 | ✅ YES | Nothing |
| 2 | 03 + 04 + 05 | ✅ YES* | Round 1 |
| 3 | 06 | ❌ Sequential | Round 2 |
| 4 | 07 | ❌ Sequential | Round 3 |
| 5 | 08 | ❌ Sequential | Round 4 |

*Note: Task 05 depends on models from Task 03, so start 03 slightly before 05.

## Estimated Time

| Prompt | Estimated Time |
|--------|---------------|
| 01 - Backend Reliability | 2-3 hours |
| 02 - Android Setup | 1-2 hours |
| 03 - Domain Models | 1-2 hours |
| 04 - UI Theme | 2-3 hours |
| 05 - Data Layer | 3-4 hours |
| 06 - Feature Screens | 4-5 hours |
| 07 - Sync & Auth | 4-5 hours |
| 08 - Testing & Polish | 3-4 hours |
| **Total** | **20-28 hours** |

## Verification Commands

After each task, verify success:

```bash
# After Task 01 (Backend)
cd /workspaces/flatmates-app/backend
python -m pytest tests/ -v

# After Task 02-08 (Android)
cd /workspaces/flatmates-app/android-app
./gradlew build
./gradlew test
./gradlew connectedAndroidTest  # Requires emulator
```

## Design Reference

All UI should follow TickTick-inspired minimalist design:

| Element | Value |
|---------|-------|
| Primary Color | `#4772FA` |
| Background Light | `#F8F9FA` |
| Background Dark | `#121212` |
| Card Radius | `12.dp` |
| Screen Padding | `16.dp` |
| FAB Size | `56.dp` |

See `04-ui-theme-design.md` for full design specifications.
