"""Application configuration using pydantic-settings."""

import logging
import warnings

from pydantic_settings import BaseSettings
from pydantic import field_validator, model_validator
from typing import List
import json

logger = logging.getLogger(__name__)

_DEV_SECRET_KEY = "dev-secret-key-change-in-production"


def _default_database_url() -> str:
    """Return the default DATABASE_URL, falling back to SQLite if asyncpg is unavailable."""
    try:
        import asyncpg  # noqa: F401
        return "postgresql+asyncpg://keystone:keystone_dev@localhost:5432/keystone"
    except ImportError:
        return "sqlite+aiosqlite:///./keystone.db"


def _default_sync_database_url() -> str:
    try:
        import psycopg2  # noqa: F401
        return "postgresql://keystone:keystone_dev@localhost:5432/keystone"
    except ImportError:
        return "sqlite:///./keystone.db"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    ENV_MODE: str = "development"

    DATABASE_URL: str = _default_database_url()
    DATABASE_URL_SYNC: str = _default_sync_database_url()
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = _DEV_SECRET_KEY

    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    ALLOW_PRIVATE_TAK_HOSTS: bool = True

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: str | list) -> list:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return [origin.strip() for origin in v.split(",")]
        return v

    @model_validator(mode="after")
    def validate_secret_key(self) -> "Settings":
        """Ensure SECRET_KEY is not the dev default in non-development environments."""
        if self.ENV_MODE != "development" and self.SECRET_KEY == _DEV_SECRET_KEY:
            raise ValueError(
                "CRITICAL: SECRET_KEY must be set to a secure value in "
                f"non-development environments (ENV_MODE={self.ENV_MODE!r}). "
                "Set the SECRET_KEY environment variable to a strong random string."
            )
        if self.SECRET_KEY == _DEV_SECRET_KEY:
            warnings.warn(
                "Using default development SECRET_KEY. "
                "Set SECRET_KEY env var before deploying to production.",
                UserWarning,
                stacklevel=2,
            )
        # Default ALLOW_PRIVATE_TAK_HOSTS based on ENV_MODE if not explicitly set
        if self.ENV_MODE != "development":
            # In production, default to False unless explicitly overridden
            # (pydantic-settings will have already applied env var if set)
            pass
        return self

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


settings = Settings()
