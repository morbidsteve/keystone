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
  api/              # REST endpoints (31 route modules)
  models/           # SQLAlchemy models (162+ model/enum classes across 20+ model files, 1.x Column() style)
  schemas/          # Pydantic request/response schemas
  core/             # Auth, permissions, military logic
  ingestion/        # Parsers: mIRC, Excel, TAK, routes
  analytics/        # Consumption, readiness, sustainability, anomaly detection
  seeds/            # Canonical field definitions
  utils/            # Coordinate conversion, helpers
  config.py         # pydantic-settings configuration
  database.py       # SQLAlchemy async engine + session
  main.py           # FastAPI app entry point
  tasks/            # Celery task modules (7 task files)

seed/               # Unit hierarchy (~403 units), users, sample data
simulator/          # Mock data simulator engine (see below)
alembic/            # Database migrations
tests/              # pytest test suite
```

## API Endpoints

All endpoints are prefixed with `/api/v1`. Authentication is via JWT bearer token.

| Prefix | Module | Description |
|--------|--------|-------------|
| `/auth` | Authentication | JWT login, registration, token refresh |
| `/dashboard` | Dashboard | Readiness overview, KPI metrics |
| `/supply` | Supply | Class I-IX supply status, DOS tracking |
| `/equipment` | Equipment | Fleet aggregate readiness tracking |
| `/equipment/individual` | Equipment Individual | Per-vehicle tracking, faults, drivers |
| `/maintenance` | Maintenance | Work orders, parts, labor tracking |
| `/maintenance` | Maintenance Analytics | Readiness trends, MTBF calculations |
| `/transportation` | Transportation | Movement tracking |
| `/transportation` | Convoy Manifest | Convoy vehicle/personnel manifests |
| `/transportation` | Convoy Planning | Convoy plans, serials, lift requests |
| `/personnel` | Personnel | Marine roster, qualifications, weapons |
| `/manning` | Manning | Billet structure, strength snapshots |
| `/medical` | Medical | CASEVAC, casualty reports, MTFs, blood products |
| `/fuel` | Fuel | Storage points, transactions, consumption, forecasting |
| `/custody` | Custody & Accountability | Sensitive items, chain of custody, inventory, audit log |
| `/requisitions` | Requisitions | Supply requisition workflow |
| `/inventory` | Inventory | Inventory records, transactions |
| `/catalog` | Catalog | Equipment, supply, ammunition catalogs |
| `/readiness` | Readiness | Unit readiness snapshots, thresholds |
| `/reports` | Reports | SITREP generation, templates, schedules |
| `/alerts` | Alerts | Alert rules, severity tracking |
| `/notifications` | Notifications | Per-user notifications, preferences |
| `/ingestion` | Ingestion | Data upload, parsing, template mapping |
| `/data-sources` | Data Sources | External data source management |
| `/map` | Map | Geospatial locations, routes, supply points |
| `/units` | Units | Unit hierarchy management |
| `/schema-mapping` | Schema Mapping | Canonical field mapping |
| `/tak` | TAK Integration | TAK server connections |
| `/settings` | Settings | System configuration |
| `/simulator` | Simulator | Exercise scenario simulation |

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
