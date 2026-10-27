# JobPilot AI --- System Architecture

**Version:** 1.0\
**Status:** Draft\
**Related documents:** `MVP.md`, `AGENT_WORKFLOW.md`, `AGENT_DESIGN.md`

## 1. Architecture overview

JobPilot AI will use a simple modular architecture:

``` text
React Frontend
      ↓
FastAPI Backend
      ↓
LangGraph Orchestrator
      ↓
Python Services and Tools
  ├── CV Processing
  ├── Job Source Integrations
  ├── Matching
  ├── Resume Generation
  └── Application Execution
      ↓
PostgreSQL

Background Tasks: Celery + Redis
LLM: Ollama initially
```

## 2. Technology stack

  -----------------------------------------------------------------------
  Layer                   Technology              Purpose
  ----------------------- ----------------------- -----------------------
  Frontend                React + JavaScript      User interface

  Styling                 Tailwind CSS            UI styling

  Backend                 Python + FastAPI        API and business logic

  Agent                   LangGraph               Workflow orchestration

  Database                PostgreSQL              Store profiles, jobs
                                                  and applications

  ORM                     SQLAlchemy              Database operations

  Migrations              Alembic                 Database schema changes

  Background tasks        Celery + Redis          Scheduled and
                                                  long-running work

  LLM                     Ollama initially        Local language model

  Browser automation      Playwright              Only permitted
                                                  application workflows
  -----------------------------------------------------------------------

## 3. Main modules

-   **Frontend:** profile, CV upload, preferences, jobs and application
    dashboard.
-   **Backend API:** authentication, validation and frontend
    communication.
-   **Agent module:** controls the job-search and application workflow.
-   **Integration module:** connects permitted job sources and
    application methods.
-   **Service module:** CV processing, matching and resume generation.
-   **Worker module:** runs background tasks.
-   **Database module:** stores application data and agent state.

## 4. Data flow

1.  User uploads a CV through React.
2.  FastAPI stores the file and starts CV analysis.
3.  Confirmed candidate facts are saved in PostgreSQL.
4.  The user starts a job-search run.
5.  LangGraph coordinates the workflow.
6.  Python services retrieve and evaluate jobs.
7.  The application is prepared and checked by the policy engine.
8.  A permitted adapter submits the application.
9.  The result is verified and saved.
10. React displays the updated status.

## 5. Deployment approach

For the first version, run the application locally on Ubuntu.

-   React frontend runs locally.
-   FastAPI provides the backend API.
-   PostgreSQL stores application data.
-   Redis and Celery handle background tasks.
-   Ollama runs the selected local LLM.

Keep credentials and environment settings outside source control.

## 6. Architecture principles

-   Start as a modular monolith; do not use microservices for this
    personal MVP.
-   Keep LLM calls separate from critical business rules.
-   Use adapters for each job source.
-   Persist agent state and application history.
-   Validate all tool inputs and outputs.
-   Make submission safe against duplicate retries.
-   Add integrations only after the first end-to-end flow works.

------------------------------------------------------------------------

## Review

-   [ ] Architecture is understandable.
-   [ ] Technology choices are suitable.
-   [ ] Local Ubuntu deployment is acceptable.

After approval, prepare `DATABASE.md`.
