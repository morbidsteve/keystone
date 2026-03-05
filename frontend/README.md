# KEYSTONE Frontend

React SPA for the USMC Logistics Common Operating Picture.

## Tech Stack

- **React 18** with TypeScript 5.3
- **Vite 5** (build and dev server)
- **Tailwind CSS** (utility-first styling)
- **Zustand** (state management)
- **TanStack Query** (server state / data fetching)
- **TanStack Table** (data tables)
- **react-leaflet** + **milsymbol** (maps with APP-6D military symbology)
- **Recharts** (charts and visualizations)
- **Lucide React** (icons)

## Quick Start

```bash
# Install dependencies
npm ci

# Start development server (proxies /api to localhost:8000)
npm run dev

# Access at http://localhost:5173
```

Ensure the backend is running at `http://localhost:8000` or use demo mode (see below).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npx tsc -b` | Full TypeScript type check (no emit) |
| `npx vitest run` | Run unit tests |
| `npx vitest run --coverage` | Run tests with coverage report |

## Demo Mode

Build a fully functional static site with mock data (no backend required):

```bash
VITE_DEMO_MODE=true npm run build
```

The demo build uses the mock API client (`src/api/mockClient.ts`) which provides realistic USMC logistics data for all pages. This mode is automatically deployed to GitHub Pages.

## Environment Variables

Set at build time via Vite:

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_DEMO_MODE` | `false` | Build as static demo site with mock data |
| `VITE_BASE_PATH` | `/` | Base URL path (set to `/keystone/` for GitHub Pages) |

## Project Structure

```
src/
  pages/           # 21 route pages (Dashboard, Map, Supply, Equipment, etc.)
  components/      # UI components organized by domain
    catalog/       # Catalog management
    common/        # Shared/common components
    custody/       # Custody tracking components
    dashboard/     # Readiness cards, supply charts, Commander/S4/S3 views
    datasources/   # Data source configuration
    equipment/     # Readiness tables, maintenance queue, work orders
    fuel/          # Fuel management components
    ingestion/     # Data ingestion components
    layout/        # Sidebar, header, main layout
    map/           # Leaflet map, symbology, layers, overlays
    medical/       # Medical tracking components
    notifications/ # Notification components
    personnel/     # Personnel management components
    readiness/     # Readiness assessment components
    reports/       # Report generator and structured viewer
    requisitions/  # Requisition management components
    supply/        # Supply tables, class breakdowns, DOS calculator
    transportation/# Convoy map, movement tracker, route planner
    ui/            # Classification banner, demo banner, shared components
  api/             # API client + mock data for demo mode
  stores/          # Zustand stores (auth, dashboard, map, alerts, classification, reports)
  hooks/           # Custom React hooks
  lib/             # Types, utilities, constants
```

## Routing

All routes are protected by JWT authentication (redirect to `/login` if not authenticated):

| Path | Page | Description |
|------|------|-------------|
| `/dashboard` | DashboardPage | Commander, S-4, S-3 views |
| `/map` | MapPage | Interactive COP map |
| `/supply` | SupplyPage | Supply class tracking |
| `/equipment` | EquipmentPage | Fleet readiness |
| `/equipment/:id` | EquipmentDetailPage | Individual asset detail (5 tabs) |
| `/maintenance` | MaintenanceDashboardPage | Maintenance tracking and scheduling |
| `/requisitions` | RequisitionsPage | Requisition management |
| `/personnel` | PersonnelPage | Personnel management |
| `/medical` | MedicalPage | Medical tracking |
| `/fuel` | FuelPage | Fuel management |
| `/custody` | CustodyPage | Custody tracking |
| `/audit` | AuditPage | Audit logging |
| `/transportation` | TransportationPage | Convoy and movement management |
| `/ingestion` | IngestionPage | File upload and parsing |
| `/data-sources` | DataSourcesPage | External source configuration |
| `/reports` | ReportsPage | Report generation and viewing |
| `/alerts` | AlertsPage | Alert management |
| `/readiness` | ReadinessPage | Readiness assessment |
| `/admin` | AdminPage | System administration |
| `/docs` | DocsPage | Interactive documentation |

## Docker

The frontend Dockerfile is a multi-stage build:

1. **Build stage**: Node 20, installs deps, runs `npm run build`
2. **Production stage**: `nginx-unprivileged` with TLS, API proxy, and tile proxy

The nginx config (`nginx.conf`) handles:
- TLS termination (self-signed cert via `generate-cert.sh`)
- `/api/*` proxy to the backend container
- `/tiles/*` proxy for map tile sources
- SPA fallback routing
- Security headers (HSTS, CSP, X-Frame-Options, etc.)

## Notes

- No ESLint configured -- type checking is handled by `tsc -b`
- milsymbol requires 15-character SIDCs and `monoColor` (not `colorMode`) for hex colors
- Tailwind config is in `tailwind.config.ts`
- Vite config includes tile proxy for development in `vite.config.ts`
