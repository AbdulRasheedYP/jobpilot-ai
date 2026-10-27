# JobPilot AI --- Requirements

**Version:** 1.0\
**Status:** Draft\
**Platform:** Ubuntu

## 1. Purpose

List the software and tools required to build and run JobPilot AI.

## 2. Technology requirements

  Area                 Technology
  -------------------- ------------------------------------------
  Operating system     Ubuntu
  Frontend             React + JavaScript
  Frontend tooling     Vite
  Styling              Tailwind CSS
  Backend              Python + FastAPI
  Agent workflow       LangGraph
  Database             PostgreSQL
  ORM and migrations   SQLAlchemy + Alembic
  Background tasks     Celery + Redis
  Local LLM            Ollama
  Browser automation   Playwright, only for permitted workflows
  Version control      Git + GitHub

## 3. Main functional requirements

The system must: - Accept and analyze a candidate CV. - Store confirmed
candidate details. - Search permitted job sources in India and
internationally. - Check eligibility and calculate job relevance. -
Prepare tailored CVs and application answers. - Submit applications only
when automation is permitted. - Verify and track application results. -
Allow the user to pause or stop agent runs.

## 4. Non-functional requirements

-   Protect candidate data and CV files.
-   Prevent duplicate applications.
-   Log important agent actions and errors.
-   Recover safely from interruptions.
-   Validate LLM output before using it.
-   Keep the interface simple and responsive.
-   Run locally on Ubuntu for the first release.

## 5. Development prerequisites

Install and configure: - Python and a virtual environment. - Node.js and
npm. - PostgreSQL. - Redis. - Ollama and a suitable local model. - Git.

Exact minimum versions and system resource requirements will be selected
before implementation.

------------------------------------------------------------------------

## Review

-   [ ] Technology stack is acceptable.
-   [ ] Ubuntu is the initial target platform.
-   [ ] Functional requirements match the MVP.

After approval, prepare `DEVELOPMENT_RULES.md`.
