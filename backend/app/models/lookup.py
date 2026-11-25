import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy import String, Boolean, Integer, JSON, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.core.database import Base


class MasterLookup(Base):
    """
    Enterprise Master Data & Taxonomy lookup table.
    Stores reference options for roles, skills, locations, work modes, and date freshness.
    """
    __tablename__ = "master_lookups"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    category: Mapped[str] = mapped_column(String(50), index=True)  # 'role', 'skill', 'location', 'work_mode', 'date_freshness'
    value: Mapped[str] = mapped_column(String(100), index=True)
    label: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
