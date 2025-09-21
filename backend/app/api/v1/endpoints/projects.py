from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.database import get_db
from ....schemas.project import Project, ProjectCreate, ProjectUpdate
from ....schemas.task import Task, TaskCreate, TaskUpdate
from ....schemas.user import User
from ....services.project_service import ProjectService
from ....services.task_service import TaskService
from ..deps import get_current_active_user

router = APIRouter()


@router.get("/", response_model=List[Project])
async def read_projects(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all projects for the current user"""
    projects = await ProjectService.get_projects(db, user_id=current_user.id, skip=skip, limit=limit)
    return projects


@router.post("/", response_model=Project)
async def create_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new project"""
    return await ProjectService.create_project(db=db, project=project, user_id=current_user.id)


@router.get("/{project_id}", response_model=Project)
async def read_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific project by ID"""
    db_project = await ProjectService.get_project(db, project_id=project_id, user_id=current_user.id)
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project


@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: int,
    project: ProjectUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a project"""
    db_project = await ProjectService.update_project(
        db, project_id=project_id, user_id=current_user.id, project_update=project
    )
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return db_project


@router.delete("/{project_id}")
async def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a project"""
    success = await ProjectService.delete_project(db, project_id=project_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}


# Task endpoints for projects
@router.get("/{project_id}/tasks/", response_model=List[Task])
async def read_project_tasks(
    project_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all tasks for a specific project"""
    # Verify project exists and user has access
    project = await ProjectService.get_project(db, project_id=project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tasks = await TaskService.get_tasks_by_project(db, project_id=project_id)
    return tasks


@router.post("/{project_id}/tasks/", response_model=Task)
async def create_project_task(
    project_id: int,
    task: TaskCreate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new task for a project"""
    # Verify project exists and user has access
    project = await ProjectService.get_project(db, project_id=project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Set the project_id on the task
    task.project_id = project_id
    return await TaskService.create_task(db=db, task=task)


@router.get("/{project_id}/tasks/{task_id}", response_model=Task)
async def read_project_task(
    project_id: int,
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific task from a project"""
    # Verify project exists and user has access
    project = await ProjectService.get_project(db, project_id=project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task = await TaskService.get_task(db, task_id=task_id)
    if not task or task.project_id != project_id:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


@router.put("/{project_id}/tasks/{task_id}", response_model=Task)
async def update_project_task(
    project_id: int,
    task_id: int,
    task_update: TaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a task in a project"""
    # Verify project exists and user has access
    project = await ProjectService.get_project(db, project_id=project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    task = await TaskService.update_task(db, task_id=task_id, task_update=task_update)
    if not task or task.project_id != project_id:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


@router.delete("/{project_id}/tasks/{task_id}")
async def delete_project_task(
    project_id: int,
    task_id: int,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a task from a project"""
    # Verify project exists and user has access
    project = await ProjectService.get_project(db, project_id=project_id, user_id=current_user.id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Verify task exists and belongs to project
    task = await TaskService.get_task(db, task_id=task_id)
    if not task or task.project_id != project_id:
        raise HTTPException(status_code=404, detail="Task not found")

    success = await TaskService.delete_task(db, task_id=task_id)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found")

    return {"message": "Task deleted successfully"}