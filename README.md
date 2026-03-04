# KEYSTONE

**USMC Logistics Common Operating Picture**

![CI](https://github.com/morbidsteve/keystone/actions/workflows/ci.yml/badge.svg)
![Python 3.11](https://img.shields.io/badge/python-3.11-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)
![License](https://img.shields.io/badge/license-Distribution%20A-green)

---

## Overview

KEYSTONE is a logistics intelligence web application for the United States Marine Corps, built as a component of **Project Dynamis** (USMC's CJADC2 initiative). It ingests unstructured logistics data from sources Marines already use -- mIRC chat logs, Excel spreadsheets, GCSS-MC exports, TAK servers, and manual entry -- structures that data into a canonical schema, and presents it through dashboards, automated reports, and predictive analytics at every echelon from company to MEF.

The platform is designed for both connected and **air-gapped deployments**. A built-in tile proxy supports offline map operations, containers are hardened per the DoD Container Hardening Guide, and a full static demo mode enables evaluation without any backend infrastructure. The simulator generates realistic multi-day exercise data to support training, demos, and development.

KEYSTONE tracks the complete logistics picture: supply levels across all 10 NATO supply classes, fleet-level equipment readiness aggregates, individual vehicle status with faults and maintenance history, transportation movements with convoy manifests, personnel with weapons loads, and automated alerts when thresholds are breached.

---

## Architecture

```
                          ┌─────────────────────────────┐
                          │      React SPA (Vite)       │
                          │  Tailwind / Zustand / Leaflet│
                          └──────────┬──────────────────┘
                                     │ HTTPS
                          ┌──────────▼──────────────────┐
                          │    Nginx (TLS termination)   │
                          │     /api → backend:8000      │
                          │     /tiles → tile proxy      │
                          └──────────┬──────────────────┘
                                     │
                 ┌───────────────────▼───────────────────┐
                 │         FastAPI  (Uvicorn)             │
                 │   REST API · JWT Auth · RBAC · NLP     │
                 └──┬──────────┬──────────────┬──────────┘
                    │          │              │
           ┌───────▼──┐  ┌────▼─────┐  ┌─────▼──────┐
           │PostgreSQL │  │  Redis   │  │   Celery   │
           │ + PostGIS │  │  cache   │  │   worker   │
           └──────────┘  └──────────┘  └────────────┘
                                             │
                                    ┌────────▼────────┐
                                    │    Simulator     │
                                    │  (demo profile)  │
                                    └─────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5.3, Vite 5, Tailwind CSS, Zustand, TanStack Query/Table, Leaflet + react-leaflet, milsymbol, Recharts, Lucide React |
| **Backend** | Python 3.11, FastAPI, SQLAlchemy 2.0 (async), Pydantic 2, Uvicorn |
| **Database** | PostgreSQL 15 + PostGIS 3.4 |
| **Task Queue** | Celery 5.3 + Redis 7 |
| **NLP** | spaCy (en_core_web_sm) + custom regex pipelines |
| **Ingestion** | mIRC parser, Excel template matcher, TAK CoT XML, GeoJSON/GPX/KML/KMZ route parsers |
| **Infrastructure** | Docker, docker-compose, nginx-unprivileged, Alembic migrations |
| **CI/CD** | GitHub Actions (5-phase DevSecOps pipeline), Cosign image signing, GHCR |
| **Geospatial** | MGRS coordinate conversion, tile proxy (OSM/satellite/topo), military symbology (APP-6D SIDCs) |

---

## Features

### Dashboard and Analytics
- Commander dashboard with 30-second readiness assessment
- Supply status aggregation across all 10 NATO supply classes (I-X)
- Consumption rate forecasting and sustainability projections
- Equipment readiness summaries with fleet-level aggregates
- Active alert summary with severity breakdown
- Transportation movement status overview

### Supply Tracking
- All 10 NATO supply classes with on-hand quantities, required quantities, and days-of-supply
- Traffic-light status (GREEN/AMBER/RED) based on DOS thresholds
- Consumption rate tracking and reorder point management
- Per-unit supply breakdown with hierarchy roll-up

### Equipment Readiness
- Fleet-level readiness aggregates by equipment type
- Individual vehicle/asset tracking with serial numbers and bumper numbers
- Fault tracking with severity levels (safety, deadline, minor)
- Driver assignment management
- Maintenance history per asset

### Maintenance Work Orders
- Full lifecycle tracking: OPEN -> IN_PROGRESS -> WAITING_PARTS -> COMPLETE
- Parts management with sourcing (on-hand, ordered, cannibalized)
- Labor tracking by type (inspection, repair, PMCS, modification)
- Work order categories: corrective, preventive, modification, inspection

### Transportation and Convoys
- Movement tracking with status lifecycle (PLANNED -> IN_TRANSIT -> COMPLETE)
- Convoy manifest management with cargo items, vehicle allocations, personnel assignments
- Route planning with origin/destination and ETAs
- Convoy roles: driver, TC, gunner, PAX, medic

### Interactive Map
- Leaflet-based map with three tile layers: OpenStreetMap, satellite imagery, topographic
- Military symbology rendering (APP-6D SIDCs via milsymbol, 15-character codes)
- Unit positions with MGRS coordinate display
- Supply point visualization (ASP, FSP, FARP, water point, ammo dump, etc.)
- Route overlays with GeoJSON/GPX/KML/KMZ import
- Convoy position tracking on active routes
- Tile proxy for air-gapped deployments (no external network required)
- Cursor coordinate display (lat/lon + MGRS), distance measurement tool
- Nearby unit/asset search, context menu actions

### Personnel Tracking
- Personnel roster with status (present, deployed, leave, TAD, medical, UA)
- Weapons assignment tracking
- Ammunition load tracking
- Convoy personnel assignments with roles

### Report Generation
- 7 report types: LOGSTAT, Readiness, Supply Status, Equipment Status, Maintenance Summary, Movement Summary, Personnel Strength
- Structured report viewer with type-specific sections, summary statistics, and tabular breakdowns
- Draft/Final workflow with finalization tracking
- Export to file (text/JSON) for offline distribution or higher HQ submission
- Unit-scoped reporting with date range selection
- Automated data aggregation from current supply, equipment, maintenance, movement, and personnel records

### Alert System
- Automatic alerts: low days-of-supply, low readiness, convoy delayed, anomaly detection
- Three severity levels: INFO, WARNING, CRITICAL
- Unit-scoped with hierarchy visibility
- Acknowledgement tracking

### Data Ingestion
- **mIRC chat logs**: NLP + regex pipeline extracts supply, equipment, and convoy data from chat transcripts
- **Excel spreadsheets**: Auto-matches known LOGSTAT templates; column mapping wizard for new formats
- **TAK integration**: Connects to TAK servers for field-submitted logistics data via Cursor-on-Target (CoT) XML
- **Route files**: GeoJSON, GPX, KML, KMZ import for map overlays
- **Schema mapping**: Admin UI to map any data format to KEYSTONE's canonical schema

### Simulator
- Event-driven simulation engine with configurable speed multiplier
- **20 USMC exercise scenarios** organized by region and type:
  - **Pre-Deployment Training (CONUS)**: Steel Guardian (7-day battalion FEX, 29 Palms), ITX (Integrated Training Exercise), Steel Knight (MAGTF combined arms), COMPTUEX (MEU composite training)
  - **Indo-Pacific**: Cobra Gold, Balikatan, Resolute Dragon, Ssang Yong, Kamandag, Valiant Shield, RIMPAC, Island Sentinel
  - **Europe / Africa / Middle East**: African Lion, Cold Response, Native Fury
  - **Americas / Maritime**: UNITAS
  - **Crisis Response**: Trident Spear
  - **Reserve Component**: Reserve ITX
  - **Deployment / Garrison**: Pacific Fury (135-day MEU cycle), Iron Forge (90-day III MEF Okinawa)
- Simulated events: supply consumption, equipment breakdowns, resupply convoys, LOGSTAT/readiness reports, phase transitions
- Breakdown probability scaled to operational tempo (LOW 3%, MEDIUM 8%, HIGH 15% per unit/day)

### Unit Hierarchy
- Complete active-duty USMC organizational structure (~403 units)
- All three MEFs (I, II, III), MARFORRES, MARSOC, Supporting Establishment
- Echelons from HQMC down to company level (with infantry company details)
- Unit Identification Codes (UICs), geographic coordinates, MGRS

### Admin Panel
- **User Management**: Create, edit, activate/deactivate users with role and unit assignment
- **Unit Hierarchy**: Interactive tree view of the complete USMC organizational structure with unit creation and editing
- **Classification Settings**: Configure classification level (UNCLASSIFIED through TS//SCI) with live banner preview and color-coded reference
- **Map Tile Settings**: Configure tile layer sources for OSM, satellite, and topographic layers (supports online and offline tile servers)

### Access Control
- 6 roles: ADMIN, COMMANDER, S4, S3, OPERATOR, VIEWER
- Unit hierarchy scoping (users see their unit and subordinates)
- JWT authentication with configurable token expiry (default 8 hours)
- Seed users for development only (blocked in non-development environments)

### Classification Banners
- Configurable classification level: UNCLASSIFIED, CUI, CONFIDENTIAL, SECRET, TOP SECRET
- Color-coded banners at top and bottom of viewport per IC/DoD standards
- Admin-configurable via settings API

### Responsive Design
- Responsive layout optimized for desktop, tablet, and mobile viewports
- Collapsible sidebar with hamburger menu on small screens
- Responsive grid layouts that reflow from multi-column to single-column
- Full-screen map mode for tactical use on tablets
- Scrollable tables with horizontal overflow on narrow displays

### Demo Mode
- Full static site deployment with mock data (no backend required)
- Auto-deployed to GitHub Pages via CI
- All pages functional with realistic USMC logistics data
- Toggle via `VITE_DEMO_MODE=true` build flag

### Future Capabilities (Planned)
- **GCSS-MC Integration**: Direct data feed from Global Combat Support System -- Marine Corps for automated supply and equipment synchronization
- **Predictive Analytics**: ML-based consumption forecasting and failure prediction models
- **Offline-First PWA**: Service worker support for disconnected field operations with background sync

---

## Quick Start

### Docker Compose (recommended)

```bash
# Clone the repository
git clone https://github.com/morbidsteve/keystone.git
cd keystone

# Start all services (backend, frontend, database, Redis)
docker compose up --build -d

# Wait for health checks to pass (~30 seconds)
docker compose ps

# Access the application
#   Frontend:  https://localhost  (self-signed cert)
#   API:       http://localhost:8000
#   API Docs:  http://localhost:8000/docs
```

To include the **simulator** (generates live mock data):

```bash
docker compose --profile demo up --build -d
```

### Default Credentials (Development Only)

| Username | Password | Role | Unit |
|----------|----------|------|------|
| `admin` | `admin123` | Admin | I MEF |
| `commander` | `cmd123` | Commander | 1st MarDiv |
| `s4officer` | `s4pass123` | S-4 | 1st Marines |
| `s3officer` | `s3pass123` | S-3 | 1st Marines |
| `operator` | `op123` | Operator | 1/1 |
| `viewer` | `view123` | Viewer | A Co 1/1 |

These accounts are **automatically seeded** when `ENV_MODE=development` (the default). They are blocked from creation in production.

---

## Development Setup

### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ with PostGIS (or use Docker for the database)
- Redis 7+

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Download spaCy NLP model for mIRC parsing
python -m spacy download en_core_web_sm

# Start PostgreSQL + Redis via Docker (if not running locally)
docker compose up db redis -d

# Run the backend (auto-creates tables and seeds data in dev mode)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm ci

# Start development server (proxies /api to localhost:8000)
npm run dev

# Access at http://localhost:5173
```

### Environment Variables

Create a `.env` file in the backend directory or set these in your environment:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://keystone:keystone_dev@localhost:5432/keystone` | Async database connection string |
| `DATABASE_URL_SYNC` | `postgresql://keystone:keystone_dev@localhost:5432/keystone` | Sync database connection string (Celery) |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection string |
| `SECRET_KEY` | `dev-secret-key-change-in-production` | JWT signing key (MUST change in production) |
| `ENV_MODE` | `development` | Environment mode (`development` or `production`) |
| `CORS_ORIGINS` | `["http://localhost:5173"]` | Allowed CORS origins (JSON array or comma-separated) |
| `JWT_ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | JWT token expiry (8 hours) |
| `ALLOW_PRIVATE_TAK_HOSTS` | `true` | Allow TAK connections to private/RFC1918 addresses |
| `ALLOWED_DATA_DIRS` | `["/data","/uploads","/import"]` | Directories allowed for file ingestion |

Frontend environment variables (set at build time):

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_DEMO_MODE` | `false` | Build as static demo site with mock data |
| `VITE_BASE_PATH` | `/` | Base URL path (set to `/keystone/` for GitHub Pages) |

---

## Simulator

The simulator generates realistic logistics data streams by posting to the KEYSTONE API. It runs as a standalone Python module.

### List available scenarios

```bash
cd backend
python -m simulator list
```

```
Name                 Display Name                        Duration     Phases   Units
------------------------------------------------------------------------------------------
iron_forge           Iron Forge                          2160 hours   5        ...
pacific_fury         Pacific Fury                        3240 hours   6        ...
steel_guardian       Exercise Steel Guardian              168 hours   5        ...
```

### Run a simulation

```bash
# Run Steel Guardian at 60x speed (1 sim-minute = 1 real-second)
python -m simulator run --scenario=steel_guardian --speed=60

# Run against a remote KEYSTONE instance
python -m simulator run --scenario=pacific_fury --speed=120 --url=https://keystone.example.mil

# Environment variable overrides
SIM_SCENARIO=iron_forge SIM_SPEED=300 KEYSTONE_URL=http://backend:8000 python -m simulator run
```

### CLI Options

| Flag | Env Var | Default | Description |
|------|---------|---------|-------------|
| `--scenario` | `SIM_SCENARIO` | `steel_guardian` | Scenario name |
| `--speed` | `SIM_SPEED` | `60` | Speed multiplier (60 = 1 sim-min per real-sec) |
| `--url` | `KEYSTONE_URL` | `http://localhost:8000` | KEYSTONE API base URL |
| `--username` | -- | `simulator` | API username |
| `--password` | `SIM_PASSWORD` | -- | API password |
| `--log-level` | -- | `INFO` | Logging level |
| `--max-events-per-tick` | -- | `50` | Max events processed per tick |

### Docker (demo profile)

```bash
docker compose --profile demo up --build -d
# Simulator runs steel_guardian at 60x against the backend container
```

---

## Testing

### Backend

```bash
cd backend

# Lint and format check
ruff check .
ruff format --check .

# Type checking
mypy app/ --ignore-missing-imports \
  --disable-error-code arg-type \
  --disable-error-code assignment \
  --disable-error-code var-annotated

# Unit tests (uses SQLite in-memory, no PostgreSQL required)
pytest tests/ -v --cov=app
```

### Frontend

```bash
cd frontend

# Type checking (full project build check)
npx tsc -b

# Unit tests
npx vitest run

# With coverage
npx vitest run --coverage
```

---

## CI/CD Pipeline

The CI pipeline is a **5-phase DevSecOps workflow** (`.github/workflows/dsop.yml`) triggered on pushes to `main`/`develop` and pull requests:

| Phase | Jobs | Description |
|-------|------|-------------|
| **1. Lint** | Backend lint (ruff + mypy), Frontend lint (tsc -b) | Static analysis and type checking |
| **2. Build + Scan** | Docker image builds, Grype/Trivy CVE scans, Semgrep SAST, CodeQL | Container builds and vulnerability scanning |
| **3. Test + DAST** | Backend tests (pytest), Frontend tests (vitest), ZAP DAST | Unit tests and dynamic security testing |
| **4. Sign + Attest** | Cosign keyless signing, SBOM generation | Supply chain security |
| **5. Compliance Gate** | Final gate aggregating all prior results | All checks must pass |

A separate **Deploy to GitHub Pages** workflow builds the frontend in demo mode and publishes to `https://<org>.github.io/keystone/`.

---

## Project Structure

```
keystone/
├── backend/
│   ├── app/
│   │   ├── api/                # REST endpoints (18 route modules)
│   │   ├── models/             # SQLAlchemy models (25+ models)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── core/               # Auth, permissions, military logic
│   │   ├── ingestion/          # Parsers: mIRC, Excel, TAK, routes
│   │   ├── analytics/          # Consumption, readiness, sustainability, anomaly
│   │   ├── seeds/              # Canonical field definitions
│   │   ├── utils/              # Coordinate conversion, helpers
│   │   ├── config.py           # pydantic-settings configuration
│   │   ├── database.py         # SQLAlchemy async engine + session
│   │   ├── main.py             # FastAPI app entry point
│   │   └── tasks.py            # Celery task definitions
│   ├── seed/                   # Unit hierarchy (~403 units), users, sample data
│   ├── simulator/              # Mock data simulator engine
│   │   ├── cli.py              # CLI interface
│   │   ├── engine.py           # Simulation loop
│   │   ├── scenario.py         # Scenario definitions (20 exercises)
│   │   ├── events/             # Event types, queue, handlers
│   │   ├── generators/         # Data generators (mIRC, Excel, TAK, manual)
│   │   └── feeders/            # Data feed adapters
│   ├── alembic/                # Database migrations
│   ├── tests/                  # pytest test suite
│   ├── requirements.txt
│   └── Dockerfile              # Multi-stage, hardened (DoD CHG)
├── frontend/
│   ├── src/
│   │   ├── pages/              # 12 route pages
│   │   ├── components/         # UI components by domain
│   │   │   ├── dashboard/      # Readiness cards, supply charts
│   │   │   ├── map/            # Leaflet map, symbology, layers, overlays
│   │   │   ├── equipment/      # Readiness tables, maintenance queue
│   │   │   ├── transportation/ # Convoy map, movement tracker, route planner
│   │   │   ├── supply/         # Supply tables and charts
│   │   │   ├── admin/          # User/role/settings management
│   │   │   ├── layout/         # Sidebar, header, main layout
│   │   │   └── ui/             # Classification banner, demo banner
│   │   ├── api/                # API client + mock data for demo mode
│   │   ├── stores/             # Zustand stores (auth, dashboard, map, alerts, classification)
│   │   └── lib/                # Types, utilities
│   ├── nginx.conf              # Production nginx config with TLS + API proxy
│   ├── generate-cert.sh        # Self-signed TLS certificate generator
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── Dockerfile              # Multi-stage, nginx-unprivileged (DoD CHG)
├── scripts/
│   ├── download-tiles.py       # Offline tile downloader for air-gapped deployments
│   └── security/               # Security audit scripts
├── docs/                       # Project documentation
├── .github/
│   └── workflows/
│       ├── ci.yml              # Main CI pipeline
│       ├── dsop.yml            # Reusable DevSecOps pipeline
│       ├── deploy-pages.yml    # GitHub Pages deployment
│       ├── dependency-review.yml
│       └── nightly-scan.yml    # Scheduled vulnerability scans
└── docker-compose.yml          # Full stack: db, redis, backend, celery, frontend, simulator
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1`. Authentication is via JWT bearer token (obtain from `/api/v1/auth/login`).

| Route Group | Base Path | Description |
|-------------|-----------|-------------|
| **Authentication** | `/auth` | Login, token refresh, user management |
| **Dashboard** | `/dashboard` | Commander overview, readiness summary, sustainability projections |
| **Supply** | `/supply` | Supply status records (CRUD), class I-X tracking |
| **Equipment** | `/equipment` | Fleet readiness aggregates by type |
| **Equipment Individual** | `/equipment/individual` | Per-asset tracking: faults, drivers, maintenance history |
| **Maintenance** | `/maintenance` | Work orders, parts, labor tracking |
| **Transportation** | `/transportation` | Movement lifecycle, convoy manifests |
| **Personnel** | `/personnel` | Personnel roster, weapons, ammo loads |
| **Map** | `/map` | Geospatial data: unit positions, supply points, routes, convoys |
| **Reports** | `/reports` | LOGSTAT, readiness, supply status, roll-up generation |
| **Alerts** | `/alerts` | Alert management, acknowledgement |
| **Ingestion** | `/ingestion` | File upload: mIRC logs, Excel, route files (GeoJSON/GPX/KML/KMZ) |
| **Data Sources** | `/data-sources` | Data source configuration and monitoring |
| **Schema Mapping** | `/schema-mapping` | Canonical schema field mapping for ingestion |
| **TAK Integration** | `/tak` | TAK server connections and CoT data |
| **Settings** | `/settings` | System settings (classification level, etc.) |
| **Units** | `/units` | USMC unit hierarchy (read) |

Interactive API documentation is available at `/docs` (Swagger UI) and `/redoc` when the backend is running.

---

## Security Features

KEYSTONE is designed for deployment across classification domains with defense-in-depth security:

| Feature | Implementation |
|---------|---------------|
| **Authentication** | JWT bearer tokens with configurable expiry (default 8 hours, HS256) |
| **Authorization** | Role-based access control (6 roles) with unit hierarchy scoping |
| **Container Hardening** | Non-root users, read-only filesystems, `no-new-privileges`, minimal capabilities per DoD Container Hardening Guide |
| **TLS** | nginx terminates TLS with HSTS, CSP, X-Frame-Options, X-Content-Type-Options headers |
| **Image Signing** | Cosign keyless signing with SBOM attestation in CI pipeline |
| **Vulnerability Scanning** | Grype + Trivy CVE scans, Semgrep SAST, CodeQL, ZAP DAST on every push |
| **Classification Banners** | Configurable UNCLASSIFIED through TS//SCI with IC/DoD standard color coding |
| **Tile Proxy** | All external tile requests proxied through nginx to prevent CSP violations and data leakage |
| **Input Validation** | Pydantic 2 schema validation on all API inputs; parameterized SQL via SQLAlchemy |
| **Secrets Management** | Environment variable injection; no hardcoded credentials; seed users blocked outside development mode |

---

## Offline / Air-Gapped Deployment

KEYSTONE supports deployment in disconnected environments:

1. **Tile caching**: Pre-download map tiles for your AO:
   ```bash
   python scripts/download-tiles.py \
     --bbox 33.0,-117.6,33.5,-117.0 \
     --zoom 8-14 \
     --output ./tiles \
     --source osm
   ```

2. **Tile proxy**: Nginx and Vite dev server both proxy tile requests through `/tiles/{osm,satellite,topo}`, allowing you to serve cached tiles locally.

3. **Demo mode**: Build the frontend with `VITE_DEMO_MODE=true` for a fully functional static site with no backend dependency.

4. **Container images**: All containers run as non-root with read-only filesystems, hardened per the DoD Container Hardening Guide. Images are signed with Cosign for supply chain verification.

---

## License and Classification

DISTRIBUTION STATEMENT A. Approved for public release: distribution unlimited.

This software was developed for the United States Marine Corps under Project Dynamis. The codebase supports configurable classification banners and is designed for deployment across classification domains. All data shown in development mode and the demo site is **unclassified mock data**.
