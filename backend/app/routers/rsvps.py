from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload
from datetime import datetime
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.event import Event, EventFoodItem, EventStatus
from app.models.rsvp import RSVP, RSVPStatus
from app.schemas.rsvp import RSVPCreate, RSVPResponse, RSVPUpdate, RSVPStatusUpdate, RSVPWithEventResponse
from app.auth import get_current_user
from app.config import get_settings

router = APIRouter(prefix="/api/rsvps", tags=["RSVPs"])
settings = get_settings()


@router.post("/", response_model=RSVPResponse, status_code=status.HTTP_201_CREATED)
async def create_rsvp(
    rsvp_data: RSVPCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """RSVP to an event"""
    # Get the event
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.rsvps), selectinload(Event.food_items))
        .where(Event.id == rsvp_data.event_id)
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    # Check event status
    if event.status != EventStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot RSVP to event with status: {event.status}"
        )

    # Check RSVP deadline
    if datetime.utcnow() > event.rsvp_deadline:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RSVP deadline has passed"
        )

    # Check if user already RSVP'd
    existing_rsvp = next(
        (r for r in event.rsvps if r.user_id == current_user.id and r.status not in [RSVPStatus.CANCELLED.value, RSVPStatus.DECLINED.value]),
        None
    )
    if existing_rsvp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already RSVP'd to this event"
        )

    # Check if user is the host
    if event.host_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hosts cannot RSVP to their own events"
        )

    # Check available spots
    if event.available_spots < rsvp_data.guest_count:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not enough spots available. Available: {event.available_spots}"
        )

    # If claiming a food item, validate it
    if rsvp_data.food_item_id:
        food_item = next(
            (fi for fi in event.food_items if fi.id == rsvp_data.food_item_id),
            None
        )
        if not food_item:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Food item not found for this event"
            )
        if food_item.is_fully_claimed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This food item has already been fully claimed"
            )
        # Increment claimed count
        food_item.quantity_claimed += 1

    # Create the RSVP
    new_rsvp = RSVP(
        user_id=current_user.id,
        event_id=event.id,
        guest_count=rsvp_data.guest_count,
        message=rsvp_data.message,
        food_item_id=rsvp_data.food_item_id,
        bringing_food_item=rsvp_data.bringing_food_item,
        food_notes=rsvp_data.food_notes,
        status=RSVPStatus.PENDING.value,
    )

    db.add(new_rsvp)
    await db.commit()
    await db.refresh(new_rsvp)

    return RSVPResponse(
        id=new_rsvp.id,
        user_id=new_rsvp.user_id,
        event_id=new_rsvp.event_id,
        status=new_rsvp.status,
        guest_count=new_rsvp.guest_count,
        message=new_rsvp.message,
        bringing_food_item=new_rsvp.bringing_food_item,
        food_notes=new_rsvp.food_notes,
        food_item_id=new_rsvp.food_item_id,
        is_reserved=new_rsvp.is_reserved,
        created_at=new_rsvp.created_at,
        confirmed_at=new_rsvp.confirmed_at,
        user_username=current_user.username,
        user_trust_score=current_user.trust_score,
        user_reliability=current_user.reliability_percentage,
    )


