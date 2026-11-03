import logging
from backend.app.workers.celery_app import celery_app

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
