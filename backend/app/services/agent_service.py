import uuid
import math
import logging
from datetime import datetime, timezone
from typing import Optional, List, Tuple, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc
from fastapi import HTTPException, status
from backend.app.models.agent_event import AgentRun, AgentEvent
from backend.app.models.enums import AgentRunStatus, ApplicationStatus
from backend.app.models.job import Job, JobSource
from backend.app.models.job_match import JobMatch
from backend.app.models.application import Application
from backend.app.models.user_profile import UserProfile, JobPreference
from backend.app.schemas.agent import DashboardKPIResponse
from backend.app.services.preference_service import get_or_create_preferences
from backend.app.services.job_service import ingest_jobs_from_source
from backend.app.services.matching_engine import batch_evaluate_jobs
from backend.app.services.application_service import prepare_application_for_job
from backend.app.services.auto_apply_service import run_batch_auto_apply

logger = logging.getLogger(__name__)


def log_event(
    db: Session,
    run_id: uuid.UUID,
    stage: str,
    event_type: str,
    message: str,
    payload: Optional[Dict[str, Any]] = None,
) -> AgentEvent:
    event = AgentEvent(
        id=uuid.uuid4(),
        agent_run_id=run_id,
        stage=stage,
        event_type=event_type,
        message=message,
        payload=payload or {},
    )
    db.add(event)
    db.commit()
    return event


