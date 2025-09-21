from sqlalchemy import Boolean, Column, Integer, String, DateTime, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from ..core.database import Base


class SubscriptionTier(str, Enum):
    FREE = "free"
    PROFESSIONAL = "professional"
    ENTERPRISE = "enterprise"


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)  # for URL routing
    description = Column(Text, nullable=True)

    # Subscription
    subscription_tier = Column(SQLEnum(SubscriptionTier), default=SubscriptionTier.FREE)
    subscription_expires_at = Column(DateTime(timezone=True), nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)

    # Limits
    max_users = Column(Integer, default=1)  # Free: 1, Pro: 10, Enterprise: unlimited
    max_projects = Column(Integer, default=3)  # Free: 3, Pro: unlimited

    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    members = relationship("OrganizationMember", back_populates="organization", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="organization", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="organization", cascade="all, delete-orphan")
    time_entries = relationship("TimeEntry", back_populates="organization", cascade="all, delete-orphan")

    @property
    def is_subscription_active(self) -> bool:
        """Check if subscription is active"""
        if self.subscription_tier == SubscriptionTier.FREE:
            return True
        return self.subscription_expires_at and self.subscription_expires_at > func.now()

    @property
    def user_count(self) -> int:
        """Current number of users in organization"""
        return len([m for m in self.members if m.is_active])

    @property
    def project_count(self) -> int:
        """Current number of projects in organization"""
        return len([p for p in self.projects if p.is_active])