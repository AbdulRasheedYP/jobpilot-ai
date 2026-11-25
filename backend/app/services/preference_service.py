import uuid
from sqlalchemy.orm import Session
from backend.app.models.user_profile import JobPreference
from backend.app.schemas.preference import JobPreferenceUpdate


def get_or_create_preferences(db: Session, user_id: uuid.UUID) -> JobPreference:
    pref = db.query(JobPreference).filter(JobPreference.user_profile_id == user_id).first()
    if not pref:
        pref = JobPreference(
            id=uuid.uuid4(),
            user_profile_id=user_id,
            target_roles=["Python Developer", "Backend Developer"],
            target_countries=["India", "Remote"],
            work_modes=["remote", "hybrid", "onsite"],
            experience_levels=["fresher", "junior", "trainee"],
            currency="INR",
            min_match_score=65,
            auto_apply_enabled=False,
            daily_application_limit=5,
            weekly_application_limit=25,
            excluded_companies=[],
        )
        db.add(pref)
        db.commit()
        db.refresh(pref)
    return pref


def update_preferences(
    db: Session,
    user_id: uuid.UUID,
    update_data: JobPreferenceUpdate,
) -> JobPreference:
    pref = get_or_create_preferences(db, user_id)
    update_dict = update_data.model_dump(exclude_unset=True)

    for key, value in update_dict.items():
        if hasattr(pref, key):
            setattr(pref, key, value)

    db.commit()
    db.refresh(pref)

    # Re-evaluate matches when candidate preferences change
    try:
        from backend.app.models.user_profile import UserProfile
        from backend.app.services.matching_engine import batch_evaluate_jobs
        user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
        if user:
            batch_evaluate_jobs(db=db, user=user, limit=50, force_reevaluate=True)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"Re-evaluation after preference update failed: {e}")

    return pref
