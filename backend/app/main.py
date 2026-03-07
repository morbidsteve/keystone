"""KEYSTONE FastAPI application entry point."""

import logging
import os
import subprocess
import sys
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api import api_router
from app.api.ws import router as ws_router
from app.api.search import router as search_router
from app.config import settings
from app.database import Base, engine, async_session
from app.middleware.request_logging import RequestLoggingMiddleware
from app.middleware.rate_limit import setup_rate_limiting
from prometheus_fastapi_instrumentator import Instrumentator

# ---------------------------------------------------------------------------
# Structured logging configuration
# ---------------------------------------------------------------------------
shared_processors = [
    structlog.contextvars.merge_contextvars,
    structlog.stdlib.add_log_level,
    structlog.stdlib.add_logger_name,
    structlog.processors.TimeStamper(fmt="iso"),
    structlog.processors.StackInfoRenderer(),
    structlog.processors.format_exc_info,
    structlog.processors.UnicodeDecoder(),
]

if settings.ENV_MODE == "development":
    renderer = structlog.dev.ConsoleRenderer()
else:
    renderer = structlog.processors.JSONRenderer()

structlog.configure(
    processors=shared_processors
    + [
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ],
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

formatter = structlog.stdlib.ProcessorFormatter(
    processors=[
        structlog.stdlib.ProcessorFormatter.remove_processors_meta,
        renderer,
    ],
)

handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(formatter)

root_logger = logging.getLogger()
root_logger.handlers.clear()
root_logger.addHandler(handler)
root_logger.setLevel(logging.INFO)

logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: create tables and seed data on startup."""
    # Skip all startup work in test mode
    if os.getenv("SKIP_SEEDS"):
        yield
        return

    from app.database import async_session

    if settings.ENV_MODE == "production":
        logger.info("KEYSTONE starting up — running Alembic migrations...")
        subprocess.run(["alembic", "upgrade", "head"], check=True, cwd="/app")
        logger.info("Alembic migrations complete.")
    else:
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

                default_classification = json.dumps(
                    {
                        "level": "UNCLASSIFIED",
                        "banner_text": "UNCLASSIFIED",
                        "color": "green",
                    }
                )
                session.add(
                    SystemSetting(key="classification", value=default_classification)
                )
                await session.commit()
                logger.info("Default classification setting seeded.")
    except Exception as e:
        logger.warning(f"Classification setting seed skipped: {e}")

    # Auto-seed units, users, and sample data in development mode
    if settings.ENV_MODE == "development" and not os.getenv("SKIP_SEEDS"):
        await _run_dev_seeds()

    # Start Living Simulation Engine if enabled
    sim_engine = None
    if os.getenv("SIM_ENABLED", "").lower() in ("1", "true", "yes"):
        try:
            from app.database import async_session
            from app.services.living_sim import (
                LivingSimulationEngine,
                SimulationConfig,
                set_living_sim_engine,
            )

            config = SimulationConfig(
                speed=int(os.getenv("SIM_SPEED", "60")),
                scenario=os.getenv("SIM_SCENARIO", "Garrison"),
            )
            sim_engine = LivingSimulationEngine(async_session, config)
            set_living_sim_engine(sim_engine)
            await sim_engine.start()
            logger.info(
                "Living Simulation Engine started (speed=%dx, scenario=%s)",
                config.speed,
                config.scenario,
            )
        except Exception as e:
            logger.warning("Failed to start Living Simulation Engine: %s", e)
    else:
        # Still initialize the engine instance so API endpoints work
        try:
            from app.database import async_session
            from app.services.living_sim import (
                LivingSimulationEngine,
                SimulationConfig,
                set_living_sim_engine,
            )

            sim_engine = LivingSimulationEngine(async_session, SimulationConfig())
            set_living_sim_engine(sim_engine)
            logger.info("Living Simulation Engine initialized (not auto-started)")
        except Exception as e:
            logger.warning("Failed to initialize Living Simulation Engine: %s", e)

    yield

    # Shutdown: stop sim engine
    if sim_engine and sim_engine.running:
        await sim_engine.stop()
        logger.info("Living Simulation Engine stopped on shutdown.")

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
        from seed.seed_users import seed_users_from_session

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

    # 4. Seed equipment catalog
    try:
        from seed.seed_equipment_catalog import seed_equipment_catalog

        async with async_session() as db:
            count = await seed_equipment_catalog(db)
            await db.commit()
            if count:
                logger.info(f"Equipment catalog: {count} items seeded.")
            else:
                logger.info("Equipment catalog already populated, skipping.")
    except Exception as e:
        logger.warning(f"Equipment catalog seeding failed: {e}")

    # 5. Seed supply catalog
    try:
        from seed.seed_supply_catalog import seed_supply_catalog

        async with async_session() as db:
            count = await seed_supply_catalog(db)
            await db.commit()
            if count:
                logger.info(f"Supply catalog: {count} items seeded.")
            else:
                logger.info("Supply catalog already populated, skipping.")
    except Exception as e:
        logger.warning(f"Supply catalog seeding failed: {e}")

    # 6. Seed ammunition catalog
    try:
        from seed.seed_ammunition_catalog import seed_ammunition_catalog

        async with async_session() as db:
            count = await seed_ammunition_catalog(db)
            await db.commit()
            if count:
                logger.info(f"Ammunition catalog: {count} items seeded.")
            else:
                logger.info("Ammunition catalog already populated, skipping.")
    except Exception as e:
        logger.warning(f"Ammunition catalog seeding failed: {e}")

    # 7. Seed readiness thresholds
    try:
        from seed.seed_readiness_thresholds import seed_readiness_thresholds

        async with async_session() as db:
            count = await seed_readiness_thresholds(db)
            await db.commit()
            if count:
                logger.info(f"Readiness thresholds: {count} items seeded.")
            else:
                logger.info("Readiness thresholds already populated, skipping.")
    except Exception as e:
        logger.warning(f"Readiness threshold seeding failed: {e}")

    # 8. Seed billet structure
    try:
        from seed.seed_billets import seed_billets

        async with async_session() as db:
            count = await seed_billets(db)
            await db.commit()
            if count:
                logger.info(f"Billet structure: {count} billets seeded.")
            else:
                logger.info("Billet structure already populated, skipping.")
    except Exception as e:
        logger.warning(f"Billet seeding failed: {e}")

    # 8a. Seed demo users (Living Sim)
    try:
        from seed.seed_demo_users import seed_demo_data

        async with async_session() as db:
            count = await seed_demo_data(db)
            await db.commit()
            if count:
                logger.info(f"Demo users: {count} users seeded.")
            else:
                logger.info("Demo users already populated, skipping.")
    except Exception as e:
        logger.warning(f"Demo user seeding failed: {e}")

    # 8b. Seed personnel roster
    try:
        from seed.seed_personnel import seed_personnel

        async with async_session() as db:
            count = await seed_personnel(db)
            await db.commit()
            if count:
                logger.info(f"Personnel: {count} Marines seeded.")
            else:
                logger.info("Personnel already populated, skipping.")
    except Exception as e:
        logger.warning(f"Personnel seeding failed: {e}")

    # 8c. Seed billet assignments (personnel -> billets)
    try:
        from seed.seed_personnel import seed_billet_assignments

        async with async_session() as db:
            count = await seed_billet_assignments(db)
            await db.commit()
            if count:
                logger.info(f"Billet assignments: {count} billets filled.")
            else:
                logger.info("Billet assignments already populated, skipping.")
    except Exception as e:
        logger.warning(f"Billet assignment seeding failed: {e}")

    # 9. Seed qualifications
    try:
        from seed.seed_qualifications import seed_qualifications

        async with async_session() as db:
            count = await seed_qualifications(db)
            await db.commit()
            if count:
                logger.info(f"Qualifications: {count} items seeded.")
            else:
                logger.info("Qualifications already populated, skipping.")
    except Exception as e:
        logger.warning(f"Qualification seeding failed: {e}")

    # 10. Seed maintenance work orders
    try:
        from seed.seed_maintenance import seed_maintenance

        async with async_session() as db:
            count = await seed_maintenance(db)
            await db.commit()
            if count:
                logger.info(f"Maintenance: {count} work orders seeded.")
            else:
                logger.info("Maintenance data already populated, skipping.")
    except Exception as e:
        logger.warning(f"Maintenance seeding failed: {e}")

    # 11. Seed sensitive item catalog
    try:
        from seed.seed_sensitive_item_catalog import seed_sensitive_item_catalog

        async with async_session() as db:
            count = await seed_sensitive_item_catalog(db)
            await db.commit()
            if count:
                logger.info(f"Sensitive item catalog: {count} items seeded.")
            else:
                logger.info("Sensitive item catalog already populated, skipping.")
    except Exception as e:
        logger.warning(f"Sensitive item catalog seeding failed: {e}")


app = FastAPI(
    title="KEYSTONE",
    description=(
        "## USMC Logistics Intelligence Application\n\n"
        "KEYSTONE provides automated ingestion, analysis, and reporting of "
        "supply, equipment, and transportation data for USMC logistics operations.\n\n"
        "### Capabilities\n"
        "- **Supply Tracking** — Monitor supply status, shortfalls, and readiness "
        "across echelons\n"
        "- **Equipment Management** — Track individual equipment items with "
        "maintenance history\n"
        "- **Transportation** — Convoy manifests, route tracking, and movement "
        "planning\n"
        "- **Automated Ingestion** — Parse CSV, XML, and JSON logistics reports\n"
        "- **Real-Time Alerts** — Configurable thresholds for readiness conditions\n"
        "- **COP Dashboard** — Commander, S-4, and S-3 operational views\n"
        "- **Map Overlay** — Unit positions with NATO MIL-STD-2525D symbology\n"
        "- **TAK Integration** — Push/pull CoT events to TAK Server\n\n"
        "### Authentication\n"
        "All endpoints (except `/api/v1/auth/login` and `/health`) require a valid "
        "JWT bearer token obtained from the login endpoint."
    ),
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    openapi_tags=[
        {
            "name": "Authentication",
            "description": ("User login, token issuance, and session management."),
        },
        {
            "name": "Dashboard",
            "description": (
                "Aggregated readiness metrics for Commander, S-4, and S-3 views."
            ),
        },
        {
            "name": "Supply",
            "description": (
                "Supply status records — shortfalls, readiness percentages, and trends."
            ),
        },
        {
            "name": "Equipment",
            "description": (
                "Unit-level equipment readiness and aggregated status reporting."
            ),
        },
        {
            "name": "Equipment Individual",
            "description": (
                "Individual equipment items — serial-level tracking and "
                "maintenance history."
            ),
        },
        {
            "name": "Transportation",
            "description": (
                "Movement requests, convoy tracking, and route management."
            ),
        },
        {
            "name": "Convoy Manifest",
            "description": (
                "Convoy manifest creation, vehicle assignments, and load planning."
            ),
        },
        {
            "name": "Reports",
            "description": (
                "Generate and retrieve formatted logistics reports (LOGSTAT, etc.)."
            ),
        },
        {
            "name": "Ingestion",
            "description": (
                "Upload and parse logistics data files (CSV, XML, JSON) with "
                "schema mapping."
            ),
        },
        {
            "name": "Alerts",
            "description": (
                "Readiness alerts, threshold configuration, and notification "
                "management."
            ),
        },
        {
            "name": "Units",
            "description": (
                "Unit hierarchy management — echelons, parent/child relationships, "
                "BILLETs."
            ),
        },
        {
            "name": "Schema Mapping",
            "description": (
                "Map external data source fields to KEYSTONE canonical schema."
            ),
        },
        {
            "name": "TAK Integration",
            "description": (
                "Push/pull Cursor-on-Target (CoT) events to/from TAK Server."
            ),
        },
        {
            "name": "Settings",
            "description": (
                "System-wide settings — classification level, banner text, "
                "and display options."
            ),
        },
        {
            "name": "Data Sources",
            "description": (
                "Manage external data source connections and ingestion schedules."
            ),
        },
        {
            "name": "Map",
            "description": (
                "Geospatial data for COP map — unit positions, routes, and overlays."
            ),
        },
        {
            "name": "Personnel",
            "description": ("Personnel strength tracking and manning reports."),
        },
        {
            "name": "Maintenance",
            "description": (
                "Equipment maintenance requests, scheduling, and work-order tracking."
            ),
        },
        {
            "name": "Readiness",
            "description": (
                "Unit readiness snapshots, DRRS ratings, strength tracking, "
                "and rollup analytics."
            ),
        },
        {
            "name": "Manning",
            "description": (
                "Billet structure (T/O), manning snapshots, and "
                "personnel fill tracking."
            ),
        },
    ],
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

# Request logging middleware (registered after CORS)
app.add_middleware(RequestLoggingMiddleware)

# Rate limiting
setup_rate_limiting(app)

# Prometheus metrics instrumentation
Instrumentator().instrument(app).expose(app)

# Include all API routers under /api/v1
app.include_router(api_router, prefix="/api/v1")

# WebSocket and search routers (registered directly on app to keep /api/v1 prefix)
app.include_router(ws_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1", tags=["Search"])


@app.get("/health")
async def health_check():
    """Health check endpoint with database and Redis connectivity checks."""
    checks = {"service": "KEYSTONE", "status": "healthy"}

    # Check database
    try:
        async with async_session() as session:
            await session.execute(text("SELECT 1"))
        checks["database"] = "connected"
    except Exception as e:
        checks["database"] = f"error: {str(e)}"
        checks["status"] = "degraded"

    # Check Redis
    try:
        import redis

        r = redis.from_url(settings.REDIS_URL)
        r.ping()
        checks["redis"] = "connected"
    except Exception as e:
        checks["redis"] = f"error: {str(e)}"
        checks["status"] = "degraded"

    status_code = 200 if checks["status"] == "healthy" else 503
    return JSONResponse(content=checks, status_code=status_code)
