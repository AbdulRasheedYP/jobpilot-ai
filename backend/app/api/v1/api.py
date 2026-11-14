from fastapi import APIRouter
from backend.app.api.v1.endpoints import (
    auth,
    profile,
    resumes,
    preferences,
    sources,
    jobs,
    matches,
    applications,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(resumes.router)
api_router.include_router(preferences.router)
api_router.include_router(sources.router)
api_router.include_router(jobs.router)
api_router.include_router(matches.router)
api_router.include_router(applications.router)
