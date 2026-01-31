from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserPublicResponse
from app.auth import get_current_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    """Get current user's full profile"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        trust_score=current_user.trust_score,
        events_hosted=current_user.events_hosted,
        events_attended=current_user.events_attended,
        referral_code=current_user.referral_code,
        referral_points=current_user.referral_points,
        reliability_percentage=current_user.reliability_percentage,
        can_host=current_user.can_host,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
    )


@router.patch("/me", response_model=UserResponse)
async def update_my_profile(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update current user's profile"""
    if user_update.email and user_update.email != current_user.email:
        # Check if new email is already taken
        result = await db.execute(select(User).where(User.email == user_update.email))
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already in use"
            )
        current_user.email = user_update.email

    if user_update.full_name is not None:
        current_user.full_name = user_update.full_name

    await db.commit()
    await db.refresh(current_user)

    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        trust_score=current_user.trust_score,
        events_hosted=current_user.events_hosted,
        events_attended=current_user.events_attended,
        referral_code=current_user.referral_code,
        referral_points=current_user.referral_points,
        reliability_percentage=current_user.reliability_percentage,
        can_host=current_user.can_host,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at,
    )


@router.get("/{user_id}", response_model=UserPublicResponse)
async def get_user_public_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a user's public profile (visible to other users)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserPublicResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        trust_score=user.trust_score,
        events_hosted=user.events_hosted,
        events_attended=user.events_attended,
        reliability_percentage=user.reliability_percentage,
    )
