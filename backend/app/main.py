from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import api_router
from .core.config import settings
from .core.database import get_db, AsyncSessionLocal
from .services.user_service import UserService
from .schemas.user import UserCreate
import asyncio

app = FastAPI(
    title="TimeTracker API",
    description="A time tracking application with user authentication and project management",
    version="1.0.0",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://timetracker.hkp-solutions.de"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


async def create_default_user():
    """Create default admin user if no users exist"""
    try:
        async with AsyncSessionLocal() as db:
            # Check if any users exist
            existing_users = await UserService.get_all_users(db)
            if not existing_users:
                # Create default admin user
                default_user = UserCreate(
                    username="admin",
                    email="admin@timetracker.local",
                    password="admin123"
                )
                await UserService.create_user(db, default_user)
                print("✅ Default admin user created: admin / admin123")
            else:
                print("ℹ️ Users already exist, skipping default user creation")
    except Exception as e:
        print(f"⚠️ Failed to create default user: {e}")


@app.on_event("startup")
async def startup_event():
    # Create default user on startup
    await create_default_user()


@app.get("/")
async def root():
    return {"message": "TimeTracker API is running!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}