"""
Pytest configuration and shared fixtures.
"""
import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set test environment variables before importing app
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["SECRET_KEY"] = "test-secret-key-for-pytest"
os.environ["BACKEND_CORS_ORIGINS"] = '["http://localhost:3000"]'

from app.main import app
from app.core.database import get_db, Base
from app.core.security import create_access_token
from app.models.user import User
from app.models.household import Household, HouseholdMember, HouseholdInvite, MemberRole, InviteStatus
from app.models.todo import Todo, TodoStatus, TodoPriority
from app.models.expense import Expense, ExpenseSplit, ExpenseCategory, SplitType, PaymentMethod
from app.models.shopping import ShoppingList, ShoppingListItem, ShoppingListStatus


SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# ──── User fixtures ────


@pytest.fixture
def user1(db_session) -> User:
    """Create first test user."""
    user = User(
        id=uuid.uuid4(),
        email="alice@example.com",
        full_name="Alice Smith",
        google_id="google-alice",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def user2(db_session) -> User:
    """Create second test user."""
    user = User(
        id=uuid.uuid4(),
        email="bob@example.com",
        full_name="Bob Jones",
        google_id="google-bob",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def user3(db_session) -> User:
    """Create third test user (not in any household by default)."""
    user = User(
        id=uuid.uuid4(),
        email="charlie@example.com",
        full_name="Charlie Brown",
        google_id="google-charlie",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


def auth_header(user: User) -> dict:
    """Create authorization header for a user."""
    token = create_access_token({"sub": str(user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth1(user1) -> dict:
    """Auth headers for user1."""
    return auth_header(user1)


@pytest.fixture
def auth2(user2) -> dict:
    """Auth headers for user2."""
    return auth_header(user2)


@pytest.fixture
def auth3(user3) -> dict:
    """Auth headers for user3."""
    return auth_header(user3)


# ──── Household fixtures ────


@pytest.fixture
def household(db_session, user1, user2) -> Household:
    """Create a household with user1 as owner and user2 as member."""
    h = Household(id=uuid.uuid4(), name="Test Apartment", created_by=user1.id)
    db_session.add(h)
    db_session.flush()

    m1 = HouseholdMember(user_id=user1.id, household_id=h.id, role=MemberRole.OWNER)
    m2 = HouseholdMember(user_id=user2.id, household_id=h.id, role=MemberRole.MEMBER)
    db_session.add_all([m1, m2])
    db_session.commit()
    db_session.refresh(h)
    return h

