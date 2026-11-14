import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from backend.app.models.enums import ApplicationStatus
from backend.app.schemas.match import JobSummary


class AnswerItemSchema(BaseModel):
    id: Optional[uuid.UUID] = None
    question: str
    answer: str
    field_type: str = "text"
    source_profile_field: Optional[str] = None
    is_complete: bool = True

    model_config = ConfigDict(from_attributes=True)


class AnswerUpdateRequest(BaseModel):
    answers: List[AnswerItemSchema]


class AnswersListResponse(BaseModel):
    answers: List[AnswerItemSchema]


class ApplicationPatchRequest(BaseModel):
    status: Optional[ApplicationStatus] = None
    notes: Optional[str] = None
    confirmation_evidence: Optional[Dict[str, Any]] = None


class ApplicationPrepareRequest(BaseModel):
    job_id: uuid.UUID


class ApplicationResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    user_profile_id: uuid.UUID
    tailored_resume_id: Optional[uuid.UUID] = None
    status: ApplicationStatus
    submission_method: Optional[str] = None
    submitted_at: Optional[datetime] = None
    confirmation_evidence: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    notes: Optional[str] = None
    answers: List[AnswerItemSchema] = Field(default_factory=list)
    job: Optional[JobSummary] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ApplicationListResponse(BaseModel):
    items: List[ApplicationResponse]
    total: int
    page: int
    size: int
    pages: int
