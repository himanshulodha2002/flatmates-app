"""
Household management endpoints.
"""

import secrets
import uuid
from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.models.user import User
from app.models.household import (
    Household,
    HouseholdMember,
    HouseholdInvite,
    MemberRole,
    InviteStatus,
)
from app.schemas.household import (
    HouseholdCreate,
    HouseholdResponse,
    HouseholdWithMembers,
    InviteCreate,
    InviteResponse,
    JoinHouseholdRequest,
    MemberRoleUpdate,
    MemberWithUser,
)
from app.core.database import utc_now

router = APIRouter()


def get_current_household(
    household_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Household:
    """
    Dependency to get current household and verify user membership.

    Args:
        household_id: ID of the household
        current_user: Current authenticated user
        db: Database session

    Returns:
        Household object if user is a member

    Raises:
        HTTPException: If household not found or user not a member
    """
    household = db.query(Household).filter(Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Household not found")

    # Check if user is a member
    member = (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.household_id == household_id, HouseholdMember.user_id == current_user.id
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this household"
        )

    return household


def check_owner_permission(
    household_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> HouseholdMember:
    """
    Dependency to check if user is owner of the household.

    Args:
        household_id: ID of the household
        current_user: Current authenticated user
        db: Database session

    Returns:
        HouseholdMember object if user is owner

    Raises:
        HTTPException: If user is not owner
    """
    member = (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.household_id == household_id, HouseholdMember.user_id == current_user.id
        )
        .first()
    )

    if not member or member.role != MemberRole.OWNER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only household owners can perform this action",
        )

    return member


@router.post("/", response_model=HouseholdResponse, status_code=status.HTTP_201_CREATED)
def create_household(
    household_data: HouseholdCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a new household.
    Current user becomes the owner.

    Note: Each user can only be in one household at a time.
    """
    # Check if user is already in a household
    existing_membership = (
        db.query(HouseholdMember).filter(HouseholdMember.user_id == current_user.id).first()
    )

    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already in a household. Please leave your current household first.",
        )

    # Create household
    household = Household(name=household_data.name, created_by=current_user.id)
    db.add(household)
    db.flush()

    # Add creator as owner
    member = HouseholdMember(
        user_id=current_user.id, household_id=household.id, role=MemberRole.OWNER
    )
    db.add(member)
    db.commit()
    db.refresh(household)

    return HouseholdResponse(
        id=household.id,
        name=household.name,
        created_by=household.created_by,
        created_at=household.created_at,
        member_count=1,
    )


@router.get("/mine", response_model=List[HouseholdResponse])
def list_my_households(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    List all households for current user.
    """
    # Get all household memberships for user
    memberships = db.query(HouseholdMember).filter(HouseholdMember.user_id == current_user.id).all()

    households = []
    for membership in memberships:
        household = membership.household
        member_count = (
            db.query(HouseholdMember).filter(HouseholdMember.household_id == household.id).count()
        )

        households.append(
            HouseholdResponse(
                id=household.id,
                name=household.name,
                created_by=household.created_by,
                created_at=household.created_at,
                member_count=member_count,
            )
        )

    return households


@router.get("/{household_id}", response_model=HouseholdWithMembers)
def get_household_details(
    household: Household = Depends(get_current_household), db: Session = Depends(get_db)
):
    """
    Get household details with members list.
    """
    # Get all members with user details
    members = db.query(HouseholdMember).filter(HouseholdMember.household_id == household.id).all()

    members_with_users = []
    for member in members:
        user = member.user
        members_with_users.append(
            MemberWithUser(
                id=member.id,
                user_id=member.user_id,
                role=member.role,
                joined_at=member.joined_at,
                email=user.email,
                full_name=user.full_name,
                profile_picture_url=user.profile_picture_url,
            )
        )

    return HouseholdWithMembers(
        id=household.id,
        name=household.name,
        created_by=household.created_by,
        created_at=household.created_at,
        members=members_with_users,
    )


@router.get("/{household_id}/invites", response_model=List[InviteResponse])
def list_invites(
    household_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: Household = Depends(get_current_household),
):
    """
    List all pending invites for a household.
    Any member can view invites.
    """
    invites = (
        db.query(HouseholdInvite)
        .filter(
            HouseholdInvite.household_id == household_id,
            HouseholdInvite.status == InviteStatus.PENDING,
            HouseholdInvite.expires_at > utc_now(),
        )
        .all()
    )

    return [
        InviteResponse(
            id=invite.id,
            household_id=invite.household_id,
            email=invite.email,
            token=invite.token,
            status=invite.status,
            expires_at=invite.expires_at,
            created_at=invite.created_at,
        )
        for invite in invites
    ]


@router.post("/{household_id}/invite", response_model=InviteResponse)
def create_invite(
    household_id: uuid.UUID,
    invite_data: InviteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: HouseholdMember = Depends(check_owner_permission),
):
    """
    Create an invite to the household.
    Only owners can create invites.
    """
    # Check if user with email already is a member
    existing_user = db.query(User).filter(User.email == invite_data.email).first()
    if existing_user:
        existing_member = (
            db.query(HouseholdMember)
            .filter(
                HouseholdMember.user_id == existing_user.id,
                HouseholdMember.household_id == household_id,
            )
            .first()
        )
        if existing_member:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already a member of this household",
            )

    # Check if there's already a pending invite for this email
    existing_invite = (
        db.query(HouseholdInvite)
        .filter(
            HouseholdInvite.household_id == household_id,
            HouseholdInvite.email == invite_data.email,
            HouseholdInvite.status == InviteStatus.PENDING,
            HouseholdInvite.expires_at > utc_now(),
        )
        .first()
    )

    if existing_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An active invite already exists for this email",
        )

    # Generate unique token
    token = secrets.token_urlsafe(32)

    # Create invite
    invite = HouseholdInvite(
        household_id=household_id,
        email=invite_data.email,
        token=token,
        status=InviteStatus.PENDING,
        expires_at=utc_now() + timedelta(days=7),
        created_by=current_user.id,
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    return InviteResponse(
        id=invite.id,
        household_id=invite.household_id,
        email=invite.email,
        token=invite.token,
        status=invite.status,
        expires_at=invite.expires_at,
        created_at=invite.created_at,
    )


@router.delete("/{household_id}/invites/{invite_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_invite(
    household_id: uuid.UUID,
    invite_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: HouseholdMember = Depends(check_owner_permission),
):
    """
    Cancel a pending invite.
    Only owners can cancel invites.
    """
    invite = (
        db.query(HouseholdInvite)
        .filter(
            HouseholdInvite.id == invite_id,
            HouseholdInvite.household_id == household_id,
        )
        .first()
    )

    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invite not found")

    if invite.status != InviteStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only cancel pending invites",
        )

    # Mark as expired instead of deleting for audit trail
    invite.status = InviteStatus.EXPIRED
    db.commit()

    return None


