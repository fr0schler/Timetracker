from datetime import datetime, timedelta
from typing import Any, Union, Optional, Dict
from jose import jwt, JWTError
from passlib.context import CryptContext
from .config import settings
from .session import session_manager

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


async def create_access_token(
    subject: Union[str, Any],
    user_data: Dict[str, Any] = None,
    expires_delta: timedelta = None
) -> str:
    """Create JWT token with optional session ID for persistent sessions"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )

    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access"
    }

    # Try to create session in Redis if available
    if user_data and session_manager.redis_client:
        # Extract user_id from user_data, not from subject (which might be email)
        user_id = user_data.get("id")
        if user_id:
            session_id = await session_manager.create_session(user_id, user_data)
            if session_id:
                to_encode["session_id"] = session_id

    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
    return encoded_jwt


async def verify_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify token and check session validity"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        user_id: str = payload.get("sub")
        session_id: str = payload.get("session_id")
        token_type: str = payload.get("type")

        if user_id is None or token_type != "access":
            return None

        # If no session_id or Redis unavailable, use basic JWT verification
        if not session_id or not session_manager.redis_client:
            return {
                "user_id": int(user_id),
                "session_id": session_id,
                "user_data": {}
            }

        # Check if session still exists in Redis
        session_data = await session_manager.get_session(session_id)
        if session_data is None:
            return None

        # Verify user_id matches session
        if session_data["user_id"] != int(user_id):
            return None

        return {
            "user_id": int(user_id),
            "session_id": session_id,
            "user_data": session_data["user_data"]
        }

    except JWTError:
        return None


async def revoke_token(token: str):
    """Revoke a specific token by deleting its session"""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        session_id: str = payload.get("session_id")

        if session_id:
            await session_manager.delete_session(session_id)

    except JWTError:
        pass


async def revoke_all_user_tokens(user_id: int):
    """Revoke all tokens for a user (logout from all devices)"""
    await session_manager.delete_user_sessions(user_id)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)