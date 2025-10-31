"""
Tests for household management endpoints.
"""
import pytest
import uuid
from datetime import datetime, timedelta
from unittest.mock import patch

from app.models.user import User
from app.models.household import Household, HouseholdMember, HouseholdInvite, MemberRole, InviteStatus
from app.core.security import create_access_token


@pytest.fixture
def test_user(db_session):
    """Create a test user."""
    user = User(
        id=uuid.uuid4(),
        email="test@example.com",
        full_name="Test User",
        google_id="google-123",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def test_user2(db_session):
    """Create a second test user."""
    user = User(
        id=uuid.uuid4(),
        email="test2@example.com",
        full_name="Test User 2",
        google_id="google-456",
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def auth_headers(test_user):
    """Create authentication headers for test user."""
    token = create_access_token({"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_user2(test_user2):
    """Create authentication headers for second test user."""
    token = create_access_token({"sub": str(test_user2.id)})
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.integration
def test_create_household(client, test_user, auth_headers):
    """Test creating a new household."""
    response = client.post(
        "/api/v1/households/",
        json={"name": "My Apartment"},
        headers=auth_headers
    )
    
    assert response.status_code == 201
    data = response.json()
    
    assert data["name"] == "My Apartment"
    assert data["created_by"] == str(test_user.id)
    assert "id" in data
    assert "created_at" in data
    assert data["member_count"] == 1


@pytest.mark.integration
def test_list_my_households(client, test_user, auth_headers, db_session):
    """Test listing user's households."""
    # Create two households
    household1 = Household(name="Apartment 1", created_by=test_user.id)
    household2 = Household(name="Apartment 2", created_by=test_user.id)
    db_session.add_all([household1, household2])
    db_session.flush()
    
    # Add user as member
    member1 = HouseholdMember(user_id=test_user.id, household_id=household1.id, role=MemberRole.OWNER)
    member2 = HouseholdMember(user_id=test_user.id, household_id=household2.id, role=MemberRole.OWNER)
    db_session.add_all([member1, member2])
    db_session.commit()
    
    response = client.get("/api/v1/households/mine", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    
    assert len(data) == 2
    assert data[0]["name"] in ["Apartment 1", "Apartment 2"]
    assert data[1]["name"] in ["Apartment 1", "Apartment 2"]


@pytest.mark.integration
def test_get_household_details(client, test_user, test_user2, auth_headers, db_session):
    """Test getting household details with members."""
    # Create household
    household = Household(name="Test House", created_by=test_user.id)
    db_session.add(household)
    db_session.flush()
    
    # Add members
    member1 = HouseholdMember(user_id=test_user.id, household_id=household.id, role=MemberRole.OWNER)
    member2 = HouseholdMember(user_id=test_user2.id, household_id=household.id, role=MemberRole.MEMBER)
    db_session.add_all([member1, member2])
    db_session.commit()
    
    response = client.get(f"/api/v1/households/{household.id}", headers=auth_headers)
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["name"] == "Test House"
    assert len(data["members"]) == 2
    assert any(m["email"] == "test@example.com" and m["role"] == "owner" for m in data["members"])
    assert any(m["email"] == "test2@example.com" and m["role"] == "member" for m in data["members"])


@pytest.mark.integration
def test_get_household_not_member(client, test_user, test_user2, auth_headers_user2, db_session):
    """Test that non-members cannot access household details."""
    # Create household with only test_user
    household = Household(name="Private House", created_by=test_user.id)
    db_session.add(household)
    db_session.flush()
    
    member = HouseholdMember(user_id=test_user.id, household_id=household.id, role=MemberRole.OWNER)
    db_session.add(member)
    db_session.commit()
    
    # Try to access with test_user2
    response = client.get(f"/api/v1/households/{household.id}", headers=auth_headers_user2)
    
    assert response.status_code == 403


@pytest.mark.integration
def test_create_invite(client, test_user, auth_headers, db_session):
    """Test creating an invite."""
    # Create household
    household = Household(name="Test House", created_by=test_user.id)
    db_session.add(household)
    db_session.flush()
    
    member = HouseholdMember(user_id=test_user.id, household_id=household.id, role=MemberRole.OWNER)
    db_session.add(member)
    db_session.commit()
    
    response = client.post(
        f"/api/v1/households/{household.id}/invite",
        json={"email": "newuser@example.com"},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["email"] == "newuser@example.com"
    assert data["status"] == "pending"
    assert "token" in data
    assert "expires_at" in data


@pytest.mark.integration
def test_create_invite_member_cannot(client, test_user, test_user2, auth_headers_user2, db_session):
    """Test that regular members cannot create invites."""
    # Create household with test_user as owner
    household = Household(name="Test House", created_by=test_user.id)
    db_session.add(household)
    db_session.flush()
    
    member1 = HouseholdMember(user_id=test_user.id, household_id=household.id, role=MemberRole.OWNER)
    member2 = HouseholdMember(user_id=test_user2.id, household_id=household.id, role=MemberRole.MEMBER)
    db_session.add_all([member1, member2])
    db_session.commit()
    
    # Try to create invite as member
    response = client.post(
        f"/api/v1/households/{household.id}/invite",
        json={"email": "newuser@example.com"},
        headers=auth_headers_user2
    )
    
    assert response.status_code == 403


@pytest.mark.integration
def test_join_household(client, test_user2, auth_headers_user2, db_session):
    """Test joining a household via invite token."""
    # Create household with a different user
    other_user = User(
        id=uuid.uuid4(),
        email="owner@example.com",
        full_name="Owner User",
        google_id="google-owner",
        is_active=True
    )
    db_session.add(other_user)
    db_session.flush()
    
    household = Household(name="Test House", created_by=other_user.id)
    db_session.add(household)
    db_session.flush()
    
    member = HouseholdMember(user_id=other_user.id, household_id=household.id, role=MemberRole.OWNER)
    db_session.add(member)
    
    # Create invite
    invite = HouseholdInvite(
        household_id=household.id,
        email="test2@example.com",
        token="test-token-123",
        status=InviteStatus.PENDING,
        expires_at=datetime.utcnow() + timedelta(days=7),
        created_by=other_user.id
    )
    db_session.add(invite)
    db_session.commit()
    
    # Join household
    response = client.post(
        "/api/v1/households/join",
        json={"token": "test-token-123"},
        headers=auth_headers_user2
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["name"] == "Test House"
    assert data["member_count"] == 2


@pytest.mark.integration
def test_join_household_invalid_token(client, auth_headers):
    """Test joining with invalid token."""
    response = client.post(
        "/api/v1/households/join",
        json={"token": "invalid-token"},
        headers=auth_headers
    )
    
    assert response.status_code == 404


@pytest.mark.integration
def test_join_household_expired_token(client, test_user2, auth_headers_user2, db_session):
    """Test joining with expired token."""
    other_user = User(
        id=uuid.uuid4(),
        email="owner@example.com",
        full_name="Owner User",
        google_id="google-owner",
        is_active=True
    )
    db_session.add(other_user)
    db_session.flush()
    
    household = Household(name="Test House", created_by=other_user.id)
    db_session.add(household)
    db_session.flush()
    
    member = HouseholdMember(user_id=other_user.id, household_id=household.id, role=MemberRole.OWNER)
    db_session.add(member)
    
    # Create expired invite
    invite = HouseholdInvite(
        household_id=household.id,
        email="test2@example.com",
        token="expired-token-123",
        status=InviteStatus.PENDING,
        expires_at=datetime.utcnow() - timedelta(days=1),
        created_by=other_user.id
    )
    db_session.add(invite)
    db_session.commit()
    
    response = client.post(
        "/api/v1/households/join",
        json={"token": "expired-token-123"},
        headers=auth_headers_user2
    )
    
    assert response.status_code == 400


@pytest.mark.integration
def test_update_member_role(client, test_user, test_user2, auth_headers, db_session):
    """Test updating a member's role."""
    # Create household
    household = Household(name="Test House", created_by=test_user.id)
    db_session.add(household)
    db_session.flush()
    
    member1 = HouseholdMember(user_id=test_user.id, household_id=household.id, role=MemberRole.OWNER)
    member2 = HouseholdMember(user_id=test_user2.id, household_id=household.id, role=MemberRole.MEMBER)
    db_session.add_all([member1, member2])
    db_session.commit()
    
    # Promote member2 to owner
    response = client.patch(
        f"/api/v1/households/{household.id}/members/{member2.id}",
        json={"role": "owner"},
        headers=auth_headers
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["role"] == "owner"
    assert data["email"] == "test2@example.com"


@pytest.mark.integration
def test_update_member_role_member_cannot(client, test_user, test_user2, auth_headers_user2, db_session):
    """Test that regular members cannot update roles."""
    household = Household(name="Test House", created_by=test_user.id)
    db_session.add(household)
    db_session.flush()
    
    member1 = HouseholdMember(user_id=test_user.id, household_id=household.id, role=MemberRole.OWNER)
    member2 = HouseholdMember(user_id=test_user2.id, household_id=household.id, role=MemberRole.MEMBER)
    db_session.add_all([member1, member2])
    db_session.commit()
    
    response = client.patch(
        f"/api/v1/households/{household.id}/members/{member1.id}",
        json={"role": "member"},
        headers=auth_headers_user2
    )
    
    assert response.status_code == 403


@pytest.mark.integration
def test_cannot_demote_last_owner(client, test_user, auth_headers, db_session):
    """Test that last owner cannot be demoted."""
    household = Household(name="Test House", created_by=test_user.id)
    db_session.add(household)
    db_session.flush()
    
    member = HouseholdMember(user_id=test_user.id, household_id=household.id, role=MemberRole.OWNER)
    db_session.add(member)
    db_session.commit()
    
    response = client.patch(
        f"/api/v1/households/{household.id}/members/{member.id}",
        json={"role": "member"},
        headers=auth_headers
    )
    
    assert response.status_code == 400


@pytest.mark.integration
def test_remove_member(client, test_user, test_user2, auth_headers, db_session):
    """Test removing a member from household."""
    household = Household(name="Test House", created_by=test_user.id)
    db_session.add(household)
    db_session.flush()
    
    member1 = HouseholdMember(user_id=test_user.id, household_id=household.id, role=MemberRole.OWNER)
    member2 = HouseholdMember(user_id=test_user2.id, household_id=household.id, role=MemberRole.MEMBER)
    db_session.add_all([member1, member2])
    db_session.commit()
    
    response = client.delete(
        f"/api/v1/households/{household.id}/members/{member2.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 204


@pytest.mark.integration
def test_cannot_remove_last_owner(client, test_user, auth_headers, db_session):
    """Test that last owner cannot be removed."""
    household = Household(name="Test House", created_by=test_user.id)
    db_session.add(household)
    db_session.flush()
    
    member = HouseholdMember(user_id=test_user.id, household_id=household.id, role=MemberRole.OWNER)
    db_session.add(member)
    db_session.commit()
    
    response = client.delete(
        f"/api/v1/households/{household.id}/members/{member.id}",
        headers=auth_headers
    )
    
    assert response.status_code == 400
