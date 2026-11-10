import re
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, List, Dict, Any
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode


@dataclass
class JobPayload:
    external_id: str
    title: str
    company_name: str
    description: str
    location: str
    is_remote: bool
    application_url: str
    canonical_url: str
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = "USD"
    skills_required: List[str] = field(default_factory=list)
    posted_at: Optional[datetime] = None
    raw_payload: Dict[str, Any] = field(default_factory=dict)


def normalize_url(url: str) -> str:
    """
    Cleans tracking parameters (utm_*, ref, gh_src, etc.) and normalizes
    the URL to provide deterministic deduplication.
    """
    if not url:
        return ""
    parsed = urlparse(url)
    clean_scheme = parsed.scheme.lower()
    clean_netloc = parsed.netloc.lower()
    clean_path = parsed.path.rstrip("/")

    # Strip standard marketing tracking parameters
    tracking_params = {
        "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
        "ref", "gh_src", "source", "fbclid", "gclid", "tracking_id", "trk"
    }
    query_params = parse_qs(parsed.query, keep_blank_values=False)
    filtered_params = {
        k: v for k, v in query_params.items() if k.lower() not in tracking_params
    }
    clean_query = urlencode(filtered_params, doseq=True)

    return urlunparse((clean_scheme, clean_netloc, clean_path, "", clean_query, ""))


class JobSourceAdapter(ABC):
    """Abstract Base Class for all permitted job board and portal adapters."""

    @property
    @abstractmethod
    def source_code(self) -> str:
        """Unique identifier code for the source (e.g. 'arbeitnow', 'adzuna')."""
        pass

    @abstractmethod
    async def fetch_jobs(
        self,
        search_term: str,
        location: Optional[str] = None,
        page: int = 1,
    ) -> List[JobPayload]:
        """Fetch and normalize jobs from the external source."""
        pass
