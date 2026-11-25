from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, status
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
        from backend.app.models.user_profile import UserProfile, JobPreference
        from backend.app.models.job import JobSource
        from backend.app.core.security import get_password_hash

        user = db.query(UserProfile).first()
        if not user:
            user = UserProfile(
                id=uuid.uuid4(),
                email="candidate@jobpilot.ai",
                hashed_password=get_password_hash("password123"),
                full_name="Candidate User",
                current_location="Bangalore, India",
                skills=["Python", "FastAPI", "React", "PostgreSQL", "Docker", "Git"],
                sponsorship_required=False,
                notice_period_days=0,
            )
            db.add(user)
            db.flush()

            pref = JobPreference(
                id=uuid.uuid4(),
                user_profile_id=user.id,
                target_roles=["Software Engineer", "Python Developer", "Full Stack Developer", "Backend Developer"],
                target_countries=["India", "Remote"],
                work_modes=["remote", "hybrid", "onsite"],
                experience_levels=["fresher", "junior"],
                min_salary=500000,
                currency="INR",
                min_match_score=60,
                auto_apply_enabled=True,
                daily_application_limit=10,
                excluded_companies=[],
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
        if not db.query(JobSource).filter(JobSource.code == "adzuna").first():
            db.add(JobSource(
                id=uuid.uuid4(),
                name="Adzuna Jobs",
                code="adzuna",
                adapter_class="AdzunaAdapter",
                is_enabled=False,
                permits_auto_apply=False,
            ))

        from backend.app.services.lookup_service import seed_master_lookups_if_empty
        seed_master_lookups_if_empty(db)

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

# Security Headers and CSRF Middleware
@app.middleware("http")
async def security_and_csrf_headers_middleware(request: Request, call_next):
    # CSRF Origin validation for state-changing HTTP methods from browsers
    if request.method in ["POST", "PUT", "DELETE", "PATCH"]:
        origin = request.headers.get("origin")
        if origin:
            allowed_origins = [
                o.rstrip("/") for o in settings.ALLOWED_CORS_ORIGINS
            ] + ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://127.0.0.1:5173"]
            if not any(origin.startswith(ao) for ao in allowed_origins):
                from fastapi.responses import JSONResponse
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"detail": "CSRF verification failed: Untrusted Origin"},
                )

    response: Response = await call_next(request)
    # Standard Defense-in-Depth Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response

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
