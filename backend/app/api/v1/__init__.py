from fastapi import APIRouter
from .endpoints import auth, projects, time_entries

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(time_entries.router, prefix="/time-entries", tags=["time-entries"])