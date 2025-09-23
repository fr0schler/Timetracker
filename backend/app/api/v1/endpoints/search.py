from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Any, Optional
from datetime import datetime

from ....core.database import get_db
from ....core.search import AdvancedSearchService
from ....api.v1.deps import get_current_user
from ....models.user import User

router = APIRouter()


@router.get("/search")
async def global_search(
    q: str = Query(..., description="Search query"),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    filters: Optional[str] = Query(None, description="JSON string of additional filters"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Global search across projects, tasks, and time entries

    Supports advanced query syntax:
    - Basic text search: "website redesign"
    - Status filter: "status:done project website"
    - User filter: "user:john status:in_progress"
    - Project filter: "project:website"
    - Priority filter: "priority:high"
    - Billable filter: "billable:true"
    - Overdue filter: "overdue:true"
    """

    if not current_user.current_organization:
        raise HTTPException(status_code=404, detail="No active organization")

    # Parse the search query for advanced filters
    parsed_query = AdvancedSearchService.parse_search_query(q)
    search_terms = " ".join(parsed_query["search_terms"])
    query_filters = parsed_query["filters"]

    # Parse additional filters if provided
    additional_filters = {}
    if filters:
        try:
            import json
            additional_filters = json.loads(filters)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Invalid filters JSON")

    # Merge filters
    combined_filters = {**query_filters, **additional_filters}

    results = await AdvancedSearchService.global_search(
        db=db,
        organization_id=current_user.current_organization.id,
        query=search_terms,
        user_id=current_user.id,
        filters=combined_filters,
        limit=limit
    )

    return {
        "query": q,
        "search_terms": parsed_query["search_terms"],
        "filters_applied": combined_filters,
        "results": results,
        "meta": {
            "total_count": results["total_count"],
            "projects_count": len(results["projects"]),
            "tasks_count": len(results["tasks"]),
            "time_entries_count": len(results["time_entries"])
        }
    }


@router.get("/search/suggestions")
async def get_search_suggestions(
    q: str = Query(..., min_length=2, description="Search query for suggestions"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get search suggestions for autocomplete"""

    if not current_user.current_organization:
        raise HTTPException(status_code=404, detail="No active organization")

    suggestions = await AdvancedSearchService.get_search_suggestions(
        db=db,
        organization_id=current_user.current_organization.id,
        query=q,
        user_id=current_user.id
    )

    return {
        "query": q,
        "suggestions": suggestions
    }


@router.get("/search/filters")
async def get_available_filters(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get available filter options for advanced search"""

    if not current_user.current_organization:
        raise HTTPException(status_code=404, detail="No active organization")

    # Get organization users for user filter
    from sqlalchemy import select
    from ....models.organization_member import OrganizationMember

    user_stmt = (
        select(User.id, User.full_name)
        .join(OrganizationMember)
        .where(
            OrganizationMember.organization_id == current_user.current_organization.id
        )
        .where(User.full_name.isnot(None))
    )

    user_result = await db.execute(user_stmt)
    users = [{"id": user_id, "name": name} for user_id, name in user_result.all()]

    # Get projects for project filter
    from ....models.project import Project
    project_stmt = (
        select(Project.id, Project.name)
        .where(Project.organization_id == current_user.current_organization.id)
        .where(Project.is_archived == False)
        .order_by(Project.name)
    )

    project_result = await db.execute(project_stmt)
    projects = [{"id": proj_id, "name": name} for proj_id, name in project_result.all()]

    return {
        "filters": {
            "status": [
                {"value": "todo", "label": "To Do"},
                {"value": "in_progress", "label": "In Progress"},
                {"value": "done", "label": "Done"},
                {"value": "cancelled", "label": "Cancelled"}
            ],
            "priority": [
                {"value": "low", "label": "Low"},
                {"value": "normal", "label": "Normal"},
                {"value": "high", "label": "High"},
                {"value": "urgent", "label": "Urgent"}
            ],
            "users": users,
            "projects": projects,
            "billable": [
                {"value": True, "label": "Billable"},
                {"value": False, "label": "Non-billable"}
            ]
        },
        "query_syntax": {
            "examples": [
                "status:done project:website",
                "user:john priority:high",
                "billable:true overdue:true",
                "website redesign status:in_progress"
            ],
            "operators": [
                {"operator": "status:", "description": "Filter by task status"},
                {"operator": "priority:", "description": "Filter by task priority"},
                {"operator": "user:", "description": "Filter by assigned user"},
                {"operator": "project:", "description": "Filter by project"},
                {"operator": "billable:", "description": "Filter by billable status"},
                {"operator": "overdue:", "description": "Filter overdue tasks"}
            ]
        }
    }


@router.get("/search/recent")
async def get_recent_searches(
    limit: int = Query(10, ge=1, le=20),
    current_user: User = Depends(get_current_user)
):
    """Get recent search queries for the current user"""

    # This would typically be stored in the database or cache
    # For now, return empty list as this is a new feature
    return {
        "recent_searches": [],
        "popular_searches": [
            "status:done",
            "overdue:true",
            "priority:high",
            "billable:true",
            "user:me"
        ]
    }