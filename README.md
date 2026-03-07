# KEYSTONE

**USMC Logistics Common Operating Picture**

![CI](https://github.com/morbidsteve/keystone/actions/workflows/ci.yml/badge.svg)
![DSOP](https://github.com/morbidsteve/keystone/actions/workflows/dsop.yml/badge.svg)
![Python 3.11](https://img.shields.io/badge/python-3.11-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)
![License](https://img.shields.io/badge/license-Distribution%20A-green)

---

## Overview

KEYSTONE is a logistics intelligence web application for the United States Marine Corps, built as a component of **Project Dynamis** (USMC's CJADC2 initiative). It ingests unstructured logistics data from sources Marines already use -- mIRC chat logs, Excel spreadsheets, GCSS-MC exports, TAK servers, and manual entry -- structures that data into a canonical schema, and presents it through dashboards, automated reports, and predictive analytics at every echelon from company to MEF.

The platform is designed for both connected and **air-gapped deployments**. A built-in tile proxy supports offline map operations, containers are hardened per the DoD Container Hardening Guide, and a full static demo mode enables evaluation without any backend infrastructure. The simulator generates realistic multi-day exercise data to support training, demos, and development.

KEYSTONE tracks the complete logistics picture: supply levels across all 10 NATO supply classes, fleet-level equipment readiness aggregates, individual vehicle status with faults and maintenance history, transportation movements with convoy manifests, personnel with weapons loads, and automated alerts when thresholds are breached.

---

## Screenshots

### Commander Dashboard
![Commander dashboard with role-based tabs (Commander/S-4/S-3), grouped sidebar with collapsible sections and badge counts, breadcrumb navigation, 6 readiness KPI cards (Supply 75%/Maintenance 87%/Transportation 91%/Engineering 95%/Health Svcs 92%/Services 78%), supply class status grid with percentage bars and DOS, equipment readiness donut charts (HMMWV 88%/MTVR 86%/LAV-25 79%/M777 89%/AN-PRC-117G 96%), sustainability projection bar chart, consumption rate trend line, active alerts panel, and live activity feed with real-time simulation events](docs/images/dashboard.png)

### Sidebar — Collapsed Icon-Only Mode
![Dashboard with sidebar collapsed to icon-only mode showing navigation icons, expand button at bottom, and maximized content area with full dashboard visible](docs/images/sidebar-collapsed.png)

### Interactive Map
![Leaflet map centered on Camp Pendleton with military symbology (APP-6D SIDCs), unit positions with blue friendly markers, supply point markers (LOG BASE/AMMO SP/FARP/LZ/WATER PT), convoy routes, MSR/ASR overlays, collapsible layer control panel with 8 toggleable layers, base map switcher (OSM/Satellite/Topo), comprehensive legend showing unit affiliation colors, supply status indicators, supply point types, route classifications, convoy status, vehicle status, and alert severity levels](docs/images/map.png)

### Readiness
![Unit readiness overview with DRRS-style C-ratings, 5 donut gauges (Overall C-2 78%, Equipment R-2 87%, Supply S-2 80%, Personnel P-3 75%, Training T-2 85%), limiting factor banner warning about CL III bulk fuel, DRRS ratings cards, all-units overview grid showing each unit's C-rating with color-coded percentage bars and LIMFAC descriptions, tabs for Overview/Trend/Strength/Subordinates](docs/images/readiness.png)

### Supply Status
![Supply tracking table with filterable supply class and status dropdowns, searchable records, sortable columns for Unit, Class, Item, On Hand, Required, percentage, DOS, Rate, and traffic-light Status badges (GREEN/AMBER/RED), supply class by unit horizontal bar chart, consumption trend line chart, and interactive DOS calculator tool](docs/images/supply.png)

### Equipment Readiness
![Equipment readiness table with sortable columns for Type, TAMCN, Unit, Authorized, On-Hand, MC, NMC, readiness percentage with color-coded bars, and Status badges (GREEN/AMBER/RED), maintenance work orders panel with priority-coded status cards, and readiness trend line chart showing 7-day fleet trends by equipment type](docs/images/equipment.png)

### Maintenance Management
![Maintenance management page with KPI summary cards (Deadline Rate, MTTR, Parts Fill Rate, Cannibalization Rate), tabbed views (Work Orders/PM Schedule/Deadlines/Analytics/Predictive), work order cards color-coded by priority (URGENT red/PRIORITY yellow/ROUTINE green) showing WO number, status, equipment, parts count, labor hours, and assigned technician](docs/images/maintenance.png)

### Requisitions
![Requisition management page with status filter tabs, requisition cards showing requisition number, priority level, requested items with quantities, requesting unit, submission date, and approval workflow status badges (SUBMITTED/APPROVED/FULFILLED/REJECTED)](docs/images/requisitions.png)

### Fuel / POL Management
![Fuel management dashboard with critical fuel warning banner, capacity KPI cards (Total Capacity, On Hand, Days of Supply, Daily Consumption), storage point cards showing fuel type, operational status, fill percentage bars, and MGRS coordinates, 14-day fuel projection chart with gallons and DOS dual axis, and op-tempo forecast metrics](docs/images/fuel.png)

### Transportation & Convoy Tracking
![Transportation page with Leaflet map showing active convoy routes on Camp Pendleton, convoy summary KPI cards (active convoys, vehicles, PAX, tonnage), tabbed views (Active Convoys/Convoy Planning/Lift Requests/Movement History), convoy status cards with origin-destination, cargo manifest, vehicle and PAX counts, departure/ETA times](docs/images/transportation.png)

### Custody & Sensitive Items — Item Registry
![Custody page showing sensitive items registry with KPI summary cards (Total Items 8, On Hand 5, Missing 1, Last Inventory date), missing item alert banner, tabbed views (Item Registry/Custody Transfers/Inventory/Missing Items), search and type filter, table with Serial #, Nomenclature, Type badges (WEAPON/CRYPTO/NVG/OPTIC/RADIO), Status badges (ON HAND/MISSING/IN MAINTENANCE/ISSUED), Condition code, Holder, and Last Inventory columns](docs/images/custody-registry.png)

### Custody — Register New Sensitive Item
![Register Sensitive Item form with fields for Serial Number, Nomenclature, Item Type dropdown (WEAPON/OPTIC/NVG/CRYPTO/RADIO/COMSEC/CLASSIFIED_DOCUMENT/EXPLOSIVE/MISSILE/OTHER), NSN, Security Classification (UNCLASSIFIED/CUI/SECRET/TOP SECRET), Condition Code, Hand Receipt Number, Current Holder Name, and Notes](docs/images/custody-register-item.png)

### Custody — Transfer History
![Custody transfers tab showing Recent Transfers table with Date, Item serial number, From personnel, To personnel with chevron arrow, transfer Type badges (LATERAL TRANSFER/MAINTENANCE RETURN/ISSUE/TEMPORARY LOAN), Document number, and Reason columns, plus NEW TRANSFER action button](docs/images/custody-transfers.png)

### Personnel & Manning
![Personnel page with strength summary cards (Authorized, Assigned, Present, Fill Rate), P-Rating badge, tabbed views (Alpha Roster/Strength/Billets/Qualifications/EAS Timeline), searchable roster with Name, EDIPI, Rank, Pay Grade, MOS, Billet, Status, Duty, Rifle qualification, PFT/CFT scores, and Location columns](docs/images/personnel.png)

### Medical / CASEVAC
![Medical page with CASEVAC tracking, casualty reports, medical treatment facility management, and blood product inventory tracking with status indicators](docs/images/medical.png)

### Data Ingestion
![Data ingestion page with upload interface supporting mIRC chat logs, Excel spreadsheets, TAK CoT XML, and route files (GeoJSON/GPX/KML/KMZ), ingestion history with status indicators and parsed record counts](docs/images/ingestion.png)

### Data Sources
![Data sources management page showing configured external data sources with connection status, source type, last sync time, and configuration options](docs/images/datasources.png)

### SITREP Reports
![Reports page with tabbed views (Reports/Generate/Templates/Schedules/Export), generated report list with status badges (FINALIZED/READY/DRAFT/GENERATING), report preview showing supply class status, equipment readiness, active convoys, and critical alerts with export options](docs/images/reports.png)

### Alerts & Predictions
![Alerts dashboard with severity summary cards (Total Active, Critical, Warning, Info), tabbed views (Alerts/Rules/Notifications/Preferences/Predictions), severity filter, toggle for acknowledged/resolved, expandable alert cards with description, severity badge, unit, timestamp, and ACK/RESOLVE action buttons](docs/images/alerts.png)

### Audit Log
![Audit trail page with KPI summary (Actions 24H: 6, Security Actions: 3, Unique Users: 4, Most Active: CUSTODY TRANSFER), Entity Type and Period filters, tabbed views (Audit Trail/Security Actions), table with Date/Time, User, color-coded Action badges (UPDATE/TRANSFER/EXPORT/LOGIN/STATUS CHANGE/INVENTORY START/DELETE), Entity Type, and Description columns](docs/images/audit-trail.png)

### Administration
![Admin panel with tabbed views (User Management/Unit Configuration/Classification/Map Tiles/Scenarios/Roles & Permissions/Simulation), user management table with status indicator, username, name, role badges (ADMIN/COMMANDER/S4/S3/OPERATOR/VIEWER), unit, last login, and edit actions](docs/images/admin.png)

### Documentation
![Built-in documentation page with API reference, user guides, and system documentation accessible directly within the application](docs/images/docs.png)

### Login & Role Picker (Demo Mode)
![Demo mode login page with role picker showing 24 named users organized by Command Element, Battalion Staff, Battery Commanders, Operators, and Higher HQ -- each card displays rank, name, billet, unit, MOS, and role description](docs/images/login-page.png)

---

## Architecture

```
                          ┌─────────────────────────────┐
                          │      React SPA (Vite)       │
                          │  Tailwind / Zustand / Leaflet│
                          │  Command Palette · Role Auth │
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
                              ┌──────────────▼──────────────┐
                              │  Living Simulation Engine    │
                              │  7 async generators · 4+     │
                              │  scenarios · speed control   │
                              │  up to 7200x                 │
                              └─────────────────────────────┘
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
- Commander dashboard with 30-second readiness assessment and KPI metrics
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
- Maintenance analytics with readiness trends and MTBF calculations

### Personnel and Manning
- Personnel roster with status (present, deployed, leave, TAD, medical, UA)
- Qualifications and weapons assignment tracking
- Ammunition load tracking
- Billet structure and strength snapshots (manning)
- Convoy personnel assignments with roles

### Transportation, Convoy Planning, and Manifests
- Movement tracking with status lifecycle (PLANNED -> IN_TRANSIT -> COMPLETE)
- Convoy manifest management with cargo items, vehicle allocations, personnel assignments
- Convoy planning with serials and lift requests
- Route planning with origin/destination and ETAs
- Convoy roles: driver, TC, gunner, PAX, medic

### Medical / CASEVAC
- CASEVAC tracking with casualty reports
- Medical treatment facility (MTF) management
- Blood product inventory tracking

### Fuel / POL Management
- Fuel storage point management
- Transaction tracking and consumption monitoring
- Consumption forecasting

### Sensitive Item Custody and Chain of Custody
- **Item Registry**: Register and track sensitive items (weapons, optics, NVGs, crypto, radios, COMSEC, explosives, missiles)
- **Register New Items**: Full registration form with serial number, nomenclature, type, NSN, security classification, condition code, hand receipt, holder assignment
- **Chain of Custody**: Visual timeline of custody transfers per item with from/to personnel, document numbers, and authorization
- **Custody Transfers**: Issue, turn-in, lateral transfer, temporary loan, maintenance turn-in/return, inventory adjustment
- **Inventory Events**: Track cyclic, sensitive item, and monthly inventories with discrepancy counts and witness documentation
- **Missing Item Alerts**: Immediate action alerts with FLIPL initiation tracking
- **Audit Trail**: Full audit logging of all custody actions with user, timestamp, action type, and entity tracking

### SITREP Reporting Engine
- Report templates with scheduled generation
- 7+ report types: LOGSTAT, Readiness, Supply Status, Equipment Status, Maintenance Summary, Movement Summary, Personnel Strength
- Structured report viewer with type-specific sections, summary statistics, and tabular breakdowns
- Draft/Final workflow with finalization tracking
- Export to file (text/JSON) for offline distribution or higher HQ submission
- Unit-scoped reporting with date range selection
- Automated data aggregation from current supply, equipment, maintenance, movement, and personnel records

### Notifications and Configurable Alert Rules
- Automatic alerts: low days-of-supply, low readiness, convoy delayed, anomaly detection
- Configurable alert rules with severity tracking
- Three severity levels: INFO, WARNING, CRITICAL
- Per-user notifications with preferences
- Unit-scoped with hierarchy visibility
- Acknowledgement tracking

### Requisition Workflow Management
- Supply requisition creation and lifecycle management
- Approval workflows and status tracking

### Inventory Management
- Inventory records and transaction tracking
- Stock level monitoring

### Equipment, Supply, and Ammunition Catalogs
- Equipment catalog with type definitions
- Supply catalog for standard items
- Ammunition catalog

### Unit Readiness
- Unit readiness snapshots with historical tracking
- Configurable readiness thresholds

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

### Data Ingestion
- **mIRC chat logs**: NLP + regex pipeline extracts supply, equipment, and convoy data from chat transcripts
- **Excel spreadsheets**: Auto-matches known LOGSTAT templates; column mapping wizard for new formats
- **TAK integration**: Connects to TAK servers for field-submitted logistics data via Cursor-on-Target (CoT) XML
- **Route files**: GeoJSON, GPX, KML, KMZ import for map overlays
- **Directory polling**: Automated ingestion from configured data directories
- **Schema mapping**: Admin UI to map any data format to KEYSTONE's canonical schema

### System-Wide Audit Logging
- Comprehensive audit trail across all modules
- User action tracking for accountability and compliance

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
- **Role picker login** with 24 named users across battalion structure (Command Element, Battalion Staff, Battery Commanders, Operators, Higher HQ)
- Each user card shows rank, name, billet, unit, MOS, and role description
- Activity feed with live simulation data showing requisitions, work orders, convoys, supply updates, alerts, personnel actions, and reports

### Living Simulation Engine
- **7 asynchronous generators** produce realistic logistics event streams:
  - Requisitions (supply requests with priority and line items)
  - Maintenance (work orders, faults, parts requests)
  - Convoys (movement planning, dispatch, arrival, delays)
  - Supply updates (consumption, receipts, transfers)
  - Alerts (threshold breaches, deadline equipment, convoy delays)
  - Personnel (strength reports, duty status changes, TAD/leave)
  - Reports (LOGSTATs, readiness reports, movement summaries)
- **4 exercise scenarios**: Garrison (steady-state), Pre-Deployment (ramp-up), ITX (Integrated Training Exercise), Steel Guardian (battalion FEX)
- Speed control from real-time up to **7200x** (1 sim-hour per real-second)
- Events feed into the activity feed, dashboards, and all data pages in real time

### Role-Based Dashboards
- Auto-routes authenticated users to their role-specific dashboard view
- **Commander**: Full COP with 6 readiness KPI cards, supply class status, equipment readiness, sustainability projections, consumption charts, and active alerts
- **S-4 (Logistics)**: Supply-focused view with class status, requisition queue, and sustainment metrics
- **S-3 (Operations)**: Operations-focused view with movement tracker, readiness overview, and operational tempo
- Role tabs on dashboard allow switching between perspectives without re-authentication

### Command Palette (Ctrl+K)
- Global search interface accessible from any page via `Ctrl+K` keyboard shortcut
- Searches across pages, personnel, equipment, units, requisitions, and work orders
- Results grouped by category with keyboard navigation (arrow keys, Enter to select)
- Fuzzy matching supports partial names, serial numbers, MOS codes, and unit designations
- Recent searches and quick navigation shortcuts

### UX and Navigation
- **Breadcrumb navigation** on every page showing current location in the app hierarchy
- **Keyboard shortcuts**: `G+D` (dashboard), `G+M` (map), `G+S` (supply), `G+E` (equipment), `G+T` (transportation), `G+P` (personnel), `G+R` (reports), `G+A` (alerts)
- **Toast notifications** for async operations (save confirmations, error alerts, status updates)
- **Contextual quick actions** on data rows (e.g., create work order from equipment, generate report from supply data)
- **Grouped sidebar** with collapsible sections (Operations, Logistics, Personnel, Data, Monitoring, Admin) and badge counts for active items
- **Icon-only collapse mode** for the sidebar to maximize workspace on smaller displays
- **Time range selector** (24H/7D/30D/90D) in the header for filtering dashboard and page data

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
│   │   ├── api/                # REST endpoints (31 route modules)
│   │   ├── models/             # SQLAlchemy models (162+ model/enum classes across 20+ model files)
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── core/               # Auth, permissions, military logic
│   │   ├── ingestion/          # Parsers: mIRC, Excel, TAK, routes
│   │   ├── analytics/          # Consumption, readiness, sustainability, anomaly
│   │   ├── seeds/              # Canonical field definitions
│   │   ├── utils/              # Coordinate conversion, helpers
│   │   ├── config.py           # pydantic-settings configuration
│   │   ├── database.py         # SQLAlchemy async engine + session
│   │   ├── main.py             # FastAPI app entry point
│   │   └── tasks/             # Celery task modules (7 task files)
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
│   │   ├── pages/              # 21 route pages
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
│   ├── tailwind.config.ts
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
