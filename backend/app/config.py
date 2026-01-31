from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "FoodShare"
    debug: bool = True

    # Database
    database_url: str = "sqlite+aiosqlite:///./foodmaxxer.db"

    # JWT Settings
    secret_key: str = "your-secret-key-change-in-production-use-env-var"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days

    # Referral Settings
    referral_bonus_points: int = 100
    max_referrals_per_user: int = 5  # Each user can only refer 5 people
    min_trust_score_to_host: int = 50
    default_trust_score: int = 100
    flake_penalty: int = 25
    successful_event_bonus: int = 10

    # Event Settings
    min_days_before_event_to_confirm: int = 3

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()
