# JobPilot AI --- Development Rules

**Version:** 1.1

## 1. General

-   Keep code simple, modular and readable.
-   Follow the approved MVP scope.
-   Do not add unplanned features.
-   Never put secrets in source code.

## 2. Backend

-   Use Python and FastAPI.
-   Validate API data with Pydantic.
-   Keep business logic in service modules.
-   Use SQLAlchemy and Alembic.
-   Handle errors consistently.
-   Test important business logic.

## 3. Frontend

-   Use React with JavaScript only. Do not use TypeScript.
-   Use reusable components.
-   Keep API calls in a separate service layer.
-   Handle loading, empty and error states.

## 4. Agent

-   Use LangGraph to manage the agent workflow.
-   Use normal Python functions for deterministic tasks.
-   Validate LLM outputs before using them.
-   Keep tool permissions explicit.
-   Never allow the LLM to bypass auto-apply rules.
-   Log important decisions and failures.

## 5. Development workflow

-   Follow the task order in `docs/TASKS.md`.
-   Follow the agent flow in `docs/AGENT_WORKFLOW.md`.
-   Follow the architecture in `docs/ARCHITECTURE.md`.
-   Follow the database design in `docs/DATABASE.md`.
-   Follow the API contracts in `docs/API_SPECIFICATION.md`.
-   Complete and test the current task before starting the next one.
-   Do not skip tasks or work on future phases early.
-   Update `TASKS.md` when a task is completed.
-   If documents conflict or a requirement is unclear, stop and resolve
    it before coding.
-   Change approved plans only after reviewing and updating the relevant
    documentation.

## 6. Git and testing

-   Make small, meaningful Git commits.
-   Use clear commit messages.
-   Keep `.env`, credentials and private files out of Git.
-   Test CV parsing, matching, duplicate prevention, policy checks and
    application status changes.
-   Do not test live submissions unless the method is permitted and the
    test is authorized.

------------------------------------------------------------------------

**Main rule:** Work in the documented order. Finish, test and record
each task before moving forward.
