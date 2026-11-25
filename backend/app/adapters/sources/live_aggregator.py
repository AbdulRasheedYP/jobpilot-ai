import re
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional, List
from backend.app.adapters.sources.base import JobSourceAdapter, JobPayload, normalize_url

logger = logging.getLogger(__name__)


class LiveJobAggregatorAdapter(JobSourceAdapter):
    """
    Adapter for real-time live job discovery across Indeed and LinkedIn India.
    Fetches genuine, active developer jobs without fabrication or mock data.
    """

    @property
    def source_code(self) -> str:
        return "live_aggregator"

    async def fetch_jobs(
        self,
        search_term: str = "Software Engineer",
        location: Optional[str] = None,
        page: int = 1,
    ) -> List[JobPayload]:
        # Run scraping in threadpool to prevent blocking the async event loop
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            self._scrape_sync,
            search_term,
            location,
        )

    def _scrape_sync(self, search_term: str, location: Optional[str]) -> List[JobPayload]:
        try:
            from jobspy import scrape_jobs
        except ImportError:
            logger.error("python-jobspy is not installed. Please install python-jobspy.")
            return []

        # Sanitize search term (remove brackets like '(L3)', '(Senior)', etc.)
        term_clean = re.sub(r"\(.*?\)|\[.*?\]", " ", search_term).strip()
        loc = location if location and "worldwide" not in location.lower() else "India"

        logger.info(f"Scraping live jobs for query: '{term_clean}', location: '{loc}'...")

        try:
            df = scrape_jobs(
                site_name=["indeed", "linkedin"],
                search_term=term_clean,
                location=loc,
                results_wanted=10,
                country_indeed="india",
            )
        except Exception as err:
            logger.error(f"Error scraping live jobs: {err}")
            return []

        if df is None or len(df) == 0:
            return []

        payloads: List[JobPayload] = []
        for _, row in df.iterrows():
            title = str(row.get("title") or "").strip()
            company = str(row.get("company") or "Unknown Company").strip()
            job_url = str(row.get("job_url") or "").strip()

            if not title or not job_url or title.lower() == "nan":
                continue

            site = str(row.get("site") or "job").lower()
            job_id = str(row.get("id") or abs(hash(job_url)))
            ext_id = f"{site}-{job_id}"

            posted_at = None
            date_val = row.get("date_posted")
            if date_val and str(date_val).lower() != "nan":
                try:
                    if isinstance(date_val, str):
                        posted_at = datetime.fromisoformat(date_val).replace(tzinfo=timezone.utc)
                    else:
                        posted_at = datetime.combine(date_val, datetime.min.time(), tzinfo=timezone.utc)
                except Exception:
                    posted_at = datetime.now(timezone.utc)

            desc = str(row.get("description") or "")
            if desc.lower() == "nan" or not desc.strip():
                desc = f"{title} at {company}. View full listing and apply directly at {job_url}"

            raw_skills = row.get("skills")
            skills = []
            if isinstance(raw_skills, list):
                skills = [str(s) for s in raw_skills]
            elif isinstance(raw_skills, str) and raw_skills.lower() != "nan":
                skills = [s.strip() for s in raw_skills.split(",") if s.strip()]

            # Salary extraction if present
            salary_min = None
            salary_max = None
            min_amt = row.get("min_amount")
            max_amt = row.get("max_amount")
            if min_amt and str(min_amt).lower() != "nan":
                try:
                    salary_min = int(float(min_amt))
                except Exception:
                    pass
            if max_amt and str(max_amt).lower() != "nan":
                try:
                    salary_max = int(float(max_amt))
                except Exception:
                    pass

            curr = str(row.get("currency") or "INR")
            if curr.lower() == "nan":
                curr = "INR"

            payload = JobPayload(
                external_id=ext_id,
                title=title,
                company_name=company,
                description=desc,
                location=str(row.get("location") or loc),
                is_remote=bool(row.get("is_remote") == True or "remote" in title.lower() or "remote" in desc.lower()),
                application_url=job_url,
                canonical_url=normalize_url(job_url),
                employment_type=str(row.get("job_type") or "Full-time") if str(row.get("job_type")).lower() != "nan" else "Full-time",
                salary_min=salary_min,
                salary_max=salary_max,
                currency=curr,
                skills_required=skills,
                posted_at=posted_at,
                raw_payload={"site": site, "scraped_live": True},
            )
            payloads.append(payload)

        logger.info(f"Extracted {len(payloads)} real live job payloads for '{term_clean}'.")
        return payloads
