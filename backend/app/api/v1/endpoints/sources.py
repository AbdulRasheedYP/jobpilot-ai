import uuid
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user_profile import UserProfile
from backend.app.schemas.job import JobSourceResponse, JobSourceUpdate
from backend.app.services import job_service

router = APIRouter(prefix="/sources", tags=["Job Sources"])


@router.get("", response_model=Dict[str, List[JobSourceResponse]])
def list_sources(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all permitted job board sources and their configurations."""
    sources = job_service.list_job_sources(db=db)
    return {"sources": sources}


@router.patch("/{source_id}", response_model=JobSourceResponse)
def update_source(
    source_id: uuid.UUID,
    payload: JobSourceUpdate,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Enable or disable a job source or toggle its auto-apply permission."""
    return job_service.update_job_source(
        db=db,
        source_id=source_id,
        data=payload,
    )
