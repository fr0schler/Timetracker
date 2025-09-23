from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from fastapi.security import HTTPBearer
import json
import jwt
from typing import Optional

from ....core.websocket import manager, handle_websocket_message
from ....core.config import settings
from ....core.database import get_db
from ....models.user import User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

router = APIRouter()
security = HTTPBearer()


async def get_user_from_token(token: str, db: AsyncSession) -> Optional[User]:
    """Extract user from JWT token"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: int = payload.get("sub")
        if user_id is None:
            return None

        stmt = select(User).where(User.id == user_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()
    except jwt.PyJWTError:
        return None


@router.websocket("/ws/organizations/{organization_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    organization_id: int,
    token: Optional[str] = None
):
    """WebSocket endpoint for organization real-time updates"""

    # Authenticate user
    if not token:
        await websocket.close(code=4001, reason="Missing authentication token")
        return

    # Get database session
    async with get_db().__anext__() as db:
        user = await get_user_from_token(token, db)
        if not user:
            await websocket.close(code=4001, reason="Invalid authentication token")
            return

        # Check if user has access to organization
        user_orgs = [membership.organization_id for membership in user.organization_memberships]
        if organization_id not in user_orgs:
            await websocket.close(code=4003, reason="Access denied to organization")
            return

        # Connect user
        await manager.connect(websocket, organization_id, user.id)

        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                try:
                    message_data = json.loads(data)
                    await handle_websocket_message(organization_id, user.id, message_data)
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid JSON format"
                    }))
                except Exception as e:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": f"Message handling error: {str(e)}"
                    }))

        except WebSocketDisconnect:
            await manager.disconnect(websocket, organization_id, user.id)
        except Exception as e:
            print(f"WebSocket error: {e}")
            await manager.disconnect(websocket, organization_id, user.id)


@router.get("/ws/organizations/{organization_id}/stats")
async def get_websocket_stats(organization_id: int):
    """Get WebSocket connection statistics for organization"""
    online_users = manager.get_online_users(organization_id)
    connection_count = manager.get_connection_count(organization_id)

    return {
        "organization_id": organization_id,
        "online_users": online_users,
        "total_connections": connection_count,
        "unique_users_online": len(online_users)
    }