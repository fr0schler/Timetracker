from sqlalchemy import Index, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload, joinedload
from sqlalchemy import select, func, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..models.user import User
from ..models.project import Project
from ..models.task import Task, TaskStatus
from ..models.time_entry import TimeEntry
from ..models.organization import Organization
from .cache import cache, cache_key_user_projects, cache_key_project_tasks


class DatabaseOptimizations:
    """Optimized database queries with caching and performance improvements"""

    @staticmethod
    async def get_user_projects_optimized(
        db: AsyncSession,
        user_id: int,
        organization_id: int,
        use_cache: bool = True
    ) -> List[Project]:
        """Get user projects with optimized loading and caching"""

        # Check cache first
        if use_cache:
            cache_key = cache_key_user_projects(user_id, organization_id)
            cached_result = await cache.get(cache_key)
            if cached_result:
                return cached_result

        # Optimized query with eager loading
        stmt = (
            select(Project)
            .options(
                selectinload(Project.tasks).selectinload(Task.time_entries),
                selectinload(Project.time_entries),
                joinedload(Project.owner)
            )
            .join(Project.organization)
            .where(
                and_(
                    Project.organization_id == organization_id,
                    or_(
                        Project.owner_id == user_id,
                        Project.id.in_(
                            select(Task.project_id)
                            .where(Task.assigned_to_id == user_id)
                            .distinct()
                        )
                    )
                )
            )
            .order_by(Project.updated_at.desc())
        )

        result = await db.execute(stmt)
        projects = result.scalars().unique().all()

        # Cache the result
        if use_cache:
            projects_data = [
                {
                    "id": p.id,
                    "name": p.name,
                    "description": p.description,
                    "color": p.color,
                    "is_archived": p.is_archived,
                    "created_at": p.created_at.isoformat() if p.created_at else None,
                    "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                    "task_count": len(p.tasks),
                    "total_time_hours": sum(te.duration_hours for te in p.time_entries if te.end_time)
                }
                for p in projects
            ]
            await cache.set(cache_key, projects_data, expire=1800)  # 30 minutes

        return projects

    @staticmethod
    async def get_project_tasks_optimized(
        db: AsyncSession,
        project_id: int,
        use_cache: bool = True
    ) -> List[Task]:
        """Get project tasks with optimized loading"""

        if use_cache:
            cache_key = cache_key_project_tasks(project_id)
            cached_result = await cache.get(cache_key)
            if cached_result:
                return cached_result

        # Optimized query with selective loading
        stmt = (
            select(Task)
            .options(
                joinedload(Task.assigned_to),
                joinedload(Task.created_by),
                selectinload(Task.time_entries)
            )
            .where(Task.project_id == project_id)
            .order_by(Task.position, Task.created_at)
        )

        result = await db.execute(stmt)
        tasks = result.scalars().unique().all()

        if use_cache:
            tasks_data = [
                {
                    "id": t.id,
                    "title": t.title,
                    "description": t.description,
                    "status": t.status.value,
                    "priority": t.priority.value,
                    "position": t.position,
                    "due_date": t.due_date.isoformat() if t.due_date else None,
                    "assigned_to_id": t.assigned_to_id,
                    "created_by_id": t.created_by_id,
                    "total_time_hours": t.total_time_hours,
                    "is_completed": t.is_completed
                }
                for t in tasks
            ]
            await cache.set(cache_key, tasks_data, expire=900)  # 15 minutes

        return tasks

    @staticmethod
    async def get_time_tracking_analytics(
        db: AsyncSession,
        organization_id: int,
        start_date: datetime,
        end_date: datetime,
        user_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """Get optimized time tracking analytics"""

        # Base query with filters
        base_filters = [
            TimeEntry.organization_id == organization_id,
            TimeEntry.start_time >= start_date,
            TimeEntry.start_time <= end_date,
            TimeEntry.end_time.isnot(None)  # Only completed entries
        ]

        if user_id:
            base_filters.append(TimeEntry.user_id == user_id)

        # Total time query
        total_time_stmt = (
            select(
                func.sum(
                    func.extract('epoch', TimeEntry.end_time - TimeEntry.start_time)
                ).label('total_seconds')
            )
            .where(and_(*base_filters))
        )

        # Daily breakdown query
        daily_breakdown_stmt = (
            select(
                func.date(TimeEntry.start_time).label('date'),
                func.sum(
                    func.extract('epoch', TimeEntry.end_time - TimeEntry.start_time)
                ).label('total_seconds'),
                func.count(TimeEntry.id).label('entry_count')
            )
            .where(and_(*base_filters))
            .group_by(func.date(TimeEntry.start_time))
            .order_by(func.date(TimeEntry.start_time))
        )

        # Project breakdown query
        project_breakdown_stmt = (
            select(
                Project.name.label('project_name'),
                Project.id.label('project_id'),
                func.sum(
                    func.extract('epoch', TimeEntry.end_time - TimeEntry.start_time)
                ).label('total_seconds'),
                func.count(TimeEntry.id).label('entry_count')
            )
            .select_from(TimeEntry)
            .join(Project, TimeEntry.project_id == Project.id)
            .where(and_(*base_filters))
            .group_by(Project.id, Project.name)
            .order_by(func.sum(
                func.extract('epoch', TimeEntry.end_time - TimeEntry.start_time)
            ).desc())
        )

        # Execute all queries
        total_result = await db.execute(total_time_stmt)
        daily_result = await db.execute(daily_breakdown_stmt)
        project_result = await db.execute(project_breakdown_stmt)

        total_seconds = total_result.scalar() or 0
        daily_data = daily_result.all()
        project_data = project_result.all()

        return {
            "total_hours": total_seconds / 3600 if total_seconds else 0,
            "total_entries": sum(day.entry_count for day in daily_data),
            "daily_breakdown": [
                {
                    "date": day.date.isoformat(),
                    "hours": day.total_seconds / 3600,
                    "entries": day.entry_count
                }
                for day in daily_data
            ],
            "project_breakdown": [
                {
                    "project_id": proj.project_id,
                    "project_name": proj.project_name,
                    "hours": proj.total_seconds / 3600,
                    "entries": proj.entry_count
                }
                for proj in project_data
            ]
        }

    @staticmethod
    async def get_running_time_entries(
        db: AsyncSession,
        user_id: int,
        organization_id: int
    ) -> List[TimeEntry]:
        """Get currently running time entries for user"""

        stmt = (
            select(TimeEntry)
            .options(
                joinedload(TimeEntry.project),
                joinedload(TimeEntry.task)
            )
            .where(
                and_(
                    TimeEntry.user_id == user_id,
                    TimeEntry.organization_id == organization_id,
                    TimeEntry.end_time.is_(None)
                )
            )
            .order_by(TimeEntry.start_time.desc())
        )

        result = await db.execute(stmt)
        return result.scalars().unique().all()

    @staticmethod
    async def bulk_update_task_positions(
        db: AsyncSession,
        task_updates: List[Dict[str, Any]]
    ) -> bool:
        """Bulk update task positions for drag & drop"""

        try:
            for update in task_updates:
                stmt = (
                    text("UPDATE tasks SET position = :position, status = :status WHERE id = :task_id")
                )
                await db.execute(stmt, {
                    "position": update["position"],
                    "status": update["status"],
                    "task_id": update["task_id"]
                })

            await db.commit()

            # Invalidate relevant caches
            affected_projects = set(update.get("project_id") for update in task_updates if update.get("project_id"))
            for project_id in affected_projects:
                if project_id:
                    cache_key = cache_key_project_tasks(project_id)
                    await cache.delete(cache_key)

            return True
        except Exception as e:
            await db.rollback()
            print(f"Bulk update error: {e}")
            return False


# Database indices for better performance
PERFORMANCE_INDICES = [
    # Time entries indices
    Index('idx_time_entries_user_date', TimeEntry.user_id, TimeEntry.start_time),
    Index('idx_time_entries_project_date', TimeEntry.project_id, TimeEntry.start_time),
    Index('idx_time_entries_org_date', TimeEntry.organization_id, TimeEntry.start_time),
    Index('idx_time_entries_running', TimeEntry.user_id, TimeEntry.end_time),

    # Tasks indices
    Index('idx_tasks_project_status', Task.project_id, Task.status),
    Index('idx_tasks_assigned_status', Task.assigned_to_id, Task.status),
    Index('idx_tasks_position', Task.project_id, Task.position),

    # Projects indices
    Index('idx_projects_org_active', Project.organization_id, Project.is_archived),
    Index('idx_projects_owner', Project.owner_id, Project.updated_at),

    # Users indices
    Index('idx_users_email_active', User.email, User.is_active),
    Index('idx_users_last_login', User.last_login_at),
]