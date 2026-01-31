from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from datetime import datetime, timedelta
from typing import List, Optional

from app.database import get_db
from app.models.user import User
from app.models.event import Event, EventFoodItem, EventStatus
from app.models.rsvp import RSVP, RSVPStatus
from app.schemas.event import (
    EventCreate,
    EventResponse,
    EventUpdate,
    EventListResponse,
    FoodItemCreate,
    FoodItemResponse,
)
from app.auth import get_current_user
from app.config import get_settings

router = APIRouter(prefix="/api/events", tags=["Events"])
settings = get_settings()


def event_to_response(event: Event) -> EventResponse:
    """Convert Event model to EventResponse schema"""
    return EventResponse(
        id=event.id,
        title=event.title,
        description=event.description,
        event_date=event.event_date,
        location_name=event.location_name,
        location_address=event.location_address,
        location_notes=event.location_notes,
        max_guests=event.max_guests,
        reserved_spots=event.reserved_spots,
        min_guests=event.min_guests,
        rsvp_deadline=event.rsvp_deadline,
        confirmation_deadline=event.confirmation_deadline,
        status=event.status,
        is_public=event.is_public,
        host_id=event.host_id,
        host_username=event.host.username if event.host else None,
        host_trust_score=event.host.trust_score if event.host else None,
        available_spots=event.available_spots,
        confirmed_guest_count=event.confirmed_guest_count,
        can_be_confirmed=event.can_be_confirmed,
        food_items=[
            FoodItemResponse(
                id=fi.id,
                name=fi.name,
                description=fi.description,
                quantity_needed=fi.quantity_needed,
                quantity_claimed=fi.quantity_claimed,
                is_fully_claimed=fi.is_fully_claimed,
                remaining_needed=fi.remaining_needed,
            )
            for fi in event.food_items
        ],
        created_at=event.created_at,
    )


@router.post("/", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
async def create_event(
    event_data: EventCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new dinner party event"""

    # Check if user can host
    if not current_user.can_host:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Your trust score ({current_user.trust_score}) is too low to host events. Minimum required: {settings.min_trust_score_to_host}"
        )

    # Validate dates
    if event_data.event_date <= datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Event date must be in the future"
        )

    if event_data.rsvp_deadline >= event_data.event_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="RSVP deadline must be before the event date"
        )

    if event_data.reserved_spots > event_data.max_guests:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reserved spots cannot exceed max guests"
        )

    # Calculate confirmation deadline (X days before event)
    confirmation_deadline = event_data.event_date - timedelta(
        days=settings.min_days_before_event_to_confirm
    )

    # Create the event
    new_event = Event(
        title=event_data.title,
        description=event_data.description,
        event_date=event_data.event_date,
        location_name=event_data.location_name,
        location_address=event_data.location_address,
        location_notes=event_data.location_notes,
        max_guests=event_data.max_guests,
        reserved_spots=event_data.reserved_spots,
        min_guests=event_data.min_guests,
        rsvp_deadline=event_data.rsvp_deadline,
        confirmation_deadline=confirmation_deadline,
        is_public=event_data.is_public,
        host_id=current_user.id,
        status=EventStatus.OPEN.value,
    )

    db.add(new_event)
    await db.flush()  # Get the event ID

    # Add food items
    for food_item in event_data.food_items:
        new_food_item = EventFoodItem(
            event_id=new_event.id,
            name=food_item.name,
            description=food_item.description,
            quantity_needed=food_item.quantity_needed,
        )
        db.add(new_food_item)

    await db.commit()

    # Reload with relationships
    result = await db.execute(
        select(Event)
        .options(selectinload(Event.host), selectinload(Event.food_items), selectinload(Event.rsvps))
        .where(Event.id == new_event.id)
    )
    event = result.scalar_one()

    return event_to_response(event)


@router.get("/", response_model=List[EventListResponse])
async def list_events(
    status_filter: Optional[str] = Query(None, alias="status"),
    upcoming_only: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """List public events (optionally filtered by status)"""
    query = select(Event).options(selectinload(Event.host), selectinload(Event.rsvps))

    # Only show public events
    query = query.where(Event.is_public == True)

    # Filter by status
    if status_filter:
        query = query.where(Event.status == status_filter)
    else:
        # Default: show open and confirmed events
        query = query.where(Event.status.in_([EventStatus.OPEN.value, EventStatus.CONFIRMED.value]))

    # Filter upcoming events
    if upcoming_only:
        query = query.where(Event.event_date > datetime.utcnow())

    # Order by event date
    query = query.order_by(Event.event_date)

    result = await db.execute(query)
    events = result.scalars().all()

    return [
        EventListResponse(
            id=e.id,
            title=e.title,
            event_date=e.event_date,
            location_name=e.location_name,
            max_guests=e.max_guests,
            available_spots=e.available_spots,
            confirmed_guest_count=e.confirmed_guest_count,
            status=e.status,
            host_username=e.host.username if e.host else None,
            host_trust_score=e.host.trust_score if e.host else None,
        )
        for e in events
    ]


@router.get("/my-events", response_model=List[EventListResponse])
async def list_my_events(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List events hosted by the current user"""
    query = (
        select(Event)
        .options(selectinload(Event.host), selectinload(Event.rsvps))
        .where(Event.host_id == current_user.id)
        .order_by(Event.event_date.desc())
    )

    result = await db.execute(query)
    events = result.scalars().all()

    return [
        EventListResponse(
            id=e.id,
            title=e.title,
            event_date=e.event_date,
            location_name=e.location_name,
            max_guests=e.max_guests,
            available_spots=e.available_spots,
            confirmed_guest_count=e.confirmed_guest_count,
            status=e.status,
            host_username=e.host.username if e.host else None,
            host_trust_score=e.host.trust_score if e.host else None,
        )
        for e in events
    ]


@router.get("/{event_id}", response_model=EventResponse)
async def get_event(
    event_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get event details"""
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.host),
            selectinload(Event.food_items),
            selectinload(Event.rsvps)
        )
        .where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    return event_to_response(event)


@router.patch("/{event_id}", response_model=EventResponse)
async def update_event(
    event_id: int,
    event_update: EventUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update an event (host only)"""
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.host),
            selectinload(Event.food_items),
            selectinload(Event.rsvps)
        )
        .where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can update this event"
        )

    if event.status in [EventStatus.COMPLETED.value, EventStatus.CANCELLED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update a completed or cancelled event"
        )

    # Update fields
    update_data = event_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(event, field, value)

    await db.commit()
    await db.refresh(event)

    return event_to_response(event)


