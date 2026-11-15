from datetime import datetime, timedelta, timezone
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from backend.app.models.application import Application
from backend.app.models.job import Job, JobSource
from backend.app.models.job_match import JobMatch
from backend.app.models.user_profile import UserProfile, JobPreference
from backend.app.models.enums import ApplicationStatus


def evaluate_auto_apply_policy(
    db: Session,
    user: UserProfile,
    pref: JobPreference,
    job: Job,
    match: Optional[JobMatch],
    application: Application,
) -> Tuple[bool, str, bool]:
    """
    Deterministic Auto-Apply Policy Checker (as specified in DECISION_ENGINE.md Section 6):
    
    Returns:
    - is_allowed: bool
    - rejection_reason: str
    - requires_manual_action: bool
    """
    # 1. User auto-apply toggle
    if not pref.auto_apply_enabled:
        return False, "Auto-apply is currently disabled in your job preferences.", False

    # 2. Source permission
    source = job.source
    if not source or not source.permits_auto_apply:
        return False, f"Job source '{source.name if source else 'Unknown'}' does not permit automated submissions.", True

    # 3. Eligibility check
    if not match or not match.eligibility_passed:
        return False, "Job failed initial eligibility criteria.", False

    # 4. Match score threshold
    if match.overall_score < pref.min_match_score:
        return (
            False,
            f"Match score ({match.overall_score}%) is below configured threshold ({pref.min_match_score}%).",
            False,
        )

    # 5. Duplicate submission check
    if application.status in [ApplicationStatus.APPLIED_CONFIRMED, ApplicationStatus.SUBMITTING]:
        return False, f"Application already processed or in submission state ({application.status.value}).", False

    # 6. Screening answers readiness
    if application.status != ApplicationStatus.READY:
        return False, "Application screening answers are incomplete or require candidate review.", True

    # 7. Daily & Weekly rate limits
    now = datetime.now(timezone.utc)
    start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    daily_count = (
        db.query(Application)
        .filter(
            Application.user_profile_id == user.id,
            Application.status == ApplicationStatus.APPLIED_CONFIRMED,
            Application.submitted_at >= start_of_day,
        )
        .count()
    )
    if daily_count >= pref.daily_application_limit:
        return (
            False,
            f"Daily application limit reached ({daily_count}/{pref.daily_application_limit}).",
            False,
        )

    weekly_count = (
        db.query(Application)
        .filter(
            Application.user_profile_id == user.id,
            Application.status == ApplicationStatus.APPLIED_CONFIRMED,
            Application.submitted_at >= seven_days_ago,
        )
        .count()
    )
    if weekly_count >= pref.weekly_application_limit:
        return (
            False,
            f"Weekly application limit reached ({weekly_count}/{pref.weekly_application_limit}).",
            False,
        )

    return True, "All auto-apply policy checks passed.", False
