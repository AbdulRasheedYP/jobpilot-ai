from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user_profile import UserProfile
from backend.app.schemas.preference import JobPreferenceResponse, JobPreferenceUpdate
from backend.app.services import preference_service

router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.get("", response_model=JobPreferenceResponse)
def get_preferences(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve search parameters, scoring criteria, and application limits for the candidate."""
    return preference_service.get_or_create_preferences(db=db, user_id=current_user.id)


@router.put("", response_model=JobPreferenceResponse)
def update_preferences(
    payload: JobPreferenceUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update job search preferences and auto-apply parameters."""
    return preference_service.update_preferences(
        db=db,
        user_id=current_user.id,
        update_data=payload,
    )
