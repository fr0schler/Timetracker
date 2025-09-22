from sqlalchemy import Boolean, Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)

    # User preferences
    timezone = Column(String, default="UTC")
    keyboard_shortcuts_enabled = Column(Boolean, default=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization_memberships = relationship("OrganizationMember", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")
    assigned_tasks = relationship("Task", foreign_keys="Task.assigned_to_id", back_populates="assigned_to")
    created_tasks = relationship("Task", foreign_keys="Task.created_by_id", back_populates="created_by")
    time_entries = relationship("TimeEntry", back_populates="user", cascade="all, delete-orphan")
    sent_invitations = relationship("UserInvitation", back_populates="invited_by", cascade="all, delete-orphan")

    @property
    def current_organization(self):
        """Get user's primary organization"""
        active_membership = next((m for m in self.organization_memberships if m.is_active), None)
        return active_membership.organization if active_membership else None

    @property
    def is_organization_owner(self) -> bool:
        """Check if user owns current organization"""
        org = self.current_organization
        if not org:
            return False
        membership = next((m for m in self.organization_memberships if m.organization_id == org.id), None)
        return membership and membership.is_owner