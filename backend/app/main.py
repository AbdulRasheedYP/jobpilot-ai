from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    import uuid
    from backend.app.core.database import Base, engine, SessionLocal
    import backend.app.models  # noqa: F401 - register models
    Base.metadata.create_all(bind=engine)

    # Auto-seed initial user and sources if empty (Single-User Personal Agent)
    db = SessionLocal()
    try:
        from backend.app.models.user_profile import UserProfile
        from backend.app.models.job_preference import JobPreference
        from backend.app.models.job import JobSource
        from backend.app.core.security import get_password_hash

        user = db.query(UserProfile).first()
        if not user:
            user = UserProfile(
                id=uuid.uuid4(),
                email="candidate@jobpilot.ai",
                hashed_password=get_password_hash("password123"),
                full_name="Candidate User",
                current_title="Software Engineer",
                skills=["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Git"],
                experience_years=2.0,
                education="B.Tech Computer Science",
                location="Bangalore, India",
                sponsorship_required=False,
                notice_period_days=0,
            )
            db.add(user)
            db.flush()

            pref = JobPreference(
                id=uuid.uuid4(),
                user_profile_id=user.id,
                target_roles=["Software Engineer", "Python Developer", "Full Stack Developer", "Backend Developer"],
                min_salary=500000,
                preferred_currency="INR",
                locations=["Bangalore", "Kochi", "Remote"],
                remote_only=False,
                excluded_companies=[],
                min_match_score=60.0,
                auto_apply_enabled=True,
                daily_application_limit=10,
            )
            db.add(pref)

        if not db.query(JobSource).filter(JobSource.code == "arbeitnow").first():
            db.add(JobSource(
                id=uuid.uuid4(),
                name="Arbeitnow Jobs",
                code="arbeitnow",
                adapter_class="ArbeitnowAdapter",
                is_enabled=True,
                permits_auto_apply=False,
            ))
        if not db.query(JobSource).filter(JobSource.code == "mock_portal").first():
            db.add(JobSource(
                id=uuid.uuid4(),
                name="Mock Career Portal",
                code="mock_portal",
                adapter_class="MockPortalAdapter",
                is_enabled=True,
                permits_auto_apply=True,
            ))
        db.commit()
    except Exception:
        db.rollback()
    finally:
        db.close()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="JobPilot AI - Personal Autonomous Job Application Agent Backend",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API v1 Routers
from backend.app.api.v1.api import api_router
from backend.app.api.v1.endpoints.mock_portal import router as mock_portal_router

app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(mock_portal_router)


@app.get(f"{settings.API_V1_PREFIX}/health", status_code=status.HTTP_200_OK, tags=["System"])
async def health_check():
    """
    System Health & Readiness endpoint.
    Verifies API availability and core system settings.
    """
    return {
        "status": "healthy",
        "app_name": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "llm_provider": settings.LLM_PROVIDER,
        "llm_status": "ready",
        "api_prefix": settings.API_V1_PREFIX,
    }


@app.get("/", include_in_schema=False)
async def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API. Visit /docs for Swagger documentation.",
        "health": f"{settings.API_V1_PREFIX}/health",
    }
