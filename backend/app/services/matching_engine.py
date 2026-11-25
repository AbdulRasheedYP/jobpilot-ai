import re
import uuid
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.models.job import Job
from backend.app.models.job_match import JobMatch
from backend.app.models.user_profile import UserProfile, JobPreference
from backend.app.services.preference_service import get_or_create_preferences


def check_eligibility(
    user: UserProfile,
    pref: JobPreference,
    job: Job,
) -> Tuple[bool, Dict[str, str], List[str]]:
    """
    Deterministic Hard Gate Checks:
    1. Company Exclusion: Checks if job company is on user's excluded list.
    2. Role Suitability: Checks if title aligns with candidate's target roles.
    3. Location & Work Mode: Checks remote or location preferences.
    4. Work Authorization / Sponsorship: Flags mismatch if sponsorship is not possible.
    """
    details: Dict[str, str] = {}
    reasons: List[str] = []

    # 1. Company exclusion check
    excluded = [c.lower().strip() for c in (pref.excluded_companies or [])]
    if job.company_name.lower().strip() in excluded:
        details["company_exclusion"] = "FAIL"
        reasons.append(f"Company '{job.company_name}' is in excluded companies list.")
        return False, details, reasons
    else:
        details["company_exclusion"] = "PASS"

    # 2. Role suitability check
    target_roles = [r.lower() for r in (pref.target_roles or ["python developer"])]
    job_title_lower = job.title.lower()

    # Extract keywords from title and target roles
    title_matches = any(
        any(word in job_title_lower for word in target_role.split() if len(word) > 2)
        for target_role in target_roles
    )
    if not title_matches and not any(r in job_title_lower for r in ["software", "developer", "engineer", "python", "backend"]):
        details["role_suitability"] = "FAIL"
        reasons.append(f"Role '{job.title}' does not match target roles ({', '.join(pref.target_roles)}).")
        return False, details, reasons
    else:
        details["role_suitability"] = "PASS"

    # 3. Work mode & Location check
    allowed_modes = [m.lower() for m in (pref.work_modes or ["remote", "hybrid", "onsite"])]
    if job.is_remote:
        if "remote" in allowed_modes:
            details["work_mode"] = "PASS"
        else:
            details["work_mode"] = "FAIL"
            reasons.append("Job is remote but remote work is not enabled in preferences.")
            return False, details, reasons
    else:
        # Check physical location against preferred countries / locations
        candidate_locs = [l.strip().lower() for l in (pref.target_countries or ["India"]) + (user.preferred_locations or []) if l and l.strip()]
        job_loc_lower = (job.location or "").lower()
        if any(loc in job_loc_lower for loc in candidate_locs) or "remote" in candidate_locs or "all" in candidate_locs:
            details["work_mode"] = "PASS"
        else:
            details["work_mode"] = "FAIL"
            reasons.append(f"Location '{job.location}' does not match candidate target search locations ({', '.join(pref.target_countries or [])}).")
            return False, details, reasons

    # 4. Work authorization check
    desc_lower = job.description.lower()
    if ("no sponsorship" in desc_lower or "citizens only" in desc_lower) and user.sponsorship_required:
        details["work_authorization"] = "FAIL"
        reasons.append("Job requires independent citizenship/authorization; sponsorship not provided.")
        return False, details, reasons
    else:
        details["work_authorization"] = "PASS"

    # 5. Date freshness check
    freshness_days = getattr(pref, "posted_within_days", None)
    if freshness_days and freshness_days > 0:
        job_date = job.posted_at or job.created_at
        if job_date:
            now = datetime.now(timezone.utc)
            if job_date.tzinfo is None:
                job_date = job_date.replace(tzinfo=timezone.utc)
            cutoff = now - timedelta(days=freshness_days)
            if job_date < cutoff:
                details["date_freshness"] = "FAIL"
                reasons.append(f"Job posted on {job_date.strftime('%Y-%m-%d')} is older than the {freshness_days}-day search threshold.")
                return False, details, reasons
        details["date_freshness"] = "PASS"

    overall_passed = all(status != "FAIL" for status in details.values())
    return overall_passed, details, reasons


