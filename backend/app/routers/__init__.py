from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.events import router as events_router
from app.routers.rsvps import router as rsvps_router
from app.routers.referrals import router as referrals_router

__all__ = ["auth_router", "users_router", "events_router", "rsvps_router", "referrals_router"]
