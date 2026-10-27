# JobPilot AI --- Database Design

**Version:** 1.0\
**Status:** Draft\
**Database:** PostgreSQL\
**ORM:** SQLAlchemy

## 1. Purpose

Store candidate information, CVs, job listings, match results,
applications, and agent activity.

## 2. Main tables

  -----------------------------------------------------------------------
  Table                               Purpose
  ----------------------------------- -----------------------------------
  `user_profiles`                     Candidate details and verified
                                      profile information.

  `resumes`                           Original and tailored CV file
                                      references.

  `job_preferences`                   Roles, countries, salary, work mode
                                      and application limits.

  `job_sources`                       Configured job sources and their
                                      permissions/settings.

  `companies`                         Employer information.

  `jobs`                              Normalized job listings.

  `job_matches`                       Eligibility results, match scores
                                      and reasons.

  `applications`                      Application status and submission
                                      details.

  `application_answers`               Prepared answers linked to an
                                      application.

  `agent_runs`                        Each job-search workflow run.

  `agent_events`                      Important actions, errors and
                                      status changes.
  -----------------------------------------------------------------------

## 3. Main relationships

``` text
User Profile
 ├── Resumes
 ├── Job Preferences
 ├── Agent Runs
 └── Applications

Company
 └── Jobs
      └── Job Matches
           └── Applications
                ├── Application Answers
                └── Resume Version

Agent Run
 └── Agent Events
```

All user-owned records must be linked to the candidate profile or user
account.

## 4. Important fields

-   **`user_profiles`:** name, email, phone, location, education,
    skills, experience and work authorization details.
-   **`resumes`:** file path, file type, original/tailored type, version
    and related job.
-   **`job_preferences`:** target roles, countries, work mode,
    experience range, salary preferences, minimum match score and
    auto-apply settings.
-   **`job_sources`:** source name, access method, enabled state and
    auto-apply permission.
-   **`jobs`:** title, company, location, description, requirements,
    source ID, URL and posted date.
-   **`job_matches`:** eligibility result, score, matched skills and
    decision reasons.
-   **`applications`:** job, status, tailored resume, submission time
    and confirmation evidence.
-   **`application_answers`:** question, answer, source profile field
    and verification state.
-   **`agent_runs`:** status, start/end time and run summary.
-   **`agent_events`:** run, event type, timestamp, outcome and reason.

## 5. Database rules

1.  Use UUID primary keys.
2.  Add `created_at` and `updated_at` timestamps where appropriate.
3.  Use foreign keys to maintain relationships.
4.  Add unique constraints for source job IDs and application
    deduplication.
5.  Index frequently searched fields such as job title, company, status
    and country.
6.  Store CV files outside the database; save only their private file
    references.
7.  Never store passwords or API secrets as plain text.
8.  Use Alembic for all schema changes.

## 6. Important note

This is the initial logical design, not the final SQL schema. Exact
column types, constraints and indexes will be finalized during
implementation.

------------------------------------------------------------------------

## Review

-   [ ] Main tables cover the MVP.
-   [ ] Relationships are clear.
-   [ ] Database rules are acceptable.

After approval, prepare `API_SPECIFICATION.md`.
