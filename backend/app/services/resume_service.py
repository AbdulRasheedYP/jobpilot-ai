import os
import uuid
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from backend.app.core.config import settings
from backend.app.models.resume import Resume
from backend.app.models.user_profile import UserProfile
from backend.app.schemas.resume import ResumeConfirmRequest, ResumeConfirmResponse
from backend.app.services.cv_extractor import extract_text_from_file, extract_facts_with_llm


def _ensure_dir(path: str):
    os.makedirs(path, exist_ok=True)


async def save_and_parse_resume(
    db: Session,
    user: UserProfile,
    file: UploadFile,
) -> Resume:
    """Save uploaded CV to disk, extract text, parse structured facts with LLM, and persist to DB."""
    # Validate extension
    file_name = file.filename or "uploaded_resume.pdf"
    ext = os.path.splitext(file_name)[1].lower().replace(".", "")
    if ext not in ["pdf", "txt", "docx", "md"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format: .{ext}. Please upload a PDF, DOCX, or TXT file.",
        )

    # Read bytes
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file is empty.",
        )

    # Save to storage/uploads
    _ensure_dir(settings.UPLOAD_DIR)
    stored_filename = f"{uuid.uuid4().hex}_{file_name}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Extract text & parse facts
    text = extract_text_from_file(content, file_type=ext)
    parsed_facts = await extract_facts_with_llm(text)

    # Create Resume DB record
    resume = Resume(
        id=uuid.uuid4(),
        user_profile_id=user.id,
        file_path=file_path,
        file_name=file_name,
        file_type=ext,
        is_original=True,
        parsed_facts=parsed_facts,
        version=1,
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)
    return resume


def list_resumes(db: Session, user_id: uuid.UUID) -> List[Resume]:
    return (
        db.query(Resume)
        .filter(Resume.user_profile_id == user_id)
        .order_by(Resume.created_at.desc())
        .all()
    )


def get_resume(db: Session, resume_id: uuid.UUID, user_id: uuid.UUID) -> Resume:
    resume = (
        db.query(Resume)
        .filter(Resume.id == resume_id, Resume.user_profile_id == user_id)
        .first()
    )
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found",
        )
    return resume


def confirm_resume_facts(
    db: Session,
    resume_id: uuid.UUID,
    user: UserProfile,
    confirmation: ResumeConfirmRequest,
) -> ResumeConfirmResponse:
    """
    Critical Zero-Hallucination Gate:
    Applies confirmed candidate facts from the reviewed resume to the candidate's UserProfile.
    """
    resume = get_resume(db=db, resume_id=resume_id, user_id=user.id)

    # Update resume's parsed facts status
    updated_facts = dict(resume.parsed_facts)
    updated_facts["status"] = "confirmed"
    updated_facts["confirmed_skills"] = confirmation.confirmed_skills
    updated_facts["confirmed_education"] = confirmation.confirmed_education
    updated_facts["confirmed_experience"] = confirmation.confirmed_experience
    resume.parsed_facts = updated_facts

    # Apply confirmed facts directly to UserProfile
    if confirmation.confirmed_skills:
        user.skills = confirmation.confirmed_skills
    if confirmation.confirmed_education:
        user.education = confirmation.confirmed_education
    if confirmation.confirmed_experience:
        user.experience = confirmation.confirmed_experience

    now = datetime.now(timezone.utc)
    db.commit()
    db.refresh(resume)
    db.refresh(user)

    return ResumeConfirmResponse(
        status="confirmed",
        profile_updated=True,
        confirmed_at=now,
    )


def delete_resume(db: Session, resume_id: uuid.UUID, user_id: uuid.UUID) -> None:
    resume = get_resume(db=db, resume_id=resume_id, user_id=user_id)
    # Remove file from disk if exists
    if os.path.exists(resume.file_path):
        try:
            os.remove(resume.file_path)
        except OSError:
            pass

    db.delete(resume)
    db.commit()
