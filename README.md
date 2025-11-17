# Flatmates App

A collaborative app for flatmates to manage todos, shopping lists, and expenses.

![Backend CI/CD](https://github.com/himanshulodha2002/flatmates-app/workflows/Backend%20CI%2FCD/badge.svg)
![Mobile CI/CD](https://github.com/himanshulodha2002/flatmates-app/workflows/Mobile%20CI%2FCD/badge.svg)
![Full CI](https://github.com/himanshulodha2002/flatmates-app/workflows/Full%20CI/badge.svg)

## Overview

Flatmates App is a full-stack mobile application that helps flatmates coordinate and manage their shared living space. Built with modern technologies, it features a FastAPI backend and React Native Expo frontend.

### Key Features

#### Core Features
- **User Authentication**: Google OAuth integration for secure login
- **Household Management**: Create or join households, manage members and roles
- **Member Roles**: Owner and member roles with role-based permissions
- **Invite System**: Email-based invitations with secure tokens (7-day expiry)
- **Multi-Household Support**: Switch between multiple households
- **Expense Tracking**: Log and split expenses with multiple split types (equal, custom, percentage)
- **Shopping Lists**: Collaborative shopping lists with real-time updates
- **Task Management**: Create, assign, and track household tasks and todos
- **Dark Theme UI**: Modern dark theme with Material Design 3 and React Native Paper

#### Advanced Features (Phase 7 - Polish & QA)
- ✅ **Push Notifications**: Real-time notifications for expenses, shopping, tasks, and household updates
- ✅ **Error Handling**: Comprehensive error boundaries and network error recovery
- ✅ **Form Validation**: Robust validation for all user inputs with helpful error messages
- ✅ **Onboarding Flow**: Beautiful welcome screens for new users
- ✅ **Feature Tutorials**: Interactive tutorials for key features
- ✅ **Offline Support**: Redux Persist for offline data access
- ✅ **Integration Tests**: Comprehensive test coverage for core workflows
- ✅ **Play Store Ready**: Complete metadata, privacy policy, and terms of service

#### AI-Powered Features
- **Smart Categorization**: AI-powered expense categorization with confidence scores
- **Receipt OCR**: Scan receipts to automatically extract expense details
- **Task Suggestions**: AI-generated household task recommendations
- **Dual Provider Support**: OpenAI and Google Gemini with automatic fallback

## Repository Structure

```
flatmates-app/
├── backend/          # FastAPI backend
├── mobile/           # React Native Expo frontend
└── .github/          # CI/CD workflows
    ├── workflows/
    │   ├── backend-ci.yml    # Backend CI/CD pipeline
    │   ├── mobile-ci.yml     # Mobile CI/CD pipeline
    │   └── full-ci.yml       # Combined CI pipeline
    └── dependabot.yml        # Dependency updates
```

## Tech Stack

### Backend
- **Framework**: FastAPI with Python 3.11
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens
- **Testing**: pytest with coverage
- **Deployment**: Docker, Railway, Render

### Frontend
- **Framework**: React Native with Expo (~54.0)
- **Language**: TypeScript
- **State Management**: Redux Toolkit with Redux Persist
- **UI Library**: React Native Paper (Material Design 3)
- **Routing**: Expo Router (file-based routing)
- **Testing**: Jest with React Native Testing Library
- **Notifications**: Expo Notifications
- **Authentication**: Google Sign-In
- **AI Integration**: OpenAI and Google Gemini APIs

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your database credentials
alembic upgrade head
uvicorn app.main:app --reload
```

See [backend/README.md](backend/README.md) for detailed setup instructions.

### Mobile Setup

```bash
cd mobile
npm install
npm start
```

See [mobile/README.md](mobile/README.md) for detailed setup instructions.

## CI/CD Pipeline

The project uses GitHub Actions for automated testing, building, and deployment.

### Workflows

#### Backend CI/CD (`..github/workflows/backend-ci.yml`)
- Triggers on push/PR to `main` and `develop` branches
- Runs on changes to `backend/**` files
- **Test Job**:
  - Python 3.11 setup with dependency caching
  - flake8 linting
  - black code formatting check
  - pytest with coverage reporting
- **Deploy Job** (main branch only):
  - Automated deployment to Railway/Render

#### Mobile CI/CD (`..github/workflows/mobile-ci.yml`)
- Triggers on push/PR to `main` and `develop` branches
- Runs on changes to `mobile/**` files
- **Test Job**:
  - Node.js 18 setup with dependency caching
  - ESLint linting
  - TypeScript type checking
  - Jest tests with coverage reporting
- **Build Job** (main branch only):
  - EAS build for Android APK

#### Full CI (`..github/workflows/full-ci.yml`)
- Runs both backend and mobile CI in parallel
- Detects changes and runs relevant workflows
- Reports overall status

### Dependency Management

Dependabot is configured to automatically update dependencies:
- Backend Python packages (weekly on Mondays)
- Frontend NPM packages (weekly on Mondays)
- GitHub Actions versions (weekly on Mondays)

## Testing

### Backend Testing

```bash
cd backend
pytest --cov=app --cov-report=html
flake8 app
black --check app
```

### Frontend Testing

```bash
cd mobile
npm test
npm run lint
npm run type-check
```

## Docker Support

### Backend Docker Compose

```bash
cd backend
docker-compose up -d
```

Services:
- FastAPI backend on port 8000
- PostgreSQL database on port 5432

## Deployment

### Backend Deployment Options

1. **Railway**: Configured with `railway.json`
2. **Render**: Configured with `render.yaml`
3. **Docker**: Use provided `Dockerfile` and `docker-compose.yml`

### Frontend Deployment

1. **EAS Build**: Build APK/IPA with Expo Application Services
2. **App Stores**: Submit to Google Play and Apple App Store

See individual README files for detailed deployment instructions.

## Environment Setup

### Backend Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
SECRET_KEY=your-secret-key
BACKEND_CORS_ORIGINS=["http://localhost:19006"]
```

### Frontend Environment Variables

```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
EXPO_PUBLIC_ENVIRONMENT=development
```

## Development Workflow

1. Create a feature branch
2. Make your changes
3. Run tests locally
4. Push to GitHub
5. CI/CD automatically runs tests
6. Create pull request
7. Merge after approval and passing tests

## Code Quality

### Backend
- **Linting**: flake8
- **Formatting**: black
- **Import Sorting**: isort
- **Type Checking**: Built-in Python type hints
- **Pre-commit Hooks**: Configured in `.pre-commit-config.yaml`

### Frontend
- **Linting**: ESLint with Expo config
- **Formatting**: Prettier
- **Type Checking**: TypeScript strict mode

## API Documentation

### Authentication Endpoints

- `POST /api/v1/auth/google/mobile` - Google OAuth login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Logout

### Household Endpoints

All household endpoints require authentication via JWT Bearer token.

#### Create Household
```bash
POST /api/v1/households/
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My Apartment"
}
```

#### List My Households
```bash
GET /api/v1/households/mine
Authorization: Bearer <token>
```

#### Get Household Details
```bash
GET /api/v1/households/{household_id}
Authorization: Bearer <token>
```

#### Create Invite (Owner Only)
```bash
POST /api/v1/households/{household_id}/invite
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "friend@example.com"
}
```

Response includes a `token` field for the invited user to join.

#### Join Household
```bash
POST /api/v1/households/join
Content-Type: application/json
Authorization: Bearer <token>

{
  "token": "invite-token-here"
}
```

#### Update Member Role (Owner Only)
```bash
PATCH /api/v1/households/{household_id}/members/{member_id}
Content-Type: application/json
Authorization: Bearer <token>

{
  "role": "owner"  # or "member"
}
```

#### Remove Member (Owner Only)
```bash
DELETE /api/v1/households/{household_id}/members/{member_id}
Authorization: Bearer <token>
```

### Interactive API Documentation

- Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs) (when running locally)
- ReDoc: [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Documentation

- [Backend Documentation](backend/README.md)
- [Mobile Documentation](mobile/README.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review CI/CD logs for build failures
