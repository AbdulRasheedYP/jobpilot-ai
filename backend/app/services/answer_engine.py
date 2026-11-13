from typing import List, Tuple, Dict, Any
from backend.app.models.user_profile import UserProfile
from backend.app.models.job import Job


def prepare_application_answers(
    user: UserProfile,
    job: Job,
) -> Tuple[List[Dict[str, Any]], bool, List[str]]:
    """
    Synthesizes standard job application questions and answers directly from
    verified candidate facts.

    Returns:
    - answers: list of answer dictionaries
    - all_ready: bool (True if all mandatory fields are present, False if missing info)
    - missing_fields: list of missing mandatory field names
    """
    answers: List[Dict[str, Any]] = []
    missing_fields: List[str] = []

    # 1. Full Name
    answers.append({
        "question": "Full Name",
        "answer": user.full_name,
        "field_type": "text",
        "source_profile_field": "full_name",
        "is_complete": bool(user.full_name),
    })

    # 2. Email
    answers.append({
        "question": "Email Address",
        "answer": user.email,
        "field_type": "email",
        "source_profile_field": "email",
        "is_complete": bool(user.email),
    })

    # 3. Phone Number
    if user.phone:
        answers.append({
            "question": "Phone Number",
            "answer": user.phone,
            "field_type": "tel",
            "source_profile_field": "phone",
            "is_complete": True,
        })
    else:
        missing_fields.append("Phone Number")
        answers.append({
            "question": "Phone Number",
            "answer": "",
            "field_type": "tel",
            "source_profile_field": "phone",
            "is_complete": False,
        })

    # 4. Location
    if user.current_location:
        answers.append({
            "question": "Current Location",
            "answer": user.current_location,
            "field_type": "text",
            "source_profile_field": "current_location",
            "is_complete": True,
        })
    else:
        missing_fields.append("Current Location")
        answers.append({
            "question": "Current Location",
            "answer": "",
            "field_type": "text",
            "source_profile_field": "current_location",
            "is_complete": False,
        })

    # 5. Notice Period
    if user.notice_period_days is not None:
        answers.append({
            "question": "Notice Period",
            "answer": f"{user.notice_period_days} days" if user.notice_period_days > 0 else "Immediate (0 days)",
            "field_type": "text",
            "source_profile_field": "notice_period_days",
            "is_complete": True,
        })
    else:
        missing_fields.append("Notice Period")
        answers.append({
            "question": "Notice Period",
            "answer": "",
            "field_type": "text",
            "source_profile_field": "notice_period_days",
            "is_complete": False,
        })

    # 6. Work Authorization / Sponsorship
    sponsorship_ans = (
        "Yes, I will require visa sponsorship."
        if user.sponsorship_required
        else "No, I am authorized to work without sponsorship."
    )
    answers.append({
        "question": "Do you require visa sponsorship to work in this location?",
        "answer": sponsorship_ans,
        "field_type": "select",
        "source_profile_field": "sponsorship_required",
        "is_complete": True,
    })

    # 7. Role Interest Statement
    skills_preview = ", ".join((user.skills or [])[:4])
    cover_statement = (
        f"I am excited to apply for the {job.title} role at {job.company_name}. "
        f"With practical expertise in {skills_preview}, I am eager to contribute effectively "
        f"to your engineering team."
    )
    answers.append({
        "question": f"Why are you interested in joining {job.company_name} as a {job.title}?",
        "answer": cover_statement,
        "field_type": "textarea",
        "source_profile_field": "skills",
        "is_complete": True,
    })

    all_ready = len(missing_fields) == 0
    return answers, all_ready, missing_fields
