import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_jobs_unauthorized(async_client: AsyncClient):
    response = await async_client.get("/api/v1/jobs")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_sync_and_deduplicate_jobs(async_client: AsyncClient, auth_headers: dict):
    # 1. First sync with mock_portal
    sync_resp = await async_client.post(
        "/api/v1/jobs/sync",
        headers=auth_headers,
        json={"source_code": "mock_portal", "query": "Python"},
    )
    assert sync_resp.status_code == 200
    data = sync_resp.json()
    assert data["status"] == "completed"
    assert data["source_code"] == "mock_portal"
    assert data["new_jobs"] >= 1
    initial_new = data["new_jobs"]

    # 2. Second sync immediately afterwards -> Deduplication check
    sync_again = await async_client.post(
        "/api/v1/jobs/sync",
        headers=auth_headers,
        json={"source_code": "mock_portal", "query": "Python"},
    )
    assert sync_again.status_code == 200
    data2 = sync_again.json()
    # No new jobs should be inserted; they should be counted as updated
    assert data2["new_jobs"] == 0
    assert data2["updated_jobs"] == initial_new

    # 3. List jobs
    list_resp = await async_client.get("/api/v1/jobs", headers=auth_headers)
    assert list_resp.status_code == 200
    jobs_data = list_resp.json()
    assert jobs_data["total"] >= initial_new
    assert len(jobs_data["items"]) >= 1

    first_job = jobs_data["items"][0]
    job_id = first_job["id"]
    assert "title" in first_job
    assert "company_name" in first_job
    assert "canonical_url" in first_job

    # 4. Filter jobs by query
    filtered_resp = await async_client.get(
        "/api/v1/jobs?query=Apex",
        headers=auth_headers,
    )
    assert filtered_resp.status_code == 200
    filtered_items = filtered_resp.json()["items"]
    assert all("Apex" in j["company_name"] for j in filtered_items)

    # 5. Filter jobs by remote
    remote_resp = await async_client.get(
        "/api/v1/jobs?is_remote=true",
        headers=auth_headers,
    )
    assert remote_resp.status_code == 200
    remote_items = remote_resp.json()["items"]
    assert all(j["is_remote"] is True for j in remote_items)

    # 6. Retrieve single job by ID
    single_resp = await async_client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)
    assert single_resp.status_code == 200
    assert single_resp.json()["id"] == job_id

    # 7. Filter by location
    loc_resp = await async_client.get("/api/v1/jobs?location=Remote", headers=auth_headers)
    assert loc_resp.status_code == 200
    assert all("remote" in j["location"].lower() for j in loc_resp.json()["items"])

    # 8. Filter by posted_within_days
    fresh_resp = await async_client.get("/api/v1/jobs?posted_within_days=30", headers=auth_headers)
    assert fresh_resp.status_code == 200
    assert isinstance(fresh_resp.json()["items"], list)

    # 9. Filter by min_score
    score_resp = await async_client.get("/api/v1/jobs?min_score=50", headers=auth_headers)
    assert score_resp.status_code == 200
    assert all(j["match_score"] >= 50 for j in score_resp.json()["items"])
