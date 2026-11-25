import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user_profile import UserProfile
from backend.app.models.enums import ApplicationStatus
from backend.app.schemas.application import (
    ApplicationResponse,
    ApplicationListResponse,
    ApplicationPrepareRequest,
    ApplicationMarkAppliedRequest,
    ApplicationPatchRequest,
    AnswerUpdateRequest,
    AnswersListResponse,
)
from backend.app.services import application_service

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("/mark-applied", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def mark_applied(
    payload: ApplicationMarkAppliedRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Direct self-apply tracking: marks a target job as applied by the candidate.
    Records applied timestamp, attaches candidate's CV, and stores notes.
    """
    return application_service.mark_job_as_applied(
        db=db,
        user=current_user,
        job_id=payload.job_id,
        notes=payload.notes,
    )


@router.post("/prepare", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
async def prepare_application(
    payload: ApplicationPrepareRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Generate application record for a target job using candidate's uploaded CV.
    """
    return await application_service.prepare_application_for_job(
        db=db,
        user=current_user,
        job_id=payload.job_id,
    )


@router.get("", response_model=ApplicationListResponse)
def list_applications(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[ApplicationStatus] = Query(None, description="Filter by application status"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List tracked applications for the candidate with pagination and status filters."""
    items, total, pages = application_service.list_applications(
        db=db,
        user_id=current_user.id,
        app_status=status,
        page=page,
        size=size,
    )
    return ApplicationListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/{application_id}", response_model=ApplicationResponse)
def get_application(
    application_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full details of an application including tailored resume and answers."""
    return application_service.get_application_by_id(
        db=db,
        application_id=application_id,
        user_id=current_user.id,
    )


@router.patch("/{application_id}", response_model=ApplicationResponse)
def patch_application(
    application_id: uuid.UUID,
    payload: ApplicationPatchRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Manual status, notes, or confirmation evidence update by candidate."""
    return application_service.patch_application(
        db=db,
        application_id=application_id,
        user_id=current_user.id,
        status_update=payload.status,
        notes_update=payload.notes,
        confirmation_evidence=payload.confirmation_evidence,
    )


@router.get("/{application_id}/answers", response_model=AnswersListResponse)
def get_answers(
    application_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve prepared screening answers for an application."""
    answers = application_service.get_application_answers(
        db=db,
        application_id=application_id,
        user_id=current_user.id,
    )
    return AnswersListResponse(answers=answers)


@router.put("/{application_id}/answers", response_model=ApplicationResponse)
def update_answers(
    application_id: uuid.UUID,
    payload: AnswerUpdateRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Edit or supply missing application answers before submission."""
    return application_service.update_application_answers(
        db=db,
        application_id=application_id,
        user_id=current_user.id,
        answers_update=payload.answers,
    )


@router.post("/{application_id}/retry", response_model=ApplicationResponse, status_code=status.HTTP_202_ACCEPTED)
def retry_application(
    application_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Queue application for submission retry."""
    return application_service.retry_application(
        db=db,
        application_id=application_id,
        user_id=current_user.id,
    )


@router.post("/{application_id}/submit", response_model=ApplicationResponse)
async def submit_application(
    application_id: uuid.UUID,
    is_manual: bool = Query(False, description="Whether to bypass automated policy gates for explicit user-triggered action"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Submit a single application to the employer portal."""
    from backend.app.services import auto_apply_service
    return await auto_apply_service.execute_application_submission(
        db=db,
        application_id=application_id,
        user=current_user,
        is_manual_submission=is_manual,
    )


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_application(
    application_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a tracked application."""
    application_service.delete_application(
        db=db,
        user_id=current_user.id,
        application_id=application_id,
    )

