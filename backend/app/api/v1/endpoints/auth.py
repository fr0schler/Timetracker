from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from ....core.config import settings
from ....core.database import get_db
from ....core.security import create_access_token, revoke_token, revoke_all_user_tokens
from ....schemas.user import User, UserCreate
from ....schemas.token import Token
from ....services.user_service import UserService
from ..deps import get_current_active_user

router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=User)
async def register(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    db_user = await UserService.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    return await UserService.create_user(db=db, user=user)


@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login user and return access token with session persistence"""
    user = await UserService.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Prepare user data for session
    user_data = {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "is_active": user.is_active
    }

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = await create_access_token(
        subject=user.id, user_data=user_data, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=User)
async def read_users_me(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user information"""
    return current_user


@router.post("/logout")
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    current_user: User = Depends(get_current_active_user)
):
    """Logout current user (revoke current session)"""
    await revoke_token(credentials.credentials)
    return {"message": "Successfully logged out"}


@router.post("/logout-all")
async def logout_all_devices(
    current_user: User = Depends(get_current_active_user)
):
    """Logout from all devices (revoke all user sessions)"""
    await revoke_all_user_tokens(current_user.id)
    return {"message": "Successfully logged out from all devices"}