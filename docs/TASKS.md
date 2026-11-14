# JobPilot AI --- Development Tasks

**Version:** 1.0\
**Status:** Draft

## Phase 1 --- Project setup

-   [x] Create the project structure (`backend/`, `frontend/`).
-   [x] Set up Git, `.gitignore`, and `docker-compose.yml`.
-   [x] Set up GitHub Actions CI workflow (`.github/workflows/ci.yml`).
-   [x] Set up automated database backup script (`scripts/backup_db.sh`).
-   [x] Create the React + JavaScript (Vite + Tailwind) frontend.
-   [x] Create the FastAPI backend with health check endpoint.
-   [x] Configure PostgreSQL and Alembic migrations.
-   [x] Configure Redis and Celery for 24/7 background tasks.
-   [x] Implement JWT single-user authentication & login endpoint.
-   [x] Implement pluggable LLM provider layer (Gemini / Groq / OpenAI / Ollama).

## Phase 2 --- Candidate profile

-   [x] Build profile management.
-   [x] Add CV upload.
-   [x] Extract CV information.
-   [x] Let the user review and confirm extracted facts.
-   [x] Save job preferences.

## Phase 3 --- Job discovery

-   [x] Select primary permitted job source (e.g. Arbeitnow / Adzuna official API).
-   [x] Build modular source adapter (`JobSourceAdapter` interface).
-   [x] Normalize job listings into standard format.
-   [x] Add duplicate detection (canonical URL & unique source ID).
-   [x] Save jobs in PostgreSQL.

## Phase 4 --- Matching

-   [x] Implement eligibility checks (role, experience, location, authorization).
-   [x] Implement the initial match score (weights as per `DECISION_ENGINE.md`).
-   [x] Show explainable match reasons in output.
-   [x] Test with real job descriptions.

## Phase 5 --- Application preparation

-   [x] Generate a tailored CV using confirmed facts only.
-   [x] Validate that it contains no unsupported claims or hallucinations.
-   [x] Prepare application answers from verified candidate profile.
-   [x] Flag missing mandatory information (`NEEDS_USER_INPUT`).

## Phase 6 --- Auto-apply

-   [ ] Implement deterministic auto-apply policy checks (`DECISION_ENGINE.md`).
-   [ ] Build a Local Mock Application Portal (test career page) for safe Playwright testing.
-   [ ] Implement Playwright application adapter using verified candidate data.
-   [ ] Implement duplicate submission prevention and idempotency.
-   [ ] Verify and record submission results with confirmation proof.

## Phase 7 --- Tracking and reliability

-   [ ] Build the application dashboard.
-   [ ] Add agent run history.
-   [ ] Add pause, resume and stop controls.
-   [ ] Handle retries and failures.
-   [ ] Test recovery after restart.
-   [ ] Back up the database and CV files.

## Development rule

Complete and test each phase before moving to the next. Start with one
end-to-end workflow before adding more job sources or integrations.

------------------------------------------------------------------------

## Review

-   [ ] Tasks are in a practical order.
-   [ ] First working version is clearly scoped.
-   [ ] Ready to begin implementation planning.
