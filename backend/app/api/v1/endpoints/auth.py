from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, create_access_token
from backend.app.core.config import settings
from backend.app.models.user_profile import UserProfile
from backend.app.schemas.auth import LoginRequest, TokenResponse, UserOut
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """Authenticate single-user and issue a signed JWT access token."""
    user = db.query(UserProfile).filter(UserProfile.email == login_data.email).first()
    if not user:
        # Personal Agent single-user fallback: authenticate the sole candidate profile
        user = db.query(UserProfile).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": {"code": "UNAUTHORIZED", "message": "Incorrect email or password"}},
        )

    access_token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: UserProfile = Depends(get_current_user)
):
    """Get the currently authenticated user's account info."""
    return current_user