@router.get("/my-rsvps", response_model=List[RSVPWithEventResponse])
async def get_my_rsvps(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all RSVPs for the current user"""
    result = await db.execute(
        select(RSVP)
        .options(selectinload(RSVP.event))
        .where(RSVP.user_id == current_user.id)
        .order_by(RSVP.created_at.desc())
    )
    rsvps = result.scalars().all()

    return [
        RSVPWithEventResponse(
            id=r.id,
            user_id=r.user_id,
            event_id=r.event_id,
            status=r.status,
            guest_count=r.guest_count,
            message=r.message,
            bringing_food_item=r.bringing_food_item,
            food_notes=r.food_notes,
            food_item_id=r.food_item_id,
            is_reserved=r.is_reserved,
            created_at=r.created_at,
            confirmed_at=r.confirmed_at,
            event_title=r.event.title if r.event else None,
            event_date=r.event.event_date if r.event else None,
            event_location=r.event.location_name if r.event else None,
            event_status=r.event.status if r.event else None,
        )
        for r in rsvps
    ]


@router.get("/event/{event_id}", response_model=List[RSVPResponse])
async def get_event_rsvps(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all RSVPs for an event (host only sees full details, guests see limited info)"""
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    result = await db.execute(
        select(RSVP)
        .options(selectinload(RSVP.user))
        .where(RSVP.event_id == event_id)
        .order_by(RSVP.created_at)
    )
    rsvps = result.scalars().all()

    is_host = event.host_id == current_user.id

    return [
        RSVPResponse(
            id=r.id,
            user_id=r.user_id,
            event_id=r.event_id,
            status=r.status,
            guest_count=r.guest_count,
            message=r.message if is_host else None,
            bringing_food_item=r.bringing_food_item,
            food_notes=r.food_notes,
            food_item_id=r.food_item_id,
            is_reserved=r.is_reserved,
            created_at=r.created_at,
            confirmed_at=r.confirmed_at,
            user_username=r.user.username if r.user else None,
            user_trust_score=r.user.trust_score if r.user and is_host else None,
            user_reliability=r.user.reliability_percentage if r.user and is_host else None,
        )
        for r in rsvps
    ]


@router.patch("/{rsvp_id}", response_model=RSVPResponse)
async def update_rsvp(
    rsvp_id: int,
    rsvp_update: RSVPUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an RSVP (guest only, before event)"""
    result = await db.execute(
        select(RSVP)
        .options(selectinload(RSVP.event), selectinload(RSVP.user))
        .where(RSVP.id == rsvp_id)
    )
    rsvp = result.scalar_one_or_none()

    if not rsvp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP not found"
        )

    if rsvp.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update your own RSVPs"
        )

    if rsvp.status in [RSVPStatus.CANCELLED.value, RSVPStatus.ATTENDED.value, RSVPStatus.NO_SHOW.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot update RSVP with status: {rsvp.status}"
        )

    # Update fields
    update_data = rsvp_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rsvp, field, value)

    await db.commit()
    await db.refresh(rsvp)

    return RSVPResponse(
        id=rsvp.id,
        user_id=rsvp.user_id,
        event_id=rsvp.event_id,
        status=rsvp.status,
        guest_count=rsvp.guest_count,
        message=rsvp.message,
        bringing_food_item=rsvp.bringing_food_item,
        food_notes=rsvp.food_notes,
        food_item_id=rsvp.food_item_id,
        is_reserved=rsvp.is_reserved,
        created_at=rsvp.created_at,
        confirmed_at=rsvp.confirmed_at,
        user_username=current_user.username,
        user_trust_score=current_user.trust_score,
        user_reliability=current_user.reliability_percentage,
    )


@router.post("/{rsvp_id}/cancel", response_model=RSVPResponse)
async def cancel_rsvp(
    rsvp_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel an RSVP (guest only)"""
    result = await db.execute(
        select(RSVP)
        .options(selectinload(RSVP.event), selectinload(RSVP.food_item))
        .where(RSVP.id == rsvp_id)
    )
    rsvp = result.scalar_one_or_none()

    if not rsvp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP not found"
        )

    if rsvp.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own RSVPs"
        )

    if rsvp.status in [RSVPStatus.CANCELLED.value, RSVPStatus.ATTENDED.value, RSVPStatus.NO_SHOW.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel RSVP with status: {rsvp.status}"
        )

    rsvp.status = RSVPStatus.CANCELLED.value

    # Release the food item claim
    if rsvp.food_item:
        rsvp.food_item.quantity_claimed = max(0, rsvp.food_item.quantity_claimed - 1)

    await db.commit()
    await db.refresh(rsvp)

    return RSVPResponse(
        id=rsvp.id,
        user_id=rsvp.user_id,
        event_id=rsvp.event_id,
        status=rsvp.status,
        guest_count=rsvp.guest_count,
        message=rsvp.message,
        bringing_food_item=rsvp.bringing_food_item,
        food_notes=rsvp.food_notes,
        food_item_id=rsvp.food_item_id,
        is_reserved=rsvp.is_reserved,
        created_at=rsvp.created_at,
        confirmed_at=rsvp.confirmed_at,
        user_username=current_user.username,
        user_trust_score=current_user.trust_score,
        user_reliability=current_user.reliability_percentage,
    )


@router.post("/{rsvp_id}/status", response_model=RSVPResponse)
async def update_rsvp_status(
    rsvp_id: int,
    status_update: RSVPStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update RSVP status (host only for confirm/decline/attended/no_show)"""
    result = await db.execute(
        select(RSVP)
        .options(selectinload(RSVP.event), selectinload(RSVP.user))
        .where(RSVP.id == rsvp_id)
    )
    rsvp = result.scalar_one_or_none()

    if not rsvp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="RSVP not found"
        )

    # Check if current user is the host
    if rsvp.event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can update RSVP status"
        )

    new_status = status_update.status.lower()

    # Validate status transition
    valid_statuses = ["confirmed", "declined", "attended", "no_show"]
    if new_status not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of: {valid_statuses}"
        )

    # Handle attended/no_show - update user stats
    if new_status == "attended":
        rsvp.mark_attended()
        rsvp.user.events_attended += 1
        rsvp.user.trust_score += settings.successful_event_bonus

    elif new_status == "no_show":
        rsvp.mark_no_show()
        rsvp.user.flake_count += 1
        rsvp.user.trust_score = max(0, rsvp.user.trust_score - settings.flake_penalty)

    elif new_status == "confirmed":
        rsvp.confirm()

    else:
        rsvp.status = new_status

    await db.commit()
    await db.refresh(rsvp)

    return RSVPResponse(
        id=rsvp.id,
        user_id=rsvp.user_id,
        event_id=rsvp.event_id,
        status=rsvp.status,
        guest_count=rsvp.guest_count,
        message=rsvp.message,
        bringing_food_item=rsvp.bringing_food_item,
        food_notes=rsvp.food_notes,
        food_item_id=rsvp.food_item_id,
        is_reserved=rsvp.is_reserved,
        created_at=rsvp.created_at,
        confirmed_at=rsvp.confirmed_at,
        user_username=rsvp.user.username,
        user_trust_score=rsvp.user.trust_score,
        user_reliability=rsvp.user.reliability_percentage,
    )
