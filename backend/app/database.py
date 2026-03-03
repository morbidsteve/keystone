"""Database engine, session factory, and base model."""

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base
from typing import AsyncGenerator

from app.config import settings

# Determine async driver URL
# In Docker: postgresql+asyncpg://...
# In dev/test fallback: sqlite+aiosqlite:///./keystone.db
_db_url = settings.DATABASE_URL

# Engine creation kwargs vary by backend
_engine_kwargs: dict = {"echo": False}
if _db_url.startswith("postgresql"):
    _engine_kwargs.update({"pool_size": 20, "max_overflow": 10, "pool_pre_ping": True})

engine = create_async_engine(_db_url, **_engine_kwargs)

async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
