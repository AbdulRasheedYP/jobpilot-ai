from backend.app.workers.celery_app import celery_app
from backend.app.workers.tasks import ping_task, background_agent_tick


def test_celery_config():
    """Verify Celery app initialization and broker configuration."""
    assert celery_app.main == "jobpilot_worker"
    assert celery_app.conf.task_serializer == "json"
    assert celery_app.conf.timezone == "UTC"


def test_ping_task_execution():
    """Verify synchronous execution of ping task."""
    result = ping_task()
    assert result == "pong"


def test_background_agent_tick_execution():
    """Verify background agent tick task execution."""
    test_run_id = "test-run-1234"
    result = background_agent_tick(test_run_id)
    assert result["status"] == "success"
    assert result["run_id"] == test_run_id
