# JobPilot AI --- Security Rules

**Version:** 1.0\
**Status:** Draft

## 1. Data protection

-   Keep CVs and candidate information private.
-   Store uploaded files in a private local directory.
-   Do not expose private file paths through the API.
-   Do not log full CV contents or sensitive application answers.
-   Restrict access to the user's own data.

## 2. Credentials

-   Store secrets in environment variables.
-   Keep `.env` out of Git.
-   Never store passwords or API keys as plain text.
-   Use secure authentication and password hashing.
-   Do not save job-site passwords unless absolutely necessary and
    explicitly approved.

## 3. Agent safety

-   Keep auto-apply disabled by default.
-   Allow only configured and permitted job sources.
-   Validate all application answers before submission.
-   Never invent candidate information.
-   Prevent duplicate applications.
-   Verify submission before marking it successful.
-   Allow the user to pause or stop the agent.

## 4. Platform restrictions

-   Do not bypass CAPTCHA, MFA, rate limits or access controls.
-   Stop when a platform blocks automation or requires human
    verification.
-   Use only permitted APIs and application methods.
-   Provide a manual application link when automation is unavailable.

## 5. Backup and recovery

-   Back up the PostgreSQL database.
-   Back up original and tailored CV files.
-   Protect backup files from unauthorized access.
-   Test that backups can be restored.

## 6. Security testing

Before enabling live auto-apply, test: - Authentication and data
ownership. - File upload validation. - API access permissions. - Secret
handling. - Duplicate prevention. - Safe pause, stop and recovery
behaviour.

------------------------------------------------------------------------

## Review

-   [ ] Candidate data protection is sufficient.
-   [ ] Credentials are handled safely.
-   [ ] Agent and platform restrictions are clear.

After approval, prepare `TASKS.md`.
