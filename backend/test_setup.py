"""
Test script to verify FastAPI backend setup.
Run this after installing dependencies to ensure everything works.

Usage:
    python test_setup.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def test_imports():
    """Test that all required modules can be imported."""
    print("Testing imports...")
    
    try:
        import fastapi
        print("✓ FastAPI imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import FastAPI: {e}")
        return False
    
    try:
        import uvicorn
        print("✓ Uvicorn imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import Uvicorn: {e}")
        return False
    
    try:
        import sqlalchemy
        print("✓ SQLAlchemy imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import SQLAlchemy: {e}")
        return False
    
    try:
        import pydantic
        print("✓ Pydantic imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import Pydantic: {e}")
        return False
    
    try:
        from pydantic_settings import BaseSettings
        print("✓ Pydantic Settings imported successfully")
    except ImportError as e:
        print(f"✗ Failed to import Pydantic Settings: {e}")
        return False
    
    return True


def test_app_structure():
    """Test that the app structure is correct."""
    print("\nTesting app structure...")
    
    required_paths = [
        "app/__init__.py",
        "app/main.py",
        "app/core/__init__.py",
        "app/core/config.py",
        "app/core/database.py",
        "app/core/security.py",
        "app/models/__init__.py",
        "app/models/base.py",
        "app/schemas/__init__.py",
        "app/api/__init__.py",
        "app/api/deps.py",
        "app/api/v1/__init__.py",
        "app/api/v1/endpoints/__init__.py",
        "app/db/__init__.py",
        "app/db/base.py",
        "alembic.ini",
        "alembic/env.py",
        "requirements.txt",
        ".env.example",
        ".gitignore",
    ]
    
    all_exist = True
    for path in required_paths:
        full_path = os.path.join(os.path.dirname(__file__), path)
        if os.path.exists(full_path):
            print(f"✓ {path}")
        else:
            print(f"✗ {path} missing")
            all_exist = False
    
    return all_exist


def test_config():
    """Test that configuration loads correctly."""
    print("\nTesting configuration...")
    
    try:
        from app.core.config import settings
        print(f"✓ Settings loaded")
        print(f"  - Project Name: {settings.PROJECT_NAME}")
        print(f"  - API Version: {settings.API_V1_STR}")
        print(f"  - Database URL: {settings.DATABASE_URL[:30]}...")
        return True
    except Exception as e:
        print(f"✗ Failed to load settings: {e}")
        return False


def test_database_setup():
    """Test database configuration."""
    print("\nTesting database setup...")
    
    try:
        from app.core.database import engine, Base, get_db
        print("✓ Database module imported")
        print("✓ Engine created")
        print("✓ Base declarative class available")
        print("✓ get_db dependency function available")
        return True
    except Exception as e:
        print(f"✗ Failed to setup database: {e}")
        return False


def test_security():
    """Test security utilities."""
    print("\nTesting security utilities...")
    
    try:
        from app.core.security import (
            verify_password,
            get_password_hash,
            create_access_token,
            decode_access_token
        )
        print("✓ Security functions imported")
        
        # Test password hashing
        password = "test_password_123"
        hashed = get_password_hash(password)
        print("✓ Password hashing works")
        
        # Test password verification
        is_valid = verify_password(password, hashed)
        if is_valid:
            print("✓ Password verification works")
        else:
            print("✗ Password verification failed")
            return False
        
        # Test token creation
        token = create_access_token({"sub": "test_user"})
        print("✓ JWT token creation works")
        
        # Test token decoding
        payload = decode_access_token(token)
        if payload and payload.get("sub") == "test_user":
            print("✓ JWT token decoding works")
        else:
            print("✗ JWT token decoding failed")
            return False
        
        return True
    except Exception as e:
        print(f"✗ Failed to test security: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_main_app():
    """Test that the main app can be imported."""
    print("\nTesting main application...")
    
    try:
        from app.main import app
        print("✓ FastAPI app imported successfully")
        print(f"  - Title: {app.title}")
        print(f"  - Version: {app.version}")
        
        # Check routes
        routes = [route.path for route in app.routes]
        print(f"  - Routes: {', '.join(routes)}")
        
        if "/health" in routes:
            print("✓ Health check endpoint exists")
        else:
            print("✗ Health check endpoint missing")
            return False
        
        return True
    except Exception as e:
        print(f"✗ Failed to import main app: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("FastAPI Backend Setup Test Suite")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Imports", test_imports()))
    results.append(("App Structure", test_app_structure()))
    results.append(("Configuration", test_config()))
    results.append(("Database Setup", test_database_setup()))
    results.append(("Security", test_security()))
    results.append(("Main App", test_main_app()))
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print("\n" + "=" * 60)
    print(f"Results: {passed}/{total} tests passed")
    print("=" * 60)
    
    if passed == total:
        print("\n🎉 All tests passed! Backend setup is complete.")
        print("\nNext steps:")
        print("1. Configure your PostgreSQL database")
        print("2. Update .env with your database credentials")
        print("3. Run: alembic upgrade head")
        print("4. Run: uvicorn app.main:app --reload")
        print("5. Visit: http://localhost:8000/docs")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please review the errors above.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
