import pytest
from unittest.mock import patch, AsyncMock
from backend.app.adapters.sources.base import normalize_url
from backend.app.adapters.sources.mock_portal import MockPortalAdapter
from backend.app.adapters.sources.arbeitnow import ArbeitnowAdapter, strip_html
from backend.app.adapters.sources.adzuna import AdzunaAdapter
from backend.app.adapters.sources import get_source_adapter


def test_normalize_url_strips_tracking_params():
    dirty_url = "https://example.com/jobs/123/?utm_source=linkedin&utm_medium=cpc&ref=partner#section"
    expected = "https://example.com/jobs/123"
    assert normalize_url(dirty_url) == expected


def test_normalize_url_preserves_legitimate_params():
    url = "https://example.com/apply?id=456&role=developer&utm_campaign=winter"
    clean = normalize_url(url)
    assert "id=456" in clean
    assert "role=developer" in clean
    assert "utm_campaign" not in clean


def test_strip_html():
    raw_html = "<p>Join our team as a <b>Python Engineer</b>!</p><br/><ul><li>Remote</li></ul>"
    clean = strip_html(raw_html)
    assert clean == "Join our team as a Python Engineer ! Remote"


@pytest.mark.asyncio
async def test_mock_portal_adapter():
    adapter = MockPortalAdapter()
    assert adapter.source_code == "mock_portal"

    jobs = await adapter.fetch_jobs(search_term="Python")
    assert len(jobs) >= 1
    assert any("Python" in j.title for j in jobs)

    # Filter with non-matching search term
    no_jobs = await adapter.fetch_jobs(search_term="RustBlockchainExpert999")
    assert len(no_jobs) == 0


@pytest.mark.asyncio
async def test_arbeitnow_adapter_mocked():
    adapter = ArbeitnowAdapter()
    assert adapter.source_code == "arbeitnow"

    mock_api_response = {
        "data": [
            {
                "slug": "senior-python-dev-123",
                "company_name": "Arbeit Co",
                "title": "Senior Python Developer",
                "description": "<p>Build scalable backend systems with FastAPI and Postgres.</p>",
                "remote": True,
                "url": "https://www.arbeitnow.com/jobs/companies/arbeit-co/senior-python-dev-123",
                "tags": ["Python", "FastAPI", "PostgreSQL"],
                "location": "Berlin, Germany",
                "created_at": 1731800000,
            }
        ]
    }

    from unittest.mock import MagicMock
    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = mock_api_response
        mock_get.return_value = mock_response

        jobs = await adapter.fetch_jobs(search_term="Python")
        assert len(jobs) == 1
        assert jobs[0].company_name == "Arbeit Co"
        assert jobs[0].is_remote is True
        assert "FastAPI" in jobs[0].skills_required


@pytest.mark.asyncio
async def test_adzuna_adapter_unconfigured():
    adapter = AdzunaAdapter(config={"app_id": "", "app_key": ""})
    jobs = await adapter.fetch_jobs(search_term="Python")
    assert jobs == []


def test_adapter_registry():
    arbeitnow = get_source_adapter("arbeitnow")
    assert isinstance(arbeitnow, ArbeitnowAdapter)

    mock_portal = get_source_adapter("mock_portal")
    assert isinstance(mock_portal, MockPortalAdapter)

    with pytest.raises(ValueError):
        get_source_adapter("unsupported_source_xyz")
