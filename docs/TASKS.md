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

-   [ ] Select one permitted job source.
-   [ ] Build its source adapter.
-   [ ] Normalize job listings.
-   [ ] Add duplicate detection.
-   [ ] Save jobs in PostgreSQL.

## Phase 4 --- Matching

-   [ ] Implement eligibility checks.
-   [ ] Implement the initial match score.
-   [ ] Show match reasons.
-   [ ] Test with real job descriptions.

## Phase 5 --- Application preparation

-   [ ] Generate a tailored CV.
-   [ ] Validate that it contains only verified facts.
-   [ ] Prepare application answers.
-   [ ] Flag missing mandatory information.

## Phase 6 --- Auto-apply

-   [ ] Implement the auto-apply policy checks.
-   [ ] Select one permitted application method.
-   [ ] Test safely before live submission.
-   [ ] Implement duplicate prevention.
-   [ ] Verify and record submission results.

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
