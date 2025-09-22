from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from fastapi import HTTPException, status

from ..models.user_invitation import UserInvitation, InvitationStatus
from ..models.user import User
from ..models.organization import Organization
from ..models.organization_member import OrganizationMember, MemberRole
from ..schemas.invitation import InvitationCreate, InvitationAccept, MemberRole as SchemaMemberRole
from ..core.security import get_password_hash


class InvitationService:

    @staticmethod
    async def create_invitation(
        db: AsyncSession,
        invitation_data: InvitationCreate,
        organization_id: int,
        invited_by_id: int
    ) -> UserInvitation:
        """Create a new user invitation"""

        # Check if user is already a member
        existing_member = await db.execute(
            select(OrganizationMember)
            .join(User)
            .where(
                and_(
                    User.email == invitation_data.email,
                    OrganizationMember.organization_id == organization_id,
                    OrganizationMember.is_active == True
                )
            )
        )
        if existing_member.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this organization"
            )

        # Check if there's already a pending invitation
        existing_invitation = await db.execute(
            select(UserInvitation).where(
                and_(
                    UserInvitation.email == invitation_data.email,
                    UserInvitation.organization_id == organization_id,
                    UserInvitation.status == InvitationStatus.PENDING
                )
            )
        )
        if existing_invitation.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has a pending invitation"
            )

        # Create new invitation
        invitation = UserInvitation(
            email=invitation_data.email,
            token=UserInvitation.generate_token(),
            role=invitation_data.role.value,
            organization_id=organization_id,
            invited_by_id=invited_by_id,
            expires_at=datetime.utcnow() + timedelta(days=7)  # 7 days expiry
        )

        db.add(invitation)
        await db.commit()
        await db.refresh(invitation)

        return invitation

    @staticmethod
    async def get_organization_invitations(
        db: AsyncSession,
        organization_id: int
    ) -> List[UserInvitation]:
        """Get all invitations for an organization"""
        result = await db.execute(
            select(UserInvitation)
            .options(selectinload(UserInvitation.invited_by))
            .where(UserInvitation.organization_id == organization_id)
            .order_by(UserInvitation.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_invitation_by_token(
        db: AsyncSession,
        token: str
    ) -> Optional[UserInvitation]:
        """Get invitation by token"""
        result = await db.execute(
            select(UserInvitation)
            .options(selectinload(UserInvitation.organization))
            .where(UserInvitation.token == token)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def accept_invitation(
        db: AsyncSession,
        invitation_data: InvitationAccept
    ) -> User:
        """Accept an invitation and create/update user account"""

        # Get invitation
        invitation = await InvitationService.get_invitation_by_token(
            db, invitation_data.token
        )
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found"
            )

        if not invitation.can_be_accepted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invitation cannot be accepted (expired or already used)"
            )

        # Check if user already exists
        existing_user = await db.execute(
            select(User).where(User.email == invitation.email)
        )
        user = existing_user.scalar_one_or_none()

        if user:
            # User exists, just add to organization
            if user.is_active:
                # Check if already a member
                existing_membership = await db.execute(
                    select(OrganizationMember).where(
                        and_(
                            OrganizationMember.user_id == user.id,
                            OrganizationMember.organization_id == invitation.organization_id
                        )
                    )
                )
                if existing_membership.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="User is already a member of this organization"
                    )
        else:
            # Create new user
            user = User(
                email=invitation.email,
                full_name=invitation_data.full_name,
                hashed_password=get_password_hash(invitation_data.password),
                is_active=True
            )
            db.add(user)
            await db.flush()  # Get user.id

        # Create organization membership
        membership = OrganizationMember(
            user_id=user.id,
            organization_id=invitation.organization_id,
            role=MemberRole(invitation.role),
            is_active=True
        )
        db.add(membership)

        # Update invitation status
        invitation.status = InvitationStatus.ACCEPTED
        invitation.accepted_at = datetime.utcnow()

        await db.commit()
        await db.refresh(user)

        return user

    @staticmethod
    async def cancel_invitation(
        db: AsyncSession,
        invitation_id: int,
        organization_id: int
    ) -> UserInvitation:
        """Cancel an invitation"""
        invitation = await db.execute(
            select(UserInvitation).where(
                and_(
                    UserInvitation.id == invitation_id,
                    UserInvitation.organization_id == organization_id
                )
            )
        )
        invitation = invitation.scalar_one_or_none()

        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found"
            )

        invitation.status = InvitationStatus.CANCELLED
        await db.commit()
        await db.refresh(invitation)

        return invitation