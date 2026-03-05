# KEYSTONE Fix Maintenance Dashboard Issues

**Project**: KEYSTONE — USMC Logistics Intelligence System
**Scope**: Fix critical UX bugs and empty states in maintenance management dashboard
**Date**: 2026-03-05

---

## Context

The Maintenance Management dashboard has four tabs:
1. **WORK ORDERS** — Active maintenance queue (uses MaintenanceQueue component)
2. **PM SCHEDULE** — Preventive maintenance schedule table
3. **DEADLINES** — Equipment currently deadlined (NMC > 7 days)
4. **ANALYTICS** — Trend charts and KPIs (works; shows data even when other tabs empty)

Currently:
- Work Orders tab shows data via MaintenanceQueue component
- Analytics tab displays correctly with charts and KPIs
- PM Schedule, Deadlines, and Work Orders tabs show **empty with no feedback** when no data exists
- Work Order creation modal **doesn't center properly** — appears above viewport, user cannot see full form

**Database Models**:
- `MaintenanceWorkOrder`: id, unit_id, equipment_id, individual_equipment_id, work_order_number, description, status (OPEN/IN_PROGRESS/AWAITING_PARTS/COMPLETE), category, priority, parts_required, estimated_completion, actual_hours, location, assigned_to, created_at, completed_at, echelon_of_maintenance, maintenance_level, deadline_date, eri_date, erb_number, downtime_hours, nmcs_since, nmcm_since
- `MaintenancePart`: id, work_order_id, nsn, part_number, nomenclature, quantity, unit_cost, source (ON_HAND/ON_ORDER/CANNIBALIZED/LOCAL_PURCHASE), status (NEEDED/ON_ORDER/RECEIVED/INSTALLED)
- `MaintenanceLabor`: id, work_order_id, personnel_id, labor_type (INSPECT/DIAGNOSE/REPAIR/REPLACE/TEST), hours, date, notes

**Frontend Stack**: React 18, TypeScript, Tailwind CSS, TanStack Query, Zustand
**Backend Stack**: Python/FastAPI, SQLAlchemy async ORM, PostgreSQL

---

## Issues to Fix

### 1. Work Order Modal Not Centered (CRITICAL UX BUG)

**Problem**: CreateWorkOrderModal renders with `position: fixed` and centered, but the modal content extends beyond the viewport. Users cannot see the bottom half of the form (location, estimated completion, parts section).

