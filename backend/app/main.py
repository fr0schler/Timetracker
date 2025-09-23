from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .api.v1 import api_router
from .core.config import settings
from .core.database import get_db, AsyncSessionLocal
from .core.session import session_manager
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
    # Initialize session manager
    await session_manager.connect()
    # Create default user on startup
    await create_default_user()


@app.on_event("shutdown")
async def shutdown_event():
    # Cleanup session manager
    await session_manager.disconnect()


@app.get("/")
async def root():
    return {"message": "TimeTracker API is running!"}


@app.get("/health")
async def health_check():
    """Comprehensive health check for zero-downtime deployment"""
    try:
        health_status = {
            "status": "healthy",
            "timestamp": asyncio.get_event_loop().time(),
            "services": {}
        }

        # Check database connectivity
        try:
            async with AsyncSessionLocal() as db:
                await db.execute("SELECT 1")
                health_status["services"]["database"] = "healthy"
        except Exception as e:
            health_status["services"]["database"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"

        # Check Redis connectivity
        try:
            if session_manager.redis_client:
                await session_manager.redis_client.ping()
                health_status["services"]["redis"] = "healthy"
            else:
                health_status["services"]["redis"] = "unhealthy: not connected"
                health_status["status"] = "degraded"
        except Exception as e:
            health_status["services"]["redis"] = f"unhealthy: {str(e)}"
            health_status["status"] = "degraded"

        # If any service is unhealthy, return 503
        if health_status["status"] != "healthy":
            raise HTTPException(status_code=503, detail=health_status)

        return health_status

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": asyncio.get_event_loop().time()
            }
        )