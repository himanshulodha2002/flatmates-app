"""
API dependencies for FastAPI endpoints.
Common dependencies used across multiple endpoints.
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.household import Household, HouseholdMember, MemberRole

# Security scheme for JWT bearer token
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user from JWT token."""
    try:
        payload = verify_token(credentials.credentials)
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

    return user


def verify_household_membership(
    household_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> HouseholdMember:
    """
    Verify user is a member of the household.

    Raises:
        HTTPException 403 if user is not a member
    """
    member = (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.household_id == household_id,
            HouseholdMember.user_id == current_user.id,
        )
        .first()
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this household",
        )
    return member


def verify_owner_permission(
    household_id: uuid.UUID,
    current_user: User,
    db: Session,
) -> HouseholdMember:
    """
    Verify user is an owner of the household.

    Raises:
        HTTPException 403 if user is not an owner
    """
    member = verify_household_membership(household_id, current_user, db)
    if member.role != MemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only household owners can perform this action",
        )
    return member


__all__ = ["get_db", "get_current_user", "verify_household_membership", "verify_owner_permission"]
