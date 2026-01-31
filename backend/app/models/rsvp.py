from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from app.database import Base


class RSVPStatus(str, enum.Enum):
    PENDING = "pending"  # RSVP submitted, waiting for host approval
    CONFIRMED = "confirmed"  # Host approved the RSVP
    DECLINED = "declined"  # Host declined the RSVP
    CANCELLED = "cancelled"  # Guest cancelled their RSVP
    ATTENDED = "attended"  # Guest actually showed up
    NO_SHOW = "no_show"  # Guest didn't show up (flaked)


class RSVP(Base):
    __tablename__ = "rsvps"

    id = Column(Integer, primary_key=True, index=True)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    food_item_id = Column(Integer, ForeignKey("event_food_items.id"), nullable=True)

    # RSVP Details
    status = Column(String(20), default=RSVPStatus.PENDING.value)
    guest_count = Column(Integer, default=1)  # How many people (including the user)
    message = Column(Text)  # Optional message to host

    # Food Contribution
    bringing_food_item = Column(String(255))  # What they're bringing (free text or from list)
    food_notes = Column(Text)  # "I'll bring a vegan option too"

    # Reserved Guest (invited directly by host)
    is_reserved = Column(Boolean, default=False)
    invited_at = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    attended_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="rsvps")
    event = relationship("Event", back_populates="rsvps")
    food_item = relationship("EventFoodItem", back_populates="rsvp_claims")

    def confirm(self):
        """Mark RSVP as confirmed by host"""
        self.status = RSVPStatus.CONFIRMED.value
        self.confirmed_at = datetime.utcnow()

    def mark_attended(self):
        """Mark guest as having attended the event"""
        self.status = RSVPStatus.ATTENDED.value
        self.attended_at = datetime.utcnow()

    def mark_no_show(self):
        """Mark guest as a no-show"""
        self.status = RSVPStatus.NO_SHOW.value