**Location**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/equipment/CreateWorkOrderModal.tsx`

**Current Implementation**: The modal already uses `position: fixed`, `maxHeight: '90vh'`, but the form fields exceed the scrollable area or the modal is rendered off-screen.

**Fix Requirements**:
- Verify the modal overlay and container are properly centered with `display: flex`, `alignItems: 'center'`, `justifyContent: 'center'`
- Ensure the scrollable form area (with `overflowY: 'auto'`) is bounded correctly
- Test that the modal appears in viewport center and can scroll to all fields
- If a shared Modal wrapper component doesn't exist, create `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/ui/Modal.tsx`
- **Modal component spec** (if creating):
  - `position: fixed`, `inset: 0`, `zIndex: 3000`
  - Dark overlay: `backgroundColor: 'rgba(0, 0, 0, 0.85)'`
  - Container: `display: flex`, `alignItems: 'center'`, `justifyContent: 'center'`
  - Content: `width: '90%'`, `maxWidth: 600px`, `maxHeight: '90vh'`, `overflowY: 'auto'`, scrollable form area
  - Header, footer always visible; form content scrolls
  - Escape key closes modal
  - Click outside modal closes modal
  - Children render inside scrollable container

**Optional Restructuring** (if modal needs UI/UX improvement):
- Group form fields into logical sections with small headers:
  - **Work Order Basics**: WO#, Priority, Category
  - **Equipment & Assignment**: Equipment selector, Equipment ID, Unit ID, Assigned To, Location
  - **Timeline & Description**: Description (textarea), Est. Completion date
  - **Parts Needed** (optional collapsible): Add/remove parts rows (NSN, Part #, Nomenclature, Qty, Source)
- All section headers: `fontFamily: 'var(--font-mono)'`, `fontSize: 10px`, `fontWeight: 700`, `letterSpacing: '1.5px'`, `textTransform: 'uppercase'`, `color: 'var(--color-text-muted)'`
- Parts table inside accordion/collapsible (optional; can add later)

---

### 2. Empty States for Work Orders, PM Schedule, Deadlines

**Problem**: When no records exist, users see blank space with no guidance.

**Location**:
- `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/pages/MaintenanceDashboardPage.tsx` (tabs content)
- `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/equipment/MaintenanceQueue.tsx` (Work Orders)
- `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/maintenance/PMScheduleTable.tsx` (PM Schedule)
- `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/maintenance/DeadlineBoard.tsx` (Deadlines)

**Existing Component**: `EmptyState` component exists at `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/ui/EmptyState.tsx`

**Fix Requirements**:

#### Work Orders Tab (MaintenanceQueue)
- When `workOrders.length === 0`, show:
  ```
  EmptyState({
    icon: <Wrench size={32} />,
    title: 'NO WORK ORDERS',
    message: 'Create your first work order to track maintenance activities'
  })
  ```
- Include a "+ New Work Order" button below the empty state that opens CreateWorkOrderModal
- Styling: Center the empty state within the Card

#### PM Schedule Tab (PMScheduleTable)
- When `schedule.length === 0`, show:
  ```
  EmptyState({
    icon: <Calendar size={32} />,
    title: 'NO PM SCHEDULE CONFIGURED',
    message: 'Set up preventive maintenance schedules for your equipment. PM records are created manually via the API or auto-generated from equipment catalog PM intervals.'
  })
  ```
- No action button needed (scheduling is typically admin-driven)

#### Deadlines Tab (DeadlineBoard)
- When `deadlines.length === 0`, show:
  ```
  EmptyState({
    icon: <AlertCircle size={32} />,
    title: 'NO EQUIPMENT CURRENTLY DEADLINED',
    message: 'Equipment with extended NMC status (>7 days) will appear here'
  })
  ```

**Integration**:
- Import EmptyState in each component
- Add conditional rendering: `if (!data || data.length === 0) return <EmptyState ... />`
- Use Lucide React icons: Wrench, Calendar, AlertCircle

---

### 3. Seed Maintenance Data

**Purpose**: Populate database with realistic maintenance scenarios for demo/testing. Enable testing of tabs with actual data.

**Location**: Create new file at `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/seed/seed_maintenance.py`

**Requirements**:

#### Work Orders (5–10 orders across unit):
- 2–3 in OPEN status (recent, unstarted)
- 2–3 in IN_PROGRESS status (active work)
- 1–2 in AWAITING_PARTS status (waiting for supply)
- 2–3 in COMPLETE status (finished work)
- Each must reference:
  - A unit from the units table (e.g., from `seed_units.py` — unit_id ≥ 1)
  - Equipment from equipment catalog (JLTV, HMMWV, MTVR, radio, generator, etc.)
  - Realistic descriptions: "Replace engine oil and filter", "Diagnose radio comms issue", "Inspect tire wear"
  - Priority: Mix of 1 (URGENT), 2 (PRIORITY), 3 (ROUTINE)
  - Category: CORRECTIVE, PREVENTIVE, INSPECTION
  - Assigned mechanic: Realistic names or generic "A-Team Mech 1", "B-Team Mech 2"
  - Location: "Bay 1", "Bay 3", "Motor Pool", "Comms Tent"
  - estimated_completion: 2–10 days from now
  - created_at: 1–30 days ago (varies by status)

#### Parts (1–3 parts per work order on ~50% of orders):
- Use realistic military part numbers (NSN format: XXXX-XX-XXX-XXXX or part_number format)
- Include parts from `seed_supply_catalog.py` if available (reference real NSNs):
  - Filters (oil, air, fuel)
  - Tires (various sizes)
  - Batteries
  - Starters
  - Gaskets, seals
- Quantity: 1–4
- Source: ON_HAND, ON_ORDER, CANNIBALIZED, LOCAL_PURCHASE
- Status: Vary status to show NEEDED, ON_ORDER, RECEIVED

#### Labor Entries (1–3 per work order on IN_PROGRESS and COMPLETE orders):
- Reference personnel from `personnel` table (if seeded)
- labor_type: INSPECT, DIAGNOSE, REPAIR, REPLACE, TEST
- hours: 1–8 hours per entry
- date: Dates trailing back from work order creation
- notes: "Inspection complete. Issue identified.", "Replaced damaged component."

#### PM Schedule (5–10 preventive maintenance entries):
- Reference equipment
- schedule_name: "Monthly PMCS", "Quarterly Oil Change", "Annual Inspection"
- next_due_date: Various dates (some past, some future)
- interval_days: 30, 90, 365
- status: OVERDUE, DUE_SOON, OK

#### Deadlines (1–2 equipment with extended NMC):
- Reference equipment
- deadline_date: 7–14 days ago
- reason: "Engine failure — awaiting parts", "Transmission repair — depot evacuation"
- equipment_id linked to a work order in AWAITING_PARTS

**Seed Function Signature**:
```python
async def seed_maintenance_data(db: AsyncSession):
    """Seed realistic maintenance work orders, parts, labor, PM schedules, deadlines."""
    # 1. Query existing units and equipment
    # 2. Create work orders
    # 3. Create parts for work orders
    # 4. Create labor entries
    # 5. Create PM schedules
    # 6. Create deadline records
    # 7. Commit all
