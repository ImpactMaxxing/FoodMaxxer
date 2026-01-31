from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager

from app.database import init_db


class HTTPSRedirectMiddleware(BaseHTTPMiddleware):
    """Ensure redirects use HTTPS when behind a proxy (Cloud Run)."""
    async def dispatch(self, request: Request, call_next):
        # If X-Forwarded-Proto is https, update the scope so FastAPI knows
        if request.headers.get("x-forwarded-proto") == "https":
            request.scope["scheme"] = "https"
        return await call_next(request)
from app.routers import auth_router, users_router, events_router, rsvps_router, referrals_router
from app.routers.invites import router as invites_router
from app.config import get_settings

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown


app = FastAPI(
    title="FoodShare API",
    description="API for FoodShare - The Dinner Party Hosting Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware - allow Cloud Run domains and local dev
import os
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
]
# Add Cloud Run frontend URL if set
if os.environ.get("FRONTEND_URL"):
    allowed_origins.append(os.environ.get("FRONTEND_URL"))
# Allow all .run.app domains for Cloud Run
allowed_origins.append("https://*.run.app")

# HTTPS redirect fix for Cloud Run (must be before CORS)
app.add_middleware(HTTPSRedirectMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for Cloud Run (can restrict later)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(events_router)
app.include_router(rsvps_router)
app.include_router(referrals_router)
app.include_router(invites_router)


@app.get("/")
async def root():
    return {
        "message": "Welcome to FoodShare API",
        "docs": "/docs",
        "version": "1.0.0",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
