# KEYSTONE — USMC Logistics Common Operating Picture

KEYSTONE is a logistics intelligence web application for the United States Marine Corps, built as a component of Project Dynamis (USMC's CJADC2 effort). It ingests unstructured logistics data from sources Marines already use — mIRC chat logs, Excel spreadsheets, GCSS-MC, TAK servers, manual entry — structures that data, and presents it as dashboards, automated reports, and predictive analytics at every echelon from company to MEF.

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, SQLAlchemy (async), PostgreSQL, Celery + Redis
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Recharts, Zustand, TanStack Table
- **Ingestion:** spaCy NLP + custom regex parsers for mIRC, Excel template matcher, TAK CoT XML parser
- **Infrastructure:** Docker Compose, Alembic migrations

## Quick Start

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Default Credentials (Development Only)

| Username | Password | Role |
|----------|----------|------|
| admin | admin123 | Admin |
| commander | cmd123 | Commander |
| s4officer | s4pass123 | S-4 |
| s3officer | s3pass123 | S-3 |
| operator | op123 | Operator |
| viewer | view123 | Viewer |

## Key Features

- **Dashboard Views:** Commander (30-second assessment), S-4 (detailed working view), S-3 (operational constraints)
- **mIRC Parser:** Regex + NLP pipeline extracts supply status, equipment readiness, convoy updates from chat logs
- **Excel Ingestion:** Auto-matches known LOGSTAT templates, column mapping wizard for new formats
- **Schema Mapping:** Admin UI to map any data format to KEYSTONE's canonical schema
- **TAK Integration:** Connects to TAK servers for field-submitted logistics data via CoT protocol
- **Analytics:** Consumption rate forecasting, sustainability projections, anomaly detection
- **Reports:** Auto-generated LOGSTAT, readiness reports, supply status, higher HQ rollups
- **RBAC:** Role-based access with unit hierarchy scoping

## Project Structure

```
keystone/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/          # REST endpoints
│   │   ├── models/       # SQLAlchemy models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── ingestion/    # mIRC, Excel, TAK parsers
│   │   ├── analytics/    # Consumption, readiness, sustainability
│   │   ├── reports/      # LOGSTAT, readiness report generators
│   │   └── tasks/        # Celery async tasks
│   ├── seed/             # Unit hierarchy, users, sample data
│   └── tests/            # pytest test suite
├── frontend/         # React/TypeScript application
│   └── src/
│       ├── components/   # Dashboard, supply, equipment, ingestion UI
│       ├── pages/        # Route pages
│       ├── api/          # API client + mock data for demo mode
│       └── stores/       # Zustand state management
└── docker-compose.yml
```

## License

DISTRIBUTION STATEMENT A. Approved for public release: distribution unlimited.
