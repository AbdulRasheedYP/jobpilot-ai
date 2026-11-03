import uuid
from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.core.security import decode_access_token
from backend.app.models.user_profile import UserProfile
from backend.app.core.config import settings

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_PREFIX}/auth/login",
    auto_error=False
)


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> UserProfile:
    """Dependency to retrieve and authenticate the current user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={"error": {"code": "UNAUTHORIZED", "message": "Invalid authentication credentials"}},
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception

    user_id_str = decode_access_token(token)
    if not user_id_str:
        raise credentials_exception

    try:
        user_uuid = uuid.UUID(str(user_id_str))
    except (ValueError, AttributeError):
        raise credentials_exception

    user = db.query(UserProfile).filter(UserProfile.id == user_uuid).first()
    if not user:
        raise credentials_exception

    return user
