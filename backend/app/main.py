from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    from backend.app.core.database import Base, engine
    import backend.app.models  # noqa: F401 - register models
    Base.metadata.create_all(bind=engine)
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
