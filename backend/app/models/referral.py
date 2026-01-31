from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Referral(Base):
    __tablename__ = "referrals"

    id = Column(Integer, primary_key=True, index=True)

    # Who referred whom
    referrer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    referred_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Referral tracking
    referral_code_used = Column(String(20), nullable=False)
    bonus_awarded = Column(Boolean, default=False)
    bonus_amount = Column(Integer, default=0)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    bonus_awarded_at = Column(DateTime, nullable=True)

    # Relationships
    referrer = relationship("User", back_populates="referrals_made", foreign_keys=[referrer_id])
    referred_user = relationship("User", foreign_keys=[referred_user_id])

    def award_bonus(self, amount: int):
        """Award referral bonus points"""
        self.bonus_awarded = True
        self.bonus_amount = amount
        self.bonus_awarded_at = datetime.utcnow()
