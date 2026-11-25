import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class EducationItem(BaseModel):
    institution: str
    degree: str
    graduation_year: Optional[int] = None


class ExperienceItem(BaseModel):
    company: str
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    current_location: Optional[str] = None
    preferred_locations: Optional[List[str]] = None
    education: Optional[List[Dict[str, Any]]] = None
    skills: Optional[List[str]] = None
    experience: Optional[List[Dict[str, Any]]] = None
    languages: Optional[List[str]] = None
    work_authorization: Optional[Dict[str, Any]] = None
    sponsorship_required: Optional[bool] = None
    notice_period_days: Optional[int] = None


class ProfileResponse(BaseModel):
    id: uuid.UUID
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    current_location: Optional[str] = None
    preferred_locations: List[str] = Field(default_factory=list)
    education: List[Dict[str, Any]] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    experience: List[Dict[str, Any]] = Field(default_factory=list)
    languages: List[str] = Field(default_factory=list)
    work_authorization: Dict[str, Any] = Field(default_factory=dict)
    sponsorship_required: bool = False
    notice_period_days: Optional[int] = 0
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
