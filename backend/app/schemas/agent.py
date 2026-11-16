import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from backend.app.models.enums import AgentRunStatus


class AgentEventResponse(BaseModel):
    id: uuid.UUID
    stage: str
    event_type: str
    message: str
    timestamp: datetime
    payload: Dict[str, Any] = Field(default_factory=dict)

    model_config = ConfigDict(from_attributes=True)


class AgentRunResponse(BaseModel):
    id: uuid.UUID
    user_profile_id: uuid.UUID
    status: AgentRunStatus
    jobs_discovered: int
    jobs_matched: int
    applications_prepared: int
    applications_submitted: int
    error_summary: Optional[str] = None
    started_at: datetime
    finished_at: Optional[datetime] = None
    events: List[AgentEventResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class AgentRunCreate(BaseModel):
    run_type: Optional[str] = "FULL_CYCLE"  # 'DISCOVERY' | 'MATCHING' | 'APPLY' | 'FULL_CYCLE'


class AgentRunListResponse(BaseModel):
    items: List[AgentRunResponse]
    total: int
    page: int
    size: int
    pages: int


class DashboardKPIResponse(BaseModel):
    total_jobs: int
    total_matches: int
    strong_matches: int
    total_applications: int
    applied_confirmed: int
    needs_action: int
    auto_apply_enabled: bool
    daily_application_limit: int
    daily_applications_used: int
