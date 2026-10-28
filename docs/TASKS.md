# JobPilot AI --- Development Tasks

**Version:** 1.0\
**Status:** Draft

## Phase 1 --- Project setup

-   [ ] Create the project structure.
-   [ ] Set up Git and `.gitignore`.
-   [ ] Create the React + JavaScript frontend.
-   [ ] Create the FastAPI backend.
-   [ ] Configure PostgreSQL and Alembic.
-   [ ] Configure Redis and Celery.

## Phase 2 --- Candidate profile

-   [ ] Build profile management.
-   [ ] Add CV upload.
-   [ ] Extract CV information.
-   [ ] Let the user review and confirm extracted facts.
-   [ ] Save job preferences.

## Phase 3 --- Job discovery

-   [ ] Select primary permitted job source (e.g. Arbeitnow / Adzuna official API).
-   [ ] Build modular source adapter (`JobSourceAdapter` interface).
-   [ ] Normalize job listings into standard format.
-   [ ] Add duplicate detection (canonical URL & unique source ID).
-   [ ] Save jobs in PostgreSQL.

## Phase 4 --- Matching

-   [ ] Implement eligibility checks (role, experience, location, authorization).
-   [ ] Implement the initial match score (weights as per `DECISION_ENGINE.md`).
-   [ ] Show explainable match reasons in output.
-   [ ] Test with real job descriptions.

## Phase 5 --- Application preparation

-   [ ] Generate a tailored CV using confirmed facts only.
-   [ ] Validate that it contains no unsupported claims or hallucinations.
-   [ ] Prepare application answers from verified candidate profile.
-   [ ] Flag missing mandatory information (`NEEDS_USER_INPUT`).

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
