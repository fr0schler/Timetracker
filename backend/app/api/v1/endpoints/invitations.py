from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.database import get_db
from ....core.deps import get_current_user, get_current_organization
from ....models.user import User
from ....models.organization import Organization
from ....models.organization_member import MemberRole
from ....schemas.invitation import (
    InvitationCreate,
    InvitationResponse,
    InvitationAccept,
    InvitationListResponse
)
from ....services.invitation_service import InvitationService

router = APIRouter()


@router.post("/", response_model=InvitationResponse)
async def create_invitation(
    invitation_data: InvitationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization: Organization = Depends(get_current_organization)
):
    """Create a new user invitation (Admin/Owner only)"""

    # Check if user has permission to invite members
    user_membership = next(
        (m for m in current_user.organization_memberships
         if m.organization_id == organization.id and m.is_active),
        None
    )

    if not user_membership or not user_membership.can_manage_members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners can invite members"
        )

    invitation = await InvitationService.create_invitation(
        db=db,
        invitation_data=invitation_data,
        organization_id=organization.id,
        invited_by_id=current_user.id
    )

    return invitation


@router.get("/", response_model=List[InvitationListResponse])
async def get_invitations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization: Organization = Depends(get_current_organization)
):
    """Get all invitations for the organization (Admin/Owner only)"""

    # Check permissions
    user_membership = next(
        (m for m in current_user.organization_memberships
         if m.organization_id == organization.id and m.is_active),
        None
    )

    if not user_membership or not user_membership.can_manage_members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners can view invitations"
        )

    invitations = await InvitationService.get_organization_invitations(
        db=db,
        organization_id=organization.id
    )

    # Transform to response format
    return [
        InvitationListResponse(
            id=inv.id,
            email=inv.email,
            role=inv.role,
            status=inv.status,
            created_at=inv.created_at,
            expires_at=inv.expires_at,
            invited_by_name=inv.invited_by.full_name or inv.invited_by.email
        )
        for inv in invitations
    ]


@router.post("/{invitation_id}/cancel")
async def cancel_invitation(
    invitation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    organization: Organization = Depends(get_current_organization)
):
    """Cancel an invitation (Admin/Owner only)"""

    # Check permissions
    user_membership = next(
        (m for m in current_user.organization_memberships
         if m.organization_id == organization.id and m.is_active),
        None
    )

    if not user_membership or not user_membership.can_manage_members:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organization owners can cancel invitations"
        )

    invitation = await InvitationService.cancel_invitation(
        db=db,
        invitation_id=invitation_id,
        organization_id=organization.id
    )

    return {"message": "Invitation cancelled successfully"}


# Public endpoint for accepting invitations
@router.post("/accept", response_model=dict)
async def accept_invitation(
    invitation_data: InvitationAccept,
    db: AsyncSession = Depends(get_db)
):
    """Accept an invitation and create/join organization"""

    user = await InvitationService.accept_invitation(
        db=db,
        invitation_data=invitation_data
    )

    return {
        "message": "Invitation accepted successfully",
        "user_id": user.id,
        "email": user.email
    }


# Public endpoint for getting invitation details
@router.get("/token/{token}")
async def get_invitation_details(
    token: str,
    db: AsyncSession = Depends(get_db)
):
    """Get invitation details by token (public endpoint)"""

    invitation = await InvitationService.get_invitation_by_token(db, token)

    if not invitation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found"
        )

    if not invitation.can_be_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation has expired or is no longer valid"
        )

    return {
        "email": invitation.email,
        "organization_name": invitation.organization.name,
        "role": invitation.role,
        "invited_by": invitation.invited_by.full_name or invitation.invited_by.email,
        "expires_at": invitation.expires_at
    }