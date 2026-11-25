import uuid
import pytest
from httpx import AsyncClient
from backend.app.models.job import Job, JobSource
from backend.app.models.enums import ApplicationStatus


@pytest.mark.asyncio
async def test_security_headers_present(async_client: AsyncClient):
    """Verify standard defense-in-depth security headers are present on responses."""
    resp = await async_client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.headers.get("X-Content-Type-Options") == "nosniff"
    assert resp.headers.get("X-Frame-Options") == "DENY"
    assert resp.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert "geolocation=()" in resp.headers.get("Permissions-Policy", "")


@pytest.mark.asyncio
async def test_csrf_untrusted_origin_rejected(async_client: AsyncClient, auth_headers: dict):
    """Verify CSRF protection rejects state-changing requests from untrusted origins."""
    resp = await async_client.post(
        "/api/v1/applications/mark-applied",
        headers={**auth_headers, "Origin": "http://evil-hacker-site.com"},
        json={"job_id": str(uuid.uuid4())},
    )
    assert resp.status_code == 403
    assert "CSRF verification failed" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_csrf_trusted_origin_accepted(
    async_client: AsyncClient,
    auth_headers: dict,
    test_user,
    db_session,
):
    """Verify CSRF protection accepts requests from authorized localhost origins."""
    source = JobSource(
        id=uuid.uuid4(),
        name="Arbeitnow",
        code="arbeitnow_test",
        adapter_class="ArbeitnowAdapter",
    )
    db_session.add(source)
    job = Job(
        id=uuid.uuid4(),
        source_id=source.id,
        external_id="ext-csrf-1",
        title="Python Developer",
        company_name="Acme Corp",
        description="Python FastAPI role",
        location="Remote",
        is_remote=True,
        skills_required=["Python", "FastAPI"],
        application_url="https://example.com/jobs/1",
        canonical_url="https://example.com/jobs/1",
        is_active=True,
    )
    db_session.add(job)
    db_session.commit()

    resp = await async_client.post(
        "/api/v1/applications/mark-applied",
        headers={**auth_headers, "Origin": "http://localhost:3000"},
        json={"job_id": str(job.id)},
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == ApplicationStatus.APPLIED_CONFIRMED.value


@pytest.mark.asyncio
async def test_csrf_lan_origin_accepted(
    async_client: AsyncClient,
    auth_headers: dict,
    test_user,
    db_session,
):
    """Verify CSRF protection accepts requests from private LAN origins in development."""
    source = JobSource(
        id=uuid.uuid4(),
        name="Arbeitnow",
        code=f"src_{uuid.uuid4().hex[:6]}",
        adapter_class="ArbeitnowAdapter",
    )
    db_session.add(source)
    job = Job(
        id=uuid.uuid4(),
        source_id=source.id,
        external_id=f"ext_{uuid.uuid4().hex[:8]}",
        title="Full Stack Engineer",
        company_name="LAN Corp",
        description="Full stack dev role",
        location="Remote",
        is_remote=True,
        skills_required=["Python"],
        application_url="https://example.com/jobs/lan",
        canonical_url="https://example.com/jobs/lan",
        is_active=True,
    )
    db_session.add(job)
    db_session.commit()

    # Test LAN IP origin (e.g. 192.168.1.39:3000)
    resp = await async_client.post(
        "/api/v1/applications/mark-applied",
        headers={**auth_headers, "Origin": "http://192.168.1.39:3000"},
        json={"job_id": str(job.id)},
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == ApplicationStatus.APPLIED_CONFIRMED.value


@pytest.mark.asyncio
async def test_jobs_ranking_descending_order(
    async_client: AsyncClient,
    auth_headers: dict,
    test_user,
    db_session,
):
    """
    Verify that jobs are sorted in matching order (highest matching score first).
    Candidate has skills: Python, FastAPI.
    Job High: requires Python, FastAPI (High fit).
    Job Low: requires Rust, Solidity (Low fit).
    """
    source = JobSource(
        id=uuid.uuid4(),
        name="Arbeitnow",
        code="arbeitnow_rank",
        adapter_class="ArbeitnowAdapter",
    )
    db_session.add(source)

    job_high = Job(
        id=uuid.uuid4(),
        source_id=source.id,
        external_id="ext-high-fit",
        title="Python Backend Developer",
        company_name="Tech Unicorn",
        description="Looking for Python FastAPI developer",
        location="Remote",
        is_remote=True,
        skills_required=["Python", "FastAPI"],
        application_url="https://example.com/jobs/high",
        canonical_url="https://example.com/jobs/high",
        is_active=True,
    )
    job_low = Job(
        id=uuid.uuid4(),
        source_id=source.id,
        external_id="ext-low-fit",
        title="Blockchain Rust Core Engineer",
        company_name="Crypto Labs",
        description="Smart contracts in Rust and Solidity",
        location="Berlin, Germany",
        is_remote=False,
        skills_required=["Rust", "Solidity"],
        application_url="https://example.com/jobs/low",
        canonical_url="https://example.com/jobs/low",
        is_active=True,
    )
    db_session.add_all([job_high, job_low])
    db_session.commit()

    resp = await async_client.get("/api/v1/jobs", headers=auth_headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 2

    first_job = items[0]
    second_job = items[1]
    assert first_job["match_score"] >= second_job["match_score"]
    assert first_job["id"] == str(job_high.id)
    assert first_job["match_score"] > 50.0
    assert any(s.lower() == "python" for s in first_job["matched_skills"])


@pytest.mark.asyncio
async def test_self_apply_lifecycle(
    async_client: AsyncClient,
    auth_headers: dict,
    test_user,
    db_session,
):
    """
    Verify self-apply workflow:
    1. Mark job as applied.
    2. Retrieve in applications tracker.
    3. Delete tracked application.
    """
    source = JobSource(
        id=uuid.uuid4(),
        name="Arbeitnow",
        code="arbeitnow_self",
        adapter_class="ArbeitnowAdapter",
    )
    db_session.add(source)
    job = Job(
        id=uuid.uuid4(),
        source_id=source.id,
        external_id="ext-self-apply",
        title="Full Stack Engineer",
        company_name="Global Corp",
        description="Full stack dev role",
        location="Remote",
        is_remote=True,
        skills_required=["Python", "FastAPI"],
        application_url="https://careers.globalcorp.test/apply",
        canonical_url="https://careers.globalcorp.test/apply",
        is_active=True,
    )
    db_session.add(job)
    db_session.commit()

    # 1. Mark as applied
    apply_resp = await async_client.post(
        "/api/v1/applications/mark-applied",
        headers=auth_headers,
        json={"job_id": str(job.id), "notes": "Submitted CV via employer portal."},
    )
    assert apply_resp.status_code == 201
    app_data = apply_resp.json()
    assert app_data["status"] == ApplicationStatus.APPLIED_CONFIRMED.value
    assert app_data["submission_method"] == "self_applied"
    app_id = app_data["id"]

    # 2. Check jobs listing reflects is_applied == True
    jobs_resp = await async_client.get("/api/v1/jobs", headers=auth_headers)
    assert jobs_resp.status_code == 200
    matched_job = next(j for j in jobs_resp.json()["items"] if j["id"] == str(job.id))
    assert matched_job["is_applied"] is True

    # 3. List in applications endpoint
    list_resp = await async_client.get("/api/v1/applications", headers=auth_headers)
    assert list_resp.status_code == 200
    assert any(a["id"] == app_id for a in list_resp.json()["items"])

    # 4. Delete/un-mark application
    del_resp = await async_client.delete(f"/api/v1/applications/{app_id}", headers=auth_headers)
    assert del_resp.status_code == 204

    # 5. Verify deleted from applications list
    after_del_resp = await async_client.get("/api/v1/applications", headers=auth_headers)
    assert not any(a["id"] == app_id for a in after_del_resp.json()["items"])
