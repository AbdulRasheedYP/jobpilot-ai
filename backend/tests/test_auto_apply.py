import uuid
import pytest
from httpx import AsyncClient
from backend.app.models.enums import ApplicationStatus
from backend.app.models.job import Job, JobSource
from backend.app.models.job_match import JobMatch
from backend.app.models.user_profile import JobPreference
from backend.app.models.application import Application
from backend.app.services.auto_apply_policy import evaluate_auto_apply_policy


def test_auto_apply_policy_checks_disabled():
    pref = JobPreference(id=uuid.uuid4(), user_profile_id=uuid.uuid4(), auto_apply_enabled=False)
    source = JobSource(id=uuid.uuid4(), name="Mock", code="mock", adapter_class="Mock", permits_auto_apply=True)
    job = Job(id=uuid.uuid4(), source_id=source.id, source=source, title="Dev", company_name="Corp", description="", location="", application_url="", canonical_url="")
    app = Application(id=uuid.uuid4(), job_id=job.id, user_profile_id=pref.user_profile_id, status=ApplicationStatus.READY)

    allowed, reason, action = evaluate_auto_apply_policy(
        db=None,
        user=None,
        pref=pref,
        job=job,
        match=None,
        application=app,
    )
    assert allowed is False
    assert "disabled" in reason


def test_auto_apply_policy_source_forbidden():
    pref = JobPreference(id=uuid.uuid4(), user_profile_id=uuid.uuid4(), auto_apply_enabled=True)
    source = JobSource(id=uuid.uuid4(), name="Restricted", code="restricted", adapter_class="Mock", permits_auto_apply=False)
    job = Job(id=uuid.uuid4(), source_id=source.id, source=source, title="Dev", company_name="Corp", description="", location="", application_url="", canonical_url="")
    app = Application(id=uuid.uuid4(), job_id=job.id, user_profile_id=pref.user_profile_id, status=ApplicationStatus.READY)

    allowed, reason, action = evaluate_auto_apply_policy(
        db=None,
        user=None,
        pref=pref,
        job=job,
        match=None,
        application=app,
    )
    assert allowed is False
    assert "does not permit automated submissions" in reason
    assert action is True  # Requires manual candidate action


@pytest.mark.asyncio
async def test_mock_career_portal_endpoints(async_client: AsyncClient):
    # 1. GET HTML application form
    get_resp = await async_client.get("/mock/apply/job-9988")
    assert get_resp.status_code == 200
    assert "Submit Application for Job #job-9988" in get_resp.text
    assert "<form" in get_resp.text

    # 2. GET HTML with CAPTCHA challenge
    captcha_resp = await async_client.get("/mock/apply/job-9988?captcha=true")
    assert captcha_resp.status_code == 200
    assert "Bot Protection: Solve CAPTCHA to proceed" in captcha_resp.text

    # 3. POST submission with active CAPTCHA -> 403 Forbidden
    post_captcha_resp = await async_client.post(
        "/mock/apply/job-9988?captcha=true",
        json={"full_name": "Test Candidate", "captcha_solved": "false"},
    )
    assert post_captcha_resp.status_code == 403
    assert post_captcha_resp.json()["error"] == "CAPTCHA_CHALLENGE_REQUIRED"

    # 4. POST submission clean -> 200 OK with receipt
    post_clean_resp = await async_client.post(
        "/mock/apply/job-9988",
        json={"full_name": "Jane Doe", "email": "jane@example.com"},
    )
    assert post_clean_resp.status_code == 200
    clean_data = post_clean_resp.json()
    assert clean_data["status"] == "APPLIED_CONFIRMED"
    assert clean_data["receipt_code"].startswith("REC-MOCK-")


@pytest.mark.asyncio
async def test_auto_apply_submission_flow(
    async_client: AsyncClient,
    auth_headers: dict,
    test_user,
    db_session,
):
    # 1. Enable auto-apply in preferences
    pref_update = {
        "auto_apply_enabled": True,
        "min_match_score": 60,
    }
    await async_client.put("/api/v1/preferences", headers=auth_headers, json=pref_update)

    # 2. Sync mock portal jobs
    await async_client.post(
        "/api/v1/jobs/sync",
        headers=auth_headers,
        json={"source_code": "mock_portal", "query": "Python"},
    )

    jobs_resp = await async_client.get("/api/v1/jobs", headers=auth_headers)
    assert jobs_resp.status_code == 200
    job = jobs_resp.json()["items"][0]
    job_id = job["id"]

    # 3. Evaluate match score
    await async_client.post(
        "/api/v1/matches/evaluate",
        headers=auth_headers,
        json={"job_id": job_id},
    )

    # 4. Complete user details so application becomes READY
    test_user.phone = "+91 9988776655"
    test_user.current_location = "Bangalore, India"
    test_user.notice_period_days = 0
    db_session.commit()

    # 5. Prepare application
    prep_resp = await async_client.post(
        "/api/v1/applications/prepare",
        headers=auth_headers,
        json={"job_id": job_id},
    )
    assert prep_resp.status_code == 201
    app_id = prep_resp.json()["id"]

    # If application needs input, supply it
    if prep_resp.json()["status"] == ApplicationStatus.NEEDS_USER_INPUT.value:
        await async_client.put(
            f"/api/v1/applications/{app_id}/answers",
            headers=auth_headers,
            json={
                "answers": [
                    {"question": "Phone Number", "answer": "+91 9988776655", "field_type": "tel"},
                    {"question": "Current Location", "answer": "Bangalore, India", "field_type": "text"},
                    {"question": "Notice Period", "answer": "Immediate (0 days)", "field_type": "text"},
                ]
            },
        )

    # 6. Trigger application submission
    # Point job's application_url to our testclient mock portal
    db_job = db_session.query(Job).filter(Job.id == uuid.UUID(job_id)).first()
    db_job.application_url = "http://test/mock/apply/job-test-01"
    db_session.commit()

    submit_resp = await async_client.post(
        f"/api/v1/applications/{app_id}/submit",
        headers=auth_headers,
    )
    assert submit_resp.status_code == 200
    sub_data = submit_resp.json()
    assert sub_data["status"] == ApplicationStatus.APPLIED_CONFIRMED.value
    assert sub_data["confirmation_evidence"]["receipt_code"].startswith("REC-MOCK-")
    assert sub_data["submission_method"] == "automated_adapter"
