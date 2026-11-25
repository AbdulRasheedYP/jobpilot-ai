import uuid
import pytest
from httpx import AsyncClient
from backend.app.models.job import Job, JobSource, Company
from backend.app.models.user_profile import UserProfile, JobPreference
from backend.app.services.matching_engine import check_eligibility, calculate_match_score


def test_eligibility_company_excluded():
    user = UserProfile(id=uuid.uuid4(), full_name="Jane", email="jane@test.com", hashed_password="pw")
    pref = JobPreference(
        id=uuid.uuid4(),
        user_profile_id=user.id,
        target_roles=["Python Developer"],
        excluded_companies=["Spammy Tech Ltd"],
    )
    job = Job(
        id=uuid.uuid4(),
        title="Python Developer",
        company_name="Spammy Tech Ltd",
        description="Coding in Python",
        location="Remote",
        is_remote=True,
        application_url="http://test/1",
        canonical_url="http://test/1",
    )
    passed, details, reasons = check_eligibility(user, pref, job)
    assert passed is False
    assert details["company_exclusion"] == "FAIL"
    assert "excluded companies" in reasons[0]


def test_eligibility_role_mismatch():
    user = UserProfile(id=uuid.uuid4(), full_name="Jane", email="jane@test.com", hashed_password="pw")
    pref = JobPreference(
        id=uuid.uuid4(),
        user_profile_id=user.id,
        target_roles=["Backend Developer", "Python Developer"],
    )
    job = Job(
        id=uuid.uuid4(),
        title="Registered Staff Nurse",
        company_name="City Hospital",
        description="Healthcare nursing duties",
        location="Remote",
        is_remote=True,
        application_url="http://test/2",
        canonical_url="http://test/2",
    )
    passed, details, reasons = check_eligibility(user, pref, job)
    assert passed is False
    assert details["role_suitability"] == "FAIL"


def test_match_score_strong_fit():
    user = UserProfile(
        id=uuid.uuid4(),
        full_name="Jane Doe",
        email="jane@test.com",
        hashed_password="pw",
        skills=["Python", "FastAPI", "PostgreSQL", "Docker"],
        education=[{"institution": "Tech Uni", "degree": "B.Tech Computer Science", "graduation_year": 2024}],
        experience=[{"company": "Intern Co", "title": "Junior Python Dev"}],
    )
    pref = JobPreference(
        id=uuid.uuid4(),
        user_profile_id=user.id,
        target_roles=["Python Developer", "Backend Developer"],
        work_modes=["remote"],
    )
    job = Job(
        id=uuid.uuid4(),
        title="Junior Python Developer",
        company_name="Innovate Corp",
        description="Looking for Junior Python Developer with FastAPI and PostgreSQL skills.",
        skills_required=["Python", "FastAPI", "PostgreSQL"],
        location="Remote",
        is_remote=True,
        experience_level="junior",
        application_url="http://test/3",
        canonical_url="http://test/3",
    )

    result = calculate_match_score(user, pref, job)
    assert result["overall_score"] >= 80.0
    assert len(result["matched_skills"]) >= 2
    assert len(result["decision_reasons"]) >= 4

    # Verify score breakdown adds up to overall score
    breakdown = result["score_breakdown"]
    breakdown_sum = sum(breakdown.values())
    assert abs(breakdown_sum - result["overall_score"]) < 0.2


@pytest.mark.asyncio
async def test_matches_api_flow(async_client: AsyncClient, auth_headers: dict):
    # 1. Sync jobs first so there are listings in DB
    sync_resp = await async_client.post(
        "/api/v1/jobs/sync",
        headers=auth_headers,
        json={"source_code": "mock_portal", "query": "Python"},
    )
    assert sync_resp.status_code == 200

    # 2. Trigger match evaluation
    eval_resp = await async_client.post(
        "/api/v1/matches/evaluate",
        headers=auth_headers,
        json={"limit": 10},
    )
    assert eval_resp.status_code == 200
    eval_data = eval_resp.json()
    assert eval_data["status"] == "completed"
    assert eval_data["evaluated_count"] >= 1

    # 3. Retrieve matches list
    list_resp = await async_client.get("/api/v1/matches", headers=auth_headers)
    assert list_resp.status_code == 200
    matches_data = list_resp.json()
    assert matches_data["total"] >= 1
    assert len(matches_data["items"]) >= 1

    first_match = matches_data["items"][0]
    match_id = first_match["id"]
    assert "overall_score" in first_match
    assert "score_breakdown" in first_match
    assert "decision_reasons" in first_match

    # 4. Filter matches by min_score
    filtered_resp = await async_client.get(
        "/api/v1/matches?min_score=60.0",
        headers=auth_headers,
    )
    assert filtered_resp.status_code == 200
    for m in filtered_resp.json()["items"]:
        assert m["overall_score"] >= 60.0

    # 5. Retrieve specific match deep-dive details
    detail_resp = await async_client.get(f"/api/v1/matches/{match_id}", headers=auth_headers)
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == match_id
    assert "skills_match" in detail["score_breakdown"]


def test_eligibility_location_strict_mismatch():
    user = UserProfile(id=uuid.uuid4(), full_name="Jane", email="jane@test.com", hashed_password="pw")
    pref = JobPreference(
        id=uuid.uuid4(),
        user_profile_id=user.id,
        target_roles=["Python Developer"],
        target_countries=["Kochi", "Kerala"],
        work_modes=["onsite", "hybrid"],
    )
    job = Job(
        id=uuid.uuid4(),
        title="Python Developer",
        company_name="Tokyo AI Corp",
        description="Coding in Python",
        location="Tokyo, Japan",
        is_remote=False,
        application_url="http://test/loc",
        canonical_url="http://test/loc",
    )
    passed, details, reasons = check_eligibility(user, pref, job)
    assert passed is False
    assert details["work_mode"] == "FAIL"
    assert "does not match candidate target search locations" in reasons[0]


def test_eligibility_date_freshness_expired():
    from datetime import datetime, timezone, timedelta
    user = UserProfile(id=uuid.uuid4(), full_name="Jane", email="jane@test.com", hashed_password="pw")
    pref = JobPreference(
        id=uuid.uuid4(),
        user_profile_id=user.id,
        target_roles=["Python Developer"],
        target_countries=["India"],
        work_modes=["remote"],
        posted_within_days=3,
    )
    old_date = datetime.now(timezone.utc) - timedelta(days=10)
    job = Job(
        id=uuid.uuid4(),
        title="Python Developer",
        company_name="Acme Corp",
        description="Coding in Python",
        location="Remote",
        is_remote=True,
        posted_at=old_date,
        application_url="http://test/old",
        canonical_url="http://test/old",
    )
    passed, details, reasons = check_eligibility(user, pref, job)
    assert passed is False
    assert details["date_freshness"] == "FAIL"
    assert "older than the 3-day search threshold" in reasons[0]

