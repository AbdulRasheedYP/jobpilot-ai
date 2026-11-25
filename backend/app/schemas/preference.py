import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class JobPreferenceBase(BaseModel):
    target_roles: List[str] = Field(default_factory=lambda: ["Python Developer", "Backend Developer"])
    target_countries: List[str] = Field(default_factory=lambda: ["India", "Remote"])
    work_modes: List[str] = Field(default_factory=lambda: ["remote", "hybrid", "onsite"])
    experience_levels: List[str] = Field(default_factory=lambda: ["fresher", "junior", "trainee"])
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    currency: str = "INR"
    min_match_score: int = 65
    posted_within_days: Optional[int] = 7
    auto_apply_enabled: bool = False
    daily_application_limit: int = 5
    weekly_application_limit: int = 25
    excluded_companies: List[str] = Field(default_factory=list)


class JobPreferenceUpdate(BaseModel):
    target_roles: Optional[List[str]] = None
    target_countries: Optional[List[str]] = None
    work_modes: Optional[List[str]] = None
    experience_levels: Optional[List[str]] = None
    min_salary: Optional[int] = None
    max_salary: Optional[int] = None
    currency: Optional[str] = None
    min_match_score: Optional[int] = None
    posted_within_days: Optional[int] = None
    auto_apply_enabled: Optional[bool] = None
    daily_application_limit: Optional[int] = None
    weekly_application_limit: Optional[int] = None
    excluded_companies: Optional[List[str]] = None


class JobPreferenceResponse(JobPreferenceBase):
    id: uuid.UUID
    user_profile_id: uuid.UUID
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
