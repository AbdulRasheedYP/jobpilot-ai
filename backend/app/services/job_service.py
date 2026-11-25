import uuid
import math
import logging
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, func, and_
from fastapi import HTTPException, status
from backend.app.models.job import Job, JobSource, Company
from backend.app.models.job_match import JobMatch
from backend.app.models.application import Application
from backend.app.models.user_profile import UserProfile
from backend.app.schemas.job import JobSourceCreate, JobSourceUpdate, JobSyncResponse
from backend.app.adapters.sources import get_source_adapter
from backend.app.adapters.sources.base import normalize_url

logger = logging.getLogger(__name__)

DEFAULT_SOURCES = [
    {
        "name": "Arbeitnow Official Feed",
        "code": "arbeitnow",
        "adapter_class": "ArbeitnowAdapter",
        "is_enabled": True,
        "permits_auto_apply": False,
        "rate_limit_per_minute": 30,
        "config": {},
    },
    {
        "name": "Local Mock Career Portal (Testing)",
        "code": "mock_portal",
        "adapter_class": "MockPortalAdapter",
        "is_enabled": True,
        "permits_auto_apply": True,
        "rate_limit_per_minute": 60,
        "config": {},
    },
    {
        "name": "Adzuna Developer API",
        "code": "adzuna",
        "adapter_class": "AdzunaAdapter",
        "is_enabled": False,
        "permits_auto_apply": False,
        "rate_limit_per_minute": 20,
        "config": {},
    },
]


def seed_default_sources_if_empty(db: Session) -> None:
    """Ensures default permitted job sources exist in the database."""
    count = db.query(JobSource).count()
    if count == 0:
        for s in DEFAULT_SOURCES:
            src = JobSource(
                id=uuid.uuid4(),
                name=s["name"],
                code=s["code"],
                adapter_class=s["adapter_class"],
                is_enabled=s["is_enabled"],
                permits_auto_apply=s["permits_auto_apply"],
                rate_limit_per_minute=s["rate_limit_per_minute"],
                config=s["config"],
            )
            db.add(src)
        db.commit()


def list_job_sources(db: Session) -> List[JobSource]:
    seed_default_sources_if_empty(db)
    return db.query(JobSource).order_by(JobSource.name).all()


def get_job_source_by_code(db: Session, code: str) -> JobSource:
    seed_default_sources_if_empty(db)
    source = db.query(JobSource).filter(JobSource.code == code.lower()).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job source with code '{code}' not found",
        )
    return source


def get_job_source_by_id(db: Session, source_id: uuid.UUID) -> JobSource:
    source = db.query(JobSource).filter(JobSource.id == source_id).first()
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job source not found",
        )
    return source


def update_job_source(db: Session, source_id: uuid.UUID, data: JobSourceUpdate) -> JobSource:
    source = get_job_source_by_id(db, source_id)
    if data.is_enabled is not None:
        source.is_enabled = data.is_enabled
    if data.permits_auto_apply is not None:
        source.permits_auto_apply = data.permits_auto_apply
    db.commit()
    db.refresh(source)
    return source


def get_or_create_company(db: Session, name: str) -> Company:
    clean_name = name.strip()
    company = db.query(Company).filter(Company.name == clean_name).first()
    if not company:
        company = Company(
            id=uuid.uuid4(),
            name=clean_name,
        )
        db.add(company)
        db.flush()
    return company


async def ingest_jobs_from_source(
    db: Session,
    source: JobSource,
    search_query: str = "Python",
    location: Optional[str] = None,
) -> JobSyncResponse:
    """
    Fetches raw listings via adapter, deduplicates against existing records,
    and upserts into the database.
    """
    adapter = get_source_adapter(source.code, config=source.config)
    fetched_payloads = await adapter.fetch_jobs(
        search_term=search_query,
        location=location,
    )

    new_count = 0
    updated_count = 0
    skipped_count = 0

    for p in fetched_payloads:
        canon_url = p.canonical_url or normalize_url(p.application_url)

        # Duplicate check: by canonical URL or (source_id, external_id)
        existing = (
            db.query(Job)
            .filter(
                or_(
                    Job.canonical_url == canon_url,
                    (Job.source_id == source.id) & (Job.external_id == p.external_id),
                )
            )
            .first()
        )

        company = get_or_create_company(db, p.company_name)

        if existing:
            # Update existing listing status and fields
            existing.title = p.title
            existing.description = p.description
            existing.location = p.location
            existing.is_remote = p.is_remote
            existing.skills_required = p.skills_required or existing.skills_required
            existing.is_active = True
            if p.salary_min:
                existing.salary_min = p.salary_min
            if p.salary_max:
                existing.salary_max = p.salary_max
            updated_count += 1
        else:
            # Insert new job
            new_job = Job(
                id=uuid.uuid4(),
                source_id=source.id,
                external_id=p.external_id,
                company_id=company.id,
                company_name=company.name,
                title=p.title,
                description=p.description,
                raw_payload=p.raw_payload,
                location=p.location,
                is_remote=p.is_remote,
                employment_type=p.employment_type,
                experience_level=p.experience_level,
                salary_min=p.salary_min,
                salary_max=p.salary_max,
                currency=p.currency,
                skills_required=p.skills_required,
                application_url=p.application_url,
                canonical_url=canon_url,
                posted_at=p.posted_at,
                is_active=True,
            )
            db.add(new_job)
            new_count += 1

    db.commit()

    return JobSyncResponse(
        status="completed",
        source_code=source.code,
        total_fetched=len(fetched_payloads),
        new_jobs=new_count,
        updated_jobs=updated_count,
        skipped_jobs=skipped_count,
    )


