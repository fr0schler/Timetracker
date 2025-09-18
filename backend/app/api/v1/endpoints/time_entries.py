from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.database import get_db
from ....schemas.time_entry import TimeEntry, TimeEntryCreate, TimeEntryUpdate
from ....schemas.user import User
from ....services.time_entry_service import TimeEntryService
from ..deps import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[TimeEntry])
async def read_time_entries(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all time entries for the current user"""
    time_entries = await TimeEntryService.get_time_entries(
        db, user_id=current_user.id, skip=skip, limit=limit
    )
    return time_entries


@router.get("/active", response_model=TimeEntry)
async def read_active_time_entry(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get the currently running time entry"""
    active_entry = await TimeEntryService.get_active_time_entry(db, user_id=current_user.id)
    if not active_entry:
        raise HTTPException(status_code=404, detail="No active time entry found")
    return active_entry


@router.post("/", response_model=TimeEntry)
async def create_time_entry(
    time_entry: TimeEntryCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Start a new time entry"""
    try:
        return await TimeEntryService.create_time_entry(
            db=db, time_entry=time_entry, user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{entry_id}", response_model=TimeEntry)
async def read_time_entry(
    entry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific time entry by ID"""
    db_time_entry = await TimeEntryService.get_time_entry(
        db, entry_id=entry_id, user_id=current_user.id
    )
    if db_time_entry is None:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return db_time_entry


@router.post("/{entry_id}/stop", response_model=TimeEntry)
async def stop_time_entry(
    entry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Stop a running time entry"""
    db_time_entry = await TimeEntryService.stop_time_entry(
        db, entry_id=entry_id, user_id=current_user.id
    )
    if db_time_entry is None:
        raise HTTPException(
            status_code=404,
            detail="Time entry not found or already stopped"
        )
    return db_time_entry


@router.put("/{entry_id}", response_model=TimeEntry)
async def update_time_entry(
    entry_id: int,
    time_entry: TimeEntryUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a time entry"""
    db_time_entry = await TimeEntryService.update_time_entry(
        db, entry_id=entry_id, user_id=current_user.id, time_entry_update=time_entry
    )
    if db_time_entry is None:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return db_time_entry


@router.delete("/{entry_id}")
async def delete_time_entry(
    entry_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a time entry"""
    success = await TimeEntryService.delete_time_entry(
        db, entry_id=entry_id, user_id=current_user.id
    )
    if not success:
        raise HTTPException(status_code=404, detail="Time entry not found")
    return {"message": "Time entry deleted successfully"}