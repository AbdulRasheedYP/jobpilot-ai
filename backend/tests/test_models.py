import uuid
from backend.app.models import (
    Base,
    UserProfile,
    JobPreference,
    Resume,
    JobSource,
    Company,
    Job,
    JobMatch,
    Application,
    ApplicationAnswer,
    AgentRun,
    AgentEvent,
    ApplicationStatus,
    AgentRunStatus,
)


def test_models_metadata_registered():
    """Verify that all 11 tables are properly registered on SQLAlchemy Base metadata."""
    expected_tables = {
        "user_profiles",
        "job_preferences",
        "job_sources",
        "companies",
        "jobs",
        "resumes",
        "job_matches",
        "applications",
        "application_answers",
        "agent_runs",
        "agent_events",
    }
    actual_tables = set(Base.metadata.tables.keys())
    assert expected_tables.issubset(actual_tables), f"Missing tables: {expected_tables - actual_tables}"


def test_model_instantiation():
    """Verify clean instantiation of models without errors."""
    user = UserProfile(
        id=uuid.uuid4(),
        full_name="Test Candidate",
        email="test@example.com",
        hashed_password="hashed_pw_test",
        skills=["Python", "FastAPI"],
    )
    assert user.full_name == "Test Candidate"
    assert user.skills == ["Python", "FastAPI"]

    job = Job(
        id=uuid.uuid4(),
        source_id=uuid.uuid4(),
        external_id="ext-123",
        company_name="Test Corp",
        title="Python Dev",
        description="Great role",
        location="Remote",
        is_remote=True,
        application_url="https://example.com/apply",
        canonical_url="https://example.com/job/123",
    )
    assert job.title == "Python Dev"
    assert job.is_remote is True
