import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class ParsedFacts(BaseModel):
    status: str = "pending_review"
    extracted_skills: List[str] = Field(default_factory=list)
    extracted_education: List[Dict[str, Any]] = Field(default_factory=list)
    extracted_experience: List[Dict[str, Any]] = Field(default_factory=list)


class ResumeResponse(BaseModel):
    id: uuid.UUID
    file_name: str
    file_type: str
    is_original: bool
    version: int
    parsed_facts: Dict[str, Any]
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ResumeConfirmRequest(BaseModel):
    confirmed_skills: List[str] = Field(default_factory=list)
    confirmed_education: List[Dict[str, Any]] = Field(default_factory=list)
    confirmed_experience: List[Dict[str, Any]] = Field(default_factory=list)


class ResumeConfirmResponse(BaseModel):
    status: str = "confirmed"
    profile_updated: bool = True
    confirmed_at: datetime
