from typing import Dict, Type, Optional
from backend.app.adapters.sources.base import JobSourceAdapter, JobPayload, normalize_url
from backend.app.adapters.sources.arbeitnow import ArbeitnowAdapter
from backend.app.adapters.sources.adzuna import AdzunaAdapter
from backend.app.adapters.sources.mock_portal import MockPortalAdapter
from backend.app.adapters.sources.live_aggregator import LiveJobAggregatorAdapter

ADAPTER_REGISTRY: Dict[str, Type[JobSourceAdapter]] = {
    "live_aggregator": LiveJobAggregatorAdapter,
    "arbeitnow": ArbeitnowAdapter,
    "adzuna": AdzunaAdapter,
    "mock_portal": MockPortalAdapter,
}


def get_source_adapter(source_code: str, config: Optional[dict] = None) -> JobSourceAdapter:
    """Instantiate and return the appropriate adapter for a given source code."""
    adapter_cls = ADAPTER_REGISTRY.get(source_code.lower())
    if not adapter_cls:
        raise ValueError(f"No adapter registered for job source: '{source_code}'")

    if source_code.lower() == "adzuna":
        return adapter_cls(config=config)
    return adapter_cls()
