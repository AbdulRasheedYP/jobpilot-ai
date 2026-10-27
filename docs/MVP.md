# JobPilot AI --- MVP Definition

**Document:** MVP.md\
**Version:** 1.0\
**Status:** Draft for review\
**Product type:** Personal-use, local-first autonomous job application
agent

------------------------------------------------------------------------

## 1. Product summary

JobPilot AI is a personal AI-assisted job-search and application system.
It uses the candidate's CV, verified profile information, and job
preferences to discover suitable software-development vacancies in India
and internationally, assess eligibility and relevance, prepare
application materials, and submit applications automatically where the
source and application process explicitly permit automation.

The system is designed for one candidate and personal use. It is not a
public job board, recruitment marketplace, multi-tenant SaaS product, or
service for applying on behalf of other people.

**Primary outcome:** reduce repetitive job-search and application work
while keeping applications accurate, traceable, and within the rules of
each job platform or employer.

## 2. Problem statement

Manually searching across multiple job sources, checking whether roles
are suitable, adapting a CV, completing repeated application forms, and
tracking submissions is time-consuming. A generic AI assistant may also
invent candidate details or claim an application was submitted when it
was not.

JobPilot AI addresses this by combining: - structured candidate
information extracted from a CV and confirmed by the user; - job
discovery through permitted sources; - deterministic eligibility checks
and explainable matching; - evidence-based resume and answer
preparation; - controlled application execution; - submission
verification and an application history.

## 3. Target user and operating scope

### 3.1 Target user

One individual candidate using the application locally on their own
Ubuntu computer.

### 3.2 Geography

-   India.
-   International opportunities.

International jobs must be assessed against the candidate's known work
authorization, sponsorship needs, location restrictions, relocation
preferences, and other stated constraints. A role must not be treated as
eligible merely because it accepts online applications.

### 3.3 Target roles

Any suitable software-development role, including (but not limited
to): - Python Developer / Backend Developer; - Django / FastAPI
Developer; - Full-Stack Developer; - JavaScript / React Developer; -
Software Engineer / Software Developer; - AI Application Developer / LLM
Application Developer; - Automation Developer, where the role is
genuinely software-development focused.

The role list is configurable. The system must not assume every title is
suitable; it must inspect responsibilities, required skills, seniority,
and eligibility.

### 3.4 Experience level

The initial profile should support fresher, trainee, internship, and
junior roles, while allowing the user to change the experience range.
The system must not represent projects, training, or coursework as
professional employment.

## 4. MVP goals

The MVP must:

1.  Allow the user to create and maintain a candidate profile.
2.  Accept a CV in supported formats and extract structured information.
3.  Ask the user to confirm important extracted facts before using them
    in applications.
4.  Store job-search preferences for India and international roles.
5.  Discover jobs from a small, configurable set of permitted sources.
6.  normalize job listings and prevent duplicate processing.
7.  Apply hard eligibility checks before calculating or acting on a
    match.
8.  Produce an explainable match score and reasons for rejection or
    selection.
9.  Prepare a job-specific CV version and application answers using only
    verified candidate facts.
10. Automatically submit applications only through explicitly permitted
    and supported application methods.
11. Verify submission outcomes and retain evidence where available.
12. Track applications, failures, pending actions, and follow-up status.
13. Let the user pause, resume, or stop background processing.
14. Run locally on Ubuntu with a clear setup and backup approach.

## 5. Non-goals

The MVP will not attempt to: - become a commercial multi-user SaaS
product; - provide employer or recruiter accounts; - guarantee
interviews, offers, or employment; - apply to every job found regardless
of fit; - bypass CAPTCHA, MFA, access controls, rate limits, or platform
restrictions; - hide automation, spoof browser fingerprints, imitate
human behaviour to evade detection, or rotate proxies to bypass
restrictions; - scrape sources where access or automated collection is
not permitted; - invent experience, skills, qualifications, work
authorization, salary history, notice period, or other candidate
facts; - submit sensitive legal, demographic, or declaration answers
without verified information and appropriate user authorization; -
automatically send messages to recruiters or contacts in the MVP; -
support mobile apps or multiple candidate profiles.

## 6. Core user journey

1.  The user opens JobPilot AI and completes the candidate profile.
2.  The user uploads a CV.
3.  The system extracts candidate facts and presents them for review.
4.  The user confirms, corrects, or marks uncertain facts as unknown.
5.  The user configures target roles, geography, work mode, experience
    range, salary preferences, sponsorship requirements, excluded
    employers, and application limits.
