"""
Authentication endpoints for Google OAuth.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.core.security import create_access_token, decode_access_token
from app.models.user import User
from app.schemas.auth import (
    GoogleTokenRequest,
    TokenResponse,
    UserResponse,
    UserUpdate,
    RefreshTokenRequest,
    RefreshTokenResponse,
)

router = APIRouter()


@router.post("/google/mobile", response_model=TokenResponse, status_code=status.HTTP_200_OK)
async def google_login_mobile(token_request: GoogleTokenRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with Google OAuth token from mobile app.

    Verifies the Google ID token and creates or updates user in database.
    Returns JWT access token for subsequent API calls.

    Args:
        token_request: Google ID token from mobile OAuth flow
        db: Database session

    Returns:
        JWT access token and user information

    Raises:
        HTTPException: If token verification fails
    """
    try:
        # Verify Google ID token
        idinfo = id_token.verify_oauth2_token(
            token_request.id_token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )

        # Extract user information from token
        google_id = idinfo.get("sub")
        email = idinfo.get("email")
        full_name = idinfo.get("name", "")
        profile_picture = idinfo.get("picture")

        if not google_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Google token: missing required fields",
            )

        # Check if user exists
        user = db.query(User).filter(User.google_id == google_id).first()

        if not user:
            # Create new user
            user = User(
                email=email,
                full_name=full_name,
                google_id=google_id,
                profile_picture_url=profile_picture,
                is_active=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Update existing user info if changed
            if (
                user.email != email
                or user.full_name != full_name
                or user.profile_picture_url != profile_picture
            ):
                user.email = email
                user.full_name = full_name
                user.profile_picture_url = profile_picture
                db.commit()
                db.refresh(user)

        # Create JWT access token (also serves as refresh token for simplicity)
        access_token = create_access_token(data={"sub": str(user.id)})
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds

        return TokenResponse(
            access_token=access_token,
            refresh_token=access_token,  # Same token for simplicity
            token_type="bearer",
            expires_in=expires_in,
            user=UserResponse.model_validate(user),
        )

    except ValueError as e:
        # Google token verification failed
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail=f"Invalid Google token: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}",
        )


@router.post("/refresh", response_model=RefreshTokenResponse, status_code=status.HTTP_200_OK)
async def refresh_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    """
    Refresh an access token using a refresh token.
    
    For simplicity, we use the same JWT token as both access and refresh token.
    The token is validated and a new one is issued.
    """
    try:
        payload = decode_access_token(request.refresh_token)
        if payload is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token",
            )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        
        # Verify user exists and is active
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive",
            )
        
        # Create new access token
        new_access_token = create_access_token(data={"sub": str(user.id)})
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        
        return RefreshTokenResponse(
            access_token=new_access_token,
            expires_in=expires_in,
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}",
        )


@router.get("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information.

    Args:
        current_user: Current authenticated user from JWT token

    Returns:
        User information
    """
    return UserResponse.model_validate(current_user)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(current_user: User = Depends(get_current_user)):
    """
    Logout current user.

    Note: JWT tokens are stateless, so logout is handled client-side
    by removing the token. This endpoint validates the token is valid.

    Args:
        current_user: Current authenticated user from JWT token

    Returns:
        Success message
    """
    return {"message": "Successfully logged out"}


@router.patch("/me", response_model=UserResponse, status_code=status.HTTP_200_OK)
async def update_user_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update current user's profile.

    Args:
        user_update: Fields to update
        current_user: Current authenticated user from JWT token
        db: Database session

    Returns:
        Updated user information
    """
    # Update fields if provided
    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name
    if user_update.profile_picture_url is not None:
        current_user.profile_picture_url = user_update.profile_picture_url

    db.commit()
    db.refresh(current_user)

    return UserResponse.model_validate(current_user)
