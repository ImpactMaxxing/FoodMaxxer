from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class EventStatus(str, enum.Enum):
    DRAFT = "draft"
    OPEN = "open"  # Accepting RSVPs
    CONFIRMED = "confirmed"  # Host confirmed, event is happening
    CANCELLED = "cancelled"
    COMPLETED = "completed"


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text)

    # Event Details
    event_date = Column(DateTime, nullable=False)
    location_name = Column(String(255), nullable=False)
    location_address = Column(String(500))
    location_notes = Column(Text)  # e.g., "Apartment 4B, buzz #123"

    # Capacity
    max_guests = Column(Integer, nullable=False)
    reserved_spots = Column(Integer, default=0)  # Spots reserved for specific invites
    min_guests = Column(Integer, default=1)  # Minimum RSVPs needed to confirm

    # Confirmation Settings
    rsvp_deadline = Column(DateTime, nullable=False)  # Last day to RSVP
    confirmation_deadline = Column(DateTime, nullable=False)  # When host must confirm

    # Status
    status = Column(String(20), default=EventStatus.DRAFT.value)
    is_public = Column(Boolean, default=True)  # Can anyone find it, or invite-only?

    # Host
    host_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    host = relationship("User", back_populates="hosted_events")

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    food_items = relationship("EventFoodItem", back_populates="event", cascade="all, delete-orphan")
    rsvps = relationship("RSVP", back_populates="event", cascade="all, delete-orphan")

    @property
    def available_spots(self):
        """Calculate available spots for public RSVPs"""
        confirmed_rsvps = len([r for r in self.rsvps if r.status in ["confirmed", "pending"]])
        return max(0, self.max_guests - self.reserved_spots - confirmed_rsvps)

    @property
    def confirmed_guest_count(self):
        """Count of confirmed RSVPs"""
        return len([r for r in self.rsvps if r.status == "confirmed"])

    @property
    def can_be_confirmed(self):
        """Check if event has enough RSVPs to be confirmed"""
        return self.confirmed_guest_count >= self.min_guests


class EventFoodItem(Base):
    __tablename__ = "event_food_items"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String(255), nullable=False)  # e.g., "Salad", "Dessert", "Wine"
    description = Column(Text)  # e.g., "Green salad for 6-8 people"
    quantity_needed = Column(Integer, default=1)
    quantity_claimed = Column(Integer, default=0)

    # Relationships
    event = relationship("Event", back_populates="food_items")
    rsvp_claims = relationship("RSVP", back_populates="food_item")

    @property
    def is_fully_claimed(self):
        return self.quantity_claimed >= self.quantity_needed

    @property
    def remaining_needed(self):
        return max(0, self.quantity_needed - self.quantity_claimed)
