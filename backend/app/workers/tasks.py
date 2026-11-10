import asyncio
import logging
from backend.app.workers.celery_app import celery_app
from backend.app.core.database import SessionLocal
from backend.app.models.job import JobSource
from backend.app.models.user_profile import JobPreference
from backend.app.services.job_service import ingest_jobs_from_source

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.ping")
def ping_task() -> str:
    """Simple ping task to verify worker health and connectivity."""
    logger.info("Celery ping task executed successfully.")
    return "pong"


@celery_app.task(name="tasks.background_agent_tick")
def background_agent_tick(run_id: str) -> dict:
    """
    Periodic tick to process queued agent discovery and tracking tasks.
    Will be orchestrated with LangGraph in later phases.
    """
    logger.info(f"Processing background agent tick for run {run_id}")
    return {"status": "success", "run_id": run_id}


@celery_app.task(name="tasks.sync_job_sources")
def sync_job_sources_task() -> dict:
    """
    Background worker task to poll enabled job sources and ingest new listings
    matching candidate preferences.
    """
    db = SessionLocal()
    total_new = 0
    total_updated = 0

    try:
        sources = db.query(JobSource).filter(JobSource.is_enabled == True).all()
        pref = db.query(JobPreference).first()
        search_terms = pref.target_roles if pref and pref.target_roles else ["Python Developer"]

        for source in sources:
            for term in search_terms:
                logger.info(f"Syncing source '{source.code}' for term '{term}'")
                try:
                    result = asyncio.run(
                        ingest_jobs_from_source(db=db, source=source, search_query=term)
                    )
                    total_new += result.new_jobs
                    total_updated += result.updated_jobs
                except Exception as e:
                    logger.error(f"Failed sync for source {source.code}: {e}")

        return {
            "status": "completed",
            "sources_synced": len(sources),
            "new_jobs": total_new,
            "updated_jobs": total_updated,
        }
    finally:
        db.close()
