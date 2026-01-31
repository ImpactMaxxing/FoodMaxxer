from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))

    # Trust & Reputation System
    trust_score = Column(Integer, default=100)  # Starts at 100, decreases with bad behavior
    events_hosted = Column(Integer, default=0)
    events_attended = Column(Integer, default=0)
    flake_count = Column(Integer, default=0)  # Times user RSVP'd but didn't show
    successful_events = Column(Integer, default=0)

    # Referral System
    referral_code = Column(String(20), unique=True, index=True)
    referred_by_id = Column(Integer, nullable=True)
    referral_points = Column(Integer, default=0)

    # Account Status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    hosted_events = relationship("Event", back_populates="host", foreign_keys="Event.host_id")
    rsvps = relationship("RSVP", back_populates="user")
    referrals_made = relationship("Referral", back_populates="referrer", foreign_keys="Referral.referrer_id")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.referral_code:
            self.referral_code = self._generate_referral_code()

    @staticmethod
    def _generate_referral_code():
        return uuid.uuid4().hex[:8].upper()

    @property
    def can_host(self):
        """Check if user has enough trust score to host events"""
        from app.config import get_settings
        settings = get_settings()
        return self.trust_score >= settings.min_trust_score_to_host

    @property
    def reliability_percentage(self):
        """Calculate user's reliability based on attendance history"""
        total = self.events_attended + self.flake_count
        if total == 0:
            return 100.0
        return round((self.events_attended / total) * 100, 1)
