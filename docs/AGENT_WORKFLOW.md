# JobPilot AI --- Agent Workflow

**Version:** 1.0\
**Status:** Draft\
**Related document:** `MVP.md`

## 1. Goal

Define how JobPilot AI moves from a candidate's CV to a verified job
application.

## 2. Main workflow

``` text
CV + Candidate Profile
        ↓
Read and confirm candidate details
        ↓
Find jobs from permitted sources
        ↓
Clean and remove duplicate listings
        ↓
Check eligibility
        ↓
Calculate job match
        ↓
Prepare a tailored CV and answers
        ↓
Check auto-apply rules
        ↓
Submit through a permitted method
        ↓
Verify and track the result
```

## 3. Workflow stages

  -----------------------------------------------------------------------
  Stage                               What the system does
  ----------------------------------- -----------------------------------
  1\. Profile                         Read the CV and use user-confirmed
                                      details.

  2\. Job discovery                   Find jobs from configured,
                                      permitted sources.

  3\. Job processing                  Standardize job details and detect
                                      duplicates.

  4\. Eligibility                     Check role, experience, location,
                                      work mode and work-authorization
                                      requirements.

  5\. Matching                        Calculate a score and explain why
                                      the job matches.

  6\. Preparation                     Tailor the CV and prepare
                                      application answers using verified
                                      facts only.

  7\. Policy check                    Confirm that automatic submission
                                      is allowed and all required
                                      information is available.

  8\. Application                     Submit through a supported,
                                      permitted method.

  9\. Verification                    Confirm the result and update the
                                      application tracker.
  -----------------------------------------------------------------------

## 4. Main components

-   **Agent Orchestrator:** controls the workflow and passes work
    between stages.
-   **CV Analyzer:** extracts candidate information.
-   **Job Researcher:** collects job listings.
-   **Matching Engine:** checks eligibility and calculates relevance.
-   **Resume Generator:** prepares a job-specific CV.
-   **Application Executor:** fills and submits applications where
    permitted.
-   **Verification Service:** checks whether submission succeeded.
-   **Tracker:** stores job and application status.

These do not all need to be separate LLM agents. Use normal Python
services for predictable tasks and an LLM only where language
understanding or drafting is useful.

## 5. When can the agent auto-apply?

Automatic submission is allowed only when:

-   The user has enabled auto-apply.
-   The job source permits the chosen automation method.
-   The job passes eligibility and match requirements.
-   The application is not a duplicate.
-   All mandatory answers are supported by confirmed candidate
    information.
-   Application limits have not been reached.
-   No CAPTCHA, MFA, or other human-verification step blocks the
    process.

If a required answer is unknown, the source does not permit automation,
or a verification challenge appears, stop and ask the user to complete
that step. Do not bypass platform restrictions.

## 6. Important rules

-   Never invent candidate skills, experience, qualifications or
    achievements.
-   Never guess work authorization, sponsorship or legal answers.
-   Do not overwrite the original CV when creating a tailored version.
-   Do not submit the same application twice.
-   Do not mark an application as successful without reliable
    confirmation.
-   Check an uncertain submission before attempting a retry.
-   Allow the user to pause or stop the agent.

## 7. Application statuses

  -----------------------------------------------------------------------
  Status                              Meaning
  ----------------------------------- -----------------------------------
  `PREPARING`                         CV and answers are being prepared.

  `NEEDS_USER_INPUT`                  Required information is missing.

  `READY`                             Application is ready for the policy
                                      check.

  `SUBMITTING`                        Submission is in progress.

  `APPLIED_CONFIRMED`                 Reliable confirmation was received.

  `SUBMISSION_UNCONFIRMED`            Submission may have happened, but
                                      cannot be verified.

  `MANUAL_ACTION_REQUIRED`            User must complete the step.

  `FAILED`                            Submission failed.
  -----------------------------------------------------------------------

## 8. First version: build only one complete flow

Start small:

1.  One candidate profile and CV.
2.  One permitted job source.
3.  Job eligibility and matching.
4.  Tailored CV preparation.
5.  One permitted application method.
6.  Submission verification and tracking.

Test this complete flow before adding more job sources or countries.

------------------------------------------------------------------------

## Review

-   [ ] Workflow is clear.
-   [ ] Auto-apply rules are acceptable.
-   [ ] First version scope is realistic.

After approval, prepare `AGENT_DESIGN.md`.
