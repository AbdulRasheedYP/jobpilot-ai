import uuid
import math
import logging
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from fastapi import HTTPException, status
from backend.app.models.resume import Resume
from backend.app.models.job import Job
from backend.app.models.user_profile import UserProfile
from backend.app.models.application import Application, ApplicationAnswer
from backend.app.models.enums import ApplicationStatus
from backend.app.schemas.application import AnswerItemSchema
from backend.app.services.cv_tailor import generate_tailored_resume
from backend.app.services.answer_engine import prepare_application_answers

logger = logging.getLogger(__name__)


async def prepare_application_for_job(
    db: Session,
    user: UserProfile,
    job_id: uuid.UUID,
) -> Application:
    """
    Prepares application using candidate's uploaded CV:
    1. Verifies target job.
    2. Attaches candidate's latest uploaded original CV.
    3. Prepares screening answers from profile facts.
    4. Evaluates whether mandatory information is missing (sets READY vs NEEDS_USER_INPUT).
    """
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job listing not found",
        )

    # Check for existing application
    existing = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.user_profile_id == user.id)
        .first()
    )
    if existing:
        return existing

    # 1. Attach candidate's uploaded original CV
    uploaded_resume = (
        db.query(Resume)
        .filter(Resume.user_profile_id == user.id)
        .order_by(desc(Resume.created_at))
        .first()
    )
    resume_id = uploaded_resume.id if uploaded_resume else None

    # Fallback to tailored generator only if no uploaded resume exists and provider is present (e.g. tests)
    if not resume_id:
        try:
            tailored_resume = await generate_tailored_resume(db=db, user=user, job=job)
            resume_id = tailored_resume.id
        except Exception:
            resume_id = None

    # 2. Prepare screening answers & detect missing info
    answers_data, all_ready, missing_fields = prepare_application_answers(user=user, job=job)

    initial_status = ApplicationStatus.READY if all_ready else ApplicationStatus.NEEDS_USER_INPUT
    notes = None
    if not all_ready:
        notes = f"Missing mandatory candidate details: {', '.join(missing_fields)}"

    # 3. Create Application record
    app_record = Application(
        id=uuid.uuid4(),
        job_id=job.id,
        user_profile_id=user.id,
        tailored_resume_id=resume_id,
        status=initial_status,
        submission_method="direct",
        notes=notes,
    )
    db.add(app_record)
    db.flush()

    # 4. Create ApplicationAnswer records
    for ans in answers_data:
        answer_entry = ApplicationAnswer(
            id=uuid.uuid4(),
            application_id=app_record.id,
            question=ans["question"],
            answer=ans["answer"],
            field_type=ans["field_type"],
            source_profile_field=ans.get("source_profile_field"),
        )
        db.add(answer_entry)

    db.commit()
    db.refresh(app_record)
    return app_record


def mark_job_as_applied(
    db: Session,
    user: UserProfile,
    job_id: uuid.UUID,
    notes: Optional[str] = "Applied directly on employer portal",
) -> Application:
    """
    Marks a job as self-applied by the candidate:
    1. Verifies target job.
    2. Attaches candidate's uploaded original CV.
    3. Sets status to APPLIED_CONFIRMED.
    """
    from datetime import datetime, timezone

    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job listing not found",
        )

    # Check for existing application
    app_record = (
        db.query(Application)
        .filter(Application.job_id == job_id, Application.user_profile_id == user.id)
        .first()
    )

    uploaded_resume = (
        db.query(Resume)
        .filter(Resume.user_profile_id == user.id)
        .order_by(desc(Resume.created_at))
        .first()
    )
    resume_id = uploaded_resume.id if uploaded_resume else None
    now = datetime.now(timezone.utc)

    if not app_record:
        app_record = Application(
            id=uuid.uuid4(),
            job_id=job.id,
            user_profile_id=user.id,
            tailored_resume_id=resume_id,
            status=ApplicationStatus.APPLIED_CONFIRMED,
            submission_method="self_applied",
            submitted_at=now,
            notes=notes,
            confirmation_evidence={"method": "self_applied", "portal_url": job.application_url or job.canonical_url},
        )
        db.add(app_record)
    else:
        app_record.status = ApplicationStatus.APPLIED_CONFIRMED
        app_record.submission_method = "self_applied"
        app_record.submitted_at = now
        app_record.notes = notes
        if resume_id:
            app_record.tailored_resume_id = resume_id

    db.commit()
    db.refresh(app_record)
    return app_record


