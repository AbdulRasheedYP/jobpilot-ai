# JobPilot AI --- API Specification

**Version:** 1.0\
**Status:** Draft\
**Base URL:** `/api/v1`

## 1. Purpose

Define how the React frontend communicates with the FastAPI backend.

## 2. Main endpoints

  Method   Endpoint                    Purpose
  -------- --------------------------- ---------------------------
  `GET`    `/profile`                  Get candidate profile.
  `PUT`    `/profile`                  Create or update profile.
  `POST`   `/resumes`                  Upload a CV.
  `GET`    `/resumes`                  List uploaded CVs.
  `GET`    `/preferences`              Get job preferences.
  `PUT`    `/preferences`              Update job preferences.
  `POST`   `/agent/runs`               Start a job-search run.
  `GET`    `/agent/runs/{id}`          Get run status.
  `POST`   `/agent/runs/{id}/pause`    Pause a run.
  `POST`   `/agent/runs/{id}/resume`   Resume a run.
  `POST`   `/agent/runs/{id}/stop`     Stop a run.
  `GET`    `/jobs`                     List discovered jobs.
  `GET`    `/jobs/{id}`                Get job details.
  `GET`    `/matches`                  List matched jobs.
  `GET`    `/applications`             List applications.
  `GET`    `/applications/{id}`        Get application details.

## 3. API rules

-   Use JSON for normal requests and responses.
-   Use multipart form data for CV uploads.
-   Validate request data with Pydantic.
-   Use consistent HTTP status codes.
-   Add pagination to list endpoints.
-   Protect private endpoints with authentication.
-   Check ownership before returning or changing a record.
-   Never expose secrets or private CV file paths in API responses.

## 4. Example response

``` json
{
  "id": "application-id",
  "status": "APPLIED_CONFIRMED",
  "job_title": "Junior Python Developer",
  "company": "Example Company"
}
```

This is an illustrative response only. The final response schema will be
defined during implementation.

## 5. Error response

Use a consistent format:

``` json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Required information is missing"
  }
}
```

## 6. API documentation

Use FastAPI's generated OpenAPI documentation during development. Keep
endpoint behaviour and schemas consistent with the database and agent
workflow.

------------------------------------------------------------------------

## Review

-   [ ] Main endpoints cover the MVP.
-   [ ] Authentication and ownership checks are included.
-   [ ] Request and error formats are clear.

After approval, prepare `REQUIREMENTS.md`.
