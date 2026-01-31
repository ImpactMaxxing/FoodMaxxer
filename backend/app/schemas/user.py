from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    referral_code: Optional[str] = None  # Code from someone who referred them


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None


class UserResponse(BaseModel):
    id: int
    email: str
    username: str
    full_name: Optional[str]
    trust_score: int
    events_hosted: int
    events_attended: int
    referral_code: str
    referral_points: int
    reliability_percentage: float
    can_host: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserPublicResponse(BaseModel):
    """Public user info visible to others"""
    id: int
    username: str
    full_name: Optional[str]
    trust_score: int
    events_hosted: int
    events_attended: int
    reliability_percentage: float

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
