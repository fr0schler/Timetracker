import redis.asyncio as redis
from typing import Optional, Any
import json
import pickle
from .config import settings


class CacheService:
    """Redis-based caching service for improved performance"""

    def __init__(self):
        self.redis_client = None

    async def connect(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            print("Redis connected successfully")
        except Exception as e:
            print(f"Redis connection failed: {e}")
            self.redis_client = None

    async def disconnect(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if not self.redis_client:
            return None

        try:
            value = await self.redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            print(f"Cache get error: {e}")
        return None

    async def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        """Set value in cache with expiration"""
        if not self.redis_client:
            return False

        try:
            await self.redis_client.setex(
                key,
                expire,
                json.dumps(value, default=str)
            )
            return True
        except Exception as e:
            print(f"Cache set error: {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if not self.redis_client:
            return False

        try:
            await self.redis_client.delete(key)
            return True
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching pattern"""
        if not self.redis_client:
            return 0

        try:
            keys = await self.redis_client.keys(pattern)
            if keys:
                return await self.redis_client.delete(*keys)
        except Exception as e:
            print(f"Cache delete pattern error: {e}")
        return 0

    def cache_key(self, prefix: str, *args) -> str:
        """Generate cache key"""
        key_parts = [prefix] + [str(arg) for arg in args]
        return ":".join(key_parts)


# Global cache instance
cache = CacheService()


def cache_key_user_projects(user_id: int, org_id: int) -> str:
    """Cache key for user projects"""
    return cache.cache_key("user_projects", user_id, org_id)


def cache_key_project_tasks(project_id: int) -> str:
    """Cache key for project tasks"""
    return cache.cache_key("project_tasks", project_id)


def cache_key_user_time_entries(user_id: int, date: str) -> str:
    """Cache key for user time entries by date"""
    return cache.cache_key("user_time_entries", user_id, date)


def cache_key_project_analytics(project_id: int, period: str) -> str:
    """Cache key for project analytics"""
    return cache.cache_key("project_analytics", project_id, period)