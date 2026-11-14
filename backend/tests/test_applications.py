import uuid
import pytest
from httpx import AsyncClient
from unittest.mock import patch, AsyncMock
from backend.app.models.enums import ApplicationStatus
from backend.app.services.cv_tailor import validate_anti_hallucination


def test_anti_hallucination_guard_purges_unsupported_skills():
    candidate_confirmed = ["Python", "FastAPI", "PostgreSQL"]
    llm_hallucinated = ["Python", "FastAPI", "Kubernetes", "AWS Cloud", "Rust"]

    sanitized = validate_anti_hallucination(
        tailored_skills=llm_hallucinated,
        candidate_confirmed_skills=candidate_confirmed,
    )

    # Kubernetes, AWS Cloud, and Rust must be strictly purged
    assert "Python" in sanitized
    assert "FastAPI" in sanitized
    assert "Kubernetes" not in sanitized
    assert "AWS Cloud" not in sanitized
    assert "Rust" not in sanitized


@pytest.mark.asyncio
async def test_prepare_application_missing_info_flags_needs_user_input(
    async_client: AsyncClient,
    auth_headers: dict,
    test_user,
    db_session,
):
    # 1. Ensure user has missing phone & notice period
    test_user.phone = None
    test_user.current_location = None
    db_session.commit()

    # 2. Sync a mock job first
    sync_resp = await async_client.post(
        "/api/v1/jobs/sync",
        headers=auth_headers,
        json={"source_code": "mock_portal", "query": "Python"},
    )
    assert sync_resp.status_code == 200

    jobs_resp = await async_client.get("/api/v1/jobs", headers=auth_headers)
    assert jobs_resp.status_code == 200
    job_id = jobs_resp.json()["items"][0]["id"]

    # 3. Prepare application
    mock_llm_tailored = {
        "tailored_summary": "Motivated Junior Python Developer with solid FastAPI skills.",
        "highlighted_skills": ["Python", "FastAPI"],
    }
    with patch("backend.app.services.cv_tailor.get_llm_provider") as mock_get_llm:
        mock_provider = AsyncMock()
        mock_provider.generate_json.return_value = mock_llm_tailored
        mock_get_llm.return_value = mock_provider

        prep_resp = await async_client.post(
            "/api/v1/applications/prepare",
            headers=auth_headers,
            json={"job_id": job_id},
        )
        assert prep_resp.status_code == 201
        app_data = prep_resp.json()
        assert app_data["status"] == ApplicationStatus.NEEDS_USER_INPUT.value
        assert "Missing mandatory candidate details" in app_data["notes"]
        app_id = app_data["id"]

        # 4. Retrieve answers
        answers_resp = await async_client.get(f"/api/v1/applications/{app_id}/answers", headers=auth_headers)
        assert answers_resp.status_code == 200
        answers = answers_resp.json()["answers"]
        assert len(answers) >= 5

        # 5. Supply missing phone and location via PUT answers
        updated_answers = [
            {"question": "Phone Number", "answer": "+91 9876543210", "field_type": "tel"},
            {"question": "Current Location", "answer": "Bangalore, India", "field_type": "text"},
            {"question": "Notice Period", "answer": "Immediate (0 days)", "field_type": "text"},
        ]
        put_resp = await async_client.put(
            f"/api/v1/applications/{app_id}/answers",
            headers=auth_headers,
            json={"answers": updated_answers},
        )
        assert put_resp.status_code == 200
        # Once missing answers are supplied, status should promote to READY
        assert put_resp.json()["status"] == ApplicationStatus.READY.value

        # 6. Candidate manually updates status via PATCH
        patch_resp = await async_client.patch(
            f"/api/v1/applications/{app_id}",
            headers=auth_headers,
            json={
                "status": ApplicationStatus.APPLIED_CONFIRMED.value,
                "notes": "Application confirmed submitted on company career site.",
                "confirmation_evidence": {"receipt_number": "APP-2026-X8"},
            },
        )
        assert patch_resp.status_code == 200
        assert patch_resp.json()["status"] == ApplicationStatus.APPLIED_CONFIRMED.value
        assert patch_resp.json()["confirmation_evidence"]["receipt_number"] == "APP-2026-X8"

        # 7. List applications filtered by status
        list_resp = await async_client.get(
            f"/api/v1/applications?status={ApplicationStatus.APPLIED_CONFIRMED.value}",
            headers=auth_headers,
        )
        assert list_resp.status_code == 200
        assert len(list_resp.json()["items"]) >= 1
