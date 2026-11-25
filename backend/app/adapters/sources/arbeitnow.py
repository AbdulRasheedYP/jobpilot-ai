import re
import logging
from datetime import datetime, timezone
from typing import Optional, List
import httpx
from backend.app.adapters.sources.base import JobSourceAdapter, JobPayload, normalize_url

logger = logging.getLogger(__name__)


def strip_html(html_str: str) -> str:
    """Removes HTML tags and normalizes whitespace."""
    if not html_str:
        return ""
    text = re.sub(r"<[^>]+>", " ", html_str)
    return " ".join(text.split())


class ArbeitnowAdapter(JobSourceAdapter):
    """
    Adapter for the official Arbeitnow Job Board API.
    Provides free, permitted access to European & Remote developer roles.
    """

    BASE_URL = "https://www.arbeitnow.com/api/job-board-api"

    @property
    def source_code(self) -> str:
        return "arbeitnow"

    async def fetch_jobs(
        self,
        search_term: str = "Python",
        location: Optional[str] = None,
        page: int = 1,
    ) -> List[JobPayload]:
        params = {"page": page}
        jobs: List[JobPayload] = []

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.get(self.BASE_URL, params=params)
                if response.status_code != 200:
                    logger.warning(
                        f"Arbeitnow API returned HTTP {response.status_code}: {response.text[:200]}"
                    )
                    return []

                data = response.json()
                raw_items = data.get("data", [])

                term_raw = search_term.strip().lower() if search_term else ""
                term_clean = re.sub(r"\(.*?\)|\[.*?\]", " ", term_raw).strip()
                keywords = [k for k in re.split(r"[\s,]+", term_clean) if len(k) >= 2]

                for item in raw_items:
                    title = item.get("title", "")
                    tags = item.get("tags", [])
                    description_html = item.get("description", "")
                    clean_desc = strip_html(description_html)
                    job_url = item.get("url", "")
                    is_remote = bool(item.get("remote", False))
                    job_location = item.get("location", "Remote" if is_remote else "Unknown")

                    # Filter by search term if provided
                    content_to_match = f"{title} {' '.join(tags)} {clean_desc}".lower()
                    if term_raw:
                        matches = (term_raw in content_to_match) or (term_clean and term_clean in content_to_match)
                        if not matches and keywords:
                            key_tech = [k for k in keywords if k not in ("developer", "engineer", "specialist")]
                            if key_tech:
                                matches = any(k in content_to_match for k in key_tech)
                            else:
                                matches = any(k in content_to_match for k in keywords)
                        if not matches:
                            continue

                    # Filter by location if provided
                    if location and location.lower() not in job_location.lower() and not is_remote:
                        continue

                    posted_at = None
                    if item.get("created_at"):
                        try:
                            posted_at = datetime.fromtimestamp(item["created_at"], tz=timezone.utc)
                        except Exception:
                            pass

                    payload = JobPayload(
                        external_id=item.get("slug") or str(hash(job_url)),
                        title=title,
                        company_name=item.get("company_name", "Unknown Company"),
                        description=clean_desc,
                        location=job_location,
                        is_remote=is_remote,
                        application_url=job_url,
                        canonical_url=normalize_url(job_url),
                        employment_type="Full-time",
                        experience_level=None,
                        skills_required=tags,
                        posted_at=posted_at,
                        raw_payload=item,
                    )
                    jobs.append(payload)

        except Exception as e:
            logger.error(f"Error fetching jobs from Arbeitnow: {e}")

        return jobs
