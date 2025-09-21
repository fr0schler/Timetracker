from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    color = Column(String, default="#3B82F6")  # Default blue color

    # Billing
    hourly_rate = Column(Numeric(10, 2), nullable=True)  # EUR per hour
    client_name = Column(String, nullable=True)

    # Project settings
    is_billable = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    # Relationships
    owner = relationship("User", back_populates="projects")
    organization = relationship("Organization", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
    time_entries = relationship("TimeEntry", back_populates="project", cascade="all, delete-orphan")

    @property
    def total_time_seconds(self) -> int:
        """Calculate total time tracked for this project"""
        return sum(entry.duration_seconds for entry in self.time_entries if entry.end_time)

    @property
    def total_revenue(self) -> float:
        """Calculate total revenue if billable"""
        if not self.is_billable or not self.hourly_rate:
            return 0.0
        hours = self.total_time_seconds / 3600
        return float(self.hourly_rate) * hours