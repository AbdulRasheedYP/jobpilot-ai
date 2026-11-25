from typing import List
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
