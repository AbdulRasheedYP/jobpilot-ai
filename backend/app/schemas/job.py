import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field


class JobSourceResponse(BaseModel):
    id: uuid.UUID
    name: str
    code: str
    is_enabled: bool
    permits_auto_apply: bool
    rate_limit_per_minute: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class JobSourceUpdate(BaseModel):
    is_enabled: Optional[bool] = None
    permits_auto_apply: Optional[bool] = None


class JobSourceCreate(BaseModel):
    name: str
    code: str
    adapter_class: str
    is_enabled: bool = True
    permits_auto_apply: bool = False
    rate_limit_per_minute: int = 30
    config: Dict[str, Any] = Field(default_factory=dict)


class JobResponse(BaseModel):
    id: uuid.UUID
    source_id: uuid.UUID
    external_id: str
    company_name: str
    title: str
    description: str
    location: str
    is_remote: bool
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    currency: Optional[str] = None
    skills_required: List[str] = Field(default_factory=list)
    application_url: str
    canonical_url: str
    posted_at: Optional[datetime] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class JobListResponse(BaseModel):
    items: List[JobResponse]
    total: int
    page: int
    size: int
    pages: int


class JobSyncRequest(BaseModel):
    source_code: Optional[str] = None
    query: Optional[str] = "Python"
    location: Optional[str] = None


class JobSyncResponse(BaseModel):
    status: str = "completed"
    source_code: str
    total_fetched: int
    new_jobs: int
    updated_jobs: int
    skipped_jobs: int
