from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RSVPCreate(BaseModel):
    event_id: int
    guest_count: int = Field(default=1, ge=1, le=10)
    message: Optional[str] = None
    food_item_id: Optional[int] = None  # Claim a specific food item from the list
    bringing_food_item: Optional[str] = None  # Or specify what they're bringing
    food_notes: Optional[str] = None


class RSVPUpdate(BaseModel):
    guest_count: Optional[int] = Field(default=None, ge=1, le=10)
    message: Optional[str] = None
    food_item_id: Optional[int] = None
    bringing_food_item: Optional[str] = None
    food_notes: Optional[str] = None


class RSVPStatusUpdate(BaseModel):
    status: str  # confirmed, declined, cancelled, attended, no_show


class RSVPResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    status: str
    guest_count: int
    message: Optional[str]
    bringing_food_item: Optional[str]
    food_notes: Optional[str]
    food_item_id: Optional[int]
    is_reserved: bool
    created_at: datetime
    confirmed_at: Optional[datetime]

    # User info (for host view)
    user_username: Optional[str] = None
    user_trust_score: Optional[int] = None
    user_reliability: Optional[float] = None

    class Config:
        from_attributes = True


class RSVPWithEventResponse(RSVPResponse):
    """RSVP response that includes event details (for user's dashboard)"""
    event_title: Optional[str] = None
    event_date: Optional[datetime] = None
    event_location: Optional[str] = None
    event_status: Optional[str] = None

    class Config:
        from_attributes = True
