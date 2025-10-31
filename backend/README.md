# Flatmates App Backend

FastAPI backend for the Flatmates App - a collaborative platform for flatmates to manage todos, shopping lists, and expenses.

## 🚀 Features

- **FastAPI Framework**: Modern, fast, async web framework
- **PostgreSQL Database**: Robust relational database with SQLAlchemy ORM
- **Alembic Migrations**: Database version control and schema management
- **JWT Authentication**: Secure token-based authentication (ready for implementation)
- **CORS Support**: Configured for React Native mobile app development
- **Auto-generated API Docs**: Interactive API documentation at `/docs`

## 📋 Prerequisites

- Python 3.11 or higher
- PostgreSQL 12 or higher (local or cloud service like Neon/Supabase)
- pip (Python package manager)

## 🛠️ Setup Instructions

### 1. Create Virtual Environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables

Create a `.env` file in the `backend/` directory by copying the example:

```bash
cp .env.example .env
```

Edit `.env` and update the values:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/flatmates_db
SECRET_KEY=your-secret-key-here-generate-a-secure-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
BACKEND_CORS_ORIGINS=["http://localhost:3000","http://localhost:8081","exp://192.168.1.1:8081"]

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Important:** 
- Replace `user`, `password`, and database name in `DATABASE_URL` with your PostgreSQL credentials
- Generate a secure `SECRET_KEY` (you can use: `openssl rand -hex 32`)
- Update `BACKEND_CORS_ORIGINS` with your frontend URLs
- Configure Google OAuth credentials (see Google OAuth Setup section below)

### 4. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

```bash
# Create database
createdb flatmates_db

# Or using psql
psql -U postgres
CREATE DATABASE flatmates_db;
\q
```

#### Option B: Cloud PostgreSQL (Neon/Supabase)

