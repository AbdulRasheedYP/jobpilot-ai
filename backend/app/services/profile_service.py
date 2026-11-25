import uuid
from sqlalchemy.orm import Session
from backend.app.models.user_profile import UserProfile
from backend.app.schemas.profile import ProfileUpdate


def get_profile(db: Session, user_id: uuid.UUID) -> UserProfile:
    user = db.query(UserProfile).filter(UserProfile.id == user_id).first()
    if not user:
        raise ValueError("User profile not found")
    return user


def update_profile(db: Session, user: UserProfile, update_data: ProfileUpdate) -> UserProfile:
    update_dict = update_data.model_dump(exclude_unset=True)
    for key, value in update_dict.items():
        if hasattr(user, key):
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)

    # Dynamically expand database lookup taxonomy with user-confirmed skills
    if "skills" in update_dict and update_dict["skills"]:
        try:
            from backend.app.services.lookup_service import add_lookup_if_missing
            for skill in update_dict["skills"]:
                if isinstance(skill, str) and skill.strip():
                    add_lookup_if_missing(db, "skill", skill.strip())
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Failed to auto-register skill lookup: {e}")

    return user
