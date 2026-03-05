# KEYSTONE - Claude Code Project Instructions

## Project Overview

KEYSTONE is a USMC logistics common operating picture (COP) web application. It has a FastAPI/Python backend, React/TypeScript frontend, PostgreSQL+PostGIS database, Redis cache, and Celery task queue. See `README.md` for full architecture details.

## Tech Stack

- **Backend**: Python 3.11, FastAPI, SQLAlchemy 2.0 (async), Pydantic 2, Celery + Redis
- **Frontend**: React 18, TypeScript 5.3, Vite 5, Tailwind CSS, Zustand, Leaflet, Recharts
- **Database**: PostgreSQL 15 + PostGIS 3.4
- **Infrastructure**: Docker, docker-compose, nginx, Alembic migrations

## Key Paths

- `backend/app/` - FastAPI application (API routes, models, schemas, core logic)
- `backend/tests/` - Backend pytest test suite
- `backend/simulator/` - Exercise simulation engine
- `frontend/src/` - React SPA source
- `frontend/tests/` - Frontend test suite
- `docs/` - Project documentation

## Development Commands

### Backend
```bash
cd backend
ruff check .                  # Lint
ruff format --check .         # Format check
mypy app/ --ignore-missing-imports --disable-error-code arg-type --disable-error-code assignment --disable-error-code var-annotated
pytest tests/ -v --cov=app    # Unit tests (SQLite in-memory)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000  # Dev server
```

### Frontend
```bash
cd frontend
npx tsc -b                    # Type checking
npx vitest run                # Unit tests
npx vitest run --coverage     # Tests with coverage
npm run dev                   # Dev server (port 5173)
```

### Docker
```bash
docker compose up --build -d                      # Full stack
docker compose --profile demo up --build -d       # With simulator
```

## Testing Guidelines

### General Testing Rules
- Backend tests use SQLite in-memory (no PostgreSQL required for unit tests)
- Frontend tests use Vitest
- Always run lint/type checks before committing

### UI Testing with Playwright MCP Server
- **Use the Playwright MCP server to capture screenshots during UI testing.** Whenever testing frontend changes, take screenshots of the affected pages/components to verify visual correctness.
- Use Playwright screenshots to confirm:
  - Layout renders correctly across viewport sizes
  - Components display the expected data and styling
  - Interactive elements (modals, dropdowns, forms) appear correctly in all states
  - Map rendering and military symbology display properly
  - Classification banners show correct colors and text
- Save screenshots with descriptive names that indicate what is being tested (e.g., `dashboard-readiness-cards.png`, `convoy-planning-modal-open.png`)

### Screenshot and Visual Verification Workflow
1. Navigate to the page or component under test using Playwright
2. Take a screenshot to capture the current state
3. Verify the screenshot shows the expected result before moving on
4. For interactive flows, capture screenshots at each key step (before click, after click, form filled, form submitted, etc.)

## User Documentation Standards

### Screenshots in Documentation
- **All user-facing documentation must include screenshots** to help users understand the interface and workflows.
- When creating or updating docs, use the Playwright MCP server to capture current screenshots of the relevant UI.
- Screenshots should be:
  - Taken at a consistent viewport size (1920x1080 recommended for desktop views)
  - Cropped or annotated to highlight the relevant area when needed
  - Stored in `docs/images/` with descriptive filenames
  - Referenced in markdown with alt text describing what the screenshot shows
- Include screenshots for:
  - Each major page/view (dashboard, supply, equipment, map, admin, etc.)
  - Step-by-step workflows (e.g., creating a convoy, ingesting data, running a report)
  - Configuration panels and settings
  - Alert/notification examples

### README Updates
- **When updating the README**, always start the application (`docker compose up --build -d`), then use Playwright to capture fresh screenshots of all affected pages.
- Store screenshots in `docs/images/` and reference them with descriptive alt text.
- For the Playwright MCP browser, accept the self-signed certificate by clicking through the Chrome certificate warning (Advanced → Proceed to localhost).
- Set viewport to 1920x1080 for consistent screenshots.
- After updating, auto-ship: create branch, commit, push, open PR, merge.

### Videos in Documentation
- **Include screen recording videos where possible**, especially for:
  - Multi-step workflows (convoy planning, data ingestion, report generation)
  - Interactive features (map interactions, drag-and-drop, filtering)
  - Simulator demonstrations
  - Initial setup and onboarding walkthroughs
- Store videos in `docs/videos/` or link to hosted versions
- Provide a brief text description alongside each video for accessibility and for users who cannot play video

## Code Style

- **Backend**: Follow ruff defaults. Use async SQLAlchemy patterns. Pydantic v2 schemas.
- **Frontend**: TypeScript strict mode. Tailwind for styling. Zustand for state management.
- Commit messages: conventional style (feat:, fix:, docs:, etc.)

## Access Control

6 roles: ADMIN, COMMANDER, S4, S3, OPERATOR, VIEWER. Users are scoped to their unit and subordinates in the hierarchy. Default dev credentials are in `README.md`.

## Environment

- Dev mode: `ENV_MODE=development` (default) - seeds test users, enables debug features
- Demo mode: `VITE_DEMO_MODE=true` - static frontend with mock data, no backend needed
- Production: `ENV_MODE=production` - blocks seed users, requires real credentials
