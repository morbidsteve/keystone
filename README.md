# KEYSTONE

**USMC Logistics Common Operating Picture**

![CI](https://github.com/morbidsteve/keystone/actions/workflows/ci.yml/badge.svg)
![DSOP](https://github.com/morbidsteve/keystone/actions/workflows/dsop.yml/badge.svg)
![Python 3.11](https://img.shields.io/badge/python-3.11-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.3-blue)
![License](https://img.shields.io/badge/license-Distribution%20A-green)

---

## What is KEYSTONE?

KEYSTONE gives Marine Corps logisticians a single screen to see everything that matters: supply levels, equipment readiness, convoy status, personnel strength, and fuel reserves -- from company to MEF, updated in real time.

Instead of piecing together the logistics picture from mIRC chats, Excel trackers, GCSS-MC exports, and radio reports, KEYSTONE ingests all of those sources automatically, structures the data, and presents it through dashboards, maps, automated SITREPs, and threshold-based alerts. When supply drops below days-of-supply thresholds, when a convoy is delayed, or when a deadline vehicle grounds a fleet -- KEYSTONE surfaces it immediately so you can act before it becomes a crisis.

Built as a component of **Project Dynamis** (USMC's CJADC2 initiative), KEYSTONE is designed for both connected and **air-gapped deployments**. A built-in tile proxy supports offline map operations, containers are hardened per the DoD Container Hardening Guide, and a full static demo mode enables evaluation without any backend infrastructure.

---

## How Marines Use KEYSTONE

### At a Glance: The Commander Dashboard

As a **Battalion Commander** or **MEF-level leader**, you open KEYSTONE and immediately see six readiness KPI cards -- Supply, Maintenance, Transportation, Engineering, Health Services, and Services -- each color-coded GREEN/AMBER/RED. Below that: a supply class status grid showing every NATO class with percentage bars and days-of-supply, equipment readiness donut charts for your key platforms, sustainability projections, consumption trends, and active alerts. No digging. No asking your S-4 to build a slide. The picture is already there.

![Commander dashboard with role-based tabs, 6 readiness KPI cards, supply class status grid, equipment readiness donut charts, sustainability projection chart, consumption rate trend, active alerts panel, and live activity feed](docs/images/dashboard.png)

Switch between **Commander**, **S-4**, and **S-3** perspectives using the role tabs at the top. Each view surfaces the data that role cares about most. Collapse the sidebar to icon-only mode when you need maximum screen space for briefings or tactical displays.

![Dashboard with sidebar collapsed to icon-only mode, showing navigation icons and maximized content area](docs/images/sidebar-collapsed.png)

---

### The Interactive Map: See Your Battlespace

The map is where the logistics picture comes alive. Every unit, supply point, convoy route, and logistics node is plotted on a Leaflet-based map with proper military symbology (APP-6D SIDCs). Three base map options -- OpenStreetMap, satellite imagery, and topographic -- let you match the view to your needs.

![Full map view of Camp Pendleton with unit markers using military symbology, supply point markers, convoy routes, MSR/ASR overlays, and comprehensive legend](docs/images/map-overview-full.png)

#### Click Any Unit to See Their Status

As an **S-4 Officer**, you click on I MEF and instantly see a supply status panel: overall readiness at GREEN 92%, with a breakdown by supply class showing days-of-supply bars for CL I through CL IX. Inbound resupply convoys are listed with ETAs. No phone calls, no waiting for the next LOGSTAT.

![Unit detail panel showing I MEF supply status at GREEN 92%, supply breakdown by class with DOS bars, and inbound resupply information](docs/images/map-unit-supply-panel.png)

#### Check Equipment Readiness from the Map

Switch to the Equipment tab on any unit's detail panel to see fleet status at a glance. LAV-25s, HMMWVs, M1A1s -- authorized vs. on-hand, mission capable vs. deadline, with readiness percentages. Identify equipment shortfalls without leaving the map.

![Equipment readiness tab showing LAV-25, HMMWV, and M1A1 fleet status with authorized, on-hand, and mission capable counts](docs/images/map-unit-equipment-tab.png)

#### Toggle Map Layers to Focus Your View

The layer control panel provides 8 toggleable overlays -- unit positions, supply points, convoy routes, MSRs/ASRs, and more -- plus base map switching. Show only what you need for the current brief or planning session.

![Layer control panel with 8 toggleable layers and base map options for OSM, Satellite, and Topographic views](docs/images/map-layer-controls.png)

#### Military Symbology Reference

A comprehensive legend shows every symbol on the map: unit affiliation colors, supply status indicators, supply point types, route classifications, convoy status, vehicle status, and alert severity levels. Built-in reference so no one has to guess what a marker means.

![Full legend panel showing military symbology reference including unit types, supply point types, route classifications, and status indicators](docs/images/map-legend-panel.png)

#### Inspect Any Supply Point

Click any supply point -- an ASP, FSP, FARP, water point, or log base -- to see its details: type, operational status, operating unit, and precise location in both GPS and MGRS coordinates.

![ASP BRAVO supply point detail showing type, operational status, operating unit, and GPS/MGRS coordinates](docs/images/map-asp-detail.png)

#### Zoom In on the Ground Truth

Zoom into the AO to see convoy routes traced along MSRs and ASRs, individual vehicle icons on the move, unit positions clustered around their operating areas, and log base markers with precise coordinates.

![Zoomed view showing convoy routes along MSR and ASR, vehicle icons, unit positions, and detailed terrain](docs/images/map-zoomed-convoys.png)

![Log Base marker with GPS and MGRS coordinates displayed at bottom of map](docs/images/map-logbase-click.png)

---

### Transportation: Track Every Movement

The Transportation page is the hub for all movement operations. As a **Movement Control Officer** or **S-4**, you see active convoys on a map alongside KPI cards: 4 active convoys, 20 vehicles on the road, 95 PAX moving, and 1 convoy delayed. Each convoy card shows origin, destination, cargo, vehicle count, PAX, and timing.

![Transportation overview with active convoys tab, map showing convoy positions, KPI cards for active convoys/vehicles/PAX/delayed, and convoy status cards](docs/images/transportation-overview.png)

#### Monitor Active Movements

The Active Movements view lists every movement in progress -- LOGPAC runs, MEDEVAC, equipment recovery operations -- with a throughput chart showing movement volume over time. Filter by type, status, or unit to find exactly what you need.

![Active movements list showing LOGPAC, MEDEVAC, and Equipment Recovery entries with status indicators and throughput chart](docs/images/transportation-movements.png)

#### Drill Into Convoy Manifests

Expand any convoy to see the full manifest: cargo broken down by supply class (CL I rations, CL III fuel, CL V ammunition), vehicles assigned (MTVRs, HMMWVs), and personnel with roles (drivers, gunners, TC, medic). This is your convoy brief in digital form.

![Expanded convoy manifest showing cargo by supply class, assigned vehicles by type, and personnel with roles](docs/images/transportation-manifest.png)

#### Plan Convoys from Scratch

The Convoy Planning tab shows all plans in various stages -- DRAFT, SUBMITTED, APPROVED, EXECUTING -- with routes, risk levels, and timing. Open a plan to define serials, assign crews, set movement timelines, and build the full operations order.

![Convoy planning table with 8 plans showing status, routes, risk levels, and action buttons](docs/images/transportation-convoy-planning.png)

#### Full Convoy Plan Detail

A convoy plan detail view gives you everything: route information with distance and estimated travel time, a timing timeline for each serial, and a serials table with vehicle assignments and cargo. This is the digital equivalent of the movement order annex.

![Full convoy plan detail showing route info, timing timeline, and serials table with vehicle and cargo assignments](docs/images/transportation-convoy-detail.png)

#### Comm, Recovery, and MEDEVAC Plans

Every convoy plan includes supporting plans -- communications plan, recovery plan, and MEDEVAC plan -- plus a searchable origin inventory organized by category so you know exactly what supplies are available at the source before you build your manifest.

![Comm, Recovery, and MEDEVAC plans section plus searchable origin inventory with supply categories](docs/images/transportation-convoy-plans.png)

#### Manage Lift Requests

A Kanban board tracks lift requests through their lifecycle: Requested, Approved, Scheduled, In Transit. Drag requests between columns or update status as movement control approves and schedules lifts.

![Kanban board for lift requests organized by status columns: Requested, Approved, Scheduled, In Transit](docs/images/transportation-lift-requests.png)

#### Review Movement History

The Movement History tab shows completed movements with on-time performance tracking, average speed, duration, and delivery confirmation. Use this for after-action review and to identify recurring bottlenecks on specific routes.

![Completed movements table with on-time tracking, average speed, duration, and delivery status](docs/images/transportation-movement-history.png)

---

### Readiness: Know Where You Stand

The Readiness page gives you a DRRS-style assessment at a glance. Five donut gauges show Overall, Equipment, Supply, Personnel, and Training ratings with C-level designations. A limiting factor banner warns when something specific -- like CL III bulk fuel -- is dragging your readiness down. Below that, an all-units overview grid lets you compare every subordinate unit's readiness at once.

![Unit readiness overview with DRRS-style C-ratings, 5 donut gauges, limiting factor banner, all-units overview grid with color-coded percentage bars](docs/images/readiness.png)

### Supply Status: Every Class, Every Unit

Track all 10 NATO supply classes with on-hand quantities, required quantities, days-of-supply, and consumption rates. Traffic-light status badges (GREEN/AMBER/RED) make it instant to spot shortfalls. A supply class by unit bar chart and consumption trend line chart let you see the bigger picture and forecast needs.

![Supply tracking table with filterable dropdowns, sortable columns, traffic-light status badges, supply class by unit bar chart, and consumption trend line chart](docs/images/supply.png)

### Equipment Readiness: Fleet Health at a Glance

See fleet-level readiness by equipment type -- authorized, on-hand, mission capable, NMC -- with color-coded readiness bars. The maintenance work orders panel shows active jobs by priority, and a 7-day trend chart tracks whether readiness is improving or declining.

![Equipment readiness table with readiness percentage bars, maintenance work orders panel, and 7-day readiness trend chart](docs/images/equipment.png)

### Maintenance Management: Track Every Work Order

The maintenance page tracks work orders through their full lifecycle -- OPEN, IN_PROGRESS, WAITING_PARTS, COMPLETE -- with priority color coding (URGENT red, PRIORITY yellow, ROUTINE green). KPI cards show Deadline Rate, MTTR, Parts Fill Rate, and Cannibalization Rate. Tabs for PM Schedule, Deadlines, Analytics, and Predictive maintenance give deeper insight.

![Maintenance management with KPI cards, work order cards color-coded by priority, tabbed views for work orders, PM schedule, deadlines, analytics, and predictive](docs/images/maintenance.png)

### Requisitions: From Request to Fulfillment

Submit supply requisitions and track them through the approval workflow. Status filter tabs let you focus on SUBMITTED, APPROVED, FULFILLED, or REJECTED requisitions. Each card shows the requisition number, priority, requested items with quantities, and the requesting unit.

![Requisition management with status filter tabs, requisition cards showing priority, items, quantities, and approval workflow status](docs/images/requisitions.png)

### Fuel / POL Management: Keep the Force Moving

A critical fuel warning banner appears when any storage point falls below threshold. Capacity KPI cards show Total Capacity, On Hand, Days of Supply, and Daily Consumption. Storage point cards display fuel type, fill percentage bars, and MGRS coordinates. A 14-day projection chart helps you plan resupply before you run dry.

![Fuel management dashboard with warning banner, capacity KPI cards, storage point cards with fill percentage bars, and 14-day fuel projection chart](docs/images/fuel.png)

### Sensitive Item Custody: Full Chain of Custody

Register and track every sensitive item -- weapons, optics, NVGs, crypto, radios, COMSEC, explosives. The Item Registry shows all items with serial numbers, type, status (ON HAND/MISSING/IN MAINTENANCE/ISSUED), condition, and current holder. A missing item alert banner ensures nothing falls through the cracks.

![Custody page with KPI summary cards, missing item alert banner, item registry table with serial numbers, type badges, status badges, and holder information](docs/images/custody-registry.png)

Register new sensitive items with full detail: serial number, nomenclature, type, NSN, security classification, condition code, hand receipt number, and holder assignment.

![Register Sensitive Item form with fields for serial number, nomenclature, type, NSN, classification, condition, hand receipt, and holder](docs/images/custody-register-item.png)

Track every transfer with a full audit trail: date, item, from/to personnel, transfer type (lateral transfer, maintenance return, issue, temporary loan), document number, and reason.

![Custody transfers table showing recent transfers with date, item, from/to personnel, transfer type badges, document numbers, and reasons](docs/images/custody-transfers.png)

### Personnel and Manning: Strength at Every Level

See your authorized, assigned, and present strength with fill rate and P-Rating. The Alpha Roster is fully searchable with columns for Name, EDIPI, Rank, MOS, Billet, Status, Duty, Rifle qualification, PFT/CFT scores, and Location. Tabs for Strength, Billets, Qualifications, and EAS Timeline provide deeper personnel analytics.

![Personnel page with strength summary cards, P-Rating badge, searchable Alpha Roster with rank, MOS, billet, status, and qualification columns](docs/images/personnel.png)

### Medical / CASEVAC

Track CASEVAC events with casualty reports, manage medical treatment facilities, and monitor blood product inventory with status indicators.

![Medical page with CASEVAC tracking, casualty reports, medical treatment facility management, and blood product inventory](docs/images/medical.png)

### Data Ingestion: Bring Your Data

Upload mIRC chat logs, Excel spreadsheets, TAK CoT XML, and route files (GeoJSON/GPX/KML/KMZ). The ingestion engine parses and maps the data to KEYSTONE's canonical schema automatically. An ingestion history shows every upload with status indicators and parsed record counts.

![Data ingestion page with upload interface, supported file types, ingestion history with status indicators and parsed record counts](docs/images/ingestion.png)

### Data Sources

Configure and manage external data source connections. See connection status, source type, last sync time, and configuration for each source.

![Data sources management page with configured sources, connection status, source type, last sync time, and configuration options](docs/images/datasources.png)

### SITREP Reports: Automated Reporting

Generate LOGSTATs, Readiness Reports, Supply Status, Equipment Status, Maintenance Summaries, Movement Summaries, and Personnel Strength reports. Templates with scheduled generation, draft/final workflow, and export to file (text/JSON) for offline distribution or higher HQ submission.

![Reports page with report list showing FINALIZED/READY/DRAFT/GENERATING status badges, report preview with supply, equipment, convoy, and alert sections](docs/images/reports.png)

### Alerts and Predictions

Automatic alerts fire when days-of-supply drops below threshold, readiness falls, convoys are delayed, or anomalies are detected. Configurable rules, three severity levels (INFO/WARNING/CRITICAL), per-user notifications, and acknowledgement tracking keep everyone informed. A Predictions tab surfaces ML-generated forecasts.

![Alerts dashboard with severity summary cards, severity filter, expandable alert cards with description, severity badge, unit, timestamp, and action buttons](docs/images/alerts.png)

### Audit Log: Full Accountability

Every action in KEYSTONE is logged. See who did what, when, and to what entity. Color-coded action badges (UPDATE, TRANSFER, EXPORT, LOGIN, DELETE) make it easy to scan. Filter by entity type and time period.

![Audit trail with KPI summary, entity type and period filters, table with date, user, color-coded action badges, entity type, and description](docs/images/audit-trail.png)

### Administration

Manage users, configure units, set classification levels, configure map tile sources, manage scenarios, define roles and permissions, and control the simulation engine -- all from one admin panel.

![Admin panel with user management table, role badges, unit assignment, last login, and tabbed views for all admin functions](docs/images/admin.png)

### Built-In Documentation

API reference, user guides, and system documentation are accessible directly within the application.

![Built-in documentation page with API reference, user guides, and system documentation](docs/images/docs.png)

### Demo Mode: Try It Without Infrastructure

KEYSTONE ships with a full demo mode that runs entirely in the browser -- no backend required. The demo login page presents 24 named users organized by Command Element, Battalion Staff, Battery Commanders, Operators, and Higher HQ. Each card shows rank, name, billet, unit, MOS, and role description. Pick a role and explore the full application with realistic mock data.

![Demo mode login page with role picker showing 24 named users organized by command element, staff, commanders, operators, and higher HQ](docs/images/login-page.png)

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

## For Developers

### Architecture

```
                          +---------------------------------+
                          |      React SPA (Vite)           |
                          |  Tailwind / Zustand / Leaflet   |
                          |  Command Palette - Role Auth    |
                          +---------------+-----------------+
                                          | HTTPS
                          +---------------v-----------------+
                          |    Nginx (TLS termination)      |
                          |     /api -> backend:8000        |
                          |     /tiles -> tile proxy        |
                          +---------------+-----------------+
                                          |
                 +------------------------v------------------------+
                 |         FastAPI  (Uvicorn)                      |
                 |   REST API - JWT Auth - RBAC - NLP              |
                 +--+----------+------------------+----------------+
                    |          |                   |
           +-------v--+  +----v-----+  +----------v------+
           |PostgreSQL |  |  Redis   |  |   Celery        |
           | + PostGIS |  |  cache   |  |   worker        |
           +----------+   +----------+  +---------+-------+
                                                  |
                                   +--------------v-------------------+
                                   |  Living Simulation Engine        |
                                   |  7 async generators - 4+        |
                                   |  scenarios - speed control       |
                                   |  up to 7200x                    |
                                   +----------------------------------+
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

### Features Reference

#### Dashboard and Analytics
- Commander dashboard with 30-second readiness assessment and KPI metrics
- Supply status aggregation across all 10 NATO supply classes (I-X)
- Consumption rate forecasting and sustainability projections
- Equipment readiness summaries with fleet-level aggregates
- Active alert summary with severity breakdown
- Transportation movement status overview

#### Supply Tracking
- All 10 NATO supply classes with on-hand quantities, required quantities, and days-of-supply
- Traffic-light status (GREEN/AMBER/RED) based on DOS thresholds
- Consumption rate tracking and reorder point management
- Per-unit supply breakdown with hierarchy roll-up

#### Equipment Readiness
- Fleet-level readiness aggregates by equipment type
- Individual vehicle/asset tracking with serial numbers and bumper numbers
- Fault tracking with severity levels (safety, deadline, minor)
- Driver assignment management
- Maintenance history per asset

#### Maintenance Work Orders
- Full lifecycle tracking: OPEN -> IN_PROGRESS -> WAITING_PARTS -> COMPLETE
- Parts management with sourcing (on-hand, ordered, cannibalized)
- Labor tracking by type (inspection, repair, PMCS, modification)
- Work order categories: corrective, preventive, modification, inspection
- Maintenance analytics with readiness trends and MTBF calculations

#### Personnel and Manning
- Personnel roster with status (present, deployed, leave, TAD, medical, UA)
- Qualifications and weapons assignment tracking
- Ammunition load tracking
- Billet structure and strength snapshots (manning)
- Convoy personnel assignments with roles

#### Transportation, Convoy Planning, and Manifests
- Movement tracking with status lifecycle (PLANNED -> IN_TRANSIT -> COMPLETE)
- Convoy manifest management with cargo items, vehicle allocations, personnel assignments
- Convoy planning with serials and lift requests
- Route planning with origin/destination and ETAs
- Convoy roles: driver, TC, gunner, PAX, medic

#### Medical / CASEVAC
- CASEVAC tracking with casualty reports
- Medical treatment facility (MTF) management
- Blood product inventory tracking

#### Fuel / POL Management
- Fuel storage point management
- Transaction tracking and consumption monitoring
- Consumption forecasting

#### Sensitive Item Custody and Chain of Custody
- **Item Registry**: Register and track sensitive items (weapons, optics, NVGs, crypto, radios, COMSEC, explosives, missiles)
- **Register New Items**: Full registration form with serial number, nomenclature, type, NSN, security classification, condition code, hand receipt, holder assignment
- **Chain of Custody**: Visual timeline of custody transfers per item with from/to personnel, document numbers, and authorization
- **Custody Transfers**: Issue, turn-in, lateral transfer, temporary loan, maintenance turn-in/return, inventory adjustment
- **Inventory Events**: Track cyclic, sensitive item, and monthly inventories with discrepancy counts and witness documentation
- **Missing Item Alerts**: Immediate action alerts with FLIPL initiation tracking
- **Audit Trail**: Full audit logging of all custody actions with user, timestamp, action type, and entity tracking

#### SITREP Reporting Engine
- Report templates with scheduled generation
- 7+ report types: LOGSTAT, Readiness, Supply Status, Equipment Status, Maintenance Summary, Movement Summary, Personnel Strength
- Structured report viewer with type-specific sections, summary statistics, and tabular breakdowns
- Draft/Final workflow with finalization tracking
- Export to file (text/JSON) for offline distribution or higher HQ submission
- Unit-scoped reporting with date range selection
- Automated data aggregation from current supply, equipment, maintenance, movement, and personnel records

#### Notifications and Configurable Alert Rules
- Automatic alerts: low days-of-supply, low readiness, convoy delayed, anomaly detection
- Configurable alert rules with severity tracking
- Three severity levels: INFO, WARNING, CRITICAL
- Per-user notifications with preferences
- Unit-scoped with hierarchy visibility
- Acknowledgement tracking

#### Requisition Workflow Management
- Supply requisition creation and lifecycle management
- Approval workflows and status tracking

#### Inventory Management
- Inventory records and transaction tracking
- Stock level monitoring

#### Equipment, Supply, and Ammunition Catalogs
- Equipment catalog with type definitions
- Supply catalog for standard items
- Ammunition catalog

#### Unit Readiness
- Unit readiness snapshots with historical tracking
- Configurable readiness thresholds

#### Interactive Map
- Leaflet-based map with three tile layers: OpenStreetMap, satellite imagery, topographic
- Military symbology rendering (APP-6D SIDCs via milsymbol, 15-character codes)
- Unit positions with MGRS coordinate display
- Supply point visualization (ASP, FSP, FARP, water point, ammo dump, etc.)
- Route overlays with GeoJSON/GPX/KML/KMZ import
- Convoy position tracking on active routes
- Tile proxy for air-gapped deployments (no external network required)
- Cursor coordinate display (lat/lon + MGRS), distance measurement tool
- Nearby unit/asset search, context menu actions

#### Data Ingestion
- **mIRC chat logs**: NLP + regex pipeline extracts supply, equipment, and convoy data from chat transcripts
- **Excel spreadsheets**: Auto-matches known LOGSTAT templates; column mapping wizard for new formats
- **TAK integration**: Connects to TAK servers for field-submitted logistics data via Cursor-on-Target (CoT) XML
- **Route files**: GeoJSON, GPX, KML, KMZ import for map overlays
- **Directory polling**: Automated ingestion from configured data directories
- **Schema mapping**: Admin UI to map any data format to KEYSTONE's canonical schema

#### System-Wide Audit Logging
- Comprehensive audit trail across all modules
- User action tracking for accountability and compliance

#### Simulator
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

#### Unit Hierarchy
- Complete active-duty USMC organizational structure (~403 units)
- All three MEFs (I, II, III), MARFORRES, MARSOC, Supporting Establishment
- Echelons from HQMC down to company level (with infantry company details)
- Unit Identification Codes (UICs), geographic coordinates, MGRS

#### Admin Panel
- **User Management**: Create, edit, activate/deactivate users with role and unit assignment
- **Unit Hierarchy**: Interactive tree view of the complete USMC organizational structure with unit creation and editing
- **Classification Settings**: Configure classification level (UNCLASSIFIED through TS//SCI) with live banner preview and color-coded reference
- **Map Tile Settings**: Configure tile layer sources for OSM, satellite, and topographic layers (supports online and offline tile servers)

#### Access Control
- 6 roles: ADMIN, COMMANDER, S4, S3, OPERATOR, VIEWER
- Unit hierarchy scoping (users see their unit and subordinates)
- JWT authentication with configurable token expiry (default 8 hours)
- Seed users for development only (blocked in non-development environments)

#### Classification Banners
- Configurable classification level: UNCLASSIFIED, CUI, CONFIDENTIAL, SECRET, TOP SECRET
- Color-coded banners at top and bottom of viewport per IC/DoD standards
- Admin-configurable via settings API

#### Responsive Design
- Responsive layout optimized for desktop, tablet, and mobile viewports
- Collapsible sidebar with hamburger menu on small screens
- Responsive grid layouts that reflow from multi-column to single-column
- Full-screen map mode for tactical use on tablets
- Scrollable tables with horizontal overflow on narrow displays

#### Demo Mode
- Full static site deployment with mock data (no backend required)
- Auto-deployed to GitHub Pages via CI
- All pages functional with realistic USMC logistics data
- Toggle via `VITE_DEMO_MODE=true` build flag
- **Role picker login** with 24 named users across battalion structure (Command Element, Battalion Staff, Battery Commanders, Operators, Higher HQ)
- Each user card shows rank, name, billet, unit, MOS, and role description
- Activity feed with live simulation data showing requisitions, work orders, convoys, supply updates, alerts, personnel actions, and reports

#### Living Simulation Engine
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

#### Role-Based Dashboards
- Auto-routes authenticated users to their role-specific dashboard view
- **Commander**: Full COP with 6 readiness KPI cards, supply class status, equipment readiness, sustainability projections, consumption charts, and active alerts
- **S-4 (Logistics)**: Supply-focused view with class status, requisition queue, and sustainment metrics
- **S-3 (Operations)**: Operations-focused view with movement tracker, readiness overview, and operational tempo
- Role tabs on dashboard allow switching between perspectives without re-authentication

#### Command Palette (Ctrl+K)
- Global search interface accessible from any page via `Ctrl+K` keyboard shortcut
- Searches across pages, personnel, equipment, units, requisitions, and work orders
- Results grouped by category with keyboard navigation (arrow keys, Enter to select)
- Fuzzy matching supports partial names, serial numbers, MOS codes, and unit designations
- Recent searches and quick navigation shortcuts

#### UX and Navigation
- **Breadcrumb navigation** on every page showing current location in the app hierarchy
- **Keyboard shortcuts**: `G+D` (dashboard), `G+M` (map), `G+S` (supply), `G+E` (equipment), `G+T` (transportation), `G+P` (personnel), `G+R` (reports), `G+A` (alerts)
- **Toast notifications** for async operations (save confirmations, error alerts, status updates)
- **Contextual quick actions** on data rows (e.g., create work order from equipment, generate report from supply data)
- **Grouped sidebar** with collapsible sections (Operations, Logistics, Personnel, Data, Monitoring, Admin) and badge counts for active items
- **Icon-only collapse mode** for the sidebar to maximize workspace on smaller displays
- **Time range selector** (24H/7D/30D/90D) in the header for filtering dashboard and page data

#### Future Capabilities (Planned)
- **GCSS-MC Integration**: Direct data feed from Global Combat Support System -- Marine Corps for automated supply and equipment synchronization
- **Predictive Analytics**: ML-based consumption forecasting and failure prediction models
- **Offline-First PWA**: Service worker support for disconnected field operations with background sync

---

### Development Setup

#### Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL 15+ with PostGIS (or use Docker for the database)
- Redis 7+

#### Backend

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

#### Frontend

```bash
cd frontend

# Install dependencies
npm ci

# Start development server (proxies /api to localhost:8000)
npm run dev

# Access at http://localhost:5173
```

#### Environment Variables

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

### Simulator

The simulator generates realistic logistics data streams by posting to the KEYSTONE API. It runs as a standalone Python module.

#### List available scenarios

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

#### Run a simulation

```bash
# Run Steel Guardian at 60x speed (1 sim-minute = 1 real-second)
python -m simulator run --scenario=steel_guardian --speed=60

# Run against a remote KEYSTONE instance
python -m simulator run --scenario=pacific_fury --speed=120 --url=https://keystone.example.mil

# Environment variable overrides
SIM_SCENARIO=iron_forge SIM_SPEED=300 KEYSTONE_URL=http://backend:8000 python -m simulator run
```

#### CLI Options

| Flag | Env Var | Default | Description |
|------|---------|---------|-------------|
| `--scenario` | `SIM_SCENARIO` | `steel_guardian` | Scenario name |
| `--speed` | `SIM_SPEED` | `60` | Speed multiplier (60 = 1 sim-min per real-sec) |
| `--url` | `KEYSTONE_URL` | `http://localhost:8000` | KEYSTONE API base URL |
| `--username` | -- | `simulator` | API username |
| `--password` | `SIM_PASSWORD` | -- | API password |
| `--log-level` | -- | `INFO` | Logging level |
| `--max-events-per-tick` | -- | `50` | Max events processed per tick |

#### Docker (demo profile)

```bash
docker compose --profile demo up --build -d
# Simulator runs steel_guardian at 60x against the backend container
```

---

### Testing

#### Backend

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

#### Frontend

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

### CI/CD Pipeline

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

### Project Structure

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

### API Endpoints

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

### Security Features

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

### Offline / Air-Gapped Deployment

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
