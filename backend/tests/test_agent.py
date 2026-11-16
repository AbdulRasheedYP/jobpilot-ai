import pytest
from httpx import AsyncClient
from backend.app.models.enums import AgentRunStatus


@pytest.mark.asyncio
async def test_agent_dashboard_metrics(async_client: AsyncClient, auth_headers: dict):
    resp = await async_client.get("/api/v1/agent/dashboard", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_jobs" in data
    assert "strong_matches" in data
    assert "applied_confirmed" in data
    assert "auto_apply_enabled" in data


@pytest.mark.asyncio
async def test_agent_full_cycle_run(async_client: AsyncClient, auth_headers: dict):
    # 1. Start agent run
    run_resp = await async_client.post(
        "/api/v1/agent/run",
        headers=auth_headers,
        json={"run_type": "FULL_CYCLE"},
    )
    assert run_resp.status_code == 201
    run_data = run_resp.json()
    assert run_data["status"] == AgentRunStatus.COMPLETED.value
    assert len(run_data["events"]) >= 3
    run_id = run_data["id"]

    # 2. Retrieve run by id
    detail_resp = await async_client.get(f"/api/v1/agent/runs/{run_id}", headers=auth_headers)
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == run_id

    # 3. List historical runs
    list_resp = await async_client.get("/api/v1/agent/runs", headers=auth_headers)
    assert list_resp.status_code == 200
    assert len(list_resp.json()["items"]) >= 1

    # 4. Test run status controls (pause, resume, stop)
    pause_resp = await async_client.post(f"/api/v1/agent/runs/{run_id}/pause", headers=auth_headers)
    assert pause_resp.status_code == 200
    assert pause_resp.json()["status"] == AgentRunStatus.PAUSED.value

    resume_resp = await async_client.post(f"/api/v1/agent/runs/{run_id}/resume", headers=auth_headers)
    assert resume_resp.status_code == 200
    assert resume_resp.json()["status"] == AgentRunStatus.RUNNING.value

    stop_resp = await async_client.post(f"/api/v1/agent/runs/{run_id}/stop", headers=auth_headers)
    assert stop_resp.status_code == 200
    assert stop_resp.json()["status"] == AgentRunStatus.STOPPED.value
