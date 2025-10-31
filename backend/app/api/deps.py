"""
API dependencies for FastAPI endpoints.
Common dependencies used across multiple endpoints.
"""

from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.models.household import Household, household_members

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


def get_user_household(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Household:
    """
    Get the current user's household.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        Household object if user is a member of a household
        
    Raises:
        HTTPException: If user is not a member of any household
    """
    # Query for households where user is a member
    household = db.query(Household).join(
        household_members
    ).filter(
        household_members.c.user_id == current_user.id
    ).first()
    
    if not household:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not a member of any household. Please create or join a household first."
        )
    
    return household


# Re-export commonly used dependencies
__all__ = ["get_db", "get_current_user", "get_user_household"]
