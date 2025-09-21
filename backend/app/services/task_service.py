from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..models.task import Task as TaskModel
from ..schemas.task import TaskCreate, TaskUpdate


class TaskService:
    @staticmethod
    async def get_task(db: AsyncSession, task_id: int) -> Optional[TaskModel]:
        """Get a single task by ID with relationships loaded"""
        result = await db.execute(
            select(TaskModel)
            .options(
                selectinload(TaskModel.subtasks),
                selectinload(TaskModel.time_entries)
            )
            .where(TaskModel.id == task_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def get_tasks_by_project(db: AsyncSession, project_id: int) -> List[TaskModel]:
        """Get all tasks for a specific project"""
        result = await db.execute(
            select(TaskModel)
            .options(
                selectinload(TaskModel.subtasks),
                selectinload(TaskModel.time_entries)
            )
            .where(TaskModel.project_id == project_id)
            .order_by(TaskModel.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def create_task(db: AsyncSession, task: TaskCreate) -> TaskModel:
        """Create a new task"""
        # Filter out fields that don't exist in the model
        task_data = task.model_dump(exclude_unset=True)

        # Map parent_id to parent_task_id if provided
        if 'parent_id' in task_data:
            task_data['parent_task_id'] = task_data.pop('parent_id')

        # Get current user from the request context (we'll need to get this from elsewhere)
        # For now, we'll leave created_by_id and organization_id as required by the caller

        db_task = TaskModel(**task_data)
        db.add(db_task)
        await db.commit()
        await db.refresh(db_task)

        # Load relationships
        return await TaskService.get_task(db, db_task.id)

    @staticmethod
    async def update_task(
        db: AsyncSession,
        task_id: int,
        task_update: TaskUpdate
    ) -> Optional[TaskModel]:
        """Update an existing task"""
        result = await db.execute(
            select(TaskModel).where(TaskModel.id == task_id)
        )
        db_task = result.scalar_one_or_none()

        if not db_task:
            return None

        # Update fields
        update_data = task_update.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_task, field, value)

        await db.commit()
        await db.refresh(db_task)

        # Return with relationships loaded
        return await TaskService.get_task(db, db_task.id)

    @staticmethod
    async def delete_task(db: AsyncSession, task_id: int) -> bool:
        """Delete a task and all its subtasks"""
        result = await db.execute(
            select(TaskModel).where(TaskModel.id == task_id)
        )
        db_task = result.scalar_one_or_none()

        if not db_task:
            return False

        await db.delete(db_task)
        await db.commit()
        return True

    @staticmethod
    async def get_task_hierarchy(db: AsyncSession, project_id: int) -> List[TaskModel]:
        """Get task hierarchy for a project (only root tasks with subtasks loaded)"""
        result = await db.execute(
            select(TaskModel)
            .options(
                selectinload(TaskModel.subtasks),
                selectinload(TaskModel.time_entries)
            )
            .where(TaskModel.project_id == project_id)
            .where(TaskModel.parent_id.is_(None))  # Only root tasks
            .order_by(TaskModel.created_at.desc())
        )
        return result.scalars().all()