def calculate_match_score(
    user: UserProfile,
    pref: JobPreference,
    job: Job,
) -> Dict[str, Any]:
    """
    Weighted Match Scoring Engine (as defined in DECISION_ENGINE.md):
    - Skills match: 35%
    - Role & responsibility match: 25%
    - Experience fit: 20%
    - Education fit: 10%
    - Location and work mode: 10%
    Total: 100%
    """
    reasons: List[str] = []
    user_skills = [s.strip().lower() for s in (user.skills or [])]
    job_skills = [s.strip().lower() for s in (job.skills_required or [])]
    job_desc = job.description.lower()

    # --- 1. Skills Match (Weight: 35%) ---
    matched_skills = []
    missing_skills = []

    # Check required skills from job tags/metadata
    if job_skills:
        for js in job_skills:
            if any(us == js or us in js or js in us for us in user_skills):
                matched_skills.append(js)
            else:
                missing_skills.append(js)
        skill_ratio = len(matched_skills) / len(job_skills)
    else:
        # Fallback to searching user skills in job description
        for us in user_skills:
            if re.search(r"\b" + re.escape(us) + r"\b", job_desc):
                matched_skills.append(us)
            else:
                missing_skills.append(us)
        skill_ratio = (len(matched_skills) / len(user_skills)) if user_skills else 0.5

    skills_score = round(min(1.0, skill_ratio) * 35.0, 1)
    if matched_skills:
        reasons.append(f"Matched key skills: {', '.join(matched_skills[:5])} ({skills_score}/35 pts)")
    if missing_skills:
        reasons.append(f"Missing skills: {', '.join(missing_skills[:3])}")

    # --- 2. Role & Responsibility Match (Weight: 25%) ---
    title_lower = job.title.lower()
    target_roles = [r.lower() for r in (pref.target_roles or ["Python Developer"])]

    role_ratio = 0.5  # default baseline
    for tr in target_roles:
        if tr == title_lower:
            role_ratio = 1.0
            break
        elif all(word in title_lower for word in tr.split()):
            role_ratio = max(role_ratio, 0.9)
        elif any(word in title_lower for word in tr.split() if len(word) > 3):
            role_ratio = max(role_ratio, 0.75)

    role_score = round(role_ratio * 25.0, 1)
    reasons.append(f"Role title alignment: {job.title} ({role_score}/25 pts)")

    # --- 3. Experience Fit (Weight: 20%) ---
    # Fresher / Junior / Mid / Senior
    exp_level = (job.experience_level or "").lower()
    candidate_exp_count = len(user.experience or [])

    if any(lvl in title_lower or lvl in exp_level for lvl in ["junior", "fresher", "entry", "trainee", "associate"]):
        # Fresher/Junior job
        exp_score = 20.0 if candidate_exp_count <= 2 else 15.0
        reasons.append(f"Experience level aligns with junior/fresher profile ({exp_score}/20 pts)")
    elif any(lvl in title_lower or lvl in exp_level for lvl in ["senior", "lead", "principal", "architect"]):
        # Senior job
        exp_score = 5.0 if candidate_exp_count < 3 else 18.0
        reasons.append(f"Senior role requirements exceed baseline experience ({exp_score}/20 pts)")
    else:
        # Mid-level / general
        exp_score = 16.0
        reasons.append(f"General experience fit ({exp_score}/20 pts)")

    # --- 4. Education Fit (Weight: 10%) ---
    user_education = user.education or []
    has_cs_degree = any(
        any(k in str(ed.get("degree", "")).lower() for k in ["computer", "technology", "b.tech", "b.e", "bca", "mca", "software"])
        for ed in user_education
    )
    education_score = 10.0 if has_cs_degree else 6.0
    reasons.append(f"Education credential evaluation ({education_score}/10 pts)")

    # --- 5. Location and Work Mode (Weight: 10%) ---
    if job.is_remote:
        location_score = 10.0
        reasons.append("Remote job location provides full work flexibility (10/10 pts)")
    else:
        candidate_locs = [l.lower() for l in (user.preferred_locations or []) + (pref.target_countries or [])]
        if any(loc in job.location.lower() for loc in candidate_locs):
            location_score = 10.0
            reasons.append(f"Physical location '{job.location}' matches candidate preferences (10/10 pts)")
        else:
            location_score = 4.0
            reasons.append(f"Location '{job.location}' requires partial relocation (4/10 pts)")

    # Total Overall Score
    overall = round(skills_score + role_score + exp_score + education_score + location_score, 1)
    overall = min(100.0, max(0.0, overall))

    return {
        "overall_score": overall,
        "score_breakdown": {
            "skills_match": skills_score,
            "role_match": role_score,
            "experience_fit": exp_score,
            "education_fit": education_score,
            "location_fit": location_score,
        },
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "decision_reasons": reasons,
    }


