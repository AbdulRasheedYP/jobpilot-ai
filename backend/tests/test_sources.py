import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_sources_unauthorized(async_client: AsyncClient):
    response = await async_client.get("/api/v1/sources")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_and_update_sources(async_client: AsyncClient, auth_headers: dict):
    # 1. Retrieve seeded sources
    resp = await async_client.get("/api/v1/sources", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "sources" in data
    sources = data["sources"]
    assert len(sources) >= 2

    codes = [s["code"] for s in sources]
    assert "arbeitnow" in codes
    assert "mock_portal" in codes

    # 2. Update a source (enable/disable or permit auto-apply)
    target_source = next(s for s in sources if s["code"] == "mock_portal")
    source_id = target_source["id"]

    patch_resp = await async_client.patch(
        f"/api/v1/sources/{source_id}",
        headers=auth_headers,
        json={"is_enabled": False, "permits_auto_apply": False},
    )
    assert patch_resp.status_code == 200
    updated = patch_resp.json()
    assert updated["is_enabled"] is False
    assert updated["permits_auto_apply"] is False

    # Restore enabled
    restore_resp = await async_client.patch(
        f"/api/v1/sources/{source_id}",
        headers=auth_headers,
        json={"is_enabled": True, "permits_auto_apply": True},
    )
    assert restore_resp.status_code == 200
    assert restore_resp.json()["is_enabled"] is True
