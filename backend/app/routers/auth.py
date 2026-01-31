from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.database import get_db
from app.models.user import User
from app.models.referral import Referral
from app.schemas.user import UserCreate, UserResponse, Token, UserLogin
from app.auth import verify_password, get_password_hash, create_access_token, get_current_user
from app.config import get_settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
settings = get_settings()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Register a new user with optional referral code"""

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if username already exists
    result = await db.execute(select(User).where(User.username == user_data.username))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )

    # Handle referral code if provided
    referrer = None
    if user_data.referral_code:
        result = await db.execute(
            select(User).where(User.referral_code == user_data.referral_code.upper())
        )
        referrer = result.scalar_one_or_none()
        if not referrer:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid referral code"
            )

        # Check if referrer has reached their referral limit
        referral_count = await db.execute(
            select(Referral).where(Referral.referrer_id == referrer.id)
        )
        existing_referrals = len(referral_count.scalars().all())
        if existing_referrals >= settings.max_referrals_per_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This referral code has reached its limit"
            )

    # Create the new user
    new_user = User(
        email=user_data.email,
        username=user_data.username,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        referred_by_id=referrer.id if referrer else None,
        trust_score=settings.default_trust_score,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Create referral record and award bonus to referrer
    if referrer:
        referral = Referral(
            referrer_id=referrer.id,
            referred_user_id=new_user.id,
            referral_code_used=user_data.referral_code.upper(),
        )
        referral.award_bonus(settings.referral_bonus_points)
        referrer.referral_points += settings.referral_bonus_points

        db.add(referral)
        await db.commit()

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        username=new_user.username,
        full_name=new_user.full_name,
        trust_score=new_user.trust_score,
        events_hosted=new_user.events_hosted,
        events_attended=new_user.events_attended,
        referral_code=new_user.referral_code,
        referral_points=new_user.referral_points,
        reliability_percentage=new_user.reliability_percentage,
        can_host=new_user.can_host,
        is_verified=new_user.is_verified,
        created_at=new_user.created_at,
    )


@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """Login with email and password"""
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is deactivated"
        )

    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )

    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current authenticated user's information"""
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
