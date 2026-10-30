# JobPilot AI --- Concrete API Specification

**Version:** 1.1  
**Status:** Approved  
**Base URL:** `/api/v1`  
**Content-Type:** `application/json` (except `/resumes` which is `multipart/form-data`)  
**Related Documents:** [DATABASE.md](file:///home/rasheed/Documents/jobpilot-ai/docs/DATABASE.md), [ARCHITECTURE.md](file:///home/rasheed/Documents/jobpilot-ai/docs/ARCHITECTURE.md)

---

## 1. Global Response Standards

### 1.1 Success Response Wrapper
List endpoints follow standard pagination:
```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "size": 20
}
```

### 1.2 Error Response Format
All error responses return standardized JSON:
```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | POLICY_VIOLATION | INTERNAL_ERROR",
    "message": "Human readable explanation",
    "details": {}
  }
}
```

---

## 2. Endpoints Specification

### 2.1 Candidate Profile

#### `GET /api/v1/profile`
Retrieve candidate profile.
- **Response (200 OK):**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "full_name": "Jane Doe",
  "email": "jane@example.com",
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
- **Request Body (JSON):** Matches fields above.
- **Response (200 OK):** Updated profile object.

---

### 2.2 Resumes & CV Management

#### `POST /api/v1/resumes`
Upload a CV file (PDF or DOCX). Triggers background fact extraction.
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
    "extracted_skills": ["Python", "FastAPI"],
    "extracted_education": ["B.Tech Computer Science"]
  },
  "created_at": "2026-11-17T13:40:00Z"
}
```

#### `GET /api/v1/resumes`
List uploaded and tailored resumes.
- **Response (200 OK):** Array of resume metadata objects.

---

### 2.3 Job Preferences

#### `GET /api/v1/preferences`
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
- **Request Body (JSON):** Updated preferences.
- **Response (200 OK):** Updated preferences object.

---

### 2.4 Jobs & Matches

#### `GET /api/v1/jobs`
Query parameters: `page`, `size`, `is_remote`, `role`, `query`.
- **Response (200 OK):** Paginated jobs list.

#### `GET /api/v1/jobs/{id}`
- **Response (200 OK):** Full job record with description and source metadata.

#### `GET /api/v1/matches`
Query parameters: `page`, `size`, `min_score`, `eligibility_passed`.
- **Response (200 OK):**
```json
{
  "items": [
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
      "decision_reasons": ["Meets role criteria", "Strong Python match", "Remote friendly"],
      "created_at": "2026-11-17T13:40:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "size": 20
}
```

---

### 2.5 Applications Tracker

#### `GET /api/v1/applications`
Query parameters: `status`, `page`, `size`.
- **Response (200 OK):** Paginated application tracking items.

#### `GET /api/v1/applications/{id}`
- **Response (200 OK):**
```json
{
  "id": "31b14247-f4bf-42f4-a02b-a3fc6aa93167",
  "job_id": "8431e285-8857-4148-8df0-e325121b659c",
  "job_title": "Junior Python Developer",
  "company_name": "Tech Corp",
  "status": "APPLIED_CONFIRMED",
  "submission_method": "playwright_mock",
  "submitted_at": "2026-11-17T13:42:00Z",
  "confirmation_evidence": {
    "type": "receipt_text",
    "reference": "APP-2026-98124"
  },
  "prepared_answers": [
    {"question": "Years of Python experience?", "answer": "1 year"}
  ]
}
```

---

### 2.6 Agent Run Controls

#### `POST /api/v1/agent/runs`
Start a job search & match run.
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

#### `GET /api/v1/agent/runs/{id}`
Returns status, stage, counts, and live audit events.

#### `POST /api/v1/agent/runs/{id}/pause`
#### `POST /api/v1/agent/runs/{id}/resume`
#### `POST /api/v1/agent/runs/{id}/stop`
- **Response (200 OK):** Updated run state.
