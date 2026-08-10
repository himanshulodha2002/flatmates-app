# Flatmates App - Comprehensive Documentation

## Table of Contents
1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Core Functionalities](#core-functionalities)
4. [User Flows](#user-flows)
5. [Data Models](#data-models)
6. [API Structure](#api-structure)

---

## Overview

Flatmates is a comprehensive household management platform designed to simplify shared living coordination. The app enables roommates to manage expenses, create collaborative shopping lists, track household tasks, and leverage AI-powered features for smarter household management.

### Key Capabilities
- **Multi-Household Support**: Users can participate in multiple households simultaneously
- **Collaborative Features**: Real-time updates for shopping lists and shared activities
- **Smart Expense Management**: AI-powered categorization and receipt scanning
- **Task Coordination**: Assign and track household responsibilities
- **Offline-First Design**: Works without network connectivity

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile Application                      │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   UI Layer  │  │ State Manager│  │  Local Storage   │   │
│  │  (Screens)  │─▶│   (Redux)    │─▶│ (Persistence)    │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
│         │                  │                                 │
│         └──────────────────┼─────────────────────────────────│
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │   API Client   │                        │
│                    │  (RTK Query)   │                        │
│                    └────────┬───────┘                        │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                        HTTP/JSON
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                       Backend API Server                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ API Endpoints│─▶│Business Logic│─▶│  AI Services     │   │
│  │  (REST API)  │  │  (Services)  │  │ (Gemini/OpenAI)  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│         │                  │                                 │
│         └──────────────────┼─────────────────────────────────│
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │   ORM Layer    │                        │
│                    │  (SQLAlchemy)  │                        │
│                    └────────┬───────┘                        │
└─────────────────────────────┼─────────────────────────────────┘
                              │
                              │
┌─────────────────────────────▼─────────────────────────────────┐
│                   PostgreSQL Database                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ Users    │ │Households│ │ Expenses │ │Shopping Lists│    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

### Application Structure

#### Backend Architecture
```
backend/
├── app/
│   ├── models/          # Database models (ORM)
│   ├── schemas/         # Request/Response validation
│   ├── api/             # API endpoints by module
│   │   ├── households   # Household management endpoints
│   │   ├── expenses     # Expense tracking endpoints
│   │   ├── shopping     # Shopping list endpoints
│   │   └── todos        # Task management endpoints
│   ├── services/        # Business logic & AI services
│   └── core/            # Configuration & database setup
└── alembic/             # Database migrations
```

#### Mobile Architecture
```
mobile/
├── app/                 # Screens (file-based routing)
│   ├── (tabs)/          # Main tab navigation
│   ├── onboarding       # First-time user experience
│   ├── create-household # Household creation
│   └── members          # Member management
└── src/
    ├── components/      # Reusable UI components
    ├── store/           # State management
    │   ├── slices/      # Redux state slices
    │   └── services/    # API integration
    ├── types/           # Type definitions
    └── services/        # Notifications, local data
```

### Data Flow Architecture

```
User Interaction
      │
      ▼
┌─────────────────┐
│  UI Component   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Redux Action   │◄─────────┐
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│   RTK Query     │          │
│  API Request    │          │
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│  Backend API    │          │
│   Validation    │          │
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│ Business Logic  │          │
│   & Services    │          │
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│    Database     │          │
│   Operations    │          │
└────────┬────────┘          │
         │                   │
         ▼                   │
┌─────────────────┐          │
│    Response     │          │
│  (JSON Data)    │──────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Redux State   │
│     Update      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  UI Re-render   │
└─────────────────┘
```

### State Management

The application uses a centralized state management system with automatic persistence:

- **authSlice**: User session and profile data
- **householdSlice**: Active household and household list
- **expenseSlice**: Expense data, summaries, and analytics
- **shoppingSlice**: Active shopping list and polling settings

**Offline Support**: All state is persisted locally, allowing the app to function without network connectivity. Changes sync automatically when connection is restored.

---

## Core Functionalities

### 1. Household Management

Households are the central organizing unit of the app. Users can create and participate in multiple households, each functioning as an independent group.

#### Features

**Household Creation & Management**
- Create new households with custom names
- Switch between multiple households seamlessly
- View all household members and their roles
- Manage household settings and information

**Member Management**
- Two-tier role system: **Owner** and **Member**
  - **Owners**: Full administrative privileges (invite members, change roles, remove members)
  - **Members**: Standard access to household features
- Email-based invitation system
  - Generate secure invite links
  - 7-day expiration for security
  - Email notifications to invitees
- Add and remove members
- Change member roles (Owner privilege only)
- Leave household functionality
- Automatic household deletion when last member leaves
- Protection against removing the last owner

#### Invitation Workflow
1. Owner generates invite for specific email address
2. System creates secure token with 7-day expiration
3. Invitee receives email with join link
4. Invitee clicks link and joins household
5. Invite is marked as accepted and can't be reused

#### Member Screens
- **Household Switcher**: View and switch between all households
- **Members List**: See all household members with roles
- **Invite Members**: Send invitations (Owner only)
- **Member Management**: Change roles or remove members (Owner only)

---

### 2. Expense Tracking & Splitting

Comprehensive expense management system with intelligent splitting and balance tracking.

#### Features

**Expense Creation**
- Add expenses with amount, description, and date
- Select from 9 expense categories:
  - Groceries
  - Utilities
  - Rent
  - Internet
  - Cleaning
  - Maintenance
  - Entertainment
  - Food
  - Transportation
  - Other
- Choose payment method (Cash, Card, Bank Transfer, Digital Wallet, Other)
- Mark as shared or personal expense
- Attach to specific household

**Split Types**

1. **Equal Split**
   - Automatically divides expense equally among all household members
   - Creator is automatically marked as settled
   - Everyone else owes their equal share

2. **Custom Split**
   - Manually specify exact amounts for each person
   - Must sum to total expense amount
   - Flexible for uneven distributions

3. **Percentage Split**
   - Assign percentage share to each member
   - Percentages must total 100%
   - Automatically calculates amounts

**Settlement & Tracking**
- View all expense splits and who owes what
- Mark individual splits as settled
- Track settlement dates
- View settlement history
- Expense creator is auto-settled (they paid)

**Analytics & Reporting**

**Household Summary** (backend/app/api/v1/expenses.py:163)
- Total expenses for household
- Individual member balances (who owes/is owed)
- Per-member expense breakdown
- Category-based summaries

**Personal Analytics** (backend/app/api/v1/expenses.py:186)
- Total expenses over time
- Monthly breakdown
- Category-wise spending analysis
- Personal vs. shared expense ratio
- Average expense amounts

**Expense Management**
- Edit existing expenses
- Delete expenses (creator only)
- Filter by category, date range, member
- Search by description
- Sort by amount or date

#### Expense Screens
- **Expense List**: View all expenses with filters
- **Expense Details**: See complete breakdown with splits
- **Add Expense**: Create new expense with split configuration
- **Analytics**: Visual charts and spending insights
- **Settlement**: Track and manage expense settlements

---

### 3. Shopping Lists

Collaborative shopping list system enabling real-time coordination among household members.

#### Features

**List Management**
- Create multiple shopping lists per household
- Name and describe each list
- Active/Archived status
- List statistics (total items, purchased count, pending count, total price)
- Real-time updates across all member devices

**Item Management**
- Add items with:
  - Name
  - Quantity with units (kg, liters, pieces, etc.)
  - Category
  - Price
  - Notes
  - Assignment to specific member
- Mark items as purchased (check-off)
- Track purchase timestamp
- Reorder items with position tracking
- Delete items
- Edit item details

**Categories**
- Pre-defined global categories with icons and colors
- Custom household-specific categories
- Filter items by category
- Category-based organization

**Recurring Items**
- Mark items as recurring (weekly/monthly)
- Automatically re-add to future lists
- Simplifies routine shopping

**Collaborative Shopping**
- Multiple members can shop simultaneously
- Real-time purchase status updates
- See who checked off each item
- Assign items to specific shoppers
- Coordinated shopping trips

**List Statistics** (backend/app/api/v1/shopping.py:121)
- Total items count
- Items purchased vs. pending
- Total estimated price
- Completion percentage

#### Shopping Screens
- **Shopping Lists**: View all active and archived lists
- **List Detail**: See all items with categories and assignments
- **Add Item**: Create new shopping item
- **Item Categories**: Manage custom categories
- **Shopping Mode**: Optimized UI for in-store shopping

---

### 4. Task Management (Todos)

Coordinate household responsibilities with a comprehensive task management system.

#### Features

**Task Creation**
- Create tasks with title and description
- Set due dates
- Assign priority (Low, Medium, High)
- Assign to specific household members
- Add to specific household

**Task Status Workflow**
- **Pending**: Task not yet started
- **In Progress**: Task actively being worked on
- **Completed**: Task finished

**Task Organization**
- Priority levels with visual indicators
  - 🔴 High: Urgent tasks
  - 🟡 Medium: Normal priority
  - 🟢 Low: Can be deferred
- Due date tracking with overdue detection
- Assignment system for accountability
- Task hierarchy (parent-child relationships)

**Recurring Tasks**
- Daily, weekly, or monthly recurrence patterns
- Automatic task creation based on pattern
- Recur until specific date
- Simplifies routine household chores

**Task Filtering & Search**
- Filter by status (Pending, In Progress, Completed)
- Filter by assignee
- Filter by priority
- Sort by due date or priority
- Search by title/description

**Task Statistics** (backend/app/api/v1/todos.py:132)
- Total tasks count
- Completed vs. pending
- Overdue tasks
- Tasks by priority level
- Per-member assignment breakdown

**Task Management**
- Edit task details
- Update status
- Reassign tasks
- Change priority/due date
- Delete tasks
- Mark complete

#### Todo Screens
- **Todo List**: View all tasks with filters
- **Task Detail**: Complete task information
- **Add Task**: Create new task with all options
- **Task Board**: Kanban-style view by status
- **My Tasks**: Personal task view

---

### 5. AI-Powered Features

Leverage artificial intelligence to streamline household management tasks.

#### Smart Expense Categorization

Automatically categorize expenses based on description and amount.

**How It Works** (backend/app/services/ai_service.py:42)
1. User enters expense description and amount
2. AI analyzes text and context
3. Suggests most appropriate category
4. Provides confidence score (0-100%)
5. Explains reasoning for suggestion
6. User can accept or override

**Example**
- Input: "Weekly grocery shopping at Whole Foods - $127.50"
- Output: Category: `Groceries`, Confidence: 95%
- Reasoning: "Clear indication of grocery shopping with specific store mention"

**Benefits**
- Faster expense entry
- Consistent categorization
- Better analytics and reporting
- Learning from patterns

#### Receipt OCR (Optical Character Recognition)

Extract expense data from receipt photos automatically.

**How It Works** (backend/app/services/ai_service.py:95)
1. User takes photo of receipt
2. AI processes image
3. Extracts structured data:
   - Merchant/store name
   - Purchase date
   - Total amount
   - Individual line items with prices
   - Tax and subtotal
4. Pre-fills expense form
5. User reviews and confirms

**Extracted Data**
- Merchant name
- Transaction date
- Total amount
- Itemized line items
- Individual item prices
- Subtotals and tax

**Benefits**
- Eliminates manual data entry
- Reduces errors
- Faster expense recording
- Captures itemized details

#### AI Task Suggestions

Get intelligent recommendations for household tasks based on context.

**How It Works** (backend/app/services/ai_service.py:170)
1. AI analyzes household context
2. Generates relevant task suggestions
3. Provides task titles and descriptions
4. Suggests priority levels
5. User selects tasks to add

**Suggestion Types**
- Routine maintenance tasks
- Seasonal chores
- Organization tasks
- Cleaning schedules
- Utility management

**Example Suggestions**
- "Clean refrigerator and check expiration dates" - Weekly
- "Replace HVAC filters" - Monthly
- "Deep clean bathroom" - Weekly
- "Check smoke detector batteries" - Monthly
- "Organize pantry and take inventory" - Bi-weekly

**Benefits**
- Never forget routine tasks
- Comprehensive household maintenance
- Proactive task planning
- Reduces mental load

#### AI System Design

**Multi-Provider Support**
- Primary: Google Gemini (gemini-1.5-flash)
- Fallback: OpenAI (gpt-4o via GitHub Models)
- Automatic failover on errors
- Graceful degradation

**Response Structure**
- Confidence scores for transparency
- Reasoning explanations
- Fallback to manual entry if AI fails
- Error handling and retry logic

---

## User Flows

### First-Time User Experience

```
New User Opens App
      │
      ▼
 Onboarding Tutorial
      │
      ▼
Create or Join Household?
      │
      ├─────────────┬─────────────┐
      ▼             ▼             ▼
Create Household  Join with    Invited via
                  Invite Code    Email Link
      │             │             │
      └─────────────┴─────────────┘
                    │
                    ▼
            Access Main App
                    │
                    ▼
         ┌──────────┴──────────┐
         ▼          ▼          ▼
      Todos    Shopping    Expenses
```

### Creating an Expense

```
Tap "Add Expense" Button
         │
         ▼
Enter Amount & Description
         │
         ▼
AI Suggests Category ────► Accept or Choose Different
         │
         ▼
Select Payment Method
         │
         ▼
Choose Date
         │
         ▼
Select Split Type
         │
         ├──────────┬──────────┬──────────┐
         ▼          ▼          ▼          ▼
      Equal     Custom    Percentage  Personal
         │          │          │          │
         └──────────┴──────────┴──────────┘
                    │
                    ▼
         Configure Splits
         (if not Equal)
                    │
                    ▼
            Create Expense
                    │
                    ▼
        Expense Saved & Splits Created
                    │
                    ▼
    View Expense in List & Update Balances
```

### Collaborative Shopping Flow

```
        Member A                         Member B
            │                                │
            ▼                                │
    Create Shopping List                     │
    Add Items                                │
            │                                │
            ▼                                │
    Share with Household                     │
            │                                │
            ├────────────────────────────────┤
            │         Notification           │
            │                                ▼
            │                        View Shopping List
            │                                │
            ▼                                ▼
    At Store: Check Off Items        At Store: Check Off Items
            │                                │
            ├────────────────────────────────┤
            │      Real-time Sync            │
            │                                │
            ▼                                ▼
    See B's Purchases                See A's Purchases
            │                                │
            └────────────────┬───────────────┘
                             │
                             ▼
                     All Items Purchased
                             │
                             ▼
                      Archive List
```

### Task Assignment and Completion

```
Household Owner/Member
         │
         ▼
Create Task
         │
         ▼
Set Details:
- Title & Description
- Due Date
- Priority Level
         │
         ▼
Assign to Member
         │
         ├─────────────────────────┐
         │                         │
         ▼                         ▼
  Task Created              Assignee Notified
         │                         │
         │◄────────────────────────┘
         │
         ▼
Assignee Views Task
         │
         ▼
Start Working (Status: In Progress)
         │
         ▼
Complete Task (Status: Completed)
         │
         ▼
Task Archived/Statistics Updated
```

### Household Invitation Flow

```
      Owner                              Invitee
         │                                  │
         ▼                                  │
Enter Invitee Email                         │
         │                                  │
         ▼                                  │
Generate Invite Token                       │
         │                                  │
         ▼                                  │
System Sends Email ────────────────────────►│
         │                                  │
         │                                  ▼
         │                          Receive Email
         │                                  │
         │                                  ▼
         │                          Click Join Link
         │                                  │
         │                                  ▼
         │                          Validate Token
         │                                  │
         │◄─────────────────────────────────┤
         │          Join Household          │
         ▼                                  ▼
View New Member                      Access Household
    in List                             Features
```

### Multi-Household Management

```
User with Multiple Households
            │
            ▼
    Open Household Switcher
            │
            ▼
    ┌───────┴────────┐
    │  Household A   │
    │  Household B   │
    │  Household C   │
    └───────┬────────┘
            │
            ▼
    Select Household B
            │
            ▼
    Switch Active Household
            │
            ▼
    Load Household B Data:
    - Members
    - Expenses
    - Shopping Lists
    - Tasks
            │
            ▼
    All Features Now Scoped
    to Household B
```

---

## Data Models

### Core Entities

#### User
```
User
├── id (primary key)
├── email (unique)
├── full_name
├── picture_url
├── created_at
└── relationships:
    ├── household_memberships → HouseholdMember
    ├── created_households → Household
    ├── assigned_todos → Todo
    └── expense_splits → ExpenseSplit
```

#### Household
```
Household
├── id (primary key)
├── name
├── created_by (foreign key → User)
├── created_at
└── relationships:
    ├── members → HouseholdMember
    ├── expenses → Expense
    ├── shopping_lists → ShoppingList
    ├── todos → Todo
    └── invites → HouseholdInvite
```

#### HouseholdMember
```
HouseholdMember
├── id (primary key)
├── user_id (foreign key → User)
├── household_id (foreign key → Household)
├── role (enum: Owner, Member)
├── joined_at
└── relationships:
    ├── user → User
    └── household → Household
```

#### HouseholdInvite
```
HouseholdInvite
├── id (primary key)
├── household_id (foreign key → Household)
├── email
├── token (unique, secure)
├── status (enum: Pending, Accepted, Expired)
├── created_at
├── expires_at (7 days from creation)
└── relationship:
    └── household → Household
```

### Expense Management

#### Expense
```
Expense
├── id (primary key)
├── household_id (foreign key → Household)
├── created_by (foreign key → User)
├── amount (decimal)
├── description
├── category (enum: Groceries, Utilities, Rent, etc.)
├── payment_method (enum: Cash, Card, etc.)
├── date
├── split_type (enum: Equal, Custom, Percentage)
├── is_personal (boolean)
├── created_at
├── updated_at
└── relationships:
    ├── household → Household
    ├── creator → User
    └── splits → ExpenseSplit (one-to-many)
```

#### ExpenseSplit
```
ExpenseSplit
├── id (primary key)
├── expense_id (foreign key → Expense)
├── user_id (foreign key → User)
├── amount_owed (decimal)
├── is_settled (boolean)
├── settled_at (nullable)
├── created_at
└── relationships:
    ├── expense → Expense
    └── user → User
```

### Shopping Lists

#### ShoppingList
```
ShoppingList
├── id (primary key)
├── household_id (foreign key → Household)
├── name
├── description (nullable)
├── status (enum: Active, Archived)
├── created_by (foreign key → User)
├── created_at
├── updated_at
└── relationships:
    ├── household → Household
    ├── items → ShoppingListItem (one-to-many)
    └── creator → User
```

#### ShoppingListItem
```
ShoppingListItem
├── id (primary key)
├── shopping_list_id (foreign key → ShoppingList)
├── name
├── quantity (decimal, nullable)
├── unit (string, nullable)
├── category (string, nullable)
├── is_purchased (boolean)
├── purchased_at (nullable)
├── assigned_to_id (foreign key → User, nullable)
├── price (decimal, nullable)
├── notes (text, nullable)
├── is_recurring (boolean)
├── position (integer, for ordering)
├── created_at
├── updated_at
└── relationships:
    ├── shopping_list → ShoppingList
    └── assigned_to → User
```

#### ItemCategory
```
ItemCategory
├── id (primary key)
├── name
├── icon (string)
├── color (hex code)
├── household_id (nullable, for custom categories)
└── relationship:
    └── household → Household (nullable)
```

### Task Management

#### Todo
```
Todo
├── id (primary key)
├── household_id (foreign key → Household)
├── title
├── description (nullable)
├── status (enum: Pending, In Progress, Completed)
├── priority (enum: Low, Medium, High)
├── due_date (nullable)
├── assigned_to_id (foreign key → User, nullable)
├── created_by (foreign key → User)
├── recurring_pattern (string, nullable)
├── recurring_until (date, nullable)
├── parent_todo_id (foreign key → Todo, nullable)
├── completed_at (nullable)
├── created_at
├── updated_at
└── relationships:
    ├── household → Household
    ├── assigned_to → User
    ├── created_by → User
    ├── parent → Todo (self-referential)
    └── children → Todo (one-to-many)
```

### Database Relationships Diagram

```
              ┌─────────┐
              │  User   │
              └────┬────┘
                   │
         ┌─────────┼─────────┐
         │         │         │
         │         │         │
    ┌────▼───┐ ┌──▼──────┐  │
    │Household│ │Household│  │
    │ Member  │ │ Invite  │  │
    └────┬───┘ └────┬────┘  │
         │          │        │
         ▼          ▼        │
    ┌─────────────────┐     │
    │   Household     │     │
    └────┬────────────┘     │
         │                  │
    ┌────┼────────┬─────────┼────────┐
    │    │        │         │        │
    ▼    ▼        ▼         ▼        ▼
┌────────┐  ┌─────────┐ ┌──────┐ ┌────────────┐
│Expense │  │Shopping │ │ Todo │ │   Item     │
│        │  │  List   │ │      │ │  Category  │
└───┬────┘  └────┬────┘ └──────┘ └────────────┘
    │            │
    ▼            ▼
┌────────┐  ┌──────────────┐
│Expense │  │ Shopping     │
│ Split  │  │ List Item    │
└────────┘  └──────────────┘
```

---

## API Structure

### RESTful API Design

All API endpoints follow REST conventions with consistent patterns:

**Base URL**: `/api/v1`

**Response Format**: JSON

**Common Response Codes**:
- `200 OK`: Successful GET/PUT/PATCH
- `201 Created`: Successful POST
- `204 No Content`: Successful DELETE
- `400 Bad Request`: Validation error
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `422 Unprocessable Entity`: Invalid data

### API Endpoints by Module

#### Household Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/households/` | Create new household |
| GET | `/households/mine` | List user's households |
| GET | `/households/{id}` | Get household with members |
| PUT | `/households/{id}` | Update household details |
| DELETE | `/households/{id}` | Delete household |
| POST | `/households/{id}/invite` | Create invite (Owner only) |
| POST | `/households/join` | Join via invite token |
| PATCH | `/households/{id}/members/{member_id}` | Update member role |
| DELETE | `/households/{id}/members/{member_id}` | Remove member |
| POST | `/households/{id}/leave` | Leave household |

**Key Business Rules**:
- Only owners can invite members
- Only owners can change roles
- Cannot remove last owner
- Household deletes when last member leaves

#### Expense Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/expenses/` | Create expense with splits |
| GET | `/expenses/` | List expenses (filterable) |
| GET | `/expenses/{id}` | Get expense with splits |
| PATCH | `/expenses/{id}` | Update expense |
| DELETE | `/expenses/{id}` | Delete expense (creator only) |
| POST | `/expenses/{id}/settle` | Settle expense splits |
| GET | `/expenses/households/{id}/summary` | Household expense summary |
| GET | `/expenses/users/{id}/analytics` | Personal analytics |

**Query Parameters** (GET /expenses/):
- `household_id`: Filter by household
- `category`: Filter by category
- `start_date`: Filter from date
- `end_date`: Filter to date
- `is_personal`: Filter personal/shared

#### AI-Enhanced Expense Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/expenses/ai/categorize` | Categorize expense with AI |
| POST | `/expenses/ai/ocr` | Extract data from receipt |
| POST | `/expenses/ai/suggest-tasks` | Get AI task suggestions |

**Request Example** (Categorize):
```json
{
  "description": "Weekly groceries at Trader Joe's",
  "amount": 87.50
}
```

**Response Example** (Categorize):
```json
{
  "category": "Groceries",
  "confidence": 95,
  "reasoning": "Clear grocery shopping mention with store name"
}
```

#### Shopping Lists

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/shopping-lists/` | Create shopping list |
| GET | `/shopping-lists/` | List shopping lists |
| GET | `/shopping-lists/{id}` | Get list with items |
| PUT | `/shopping-lists/{id}` | Update list |
| DELETE | `/shopping-lists/{id}` | Delete list |
| GET | `/shopping-lists/{id}/stats` | Get list statistics |
| POST | `/shopping-lists/{id}/items` | Add item to list |
| PUT | `/shopping-lists/{id}/items/{item_id}` | Update item |
| PATCH | `/shopping-lists/{id}/items/{item_id}/purchase` | Toggle purchase status |
| DELETE | `/shopping-lists/{id}/items/{item_id}` | Delete item |

**Query Parameters** (GET /shopping-lists/):
- `household_id`: Filter by household
- `status`: Filter by Active/Archived
- `include_items`: Include items in response

#### Task Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/todos/` | Create todo |
| GET | `/todos/` | List todos (filterable) |
| GET | `/todos/{id}` | Get todo details |
| PUT | `/todos/{id}` | Update todo |
| PATCH | `/todos/{id}/status` | Update status only |
| DELETE | `/todos/{id}` | Delete todo |
| GET | `/todos/household/{id}/stats` | Todo statistics |

**Query Parameters** (GET /todos/):
- `household_id`: Filter by household
- `status`: Filter by status
- `assigned_to_id`: Filter by assignee
- `priority`: Filter by priority

### API Security

All protected endpoints require valid JWT token in headers:
```
Authorization: Bearer <jwt_token>
```

**Automatic Validations**:
- User authentication on all protected routes
- Household membership verification
- Owner-only actions validated
- Creator-only edit/delete enforced
- Token expiration checking

### Error Response Format

```json
{
  "detail": "Error message",
  "error_code": "OPTIONAL_ERROR_CODE",
  "field_errors": {
    "field_name": ["Validation error message"]
  }
}
```

---

## Advanced Features

### Offline-First Architecture

The mobile app is designed to work seamlessly without network connectivity:

**Local State Persistence**
- All Redux state persisted to device storage
- Data available immediately on app launch
- No loading delays for cached data

**Offline Capabilities**
- View all previously loaded data
- Access household information
- Browse expenses, shopping lists, and tasks
- Read-only mode when offline

**Sync Strategy**
- Automatic sync when connection restored
- Optimistic UI updates
- Conflict resolution
- Retry logic for failed requests

### Real-Time Collaboration

**Shopping Lists**
- Configurable polling intervals
- Automatic refetch on app focus
- Optimistic UI updates
- Real-time purchase notifications

**Update Propagation**
- RTK Query automatic cache invalidation
- Background polling for active lists
- Manual refresh capability
- Efficient data fetching

### Role-Based Access Control

**Permission Matrix**:

| Action | Owner | Member |
|--------|-------|--------|
| Create expense/task/list | ✅ | ✅ |
| Edit own expense | ✅ | ✅ |
| Delete own expense | ✅ | ✅ |
| Invite members | ✅ | ❌ |
| Remove members | ✅ | ❌ |
| Change member roles | ✅ | ❌ |
| Delete household | ✅* | ❌ |

*Automatic when last owner leaves

### Notification System

**Notification Types**:
- New household invitation
- Member joined household
- Expense created/updated
- Task assigned
- Task due soon
- Shopping list updated
- Settlement requests

**Platform**:
- Expo Notifications
- Push notification support
- Local notifications for reminders
- Notification preferences

### Data Validation

**Frontend Validation**:
- Form-level validation
- Real-time field validation
- Type safety via TypeScript
- User-friendly error messages

**Backend Validation**:
- Pydantic schema validation
- Database constraint enforcement
- Business rule validation
- Detailed error responses

---

## Summary

The Flatmates app is a comprehensive household management platform built on modern architectural principles:

### Core Strengths

1. **Comprehensive Feature Set**: Covers all aspects of shared living (expenses, shopping, tasks, coordination)

2. **Intelligent Automation**: AI-powered features reduce manual effort and improve accuracy

3. **Collaborative Design**: Real-time updates and multi-user support enable seamless coordination

4. **Offline-First**: Works without network, syncs when available

5. **Scalable Architecture**: Clean separation of concerns, modular design, extensible structure

6. **User-Centric**: Intuitive workflows, smart defaults, helpful error messages

### Use Cases

**Perfect for:**
- Shared apartments/houses with roommates
- College dorm groups
- Family households managing shared expenses
- Vacation rental groups
- Co-living spaces
- Temporary shared accommodations

**Key Benefits:**
- Fair expense splitting
- Organized household shopping
- Coordinated chore management
- Financial transparency
- Reduced conflicts through clear tracking
- Time savings through automation

### Technical Highlights

- RESTful API with comprehensive endpoints
- Type-safe data models and validation
- Efficient state management with caching
- Real-time collaboration features
- Role-based security model
- Extensible AI integration
- Mobile-first responsive design

The app successfully combines modern development practices with practical features to solve real-world household coordination challenges.
