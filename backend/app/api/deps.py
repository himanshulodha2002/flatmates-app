"""
API dependencies for FastAPI endpoints.
Common dependencies used across multiple endpoints.
"""

from typing import Generator, Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.household import HouseholdMember

# Security scheme for JWT bearer token
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP authorization credentials containing the bearer token
        db: Database session
        
    Returns:
        User object if authentication successful
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    try:
        # Verify token and get payload
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
    
    # Get user from database
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return user


def get_user_household_id(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Optional[UUID]:
    """
    Get the household ID for the current user.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Household ID if user is a member of a household, None otherwise
    """
    membership = db.query(HouseholdMember).filter(
        HouseholdMember.user_id == current_user.id
    ).first()
    
    return membership.household_id if membership else None


def require_household_membership(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> UUID:
    """
    Require that the current user is a member of a household.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Household ID
        
    Raises:
        HTTPException: If user is not a member of any household
    """
    household_id = get_user_household_id(current_user, db)
    
    if household_id is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must be a member of a household to access this resource"
        )
    
    return household_id


# Re-export commonly used dependencies
__all__ = ["get_db", "get_current_user", "get_user_household_id", "require_household_membership"]
