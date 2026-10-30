# JobPilot AI --- Concrete Database Specification

**Version:** 1.1  
**Status:** Approved  
**Database:** PostgreSQL 15+ / 16  
**ORM & Migrations:** SQLAlchemy 2.0 (Declarative Base) + Alembic  
**Related Documents:** [ARCHITECTURE.md](file:///home/rasheed/Documents/jobpilot-ai/docs/ARCHITECTURE.md), [MVP.md](file:///home/rasheed/Documents/jobpilot-ai/docs/MVP.md), [API_SPECIFICATION.md](file:///home/rasheed/Documents/jobpilot-ai/docs/API_SPECIFICATION.md)

---

## 1. Overview & Database Standards

1. **Primary Keys:** Standard RFC 4122 UUID v4 (`UUID(as_uuid=True)` in SQLAlchemy, `gen_random_uuid()` in PostgreSQL).
2. **Timestamps:** All tables include timezone-aware `created_at` (`TIMESTAMP WITH TIME ZONE`, default `now()`). Modifiable entities include `updated_at` (with auto-update triggers).
3. **Foreign Keys:** Enforce referential integrity with explicit `ON DELETE CASCADE` or `ON DELETE SET NULL` constraints.
4. **JSONB Columns:** Use PostgreSQL `JSONB` for flexible structured objects (e.g., skills list, score breakdown, extracted CV facts).
5. **No Passwords/Secrets:** Private CV files are stored in the filesystem (`storage/resumes/`); database stores only local paths and hashes.

---

## 2. Enumerated Types (Enums)

### `ApplicationStatus`
```sql
CREATE TYPE application_status AS ENUM (
    'NOT_STARTED',
    'PREPARING',
    'NEEDS_USER_INPUT',
    'READY',
    'AUTO_APPLY_QUEUED',
    'SUBMITTING',
    'APPLIED_CONFIRMED',
    'SUBMISSION_UNCONFIRMED',
    'MANUAL_ACTION_REQUIRED',
    'FAILED_RETRYABLE',
    'FAILED_FINAL',
    'WITHDRAWN'
);
```

### `AgentRunStatus`
```sql
CREATE TYPE agent_run_status AS ENUM (
    'RUNNING',
    'PAUSED',
    'STOPPED',
    'COMPLETED',
    'FAILED'
);
```

---

## 3. Schema Definitions

### 3.1 `user_profiles`
Stores verified candidate profile data.
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    current_location VARCHAR(255),
    preferred_locations JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    experience JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    work_authorization JSONB DEFAULT '{}'::jsonb,   -- e.g. {"IN": "citizen", "US": "needs_sponsorship"}
    sponsorship_required BOOLEAN DEFAULT FALSE,
    notice_period_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 3.2 `resumes`
Stores original and tailored CV file references.
```sql
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    file_path VARCHAR(512) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,                -- 'pdf' or 'docx'
    is_original BOOLEAN DEFAULT TRUE NOT NULL,
    target_job_id UUID,                            -- References jobs(id) if tailored
    parsed_facts JSONB DEFAULT '{}'::jsonb,        -- Structured facts extracted from CV
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 3.3 `job_preferences`
Candidate job search criteria and safety thresholds.
```sql
CREATE TABLE job_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID UNIQUE NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    target_roles JSONB DEFAULT '["Python Developer", "Backend Developer"]'::jsonb NOT NULL,
    target_countries JSONB DEFAULT '["India", "Remote"]'::jsonb NOT NULL,
    work_modes JSONB DEFAULT '["remote", "hybrid", "onsite"]'::jsonb NOT NULL,
    experience_levels JSONB DEFAULT '["fresher", "junior", "trainee"]'::jsonb NOT NULL,
    min_salary INTEGER,
    max_salary INTEGER,
    currency VARCHAR(10) DEFAULT 'INR',
    min_match_score INTEGER DEFAULT 65 NOT NULL,
    auto_apply_enabled BOOLEAN DEFAULT FALSE NOT NULL,
    daily_application_limit INTEGER DEFAULT 5 NOT NULL,
    weekly_application_limit INTEGER DEFAULT 25 NOT NULL,
    excluded_companies JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 3.4 `job_sources`
Job boards and API feeds configuration.
```sql
CREATE TABLE job_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,              -- e.g. 'arbeitnow', 'adzuna', 'mock_portal'
    adapter_class VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
    permits_auto_apply BOOLEAN DEFAULT FALSE NOT NULL,
    rate_limit_per_minute INTEGER DEFAULT 30,
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 3.5 `companies`
Company / employer records.
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    logo_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX uq_companies_name ON companies(lower(name));
```

### 3.6 `jobs`
Normalized job listings collected from permitted sources.
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES job_sources(id) ON DELETE RESTRICT,
    external_id VARCHAR(255) NOT NULL,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    company_name VARCHAR(255) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    raw_payload JSONB DEFAULT '{}'::jsonb,
    location VARCHAR(255) NOT NULL,
    is_remote BOOLEAN DEFAULT FALSE NOT NULL,
    employment_type VARCHAR(50),                   -- 'full_time', 'internship', 'contract'
    experience_level VARCHAR(50),
    salary_min INTEGER,
    salary_max INTEGER,
    currency VARCHAR(10),
    skills_required JSONB DEFAULT '[]'::jsonb,
    application_url TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    posted_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX uq_jobs_source_external ON jobs(source_id, external_id);
CREATE UNIQUE INDEX uq_jobs_canonical_url ON jobs(canonical_url);
CREATE INDEX idx_jobs_search ON jobs(lower(title), is_remote, is_active);
```

### 3.7 `job_matches`
Deterministic eligibility check and weighted match score output.
```sql
CREATE TABLE job_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    eligibility_passed BOOLEAN NOT NULL,
    eligibility_details JSONB NOT NULL,            -- Detailed results of each hard check
    overall_score FLOAT NOT NULL,                  -- Weighted score (0.0 to 100.0)
    score_breakdown JSONB NOT NULL,                -- Skills 35%, Role 25%, Exp 20%, etc.
    matched_skills JSONB DEFAULT '[]'::jsonb,
    missing_skills JSONB DEFAULT '[]'::jsonb,
    decision_reasons JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX uq_matches_job_user ON job_matches(job_id, user_profile_id);
CREATE INDEX idx_matches_score ON job_matches(overall_score DESC);
```

### 3.8 `applications`
Application tracking and submission execution state.
```sql
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE RESTRICT,
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    tailored_resume_id UUID REFERENCES resumes(id) ON DELETE SET NULL,
    status application_status DEFAULT 'NOT_STARTED' NOT NULL,
    submission_method VARCHAR(50),                 -- 'playwright_mock', 'playwright_direct', 'manual'
    submitted_at TIMESTAMP WITH TIME ZONE,
    confirmation_evidence JSONB,                   -- {"type": "screenshot", "path": "...", "receipt_id": "..."}
    error_message TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX uq_applications_job_user ON applications(job_id, user_profile_id);
CREATE INDEX idx_applications_status ON applications(status);
```

### 3.9 `application_answers`
Answers prepared for form questions.
```sql
CREATE TABLE application_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    field_type VARCHAR(50) DEFAULT 'text',         -- 'text', 'select', 'radio', 'checkbox'
    source_profile_field VARCHAR(100),             -- e.g. 'skills.python', 'work_authorization.IN'
    is_verified BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
```

### 3.10 `agent_runs`
Workflow execution sessions.
```sql
CREATE TABLE agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    status agent_run_status DEFAULT 'RUNNING' NOT NULL,
    jobs_discovered INTEGER DEFAULT 0 NOT NULL,
    jobs_matched INTEGER DEFAULT 0 NOT NULL,
    applications_prepared INTEGER DEFAULT 0 NOT NULL,
    applications_submitted INTEGER DEFAULT 0 NOT NULL,
    error_summary TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE
);
```

### 3.11 `agent_events`
Audit trail of important agent steps and decisions.
```sql
CREATE TABLE agent_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_run_id UUID NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL,                    -- 'discovery', 'eligibility', 'matching', etc.
    event_type VARCHAR(100) NOT NULL,              -- 'JOB_MATCHED', 'SUBMISSION_CONFIRMED', etc.
    message TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);
CREATE INDEX idx_agent_events_run ON agent_events(agent_run_id, timestamp);
```
