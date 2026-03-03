"""KEYSTONE FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.config import settings
from app.database import Base, engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables and seed data on startup."""
    from app.database import async_session

    logger.info("KEYSTONE starting up — creating database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables ready.")

    # Seed canonical fields for schema mapping
    try:
        from app.seeds.canonical_fields import seed_canonical_fields

        async with async_session() as session:
            await seed_canonical_fields(session)
            await session.commit()
        logger.info("Canonical field seeding complete.")
    except Exception as e:
        logger.warning(f"Canonical field seeding skipped: {e}")

    # Seed default classification setting
    try:
        from sqlalchemy import select
        from app.models.system_settings import SystemSetting
        async with async_session() as session:
            existing = await session.execute(
                select(SystemSetting).where(SystemSetting.key == "classification")
            )
            if not existing.scalars().first():
                import json
                default_classification = json.dumps({
                    "level": "UNCLASSIFIED",
                    "banner_text": "UNCLASSIFIED",
                    "color": "green",
                })
                session.add(SystemSetting(key="classification", value=default_classification))
                await session.commit()
                logger.info("Default classification setting seeded.")
    except Exception as e:
        logger.warning(f"Classification setting seed skipped: {e}")

    # Auto-seed units, users, and sample data in development mode
    if settings.ENV_MODE == "development":
        await _run_dev_seeds()

    yield
    logger.info("KEYSTONE shutting down.")


async def _run_dev_seeds():
    """Run seed scripts in development mode. Idempotent — skips existing records."""
    from app.database import async_session
    from sqlalchemy import select, func
    from app.models.unit import Unit
    from app.models.user import User
    from app.models.supply import SupplyStatusRecord

    # 1. Seed unit hierarchy
    try:
        from seed.seed_units import create_unit_tree, UNIT_HIERARCHY

        async with async_session() as db:
            existing = await db.execute(select(func.count(Unit.id)))
            if existing.scalar() == 0:
                unit_map = await create_unit_tree(db, UNIT_HIERARCHY)
                await db.commit()
                logger.info(f"Seeded {len(unit_map) // 2} units.")
            else:
                logger.info("Units already exist, skipping unit seed.")
    except Exception as e:
        logger.warning(f"Unit seeding failed: {e}")

    # 2. Seed users
    try:
        from seed.seed_users import seed_users_from_session, SEED_USERS

        async with async_session() as db:
            existing = await db.execute(select(func.count(User.id)))
            if existing.scalar() == 0:
                await seed_users_from_session(db)
                await db.commit()
                logger.info("Seed users created.")
            else:
                logger.info("Users already exist, skipping user seed.")
    except Exception as e:
        logger.warning(f"User seeding failed: {e}")

    # 3. Seed sample data
    try:
        from seed.sample_data import seed_sample_data_from_session

        async with async_session() as db:
            existing = await db.execute(select(func.count(SupplyStatusRecord.id)))
            if existing.scalar() == 0:
                await seed_sample_data_from_session(db)
                await db.commit()
                logger.info("Sample data seeded.")
            else:
                logger.info("Sample data already exists, skipping data seed.")
    except Exception as e:
        logger.warning(f"Sample data seeding failed: {e}")


app = FastAPI(
    title="KEYSTONE",
    description=(
        "USMC Logistics Intelligence Application — "
        "Automated ingestion, analysis, and reporting of "
        "supply, equipment, and transportation data."
    ),
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers under /api/v1
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "KEYSTONE", "version": "0.1.0"}
