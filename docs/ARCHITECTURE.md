# JobPilot AI --- System Architecture & Design

**Version:** 1.1  
**Status:** Approved  
**Related Documents:** [MVP.md](file:///home/rasheed/Documents/jobpilot-ai/docs/MVP.md), [AGENT_WORKFLOW.md](file:///home/rasheed/Documents/jobpilot-ai/docs/AGENT_WORKFLOW.md), [DECISION_ENGINE.md](file:///home/rasheed/Documents/jobpilot-ai/docs/DECISION_ENGINE.md), [DATABASE.md](file:///home/rasheed/Documents/jobpilot-ai/docs/DATABASE.md), [API_SPECIFICATION.md](file:///home/rasheed/Documents/jobpilot-ai/docs/API_SPECIFICATION.md)

---

## 1. Architecture Overview

JobPilot AI is architected as a **modular monolith** with clean separation between the user interface, API services, deterministic business engines, and agent orchestration.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                       React Frontend (Vite + Tailwind)                  │
│   [Dashboard]  [Profile / CV Review]  [Jobs & Matches]  [Agent Controls]│
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTP / REST API (JSON)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        FastAPI Backend Server                           │
│  ┌───────────────────────┐  ┌────────────────────────────────────────┐  │
│  │   API Routers         │  │    Pydantic Request/Response Schemas    │  │
│  │  (/profile, /jobs,    │  └──────────────────┬─────────────────────┘  │
│  │   /agent, /matches)   │                     │ Validates              │
│  └───────────┬───────────┘  ┌──────────────────▼─────────────────────┐  │
│              │ Calls        │   Deterministic Python Services        │  │
│              ▼              │  - CV Fact Validator & Storage         │  │
│  ┌───────────────────────┐  │  - Hard Eligibility Checker            │  │
│  │ LangGraph Orchestrator│  │  - Match Scoring Engine (DECISION_ENG) │  │
│  │ (State Machine, Steps)│  │  - Auto-Apply Policy Gate              │  │
│  └───────────┬───────────┘  └──────────────────┬─────────────────────┘  │
│              │ Invokes                         │                        │
│              ▼                                 │                        │
│  ┌───────────────────────┐  ┌──────────────────▼─────────────────────┐  │
│  │ LLM Generation Layer  │  │ External Integration Adapters          │  │
│  │ (Ollama: Llama/Mistral│  │  - JobSourceAdapter (Arbeitnow/Adzuna) │  │
│  │  parsing & tailoring) │  │  - ApplicationAdapter (Playwright /    │  │
│  └───────────────────────┘  │    Local Mock Career Portal)           │  │
│                             └────────────────────────────────────────┘  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ SQLAlchemy ORM
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                 Data Persistence & Background Infrastructure            │
│  ┌────────────────────────────────────┐ ┌────────────────────────────┐  │
│  │ PostgreSQL 16 (Relational Storage) │ │ Redis 7 + Celery Workers   │  │
│  │ (Profiles, Resumes, Jobs, Matches, │ │ (Async Discovery & Queue)  │  │
│  │  Applications, Agent Audit Events) │ │                            │  │
│  └────────────────────────────────────┘ └────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

The project is structured into clean top-level directories:

```text
jobpilot-ai/
├── README.md
├── .gitignore
├── .env.example
├── docker-compose.yml              # Portable setup for PostgreSQL & Redis
├── docs/                           # Architecture and design specs
│   ├── MVP.md
│   ├── ARCHITECTURE.md
│   ├── TASKS.md
│   ├── AGENT_WORKFLOW.md
│   ├── AGENT_DESIGN.md
│   ├── DECISION_ENGINE.md
│   ├── DATABASE.md
│   ├── API_SPECIFICATION.md
│   ├── REQUIREMENTS.md
│   ├── DEVELOPMENT_RULES.md
│   └── SECURITY.md
│
├── backend/                        # FastAPI Backend & Agent Service
│   ├── alembic/                    # Database migrations
│   │   ├── versions/
│   │   └── env.py
│   ├── alembic.ini
│   ├── requirements.txt            # Python dependencies
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application entrypoint
│   │   │
│   │   ├── core/                   # Core configurations
│   │   │   ├── config.py           # Settings (Pydantic BaseSettings, env vars)
│   │   │   ├── database.py         # SQLAlchemy engine & session factory
│   │   │   └── logging.py          # Structured logging configuration
│   │   │
│   │   ├── models/                 # SQLAlchemy DB Models (PostgreSQL)
│   │   │   ├── user_profile.py
│   │   │   ├── resume.py
│   │   │   ├── job_preference.py
│   │   │   ├── job.py
│   │   │   ├── job_match.py
│   │   │   ├── application.py
│   │   │   └── agent_event.py
│   │   │
│   │   ├── schemas/                # Pydantic Schemas (API validation)
│   │   │   ├── profile.py
│   │   │   ├── resume.py
│   │   │   ├── preferences.py
│   │   │   ├── job.py
│   │   │   ├── match.py
│   │   │   ├── application.py
│   │   │   └── agent.py
│   │   │
│   │   ├── api/                    # API Endpoints (FastAPI Routers)
│   │   │   ├── v1/
│   │   │   │   ├── api.py          # Root v1 router
│   │   │   │   ├── endpoints/
│   │   │   │   │   ├── profile.py
│   │   │   │   │   ├── resumes.py
│   │   │   │   │   ├── preferences.py
│   │   │   │   │   ├── jobs.py
│   │   │   │   │   ├── matches.py
│   │   │   │   │   ├── applications.py
│   │   │   │   │   └── agent.py
│   │   │
│   │   ├── services/               # Deterministic Business Logic
│   │   │   ├── cv_parser.py        # PDF/DOCX extraction & verification
│   │   │   ├── deduplication.py    # Canonical URL & job hashing
│   │   │   ├── eligibility.py      # Hard rules (role, experience, auth)
│   │   │   ├── matching_engine.py  # Score weights as per DECISION_ENGINE.md
│   │   │   ├── resume_tailor.py    # Job-specific CV drafting (no hallucinations)
│   │   │   ├── answer_builder.py   # Application form responses from facts
│   │   │   └── policy_gate.py      # Auto-apply safety checks
│   │   │
│   │   ├── adapters/               # External System Adapters
│   │   │   ├── base.py             # Base adapter interfaces
│   │   │   ├── sources/            # Job source integrations
│   │   │   │   ├── arbeitnow.py    # Arbeitnow JSON API adapter
│   │   │   │   └── adzuna.py       # Adzuna job feed adapter
│   │   │   └── automation/         # Browser/submission integrations
│   │   │       ├── playwright_executor.py
│   │   │       └── mock_portal.py  # Local dummy career portal for safe tests
│   │   │
│   │   ├── agent/                  # LangGraph Workflow Orchestration
│   │   │   ├── state.py            # AgentState definition (typed dict)
│   │   │   ├── nodes.py            # Graph step execution nodes
│   │   │   ├── tools.py            # Controlled tool functions
│   │   │   └── graph.py            # LangGraph workflow definition & compile
│   │   │
│   │   └── workers/                # Background Tasks (Celery / Async)
│   │       ├── celery_app.py
│   │       └── tasks.py
│   │
│   └── tests/                      # Automated Test Suite (pytest)
│       ├── conftest.py
│       ├── test_eligibility.py
│       ├── test_matching.py
│       ├── test_deduplication.py
│       └── test_policy_gate.py
│
└── frontend/                       # React (Vite + Tailwind CSS)
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/                    # API client layer (Axios / Fetch)
        │   ├── client.js
        │   ├── profileApi.js
        │   ├── jobsApi.js
        │   ├── matchesApi.js
        │   └── agentApi.js
        ├── components/             # Reusable UI components
        │   ├── layout/
        │   │   ├── Navbar.jsx
        │   │   └── Sidebar.jsx
        │   ├── common/
        │   │   ├── Button.jsx
        │   │   ├── Card.jsx
        │   │   ├── Modal.jsx
        │   │   └── StatusBadge.jsx
        │   └── agent/
        │       ├── RunControls.jsx
        │       └── LiveEventLog.jsx
        └── pages/                  # Top-level route pages
            ├── Dashboard.jsx
            ├── Profile.jsx         # Candidate profile & CV upload/review
            ├── Preferences.jsx     # Job search parameters & limits
            ├── Jobs.jsx            # Discovered jobs listing
            ├── Matches.jsx         # Scored matches & reason breakdown
            └── Applications.jsx    # Application tracker & manual handoffs
```

---

## 3. Technology Stack Breakdown

| Layer | Technology | Primary Role |
| :--- | :--- | :--- |
| **Frontend** | React (JavaScript) + Vite + Tailwind CSS | Fast, reactive, responsive single-user dashboard |
| **Backend API** | FastAPI + Pydantic v2 | High-performance asynchronous REST API with strict validation |
| **Agent Orchestration** | LangGraph | Deterministic state machine coordinating multi-step workflows |
| **Database & ORM** | PostgreSQL 16 + SQLAlchemy 2.0 | Transactional persistence, relational data integrity, UUIDs |
| **Migrations** | Alembic | Tracked, reproducible database schema versions |
| **Background Tasks** | Celery + Redis | Asynchronous long-running jobs (discovery, batch processing) |
| **Local LLM** | Ollama (`llama3.2:3b` / `mistral:7b`) | Privacy-preserving text parsing, analysis & resume tailoring |
| **Automation** | Playwright | Controlled form filling on permitted platforms & mock portal |

---

## 4. Deployment Modes

JobPilot AI supports two flexible local deployment modes:

### Mode A: Native Ubuntu Services (Recommended when native services are present)
- Uses natively running PostgreSQL (`systemctl status postgresql`) and Redis (`systemctl status redis-server`).
- FastAPI and Vite run in user space (Python virtual environment `.venv` + Node `npm run dev`).
- Lowest resource overhead on local Ubuntu machines.

### Mode B: Docker Compose (Portable / Containerized)
- `docker-compose.yml` spins up PostgreSQL and Redis with persistent volumes and healthchecks.
- Ensures identical environment replication across any machine with Docker installed.
