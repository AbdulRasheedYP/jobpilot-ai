import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_preferences_unauthorized(async_client: AsyncClient):
    response = await async_client.get("/api/v1/preferences")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_and_update_preferences(async_client: AsyncClient, auth_headers: dict):
    # 1. Retrieve default preferences
    get_resp = await async_client.get("/api/v1/preferences", headers=auth_headers)
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert "target_roles" in data
    assert data["auto_apply_enabled"] is False
    assert data["min_match_score"] == 65

    # 2. Update preferences
    update_data = {
        "target_roles": ["Senior Python Engineer", "Backend Architect"],
        "target_countries": ["India", "Germany", "Remote"],
        "work_modes": ["remote"],
        "min_salary": 800000,
        "max_salary": 1500000,
        "currency": "INR",
        "min_match_score": 75,
        "auto_apply_enabled": True,
        "daily_application_limit": 10,
        "excluded_companies": ["Spam Corp", "Bad Tech Ltd"],
    }
    put_resp = await async_client.put(
        "/api/v1/preferences",
        headers=auth_headers,
        json=update_data,
    )
    assert put_resp.status_code == 200
    updated = put_resp.json()
    assert updated["target_roles"] == ["Senior Python Engineer", "Backend Architect"]
    assert updated["min_match_score"] == 75
    assert updated["auto_apply_enabled"] is True
    assert updated["daily_application_limit"] == 10
    assert "Spam Corp" in updated["excluded_companies"]

    # 3. Verify changes persist on next GET
    verify_resp = await async_client.get("/api/v1/preferences", headers=auth_headers)
    assert verify_resp.status_code == 200
    assert verify_resp.json()["min_match_score"] == 75
