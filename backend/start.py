"""
Startup script for Cloud Run.
Seeds the database with demo data, then starts uvicorn.
"""
import asyncio
import os
import subprocess
import sys


async def main():
    # Only seed if SEED_DATA environment variable is set
    if os.environ.get("SEED_DATA", "").lower() == "true":
        print("SEED_DATA=true detected, seeding database...")
        from seed_data import seed_database
        await seed_database()
    else:
        print("SEED_DATA not set, skipping database seed")
        from app.database import init_db
        await init_db()

    # Start uvicorn
    port = os.environ.get("PORT", "8080")
    print(f"Starting uvicorn on port {port}...")

    os.execvp(
        "uvicorn",
        ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", port]
    )


if __name__ == "__main__":
    asyncio.run(main())