6.  The user enables job discovery.
7.  The system collects listings from configured permitted sources.
8.  It normalizes listings and checks for duplicates.
9.  It runs eligibility rules. Ineligible jobs are rejected with
    reasons.
10. Eligible jobs receive an explainable relevance score.
11. For jobs meeting the configured threshold, the system prepares a
    tailored CV and application answers.
12. The policy gate checks source permission, supported submission
    method, required facts, duplicate status, application limits, and
    any human-verification requirement.
13. If all checks pass, the application executor submits the application
    through the permitted integration.
14. The system verifies the result and records the outcome.
15. If submission is blocked, unsupported, or uncertain, the system
    records the correct status and provides the official application
    link and prepared materials for manual completion.

## 7. Functional requirements

### FR-01 --- Candidate profile

The user can store and edit: - name and contact details; - current
location and preferred locations/countries; - education and
qualifications; - skills and proficiency evidence; - projects and
training; - employment history, if any; - languages; - work
authorization by country, where known; - sponsorship or relocation
requirements; - notice period and availability, where applicable.

Unknown information must remain explicitly unknown. The system must not
infer legal eligibility from nationality, location, or other indirect
clues.

### FR-02 --- CV management

-   Support PDF and DOCX initially.
-   Extract text and candidate facts.
-   Preserve the original file.
-   Allow the user to review and correct extracted facts.
-   Link generated CV versions to the original facts and target job.
-   Never add unsupported claims to a CV.

### FR-03 --- Job preferences

The user can configure: - India and/or international search; - target
job titles and role categories; - junior, trainee, internship, or other
experience levels; - required and preferred skills; - preferred
countries, cities, and remote/hybrid/on-site modes; - salary range and
currency, if specified; - sponsorship and relocation requirements; -
excluded companies, domains, and job types; - minimum match score; -
daily and weekly application limits; - allowed job sources; - discovery
schedule and pause state.

### FR-04 --- Job discovery and source handling

-   Integrate sources one at a time.
-   Prefer official APIs, approved integrations, feeds, or other
    permitted access methods.
-   Record the source, original job URL, collection time, and available
    job metadata.
-   Respect source terms, technical restrictions, and reasonable request
    limits.
-   If a source does not permit automated collection or submission, use
    an approved alternative or provide a manual handoff.
-   Do not assume that a publicly viewable job page permits automated
    scraping or applying.

### FR-05 --- Normalization and deduplication

Normalize title, company, location, employment type, experience, skills,
description, salary, source, and application URL where available.

Use stable source identifiers and canonical URLs where possible.
Similarity-based duplicate detection may assist, but ambiguous matches
must not silently discard a potentially distinct vacancy.

### FR-06 --- Eligibility and matching

Eligibility checks run before weighted matching. Examples of hard
checks: - role is within the configured software-development scope; -
experience requirement is compatible with the candidate profile; -
location and work mode are acceptable; - work authorization and
sponsorship requirements are compatible or explicitly unresolved; -
vacancy is still active, where this can be verified; - job is not
excluded by the user's settings.

The match result must show: - score; - matched skills; - missing or
weakly evidenced requirements; - experience fit; - location/work-mode
fit; - salary fit, when data exists; - sponsorship/work-authorization
status; - reasons for rejection or uncertainty.

A match score is a relevance estimate, not a probability of getting
hired. Unknown data must not be treated as a confirmed match.

### FR-07 --- Resume tailoring

-   Tailor wording and ordering to the job description.
-   Use only facts supported by the confirmed candidate profile or CV.
-   Do not fabricate skills, employment, achievements, dates,
    qualifications, or metrics.
-   Keep the original CV unchanged.
-   Store each generated version with its target job and generation
    history.

### FR-08 --- Application answer preparation

Prepare answers from verified profile data. Mandatory questions that
cannot be answered reliably must be marked as requiring user input. The
system must not guess answers about sponsorship, work authorization,
salary history, legal declarations, demographic information, criminal
history, or other sensitive matters.

### FR-09 --- Auto-apply policy gate

Auto-apply is permitted only when all configured checks pass: - the
source and submission method are explicitly permitted; - a supported
application adapter exists; - the vacancy is not a duplicate and is
still suitable; - eligibility checks pass; - the match score meets the
user's threshold; - all mandatory answers are supported by verified
facts; - application limits have not been reached; - no CAPTCHA, MFA
challenge, access restriction, or other human-verification step blocks
the workflow; - the user has enabled auto-apply for that source and job
category.

Auto-apply must be disabled by default until the user configures and
explicitly enables it.

### FR-10 --- Submission and verification