def delete_application(db: Session, user_id: uuid.UUID, application_id: uuid.UUID) -> None:
    app_record = (
        db.query(Application)
        .filter(Application.id == application_id, Application.user_profile_id == user_id)
        .first()
    )
    if not app_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")
    db.delete(app_record)
    db.commit()


def list_applications(
    db: Session,
    user_id: uuid.UUID,
    app_status: Optional[ApplicationStatus] = None,
    page: int = 1,
    size: int = 20,
) -> Tuple[List[Application], int, int]:
    """Retrieve applications with pagination and optional status filter."""
    q = (
        db.query(Application)
        .options(
            joinedload(Application.job).joinedload(Job.source),
            joinedload(Application.tailored_resume),
            joinedload(Application.answers),
        )
        .filter(Application.user_profile_id == user_id)
    )

    if app_status:
        q = q.filter(Application.status == app_status)

    total = q.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size
    items = q.order_by(desc(Application.created_at)).offset(offset).limit(size).all()

    return items, total, pages


def get_application_by_id(
    db: Session,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Application:
    app_record = (
        db.query(Application)
        .options(
            joinedload(Application.job).joinedload(Job.source),
            joinedload(Application.tailored_resume),
            joinedload(Application.answers),
        )
        .filter(Application.id == application_id, Application.user_profile_id == user_id)
        .first()
    )
    if not app_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application record not found",
        )
    return app_record


def update_application_answers(
    db: Session,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
    answers_update: List[AnswerItemSchema],
) -> Application:
    """Updates candidate screening answers and promotes status to READY if all fields are complete."""
    app_record = get_application_by_id(db, application_id, user_id)

    # Update existing answers in DB
    for updated_ans in answers_update:
        existing_answer = (
            db.query(ApplicationAnswer)
            .filter(
                ApplicationAnswer.application_id == application_id,
                ApplicationAnswer.question == updated_ans.question,
            )
            .first()
        )
        if existing_answer:
            existing_answer.answer = updated_ans.answer
        else:
            new_ans = ApplicationAnswer(
                id=uuid.uuid4(),
                application_id=application_id,
                question=updated_ans.question,
                answer=updated_ans.answer,
                field_type=updated_ans.field_type,
            )
            db.add(new_ans)

    db.flush()

    # Re-evaluate all answers
    all_answers = (
        db.query(ApplicationAnswer)
        .filter(ApplicationAnswer.application_id == application_id)
        .all()
    )
    all_filled = all(bool(a.answer and a.answer.strip()) for a in all_answers)

    if all_filled and app_record.status == ApplicationStatus.NEEDS_USER_INPUT:
        app_record.status = ApplicationStatus.READY
        app_record.notes = "All required application answers provided."

    db.commit()
    db.refresh(app_record)
    return app_record


def patch_application(
    db: Session,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
    status_update: Optional[ApplicationStatus] = None,
    notes_update: Optional[str] = None,
    confirmation_evidence: Optional[dict] = None,
) -> Application:
    """Manual status and interview/offer note updating by candidate."""
    app_record = get_application_by_id(db, application_id, user_id)
    if status_update:
        app_record.status = status_update
    if notes_update is not None:
        app_record.notes = notes_update
    if confirmation_evidence is not None:
        app_record.confirmation_evidence = confirmation_evidence

    db.commit()
    db.refresh(app_record)
    return app_record


def get_application_answers(
    db: Session,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
) -> List[ApplicationAnswer]:
    # Ensure user owns application
    get_application_by_id(db, application_id, user_id)
    return (
        db.query(ApplicationAnswer)
        .filter(ApplicationAnswer.application_id == application_id)
        .all()
    )


def retry_application(
    db: Session,
    application_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Application:
    app_record = get_application_by_id(db, application_id, user_id)
    app_record.status = ApplicationStatus.READY
    app_record.error_message = None
    app_record.notes = "Submission queued for retry."
    db.commit()
    db.refresh(app_record)
    return app_record
