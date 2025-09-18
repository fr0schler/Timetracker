from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from ..models.project import Project
from ..schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:
    @staticmethod
    async def get_projects(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> List[Project]:
        result = await db.execute(
            select(Project)
            .where(Project.user_id == user_id)
            .offset(skip)
            .limit(limit)
            .order_by(Project.created_at.desc())
        )
        return result.scalars().all()

    @staticmethod
    async def get_project(db: AsyncSession, project_id: int, user_id: int) -> Optional[Project]:
        result = await db.execute(
            select(Project).where(Project.id == project_id, Project.user_id == user_id)
        )
        return result.scalar_one_or_none()

    @staticmethod
    async def create_project(db: AsyncSession, project: ProjectCreate, user_id: int) -> Project:
        db_project = Project(**project.dict(), user_id=user_id)
        db.add(db_project)
        await db.commit()
        await db.refresh(db_project)
        return db_project

    @staticmethod
    async def update_project(
        db: AsyncSession, project_id: int, user_id: int, project_update: ProjectUpdate
    ) -> Optional[Project]:
        db_project = await ProjectService.get_project(db, project_id, user_id)
        if not db_project:
            return None

        update_data = project_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_project, field, value)

        await db.commit()
        await db.refresh(db_project)
        return db_project

    @staticmethod
    async def delete_project(db: AsyncSession, project_id: int, user_id: int) -> bool:
        db_project = await ProjectService.get_project(db, project_id, user_id)
        if not db_project:
            return False

        await db.delete(db_project)
        await db.commit()
        return True