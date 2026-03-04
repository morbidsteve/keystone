# KEYSTONE Backend

FastAPI backend for the USMC Logistics Common Operating Picture.

## Tech Stack

- **Python 3.11**
- **FastAPI** (async REST API framework)
- **SQLAlchemy 2.0** (async ORM via `asyncpg`)
- **Pydantic 2** (request/response validation)
- **Uvicorn** (ASGI server)
- **Celery 5.3** + **Redis 7** (async task queue)
- **PostgreSQL 15** + **PostGIS 3.4** (geospatial database)
- **spaCy** (NLP for mIRC chat log parsing)
- **Alembic** (database migrations)

## Quick Start

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Download spaCy NLP model for mIRC parsing
python -m spacy download en_core_web_sm

# Start PostgreSQL + Redis via Docker
docker compose up db redis -d

# Run the backend (auto-creates tables and seeds data in dev mode)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is available at `http://localhost:8000` with Swagger docs at `http://localhost:8000/docs`.

## Scripts

```bash
# Lint and format check
ruff check .
ruff format --check .

# Type checking (with SQLAlchemy false-positive suppressions)
mypy app/ --ignore-missing-imports \
  --disable-error-code arg-type \
  --disable-error-code assignment \
  --disable-error-code var-annotated

# Unit tests (uses SQLite in-memory, no PostgreSQL required)
pytest tests/ -v --cov=app

# Run Celery worker
celery -A app.tasks:celery_app worker --loglevel=info
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://keystone:keystone_dev@localhost:5432/keystone` | Async database connection |
| `DATABASE_URL_SYNC` | `postgresql://keystone:keystone_dev@localhost:5432/keystone` | Sync connection for Celery |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection |
| `SECRET_KEY` | `dev-secret-key-change-in-production` | JWT signing key (MUST change in prod) |
| `ENV_MODE` | `development` | `development` or `production` |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | JWT token expiry (8 hours) |
| `ALLOW_PRIVATE_TAK_HOSTS` | `true` | Allow TAK connections to RFC1918 |
| `ALLOWED_DATA_DIRS` | `["/data","/uploads","/import"]` | Allowed file ingestion dirs |

## Project Structure

```
app/
  api/              # REST endpoints (18 route modules)
  models/           # SQLAlchemy models (25+ models, 1.x Column() style)
  schemas/          # Pydantic request/response schemas
  core/             # Auth, permissions, military logic
  ingestion/        # Parsers: mIRC, Excel, TAK, routes
  analytics/        # Consumption, readiness, sustainability, anomaly detection
  seeds/            # Canonical field definitions
  utils/            # Coordinate conversion, helpers
  config.py         # pydantic-settings configuration
  database.py       # SQLAlchemy async engine + session
  main.py           # FastAPI app entry point
  tasks.py          # Celery task definitions

seed/               # Unit hierarchy (~403 units), users, sample data
simulator/          # Mock data simulator engine (see below)
alembic/            # Database migrations
tests/              # pytest test suite
```

## API Endpoints

All endpoints are prefixed with `/api/v1`. Authentication is via JWT bearer token.

| Route Group | Base Path | Description |
|-------------|-----------|-------------|
| Auth | `/auth` | Login, token refresh, user management |
| Dashboard | `/dashboard` | Commander overview, readiness, sustainability |
| Supply | `/supply` | Supply status CRUD, class I-X tracking |
| Equipment | `/equipment` | Fleet readiness aggregates by TAMCN |
| Equipment Individual | `/equipment/individual` | Per-asset tracking: faults, drivers, history |
| Maintenance | `/maintenance` | Work orders (full CRUD), parts, labor tracking |
| Transportation | `/transportation` | Movement lifecycle, convoy manifests |
| Personnel | `/personnel` | Personnel roster, weapons, ammo loads |
| Map | `/map` | Geospatial: unit positions, supply points, routes, convoys |
| Reports | `/reports` | Generate/list/finalize 7 report types |
| Alerts | `/alerts` | Alert management and acknowledgement |
| Ingestion | `/ingestion` | File upload: mIRC, Excel, route files |
| Data Sources | `/data-sources` | External source config and monitoring |
| Schema Mapping | `/schema-mapping` | Canonical field mapping for ingestion |
| TAK | `/tak` | TAK server connections and CoT data |
| Settings | `/settings` | System settings (classification, etc.) |
| Units | `/units` | USMC unit hierarchy (read) |

## Simulator

The simulator generates realistic logistics data streams for demos and testing:

```bash
# List all 20 available scenarios
python -m simulator list

# Run Steel Guardian at 60x speed
python -m simulator run --scenario=steel_guardian --speed=60

# Run against a remote instance
python -m simulator run --scenario=pacific_fury --speed=120 --url=https://keystone.example.mil
```

See `simulator/` directory for engine, scenario definitions, event types, and generators.

## Testing Notes

- Tests use `sqlite+aiosqlite://` (not PostgreSQL) for in-memory testing
- Models use SQLAlchemy 1.x `Column()` style (not 2.0 `Mapped[]`)
- mypy runs with `--disable-error-code arg-type,assignment,var-annotated` for SQLAlchemy compatibility
- Ruff is the linter and formatter (no flake8/black/isort)

## Docker

The backend Dockerfile is a multi-stage build:

1. **Builder stage**: Python 3.11, installs dependencies
2. **Production stage**: Non-root user (UID 1001), read-only filesystem, minimal attack surface

The same image is used for the `backend`, `celery_worker`, and `simulator` services with different entry commands.
