from datetime import datetime, timezone
from typing import Optional, List
from backend.app.adapters.sources.base import JobSourceAdapter, JobPayload, normalize_url


class MockPortalAdapter(JobSourceAdapter):
    """
    Adapter for local testing and career portal simulation.
    Generates realistic developer roles for tests and offline validation.
    """

    @property
    def source_code(self) -> str:
        return "mock_portal"

    async def fetch_jobs(
        self,
        search_term: str = "Python",
        location: Optional[str] = None,
        page: int = 1,
    ) -> List[JobPayload]:
        mock_jobs = [
            JobPayload(
                external_id="mock-job-001",
                title="Junior Python Developer",
                company_name="Apex Tech Solutions",
                description="Looking for an energetic Junior Python Developer proficient with FastAPI, PostgreSQL, and Git.",
                location="Bangalore, India",
                is_remote=True,
                application_url="https://careers.apextech.in/jobs/junior-python-developer",
                canonical_url=normalize_url("https://careers.apextech.in/jobs/junior-python-developer"),
                employment_type="Full-time",
                experience_level="fresher",
                salary_min=500000,
                salary_max=800000,
                currency="INR",
                skills_required=["Python", "FastAPI", "PostgreSQL", "Git"],
                posted_at=datetime.now(timezone.utc),
                raw_payload={"mock": True, "id": "001"},
            ),
            JobPayload(
                external_id="mock-job-002",
                title="Full Stack Software Engineer (Python/React)",
                company_name="Innovate Labs",
                description="We are seeking a Full Stack Engineer to build web applications using React, Vite, Python, and Docker.",
                location="Kochi, India",
                is_remote=False,
                application_url="https://innovatelabs.co/careers/fullstack-python-react",
                canonical_url=normalize_url("https://innovatelabs.co/careers/fullstack-python-react"),
                employment_type="Full-time",
                experience_level="junior",
                salary_min=600000,
                salary_max=1000000,
                currency="INR",
                skills_required=["Python", "React", "Docker", "REST API"],
                posted_at=datetime.now(timezone.utc),
                raw_payload={"mock": True, "id": "002"},
            ),
            JobPayload(
                external_id="mock-job-003",
                title="Senior Java Architect",
                company_name="Enterprise Systems Inc",
                description="Seeking Senior Java Architect with 10+ years experience in Spring Boot and Kubernetes.",
                location="Mumbai, India",
                is_remote=False,
                application_url="https://enterprisesystems.com/careers/senior-java-architect",
                canonical_url=normalize_url("https://enterprisesystems.com/careers/senior-java-architect"),
                employment_type="Full-time",
                experience_level="senior",
                salary_min=2000000,
                salary_max=3500000,
                currency="INR",
                skills_required=["Java", "Spring Boot", "Kubernetes"],
                posted_at=datetime.now(timezone.utc),
                raw_payload={"mock": True, "id": "003"},
            ),
        ]

        term_lower = search_term.lower() if search_term else ""
        filtered = []
        for job in mock_jobs:
            if term_lower and (term_lower not in job.title.lower() and term_lower not in " ".join(job.skills_required).lower()):
                continue
            if location and (location.lower() not in job.location.lower() and not job.is_remote):
                continue
            filtered.append(job)

        return filtered
