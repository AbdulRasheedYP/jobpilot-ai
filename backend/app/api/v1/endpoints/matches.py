import uuid
import math
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user_profile import UserProfile
from backend.app.models.job import Job
from backend.app.models.job_match import JobMatch
from backend.app.schemas.match import (
    JobMatchResponse,
    MatchListResponse,
    MatchEvaluateRequest,
    MatchEvaluateResponse,
)
from backend.app.services import matching_engine

router = APIRouter(prefix="/matches", tags=["Matches"])


@router.get("", response_model=MatchListResponse)
def list_matches(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    min_score: Optional[float] = Query(None, description="Minimum overall match score"),
    eligibility_passed: Optional[bool] = Query(None, description="Filter by eligibility status"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List scored matches for the candidate with pagination and filter criteria."""
    q = (
        db.query(JobMatch)
        .filter(JobMatch.user_profile_id == current_user.id)
    )

    if min_score is not None:
        q = q.filter(JobMatch.overall_score >= min_score)

    if eligibility_passed is not None:
        q = q.filter(JobMatch.eligibility_passed == eligibility_passed)

    total = q.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size
    items = (
        q.options(joinedload(JobMatch.job).joinedload(Job.source))
        .order_by(desc(JobMatch.overall_score))
        .offset(offset)
        .limit(size)
        .all()
    )

    return MatchListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/{match_id}", response_model=JobMatchResponse)
def get_match_detail(
    match_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve deep-dive breakdown of a specific match score and decision reasons."""
    match = (
        db.query(JobMatch)
        .options(joinedload(JobMatch.job).joinedload(Job.source))
        .filter(JobMatch.id == match_id, JobMatch.user_profile_id == current_user.id)
        .first()
    )
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job match record not found",
        )
    return match


@router.post("/evaluate", response_model=MatchEvaluateResponse)
def trigger_matching(
    payload: MatchEvaluateRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Evaluate match score and eligibility checks.
    Can evaluate a single job by `job_id` or run batch evaluation over un-evaluated jobs.
    """
    if payload.job_id:
        job = db.query(Job).filter(Job.id == payload.job_id).first()
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job not found",
            )
        match = matching_engine.evaluate_and_save_match(db=db, user=current_user, job=job)
        return MatchEvaluateResponse(
            status="completed",
            evaluated_count=1,
            eligible_count=1 if match.eligibility_passed else 0,
            strong_matches_count=1 if match.overall_score >= 80.0 else 0,
        )

    # Batch evaluate
    evaluated, eligible, strong = matching_engine.batch_evaluate_jobs(
        db=db,
        user=current_user,
        limit=payload.limit,
        force_reevaluate=payload.force_reevaluate,
    )
    return MatchEvaluateResponse(
        status="completed",
        evaluated_count=evaluated,
        eligible_count=eligible,
        strong_matches_count=strong,
    )
