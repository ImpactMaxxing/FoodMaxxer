from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class FoodItemCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    quantity_needed: int = Field(default=1, ge=1)


class FoodItemResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    quantity_needed: int
    quantity_claimed: int
    is_fully_claimed: bool
    remaining_needed: int

    class Config:
        from_attributes = True


class EventCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    event_date: datetime
    location_name: str = Field(..., min_length=1, max_length=255)
    location_address: Optional[str] = None
    location_notes: Optional[str] = None
    max_guests: int = Field(..., ge=1, le=100)
    reserved_spots: int = Field(default=0, ge=0)
    min_guests: int = Field(default=1, ge=1)
    rsvp_deadline: datetime
    is_public: bool = True
    food_items: List[FoodItemCreate] = []


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_date: Optional[datetime] = None
    location_name: Optional[str] = None
    location_address: Optional[str] = None
    location_notes: Optional[str] = None
    max_guests: Optional[int] = None
    reserved_spots: Optional[int] = None
    min_guests: Optional[int] = None
    rsvp_deadline: Optional[datetime] = None
    is_public: Optional[bool] = None


class EventResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    event_date: datetime
    location_name: str
    location_address: Optional[str]
    location_notes: Optional[str]
    max_guests: int
    reserved_spots: int
    min_guests: int
    rsvp_deadline: datetime
    confirmation_deadline: datetime
    status: str
    is_public: bool
    host_id: int
    host_username: Optional[str] = None
    host_trust_score: Optional[int] = None
    available_spots: int
    confirmed_guest_count: int
    can_be_confirmed: bool
    food_items: List[FoodItemResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    id: int
    title: str
    event_date: datetime
    location_name: str
    max_guests: int
    available_spots: int
    confirmed_guest_count: int
    status: str
    host_username: Optional[str] = None
    host_trust_score: Optional[int] = None

    class Config:
        from_attributes = True