```

**Import Instructions**:
- Add to `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/main.py` (or wherever seed functions are called):
  ```python
  from seed.seed_maintenance import seed_maintenance_data

  # In startup event or seed function:
  await seed_maintenance_data(db)
  ```

---

### 4. Work Order Lifecycle (Optional — Current Implementation Check)

**Verify** the following workflow functions correctly:

1. **Create**: Modal form → POST `/maintenance/work-orders` → work order appears in queue
2. **View Detail**: Click work order row → WorkOrderDetailModal shows all fields, parts, labor
3. **Update Status**: Dropdown or buttons to change status OPEN → IN_PROGRESS → AWAITING_PARTS → COMPLETE
4. **Add Parts**: Sub-form in detail view → POST `/maintenance/work-orders/{id}/parts`
5. **Log Labor**: Sub-form in detail view → POST `/maintenance/work-orders/{id}/labor`
6. **Complete**: Mark COMPLETE, record actual_hours and completed_at
7. **Query Invalidation**: All mutations (create, update status, add parts, log labor) invalidate `'maintenance-work-orders'` query for auto-refresh

**Files to Verify**:
- `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/equipment/WorkOrderDetailModal.tsx`
- `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/api/maintenance.ts` (API client)
- `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/api/maintenance.py` (API endpoints)

**Status**: If all routes exist and modals work, no changes needed. This is primarily a verification task.

---

### 5. Analytics Data Consistency (Optional — Current Implementation Check)

**Verify** analytics data reflects real work orders:

**Components**:
- `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/maintenance/MaintenanceTrendChart.tsx` (weekly trend)
- `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/maintenance/TopFaultsChart.tsx` (top faults)
- `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/services/maintenance_analytics.py` (data aggregation)

**Expected Analytics**:
- Open vs. closed work orders over time (line/bar chart)
- Average time to repair by equipment type
- Top 5 fault codes / descriptions
- Parts most frequently on backorder
- Mechanic utilization (total hours logged by mechanic)

**Verification**: After seeding maintenance data, the Analytics tab should show these metrics populated from the work orders, parts, and labor tables.

---

## Implementation Plan

### Wave 0 — Scope & Coordination

**Orchestrator Task**:
1. Delegate Issue #1 (Modal centering) → Frontend Dev (quick fix, high priority)
2. Delegate Issue #2 (Empty states) → Frontend Dev (parallel; depends on EmptyState component)
3. Delegate Issue #3 (Seed data) → Python/Backend Dev (parallel; independent)
4. Verify Issue #4 (Lifecycle) and Issue #5 (Analytics) → Code review only (likely working)

### Wave 1 — Development (Parallel)

#### Frontend Dev Task — Issues #1 & #2
- **Fix CreateWorkOrderModal centering** in `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/equipment/CreateWorkOrderModal.tsx`
  - Verify modal is rendered centered in viewport
  - Test form scrolling for all fields
  - (Optional) Create shared Modal wrapper component
- **Add EmptyState to MaintenanceQueue** (Work Orders tab)
  - Conditional rendering when `workOrders.length === 0`
  - Include "+ New Work Order" button
- **Add EmptyState to PMScheduleTable** (PM Schedule tab)
  - Conditional rendering when `schedule.length === 0`
- **Add EmptyState to DeadlineBoard** (Deadlines tab)
  - Conditional rendering when `deadlines.length === 0`
- **Acceptance Criteria**:
  - Modal renders in viewport center with scrollable form area
  - All three tabs show appropriate empty states with messaging
  - "+ New Work Order" button opens modal
  - No TypeScript or ESLint errors
  - Styling matches project theme (Tailwind + CSS vars)

#### Python Backend Dev Task — Issue #3
- **Create `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/seed/seed_maintenance.py`**
  - Function: `async def seed_maintenance_data(db: AsyncSession)`
  - Seed 8–10 work orders across unit(s)
  - Seed 1–3 parts per order (~50% of orders)
  - Seed 1–3 labor entries per order (IN_PROGRESS and COMPLETE only)
  - Seed 8–10 PM schedule entries
  - Seed 1–2 deadline records
  - Use realistic military equipment names (JLTV, HMMWV, MTVR, radio, generator)
  - Use real NSNs or part numbers from supply catalog
  - All timestamps realistic (created_at varies, completed_at only for COMPLETE)
  - Commit all records to database
- **Integration**: Add import and call in startup/seed initialization
- **Acceptance Criteria**:
  - Seed function runs without errors
  - Database contains all work orders, parts, labor, PM schedules, deadlines
  - Work Orders tab shows multiple cards in MaintenanceQueue
  - PM Schedule tab shows entries
  - Deadlines tab shows equipment
  - All data is queryable via API

### Wave 2 — Verification (Parallel)

#### Tester Task
- **Build & Unit Tests**:
  - Frontend: `cd frontend && npx tsc -b` (full type-check)
  - Backend: `cd backend && python -m pytest` (if tests exist) OR `python -m py_compile app/**/*.py`
  - Docker: `docker compose build` (if Dockerfiles changed)
- **Integration Tests**:
  - Fetch work orders: `curl http://localhost:18080/api/v1/maintenance/work-orders`
  - Fetch PM schedules: `curl http://localhost:18080/api/v1/maintenance/pm-schedule`
  - Fetch deadlines: `curl http://localhost:18080/api/v1/maintenance/deadlines`
  - Verify 200 responses with JSON data
