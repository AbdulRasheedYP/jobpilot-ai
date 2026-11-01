# JobPilot AI --- Concrete API Specification (Cloud-Hosted)

**Version:** 2.0  
**Status:** Approved  
**Base URL:** `/api/v1`  
**Security:** Bearer JWT Token (`Authorization: Bearer <token>`) on all endpoints except `/auth/login` and `/health`.  
**Content-Type:** `application/json` (except `/resumes` which is `multipart/form-data`)  
**Related Documents:** [DATABASE.md](file:///home/rasheed/Documents/jobpilot-ai/docs/DATABASE.md), [ARCHITECTURE.md](file:///home/rasheed/Documents/jobpilot-ai/docs/ARCHITECTURE.md)

---

## 1. Global Standards

### 1.1 Authentication & Security
- Cloud-hosted single-user authentication uses signed JWT tokens (HS256).
- Protected endpoints require header: `Authorization: Bearer <token>`.

### 1.2 Pagination Wrapper
```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "size": 20
}
```

### 1.3 Error Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR | UNAUTHORIZED | NOT_FOUND | POLICY_VIOLATION | INTERNAL_ERROR",
    "message": "Human readable message",
    "details": {}
  }
}
```

---

## 2. Complete Endpoints Map

### 2.1 System & Health

#### `GET /api/v1/health`
System liveness and readiness check (no auth required).
- **Response (200 OK):**
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "llm_provider": "groq",
  "llm_status": "ready"
}
```

---

### 2.2 Authentication

#### `POST /api/v1/auth/login`
Authenticate candidate/admin.
- **Request Body (JSON):**
```json
{
  "email": "candidate@example.com",
  "password": "your_secure_password"
}
```
- **Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

#### `GET /api/v1/auth/me`
Get current authenticated user info.
- **Response (200 OK):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "email": "candidate@example.com",
  "full_name": "Jane Doe"
}
```

---

### 2.3 Candidate Profile

#### `GET /api/v1/profile`
Retrieve candidate profile.
- **Response (200 OK):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "full_name": "Jane Doe",
  "email": "candidate@example.com",
  "phone": "+91 9876543210",
  "current_location": "Bangalore, India",
  "preferred_locations": ["Bangalore", "Remote"],
  "education": [
    {
      "institution": "XYZ University",
      "degree": "B.Tech Computer Science",
      "graduation_year": 2024
    }
  ],
  "skills": ["Python", "FastAPI", "React", "PostgreSQL", "Git"],
  "experience": [],
  "languages": ["English", "Malayalam"],
  "work_authorization": {
    "India": "Citizen",
    "US": "Needs Sponsorship"
  },
  "sponsorship_required": false,
  "notice_period_days": 0,
  "updated_at": "2026-11-17T13:40:00Z"
}
```

#### `PUT /api/v1/profile`
Create or update candidate profile.
- **Request Body (JSON):** Same schema as above.
- **Response (200 OK):** Updated profile.

---

### 2.4 Resumes & CV Management

#### `POST /api/v1/resumes`
Upload CV file (PDF or DOCX). Triggers background parsing.
- **Content-Type:** `multipart/form-data`
- **Form Fields:** `file` (Binary)
- **Response (201 Created):**
```json
{
  "id": "e0b98bc2-6320-42ef-a28d-1940a02fdb89",
  "file_name": "Jane_Doe_CV.pdf",
  "file_type": "pdf",
  "is_original": true,
  "version": 1,
  "parsed_facts": {
    "status": "pending_review",
    "extracted_skills": ["Python", "FastAPI", "PostgreSQL"],
    "extracted_education": ["B.Tech Computer Science"],
    "extracted_experience": []
  },
  "created_at": "2026-11-17T13:40:00Z"
}
```

#### `GET /api/v1/resumes`
List all uploaded and tailored resumes.
- **Response (200 OK):** Array of resume metadata.

#### `GET /api/v1/resumes/{id}`
Get specific resume details and parsed facts.
- **Response (200 OK):** Full resume details.

