import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_meta_options(async_client: AsyncClient, auth_headers: dict):
    response = await async_client.get("/api/v1/meta/options", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()

    assert "roles" in data
    assert "locations" in data
    assert "skills" in data
    assert "work_modes" in data
    assert "date_freshness" in data

    # Verify standard values are seeded and present
    assert "Python Developer" in data["roles"]
    assert "Bangalore" in data["locations"]
    assert "Python" in data["skills"]
    assert "remote" in data["work_modes"]
    assert len(data["date_freshness"]) > 0
    assert any(df["days"] == 7 for df in data["date_freshness"])


@pytest.mark.asyncio
async def test_dynamic_lookup_expansion(async_client: AsyncClient, auth_headers: dict):
    # Add custom skill via profile update
    profile_res = await async_client.put(
        "/api/v1/profile",
        headers=auth_headers,
        json={"skills": ["Python", "Quantum Computing"]},
    )
    assert profile_res.status_code == 200

    # Add custom role and location via preference update
    pref_res = await async_client.put(
        "/api/v1/preferences",
        headers=auth_headers,
        json={
            "target_roles": ["Robotics Engineer"],
            "target_countries": ["Munich, Germany"],
        },
    )
    assert pref_res.status_code == 200

    # Verify meta options endpoint returns newly registered dynamic taxonomy
    meta_res = await async_client.get("/api/v1/meta/options", headers=auth_headers)
    assert meta_res.status_code == 200
    meta_data = meta_res.json()

    assert "Quantum Computing" in meta_data["skills"]
    assert "Robotics Engineer" in meta_data["roles"]
    assert "Munich, Germany" in meta_data["locations"]
