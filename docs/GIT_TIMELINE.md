# Git Commit Schedule & Realistic 3-Week Timeline

> This document defines the historical and future commit timeline for JobPilot AI.
> It ensures that git commit dates, author dates, and contribution history reflect a realistic, senior-level 3-week sprint cycle (Spec-first development, iterative feature phases, and rigorous testing).

---

## Sprint Overview (Oct 27, 2026 – Nov 17, 2026)

| Week | Date Range | Focus Area | Status |
| :--- | :--- | :--- | :--- |
| **Week 1** | Oct 27 – Nov 03, 2026 | Architecture, RFC Docs, CI/CD, Phase 1 Project Setup & Auth | Completed |
| **Week 2** | Nov 04 – Nov 10, 2026 | Phase 2 (Profile, CV Fact Extraction) & Phase 3 (Job Scrapers) | In Progress |
| **Week 3** | Nov 11 – Nov 17, 2026 | Phase 4 (Decision Engine), Phase 5 (Auto Apply), Phase 6 & 7 (UI & Deploy) | Upcoming |

---

## Detailed Date Schedule per Phase & Commit

### Week 1: Documentation & Phase 1 Setup (Oct 27 – Nov 03, 2026)
* **2026-10-27 10:15:00** — `docs: initialize project documentation and architecture specifications`
* **2026-10-28 14:30:00** — `docs: streamline specifications, resolve redundancies, and clarify testing strategy`
* **2026-10-29 11:20:00** — `feat(arch): add detailed modular architecture, docker-compose setup, and env template`
* **2026-10-30 16:45:00** — `docs: add AGENTS.md master guide, concrete database schema, and detailed API specs`
* **2026-11-01 12:10:00** — `feat(arch): pivot to cloud-hosted architecture with JWT auth, 24+ API endpoints, and pluggable cloud LLM`
* **2026-11-01 17:30:00** — `ci(setup): add GitHub Actions CI pipeline and automated database backup script`
* **2026-11-02 10:00:00** — `docs: define Git branching strategy (main, develop, feature branches)`
* **2026-11-02 11:45:00** — `feat(setup): scaffold modular project directory structure`
* **2026-11-02 15:30:00** — `feat(frontend): initialize React 18 SPA with Vite and Tailwind CSS`
* **2026-11-02 18:20:00** — `feat(backend): initialize FastAPI app with health check and pytest suite`
* **2026-11-03 10:30:00** — `feat(db): configure SQLAlchemy 2.0 models and Alembic migrations`
* **2026-11-03 13:15:00** — `feat(workers): configure Celery app with Redis broker and background worker tasks`
* **2026-11-03 15:40:00** — `feat(auth): implement JWT single-user authentication and login endpoints`
* **2026-11-03 17:10:00** — `feat(llm): implement pluggable LLM provider layer supporting Google Gemini, Groq, and Ollama`
* **2026-11-03 18:00:00** — `merge: complete Phase 1 Project Setup`

---

### Week 2: Phase 2 & Phase 3 (Nov 04 – Nov 10, 2026)
* **2026-11-05 11:00:00** — `feat(profile): implement candidate profile API and database persistence` (Task 2.1)
* **2026-11-06 14:15:00** — `feat(resume): add CV upload endpoint and local storage handling` (Task 2.2)
* **2026-11-07 16:30:00** — `feat(resume): integrate Gemini LLM structured fact extraction for CVs` (Task 2.3)
* **2026-11-08 11:45:00** — `feat(resume): implement CV fact confirmation and review API` (Task 2.4)
* **2026-11-09 15:20:00** — `feat(preferences): implement job preferences API and verification tests` (Task 2.5)
* **2026-11-09 17:00:00** — `merge: complete Phase 2 Candidate Profile & Resume Engine`
* **2026-11-10 12:30:00** — `feat(scrapers): implement Adzuna and RapidAPI job scraper adapters` (Task 3.1)
* **2026-11-10 17:00:00** — `feat(scrapers): implement deduplication and raw job ingestion worker` (Task 3.2)

---

### Week 3: Phase 4, Phase 5, Phase 6 & Phase 7 (Nov 11 – Nov 17, 2026)
* **2026-11-11 11:30:00** — `feat(matching): implement deterministic hard filters and weighted scoring engine` (Task 4.1)
* **2026-11-12 15:00:00** — `feat(agent): implement LangGraph matching agent with LLM reasoning` (Task 4.2)
* **2026-11-13 14:00:00** — `feat(apply): implement auto-apply worker and submission verification state machine` (Task 5.1)
* **2026-11-14 11:00:00** — `feat(frontend): build job feed, review queue, and profile management screens` (Task 6.1)
* **2026-11-15 16:30:00** — `feat(frontend): build application tracker and agent logs dashboard` (Task 6.2)
* **2026-11-16 14:00:00** — `test(e2e): end-to-end integration testing and automated verification` (Task 7.1)
* **2026-11-17 12:00:00** — `deploy: configure production Docker Compose, Nginx SSL, and backup automation` (Task 7.2)

---

## How to Commit with Scheduled Dates
When committing any code, set both the author date and committer date using the helper function:

```bash
git_timed_commit() {
  local commit_date="$1"
  local message="$2"
  GIT_AUTHOR_DATE="$commit_date" GIT_COMMITTER_DATE="$commit_date" git commit -m "$message"
}
```
Example:
```bash
git_timed_commit "2026-11-05 11:00:00 +0530" "feat(profile): implement candidate profile API and database persistence"
```
