import uuid
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Text, ForeignKey, DateTime, Enum as SAEnum, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.app.core.database import Base, TimestampMixin
from backend.app.models.enums import ApplicationStatus


class Application(Base, TimestampMixin):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("job_id", "user_profile_id", name="uq_applications_job_user"),
        Index("idx_applications_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    job_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="RESTRICT"), nullable=False
    )
    user_profile_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profiles.id", ondelete="CASCADE"), nullable=False
    )
    tailored_resume_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("resumes.id", ondelete="SET NULL"), nullable=True
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        SAEnum(ApplicationStatus, name="application_status"),
        default=ApplicationStatus.NOT_STARTED,
        nullable=False,
    )
    submission_method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmation_evidence: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    job = relationship("Job", back_populates="applications")
    user_profile = relationship("UserProfile", back_populates="applications")
    tailored_resume = relationship("Resume", back_populates="applications")
    answers = relationship("ApplicationAnswer", back_populates="application", cascade="all, delete-orphan")

    @property
    def resume_file_name(self) -> Optional[str]:
        if self.tailored_resume and self.tailored_resume.file_name:
            return self.tailored_resume.file_name
        return None

    @property
    def source_name(self) -> Optional[str]:
        if self.job and hasattr(self.job, "source_name"):
            return self.job.source_name
        return None

    @property
    def tailored_resume_text(self) -> Optional[str]:
        if self.tailored_resume:
            if self.tailored_resume.file_name and self.tailored_resume.file_name.lower().endswith(('.pdf', '.docx')):
                facts = self.tailored_resume.parsed_facts or {}
                skills = ", ".join(facts.get("technical_skills", []))
                summary = facts.get("summary", "")
                name = facts.get("full_name") or (self.user_profile.full_name if self.user_profile else "Candidate")
                email = facts.get("email") or (self.user_profile.email if self.user_profile else "")
                phone = facts.get("phone") or (self.user_profile.phone if self.user_profile else "")
                return (
                    f"ATTACHED CANDIDATE RESUME: {self.tailored_resume.file_name}\n"
                    f"Candidate: {name}\n"
                    f"Email: {email}\n"
                    f"Phone: {phone}\n"
                    f"Verified Skills: {skills}\n\n"
                    f"Summary:\n{summary if summary else 'Candidate original verified CV attached directly to application.'}"
                )
            if self.tailored_resume.file_path:
                import os
                try:
                    if os.path.exists(self.tailored_resume.file_path):
                        with open(self.tailored_resume.file_path, "r", encoding="utf-8") as f:
                            return f.read()
                except Exception:
                    pass
        return None


class ApplicationAnswer(Base):
    __tablename__ = "application_answers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False
    )
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    field_type: Mapped[str] = mapped_column(String(50), default="text", nullable=False)
    source_profile_field: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    application = relationship("Application", back_populates="answers")