1. Create a new database on [Neon](https://neon.tech) or [Supabase](https://supabase.com)
2. Copy the connection string provided
3. Update `DATABASE_URL` in your `.env` file

### 5. Run Database Migrations

Initialize the database with Alembic:

```bash
# Create initial migration (when you add models)
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

### 6. Start Development Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py          # Configuration and settings
│   │   ├── database.py        # Database connection and session
│   │   └── security.py        # Authentication utilities
│   ├── models/
│   │   ├── __init__.py
│   │   └── base.py            # SQLAlchemy models (add your models here)
│   ├── schemas/
│   │   └── __init__.py        # Pydantic schemas for request/response
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py            # API dependencies
│   │   └── v1/
│   │       ├── __init__.py
│   │       └── endpoints/     # API endpoints (add your routes here)
│   │           └── __init__.py
│   └── db/
│       ├── __init__.py
│       └── base.py            # Import all models for Alembic
├── alembic/
│   ├── versions/              # Migration files
│   ├── env.py                 # Alembic environment configuration
│   └── script.py.mako         # Migration script template
├── alembic.ini                # Alembic configuration
├── requirements.txt           # Python dependencies
├── .env.example               # Environment variables template
├── .env                       # Your local environment variables (create this)
├── .gitignore                # Git ignore rules
└── README.md                 # This file
```

## 🔧 Development Workflow

### Adding New Models

1. Create model in `app/models/`:
```python
# app/models/user.py
from sqlalchemy import Column, Integer, String
from app.db.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
```

2. Import in `app/models/base.py`:
```python
from app.models.user import User
```

3. Create migration:
```bash
alembic revision --autogenerate -m "Add user model"
alembic upgrade head
```

### Adding New Endpoints

1. Create endpoint file in `app/api/v1/endpoints/`:
```python
# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db

router = APIRouter()

@router.get("/users")
async def get_users(db: Session = Depends(get_db)):
    return {"users": []}
```

2. Include router in `app/main.py`:
```python
from app.api.v1.endpoints import users
app.include_router(users.router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
pytest

# Run with coverage report
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_health.py
pytest tests/test_auth_endpoints.py

# Run tests with markers
pytest -m unit
pytest -m integration
```

### Test Structure

```
tests/
├── __init__.py
├── conftest.py           # Test fixtures and configuration
├── test_health.py        # Health check endpoint tests
├── test_auth.py          # Authentication tests
└── test_database.py      # Database connection tests
```

### Code Quality

```bash
# Run flake8 linting
flake8 app

# Run black formatter
black app

# Check formatting
black --check app

# Run isort
isort app
```

### Pre-commit Hooks

Install pre-commit hooks for automatic code quality checks:

```bash
pip install pre-commit
pre-commit install
pre-commit run --all-files
```

The health check endpoint verifies that:
- The API is running
- Database connection is working

Test it:
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

## 📚 API Documentation

FastAPI automatically generates interactive API documentation:

- **Swagger UI**: http://localhost:8000/docs
  - Interactive API testing interface
  - Try out endpoints directly from browser
  
- **ReDoc**: http://localhost:8000/redoc
  - Alternative documentation interface
  - Better for reading/printing

## 🔐 Authentication & Security

### Google OAuth 2.0 Setup

The backend uses Google OAuth 2.0 for user authentication. Follow these steps to configure it:

#### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API for your project

#### 2. Configure OAuth Consent Screen

1. Navigate to **APIs & Services** → **OAuth consent screen**
2. Choose **External** user type
3. Fill in the required information:
   - App name: "Flatmates App"
   - User support email: Your email
   - Developer contact email: Your email
4. Add scopes:
   - `userinfo.email`
   - `userinfo.profile`
5. Save and continue

#### 3. Create OAuth 2.0 Credentials

1. Navigate to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth 2.0 Client ID**
3. Select **Web application** as the application type
4. Add authorized redirect URIs (if needed for web)
5. Click **Create**
6. Copy the **Client ID** and **Client Secret**
7. Update your `.env` file:
   ```env
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

#### 4. Authentication Endpoints

The backend provides the following authentication endpoints:

- **POST `/api/v1/auth/google/mobile`**: Authenticate with Google ID token
  - Request body: `{ "id_token": "google-id-token" }`
  - Returns: JWT access token and user information
  
- **GET `/api/v1/auth/me`**: Get current user information
  - Requires: Bearer token in Authorization header
  - Returns: User profile data
  
- **POST `/api/v1/auth/logout`**: Logout (validates token)
  - Requires: Bearer token in Authorization header
  - Returns: Success message

#### 5. JWT Token Configuration

- Tokens expire after **7 days** (10080 minutes) by default
- Tokens are signed using the `SECRET_KEY` from environment variables
- Algorithm: HS256

### Security Best Practices

- Passwords are hashed using bcrypt (via passlib)
- JWT tokens for authentication with 7-day expiration
- Google OAuth 2.0 for secure authentication
- CORS configured for mobile app access
- Environment variables for sensitive data
- User data includes email, name, and Google profile picture

**Remember:** 
- Never commit `.env` file or expose your `SECRET_KEY`
- Keep your Google OAuth credentials secure
- Use HTTPS in production
- Rotate your `SECRET_KEY` periodically

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
pg_isready

# Test connection
psql -U postgres -d flatmates_db

# Verify DATABASE_URL format
echo $DATABASE_URL
```

### Import Errors

Make sure you're in the correct directory and virtual environment:
```bash
cd backend
source venv/bin/activate
python -c "import app"
```

### Port Already in Use

Change the port:
```bash
uvicorn app.main:app --reload --port 8001
```

## 🐳 Docker

### Build and Run with Docker Compose

```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Rebuild after changes
docker-compose up -d --build
```

### Docker Services

- **backend**: FastAPI application on port 8000
- **postgres**: PostgreSQL database on port 5432

### Access Services

- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

## 🚀 Deployment

### Railway Deployment

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and link project:
   ```bash
   railway login
   railway link
   ```

3. Deploy:
   ```bash
   railway up
   ```

4. Set environment variables in Railway dashboard

### Render Deployment

1. Create a new Web Service in Render dashboard
2. Connect your GitHub repository
3. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add environment variables
5. Deploy

## 🔄 CI/CD

### GitHub Actions Workflow

The backend CI/CD pipeline (`..github/workflows/backend-ci.yml`) runs automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` branch

**Test Job:**
- Sets up Python 3.11 with dependency caching
- Installs dependencies
- Runs flake8 linting
- Checks code formatting with black
- Runs pytest with coverage reporting
- Uploads coverage to Codecov

**Deploy Job:**
- Triggers on push to main branch
- Deploys to Railway/Render (when configured)

### Build Status

![Backend CI/CD](https://github.com/himanshulodha2002/flatmates-app/workflows/Backend%20CI%2FCD/badge.svg)

### Running CI Locally

You can run the same checks locally before pushing:

```bash
# Linting
flake8 app

# Formatting check
black --check app

# Run tests
pytest --cov=app
```

## 📝 Next Steps

1. **Add Authentication**: Implement user registration and login endpoints
2. **Create Models**: Add models for todos, shopping lists, expenses, flatmates
3. **Build API Endpoints**: Create CRUD operations for each model
4. **Add Validation**: Implement comprehensive Pydantic schemas
5. **Testing**: Add unit and integration tests
6. **Deployment**: Deploy to a cloud platform (Railway, Render, AWS, etc.)

## 🤝 Contributing

When adding new features:
1. Create feature branch
2. Add/update models and migrations
3. Implement endpoints with proper documentation
4. Test endpoints via `/docs`
5. Update this README if needed

## 📄 License

This project is part of the Flatmates App.

## 🔗 Related Documentation

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
