import json
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None

from .config import settings


class SessionManager:
    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis for session storage"""
        if not REDIS_AVAILABLE:
            print("⚠️ Redis not available, session persistence disabled")
            return

        try:
            self.redis_client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
                retry_on_timeout=True,
                health_check_interval=30
            )
            # Test connection
            await self.redis_client.ping()
            print("✅ Connected to Redis for session management")
        except Exception as e:
            print(f"❌ Failed to connect to Redis for sessions: {e}")
            self.redis_client = None

    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()

    def _session_key(self, session_id: str) -> str:
        """Generate Redis key for session"""
        return f"session:{session_id}"

    def _user_sessions_key(self, user_id: int) -> str:
        """Generate Redis key for user's sessions list"""
        return f"user_sessions:{user_id}"

    async def create_session(self, user_id: int, user_data: Dict[str, Any]) -> str:
        """Create a new session for user"""
        if not self.redis_client:
            return ""

        try:
            session_id = str(uuid.uuid4())
            session_data = {
                "user_id": user_id,
                "user_data": user_data,
                "created_at": datetime.utcnow().isoformat(),
                "last_activity": datetime.utcnow().isoformat()
            }

            # Store session data
            session_key = self._session_key(session_id)
            await self.redis_client.setex(
                session_key,
                settings.session_expire_seconds,
                json.dumps(session_data)
            )

            # Add session to user's session list
            user_sessions_key = self._user_sessions_key(user_id)
            await self.redis_client.sadd(user_sessions_key, session_id)
            await self.redis_client.expire(user_sessions_key, settings.session_expire_seconds)

            print(f"✅ Created session {session_id} for user {user_id}")
            return session_id

        except Exception as e:
            print(f"❌ Failed to create session: {e}")
            return ""

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data by session ID"""
        if not self.redis_client or not session_id:
            return None

        try:
            session_key = self._session_key(session_id)
            session_data = await self.redis_client.get(session_key)

            if session_data:
                data = json.loads(session_data)
                # Update last activity
                data["last_activity"] = datetime.utcnow().isoformat()
                await self.redis_client.setex(
                    session_key,
                    settings.session_expire_seconds,
                    json.dumps(data)
                )
                return data
            return None

        except Exception as e:
            print(f"❌ Failed to get session {session_id}: {e}")
            return None

    async def update_session(self, session_id: str, user_data: Dict[str, Any]):
        """Update session with new user data"""
        if not self.redis_client:
            return

        try:
            session_data = await self.get_session(session_id)
            if session_data:
                session_data["user_data"] = user_data
                session_data["last_activity"] = datetime.utcnow().isoformat()

                session_key = self._session_key(session_id)
                await self.redis_client.setex(
                    session_key,
                    settings.session_expire_seconds,
                    json.dumps(session_data)
                )
                print(f"✅ Updated session {session_id}")

        except Exception as e:
            print(f"❌ Failed to update session {session_id}: {e}")

    async def delete_session(self, session_id: str):
        """Delete a specific session"""
        if not self.redis_client:
            return

        try:
            session_data = await self.get_session(session_id)
            if session_data:
                user_id = session_data["user_id"]

                # Remove from session store
                session_key = self._session_key(session_id)
                await self.redis_client.delete(session_key)

                # Remove from user's session list
                user_sessions_key = self._user_sessions_key(user_id)
                await self.redis_client.srem(user_sessions_key, session_id)

                print(f"✅ Deleted session {session_id}")

        except Exception as e:
            print(f"❌ Failed to delete session {session_id}: {e}")

    async def delete_user_sessions(self, user_id: int):
        """Delete all sessions for a user (logout from all devices)"""
        if not self.redis_client:
            return

        try:
            user_sessions_key = self._user_sessions_key(user_id)
            session_ids = await self.redis_client.smembers(user_sessions_key)

            # Delete all sessions
            for session_id in session_ids:
                session_key = self._session_key(session_id)
                await self.redis_client.delete(session_key)

            # Clear user sessions list
            await self.redis_client.delete(user_sessions_key)

            print(f"✅ Deleted all sessions for user {user_id}")

        except Exception as e:
            print(f"❌ Failed to delete user sessions for {user_id}: {e}")

    async def cleanup_expired_sessions(self):
        """Clean up expired sessions (called periodically)"""
        if not self.redis_client:
            return

        try:
            # Redis handles TTL automatically, but we can clean up user session lists
            pattern = "user_sessions:*"
            async for key in self.redis_client.scan_iter(match=pattern):
                session_ids = await self.redis_client.smembers(key)
                valid_sessions = []

                for session_id in session_ids:
                    session_key = self._session_key(session_id)
                    if await self.redis_client.exists(session_key):
                        valid_sessions.append(session_id)

                # Update user sessions list with only valid sessions
                if valid_sessions:
                    await self.redis_client.delete(key)
                    await self.redis_client.sadd(key, *valid_sessions)
                    await self.redis_client.expire(key, settings.session_expire_seconds)
                else:
                    await self.redis_client.delete(key)

        except Exception as e:
            print(f"❌ Failed to cleanup expired sessions: {e}")

    async def get_active_sessions_count(self, user_id: int) -> int:
        """Get count of active sessions for a user"""
        if not self.redis_client:
            return 0

        try:
            user_sessions_key = self._user_sessions_key(user_id)
            return await self.redis_client.scard(user_sessions_key)
        except Exception as e:
            print(f"❌ Failed to get session count for user {user_id}: {e}")
            return 0


# Global session manager instance
session_manager = SessionManager()