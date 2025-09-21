from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from ..core.database import Base


class MemberRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class OrganizationMember(Base):
    __tablename__ = "organization_members"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)

    # Member settings
    role = Column(SQLEnum(MemberRole), default=MemberRole.MEMBER)
    is_active = Column(Boolean, default=True)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="organization_memberships")
    organization = relationship("Organization", back_populates="members")

    @property
    def is_owner(self) -> bool:
        return self.role == MemberRole.OWNER

    @property
    def is_admin(self) -> bool:
        return self.role in [MemberRole.OWNER, MemberRole.ADMIN]

    @property
    def can_manage_projects(self) -> bool:
        return self.is_admin

    @property
    def can_manage_members(self) -> bool:
        return self.is_owner