from typing import List, Optional
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from ..models.time_entry import TimeEntry
from ..schemas.time_entry import TimeEntryCreate, TimeEntryUpdate


class TimeEntryService:
    @staticmethod
    async def get_time_entries(
        db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100
    ) -> List[TimeEntry]:
        result = await db.execute(
            select(TimeEntry)
            .where(TimeEntry.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(TimeEntry.start_time.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_time_entry(db: AsyncSession, entry_id: int, user_id: int) -> Optional[TimeEntry]:
        result = await db.execute(
            select(TimeEntry).where(TimeEntry.id == entry_id, TimeEntry.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_active_time_entry(db: AsyncSession, user_id: int) -> Optional[TimeEntry]:
        """Get the currently running time entry for a user (no end_time)"""
        result = await db.execute(
            select(TimeEntry).where(
                and_(TimeEntry.user_id == user_id, TimeEntry.end_time.is_(None))
            )
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_time_entry(db: AsyncSession, time_entry: TimeEntryCreate, user_id: int) -> TimeEntry:
        # Check if user has an active time entry
        active_entry = await TimeEntryService.get_active_time_entry(db, user_id)
        if active_entry:
            raise ValueError("User already has an active time entry. Stop it before starting a new one.")

        start_time = time_entry.start_time if time_entry.start_time else datetime.utcnow()

        db_time_entry = TimeEntry(
            start_time=start_time,
            description=time_entry.description,
            project_id=time_entry.project_id,
            user_id=user_id,
        )
        db.add(db_time_entry)
        await db.commit()
        await db.refresh(db_time_entry)
        return db_time_entry

    @staticmethod
    async def stop_time_entry(db: AsyncSession, entry_id: int, user_id: int) -> Optional[TimeEntry]:
        """Stop a running time entry by setting end_time to now"""
        db_time_entry = await TimeEntryService.get_time_entry(db, entry_id, user_id)
        if not db_time_entry or db_time_entry.end_time is not None:
            return None

        db_time_entry.end_time = datetime.utcnow()
        await db.commit()
        await db.refresh(db_time_entry)
        return db_time_entry

    @staticmethod
    async def update_time_entry(
        db: AsyncSession, entry_id: int, user_id: int, time_entry_update: TimeEntryUpdate
    ) -> Optional[TimeEntry]:
        db_time_entry = await TimeEntryService.get_time_entry(db, entry_id, user_id)
        if not db_time_entry:
            return None

        update_data = time_entry_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_time_entry, field, value)

        await db.commit()
        await db.refresh(db_time_entry)
        return db_time_entry

    @staticmethod
    async def delete_time_entry(db: AsyncSession, entry_id: int, user_id: int) -> bool:
        db_time_entry = await TimeEntryService.get_time_entry(db, entry_id, user_id)
        if not db_time_entry:
            return False

        await db.delete(db_time_entry)
        await db.commit()
        return True