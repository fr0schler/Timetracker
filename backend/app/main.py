from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import api_router
from .core.config import settings
from .core.database import get_db, AsyncSessionLocal
from .services.user_service import UserService
from .schemas.user import UserCreate
from .models.organization import Organization
from .models.organization_member import OrganizationMember, MemberRole
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
                    email="admin@example.com",
                    password="admin123",
                    full_name="Administrator"
                )
                user = await UserService.create_user(db, default_user)

                # Create default organization
                org = Organization(
                    name="Default Organization",
                    slug="default",
                    description="Default organization for new users"
                )
                db.add(org)
                await db.commit()
                await db.refresh(org)

                # Add user as organization owner
                membership = OrganizationMember(
                    user_id=user.id,
                    organization_id=org.id,
                    role=MemberRole.OWNER,
                    is_active=True
                )
                db.add(membership)
                await db.commit()

                print("✅ Default admin user created: admin@example.com / admin123")
                print("✅ Default organization created")
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