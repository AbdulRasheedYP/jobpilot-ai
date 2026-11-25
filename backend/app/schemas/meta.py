from typing import List, Dict, Optional
from pydantic import BaseModel


class DateFreshnessOption(BaseModel):
    days: int
    label: str


class MetaOptionsResponse(BaseModel):
    roles: List[str]
    locations: List[str]
    skills: List[str]
    work_modes: List[str]
    date_freshness: List[DateFreshnessOption]
    role_categories: Optional[Dict[str, List[str]]] = None
    level_variations: Optional[List[str]] = None
