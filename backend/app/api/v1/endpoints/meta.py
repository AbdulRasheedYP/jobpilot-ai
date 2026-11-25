from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.api.deps import get_db
from backend.app.schemas.meta import MetaOptionsResponse
from backend.app.services import lookup_service

router = APIRouter(prefix="/meta", tags=["Metadata & Taxonomy"])


@router.get("/options", response_model=MetaOptionsResponse)
def get_meta_options(db: Session = Depends(get_db)):
    """
    Retrieve full dynamic master taxonomy for candidate settings and autocomplete.
    Served directly from database tables (roles, locations, skills, work modes, date freshness).
    """
    return lookup_service.get_meta_options(db=db)
