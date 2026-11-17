import uuid
from typing import Generator
from datetime import datetime, timezone
from sqlalchemy import create_engine, DateTime, MetaData
from sqlalchemy.orm import sessionmaker, DeclarativeBase, Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from backend.app.core.config import settings

# Enforce consistent naming conventions for indexes and constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}
metadata = MetaData(naming_convention=convention)


class Base(DeclarativeBase):
    metadata = metadata


class TimestampMixin:
    """Provides automatic created_at and updated_at timezone-aware timestamps."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


# Database Engine with automatic resilient fallback
def create_app_engine():
    import os
    db_url = settings.DATABASE_URL
    if not db_url.startswith("sqlite"):
        try:
            pg_engine = create_engine(
                db_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
            )
            # Quick connectivity verification
            with pg_engine.connect() as conn:
                pass
            return pg_engine
        except Exception as e:
            os.makedirs("./storage", exist_ok=True)
            fallback_url = "sqlite:///./storage/jobpilot.db"
            import logging
            logging.getLogger("uvicorn.error").warning(
                f"PostgreSQL connection failed ({e}). Resiliently falling back to local SQLite at {fallback_url}."
            )
            return create_engine(
                fallback_url,
                connect_args={"check_same_thread": False},
                pool_pre_ping=True,
            )
    else:
        return create_engine(
            db_url,
            connect_args={"check_same_thread": False},
            pool_pre_ping=True,
        )


engine = create_app_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator:
    """Dependency injection for FastAPI routes."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
