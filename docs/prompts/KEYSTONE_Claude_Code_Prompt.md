# KEYSTONE — Claude Code Build Prompt

Copy everything below the line into Claude Code as your initial prompt.

---

## What We're Building

KEYSTONE is a logistics intelligence web application for the United States Marine Corps, built as a component of Project Dynamis (USMC's CJADC2 effort). It ingests logistics data from sources Marines already use — mIRC chat logs, Excel spreadsheets, GCSS-MC, TAK (ATAK/WinTAK) logistics plugins, and manual entry — structures that data, and presents it as dashboards, automated reports, and predictive analytics at every echelon from company to MEF.

**Critical scope constraint:** KEYSTONE is an information system only. It does NOT replace mIRC, Excel, GCSS-MC, TAK, or any tactical tool. Marines keep using their current tools. KEYSTONE listens, parses, structures, and presents. No new hardware. No changes to how tactical units operate.

## Tech Stack

- **Backend:** Python 3.11+ with FastAPI
- **Database:** PostgreSQL 15+ with SQLAlchemy ORM + Alembic migrations
- **Task Queue:** Celery with Redis broker (for async ingestion pipelines)
- **NLP/Parsing:** spaCy + custom rule-based parsers for mIRC message classification
- **Frontend:** React 18 + TypeScript + Vite
- **UI Framework:** Tailwind CSS + shadcn/ui components
- **Charts/Viz:** Recharts for dashboards, Leaflet for map overlays
- **Auth:** JWT-based authentication with role-based access control (RBAC)
- **API Docs:** Auto-generated OpenAPI/Swagger via FastAPI
- **Testing:** pytest (backend), Vitest + React Testing Library (frontend)
- **Containerization:** Docker + docker-compose for local dev

## Project Structure

```
keystone/
├── docker-compose.yml
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic/
│   │   └── versions/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── config.py                # Settings via pydantic-settings
│   │   ├── database.py              # SQLAlchemy engine + session
│   │   │
│   │   ├── models/                  # SQLAlchemy models
│   │   │   ├── __init__.py
│   │   │   ├── user.py              # User + Role models
│   │   │   ├── unit.py              # Military unit hierarchy (MEF > Div > Regt > Bn > Co)
│   │   │   ├── supply.py            # Supply status by class (I-X), DOS tracking
│   │   │   ├── equipment.py         # Equipment readiness, condition codes
│   │   │   ├── transportation.py    # Convoy/movement records
│   │   │   ├── maintenance.py       # Maintenance work orders, parts
│   │   │   ├── report.py            # Generated reports (LOGSTAT, readiness, etc.)
│   │   │   ├── raw_data.py          # Raw ingested data archive (mIRC text, Excel files)
│   │   │   └── alert.py             # Threshold alerts
│   │   │
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   │   ├── __init__.py
│   │   │   ├── supply.py
│   │   │   ├── equipment.py
│   │   │   ├── transportation.py
│   │   │   ├── dashboard.py
│   │   │   ├── report.py
│   │   │   └── auth.py
│   │   │
│   │   ├── api/                     # FastAPI routers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py              # Login, token refresh, user management
│   │   │   ├── dashboard.py         # COP endpoints (commander, S4, S3 views)
│   │   │   ├── supply.py            # Supply status CRUD + analytics
│   │   │   ├── equipment.py         # Equipment readiness CRUD + analytics
│   │   │   ├── transportation.py    # Movement/convoy CRUD + analytics
│   │   │   ├── reports.py           # Report generation + retrieval
│   │   │   ├── ingestion.py         # Manual upload endpoints (Excel, mIRC logs)
│   │   │   ├── alerts.py            # Alert configuration + history
│   │   │   └── units.py             # Unit hierarchy management
│   │   │
│   │   ├── ingestion/               # Data ingestion pipelines
│   │   │   ├── __init__.py
│   │   │   ├── mirc_parser.py       # mIRC log parser (pattern matching + NLP)
│   │   │   ├── mirc_patterns.py     # Known mIRC message format patterns (LOGSTAT, supply req, convoy, etc.)
│   │   │   ├── excel_parser.py      # Excel template matcher and data extractor
│   │   │   ├── excel_templates.py   # Known Excel template definitions
│   │   │   ├── gcss_mc.py           # GCSS-MC API integration (stub — real API TBD)
│   │   │   ├── tak_ingest.py        # TAK Server CoT event ingestion (logistics plugin data)
│   │   │   ├── tak_schemas.py       # TAK CoT event type definitions for logistics data
│   │   │   ├── classifier.py        # Message type classifier (supply, maintenance, transport, etc.)
│   │   │   └── normalizer.py        # Data normalization to unified schema
│   │   │
│   │   ├── analytics/               # Analytics engine
│   │   │   ├── __init__.py
│   │   │   ├── consumption.py       # Consumption rate calculations + forecasting
│   │   │   ├── readiness.py         # Equipment readiness trend analysis
│   │   │   ├── sustainability.py    # Days-of-supply projections
│   │   │   ├── anomaly.py           # Anomaly detection in logistics data
│   │   │   └── aggregation.py       # Echelon rollup calculations
│   │   │
│   │   ├── reports/                 # Report generation
│   │   │   ├── __init__.py
│   │   │   ├── logstat.py           # Auto-generate LOGSTAT
│   │   │   ├── readiness_report.py  # Equipment readiness report
│   │   │   ├── supply_status.py     # Supply status by class report
│   │   │   └── rollup.py            # Higher HQ rollup aggregation
│   │   │
│   │   ├── tasks/                   # Celery async tasks
│   │   │   ├── __init__.py
│   │   │   ├── ingest_mirc.py       # Async mIRC log processing
│   │   │   ├── ingest_excel.py      # Async Excel file processing
│   │   │   ├── ingest_tak.py        # Async TAK CoT event processing
│   │   │   └── generate_report.py   # Async report generation
│   │   │
│   │   └── core/                    # Shared utilities
│   │       ├── __init__.py
│   │       ├── auth.py              # JWT utilities, password hashing
│   │       ├── permissions.py       # RBAC decorators/dependencies
│   │       ├── military.py          # Military-specific constants (supply classes, unit types, etc.)
│   │       └── exceptions.py        # Custom exception handlers
│   │
│   ├── tests/
│   │   ├── conftest.py
│   │   ├── test_mirc_parser.py
│   │   ├── test_excel_parser.py
│   │   ├── test_tak_ingest.py
│   │   ├── test_analytics.py
│   │   ├── test_api_supply.py
│   │   ├── test_api_dashboard.py
│   │   └── fixtures/
│   │       ├── sample_mirc_logs/     # Sample mIRC log files for testing
│   │       └── sample_excel/         # Sample Excel LOGSTATs for testing
│   │
│   └── seed/
│       ├── seed_units.py            # Seed unit hierarchy (sample MEF structure)
│       ├── seed_users.py            # Seed test users with roles
│       └── sample_data.py           # Generate realistic sample logistics data
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   │
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                  # Router setup
│   │   │
│   │   ├── api/                     # API client
│   │   │   ├── client.ts            # Axios instance with auth interceptor
│   │   │   ├── supply.ts
│   │   │   ├── equipment.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── reports.ts
│   │   │   └── auth.ts
│   │   │
│   │   ├── stores/                  # Zustand state management
│   │   │   ├── authStore.ts
│   │   │   ├── dashboardStore.ts
│   │   │   └── alertStore.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn/ui components
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx      # Navigation sidebar with echelon selector
│   │   │   │   ├── Header.tsx       # Top bar with user info + alerts
│   │   │   │   └── MainLayout.tsx   # Layout wrapper
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── CommanderView.tsx     # Green/amber/red tiles, sustainability timeline
│   │   │   │   ├── S4View.tsx            # Detailed supply/readiness working view
│   │   │   │   ├── S3View.tsx            # Logistics constraints on operations
│   │   │   │   ├── SupplyStatusCard.tsx  # Supply class status with DOS
│   │   │   │   ├── ReadinessGauge.tsx    # Equipment readiness percentage
│   │   │   │   ├── SustainabilityTimeline.tsx  # Days-until-critical visualization
│   │   │   │   ├── ConsumptionChart.tsx  # Consumption rate trend line
│   │   │   │   └── AlertBanner.tsx       # Active threshold alerts
│   │   │   │
│   │   │   ├── supply/
│   │   │   │   ├── SupplyTable.tsx       # Supply status table with filtering
│   │   │   │   ├── SupplyClassBreakdown.tsx  # Class I-X detailed view
│   │   │   │   └── DOSCalculator.tsx     # Days of supply calculator
│   │   │   │
│   │   │   ├── equipment/
│   │   │   │   ├── ReadinessTable.tsx    # Equipment readiness by type
│   │   │   │   ├── MaintenanceQueue.tsx  # Maintenance backlog view
│   │   │   │   └── ReadinessTrend.tsx    # Readiness over time chart
│   │   │   │
│   │   │   ├── transportation/
│   │   │   │   ├── MovementTracker.tsx   # Active convoy/movement list
│   │   │   │   └── ThroughputChart.tsx   # Transportation throughput metrics
│   │   │   │
│   │   │   ├── ingestion/
│   │   │   │   ├── UploadPanel.tsx       # Excel/mIRC file upload
│   │   │   │   ├── ReviewQueue.tsx       # Human-in-the-loop parsed data review
│   │   │   │   └── IngestionStatus.tsx   # Pipeline status monitoring
│   │   │   │
│   │   │   └── reports/
│   │   │       ├── ReportGenerator.tsx   # Report generation interface
│   │   │       └── ReportViewer.tsx      # View/export generated reports
│   │   │
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DashboardPage.tsx         # COP — routes to correct view by role
│   │   │   ├── SupplyPage.tsx
│   │   │   ├── EquipmentPage.tsx
│   │   │   ├── TransportationPage.tsx
│   │   │   ├── IngestionPage.tsx         # Upload + review
│   │   │   ├── ReportsPage.tsx
│   │   │   ├── AlertsPage.tsx
│   │   │   └── AdminPage.tsx             # User management, unit config
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useDashboard.ts
│   │   │   └── useAlerts.ts
│   │   │
│   │   └── lib/
│   │       ├── utils.ts
│   │       ├── constants.ts          # Supply classes, status colors, echelon names
│   │       └── types.ts              # TypeScript interfaces matching backend schemas
│   │
│   └── tests/
│       ├── setup.ts
│       └── components/
│
└── docs/
    └── API.md
```

## Data Model — Key Entities

### Unit Hierarchy
Units follow USMC organizational structure. Every piece of logistics data is associated with a unit.

```
MEF (I MEF, II MEF, III MEF)
  └── Division (1st MarDiv, 2nd MarDiv, 3rd MarDiv)
       └── Regiment / Group (1st Marines, 7th Marines, CLR-1, etc.)
            └── Battalion (1/1, 2/1, 3/1, etc.)
                 └── Company (Alpha, Bravo, Charlie, etc.)
```

Model fields: `id`, `name`, `abbreviation`, `echelon` (enum: MEF/DIV/REGT/BN/CO), `parent_id` (self-referential FK), `uic` (Unit Identification Code)

### Supply Status
Tracks supply levels by class for each unit.

Supply classes (USMC standard):
- Class I: Subsistence (food, water)
- Class II: Clothing, tools, admin supplies
- Class III: POL (petroleum, oils, lubricants)
- Class IV: Construction materials
- Class V: Ammunition
- Class VI: Personal demand items
- Class VII: Major end items (vehicles, weapons systems)
- Class VIII: Medical
- Class IX: Repair parts
- Class X: Non-standard (ag/civil affairs)

Model fields: `id`, `unit_id`, `supply_class` (enum I-X), `item_description`, `on_hand_qty`, `required_qty`, `dos` (days of supply, calculated), `consumption_rate` (units/day), `reorder_point`, `status` (GREEN/AMBER/RED), `reported_at`, `source` (mIRC/Excel/GCSS-MC/TAK/manual), `raw_data_id` (FK to raw archive)

### Equipment Readiness
Model fields: `id`, `unit_id`, `tamcn` (equipment type code), `nomenclature` (e.g., "HMMWV M1151"), `total_possessed`, `mission_capable`, `not_mission_capable_maintenance`, `not_mission_capable_supply`, `readiness_pct` (calculated), `reported_at`, `source`, `raw_data_id`

### Transportation / Movements
Model fields: `id`, `unit_id`, `convoy_id`, `origin`, `destination`, `departure_time`, `eta`, `actual_arrival`, `vehicle_count`, `cargo_description`, `status` (PLANNED/EN_ROUTE/COMPLETE/DELAYED), `reported_at`, `source`, `raw_data_id`

### Raw Data Archive
Every piece of ingested data is preserved in its original form.
Model fields: `id`, `source_type` (mIRC/EXCEL/GCSS_MC/TAK/MANUAL), `original_content` (text for mIRC, XML/JSON for TAK CoT events, file path for Excel), `channel_name` (for mIRC), `sender` (for mIRC), `file_name` (for Excel), `tak_uid` (for TAK — CoT event UID), `tak_callsign` (for TAK — reporting unit callsign), `ingested_at`, `parse_status` (PENDING/PARSED/FAILED/REVIEWED), `confidence_score` (0-1), `reviewed_by` (FK to user, nullable)

### Alerts
Model fields: `id`, `unit_id`, `alert_type` (LOW_DOS/LOW_READINESS/CONVOY_DELAYED/ANOMALY), `severity` (INFO/WARNING/CRITICAL), `message`, `threshold_value`, `actual_value`, `acknowledged`, `acknowledged_by`, `created_at`

## mIRC Parser — Detailed Requirements

The mIRC parser is the most critical component. It must handle these message types:

### 1. Formatted LOGSTAT Lines
Pattern example:
```
[14:32:17] <BN_S4> LOGSTAT AS OF 031400ZMAR26 // 1/1 MARINES
CL I: RATIONS 2400 ON HAND / 3000 AUTH / 80% / 2.1 DOS
CL III: JP8 4500GAL ON HAND / 8000GAL AUTH / 56% / 1.8 DOS
CL V: 5.56MM 45000RDS / 60000RDS AUTH / 75% / 3.2 DOS
```
Parser should extract: unit, DTG, supply class, item, on-hand, authorized, percentage, DOS.

### 2. Free-Text Supply Requests
Pattern example:
```
[09:15:42] <Alpha_Co_XO> Need resupply Class V. Down to ~500 rds 5.56 and 12 rds 40mm HE. Priority urgent.
```
Parser should extract: requesting unit, supply class, items, quantities, priority.

### 3. Convoy/Movement Updates
Pattern example:
```
[11:03:55] <CLB3_S4> Convoy 7A departed FARP EAGLE at 031100Z en route LOG BASE CHARLIE. 8 vehicles, ETA 031400Z. Carrying CL I and CL III resupply for 3/1.
```
Parser should extract: convoy ID, origin, departure time, destination, ETA, vehicle count, cargo, supported unit.

### 4. Equipment Status
Pattern example:
```
[16:45:02] <Maint_Chief> EQUIP STATUS 2/1: HMMWV 42/48 MC (87.5%), 7-TON 18/22 MC (81.8%), MTVR 31/36 MC (86.1%). 3x HMMWV NMCS awaiting parts, 3x HMMWV NMCM in shop.
```
Parser should extract: unit, equipment type, MC count, total, readiness %, NMC breakdown.

### 5. Unclassified Free Text
Everything that doesn't match a known pattern gets classified and entity-extracted using NLP. The system should identify: unit names, supply classes mentioned, quantities, dates/times, locations, and sentiment/urgency.

**Key implementation notes:**
- Build a pattern library (`mirc_patterns.py`) with regex + rule-based patterns for each message type
- Use spaCy with a custom military NER model for free-text parsing
- Every parsed record gets a `confidence_score` (1.0 for exact pattern match, lower for NLP-based extraction)
- Records with confidence < 0.8 go to the human review queue
- The system learns: when a human corrects a parse, store the correction to improve future matching
- Preserve the raw mIRC text always — link structured data back to source via `raw_data_id`

## Excel Parser — Detailed Requirements

- Accept .xlsx and .csv files
- Template matching: compare column headers against a library of known LOGSTAT/readiness report formats
- If no template matches, present the operator with a column mapping wizard (frontend: drag-and-drop columns to KEYSTONE fields)
- Once mapped, save the mapping as a new template for future auto-matching
- Validate extracted data: range checks (quantities > 0, percentages 0-100), unit identification (match unit names against unit hierarchy), date consistency
- Flag anomalies for review (e.g., DOS jumped from 2 to 200 — probably a data entry error)

## TAK Integration — Detailed Requirements

TAK (Team Awareness Kit) is already in use across USMC units. Some units use ATAK (Android) or WinTAK with logistics plugins that allow tactical users to submit structured supply status reports (MRE counts, water quantities, ammo counts, fuel levels, casualty status, etc.) directly from their device. This data flows through a TAK Server. KEYSTONE must ingest this data — it's the cleanest source we'll get from the tactical edge because it's already structured at point of entry.

### How TAK Data Flows

```
ATAK/WinTAK device (Marine submits supply status via logistics plugin)
  → TAK Server (aggregates CoT events from all connected devices)
    → KEYSTONE TAK Ingestion Service (listens for logistics-type CoT events)
      → KEYSTONE unified database
```

### Integration Architecture

TAK uses the Cursor-on-Target (CoT) XML standard for data exchange. Logistics plugin data is transmitted as CoT events with specific event types and detail fields. KEYSTONE connects to the TAK Server via one of these methods (implement all three, configurable):

1. **TAK Server API (preferred):** TAK Server exposes a REST API for querying CoT events. KEYSTONE polls the API on a configurable interval (default: 30 seconds) for new logistics-type events. Endpoint pattern: `https://<tak-server>:8443/Marti/api/cot/xml/<event-type>`.

2. **TAK Server Data Package feed:** TAK Server can be configured to forward specific CoT event types to an external endpoint. KEYSTONE exposes a webhook endpoint (`POST /api/v1/ingestion/tak/webhook`) that TAK Server pushes CoT events to.

3. **TCP/UDP CoT stream:** For environments where the TAK Server streams raw CoT, KEYSTONE can listen on a configurable TCP or UDP port for CoT XML messages. This is the most direct but least filtered approach.

### CoT Event Parsing

TAK logistics plugin data arrives as CoT XML. Example supply status event:

```xml
<event version="2.0" uid="supply-report-alpha-co-20260303"
       type="b-r-f-h-c" time="2026-03-03T14:30:00Z"
       start="2026-03-03T14:30:00Z" stale="2026-03-03T15:30:00Z"
       how="h-e">
  <point lat="33.3528" lon="-116.8756" hae="0" ce="10" le="10"/>
  <detail>
    <contact callsign="ALPHA-CO-1-1"/>
    <logistics>
      <supply class="I" item="MRE" onHand="240" required="360" unit="each"/>
      <supply class="I" item="Water" onHand="500" required="800" unit="gal"/>
      <supply class="III" item="JP8" onHand="200" required="600" unit="gal"/>
      <supply class="V" item="5.56mm" onHand="15000" required="30000" unit="rds"/>
      <supply class="V" item="40mm HE" onHand="48" required="120" unit="rds"/>
      <supply class="VIII" item="CLS bags" onHand="8" required="12" unit="each"/>
    </logistics>
    <remarks>Alpha Co supply status as of 031430Z. Class V critical.</remarks>
  </detail>
</event>
```

**Note:** The exact CoT schema for logistics plugins varies by plugin version and configuration. The parser in `tak_schemas.py` should define multiple known schema variants and attempt to match incoming events. Unknown schemas should be stored raw and flagged for operator mapping (similar to the Excel template approach).

### TAK Parser Implementation (`tak_ingest.py` + `tak_schemas.py`)

- Parse CoT XML events, extract the `<logistics>` detail block
- Map `callsign` to KEYSTONE unit hierarchy (e.g., "ALPHA-CO-1-1" → Alpha Company, 1/1)
- Extract each supply line item: class, item name, on-hand quantity, required quantity, unit of measure
- Calculate DOS from on-hand and consumption rate (if historical data exists)
- Extract geolocation from `<point>` — store lat/lon for map overlay on COP
- Set `confidence_score` to 1.0 for well-structured CoT events (this is pre-structured data)
- Store the raw CoT XML in `raw_data` archive with `source_type=TAK`
- Handle duplicate detection: if same `uid` arrives again, treat as update (not duplicate entry)

### TAK-Specific Data Advantages

TAK data is special because:
- **It's already structured** — unlike mIRC, no NLP needed. Confidence is always high.
- **It has geolocation** — lat/lon from the reporting device, enabling map-based COP views.
- **It has timestamps from the device** — more accurate than mIRC log timestamps.
- **It comes from the tactical edge** — squad/platoon level data that might never make it to mIRC.

In the dashboard, TAK-sourced data should be visually distinguishable (small TAK icon or badge on data rows) so operators know which data came from the most direct source.

### Callsign-to-Unit Mapping

TAK callsigns need to map to the KEYSTONE unit hierarchy. This requires a mapping table:

Model: `TakCallsignMapping` — fields: `id`, `callsign` (e.g., "ALPHA-CO-1-1"), `unit_id` (FK to unit), `device_uid` (optional — specific ATAK device UID), `created_by`, `last_seen_at`

The admin page should include a TAK configuration section where operators can:
- View incoming TAK callsigns and map them to units
- Auto-suggest mappings based on callsign patterns (e.g., "ALPHA-CO" → Alpha Company)
- Flag unmapped callsigns for attention

### TAK Server Configuration

Store TAK Server connection config in the KEYSTONE admin settings:

- `tak_server_url`: TAK Server base URL
- `tak_server_port`: API port (default 8443)
- `tak_auth_type`: certificate-based or token-based
- `tak_cert_path` / `tak_cert_password`: client cert for mTLS auth
- `tak_poll_interval`: seconds between API polls (default 30)
- `tak_event_types`: list of CoT event type prefixes to ingest (e.g., "b-r-f" for logistics)
- `tak_webhook_enabled`: boolean — expose webhook endpoint
- `tak_stream_enabled`: boolean — listen on TCP/UDP
- `tak_stream_port`: TCP/UDP listen port

## Dashboard Views — Detailed Requirements

### Commander View (DashboardPage → CommanderView)
- Top row: 6 tiles, one per logistics function (Supply, Maintenance, Transportation, Engineering, Health Services, Services). Each tile is GREEN/AMBER/RED based on worst status within that function.
- Middle row: Sustainability timeline — horizontal bar chart showing projected days until critical shortfall for each supply class, colored by urgency.
- Bottom row: Active alerts requiring attention (CRITICAL first, then WARNING).
- Click any tile to drill down to the S-4 view for that function.
- Designed for a 30-second assessment. Minimal text, maximum visual.

### S-4/G-4 View (DashboardPage → S4View)
- Supply status table: all supply classes for selected unit (and subordinates), with DOS, consumption rate, trend arrow (up/down/stable), and status color.
- Equipment readiness: readiness percentage by equipment type, with NMCM/NMCS breakdown.
- Active movements: convoy tracker showing in-transit resupply.
- Pending requisitions: list of open supply requests with status.
- This is the working view — dense data, filterable by unit/class/date range.

### S-3/G-3 View (DashboardPage → S3View)
- Sustainability overlay: which units can sustain current operations, for how many days, at current consumption rates.
- Readiness constraints: which units are below readiness thresholds and what's driving it.
- Movement feasibility: transportation assets available vs. required for planned operations.

### Common Features (all views)
- **Echelon selector** in sidebar: pick which level you're viewing (MEF, Division, Regiment, Battalion, Company). Data aggregates/drills down accordingly.
- **Time range selector**: view current status, or historical data for any date range.
- **Auto-refresh**: dashboards poll for updates every 60 seconds (configurable).
- **Export**: any view can be exported as PDF or Excel snapshot.

## Roles and Permissions (RBAC)

| Role | Access |
|------|--------|
| `admin` | Full system access, user management, unit configuration |
| `commander` | Commander view + drill-down, all units in their command |
| `s4` | S-4 view + supply/equipment/transportation management for their unit and subordinates |
| `s3` | S-3 view for their unit and subordinates |
| `operator` | Ingestion (upload files, review parsed data), report generation |
| `viewer` | Read-only dashboard access for their unit |

Each user is assigned a `role` and a `unit_id`. They can see data for their unit and all subordinate units. They cannot see data for peer or higher units (unless they're at MEF level).

## Report Generation

KEYSTONE auto-generates these reports from structured data:

1. **LOGSTAT**: Standard logistics status report. Populates supply class data, equipment readiness summary, and key shortfalls. Output as formatted Excel file matching doctrinal LOGSTAT format.
2. **Equipment Readiness Report**: Readiness percentages by equipment type with trend analysis. Output as Excel or PDF.
3. **Supply Status by Class**: Detailed breakdown of each supply class with consumption rates and DOS projections. Output as Excel or PDF.
4. **Higher HQ Rollup**: Aggregates subordinate unit data into a summary for the next higher echelon. Auto-calculated from subordinate reports.

Reports should be reviewable before submission (operator can edit/correct), then marked as final.

## Seed Data

Create realistic seed data for testing/demo:

- Unit hierarchy: I MEF → 1st MarDiv → 1st Marines (Regt) → 1/1, 2/1, 3/1 (Bns) → Alpha through Delta (Cos) per battalion
- Users: one per role type, assigned to various units
- Supply data: 30 days of historical supply status for all units across all classes, with realistic consumption patterns (Class I and V deplete faster during "exercise" periods)
- Equipment data: realistic readiness rates (85-95% for garrison, drops during exercises)
- Sample mIRC logs: generate 500+ realistic mIRC messages across the message types described above
- Sample Excel files: 3-4 LOGSTAT variants with slightly different column headers
- Sample TAK CoT events: generate 200+ realistic TAK logistics plugin events with varying schemas, callsigns mapped to the seeded unit hierarchy, and geolocations in the Camp Pendleton area
- TAK callsign mappings: pre-populate the callsign-to-unit mapping table for all seeded units

## Build Instructions

Build this entire application. Start with:

1. Docker environment (docker-compose with PostgreSQL, Redis, backend, frontend, Celery worker)
2. Database models and migrations
3. Seed data (including TAK sample events and callsign mappings)
4. Ingestion pipelines (mIRC parser first, then Excel parser, then TAK ingestion)
5. API endpoints (including TAK webhook endpoint and TAK admin configuration)
6. Frontend pages (Dashboard first, then Supply, Equipment, Transportation, Ingestion, Reports)
7. TAK integration — admin page section for callsign mapping and server configuration
8. Tests for all parsers (mIRC, Excel, TAK) and critical API endpoints

Make sure the application runs end-to-end with `docker-compose up` and has realistic demo data loaded. The TAK integration should work in "demo mode" using sample CoT events even without a live TAK Server connected.