@router.post("/join", response_model=HouseholdResponse)
def join_household(
    join_data: JoinHouseholdRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Join a household using an invite token.

    Note: Each user can only be in one household at a time.
    """
    # Check if user is already in any household
    existing_membership = (
        db.query(HouseholdMember).filter(HouseholdMember.user_id == current_user.id).first()
    )

    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already in a household. Please leave your current household first.",
        )

    # Find invite
    invite = db.query(HouseholdInvite).filter(HouseholdInvite.token == join_data.token).first()

    if not invite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite token")

    # Check if already accepted
    if invite.status == InviteStatus.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invite has already been used"
        )

    # Check if expired
    if invite.status == InviteStatus.EXPIRED or invite.expires_at < utc_now():
        invite.status = InviteStatus.EXPIRED
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invite has expired")

    # Check if email matches (optional - you may want to remove this check)
    if invite.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This invite is for a different email address",
        )

    # Add user as member
    member = HouseholdMember(
        user_id=current_user.id, household_id=invite.household_id, role=MemberRole.MEMBER
    )
    db.add(member)

    # Mark invite as accepted
    invite.status = InviteStatus.ACCEPTED
    db.commit()

    # Get household details
    household = db.query(Household).filter(Household.id == invite.household_id).first()
    member_count = (
        db.query(HouseholdMember).filter(HouseholdMember.household_id == household.id).count()
    )

    return HouseholdResponse(
        id=household.id,
        name=household.name,
        created_by=household.created_by,
        created_at=household.created_at,
        member_count=member_count,
    )


@router.patch("/{household_id}/members/{member_id}", response_model=MemberWithUser)
def update_member_role(
    household_id: uuid.UUID,
    member_id: uuid.UUID,
    role_data: MemberRoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: HouseholdMember = Depends(check_owner_permission),
):
    """
    Update a member's role.
    Only owners can update roles.
    """
    # Get member
    member = (
        db.query(HouseholdMember)
        .filter(HouseholdMember.id == member_id, HouseholdMember.household_id == household_id)
        .first()
    )

    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # Don't allow removing the last owner
    if member.role == MemberRole.OWNER and role_data.role == MemberRole.MEMBER:
        owner_count = (
            db.query(HouseholdMember)
            .filter(
                HouseholdMember.household_id == household_id,
                HouseholdMember.role == MemberRole.OWNER,
            )
            .count()
        )

        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot demote the last owner"
            )

    # Update role
    member.role = role_data.role
    db.commit()
    db.refresh(member)

    # Get user details
    user = member.user
    return MemberWithUser(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        email=user.email,
        full_name=user.full_name,
        profile_picture_url=user.profile_picture_url,
    )


@router.delete("/{household_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    household_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    _: HouseholdMember = Depends(check_owner_permission),
):
    """
    Remove a member from the household.
    Only owners can remove members.
    """
    # Get member
    member = (
        db.query(HouseholdMember)
        .filter(HouseholdMember.id == member_id, HouseholdMember.household_id == household_id)
        .first()
    )

    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # Don't allow removing the last owner
    if member.role == MemberRole.OWNER:
        owner_count = (
            db.query(HouseholdMember)
            .filter(
                HouseholdMember.household_id == household_id,
                HouseholdMember.role == MemberRole.OWNER,
            )
            .count()
        )

        if owner_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove the last owner"
            )

    # Remove member
    db.delete(member)
    db.commit()

    return None


@router.post("/{household_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_household(
    household_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Leave the household.
    If you are the last owner, you cannot leave (must delete household or transfer ownership first).
    """
    # Get current user's membership
    member = (
        db.query(HouseholdMember)
        .filter(
            HouseholdMember.user_id == current_user.id,
            HouseholdMember.household_id == household_id,
        )
        .first()
    )

    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not a member of this household",
        )

    # Check if user is the last owner
    if member.role == MemberRole.OWNER:
        owner_count = (
            db.query(HouseholdMember)
            .filter(
                HouseholdMember.household_id == household_id,
                HouseholdMember.role == MemberRole.OWNER,
            )
            .count()
        )

        if owner_count <= 1:
            # Check if there are other members who could become owner
            total_members = (
                db.query(HouseholdMember)
                .filter(HouseholdMember.household_id == household_id)
                .count()
            )

            if total_members > 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You are the last owner. Please transfer ownership to another member before leaving.",
                )

    # Remove membership
    db.delete(member)

    # If this was the last member, delete the household
    remaining_members = (
        db.query(HouseholdMember)
        .filter(HouseholdMember.household_id == household_id)
        .count()
    )

    if remaining_members == 0:
        household = db.query(Household).filter(Household.id == household_id).first()
        if household:
            db.delete(household)

    db.commit()
    return None
