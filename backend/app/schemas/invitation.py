from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr
from enum import Enum


class InvitationStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    EXPIRED = "expired"
    CANCELLED = "cancelled"


class MemberRole(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"


class InvitationBase(BaseModel):
    email: EmailStr
    role: MemberRole = MemberRole.MEMBER


class InvitationCreate(InvitationBase):
    pass


class InvitationResponse(InvitationBase):
    id: int
    token: str
    status: InvitationStatus
    organization_id: int
    invited_by_id: int
    created_at: datetime
    expires_at: datetime
    accepted_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InvitationAccept(BaseModel):
    token: str
    full_name: str
    password: str


class InvitationUpdate(BaseModel):
    status: Optional[InvitationStatus] = None
    role: Optional[MemberRole] = None


class InvitationListResponse(BaseModel):
    id: int
    email: str
    role: MemberRole
    status: InvitationStatus
    created_at: datetime
    expires_at: datetime
    invited_by_name: str

    class Config:
        from_attributes = True