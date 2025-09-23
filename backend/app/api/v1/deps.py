from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.config import settings
from ...core.database import get_db
from ...core.security import verify_access_token, revoke_token
from ...models.user import User
from ...models.organization import Organization
from ...services.user_service import UserService
from ...schemas.token import TokenData

security = HTTPBearer()


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Try new session-based verification first
    token_data = await verify_access_token(credentials.credentials)
    if token_data:
        user_id = token_data["user_id"]
        # Get fresh user data from database (in case user was updated)
        user = await UserService.get_user(db, user_id=user_id)
        if user is None:
            # Token is valid but user doesn't exist anymore - revoke the token
            await revoke_token(credentials.credentials)
            raise credentials_exception
        return user

    # Fallback to old JWT verification (for backward compatibility)
    try:
        payload = jwt.decode(
            credentials.credentials, settings.secret_key, algorithms=[settings.algorithm]
        )
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = await UserService.get_user_by_email(db, email=token_data.username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_organization(
    current_user: User = Depends(get_current_user),
) -> Organization:
    """Get the current user's organization"""
    organization = current_user.current_organization
    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User is not associated with any organization"
        )
    return organization