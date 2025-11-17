"""
Authentication endpoints for Google OAuth.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from app.api.deps import get_db, get_current_user
from app.core.config import settings
from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import GoogleTokenRequest, TokenResponse, UserResponse

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

        # Create JWT access token
        access_token = create_access_token(data={"sub": str(user.id)})

        return TokenResponse(
            access_token=access_token, token_type="bearer", user=UserResponse.model_validate(user)
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