-   Submit only through supported, permitted application workflows.
-   Use idempotency controls to reduce duplicate submissions.
-   Do not blindly retry after a timeout; first check whether the
    application was received.
-   Record timestamps, source, job, submitted CV version, answers, and
    available confirmation evidence.
-   Use `APPLIED_CONFIRMED` only when reliable confirmation exists.
-   Use `SUBMISSION_UNCONFIRMED` when the outcome cannot be established.
-   Use `MANUAL_ACTION_REQUIRED` when a user must complete a blocked or
    unsupported step.

### FR-11 --- Application tracking

The user can view applications by status, company, role, source, date,
and match score. The user can add interview, rejection, offer,
withdrawal, and follow-up outcomes manually.

### FR-12 --- Agent controls and observability

The user can: - start, pause, resume, and stop a run; - view current
stage and progress; - inspect why a job was selected, rejected, or not
submitted; - view errors and retryable failures; - inspect an event
history for important agent actions.

## 8. Application status model

Suggested application statuses:

-   `NOT_STARTED`
-   `PREPARING`
-   `NEEDS_USER_INPUT`
-   `READY`
-   `AUTO_APPLY_QUEUED`
-   `SUBMITTING`
-   `APPLIED_CONFIRMED`
-   `SUBMISSION_UNCONFIRMED`
-   `MANUAL_ACTION_REQUIRED`
-   `FAILED_RETRYABLE`
-   `FAILED_FINAL`
-   `WITHDRAWN`

Statuses must represent observed facts, not optimistic assumptions.

## 9. Quality, safety, and reliability requirements

-   Candidate data and CV files remain private and are stored locally by
    default.
-   Secrets and credentials must not be committed to source control.
-   Every application must be traceable to a job listing and a specific
    CV version.
-   Duplicate prevention and safe retry behaviour are mandatory.
-   Agent actions must be logged with timestamps and outcomes.
-   LLM output must be validated before it changes application state or
    triggers submission.
-   Deterministic code, not an LLM alone, enforces eligibility and
    auto-apply policy.
-   The user must be able to stop background activity.
-   Errors must be visible and recoverable where safe.
-   Backups must cover the database and uploaded/generated CV files.

## 10. MVP acceptance criteria

The MVP is considered usable when all of the following are demonstrated:

1.  A user can upload a PDF or DOCX CV and review extracted facts.
2.  Confirmed facts can be stored in the candidate profile.
3.  The user can configure India and international job preferences.
4.  At least one permitted job source can be connected and tested end to
    end.
5.  Job listings are normalized and duplicate listings are handled
    safely.
6.  The system explains why a job passes or fails eligibility checks.
7.  A match score and supporting reasons are visible.
8.  A tailored CV can be generated without unsupported claims.
9.  Application answers are prepared from verified data, with unknown
    mandatory answers flagged.
10. At least one permitted application method can be tested end to end
    before auto-apply is enabled.
11. A successful submission is recorded only when reliable confirmation
    is available.
12. Restricted or unsupported workflows stop safely and provide a manual
    handoff.
13. The user can pause and stop agent runs.
14. Application history and event logs remain available after restart.

**Important scope constraint:** the MVP must prove one complete vertical
slice with one permitted job source and one permitted application method
before adding more integrations. India and international search are
product preferences, not a promise that every country or platform will
be supported in the first release.

## 11. Initial implementation boundary

The first release should prioritize: 1. local candidate profile and CV
fact confirmation; 2. one permitted job source; 3. job normalization,
deduplication, eligibility, and matching; 4. tailored CV and
application-answer preparation; 5. one permitted application adapter; 6.
submission verification and application tracking.

Additional sources and countries should be added only after the first
vertical slice is reliable.

## 12. Decisions intentionally deferred

The following are not fixed by this MVP document and will be specified
in later design documents: - exact job-source integrations and their
permitted capabilities; - exact countries and country-specific
eligibility rules; - detailed agent graph and retry/error transitions; -
final matching weights and thresholds; - database schema and API
contracts; - deployment packaging and backup implementation; - LLM
provider and model selection.

These decisions should be made using evidence from the chosen sources
and the candidate's confirmed profile, not guessed in advance.

------------------------------------------------------------------------

**Review checklist** - \[ \] Product scope and personal-use boundary are
correct. - \[ \] India + international search scope is correct. - \[ \]
Target role scope is correct. - \[ \] Auto-apply constraints and manual
handoff rules are acceptable. - \[ \] MVP acceptance criteria are clear.

Once this document is approved, the next document is
`AGENT_WORKFLOW.md`. No implementation code should be started until the
workflow and core architecture have been reviewed.
