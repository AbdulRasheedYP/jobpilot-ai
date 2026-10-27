# JobPilot AI --- Agent Design

**Version:** 1.0\
**Status:** Draft\
**Related documents:** `MVP.md`, `AGENT_WORKFLOW.md`

## 1. Design approach

JobPilot AI will use **one main orchestrator** to control the workflow.

It will call specialized Python services and tools when needed. Not
every component needs to be a separate AI agent.

This approach is simpler to build, test, and maintain.

## 2. Main architecture

``` text
User
  ↓
JobPilot Agent (LangGraph)
  ├── CV Analyzer
  ├── Job Search Tool
  ├── Job Matching Service
  ├── Resume Generator
  ├── Application Preparation
  ├── Auto-Apply Policy Check
  ├── Application Tool
  └── Submission Verification
  ↓
PostgreSQL
```

## 3. Main components

  -----------------------------------------------------------------------
  Component                           Responsibility
  ----------------------------------- -----------------------------------
  Orchestrator                        Controls the workflow and decides
                                      the next step.

  CV Analyzer                         Extracts candidate details from the
                                      CV.

  Job Search Tool                     Gets jobs from permitted sources.

  Matching Service                    Checks job suitability and
                                      calculates a score.

  Resume Generator                    Creates a job-specific CV using
                                      confirmed facts.

  Application Preparation             Prepares form answers from the
                                      candidate profile.

  Policy Check                        Decides whether automatic
                                      submission is permitted.

  Application Tool                    Submits the application through an
                                      approved method.

  Verification                        Checks and records the submission
                                      result.
  -----------------------------------------------------------------------

## 4. LLM and tools

**Use the LLM for:** - Understanding job descriptions. - Comparing
skills and responsibilities. - Extracting information for user
confirmation. - Tailoring CV wording. - Preparing draft answers.

**Use normal Python code for:** - Database operations. - Eligibility
rules. - Match-score calculations where rules are defined. - Duplicate
detection. - Application limits. - Permission checks. - Submission
status and retries.

The LLM must not bypass the policy checks.

## 5. Agent state

The orchestrator must keep track of: - Current workflow stage. -
Candidate profile and CV reference. - Jobs found and processed. - Match
results. - Prepared application materials. - Current application
status. - Errors and actions requiring the user.

Save important state in the database so the workflow can recover after a
restart.

## 6. Tools

A tool is a controlled function the agent can call to perform a specific
task.

Initial tools: - `analyze_cv` - `search_jobs` - `get_job_details` -
`check_eligibility` - `calculate_match` - `generate_tailored_resume` -
`prepare_application_answers` - `check_auto_apply_permission` -
`submit_application` - `verify_submission`

Validate tool inputs and outputs. Only expose actions that the current
workflow is allowed to perform.

## 7. Safety rules

-   Start with auto-apply disabled.
-   Submit only through permitted sources and methods.
-   Never invent candidate information.
-   Stop when CAPTCHA, MFA, or access restrictions appear.
-   Prevent duplicate submissions.
-   Verify uncertain submissions before retrying.
-   Allow the user to pause or stop the agent.

## 8. First implementation scope

For the first version, implement: 1. One orchestrator workflow. 2. One
CV analyzer. 3. One permitted job source. 4. One matching service. 5.
One resume generator. 6. One permitted application method. 7. Submission
verification.

Add more tools and sources only after this flow works reliably.

------------------------------------------------------------------------

## Review

-   [ ] One main orchestrator is the right approach.
-   [ ] Component responsibilities are clear.
-   [ ] LLM and Python responsibilities are separated.
-   [ ] Initial tool list is suitable.

After approval, prepare `DECISION_ENGINE.md`.
