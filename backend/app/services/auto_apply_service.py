import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from backend.app.models.application import Application, ApplicationAnswer
from backend.app.models.job import Job
from backend.app.models.job_match import JobMatch
from backend.app.models.user_profile import UserProfile
from backend.app.models.enums import ApplicationStatus
from backend.app.services.preference_service import get_or_create_preferences
from backend.app.services.auto_apply_policy import evaluate_auto_apply_policy
from backend.app.adapters.automation.portal_adapter import submit_application_to_portal

logger = logging.getLogger(__name__)


async def execute_application_submission(
    db: Session,
    application_id: uuid.UUID,
    user: UserProfile,
    is_manual_submission: bool = False,
) -> Application:
    """
    Submits a prepared application.
    Checks policy (unless manually triggered by user) and communicates with the portal.
    """
    app_record = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_profile_id == user.id)
        .first()
    )
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )

    job = app_record.job
    pref = get_or_create_preferences(db, user.id)
    match = (
        db.query(JobMatch)
        .filter(JobMatch.job_id == job.id, JobMatch.user_profile_id == user.id)
        .first()
    )

    # Policy verification for automated submission
    if not is_manual_submission:
        is_allowed, reason, requires_action = evaluate_auto_apply_policy(
            db=db,
            user=user,
            pref=pref,
            job=job,
            match=match,
            application=app_record,
        )
        if not is_allowed:
            if requires_action:
                app_record.status = ApplicationStatus.MANUAL_ACTION_REQUIRED
                app_record.notes = reason
                db.commit()
                db.refresh(app_record)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Auto-apply policy rejected submission: {reason}",
            )

    # Compile form data from stored answers
    answers = (
        db.query(ApplicationAnswer)
        .filter(ApplicationAnswer.application_id == app_record.id)
        .all()
    )
    form_data: Dict[str, Any] = {
        "full_name": user.full_name,
        "email": user.email,
        "phone": user.phone or "",
        "job_id": str(job.id),
        "external_job_id": job.external_id,
    }
    for ans in answers:
        form_data[ans.question] = ans.answer

    # Set status to SUBMITTING
    app_record.status = ApplicationStatus.SUBMITTING
    db.commit()

    # Submit to portal
    outcome_status, evidence, outcome_note = await submit_application_to_portal(
        application_url=job.application_url,
        form_data=form_data,
    )

    now = datetime.now(timezone.utc)
    app_record.status = outcome_status
    app_record.notes = outcome_note
    if outcome_status in [ApplicationStatus.APPLIED_CONFIRMED, ApplicationStatus.SUBMISSION_UNCONFIRMED]:
        app_record.submitted_at = now
        app_record.confirmation_evidence = evidence
        app_record.submission_method = "automated_adapter"
    elif outcome_status == ApplicationStatus.MANUAL_ACTION_REQUIRED:
        app_record.notes = outcome_note

    db.commit()
    db.refresh(app_record)
    return app_record


async def run_batch_auto_apply(
    db: Session,
    user: UserProfile,
    limit: int = 5,
) -> Dict[str, Any]:
    """
    Submits all applications currently in READY status up to the configured daily limit.
    """
    ready_apps = (
        db.query(Application)
        .filter(
            Application.user_profile_id == user.id,
            Application.status == ApplicationStatus.READY,
        )
        .limit(limit)
        .all()
    )

    results = {
        "attempted": len(ready_apps),
        "confirmed": 0,
        "manual_action_required": 0,
        "failed": 0,
        "details": [],
    }

    for app in ready_apps:
        try:
            submitted_app = await execute_application_submission(
                db=db,
                application_id=app.id,
                user=user,
                is_manual_submission=False,
            )
            if submitted_app.status == ApplicationStatus.APPLIED_CONFIRMED:
                results["confirmed"] += 1
            elif submitted_app.status == ApplicationStatus.MANUAL_ACTION_REQUIRED:
                results["manual_action_required"] += 1
            else:
                results["failed"] += 1

            results["details"].append({
                "application_id": str(app.id),
                "job_title": app.job.title,
                "status": submitted_app.status.value,
                "notes": submitted_app.notes,
            })
        except HTTPException as e:
            results["details"].append({
                "application_id": str(app.id),
                "job_title": app.job.title,
                "status": "REJECTED_BY_POLICY",
                "notes": e.detail,
            })

    return results