def evaluate_and_save_match(
    db: Session,
    user: UserProfile,
    job: Job,
) -> JobMatch:
    """Evaluates eligibility & match score for a job and saves/updates JobMatch record in DB."""
    pref = get_or_create_preferences(db, user.id)

    passed, eligibility_details, elig_reasons = check_eligibility(user=user, pref=pref, job=job)
    score_data = calculate_match_score(user=user, pref=pref, job=job)

    # Combine eligibility notes with match reasons
    combined_reasons = elig_reasons + score_data["decision_reasons"]

    # Upsert JobMatch
    match = (
        db.query(JobMatch)
        .filter(JobMatch.job_id == job.id, JobMatch.user_profile_id == user.id)
        .first()
    )
    if not match:
        match = JobMatch(
            id=uuid.uuid4(),
            job_id=job.id,
            user_profile_id=user.id,
            eligibility_passed=passed,
            eligibility_details=eligibility_details,
            overall_score=score_data["overall_score"],
            score_breakdown=score_data["score_breakdown"],
            matched_skills=score_data["matched_skills"],
            missing_skills=score_data["missing_skills"],
            decision_reasons=combined_reasons,
        )
        db.add(match)
    else:
        match.eligibility_passed = passed
        match.eligibility_details = eligibility_details
        match.overall_score = score_data["overall_score"]
        match.score_breakdown = score_data["score_breakdown"]
        match.matched_skills = score_data["matched_skills"]
        match.missing_skills = score_data["missing_skills"]
        match.decision_reasons = combined_reasons

    db.commit()
    db.refresh(match)
    return match


def batch_evaluate_jobs(
    db: Session,
    user: UserProfile,
    limit: int = 50,
    force_reevaluate: bool = False,
) -> Tuple[int, int, int]:
    """Evaluates active jobs for the candidate profile. If force_reevaluate=True, re-evaluates all active jobs."""
    from sqlalchemy import select

    if force_reevaluate:
        target_jobs = (
            db.query(Job)
            .filter(Job.is_active == True)
            .order_by(Job.created_at.desc())
            .limit(limit)
            .all()
        )
    else:
        # Find active jobs that have no match record for this user
        evaluated_ids_stmt = (
            select(JobMatch.job_id)
            .filter(JobMatch.user_profile_id == user.id)
        )
        target_jobs = (
            db.query(Job)
            .filter(Job.is_active == True, ~Job.id.in_(evaluated_ids_stmt))
            .order_by(Job.created_at.desc())
            .limit(limit)
            .all()
        )

    evaluated_count = 0
    eligible_count = 0
    strong_matches = 0

    for job in target_jobs:
        match = evaluate_and_save_match(db=db, user=user, job=job)
        evaluated_count += 1
        if match.eligibility_passed:
            eligible_count += 1
        if match.overall_score >= 80.0:
            strong_matches += 1

    return evaluated_count, eligible_count, strong_matches
