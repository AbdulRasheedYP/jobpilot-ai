# JobPilot AI

**Personal AI Job Search & Application Agent**

JobPilot AI is an AI-powered personal agent that helps users find suitable software development jobs, analyze CVs, match job requirements, prepare tailored resumes, and automate job applications where permitted.

## Features

- CV Analysis
- Automatic Job Discovery
- AI-Based Job Matching
- Resume Tailoring
- Application Answer Preparation
- Automated Job Applications
- Application Tracking

## Tech Stack

- **Frontend:** React, JavaScript, Tailwind CSS
- **Backend:** Python, FastAPI
- **Agent Framework:** LangGraph
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Migrations:** Alembic
- **Background Tasks:** Celery, Redis
- **LLM:** Ollama
- **Automation:** Playwright

## Agent Workflow

1. Upload CV and analyze candidate information.
2. Discover suitable jobs.
3. Check eligibility and calculate match scores.
4. Generate tailored resumes.
5. Prepare application answers.
6. Validate application details.
7. Automatically submit where permitted.
8. Verify submissions and track applications.

## Project Structure

```text
jobpilot-ai/
├── README.md
├── .gitignore
└── docs/
    ├── MVP.md
    ├── AGENT_WORKFLOW.md
    ├── AGENT_DESIGN.md
    ├── DECISION_ENGINE.md
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── API_SPECIFICATION.md
    ├── REQUIREMENTS.md
    ├── DEVELOPMENT_RULES.md
    ├── SECURITY.md
    └── TASKS.md
```

## Project Scope

- Target market: India and International.
- Target roles: Suitable Software Development roles.
- Usage: Personal AI Agent.
- Platform: Ubuntu.

## Important Notes

- Auto-apply works only through permitted sources and methods.
- The agent will not bypass CAPTCHA, MFA, or platform restrictions.
- Candidate information must never be fabricated.
- Applications are marked successful only after reliable confirmation.

## Development Status

Planning and documentation completed. Implementation is yet to begin.

## Future Goal

Build a reliable autonomous AI agent that can independently discover suitable jobs, prepare applications, submit where permitted, and maintain application history.