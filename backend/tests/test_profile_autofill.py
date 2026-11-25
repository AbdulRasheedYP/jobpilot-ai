import uuid
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch
from backend.app.models.job import Job, JobSource
from backend.app.models.job_match import JobMatch


@pytest.mark.asyncio
async def test_cv_upload_autofills_user_profile(
    async_client: AsyncClient,
    auth_headers: dict,
    test_user,
    db_session,
):
    """Test that uploading a CV automatically populates the candidate's UserProfile and JobPreference."""
    mock_facts = {
        "status": "pending_review",
        "full_name": "Arjun Nair",
        "email": "arjun.nair@example.com",
        "phone": "+91 9876543210",
        "current_location": "Kochi, Kerala, India",
        "extracted_skills": ["Python", "FastAPI", "Docker", "PostgreSQL"],
        "inferred_target_roles": ["Python Backend Engineer"],
        "extracted_education": [
            {
                "institution": "Cochin University",
                "degree": "B.Tech Computer Science",
                "graduation_year": 2024,
            }
        ],
        "extracted_experience": [
            {
                "company": "Tech Kerala Labs",
                "title": "Junior Python Developer",
                "start_date": "2023-06",
                "end_date": "Present",
                "description": "Building microservices using FastAPI.",
            }
        ],
    }

    cv_bytes = b"Arjun Nair\nPhone: +91 9876543210\nLocation: Kochi, Kerala, India\nSkills: Python, FastAPI, Docker, PostgreSQL"
    files = {"file": ("arjun_nair.pdf", cv_bytes, "application/pdf")}

    with patch("backend.app.services.resume_service.extract_facts_with_llm", new=AsyncMock(return_value=mock_facts)):
        response = await async_client.post("/api/v1/resumes", headers=auth_headers, files=files)
        assert response.status_code == 201

    # Verify UserProfile was auto-filled
    profile_resp = await async_client.get("/api/v1/profile", headers=auth_headers)
    assert profile_resp.status_code == 200
    p_data = profile_resp.json()

    assert p_data["full_name"] == "Arjun Nair"
    assert p_data["phone"] == "+91 9876543210"
    assert p_data["current_location"] == "Kochi, Kerala, India"
    assert "Python" in p_data["skills"]
    assert "FastAPI" in p_data["skills"]
    assert "Docker" in p_data["skills"]
    assert len(p_data["education"]) >= 1
    assert p_data["education"][0]["institution"] == "Cochin University"
    assert len(p_data["experience"]) >= 1
    assert p_data["experience"][0]["company"] == "Tech Kerala Labs"

    # Verify JobPreference target roles updated
    pref_resp = await async_client.get("/api/v1/preferences", headers=auth_headers)
    assert pref_resp.status_code == 200
    pref_data = pref_resp.json()
    assert "Python Backend Engineer" in pref_data["target_roles"]


@pytest.mark.asyncio
async def test_profile_update_triggers_rescore(
    async_client: AsyncClient,
    auth_headers: dict,
    test_user,
    db_session,
):
    """Test that manually updating skills or details in UserProfile triggers match re-scoring."""
    # Seed source and job requiring Docker and Kubernetes
    source = JobSource(
        id=uuid.uuid4(),
        name="Arbeitnow Direct",
        code=f"arbeitnow_rescore_{uuid.uuid4().hex[:6]}",
        adapter_class="ArbeitnowAdapter",
    )
    db_session.add(source)

    job = Job(
        id=uuid.uuid4(),
        source_id=source.id,
        external_id=f"job_rescore_{uuid.uuid4().hex[:6]}",
        title="Senior DevOps Engineer",
        company_name="CloudScale Corp",
        location="Remote",
        is_remote=True,
        description="Looking for expert in Docker and Kubernetes and Python cloud infrastructure.",
        skills_required=["Docker", "Kubernetes", "Python"],
        application_url="https://cloudscale.example.com/apply",
        canonical_url="https://cloudscale.example.com/apply",
        is_active=True,
    )
    db_session.add(job)
    db_session.commit()

    # Initial profile has only Python
    initial_update = {
        "skills": ["Python"],
        "current_location": "Remote",
    }
    await async_client.put(
        "/api/v1/profile",
        headers={**auth_headers, "Origin": "http://localhost:3000"},
        json=initial_update,
    )

    # Check initial match
    job_resp = await async_client.get("/api/v1/jobs?sort_by=match_score", headers=auth_headers)
    assert job_resp.status_code == 200
    jobs = job_resp.json()["items"]
    target_job = next((j for j in jobs if j["id"] == str(job.id)), None)
    assert target_job is not None
    initial_score = target_job["match_score"]

    # Now candidate updates profile to include Docker and Kubernetes
    updated_profile = {
        "skills": ["Python", "Docker", "Kubernetes"],
        "current_location": "Remote",
    }
    put_resp = await async_client.put(
        "/api/v1/profile",
        headers={**auth_headers, "Origin": "http://localhost:3000"},
        json=updated_profile,
    )
    assert put_resp.status_code == 200

    # Verify score recalculated and increased
    job_resp2 = await async_client.get("/api/v1/jobs?sort_by=match_score", headers=auth_headers)
    assert job_resp2.status_code == 200
    jobs2 = job_resp2.json()["items"]
    target_job2 = next((j for j in jobs2 if j["id"] == str(job.id)), None)
    assert target_job2 is not None
    assert target_job2["match_score"] > initial_score
    assert any(s.lower() == "docker" for s in target_job2["matched_skills"])
    assert any(s.lower() == "kubernetes" for s in target_job2["matched_skills"])


@pytest.mark.asyncio
async def test_manual_fields_editable_and_saved(
    async_client: AsyncClient,
    auth_headers: dict,
    test_user,
    db_session,
):
    """Test that unpopulated or optional fields (notice period, sponsorship) can be edited and saved."""
    update_payload = {
        "notice_period_days": 30,
        "sponsorship_required": False,
        "preferred_locations": ["Bangalore", "Kochi", "Remote"],
        "languages": ["English", "Malayalam"],
    }
    resp = await async_client.put(
        "/api/v1/profile",
        headers={**auth_headers, "Origin": "http://localhost:3000"},
        json=update_payload,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["notice_period_days"] == 30
    assert data["sponsorship_required"] is False
    assert "Bangalore" in data["preferred_locations"]
    assert "Malayalam" in data["languages"]
