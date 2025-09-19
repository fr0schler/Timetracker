from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from ..core.database import Base


class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class TaskPriority(str, Enum):
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # Status and priority
    status = Column(SQLEnum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(SQLEnum(TaskPriority), default=TaskPriority.NORMAL)

    # Hierarchy
    parent_task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    position = Column(Integer, default=0)  # For ordering within project

    # Timestamps
    due_date = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Foreign Keys
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Relationships
    project = relationship("Project", back_populates="tasks")
    organization = relationship("Organization", back_populates="tasks")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id], back_populates="assigned_tasks")
    created_by = relationship("User", foreign_keys=[created_by_id], back_populates="created_tasks")

    # Self-referential relationship for subtasks
    parent_task = relationship("Task", remote_side=[id], back_populates="subtasks")
    subtasks = relationship("Task", back_populates="parent_task", cascade="all, delete-orphan")

    # Time entries
    time_entries = relationship("TimeEntry", back_populates="task", cascade="all, delete-orphan")

    @property
    def is_completed(self) -> bool:
        """Check if task is completed"""
        return self.status == TaskStatus.DONE

    @property
    def total_time_seconds(self) -> int:
        """Calculate total time tracked for this task"""
        return sum(entry.duration_seconds for entry in self.time_entries if entry.end_time)

    @property
    def total_time_hours(self) -> float:
        """Calculate total time in hours"""
        return self.total_time_seconds / 3600

    @property
    def completion_percentage(self) -> float:
        """Calculate completion percentage based on subtasks"""
        if not self.subtasks:
            return 100.0 if self.is_completed else 0.0

        completed_subtasks = sum(1 for subtask in self.subtasks if subtask.is_completed)
        return (completed_subtasks / len(self.subtasks)) * 100

    def mark_completed(self):
        """Mark task as completed"""
        self.status = TaskStatus.DONE
        self.completed_at = func.now()

    def mark_in_progress(self):
        """Mark task as in progress"""
        self.status = TaskStatus.IN_PROGRESS