@router.post("/{event_id}/confirm", response_model=EventResponse)
async def confirm_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Confirm an event (host only). Requires minimum RSVPs to be met."""
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.host),
            selectinload(Event.food_items),
            selectinload(Event.rsvps)
        )
        .where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can confirm this event"
        )

    if event.status != EventStatus.OPEN.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm event with status: {event.status}"
        )

    if not event.can_be_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Not enough RSVPs to confirm. Need {event.min_guests}, have {event.confirmed_guest_count}"
        )

    event.status = EventStatus.CONFIRMED.value
    await db.commit()
    await db.refresh(event)

    return event_to_response(event)


@router.post("/{event_id}/cancel", response_model=EventResponse)
async def cancel_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Cancel an event (host only)"""
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.host),
            selectinload(Event.food_items),
            selectinload(Event.rsvps)
        )
        .where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can cancel this event"
        )

    if event.status in [EventStatus.COMPLETED.value, EventStatus.CANCELLED.value]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot cancel event with status: {event.status}"
        )

    event.status = EventStatus.CANCELLED.value

    # Cancel all RSVPs
    for rsvp in event.rsvps:
        if rsvp.status in [RSVPStatus.PENDING.value, RSVPStatus.CONFIRMED.value]:
            rsvp.status = RSVPStatus.CANCELLED.value

    await db.commit()
    await db.refresh(event)

    return event_to_response(event)


@router.post("/{event_id}/complete", response_model=EventResponse)
async def complete_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark event as completed (host only). Should be called after the event."""
    result = await db.execute(
        select(Event)
        .options(
            selectinload(Event.host),
            selectinload(Event.food_items),
            selectinload(Event.rsvps).selectinload(RSVP.user)
        )
        .where(Event.id == event_id)
    )
    event = result.scalar_one_or_none()

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found"
        )

    if event.host_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the host can complete this event"
        )

    if event.status != EventStatus.CONFIRMED.value:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only confirmed events can be marked as completed"
        )

    event.status = EventStatus.COMPLETED.value

    # Update host stats
    current_user.events_hosted += 1
    current_user.successful_events += 1
    current_user.trust_score += settings.successful_event_bonus

    await db.commit()
    await db.refresh(event)

    return event_to_response(event)


@router.post("/{event_id}/food-items", response_model=FoodItemResponse)
async def add_food_item(
    event_id: int,
    food_item: FoodItemCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Add a food item to the event's list (host only)"""
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
            detail="Only the host can add food items"
        )

    new_food_item = EventFoodItem(
        event_id=event_id,
        name=food_item.name,
        description=food_item.description,
        quantity_needed=food_item.quantity_needed,
    )

    db.add(new_food_item)
    await db.commit()
    await db.refresh(new_food_item)

    return FoodItemResponse(
        id=new_food_item.id,
        name=new_food_item.name,
        description=new_food_item.description,
        quantity_needed=new_food_item.quantity_needed,
        quantity_claimed=new_food_item.quantity_claimed,
        is_fully_claimed=new_food_item.is_fully_claimed,
        remaining_needed=new_food_item.remaining_needed,
    )
