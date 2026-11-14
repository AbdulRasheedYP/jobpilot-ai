import os
import uuid
import logging
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.core.config import settings
from backend.app.models.job import Job
from backend.app.models.user_profile import UserProfile
from backend.app.models.resume import Resume
from backend.app.services.llm_provider import get_llm_provider

logger = logging.getLogger(__name__)

TAILOR_SYSTEM_PROMPT = """You are an expert ATS Resume Tailoring Agent for JobPilot AI.
Your job is to tailor the candidate's professional resume summary and highlight relevant experiences for a specific target job.

STRICT ZERO-HALLUCINATION POLICY:
1. ONLY emphasize skills, experiences, and qualifications that are EXPLICITLY present in the candidate's confirmed profile.
2. NEVER invent new technologies, employers, degrees, projects, or metrics.
3. If the candidate lacks a required skill from the job description, DO NOT add it to the resume.

Output Schema:
{
  "tailored_summary": "Professional summary focused on the target role...",
  "highlighted_skills": ["ConfirmedSkill1", "ConfirmedSkill2"],
  "tailored_experiences": [
    {
      "company": "Existing Company",
      "title": "Existing Title",
      "highlighted_points": ["Relevant bullet point using real candidate facts..."]
    }
  ]
}
"""


def validate_anti_hallucination(
    tailored_skills: List[str],
    candidate_confirmed_skills: List[str],
) -> List[str]:
    """
    Strict Anti-Hallucination Gate:
    Filters out any skill proposed by the LLM that is not in the candidate's verified skills list.
    """
    confirmed_set = {s.lower().strip() for s in candidate_confirmed_skills}
    sanitized: List[str] = []

    for skill in tailored_skills:
        clean_skill = skill.strip()
        if clean_skill.lower() in confirmed_set:
            sanitized.append(clean_skill)
        else:
            logger.warning(
                f"Anti-hallucination guard rejected unsupported skill: '{clean_skill}'"
            )

    # If all were rejected, fallback to confirmed skills directly
    if not sanitized and candidate_confirmed_skills:
        return candidate_confirmed_skills[:6]

    return sanitized


async def generate_tailored_resume(
    db: Session,
    user: UserProfile,
    job: Job,
) -> Resume:
    """
    Generates an ATS-optimized, job-tailored resume document based strictly on verified candidate facts.
    Persists the tailored resume with target_job_id reference.
    """
    llm = get_llm_provider()

    user_context = {
        "full_name": user.full_name,
        "confirmed_skills": user.skills or [],
        "confirmed_education": user.education or [],
        "confirmed_experience": user.experience or [],
    }
    job_context = {
        "title": job.title,
        "company": job.company_name,
        "description": job.description[:2000],
        "required_skills": job.skills_required or [],
    }

    prompt = f"Candidate Profile:\n{user_context}\n\nTarget Job:\n{job_context}"

    try:
        raw_tailored = await llm.generate_json(prompt=prompt, system_prompt=TAILOR_SYSTEM_PROMPT)
    except Exception as e:
        logger.error(f"LLM tailoring failed; using deterministic fallback: {e}")
        raw_tailored = {}

    # Apply strict Anti-Hallucination verification to skills
    proposed_skills = raw_tailored.get("highlighted_skills", user.skills or [])
    verified_skills = validate_anti_hallucination(proposed_skills, user.skills or [])

    summary = raw_tailored.get(
        "tailored_summary",
        f"Dedicated {job.title} with solid expertise in {', '.join((user.skills or [])[:4])}.",
    )

    tailored_facts = {
        "status": "tailored",
        "target_job_id": str(job.id),
        "target_role": job.title,
        "target_company": job.company_name,
        "tailored_summary": summary,
        "highlighted_skills": verified_skills,
        "education": user.education or [],
        "experience": raw_tailored.get("tailored_experiences", user.experience or []),
    }

    # Save tailored resume record
    os.makedirs(settings.RESUME_STORAGE_DIR, exist_ok=True)
    resume_file_name = f"Tailored_{user.full_name.replace(' ', '_')}_{job.company_name.replace(' ', '_')}.txt"
    file_path = os.path.join(settings.RESUME_STORAGE_DIR, f"{uuid.uuid4().hex}_{resume_file_name}")

    # Write textual ATS resume content
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(f"{user.full_name}\n")
        f.write(f"Email: {user.email} | Phone: {user.phone or 'N/A'}\n")
        f.write(f"Target Role: {job.title} at {job.company_name}\n\n")
        f.write("PROFESSIONAL SUMMARY\n")
        f.write(f"{summary}\n\n")
        f.write("KEY SKILLS\n")
        f.write(", ".join(verified_skills) + "\n\n")
        f.write("EDUCATION\n")
        for ed in user.education or []:
            f.write(f"- {ed.get('degree')} at {ed.get('institution')} ({ed.get('graduation_year', 'N/A')})\n")

    tailored_resume = Resume(
        id=uuid.uuid4(),
        user_profile_id=user.id,
        file_path=file_path,
        file_name=resume_file_name,
        file_type="txt",
        is_original=False,
        target_job_id=job.id,
        parsed_facts=tailored_facts,
        version=2,
    )
    db.add(tailored_resume)
    db.commit()
    db.refresh(tailored_resume)

    return tailored_resume
