from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class TimeEntryBase(BaseModel):
    start_time: datetime
    end_time: Optional[datetime] = None
    description: Optional[str] = None
    project_id: int


class TimeEntryCreate(BaseModel):
    project_id: int
    description: Optional[str] = None
    start_time: Optional[datetime] = None  # Will default to now() if not provided


class TimeEntryUpdate(BaseModel):
    end_time: Optional[datetime] = None
    description: Optional[str] = None
    project_id: Optional[int] = None


class TimeEntryInDBBase(TimeEntryBase):
    id: int
    user_id: int
    created_at: datetime
    is_running: bool
    duration_seconds: int

    class Config:
        from_attributes = True


class TimeEntry(TimeEntryInDBBase):
    pass


class TimeEntryInDB(TimeEntryInDBBase):
    pass