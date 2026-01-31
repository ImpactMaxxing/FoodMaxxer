from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.referral import Referral
from app.auth import get_current_user

router = APIRouter(prefix="/api/referrals", tags=["Referrals"])


class ReferralResponse(BaseModel):
    id: int
    referred_user_id: int
    referred_username: str
    referral_code_used: str
    bonus_awarded: bool
    bonus_amount: int
    created_at: datetime

    class Config:
        from_attributes = True


class ReferralStatsResponse(BaseModel):
    referral_code: str
    total_referrals: int
    total_points_earned: int
    referrals: List[ReferralResponse]


@router.get("/my-code")
async def get_my_referral_code(current_user: User = Depends(get_current_user)):
    """Get current user's referral code"""
    return {
        "referral_code": current_user.referral_code,
        "referral_points": current_user.referral_points,
    }


@router.get("/stats", response_model=ReferralStatsResponse)
async def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get referral statistics for the current user"""
    result = await db.execute(
        select(Referral)
        .options(selectinload(Referral.referred_user))
        .where(Referral.referrer_id == current_user.id)
        .order_by(Referral.created_at.desc())
    )
    referrals = result.scalars().all()

    total_points = sum(r.bonus_amount for r in referrals if r.bonus_awarded)

    return ReferralStatsResponse(
        referral_code=current_user.referral_code,
        total_referrals=len(referrals),
        total_points_earned=total_points,
        referrals=[
            ReferralResponse(
                id=r.id,
                referred_user_id=r.referred_user_id,
                referred_username=r.referred_user.username if r.referred_user else "Unknown",
                referral_code_used=r.referral_code_used,
                bonus_awarded=r.bonus_awarded,
                bonus_amount=r.bonus_amount,
                created_at=r.created_at,
            )
            for r in referrals
        ]
    )


@router.get("/validate/{code}")
async def validate_referral_code(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """Validate a referral code (public endpoint for signup form)"""
    result = await db.execute(
        select(User).where(User.referral_code == code.upper())
    )
    user = result.scalar_one_or_none()

    if not user:
        return {"valid": False, "message": "Invalid referral code"}

    return {
        "valid": True,
        "referrer_username": user.username,
        "message": f"Referred by {user.username}"
    }