def list_jobs(
    db: Session,
    user: Optional[UserProfile] = None,
    page: int = 1,
    size: int = 20,
    is_remote: Optional[bool] = None,
    role: Optional[str] = None,
    query: Optional[str] = None,
    source_id: Optional[uuid.UUID] = None,
    sort_by: str = "match_score",
) -> Tuple[List[Job], int, int]:
    """
    Retrieve jobs with pagination, filters, and matching-order ranking.
    If a candidate user is provided, computes any missing match scores and
    orders by highest matching score first.
    """
    if user:
        # Pre-evaluate unmatched jobs so scores are strictly up to date
        try:
            from backend.app.services.matching_engine import batch_evaluate_jobs
            batch_evaluate_jobs(db=db, user=user, limit=50)
        except Exception as e:
            logger.warning(f"Batch evaluate jobs error: {e}")

        q = (
            db.query(Job, JobMatch, Application)
            .options(joinedload(Job.source))
            .outerjoin(JobMatch, and_(JobMatch.job_id == Job.id, JobMatch.user_profile_id == user.id))
            .outerjoin(Application, and_(Application.job_id == Job.id, Application.user_profile_id == user.id))
            .filter(Job.is_active == True)
        )

        if is_remote is not None:
            q = q.filter(Job.is_remote == is_remote)

        if source_id:
            q = q.filter(Job.source_id == source_id)

        if role:
            q = q.filter(Job.title.ilike(f"%{role}%"))

        if query:
            search_filter = or_(
                Job.title.ilike(f"%{query}%"),
                Job.company_name.ilike(f"%{query}%"),
                Job.description.ilike(f"%{query}%"),
                Job.location.ilike(f"%{query}%"),
            )
            q = q.filter(search_filter)

        total = q.count()
        pages = math.ceil(total / size) if total > 0 else 1
        offset = (page - 1) * size

        if sort_by == "match_score":
            q = q.order_by(JobMatch.overall_score.desc().nullslast(), Job.created_at.desc())
        else:
            q = q.order_by(desc(Job.created_at))

        results = q.offset(offset).limit(size).all()

        items = []
        for job_item, match_item, app_item in results:
            job_item.match_score = match_item.overall_score if match_item else 0.0
            job_item.decision_reasons = match_item.decision_reasons if match_item else []
            job_item.matched_skills = match_item.matched_skills if match_item else []
            job_item.is_applied = True if app_item else False
            items.append(job_item)

        return items, total, pages

    # Fallback for unauthenticated or generic listing
    q = db.query(Job).options(joinedload(Job.source)).filter(Job.is_active == True)

    if is_remote is not None:
        q = q.filter(Job.is_remote == is_remote)

    if source_id:
        q = q.filter(Job.source_id == source_id)

    if role:
        q = q.filter(Job.title.ilike(f"%{role}%"))

    if query:
        search_filter = or_(
            Job.title.ilike(f"%{query}%"),
            Job.company_name.ilike(f"%{query}%"),
            Job.description.ilike(f"%{query}%"),
            Job.location.ilike(f"%{query}%"),
        )
        q = q.filter(search_filter)

    total = q.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size
    items = q.order_by(desc(Job.created_at)).offset(offset).limit(size).all()
    for job in items:
        job.match_score = 0.0
        job.decision_reasons = []
        job.matched_skills = []
        job.is_applied = False

    return items, total, pages


def get_job_by_id(db: Session, job_id: uuid.UUID, user: Optional[UserProfile] = None) -> Job:
    job = db.query(Job).options(joinedload(Job.source)).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job listing not found",
        )
    if user:
        match = db.query(JobMatch).filter(JobMatch.job_id == job_id, JobMatch.user_profile_id == user.id).first()
        app = db.query(Application).filter(Application.job_id == job_id, Application.user_profile_id == user.id).first()
        job.match_score = match.overall_score if match else 0.0
        job.decision_reasons = match.decision_reasons if match else []
        job.matched_skills = match.matched_skills if match else []
        job.is_applied = True if app else False
    else:
        job.match_score = 0.0
        job.decision_reasons = []
        job.matched_skills = []
        job.is_applied = False
    return job
