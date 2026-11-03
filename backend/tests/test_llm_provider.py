import pytest
from unittest.mock import patch, MagicMock
from backend.app.services.llm_provider import (
    clean_json_response,
    get_llm_provider,
    GeminiProvider,
    GroqProvider,
    OllamaProvider,
)
from backend.app.core.config import settings


def test_clean_json_response():
    raw_clean = '{"status": "ok", "count": 5}'
    assert clean_json_response(raw_clean) == {"status": "ok", "count": 5}

    raw_fenced = """```json
    {
      "skills": ["Python", "FastAPI"],
      "match": true
    }
    ```"""
    assert clean_json_response(raw_fenced) == {"skills": ["Python", "FastAPI"], "match": True}


def test_get_llm_provider_selection():
    with patch.object(settings, "LLM_PROVIDER", "gemini"):
        provider = get_llm_provider()
        assert isinstance(provider, GeminiProvider)

    with patch.object(settings, "LLM_PROVIDER", "groq"):
        provider = get_llm_provider()
        assert isinstance(provider, GroqProvider)

    with patch.object(settings, "LLM_PROVIDER", "ollama"):
        provider = get_llm_provider()
        assert isinstance(provider, OllamaProvider)


@pytest.mark.asyncio
async def test_gemini_provider_generate_text_mocked():
    provider = GeminiProvider(api_key="mock_key", model="gemini-2.5-flash")
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "Hello candidate, your profile looks great."}]
                }
            }
        ]
    }

    with patch("httpx.AsyncClient.post", return_value=mock_response):
        result = await provider.generate_text("Analyze profile")
        assert result == "Hello candidate, your profile looks great."
