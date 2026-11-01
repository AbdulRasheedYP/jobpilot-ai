# JobPilot AI --- System & Environment Requirements

**Version:** 1.1  
**Status:** Approved  
**Platform:** Ubuntu Linux (22.04 LTS or newer recommended)  
**Related Documents:** [MVP.md](file:///home/rasheed/Documents/jobpilot-ai/docs/MVP.md), [ARCHITECTURE.md](file:///home/rasheed/Documents/jobpilot-ai/docs/ARCHITECTURE.md)

## 1. Purpose

Specifies exact technical prerequisites, software versions, and local hardware requirements to build and run JobPilot AI. For functional features and user requirements, refer directly to [MVP.md](file:///home/rasheed/Documents/jobpilot-ai/docs/MVP.md).

## 2. Technology & Version Matrix

| Component | Technology | Minimum / Recommended Version | Purpose |
| :--- | :--- | :--- | :--- |
| **OS** | Ubuntu Linux | 22.04+ LTS | Host environment |
| **Runtime (Backend)** | Python | 3.11+ | Backend services & LangGraph orchestration |
| **API Framework** | FastAPI | 0.110+ | REST API & validation |
| **Runtime (Frontend)**| Node.js | v20.x+ (LTS) | Frontend build & dev server |
| **Frontend Framework**| React + Vite | React 18+, Vite 5+ | UI dashboard (JavaScript only) |
| **Styling** | Tailwind CSS | 3.4+ | Utility-first CSS styling |
| **Database** | PostgreSQL | 15+ / 16 | Relational data persistence |
| **ORM & Migrations** | SQLAlchemy & Alembic | 2.0+ / 1.13+ | Schema management & migrations |
| **Task Queue** | Celery + Redis | Celery 5.3+, Redis 7+ | 24/7 background worker queue |
| **LLM Provider** | Groq API / OpenAI / Ollama | Latest / Llama-3.3-70b (Groq) | High-speed LLM text analysis & tailoring |
| **Browser Automation**| Playwright | 1.40+ | Controlled form interaction for permitted workflows |
| **Authentication** | JWT + Passlib (Bcrypt) | Python-jose / Passlib | Single-user dashboard security |
| **Version Control** | Git | 2.34+ | Source code versioning |

## 3. Hardware & Cloud VPS Guidelines

- **Standard Cloud VPS (Recommended with Groq API):**
  - **Specs:** 2 CPU cores, 2 GB - 4 GB RAM, 20 GB SSD.
  - **Cost:** ~$4 - $6 / month on providers like Hetzner, DigitalOcean, or Linode.
  - **Efficiency:** Offloads heavy neural inference to Groq API (extremely fast and has a free tier), keeping VPS resource usage very light.
- **High-Memory VPS (If running self-hosted Ollama on the server):**
  - **Specs:** 4+ CPU cores, 16 GB RAM (or GPU instance).

## 4. Ubuntu System Packages & Dependencies

Prerequisite packages to install on Ubuntu:
- `build-essential`, `python3-dev`, `python3-venv`
- `postgresql`, `postgresql-contrib`, `libpq-dev`
- `redis-server`
- `curl`, `git`
- Playwright system dependencies (`npx playwright install-deps` or `playwright install --with-deps`)

## 5. Architectural Alignment

Functional requirements, auto-apply guardrails, and acceptance criteria are maintained solely in [MVP.md](file:///home/rasheed/Documents/jobpilot-ai/docs/MVP.md). High-level system architecture and data flows are maintained in [ARCHITECTURE.md](file:///home/rasheed/Documents/jobpilot-ai/docs/ARCHITECTURE.md).
