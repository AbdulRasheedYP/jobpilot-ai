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
| **Frontend** | React (JavaScript) + Vite + Tailwind CSS | Responsive web dashboard accessible from desktop or mobile |
| **Backend API** | FastAPI + Pydantic v2 | Asynchronous REST API with strict request/response validation |
| **Security / Auth** | JWT (HS256) + Passlib (Bcrypt) | Single-user authentication protecting the hosted dashboard |
| **Agent Orchestration** | LangGraph | Deterministic state machine coordinating multi-step workflows |
| **Database & ORM** | PostgreSQL 16 + SQLAlchemy 2.0 | Transactional persistence, relational data integrity, UUIDs |
| **Migrations** | Alembic | Tracked, reproducible database schema versions |
| **Background Tasks** | Celery + Redis | 24/7 background job discovery, matching, and scheduled runs |
| **LLM Provider Layer** | Groq API / OpenAI / Ollama | Pluggable LLM interface (Groq recommended for cloud VPS without GPU) |
| **Automation** | Playwright (Headless) | Controlled form filling on permitted platforms & mock career portal |

---

## 4. Cloud VPS & Production Deployment Architecture

JobPilot AI is architected for **24/7 Cloud Hosting** on any Ubuntu VPS (DigitalOcean, Hetzner, AWS, Linode) or dedicated server:

```text
       Internet / User Browser (Mobile or Desktop)
                         │ HTTPS / Domain
                         ▼
             ┌───────────────────────┐
             │   Nginx Reverse Proxy │ (SSL Termination via Let's Encrypt)
             └───────────┬───────────┘
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
┌───────────────┐                 ┌───────────────┐
│ React Web App │ (Port 3000/80)  │ FastAPI API   │ (Port 8000)
│ (Static/Vite) │                 │ + JWT Auth    │
└───────────────┘                 └───────┬───────┘
                                          │
        ┌─────────────────────────────────┼──────────────────────────────┐
        ▼                                 ▼                              ▼
┌───────────────┐                 ┌───────────────┐              ┌───────────────┐
│ PostgreSQL 16 │                 │ Redis 7 Queue │              │ Cloud LLM API │
│ (Persistent)  │                 │ + Celery 24/7 │              │ (Groq/OpenAI) │
└───────────────┘                 └───────────────┘              └───────────────┘
```

### 4.1 Deployment Specifications:
1. **Containerized via Docker Compose:**
   - Single command deployment: `docker compose up -d`.
   - Manages frontend, backend API, celery worker, PostgreSQL, and Redis containers.
2. **Cloud Resource Efficiency:**
   - Designed to run smoothly on an affordable **2 GB / 4 GB RAM Cloud VPS** by delegating heavy LLM inference to **Groq API** (or OpenAI/Claude) instead of requiring expensive GPU cloud servers.
   - For users with high-memory or GPU VPS, self-hosted **Ollama** remains fully supported.
3. **24/7 Background Autonomy:**
   - Celery beat schedule and workers keep discovering jobs, scoring suitability, and tracking statuses continuously even when the user's laptop is powered off.
