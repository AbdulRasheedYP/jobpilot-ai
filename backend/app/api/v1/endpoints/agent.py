import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from backend.app.api.deps import get_db, get_current_user
from backend.app.models.user_profile import UserProfile
from backend.app.models.enums import AgentRunStatus
from backend.app.schemas.agent import (
    AgentRunResponse,
    AgentRunListResponse,
    AgentRunCreate,
    DashboardKPIResponse,
)
from backend.app.services import agent_service

router = APIRouter(prefix="/agent", tags=["Agent"])


@router.get("/dashboard", response_model=DashboardKPIResponse)
def get_dashboard_metrics(
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve real-time KPI overview metrics for the candidate dashboard."""
    return agent_service.get_dashboard_kpis(db=db, user_id=current_user.id)


@router.post("/run", response_model=AgentRunResponse, status_code=status.HTTP_201_CREATED)
async def start_run(
    payload: Optional[AgentRunCreate] = None,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Launch an autonomous agent cycle (Discovery -> Matching -> Prep -> Auto-apply).
    Executes in background and records execution metrics.
    """
    run_type = payload.run_type if payload and payload.run_type else "FULL_CYCLE"
    run = agent_service.create_agent_run(db=db, user=current_user)
    
    # Execute cycle
    return await agent_service.execute_agent_cycle(
        db=db,
        run_id=run.id,
        user=current_user,
        run_type=run_type,
    )


@router.get("/runs", response_model=AgentRunListResponse)
def list_runs(
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List historical agent execution runs and outcomes."""
    items, total, pages = agent_service.list_agent_runs(
        db=db,
        user_id=current_user.id,
        page=page,
        size=size,
    )
    return AgentRunListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/runs/{run_id}", response_model=AgentRunResponse)
def get_run(
    run_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve details and audit logs for a specific agent run."""
    return agent_service.get_agent_run_by_id(
        db=db,
        run_id=run_id,
        user_id=current_user.id,
    )


@router.post("/runs/{run_id}/pause", response_model=AgentRunResponse)
def pause_run(
    run_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Pause an active agent run."""
    return agent_service.update_run_status(
        db=db,
        run_id=run_id,
        user_id=current_user.id,
        new_status=AgentRunStatus.PAUSED,
    )


@router.post("/runs/{run_id}/resume", response_model=AgentRunResponse)
def resume_run(
    run_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Resume a paused agent run."""
    return agent_service.update_run_status(
        db=db,
        run_id=run_id,
        user_id=current_user.id,
        new_status=AgentRunStatus.RUNNING,
    )


@router.post("/runs/{run_id}/stop", response_model=AgentRunResponse)
def stop_run(
    run_id: uuid.UUID,
    current_user: UserProfile = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stop an agent run immediately."""
    return agent_service.update_run_status(
        db=db,
        run_id=run_id,
        user_id=current_user.id,
        new_status=AgentRunStatus.STOPPED,
    )
