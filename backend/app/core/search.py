from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text, func, or_, and_
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import re

from ..models.user import User
from ..models.project import Project
from ..models.task import Task, TaskStatus, TaskPriority
from ..models.time_entry import TimeEntry
from ..models.organization import Organization
from .cache import cache


class AdvancedSearchService:
    """Advanced search service with full-text search and filtering capabilities"""

    @staticmethod
    async def global_search(
        db: AsyncSession,
        organization_id: int,
        query: str,
        user_id: Optional[int] = None,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 50
    ) -> Dict[str, List[Dict[str, Any]]]:
        """Perform global search across projects, tasks, and time entries"""

        # Cache key for search results
        cache_key = f"search:{organization_id}:{hash(query)}:{user_id}:{hash(str(filters))}"

        # Check cache first
        cached_result = await cache.get(cache_key)
        if cached_result:
            return cached_result

        search_terms = query.strip().split() if query else []
        filters = filters or {}

        results = {
            "projects": [],
            "tasks": [],
            "time_entries": [],
            "total_count": 0
        }

        if not search_terms and not filters:
            return results

        # Search projects
        projects = await AdvancedSearchService._search_projects(
            db, organization_id, search_terms, filters, user_id, limit
        )
        results["projects"] = projects

        # Search tasks
        tasks = await AdvancedSearchService._search_tasks(
            db, organization_id, search_terms, filters, user_id, limit
        )
        results["tasks"] = tasks

        # Search time entries
        time_entries = await AdvancedSearchService._search_time_entries(
            db, organization_id, search_terms, filters, user_id, limit
        )
        results["time_entries"] = time_entries

        results["total_count"] = len(projects) + len(tasks) + len(time_entries)

        # Cache results for 5 minutes
        await cache.set(cache_key, results, expire=300)

        return results

    @staticmethod
    async def _search_projects(
        db: AsyncSession,
        organization_id: int,
        search_terms: List[str],
        filters: Dict[str, Any],
        user_id: Optional[int],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search projects with full-text capabilities"""

        # Base query
        stmt = (
            select(Project)
            .options(
                joinedload(Project.owner),
                selectinload(Project.tasks),
                selectinload(Project.time_entries)
            )
            .where(Project.organization_id == organization_id)
        )

        # Add text search conditions
        if search_terms:
            text_conditions = []
            for term in search_terms:
                like_pattern = f"%{term.lower()}%"
                text_conditions.append(
                    or_(
                        func.lower(Project.name).like(like_pattern),
                        func.lower(Project.description).like(like_pattern)
                    )
                )
            stmt = stmt.where(and_(*text_conditions))

        # Apply filters
        if filters.get("is_archived") is not None:
            stmt = stmt.where(Project.is_archived == filters["is_archived"])

        if filters.get("owner_id"):
            stmt = stmt.where(Project.owner_id == filters["owner_id"])

        if filters.get("created_after"):
            stmt = stmt.where(Project.created_at >= filters["created_after"])

        if filters.get("created_before"):
            stmt = stmt.where(Project.created_at <= filters["created_before"])

        # User access filter
        if user_id:
            stmt = stmt.where(
                or_(
                    Project.owner_id == user_id,
                    Project.id.in_(
                        select(Task.project_id)
                        .where(Task.assigned_to_id == user_id)
                        .distinct()
                    )
                )
            )

        stmt = stmt.order_by(Project.updated_at.desc()).limit(limit)

        result = await db.execute(stmt)
        projects = result.scalars().unique().all()

        return [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "color": p.color,
                "is_archived": p.is_archived,
                "owner_name": p.owner.full_name if p.owner else None,
                "task_count": len(p.tasks),
                "total_time_hours": sum(te.duration_hours for te in p.time_entries if te.end_time),
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "type": "project"
            }
            for p in projects
        ]

    @staticmethod
    async def _search_tasks(
        db: AsyncSession,
        organization_id: int,
        search_terms: List[str],
        filters: Dict[str, Any],
        user_id: Optional[int],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search tasks with advanced filtering"""

        # Base query
        stmt = (
            select(Task)
            .options(
                joinedload(Task.project),
                joinedload(Task.assigned_to),
                joinedload(Task.created_by),
                selectinload(Task.time_entries)
            )
            .where(Task.organization_id == organization_id)
        )

        # Add text search conditions
        if search_terms:
            text_conditions = []
            for term in search_terms:
                like_pattern = f"%{term.lower()}%"
                text_conditions.append(
                    or_(
                        func.lower(Task.title).like(like_pattern),
                        func.lower(Task.description).like(like_pattern)
                    )
                )
            stmt = stmt.where(and_(*text_conditions))

        # Apply filters
        if filters.get("status"):
            if isinstance(filters["status"], list):
                stmt = stmt.where(Task.status.in_(filters["status"]))
            else:
                stmt = stmt.where(Task.status == filters["status"])

        if filters.get("priority"):
            if isinstance(filters["priority"], list):
                stmt = stmt.where(Task.priority.in_(filters["priority"]))
            else:
                stmt = stmt.where(Task.priority == filters["priority"])

        if filters.get("assigned_to_id"):
            stmt = stmt.where(Task.assigned_to_id == filters["assigned_to_id"])

        if filters.get("project_id"):
            stmt = stmt.where(Task.project_id == filters["project_id"])

        if filters.get("due_date_from"):
            stmt = stmt.where(Task.due_date >= filters["due_date_from"])

        if filters.get("due_date_to"):
            stmt = stmt.where(Task.due_date <= filters["due_date_to"])

        if filters.get("is_overdue"):
            stmt = stmt.where(
                and_(
                    Task.due_date < datetime.utcnow(),
                    Task.status != TaskStatus.DONE
                )
            )

        # User access filter
        if user_id:
            stmt = stmt.where(
                or_(
                    Task.assigned_to_id == user_id,
                    Task.created_by_id == user_id,
                    Task.project_id.in_(
                        select(Project.id).where(Project.owner_id == user_id)
                    )
                )
            )

        stmt = stmt.order_by(Task.updated_at.desc()).limit(limit)

        result = await db.execute(stmt)
        tasks = result.scalars().unique().all()

        return [
            {
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "status": t.status.value,
                "priority": t.priority.value,
                "project_name": t.project.name if t.project else None,
                "project_id": t.project_id,
                "assigned_to_name": t.assigned_to.full_name if t.assigned_to else None,
                "created_by_name": t.created_by.full_name if t.created_by else None,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "total_time_hours": t.total_time_hours,
                "is_completed": t.is_completed,
                "is_overdue": (
                    t.due_date and
                    t.due_date < datetime.utcnow() and
                    t.status != TaskStatus.DONE
                ),
                "created_at": t.created_at.isoformat() if t.created_at else None,
                "updated_at": t.updated_at.isoformat() if t.updated_at else None,
                "type": "task"
            }
            for t in tasks
        ]

    @staticmethod
    async def _search_time_entries(
        db: AsyncSession,
        organization_id: int,
        search_terms: List[str],
        filters: Dict[str, Any],
        user_id: Optional[int],
        limit: int
    ) -> List[Dict[str, Any]]:
        """Search time entries"""

        # Base query
        stmt = (
            select(TimeEntry)
            .options(
                joinedload(TimeEntry.project),
                joinedload(TimeEntry.task),
                joinedload(TimeEntry.user)
            )
            .where(TimeEntry.organization_id == organization_id)
        )

        # Add text search conditions
        if search_terms:
            text_conditions = []
            for term in search_terms:
                like_pattern = f"%{term.lower()}%"
                text_conditions.append(
                    func.lower(TimeEntry.description).like(like_pattern)
                )
            stmt = stmt.where(and_(*text_conditions))

        # Apply filters
        if filters.get("user_id"):
            stmt = stmt.where(TimeEntry.user_id == filters["user_id"])

        if filters.get("project_id"):
            stmt = stmt.where(TimeEntry.project_id == filters["project_id"])

        if filters.get("task_id"):
            stmt = stmt.where(TimeEntry.task_id == filters["task_id"])

        if filters.get("is_billable") is not None:
            stmt = stmt.where(TimeEntry.is_billable == filters["is_billable"])

        if filters.get("start_date"):
            stmt = stmt.where(TimeEntry.start_time >= filters["start_date"])

        if filters.get("end_date"):
            stmt = stmt.where(TimeEntry.start_time <= filters["end_date"])

        if filters.get("is_running") is not None:
            if filters["is_running"]:
                stmt = stmt.where(TimeEntry.end_time.is_(None))
            else:
                stmt = stmt.where(TimeEntry.end_time.isnot(None))

        # User access filter
        if user_id:
            stmt = stmt.where(TimeEntry.user_id == user_id)

        stmt = stmt.order_by(TimeEntry.start_time.desc()).limit(limit)

        result = await db.execute(stmt)
        time_entries = result.scalars().unique().all()

        return [
            {
                "id": te.id,
                "description": te.description,
                "start_time": te.start_time.isoformat(),
                "end_time": te.end_time.isoformat() if te.end_time else None,
                "duration_hours": te.duration_hours,
                "is_billable": te.is_billable,
                "is_running": te.is_running,
                "project_name": te.project.name if te.project else None,
                "project_id": te.project_id,
                "task_title": te.task.title if te.task else None,
                "task_id": te.task_id,
                "user_name": te.user.full_name if te.user else None,
                "hourly_rate": float(te.hourly_rate) if te.hourly_rate else None,
                "revenue": te.revenue,
                "created_at": te.created_at.isoformat() if te.created_at else None,
                "type": "time_entry"
            }
            for te in time_entries
        ]

    @staticmethod
    async def get_search_suggestions(
        db: AsyncSession,
        organization_id: int,
        query: str,
        user_id: Optional[int] = None
    ) -> Dict[str, List[str]]:
        """Get search suggestions for autocomplete"""

        if len(query) < 2:
            return {"projects": [], "tasks": [], "users": []}

        like_pattern = f"%{query.lower()}%"

        # Project suggestions
        project_stmt = (
            select(Project.name)
            .where(
                and_(
                    Project.organization_id == organization_id,
                    func.lower(Project.name).like(like_pattern)
                )
            )
            .limit(5)
        )

        # Task suggestions
        task_stmt = (
            select(Task.title)
            .where(
                and_(
                    Task.organization_id == organization_id,
                    func.lower(Task.title).like(like_pattern)
                )
            )
            .limit(5)
        )

        # User suggestions
        user_stmt = (
            select(User.full_name)
            .join(User.organization_memberships)
            .where(
                and_(
                    func.lower(User.full_name).like(like_pattern),
                    User.full_name.isnot(None)
                )
            )
            .limit(5)
        )

        # Execute queries
        project_result = await db.execute(project_stmt)
        task_result = await db.execute(task_stmt)
        user_result = await db.execute(user_stmt)

        return {
            "projects": [name for (name,) in project_result.all() if name],
            "tasks": [title for (title,) in task_result.all() if title],
            "users": [name for (name,) in user_result.all() if name]
        }

    @staticmethod
    def parse_search_query(query: str) -> Dict[str, Any]:
        """Parse advanced search query with filters"""
        filters = {}
        search_terms = []

        # Extract filter patterns like "status:done", "user:john", "project:website"
        filter_pattern = r'(\w+):(\w+|"[^"]+")'
        matches = re.findall(filter_pattern, query)

        remaining_query = query
        for match in matches:
            key, value = match
            # Remove quotes if present
            value = value.strip('"')

            if key == "status":
                filters["status"] = value.upper() if value.upper() in ["TODO", "IN_PROGRESS", "DONE", "CANCELLED"] else value
            elif key == "priority":
                filters["priority"] = value.upper() if value.upper() in ["LOW", "NORMAL", "HIGH", "URGENT"] else value
            elif key == "user":
                filters["user_name"] = value
            elif key == "project":
                filters["project_name"] = value
            elif key == "billable":
                filters["is_billable"] = value.lower() in ["true", "yes", "1"]
            elif key == "overdue":
                filters["is_overdue"] = value.lower() in ["true", "yes", "1"]

            # Remove the filter from the query
            pattern = f"{key}:{value}" if '"' not in match[1] else f'{key}:"{value}"'
            remaining_query = remaining_query.replace(pattern, "").strip()

        # Remaining words are search terms
        search_terms = [term.strip() for term in remaining_query.split() if term.strip()]

        return {
            "search_terms": search_terms,
            "filters": filters
        }