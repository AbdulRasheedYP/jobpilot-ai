import uuid
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, status
from sqlalchemy.orm import Session
from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user_profile import UserProfile
from backend.app.schemas.resume import (
    ResumeResponse,
    ResumeConfirmRequest,
    ResumeConfirmResponse,
)
from backend.app.services import resume_service

router = APIRouter(prefix="/resumes", tags=["Resumes"])


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload candidate CV (PDF, DOCX, or TXT).
    Saves the file to local storage and parses structured facts using Gemini LLM.
    """
    return await resume_service.save_and_parse_resume(
        db=db,
        user=current_user,
        file=file,
    )


@router.get("", response_model=List[ResumeResponse])
def get_resumes(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all uploaded and tailored resumes for the authenticated user."""
    return resume_service.list_resumes(db=db, user_id=current_user.id)


@router.get("/{resume_id}", response_model=ResumeResponse)
def get_resume_by_id(
    resume_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve details and extracted facts for a specific resume."""
    return resume_service.get_resume(db=db, resume_id=resume_id, user_id=current_user.id)


@router.put("/{resume_id}/confirm", response_model=ResumeConfirmResponse)
def confirm_resume(
    resume_id: uuid.UUID,
    payload: ResumeConfirmRequest,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Zero-Hallucination Gate:
    Explicit candidate confirmation of extracted facts before they are saved to Profile and used for applications.
    """
    return resume_service.confirm_resume_facts(
        db=db,
        resume_id=resume_id,
        user=current_user,
        confirmation=payload,
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a resume and remove its file from storage."""
    resume_service.delete_resume(db=db, resume_id=resume_id, user_id=current_user.id)
    return None