def create_agent_run(db: Session, user: UserProfile) -> AgentRun:
    run = AgentRun(
        id=uuid.uuid4(),
        user_profile_id=user.id,
        status=AgentRunStatus.RUNNING,
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    log_event(db, run.id, "INIT", "RUN_STARTED", f"Agent run {run.id} initiated.")
    return run


async def execute_agent_cycle(
    db: Session,
    run_id: uuid.UUID,
    user: UserProfile,
    run_type: str = "FULL_CYCLE",
    limit: Optional[int] = None,
) -> AgentRun:
    """
    Executes an end-to-end autonomous agent cycle:
    1. Discovery (Pulls listings from enabled sources)
    2. Matching (Calculates eligibility & weighted scores)
    3. Preparation (Tailors CV and screening answers for eligible jobs >= min_score)
    4. Auto-Apply (Submits to permitted portals if auto-apply is enabled)
    """
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")

    pref = get_or_create_preferences(db, user.id)
    clean_roles = [r.strip() for r in (pref.target_roles or []) if r and r.strip()]
    clean_locations = [c.strip() for c in (pref.target_countries or []) if c and c.strip()]

    if not clean_roles:
        run.status = AgentRunStatus.FAILED
        run.error_message = "Target Roles are required to run the agent cycle."
        db.commit()
        log_event(db, run.id, "INIT", "RUN_FAILED", run.error_message)
        raise HTTPException(status_code=400, detail=run.error_message)

    if not clean_locations:
        run.status = AgentRunStatus.FAILED
        run.error_message = "Target Search Locations are required to run the agent cycle."
        db.commit()
        log_event(db, run.id, "INIT", "RUN_FAILED", run.error_message)
        raise HTTPException(status_code=400, detail=run.error_message)

    if not pref.work_modes or not len(pref.work_modes):
        run.status = AgentRunStatus.FAILED
        run.error_message = "Allowed Work Modes are required to run the agent cycle."
        db.commit()
        log_event(db, run.id, "INIT", "RUN_FAILED", run.error_message)
        raise HTTPException(status_code=400, detail=run.error_message)

    if pref.min_salary is None or pref.max_salary is None:
        run.status = AgentRunStatus.FAILED
        run.error_message = "Expected Salary Range (Min and Max LPA) is required to run the agent cycle."
        db.commit()
        log_event(db, run.id, "INIT", "RUN_FAILED", run.error_message)
        raise HTTPException(status_code=400, detail=run.error_message)

    cycle_limit = limit or 25

    try:
        # --- Stage 1: Job Discovery ---
        if run_type in ["DISCOVERY", "FULL_CYCLE"]:
            log_event(db, run.id, "DISCOVERY", "DISCOVERY_STARTED", f"Scanning enabled job sources (target up to {cycle_limit} jobs)...")
            sources = db.query(JobSource).filter(JobSource.is_enabled == True).all()
            sources = sorted(sources, key=lambda s: 0 if s.code == "live_aggregator" else 1)
            search_terms = clean_roles

            new_jobs = 0
            for src in sources:
                if new_jobs >= cycle_limit:
                    break
                for term in search_terms:
                    if new_jobs >= cycle_limit:
                        break
                    try:
                        sync_res = await ingest_jobs_from_source(
                            db=db,
                            source=src,
                            search_query=term,
                            location=clean_locations[0] if clean_locations else None,
                        )
                        new_jobs += sync_res.new_jobs
                    except Exception as e:
                        logger.error(f"Discovery error on {src.code}: {e}")

            run.jobs_discovered = new_jobs
            db.commit()
            log_event(db, run.id, "DISCOVERY", "DISCOVERY_COMPLETED", f"Discovered {new_jobs} new jobs matching target criteria.", {"new_jobs": new_jobs})

        # --- Stage 2: Matching & Decision Engine ---
        if run_type in ["MATCHING", "FULL_CYCLE"]:
            log_event(db, run.id, "MATCHING", "MATCHING_STARTED", "Evaluating match scores and eligibility for candidate profile...")
            evaluated, eligible, strong = batch_evaluate_jobs(db=db, user=user, limit=max(cycle_limit * 5, 200), force_reevaluate=True)
            run.jobs_matched = evaluated
            db.commit()
            log_event(
                db, run.id, "MATCHING", "MATCHING_COMPLETED",
                f"Evaluated {evaluated} jobs: {eligible} eligible, {strong} strong matches.",
                {"evaluated": evaluated, "eligible": eligible, "strong": strong},
            )

        # --- Stage 3: Preparation ---
        if run_type in ["APPLY", "FULL_CYCLE"]:
            log_event(db, run.id, "PREPARATION", "PREP_STARTED", "Preparing tailored CVs and screening answers...")
            # Find eligible matches with score >= min_score that don't have an application yet
            matches = (
                db.query(JobMatch)
                .filter(
                    JobMatch.user_profile_id == user.id,
                    JobMatch.eligibility_passed == True,
                    JobMatch.overall_score >= pref.min_match_score,
                )
                .limit(cycle_limit)
                .all()
            )

            prep_count = 0
            for m in matches:
                existing_app = (
                    db.query(Application)
                    .filter(Application.job_id == m.job_id, Application.user_profile_id == user.id)
                    .first()
                )
                if not existing_app:
                    try:
                        await prepare_application_for_job(db=db, user=user, job_id=m.job_id)
                        prep_count += 1
                    except Exception as e:
                        logger.error(f"Prep error for job {m.job_id}: {e}")

            run.applications_prepared = prep_count
            db.commit()
            log_event(db, run.id, "PREPARATION", "PREP_COMPLETED", f"Prepared {prep_count} applications.")

        # --- Stage 4: Auto-Apply ---
        if run_type in ["APPLY", "FULL_CYCLE"] and pref.auto_apply_enabled:
            log_event(db, run.id, "AUTO_APPLY", "AUTO_APPLY_STARTED", "Executing automated submissions where permitted...")
            apply_results = await run_batch_auto_apply(db=db, user=user, limit=pref.daily_application_limit)
            run.applications_submitted = apply_results["confirmed"]
            db.commit()
            log_event(
                db, run.id, "AUTO_APPLY", "AUTO_APPLY_COMPLETED",
                f"Submissions complete: {apply_results['confirmed']} confirmed, {apply_results['manual_action_required']} require user action.",
                apply_results,
            )

        # Complete Run
        now = datetime.now(timezone.utc)
        run.status = AgentRunStatus.COMPLETED
        run.finished_at = now
        db.commit()
        db.refresh(run)
        log_event(db, run.id, "COMPLETED", "RUN_FINISHED", "Agent execution cycle completed successfully.")

    except Exception as e:
        logger.error(f"Agent run failed: {e}")
        run.status = AgentRunStatus.FAILED
        run.error_summary = str(e)
        run.finished_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(run)
        log_event(db, run.id, "ERROR", "RUN_FAILED", f"Agent run encountered error: {str(e)}")

    return run


def list_agent_runs(
    db: Session,
    user_id: uuid.UUID,
    page: int = 1,
    size: int = 20,
) -> Tuple[List[AgentRun], int, int]:
    q = db.query(AgentRun).filter(AgentRun.user_profile_id == user_id)
    total = q.count()
    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size
    items = q.order_by(desc(AgentRun.started_at)).offset(offset).limit(size).all()
    return items, total, pages


def get_agent_run_by_id(db: Session, run_id: uuid.UUID, user_id: uuid.UUID) -> AgentRun:
    run = (
        db.query(AgentRun)
        .filter(AgentRun.id == run_id, AgentRun.user_profile_id == user_id)
        .first()
    )
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return run


def update_run_status(
    db: Session,
    run_id: uuid.UUID,
    user_id: uuid.UUID,
    new_status: AgentRunStatus,
) -> AgentRun:
    run = get_agent_run_by_id(db, run_id, user_id)
    run.status = new_status
    if new_status in [AgentRunStatus.COMPLETED, AgentRunStatus.STOPPED, AgentRunStatus.FAILED]:
        run.finished_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(run)
    return run


def get_dashboard_kpis(db: Session, user_id: uuid.UUID) -> DashboardKPIResponse:
    """Computes real-time KPI overview metrics for the candidate dashboard."""
    pref = get_or_create_preferences(db, user_id)

    total_jobs = db.query(Job).filter(Job.is_active == True).count()
    total_matches = db.query(JobMatch).filter(JobMatch.user_profile_id == user_id).count()
    strong_matches = (
        db.query(JobMatch)
        .filter(JobMatch.user_profile_id == user_id, JobMatch.overall_score >= 80.0)
        .count()
    )
    total_applications = db.query(Application).filter(Application.user_profile_id == user_id).count()
    applied_confirmed = (
        db.query(Application)
        .filter(Application.user_profile_id == user_id, Application.status == ApplicationStatus.APPLIED_CONFIRMED)
        .count()
    )
    needs_action = (
        db.query(Application)
        .filter(
            Application.user_profile_id == user_id,
            Application.status.in_([ApplicationStatus.NEEDS_USER_INPUT, ApplicationStatus.MANUAL_ACTION_REQUIRED]),
        )
        .count()
    )

    now = datetime.now(timezone.utc)
    start_of_day = datetime(now.year, now.month, now.day, tzinfo=timezone.utc)
    daily_used = (
        db.query(Application)
        .filter(
            Application.user_profile_id == user_id,
            Application.status == ApplicationStatus.APPLIED_CONFIRMED,
            Application.submitted_at >= start_of_day,
        )
        .count()
    )

    return DashboardKPIResponse(
        total_jobs=total_jobs,
        total_matches=total_matches,
        strong_matches=strong_matches,
        total_applications=total_applications,
        applied_confirmed=applied_confirmed,
        needs_action=needs_action,
        auto_apply_enabled=pref.auto_apply_enabled,
        daily_application_limit=pref.daily_application_limit,
        daily_applications_used=daily_used,
    )
