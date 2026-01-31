from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.event import Event, EventStatus
from app.models.rsvp import RSVP, RSVPStatus
from app.auth import get_current_user

router = APIRouter(prefix="/api/invites", tags=["Invites"])


class InviteCreate(BaseModel):
    event_id: int
    username: Optional[str] = None  # Invite by username


class InviteResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    username: str
    status: str
    invited_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=InviteResponse, status_code=status.HTTP_201_CREATED)
async def create_invite(
    invite_data: InviteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Invite a user to an event (creates a reserved RSVP)"""
    # Get the event
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.rsvps))
        .where(Event.id == invite_data.event_id)
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check if user is the host
    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can invite guests"
        )

    # Check event status
    if event.status not in [EventStatus.DRAFT.value, EventStatus.OPEN.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot invite to this event"
        )

    # Find the user to invite
    if invite_data.username:
        result = await db.execute(
            select(User).where(User.username == invite_data.username)
        )
        invitee = result.scalar_one_or_none()
        if not invitee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is required"
        )

    # Check if user is already invited/RSVP'd
    existing = next(
        (r for r in event.rsvps if r.user_id == invitee.id and r.status not in [RSVPStatus.CANCELLED.value, RSVPStatus.DECLINED.value]),
        None
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already invited or has RSVP'd"
        )

    # Check reserved spots
    reserved_rsvps = len([r for r in event.rsvps if r.is_reserved and r.status not in [RSVPStatus.CANCELLED.value, RSVPStatus.DECLINED.value]])
    if reserved_rsvps >= event.reserved_spots:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No more reserved spots available"
        )

    # Create reserved RSVP
    new_rsvp = RSVP(
        user_id=invitee.id,
        event_id=event.id,
        status=RSVPStatus.PENDING.value,
        is_reserved=True,
        invited_at=datetime.utcnow(),
    )

    db.add(new_rsvp)
    await db.commit()
    await db.refresh(new_rsvp)

    return InviteResponse(
        id=new_rsvp.id,
        user_id=new_rsvp.user_id,
        event_id=new_rsvp.event_id,
        username=invitee.username,
        status=new_rsvp.status,
        invited_at=new_rsvp.invited_at,
    )


@router.get("/event/{event_id}", response_model=List[InviteResponse])
async def get_event_invites(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all invites for an event (host only)"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can view invites"
        )

    result = await db.execute(
        select(RSVP)
        .options(selectinload(RSVP.user))
        .where(RSVP.event_id == event_id, RSVP.is_reserved == True)
    )
    invites = result.scalars().all()

    return [
        InviteResponse(
            id=i.id,
            user_id=i.user_id,
            event_id=i.event_id,
            username=i.user.username,
            status=i.status,
            invited_at=i.invited_at or i.created_at,
        )
        for i in invites
    ]


@router.get("/my-invites", response_model=List[InviteResponse])
async def get_my_invites(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all invites for the current user"""
    result = await db.execute(
        select(RSVP)
        .options(selectinload(RSVP.event))
        .where(
            RSVP.user_id == current_user.id,
            RSVP.is_reserved == True,
            RSVP.status == RSVPStatus.PENDING.value
        )
    )
    invites = result.scalars().all()

    return [
        InviteResponse(
            id=i.id,
            user_id=i.user_id,
            event_id=i.event_id,
            username=current_user.username,
            status=i.status,
            invited_at=i.invited_at or i.created_at,
        )
        for i in invites
    ]


@router.post("/{invite_id}/accept")
async def accept_invite(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Accept an invite"""
    result = await db.execute(
        select(RSVP).where(RSVP.id == invite_id)
    )
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )

    if invite.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invite is not for you"
        )

    if invite.status != RSVPStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite is no longer pending"
        )

    invite.status = RSVPStatus.CONFIRMED.value
    invite.confirmed_at = datetime.utcnow()

    await db.commit()

    return {"message": "Invite accepted", "status": "confirmed"}


@router.post("/{invite_id}/decline")
async def decline_invite(
    invite_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Decline an invite"""
    result = await db.execute(
        select(RSVP).where(RSVP.id == invite_id)
    )
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invite not found"
        )

    if invite.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This invite is not for you"
        )

    if invite.status != RSVPStatus.PENDING.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invite is no longer pending"
        )

    invite.status = RSVPStatus.DECLINED.value

    await db.commit()

    return {"message": "Invite declined", "status": "declined"}
