import uuid
from typing import List, Dict, Any
from datetime import datetime
from sqlalchemy import Boolean, Float, ForeignKey, DateTime, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.app.core.database import Base


class JobMatch(Base):
    __tablename__ = "job_matches"
    __table_args__ = (
        UniqueConstraint("job_id", "user_profile_id", name="uq_matches_job_user"),
        Index("idx_matches_score", "overall_score"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False
    )
    user_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False
    )
    eligibility_passed: Mapped[bool] = mapped_column(Boolean, nullable=False)
    eligibility_details: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    overall_score: Mapped[float] = mapped_column(Float, nullable=False)
    score_breakdown: Mapped[Dict[str, Any]] = mapped_column(JSONB, nullable=False)
    matched_skills: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    missing_skills: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    decision_reasons: Mapped[List[str]] = mapped_column(JSONB, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=datetime.utcnow, nullable=False
    )

    # Relationships
    job = relationship("Job", back_populates="matches")
    user_profile = relationship("UserProfile", back_populates="matches")
