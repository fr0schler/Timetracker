from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    database_url: str = Field(..., env="DATABASE_URL")
    secret_key: str = Field(..., env="SECRET_KEY")
    algorithm: str = Field(default="HS256", env="ALGORITHM")
    access_token_expire_minutes: int = Field(default=1440, env="ACCESS_TOKEN_EXPIRE_MINUTES")  # 24 hours instead of 30 minutes

    # Redis settings for caching and sessions
    redis_url: str = Field(default="redis://localhost:6379", env="REDIS_URL")
    session_expire_seconds: int = Field(default=86400, env="SESSION_EXPIRE_SECONDS")  # 24 hours

    # WebSocket settings
    websocket_enabled: bool = Field(default=True, env="WEBSOCKET_ENABLED")

    class Config:
        env_file = ".env"


settings = Settings()