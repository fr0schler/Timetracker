from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from ..models.task import TaskStatus, TaskPriority


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.NORMAL
    parent_id: Optional[int] = None


class TaskCreate(TaskBase):
    project_id: Optional[int] = None  # Set by the API endpoint


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    parent_id: Optional[int] = None


class Task(TaskBase):
    id: int
    project_id: int
    created_at: datetime
    updated_at: datetime
    subtasks: List["Task"] = []

    class Config:
        from_attributes = True


# Enable forward references
Task.model_rebuild()