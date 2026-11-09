import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_profile_unauthorized(async_client: AsyncClient):
    response = await async_client.get("/api/v1/profile")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_profile_success(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/profile", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "candidate@example.com"
    assert "skills" in data
    assert "education" in data


@pytest.mark.asyncio
async def test_update_profile(async_client: AsyncClient, auth_headers: dict):
    update_data = {
        "full_name": "Updated Candidate",
        "phone": "+91 9999888877",
        "current_location": "Bangalore, India",
        "skills": ["Python", "FastAPI", "React", "Docker"],
        "notice_period_days": 15,
        "sponsorship_required": False,
    }
    response = await async_client.put("/api/v1/profile", headers=auth_headers, json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Candidate"
    assert data["phone"] == "+91 9999888877"
    assert "Docker" in data["skills"]
    assert data["notice_period_days"] == 15
