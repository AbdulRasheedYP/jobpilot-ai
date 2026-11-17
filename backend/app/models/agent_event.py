import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Text, ForeignKey, DateTime, Enum as SAEnum, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.app.core.database import Base
from backend.app.models.enums import AgentRunStatus


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[AgentRunStatus] = mapped_column(
        SAEnum(AgentRunStatus, name="agent_run_status"),
        default=AgentRunStatus.RUNNING,
        nullable=False,
    )
    jobs_discovered: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    jobs_matched: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    applications_prepared: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    applications_submitted: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )
    finished_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    user_profile = relationship("UserProfile", back_populates="agent_runs")
    events = relationship("AgentEvent", back_populates="agent_run", cascade="all, delete-orphan")


class AgentEvent(Base):
    __tablename__ = "agent_events"
    __table_args__ = (
        Index("idx_agent_events_run", "agent_run_id", "timestamp"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    agent_run_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("agent_runs.id", ondelete="CASCADE"), nullable=False
    )
    stage: Mapped[str] = mapped_column(String(50), nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    agent_run = relationship("AgentRun", back_populates="events")
