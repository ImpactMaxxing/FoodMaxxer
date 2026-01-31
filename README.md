
```
 _____               _  ____  _
|  ___|__   ___   __| |/ ___|| |__   __ _ _ __ ___
| |_ / _ \ / _ \ / _` |\___ \| '_ \ / _` | '__/ _ \
|  _| (_) | (_) | (_| | ___) | | | | (_| | | |  __/
|_|  \___/ \___/ \__,_||____/|_| |_|\__,_|_|  \___|

```
_By Tove, Grace, and Miles for UVicHacks × Inspire Hackathon_

## Live Demo

**https://foodshare-web-287947527018.us-central1.run.app**

### Backend Documentation:

**https://foodshare-api-287947527018.us-central1.run.app/docs#/**

### Figma Design:

**https://www.figma.com/make/Q624d9en4gGKReWEc6orrr/Community-Meal-Planning-Website?t=MC7L4tn4UlMeYDQt-1**



### Demo Accounts (password: `demo1234`)
| Email | Username |
|-------|----------|
| maya@example.com | maya_cooks |
| jordan@example.com | jordan_eats |
| sam@example.com | samurai_chef |
| priya@example.com | priya_spice |
| alex@example.com | alex_grills |
| luna@example.com | luna_bakes |
| demo@example.com | demo_user |

### Referral Codes (to register new accounts)
`MAYA2024`, `JRIV2024`, `SAMNK24`, `PRIYA24`, `ALEXT24`, `LUNA2024`, `DEMO2024`

---

A dinner party hosting platform that connects reliable hosts with trustworthy guests. Built around a reputation system to reward showing up and discourage flaking.

## What It Does
- Hosts create dinner events with dates, locations, and guest limits
- Guests RSVP and sign up to bring food
- Events only go ahead once minimum attendance is met and the host confirms
- Trust scores track attendance and reliability over time

## Trust System
- Users start with a trust score of 100
- Attend an event to gain points
- No-show makes you lose points
- Reliability percentage is visible to others
- Minimum trust score required to host events

## Extra Features
- **Food coordination**: guests claim dishes to bring  
- **Direct invites**: hosts can invite specific users  
- **Referral program**: invite friends and earn points  

## Tech Stack
### Backend
- Python
- FastAPI
- SQLAlchemy (async)
- JWT authentication
- Pydantic

### Frontend
- React + TypeScript
- Vite
- TailwindCSS
- React Query
- Zustand

## System Design

```
┌─────────────────┐         ┌─────────────────┐
│                 │  HTTPS  │                 │
│  React SPA      │◄───────►│  FastAPI        │
│  (Cloud Run)    │  /api/* │  (Cloud Run)    │
│                 │         │                 │
└─────────────────┘         └────────┬────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  SQLite         │
                            │  (ephemeral)    │
                            └─────────────────┘
```

### Architecture Decisions

**Monolithic API + SPA**: Simple two-service architecture. The React frontend is a static SPA served by nginx, the backend is a single FastAPI instance. Both run as separate Cloud Run services.

**SQLite**: Using SQLite with async driver for simplicity. Data is ephemeral on Cloud Run (stored in `/tmp`). Would swap to Postgres for prod.

**JWT Authentication**: Stateless auth with 7-day token expiry. Tokens stored in localStorage, attached via Axios interceptor. No refresh token complexity for our small scope.

**Referral-gated Registration**: Users can only sign up with a valid referral code. This creates an invite-only network effect and sets up the trust system.

**Trust Score Algorithm**:
- Base score: 100
- Attend event: +10
- No-show: -25
- Host successful event: +10
- Minimum 50 to host events

**Event Lifecycle**:
```
OPEN → CONFIRMED → COMPLETED
  │         │
  └─────────┴──→ CANCELLED
```
Events require minimum guest threshold before host can confirm. Confirmation locks in RSVPs and reveals full address.

### Database Schema

```
Users ──────┬──── Events (host_id)
            │
            ├──── RSVPs (user_id, event_id)
            │
            ├──── Referrals (referrer_id, referred_user_id)
            │
            └──── Invitations (inviter_id, invitee_id, event_id)

Events ─────┬──── EventFoodItems (event_id)
            │
            └──── RSVPs (event_id)
```

### API Structure

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create account |
| `POST /api/auth/login` | Get JWT token |
| `GET /api/auth/me` | Current user info |
| `GET /api/events` | List events |
| `POST /api/events` | Create event |
| `GET /api/events/{id}` | Event details |
| `POST /api/events/{id}/rsvp` | RSVP to event |
| `POST /api/events/{id}/confirm` | Host confirms event |
| `GET /api/referrals/stats` | Referral stats |

## Getting Started
### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```
### Frontend
```bash
cd frontend
npm install
npm run dev
````
