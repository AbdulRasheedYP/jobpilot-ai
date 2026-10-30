# JobPilot AI --- Master Agent Guidelines & Instructions

> This document is automatically loaded by Antigravity on every turn. It enforces the project's core principles, architecture rules, and documentation alignment throughout development.

---

## 1. Core Operating Principles

1. **Always Consult the Documentation:**
   Before writing or modifying code in any feature area, refer to the corresponding authoritative spec in `docs/`:
   - High-level Scope & Boundaries: [`docs/MVP.md`](file:///home/rasheed/Documents/jobpilot-ai/docs/MVP.md)
   - Task Sequence & Roadmap: [`docs/TASKS.md`](file:///home/rasheed/Documents/jobpilot-ai/docs/TASKS.md)
   - Architecture & Directory Layout: [`docs/ARCHITECTURE.md`](file:///home/rasheed/Documents/jobpilot-ai/docs/ARCHITECTURE.md)
   - Decision Engine & Scoring Weights: [`docs/DECISION_ENGINE.md`](file:///home/rasheed/Documents/jobpilot-ai/docs/DECISION_ENGINE.md)
   - Database Schema & Relationships: [`docs/DATABASE.md`](file:///home/rasheed/Documents/jobpilot-ai/docs/DATABASE.md)
   - API Endpoints & Request/Response Contracts: [`docs/API_SPECIFICATION.md`](file:///home/rasheed/Documents/jobpilot-ai/docs/API_SPECIFICATION.md)
   - Development Rules & Coding Standards: [`docs/DEVELOPMENT_RULES.md`](file:///home/rasheed/Documents/jobpilot-ai/docs/DEVELOPMENT_RULES.md)

2. **Zero-Hallucination Policy:**
   - Never fabricate or embellish candidate skills, experience, degrees, projects, or metrics.
   - Extracted CV information must be explicitly confirmed by the user before being used in any application.
   - Unknown information (e.g. sponsorship, legal declarations) must remain strictly unknown.

3. **Strict Language & Framework Boundaries:**
   - **Frontend:** React + JavaScript only (`.jsx` / `.js`). **NEVER use TypeScript.**
   - **Backend:** Python 3.11+ with FastAPI, Pydantic v2, and SQLAlchemy 2.0.
   - **Agent:** LangGraph state machine with deterministic Python tools.

4. **Task-Driven Development (`docs/TASKS.md`):**
   - Strictly follow the phase and task order in `docs/TASKS.md`.
   - Complete and verify the current task before proceeding to the next.
   - Check off (`[x]`) completed items in `docs/TASKS.md` as progress is made.

5. **Ethical & Safe Automation:**
   - Auto-apply works **only** through permitted sources and methods.
   - Never attempt to bypass CAPTCHA, MFA, rate limits, or platform restrictions.
   - Mark an application as `APPLIED_CONFIRMED` only when verifiable confirmation exists. Otherwise use `SUBMISSION_UNCONFIRMED` or `MANUAL_ACTION_REQUIRED`.
