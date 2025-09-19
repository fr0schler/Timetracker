from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class TimeEntry(Base):
    __tablename__ = "time_entries"

    id = Column(Integer, primary_key=True, index=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=True)  # Null for running entries
    description = Column(Text, nullable=True)

    # Billing
    is_billable = Column(Boolean, default=True)
    hourly_rate = Column(Numeric(10, 2), nullable=True)  # Can override project rate

    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)  # Optional task assignment
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="time_entries")
    project = relationship("Project", back_populates="time_entries")
    task = relationship("Task", back_populates="time_entries")
    organization = relationship("Organization", back_populates="time_entries")

    @property
    def is_running(self) -> bool:
        """Check if this time entry is currently running (no end_time)"""
        return self.end_time is None

    @property
    def duration_seconds(self) -> int:
        """Calculate duration in seconds. Returns 0 for running entries."""
        if self.end_time is None:
            return 0
        delta = self.end_time - self.start_time
        return int(delta.total_seconds())

    @property
    def duration_hours(self) -> float:
        """Calculate duration in hours"""
        return self.duration_seconds / 3600

    @property
    def revenue(self) -> float:
        """Calculate revenue for this time entry"""
        if not self.is_billable:
            return 0.0

        rate = self.hourly_rate or (self.project.hourly_rate if self.project else 0)
        if not rate:
            return 0.0

        return float(rate) * self.duration_hours