- **Frontend Manual Tests**:
  - Load Maintenance dashboard
  - Verify Work Orders, PM Schedule, Deadlines tabs show seeded data (not empty states)
  - Open CreateWorkOrderModal → verify it centers in viewport
  - Scroll through modal form → verify all fields visible
  - Close modal (Escape or click outside)
  - Create a new work order → verify it appears in queue
- **Report**: Pass/Fail for each step with evidence

#### DevSecOps Task
- **Security Review** (read-only):
  - Check for SQL injection vulnerabilities in maintenance.py endpoint routes
  - Verify all POST/PUT/DELETE routes require authentication (`get_current_user`)
  - Check for hardcoded credentials or secrets in seed file
  - Verify no sensitive data (NSNs, equipment IDs) leaked in logs
  - Validate input sanitization in form fields
- **Report**: List any findings by severity

### Wave 3 — Fix (If Needed)
- If Tester or DevSecOps reports failures, spawn relevant developer with exact error output
- Max 3 iterations before escalating to user

### Wave 4 — Re-verify (If Wave 3 Ran)
- Tester + DevSecOps run again in parallel

### Wave 5 — Smoke Test (Optional)
- Boot full Docker stack: `docker compose up -d`
- Wait for services healthy
- Test full UI workflow: login → navigate to Maintenance → create work order → verify appears
- Check logs for errors
- Clean up: `docker compose down`

### Wave 6 — Ship
- Create feature branch from `main`
- Bump version in `charts/ems-cop/Chart.yaml` (patch)
- Commit: "Fix maintenance dashboard: modal centering, empty states, seed data"
- Push + open PR
- Merge PR
- Tag release

---

## File References

### Frontend Files
- **Page**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/pages/MaintenanceDashboardPage.tsx`
- **Queue Component**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/equipment/MaintenanceQueue.tsx`
- **Create Modal**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/equipment/CreateWorkOrderModal.tsx`
- **Detail Modal**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/equipment/WorkOrderDetailModal.tsx`
- **PM Schedule**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/maintenance/PMScheduleTable.tsx`
- **Deadlines**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/maintenance/DeadlineBoard.tsx`
- **Empty State**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/ui/EmptyState.tsx`
- **API Client**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/api/maintenance.ts`