#### `PUT /api/v1/resumes/{id}/confirm`
**Critical Zero-Hallucination Gate:** User reviews and confirms extracted facts before agent uses them.
- **Request Body (JSON):**
```json
{
  "confirmed_skills": ["Python", "FastAPI", "PostgreSQL"],
  "confirmed_education": [{"institution": "XYZ University", "degree": "B.Tech CS", "graduation_year": 2024}],
  "confirmed_experience": []
}
```
- **Response (200 OK):**
```json
{
  "status": "confirmed",
  "profile_updated": true,
  "confirmed_at": "2026-11-17T13:50:00Z"
}
```

#### `DELETE /api/v1/resumes/{id}`
Delete a resume and its local storage file.
- **Response (204 No Content)**

---

### 2.5 Job Preferences

#### `GET /api/v1/preferences`
Retrieve search parameters and auto-apply limits.
- **Response (200 OK):**
```json
{
  "target_roles": ["Python Developer", "Backend Developer"],
  "target_countries": ["India", "Remote"],
  "work_modes": ["remote", "hybrid"],
  "experience_levels": ["fresher", "junior"],
  "min_salary": 600000,
  "max_salary": 1200000,
  "currency": "INR",
  "min_match_score": 65,
  "auto_apply_enabled": false,
  "daily_application_limit": 5,
  "weekly_application_limit": 25,
  "excluded_companies": ["Excluded Corp"]
}
```

#### `PUT /api/v1/preferences`
Update search parameters.
- **Request Body (JSON):** Matches fields above.
- **Response (200 OK):** Updated preferences.

---

### 2.6 Job Sources Management

#### `GET /api/v1/sources`
List configured job sources.
- **Response (200 OK):**
```json
{
  "sources": [
    {
      "id": "4a71d87f-...",
      "name": "Arbeitnow Official Feed",
      "code": "arbeitnow",
      "is_enabled": true,
      "permits_auto_apply": false,
      "rate_limit_per_minute": 30
    },
    {
      "id": "8b92e10a-...",
      "name": "Local Mock Career Portal (Testing)",
      "code": "mock_portal",
      "is_enabled": true,
      "permits_auto_apply": true,
      "rate_limit_per_minute": 60
    }
  ]
}
```

#### `PATCH /api/v1/sources/{id}`
Enable or disable a job source.
- **Request Body (JSON):**
```json
{
  "is_enabled": true,
  "permits_auto_apply": false
}
```
- **Response (200 OK):** Updated source record.

---

### 2.7 Jobs & Matches

#### `GET /api/v1/jobs`
List discovered jobs with pagination and filters.
- **Query Parameters:** `page`, `size`, `is_remote`, `role`, `query`, `source_id`.
- **Response (200 OK):** Paginated jobs list.

#### `GET /api/v1/jobs/{id}`
Full details of a specific job listing.
- **Response (200 OK):** Full job record.

#### `GET /api/v1/matches`
List scored matches.
- **Query Parameters:** `page`, `size`, `min_score`, `eligibility_passed`.
- **Response (200 OK):** Paginated list of scored matches.

#### `GET /api/v1/matches/{id}`
Deep dive into a specific match score and eligibility checks.
- **Response (200 OK):**
```json
{
  "id": "787c936b-6a1a-4d7a-8f92-ec588e734c56",
  "job": {
    "id": "8431e285-8857-4148-8df0-e325121b659c",
    "title": "Junior Python Developer",
    "company_name": "Tech Corp",
    "location": "Remote",
    "is_remote": true
  },
  "eligibility_passed": true,
  "eligibility_details": {
    "role_suitability": "PASS",
    "experience_suitability": "PASS",
    "work_mode": "PASS",
    "work_authorization": "PASS"
  },
  "overall_score": 85.5,
  "score_breakdown": {
    "skills_match": 32.0,
    "role_match": 22.5,
    "experience_fit": 18.0,
    "education_fit": 8.0,
    "location_fit": 10.0
  },
  "matched_skills": ["Python", "FastAPI", "PostgreSQL"],
  "missing_skills": ["Docker"],
  "decision_reasons": ["Meets role criteria", "Strong Python match", "Remote friendly"]
}
```

