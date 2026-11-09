from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user_profile import UserProfile
from backend.app.schemas.profile import ProfileResponse, ProfileUpdate
from backend.app.services import profile_service

router = APIRouter(prefix="/profile", tags=["Profile"])


@router.get("", response_model=ProfileResponse)
def get_user_profile(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the candidate profile for the currently authenticated user."""
    return current_user


@router.put("", response_model=ProfileResponse)
def update_user_profile(
    payload: ProfileUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update candidate profile details."""
    updated = profile_service.update_profile(db=db, user=current_user, update_data=payload)
    return updated