### Backend Files
- **Models**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/models/maintenance.py`
- **Maintenance Schedules**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/models/maintenance_schedule.py`
- **API Routes**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/api/maintenance.py`
- **Analytics Service**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/services/maintenance_analytics.py`
- **Seed Base**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/seed/` (reference other seed_*.py files)
- **New Seed File**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/seed/seed_maintenance.py` (create)

### Configuration
- **Charts**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/charts/ems-cop/Chart.yaml` (version bump on ship)

---

## Code Style & Conventions

### Frontend (React/TypeScript)
- Use existing component patterns (Card, EmptyState, Modal)
- Inline styles use CSS variables: `'var(--color-text)'`, `'var(--color-bg)'`, `'var(--font-mono)'`
- Tailwind classes for complex layouts (preferred) or inline styles for one-offs
- Lucide React icons for UI elements
- TypeScript strict mode; no `any` types
- Import order: React hooks → external libs → local components → styles

### Backend (Python/FastAPI)
- AsyncIO patterns (async/await with SQLAlchemy async session)
- SQLAlchemy ORM (not raw SQL)
- Structured logging with `logging` module or `slog` equivalent
- Error handling: wrap with context (`raise HTTPException(status_code=..., detail=...)`)
- Enum classes for status/category/priority
- Schema validation with Pydantic
- All CRUD routes behind `get_current_user` + role checks

---

## Testing & Acceptance Criteria

### Functional Requirements
- [ ] CreateWorkOrderModal centers in viewport
- [ ] All form fields visible when scrolling
- [ ] Work Orders tab shows EmptyState when no work orders; shows queue when data exists
- [ ] PM Schedule tab shows EmptyState when no schedules; shows table when data exists
- [ ] Deadlines tab shows EmptyState when no deadlined equipment; shows board when data exists
- [ ] Seed data creates 8–10 work orders, parts, labor, PM schedules, deadlines
- [ ] Dashboard tabs populate with seeded data (not empty states)
- [ ] Create work order modal submits successfully
- [ ] New work order appears in queue immediately

### Code Quality
- [ ] Frontend TypeScript: `npx tsc -b` passes (no errors/warnings)
- [ ] Frontend Vitest: `npx vitest run` passes (if tests exist)
- [ ] Backend Python: No syntax errors, imports resolve
- [ ] No hardcoded credentials or secrets in seed file
- [ ] EmptyState component reused (no duplicate code)
- [ ] Modal styling matches project theme

### Security
- [ ] No SQL injection vectors in API endpoints
- [ ] All write endpoints require authentication
- [ ] Input validation on form fields
- [ ] No sensitive data logged

---

## References

- **KEYSTONE CLAUDE.md**: `/sessions/nifty-festive-wozniak/mnt/LPI/CLAUDE.md` (orchestration rules)
- **MaintenanceWorkOrder Model**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/models/maintenance.py` lines 72–130
- **MaintenancePart Model**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/models/maintenance.py` lines 132–150
- **MaintenanceLabor Model**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/models/maintenance.py` lines 153–172
- **Existing Seed Files**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/seed/seed_units.py`, `seed_equipment_catalog.py`, `seed_supply_catalog.py`

---

## Success Metrics

**Wave 1 Completion**:
- Frontend dev commits modal fix + empty state changes
- Backend dev commits seed_maintenance.py with all data seeded

**Wave 2 Completion**:
- Tester reports all builds pass, all queries return seeded data
- DevSecOps reports no critical/high findings

**Wave 6 Completion**:
- PR merged to main
- Version bumped in Chart.yaml
- Maintenance dashboard fully functional: modal centered, empty states show, seeded data populates tabs
- No regressions in Analytics tab

---

## Notes

- **Demo Mode**: If frontend uses mock API (`isDemoMode`), ensure mock client also returns seeded data structure
- **Unit ID Resolution**: MaintenanceDashboardPage resolves `selectedUnitId` from Zustand store (lines 45–49); ensure seed data links work orders to existing units
- **Equipment Linking**: Reference equipment from catalog (TAMCN or equipment.id) to enable equipment selector in create modal
- **NSN Realism**: Use real USMC NSNs (format: XXXX-XX-XXX-XXXX) or reference from supply catalog if available
- **Timezone**: All DateTime fields use timezone-aware objects (UTC); backend handles conversion to local time in responses

