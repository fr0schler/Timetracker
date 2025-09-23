from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Any, Optional
import json
import asyncio
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ConnectionManager:
    """WebSocket connection manager for real-time updates"""

    def __init__(self):
        # Organization-based connections: {org_id: {user_id: [websockets]}}
        self.active_connections: Dict[int, Dict[int, List[WebSocket]]] = {}
        # User typing status: {org_id: {user_id: typing_status}}
        self.typing_status: Dict[int, Dict[int, Dict[str, Any]]] = {}

    async def connect(self, websocket: WebSocket, organization_id: int, user_id: int):
        """Accept WebSocket connection and add to organization room"""
        await websocket.accept()

        if organization_id not in self.active_connections:
            self.active_connections[organization_id] = {}

        if user_id not in self.active_connections[organization_id]:
            self.active_connections[organization_id][user_id] = []

        self.active_connections[organization_id][user_id].append(websocket)

        # Notify others about user joining
        await self.broadcast_to_organization(
            organization_id,
            {
                "type": "user_online",
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            },
            exclude_user=user_id
        )

        logger.info(f"User {user_id} connected to organization {organization_id}")

    async def disconnect(self, websocket: WebSocket, organization_id: int, user_id: int):
        """Remove WebSocket connection"""
        try:
            if (organization_id in self.active_connections and
                user_id in self.active_connections[organization_id]):

                if websocket in self.active_connections[organization_id][user_id]:
                    self.active_connections[organization_id][user_id].remove(websocket)

                # Clean up empty lists
                if not self.active_connections[organization_id][user_id]:
                    del self.active_connections[organization_id][user_id]

                    # Clean up typing status
                    if (organization_id in self.typing_status and
                        user_id in self.typing_status[organization_id]):
                        del self.typing_status[organization_id][user_id]

                    # Notify others about user leaving
                    await self.broadcast_to_organization(
                        organization_id,
                        {
                            "type": "user_offline",
                            "user_id": user_id,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    )

                # Clean up empty organizations
                if not self.active_connections[organization_id]:
                    del self.active_connections[organization_id]
                    if organization_id in self.typing_status:
                        del self.typing_status[organization_id]

            logger.info(f"User {user_id} disconnected from organization {organization_id}")

        except Exception as e:
            logger.error(f"Error disconnecting user {user_id}: {e}")

    async def send_personal_message(self, message: dict, organization_id: int, user_id: int):
        """Send message to specific user"""
        if (organization_id in self.active_connections and
            user_id in self.active_connections[organization_id]):

            for websocket in self.active_connections[organization_id][user_id]:
                try:
                    await websocket.send_text(json.dumps(message))
                except WebSocketDisconnect:
                    await self.disconnect(websocket, organization_id, user_id)
                except Exception as e:
                    logger.error(f"Error sending personal message: {e}")

    async def broadcast_to_organization(
        self,
        organization_id: int,
        message: dict,
        exclude_user: Optional[int] = None
    ):
        """Broadcast message to all users in organization"""
        if organization_id not in self.active_connections:
            return

        disconnected_connections = []

        for user_id, websockets in self.active_connections[organization_id].items():
            if exclude_user and user_id == exclude_user:
                continue

            for websocket in websockets:
                try:
                    await websocket.send_text(json.dumps(message))
                except WebSocketDisconnect:
                    disconnected_connections.append((websocket, user_id))
                except Exception as e:
                    logger.error(f"Error broadcasting to user {user_id}: {e}")
                    disconnected_connections.append((websocket, user_id))

        # Clean up disconnected connections
        for websocket, user_id in disconnected_connections:
            await self.disconnect(websocket, organization_id, user_id)

    async def broadcast_task_update(self, organization_id: int, task_data: dict):
        """Broadcast task status/data updates"""
        message = {
            "type": "task_updated",
            "data": task_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_organization(organization_id, message)

    async def broadcast_time_entry_update(self, organization_id: int, time_entry_data: dict):
        """Broadcast time entry updates"""
        message = {
            "type": "time_entry_updated",
            "data": time_entry_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_organization(organization_id, message)

    async def broadcast_project_update(self, organization_id: int, project_data: dict):
        """Broadcast project updates"""
        message = {
            "type": "project_updated",
            "data": project_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        await self.broadcast_to_organization(organization_id, message)

    async def handle_typing_status(
        self,
        organization_id: int,
        user_id: int,
        typing_data: dict
    ):
        """Handle user typing status for comments/tasks"""
        if organization_id not in self.typing_status:
            self.typing_status[organization_id] = {}

        self.typing_status[organization_id][user_id] = {
            "is_typing": typing_data.get("is_typing", False),
            "context": typing_data.get("context"),  # task_id, comment_id, etc.
            "timestamp": datetime.utcnow().isoformat()
        }

        # Broadcast typing status to others
        await self.broadcast_to_organization(
            organization_id,
            {
                "type": "typing_status",
                "user_id": user_id,
                "data": self.typing_status[organization_id][user_id]
            },
            exclude_user=user_id
        )

        # Auto-clear typing status after 3 seconds
        if typing_data.get("is_typing"):
            await asyncio.sleep(3)
            if (organization_id in self.typing_status and
                user_id in self.typing_status[organization_id] and
                self.typing_status[organization_id][user_id]["timestamp"] ==
                typing_data.get("timestamp")):

                self.typing_status[organization_id][user_id]["is_typing"] = False
                await self.broadcast_to_organization(
                    organization_id,
                    {
                        "type": "typing_status",
                        "user_id": user_id,
                        "data": self.typing_status[organization_id][user_id]
                    },
                    exclude_user=user_id
                )

    def get_online_users(self, organization_id: int) -> List[int]:
        """Get list of online user IDs for organization"""
        if organization_id not in self.active_connections:
            return []
        return list(self.active_connections[organization_id].keys())

    def get_connection_count(self, organization_id: int) -> int:
        """Get total connection count for organization"""
        if organization_id not in self.active_connections:
            return 0
        return sum(
            len(websockets)
            for websockets in self.active_connections[organization_id].values()
        )


# Global connection manager
manager = ConnectionManager()


async def handle_websocket_message(
    organization_id: int,
    user_id: int,
    message_data: dict
):
    """Handle incoming WebSocket messages"""
    message_type = message_data.get("type")

    if message_type == "typing":
        await manager.handle_typing_status(
            organization_id,
            user_id,
            message_data.get("data", {})
        )
    elif message_type == "ping":
        # Heartbeat - send pong back
        await manager.send_personal_message(
            {"type": "pong", "timestamp": datetime.utcnow().isoformat()},
            organization_id,
            user_id
        )
    elif message_type == "request_online_users":
        # Send current online users
        online_users = manager.get_online_users(organization_id)
        await manager.send_personal_message(
            {
                "type": "online_users",
                "data": {"user_ids": online_users},
                "timestamp": datetime.utcnow().isoformat()
            },
            organization_id,
            user_id
        )
    else:
        logger.warning(f"Unknown message type: {message_type}")