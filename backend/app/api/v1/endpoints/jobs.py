import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user_profile import UserProfile
from backend.app.schemas.job import JobResponse, JobListResponse, JobSyncRequest, JobSyncResponse
from backend.app.services import job_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("", response_model=JobListResponse)
def get_jobs(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    is_remote: Optional[bool] = Query(None, description="Filter for remote jobs"),
    role: Optional[str] = Query(None, description="Filter by title role"),
    query: Optional[str] = Query(None, description="Text search across title, company, description"),
    source_id: Optional[uuid.UUID] = Query(None, description="Filter by job source"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve discovered and normalized job listings with filters and pagination."""
    items, total, pages = job_service.list_jobs(
        db=db,
        page=page,
        size=size,
        is_remote=is_remote,
        role=role,
        query=query,
        source_id=source_id,
    )
    return JobListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/{job_id}", response_model=JobResponse)
def get_job(
    job_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve full details of a specific job listing."""
    return job_service.get_job_by_id(db=db, job_id=job_id)


@router.post("/sync", response_model=JobSyncResponse)
async def sync_jobs(
    payload: JobSyncRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Trigger manual job discovery synchronization from a permitted source.
    Defaults to 'mock_portal' or 'arbeitnow'.
    """
    source_code = payload.source_code or "arbeitnow"
    source = job_service.get_job_source_by_code(db=db, code=source_code)
    
    return await job_service.ingest_jobs_from_source(
        db=db,
        source=source,
        search_query=payload.query or "Python",
        location=payload.location,
    )