---

### 2.8 Applications & Answers

#### `GET /api/v1/applications`
List all tracked applications.
- **Query Parameters:** `status`, `page`, `size`.
- **Response (200 OK):** Paginated application items.

#### `GET /api/v1/applications/{id}`
Detailed view of application, status, evidence, and tailored resume.
- **Response (200 OK):** Full application entity.

#### `PATCH /api/v1/applications/{id}`
**Manual Status & Notes Update:** When candidate receives interview, offer, or rejection.
- **Request Body (JSON):**
```json
{
  "status": "APPLIED_CONFIRMED | WITHDRAWN",
  "notes": "First round technical interview scheduled for Monday 10 AM.",
  "confirmation_evidence": {"receipt_code": "TC-99124"}
}
```
- **Response (200 OK):** Updated application.

#### `GET /api/v1/applications/{id}/answers`
Get prepared form answers for an application.
- **Response (200 OK):**
```json
{
  "answers": [
    {
      "id": "f12e8412-...",
      "question": "How many years of experience do you have with Python?",
      "answer": "1 year",
      "field_type": "text",
      "is_verified": true
    }
  ]
}
```

#### `PUT /api/v1/applications/{id}/answers`
User edits or approves prepared answers before submission.
- **Request Body (JSON):**
```json
{
  "answers": [
    {
      "question": "How many years of experience do you have with Python?",
      "answer": "1.5 years"
    }
  ]
}
```
- **Response (200 OK):** Updated answers list.

#### `POST /api/v1/applications/{id}/retry`
Retry submission for a failed or unconfirmed application after verifying.
- **Response (202 Accepted):** Submission queued.

---

### 2.9 Agent Runs & Observability

#### `POST /api/v1/agent/runs`
Trigger an autonomous job discovery & matching cycle.
- **Request Body (JSON):**
```json
{
  "job_sources": ["arbeitnow"],
  "dry_run": false
}
```
- **Response (202 Accepted):**
```json
{
  "run_id": "42fbbca6-7783-4a1d-a3df-cf9e3c983570",
  "status": "RUNNING",
  "started_at": "2026-11-17T13:45:00Z"
}
```

#### `GET /api/v1/agent/runs`
List past agent execution runs.
- **Response (200 OK):** Paginated runs history.

#### `GET /api/v1/agent/runs/{id}`
Get real-time status and metrics of a run.
- **Response (200 OK):**
```json
{
  "id": "42fbbca6-7783-4a1d-a3df-cf9e3c983570",
  "status": "RUNNING",
  "jobs_discovered": 14,
  "jobs_matched": 3,
  "applications_prepared": 2,
  "applications_submitted": 1,
  "started_at": "2026-11-17T13:45:00Z",
  "finished_at": null
}
```

#### `GET /api/v1/agent/runs/{id}/events`
Fetch live audit event logs for the dashboard.
- **Response (200 OK):**
```json
{
  "events": [
    {
      "timestamp": "2026-11-17T13:45:02Z",
      "stage": "discovery",
      "event_type": "FETCH_COMPLETED",
      "message": "Discovered 14 jobs from Arbeitnow"
    },
    {
      "timestamp": "2026-11-17T13:45:10Z",
      "stage": "matching",
      "event_type": "JOB_MATCHED",
      "message": "Matched job: Junior Python Developer (Score: 85.5)"
    }
  ]
}
```

#### `POST /api/v1/agent/runs/{id}/pause`
#### `POST /api/v1/agent/runs/{id}/resume`
#### `POST /api/v1/agent/runs/{id}/stop`
State transitions for running workflows.
- **Response (200 OK):** Updated run status.
