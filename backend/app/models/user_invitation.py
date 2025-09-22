from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
import secrets
from ..core.database import Base


class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class UserInvitation(Base):
    __tablename__ = "user_invitations"

    id = Column(Integer, primary_key=True, index=True)

    # Basic invitation info
    email = Column(String, nullable=False, index=True)
    token = Column(String, unique=True, index=True, nullable=False)
    status = Column(SQLEnum(InvitationStatus), default=InvitationStatus.PENDING)

    # Foreign Keys
    organization_id = Column(Integer, ForeignKey("organizations.id"), nullable=False)
    invited_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Role to assign when invitation is accepted
    role = Column(String, default="member")  # Will use MemberRole enum values

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=False)
    accepted_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    organization = relationship("Organization", back_populates="invitations")
    invited_by = relationship("User", back_populates="sent_invitations")

    @classmethod
    def generate_token(cls) -> str:
        """Generate a secure random token for the invitation"""
        return secrets.token_urlsafe(32)

    @property
    def is_expired(self) -> bool:
        """Check if invitation has expired"""
        return func.now() > self.expires_at

    @property
    def can_be_accepted(self) -> bool:
        """Check if invitation can still be accepted"""
        return (self.status == InvitationStatus.PENDING and
                not self.is_expired)