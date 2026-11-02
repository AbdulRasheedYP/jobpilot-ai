import pytest
from httpx import ASGITransport, AsyncClient
from backend.app.main import app
from backend.app.core.config import settings


@pytest.mark.asyncio
async def test_health_check_endpoint():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get(f"{settings.API_V1_PREFIX}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["app_name"] == settings.APP_NAME
        assert data["llm_provider"] == settings.LLM_PROVIDER
