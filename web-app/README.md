# Flatmates Web App

A Next.js 14 web application that shares the same PostgreSQL database as the Android app, providing a full-featured web dashboard for household management.

## Features

- **Authentication**: Google OAuth via NextAuth.js (shared with Android app)
- **Household Management**: Create/join households, invite members
- **Task Management**: Create, assign, and track todos with priorities and due dates
- **Expense Tracking**: Split expenses, track balances, settle debts
- **Shopping Lists**: Collaborative shopping lists with item assignments

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon Serverless) via Prisma ORM
- **Authentication**: NextAuth.js v4 with Google OAuth
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Access to the same PostgreSQL database used by the backend/Android app

### Installation

1. Clone the repository and navigate to the web-app directory:
   ```bash
   cd web-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables:
   ```env
   # Database (same as backend)
   DATABASE_URL="postgresql://user:password@host:5432/flatmates_db?sslmode=require"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3001"

   # Google OAuth (same credentials as backend)
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

5. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

6. (Optional) If the database is empty, push the schema:
   ```bash
   npx prisma db push
   ```

7. Run the development server:
   ```bash
   npm run dev
   ```

8. Open [http://localhost:3001](http://localhost:3001) in your browser.

## Project Structure

```
web-app/
├── app/
│   ├── api/                    # API routes
│   │   ├── auth/               # NextAuth.js endpoints
│   │   ├── expenses/           # Expense CRUD & balances
│   │   ├── households/         # Household & invite management
│   │   ├── invite/             # Accept invite endpoint
│   │   ├── shopping-lists/     # Shopping list & items CRUD
│   │   ├── todos/              # Todo CRUD
│   │   └── user/               # User profile
│   ├── dashboard/              # Protected dashboard pages
│   │   ├── expenses/           # Expense tracking
│   │   ├── household/          # Household management
│   │   ├── settings/           # User settings
│   │   ├── shopping/           # Shopping lists
│   │   └── todos/              # Task management
│   ├── invite/                 # Public invite acceptance page
│   └── sign-in/                # Sign in page
├── components/ui/              # Reusable UI components
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── prisma.ts               # Prisma client singleton
│   └── utils.ts                # Utility functions
├── prisma/
│   └── schema.prisma           # Database schema
└── public/                     # Static assets
```

## API Routes

### Authentication
- `GET/POST /api/auth/[...nextauth]` - NextAuth.js handlers

### Households
- `GET /api/households` - Get user's household
- `POST /api/households` - Create a household
- `GET /api/households/invites` - List household invites
- `POST /api/households/invites` - Create an invite
- `DELETE /api/households/invites/[token]` - Cancel an invite

### Invites
- `GET /api/invite/[token]` - Get invite details
- `POST /api/invite/[token]` - Accept an invite

### Todos
- `GET /api/todos` - List all todos
- `POST /api/todos` - Create a todo
- `PUT /api/todos/[id]` - Update a todo
- `DELETE /api/todos/[id]` - Delete a todo

### Expenses
- `GET /api/expenses` - List all expenses
- `POST /api/expenses` - Create an expense (auto-splits)
- `GET /api/expenses/[id]` - Get expense details
- `PUT /api/expenses/[id]` - Update an expense
- `DELETE /api/expenses/[id]` - Delete an expense
- `POST /api/expenses/[id]/settle` - Settle expense splits
- `GET /api/expenses/balances` - Get household balances

### Shopping Lists
- `GET /api/shopping-lists` - List all shopping lists
- `POST /api/shopping-lists` - Create a shopping list
- `GET /api/shopping-lists/[id]` - Get list with items
- `PUT /api/shopping-lists/[id]` - Update a list
- `DELETE /api/shopping-lists/[id]` - Delete a list
- `POST /api/shopping-lists/[id]/items` - Add an item
- `PUT /api/shopping-lists/[id]/items/[itemId]` - Update an item
- `DELETE /api/shopping-lists/[id]/items/[itemId]` - Delete an item

### User
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update profile

## Database Sharing

This web app uses the **same PostgreSQL database** as the Android app and FastAPI backend. The Prisma schema exactly mirrors the SQLAlchemy models used in the backend:

- Users authenticate with the same Google OAuth credentials
- Data created in the Android app appears in the web app and vice versa
- All models (Household, Todo, Expense, ShoppingList, etc.) are fully compatible

## Development

### Adding New Components

This project uses shadcn/ui. To add new components:

```bash
npx shadcn-ui@latest add [component-name]
```

### Database Changes

If you need to modify the database schema:

1. Update `prisma/schema.prisma`
2. Generate migration: `npx prisma migrate dev --name description`
3. Update the backend SQLAlchemy models to match

⚠️ **Important**: Always coordinate database changes with the backend team to maintain compatibility.

### Type Generation

Prisma automatically generates TypeScript types. After schema changes:

```bash
npx prisma generate
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

## License

MIT
