import io
import pytest
from httpx import AsyncClient
from unittest.mock import AsyncMock, patch


@pytest.mark.asyncio
async def test_upload_resume_unauthorized(async_client: AsyncClient):
    response = await async_client.post("/api/v1/resumes")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_upload_resume_invalid_extension(async_client: AsyncClient, auth_headers: dict):
    file_content = b"fake binary content"
    files = {"file": ("test.exe", file_content, "application/octet-stream")}
    response = await async_client.post("/api/v1/resumes", headers=auth_headers, files=files)
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_resume_empty_file(async_client: AsyncClient, auth_headers: dict):
    files = {"file": ("empty.txt", b"", "text/plain")}
    response = await async_client.post("/api/v1/resumes", headers=auth_headers, files=files)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"]


@pytest.mark.asyncio
async def test_upload_and_parse_resume_success(async_client: AsyncClient, auth_headers: dict):
    mock_facts = {
        "status": "pending_review",
        "extracted_skills": ["Python", "FastAPI", "PostgreSQL"],
        "extracted_education": [
            {"institution": "XYZ Institute", "degree": "B.Tech Computer Science", "graduation_year": 2024}
        ],
        "extracted_experience": [
            {"company": "Tech Corp", "title": "Junior Python Dev", "start_date": "2024-01", "end_date": "Present", "description": "Backend API development"}
        ],
    }

    cv_text = b"Jane Doe\nSkills: Python, FastAPI, PostgreSQL\nEducation: B.Tech CS 2024"
    files = {"file": ("resume.txt", cv_text, "text/plain")}

    with patch("backend.app.services.resume_service.extract_facts_with_llm", new=AsyncMock(return_value=mock_facts)):
        response = await async_client.post("/api/v1/resumes", headers=auth_headers, files=files)
        assert response.status_code == 201
        data = response.json()
        assert data["file_name"] == "resume.txt"
        assert data["file_type"] == "txt"
        assert data["parsed_facts"]["status"] == "pending_review"
        assert "Python" in data["parsed_facts"]["extracted_skills"]
        resume_id = data["id"]

        # Test GET /api/v1/resumes
        list_resp = await async_client.get("/api/v1/resumes", headers=auth_headers)
        assert list_resp.status_code == 200
        assert len(list_resp.json()) >= 1

        # Test GET /api/v1/resumes/{id}
        detail_resp = await async_client.get(f"/api/v1/resumes/{resume_id}", headers=auth_headers)
        assert detail_resp.status_code == 200
        assert detail_resp.json()["id"] == resume_id

        # Test PUT /api/v1/resumes/{id}/confirm (Zero-Hallucination Gate)
        confirm_payload = {
            "confirmed_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"],
            "confirmed_education": [
                {"institution": "XYZ Institute", "degree": "B.Tech Computer Science", "graduation_year": 2024}
            ],
            "confirmed_experience": [
                {"company": "Tech Corp", "title": "Junior Python Dev", "start_date": "2024-01", "end_date": "Present", "description": "Backend API development"}
            ],
        }
        confirm_resp = await async_client.put(
            f"/api/v1/resumes/{resume_id}/confirm",
            headers=auth_headers,
            json=confirm_payload,
        )
        assert confirm_resp.status_code == 200
        assert confirm_resp.json()["status"] == "confirmed"
        assert confirm_resp.json()["profile_updated"] is True

        # Verify candidate profile now reflects confirmed skills
        profile_resp = await async_client.get("/api/v1/profile", headers=auth_headers)
        assert profile_resp.status_code == 200
        assert "Docker" in profile_resp.json()["skills"]

        # Test DELETE /api/v1/resumes/{id}
        del_resp = await async_client.delete(f"/api/v1/resumes/{resume_id}", headers=auth_headers)
        assert del_resp.status_code == 204

        # Confirm deleted
        get_again = await async_client.get(f"/api/v1/resumes/{resume_id}", headers=auth_headers)
        assert get_again.status_code == 404
