import uuid
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.app.core.database import Base, TimestampMixin


class UserProfile(Base, TimestampMixin):
    __tablename__ = "user_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    current_location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Structured details
    preferred_locations: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    education: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, default=list, nullable=False)
    skills: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    experience: Mapped[List[Dict[str, Any]]] = mapped_column(JSONB, default=list, nullable=False)
    languages: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)
    work_authorization: Mapped[Dict[str, Any]] = mapped_column(JSONB, default=dict, nullable=False)
    sponsorship_required: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    notice_period_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Relationships
    resumes = relationship("Resume", back_populates="user_profile", cascade="all, delete-orphan")
    preferences = relationship("JobPreference", back_populates="user_profile", uselist=False, cascade="all, delete-orphan")
    matches = relationship("JobMatch", back_populates="user_profile", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user_profile", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="user_profile", cascade="all, delete-orphan")


class JobPreference(Base, TimestampMixin):
    __tablename__ = "job_preferences"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    target_roles: Mapped[List[str]] = mapped_column(
        JSONB, default=lambda: ["Python Developer", "Backend Developer"], nullable=False
    )
    target_countries: Mapped[List[str]] = mapped_column(
        JSONB, default=lambda: ["India", "Remote"], nullable=False
    )
    work_modes: Mapped[List[str]] = mapped_column(
        JSONB, default=lambda: ["remote", "hybrid", "onsite"], nullable=False
    )
    experience_levels: Mapped[List[str]] = mapped_column(
        JSONB, default=lambda: ["fresher", "junior", "trainee"], nullable=False
    )
    min_salary: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    max_salary: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    min_match_score: Mapped[int] = mapped_column(Integer, default=65, nullable=False)
    posted_within_days: Mapped[Optional[int]] = mapped_column(Integer, default=7, nullable=True)
    auto_apply_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    daily_application_limit: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    weekly_application_limit: Mapped[int] = mapped_column(Integer, default=25, nullable=False)
    excluded_companies: Mapped[List[str]] = mapped_column(JSONB, default=list, nullable=False)

    # Relationships
    user_profile = relationship("UserProfile", back_populates="preferences")
