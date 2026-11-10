import os
import logging
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
import httpx
from backend.app.adapters.sources.base import JobSourceAdapter, JobPayload, normalize_url

logger = logging.getLogger(__name__)


class AdzunaAdapter(JobSourceAdapter):
    """
    Adapter for the official Adzuna Jobs Search API.
    Supports multi-country searches (gb, us, in, etc.).
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        cfg = config or {}
        self.app_id = cfg.get("app_id") or os.getenv("ADZUNA_APP_ID", "")
        self.app_key = cfg.get("app_key") or os.getenv("ADZUNA_APP_KEY", "")
        self.country = cfg.get("country") or os.getenv("ADZUNA_COUNTRY", "in")

    @property
    def source_code(self) -> str:
        return "adzuna"

    async def fetch_jobs(
        self,
        search_term: str = "Python",
        location: Optional[str] = None,
        page: int = 1,
    ) -> List[JobPayload]:
        if not self.app_id or not self.app_key:
            logger.info("Adzuna API credentials not configured; skipping external fetch.")
            return []

        url = f"https://api.adzuna.com/v1/api/jobs/{self.country.lower()}/search/{page}"
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "what": search_term,
            "results_per_page": 20,
            "content-type": "application/json",
        }
        if location:
            params["where"] = location

        jobs: List[JobPayload] = []

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(url, params=params)
                if response.status_code != 200:
                    logger.warning(
                        f"Adzuna API returned HTTP {response.status_code}: {response.text[:200]}"
                    )
                    return []

                data = response.json()
                results = data.get("results", [])

                for item in results:
                    external_id = str(item.get("id", ""))
                    title = item.get("title", "")
                    company_info = item.get("company", {})
                    company_name = company_info.get("display_name", "Unknown Company")
                    description = item.get("description", "")
                    redirect_url = item.get("redirect_url", "")
                    
                    loc_info = item.get("location", {})
                    area = loc_info.get("display_name", "Unknown")
                    is_remote = "remote" in title.lower() or "remote" in description.lower() or "remote" in area.lower()

                    salary_min = item.get("salary_min")
                    salary_max = item.get("salary_max")
                    created_str = item.get("created")
                    posted_at = None
                    if created_str:
                        try:
                            posted_at = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                        except Exception:
                            pass

                    payload = JobPayload(
                        external_id=external_id,
                        title=title,
                        company_name=company_name,
                        description=description,
                        location=area,
                        is_remote=is_remote,
                        application_url=redirect_url,
                        canonical_url=normalize_url(redirect_url),
                        employment_type=item.get("contract_time"),
                        experience_level=None,
                        salary_min=int(salary_min) if salary_min else None,
                        salary_max=int(salary_max) if salary_max else None,
                        currency="INR" if self.country.lower() == "in" else "USD",
                        skills_required=[],
                        posted_at=posted_at,
                        raw_payload=item,
                    )
                    jobs.append(payload)

        except Exception as e:
            logger.error(f"Error fetching jobs from Adzuna: {e}")

        return jobs
