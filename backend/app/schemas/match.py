import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class JobSummary(BaseModel):
    id: uuid.UUID
    title: str
    company_name: str
    location: str
    is_remote: bool
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = None
    canonical_url: str
    application_url: Optional[str] = None
    source_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class JobMatchResponse(BaseModel):
    id: uuid.UUID
    job_id: uuid.UUID
    job: Optional[JobSummary] = None
    eligibility_passed: bool
    eligibility_details: Dict[str, Any]
    overall_score: float
    score_breakdown: Dict[str, float]
    matched_skills: List[str] = Field(default_factory=list)
    missing_skills: List[str] = Field(default_factory=list)
    decision_reasons: List[str] = Field(default_factory=list)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class MatchListResponse(BaseModel):
    items: List[JobMatchResponse]
    total: int
    page: int
    size: int
    pages: int


class MatchEvaluateRequest(BaseModel):
    job_id: Optional[uuid.UUID] = None
    limit: int = 50


class MatchEvaluateResponse(BaseModel):
    status: str = "completed"
    evaluated_count: int
    eligible_count: int
    strong_matches_count: int
