# JobPilot AI --- Decision Engine

**Version:** 1.0\
**Status:** Draft\
**Related documents:** `MVP.md`, `AGENT_WORKFLOW.md`, `AGENT_DESIGN.md`

## 1. Purpose

The Decision Engine decides whether a job is suitable and whether it can
proceed to automatic application.

Use fixed backend rules for important decisions. The LLM can provide
analysis, but it cannot approve its own application submission.

## 2. Decision flow

``` text
New Job
   ↓
Eligibility Check
   ↓
Eligible?
   ├── No → Reject with reason
   └── Yes
         ↓
     Calculate Match Score
         ↓
     Meets Minimum Score?
         ├── No → Skip
         └── Yes
               ↓
         Prepare CV and Answers
               ↓
         Policy Check
               ↓
         Allowed?
          ├── No → User action required
          └── Yes → Submit and verify
```

## 3. Eligibility checks

Check these before calculating the match score:

-   Is the role within the user's target software-development roles?
-   Is the required experience suitable?
-   Is the location or work mode acceptable?
-   Are work authorization and sponsorship requirements compatible?
-   Is the job still active, if this can be verified?
-   Is the company or job excluded by user preferences?

Each check returns:

-   `PASS`
-   `FAIL`
-   `UNKNOWN`

A failed required check rejects the job. An unknown required check must
not be treated as a pass for automatic submission.

## 4. Initial match score

Use this as a starting model. The weights can be adjusted after testing.

  Factor                              Weight
  ------------------------------- ----------
  Skills match                           35%
  Role and responsibility match          25%
  Experience fit                         20%
  Education fit                          10%
  Location and work mode                 10%
  **Total**                         **100%**

Salary and sponsorship should be handled as eligibility or preference
checks when reliable data exists, not scored as a match when the
information is missing.

The score measures job relevance. It does not predict interview or
hiring success.

## 5. Match outcomes

Initial configurable thresholds:

-   **80--100:** Strong match.
-   **65--79:** Possible match; review or prepare according to settings.
-   **Below 65:** Do not prepare an automatic application.

These are starting values, not proven hiring benchmarks. Test them
against real job listings and adjust them.

## 6. Auto-apply approval rules

A job can be submitted automatically only if all checks pass:

1.  Auto-apply is enabled by the user.
2.  The source and submission method permit automation.
3.  Eligibility checks pass.
4.  The match score meets the configured threshold.
5.  The job has not already been applied to.
6.  All mandatory answers come from verified candidate facts.
7.  Application limits allow another submission.
8.  No CAPTCHA, MFA, or access restriction blocks the process.

If any condition fails, do not submit.

## 7. Decision results

  Result                      Action
  --------------------------- -----------------------------------------------
  `REJECTED`                  Job fails a required eligibility check.
  `LOW_MATCH`                 Score is below the configured threshold.
  `NEEDS_REVIEW`              Important information is unknown.
  `READY`                     Job and application materials pass checks.
  `BLOCKED`                   Automation is not permitted or is restricted.
  `APPROVED_FOR_SUBMISSION`   All policy checks pass.

## 8. Important rules

-   Never let the LLM make the final submission decision.
-   Never invent candidate facts to improve a score.
-   Keep the reason for every decision.
-   Do not treat missing job data as a positive match.
-   Recheck eligibility and permissions immediately before submission.

------------------------------------------------------------------------

## Review

-   [ ] Eligibility checks are suitable.
-   [ ] Match-score weights are reasonable starting values.
-   [ ] Auto-apply rules are clear.

After approval, prepare `ARCHITECTURE.md`.
