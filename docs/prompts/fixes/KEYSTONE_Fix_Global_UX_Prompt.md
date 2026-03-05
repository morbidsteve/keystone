# KEYSTONE Global UX Fixes — Frontend Prompt

**System**: KEYSTONE (USMC Logistics Intelligence System)
**Focus**: Frontend React application — global UX improvements and consistency fixes
**Tech Stack**: React 18, TypeScript, Tailwind CSS, Zustand, TanStack Query/Table
**Styling**: Inline styles with CSS custom properties (`var(--color-*)`, `var(--font-mono)`, `var(--radius)`, `var(--transition)`)

---

## Overview

This prompt orchestrates fixes for four critical UX issues across the entire KEYSTONE frontend application:

1. **Modal Centering** — ALL modals must be centered on screen, not clipped above viewport
2. **Sidebar Navigation** — Missing links for FUEL, CUSTODY, and AUDIT pages
3. **Empty State Patterns** — Consistent UX guidance when pages have no data
4. **Auto-Refresh After Mutations** — Lists refresh automatically after create/update/delete operations

All fixes preserve existing patterns and styling conventions. No breaking changes to component APIs.

---

## Wave 0: Planning

### Deliverables by Role

| Wave | Agent | Task |
|------|-------|------|
| **Wave 1** | **Frontend Dev** | Build all 4 fixes in parallel |
| **Wave 2** | **Tester** + **DevSecOps** | Verify builds, tests, security |
| **Wave 3** (if needed) | **Frontend Dev** | Fix any failures |
| **Wave 4** (if needed) | **Tester** + **DevSecOps** | Re-verify |
| **Wave 5** | **Smoke Tester** | End-to-end verification |
| **Wave 6** | **Orchestrator** | Auto-ship: commit, PR, merge, tag release |

---

## Issue 1: Modal Centering (CRITICAL GLOBAL FIX)

### Problem

Many modals across the app are positioned incorrectly:
- Modal content appears **above** the viewport
- Users cannot see the full modal height
- Examples: Maintenance work order modal, requisition modals, route planner modal

### Solution: Create Shared Modal Wrapper

Create a reusable `Modal` component that ALL modals in the app will use. This component:
- Centers content on screen using `position: fixed`
- Provides smooth fade-in animation
- Closes on ESC key and backdrop click
- Handles internal scrolling for tall content
- Stays centered even during page scroll

#### File: `frontend/src/components/ui/Modal.tsx`

```typescript
import { useEffect, useCallback } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ title, onClose, children, maxWidth = '600px' }: ModalProps) {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--color-bg)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          maxWidth: maxWidth,
          width: '90%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px rgba(0, 0, 0, 0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--color-text)',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary)',
              padding: '0',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius)',
              transition: 'background-color var(--transition)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--color-hover)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
          >
            ✕
          </button>
        </div>

        {/* Content with internal scrolling */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            color: 'var(--color-text)',
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
```

### Refactor Existing Modals

Identify ALL modals in the codebase. Search for:
- Components with `position: fixed` or `position: absolute` and `z-index` > 900
- Components with "Modal" in the name
- Components rendered as overlays

**Files to refactor** (search `frontend/src/` for all modal instances):

#### 1. `frontend/src/components/requisitions/CreateRequisitionModal.tsx`

**Before**:
```typescript
export function CreateRequisitionModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, zIndex: 999, ... }}>
      <div style={{ position: 'absolute', top: '50px', left: '50%', ... }}>
        {/* form content */}
      </div>
    </div>
  );
}
```

**After**:
```typescript
import { Modal } from '../ui/Modal';

export function CreateRequisitionModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  return (
    <Modal title="Create Requisition" onClose={onClose}>
      {/* form content — no positioning needed */}
    </Modal>
  );
}
```

#### 2. `frontend/src/components/transportation/RoutePlannerModal.tsx`

Wrap route planner form content in `<Modal title="Route Planner" onClose={onClose}>` instead of custom positioning.

#### 3. `frontend/src/components/transportation/MovementDetailModal.tsx`

Wrap movement detail form in `<Modal title="Movement Details" onClose={onClose}>` instead of custom positioning.

#### 4. `frontend/src/components/maintenance/CreateWorkOrderModal.tsx` (or similar)

Wrap work order form in `<Modal>` wrapper.

#### 5. Any other modal components

Use `grep` to find all files with `position: fixed` or `position: absolute` in `frontend/src/`:

```bash
grep -r "position: (fixed|absolute)" frontend/src/components/ --include="*.tsx" --include="*.ts"
```

For each file found:
- Replace custom positioning div with `<Modal>` wrapper
- Move form content inside Modal children
- Keep form logic unchanged

### Migration Checklist

- [ ] Create `/frontend/src/components/ui/Modal.tsx` with complete implementation
- [ ] Refactor CreateRequisitionModal
- [ ] Refactor RoutePlannerModal
- [ ] Refactor MovementDetailModal
- [ ] Refactor CreateWorkOrderModal (maintenance)
- [ ] Search and refactor ALL other modals in codebase
- [ ] Verify no old positioning styles remain in modal components
- [ ] Test: each modal should be perfectly centered on screen
- [ ] Test: each modal should close on ESC key
- [ ] Test: each modal should close on backdrop click

---

## Issue 2: Sidebar Navigation — Missing Links

### Problem

The sidebar in `frontend/src/components/layout/Sidebar.tsx` is missing navigation links for three existing pages:

- `/fuel` → FuelPage
- `/custody` → CustodyPage
- `/audit` → AuditPage

These routes exist in `App.tsx` but are not accessible from the sidebar.

### Solution: Update Sidebar Navigation

#### File: `frontend/src/components/layout/Sidebar.tsx`

**Current navItems** (partial):
```typescript
const navItems = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Map', href: '/map', icon: <Map size={20} /> },
  { label: 'Supply', href: '/supply', icon: <Package size={20} /> },
  // ... existing items
  { label: 'Medical', href: '/medical', icon: <Heart size={20} /> },
  // MISSING FUEL, CUSTODY, AUDIT
];
```

**Updated navItems**:
```typescript
import {
  LayoutDashboard,
  Map,
  Package,
  // ... existing imports
  Heart,
  Droplet,      // NEW: for Fuel
  Shield,       // NEW: for Custody
  FileSearch,   // NEW: for Audit
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'Map', href: '/map', icon: <Map size={20} /> },
  { label: 'Supply', href: '/supply', icon: <Package size={20} /> },
  { label: 'Equipment', href: '/equipment', icon: <Wrench size={20} /> },
  { label: 'Maintenance', href: '/maintenance', icon: <Tools size={20} /> },
  { label: 'Requisitions', href: '/requisitions', icon: <ClipboardList size={20} /> },
  { label: 'Personnel', href: '/personnel', icon: <Users size={20} /> },
  { label: 'Readiness', href: '/readiness', icon: <Activity size={20} /> },
  { label: 'Medical', href: '/medical', icon: <Heart size={20} /> },
  { label: 'Fuel', href: '/fuel', icon: <Droplet size={20} /> },           // NEW
  { label: 'Transportation', href: '/transportation', icon: <Truck size={20} /> },
  { label: 'Ingestion', href: '/ingestion', icon: <Download size={20} /> },
  { label: 'Data Sources', href: '/data-sources', icon: <Database size={20} /> },
  { label: 'Reports', href: '/reports', icon: <BarChart3 size={20} /> },
  { label: 'Alerts', href: '/alerts', icon: <AlertCircle size={20} /> },
  { label: 'Custody', href: '/custody', icon: <Shield size={20} /> },       // NEW
  { label: 'Audit', href: '/audit', icon: <FileSearch size={20} /> },       // NEW
  { label: 'Admin', href: '/admin', icon: <Settings size={20} /> },
  { label: 'Docs', href: '/docs', icon: <Book size={20} /> },
];
```

### Placement Rationale

- **Fuel** goes after Medical (logistics group)
- **Custody** goes after Alerts (security/oversight group)
- **Audit** goes after Custody (security/compliance group)

### Implementation Steps

1. Add three new `import` statements for Lucide icons:
   - `Droplet` (for Fuel)
   - `Shield` (for Custody)
   - `FileSearch` (for Audit)

2. Add three new objects to `navItems` array in the positions specified above

3. Verify all three routes are actually defined in `App.tsx`

4. Test: Sidebar should now show all three new links in the correct positions

---

## Issue 3: Empty State Patterns

### Problem

Several pages show empty tables with no guidance to users:
- Maintenance work orders (when none exist)
- Maintenance PM schedules (when empty)
- Personnel alpha roster (when empty)
- Custody page (when no items)
- Other data tables

Users see a blank page and don't know what to do next.

### Solution: Create Shared EmptyState Component

#### File: `frontend/src/components/ui/EmptyState.tsx`

```typescript
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        minHeight: '400px',
      }}
    >
      {icon && (
        <div
          style={{
            fontSize: '48px',
            marginBottom: '20px',
            opacity: 0.6,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
      )}

      <h3
        style={{
          margin: '0 0 8px 0',
          fontSize: '18px',
          fontWeight: '600',
          color: 'var(--color-text)',
        }}
      >
        {title}
      </h3>

      {subtitle && (
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: 'var(--color-text-secondary)',
            maxWidth: '400px',
          }}
        >
          {subtitle}
        </p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            padding: '8px 16px',
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            transition: 'background-color var(--transition)',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--color-primary)')
          }
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
```

### Apply EmptyState to Pages

Identify pages with empty table/list states. For each, wrap the empty state with the `EmptyState` component:

#### 1. **Maintenance — Work Orders Tab**

File: `frontend/src/pages/MaintenancePage.tsx` (or similar)

**Before**:
```typescript
{workOrders.length === 0 ? (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <p>No work orders</p>
  </div>
) : (
  <WorkOrdersTable data={workOrders} />
)}
```

**After**:
```typescript
import { EmptyState } from '../components/ui/EmptyState';
import { Wrench } from 'lucide-react';

{workOrders.length === 0 ? (
  <EmptyState
    icon={<Wrench size={48} />}
    title="No work orders yet"
    subtitle="Create your first work order to start tracking maintenance"
    actionLabel="+ Add Work Order"
    onAction={() => setShowCreateModal(true)}
  />
) : (
  <WorkOrdersTable data={workOrders} />
)}
```

#### 2. **Maintenance — PM Schedule Tab**

File: (same as above, different tab)

**After**:
```typescript
import { EmptyState } from '../components/ui/EmptyState';
import { Calendar } from 'lucide-react';

{pmSchedules.length === 0 ? (
  <EmptyState
    icon={<Calendar size={48} />}
    title="No preventive maintenance schedules"
    subtitle="Create a PM schedule to automate equipment maintenance planning"
    actionLabel="+ Add PM Schedule"
    onAction={() => setShowScheduleModal(true)}
  />
) : (
  <PMScheduleTable data={pmSchedules} />
)}
```

#### 3. **Maintenance — Deadlines Tab**

File: (same as above, different tab)

**After**:
```typescript
import { EmptyState } from '../components/ui/EmptyState';
import { CheckCircle } from 'lucide-react';

{deadlines.length === 0 ? (
  <EmptyState
    icon={<CheckCircle size={48} />}
    title="No upcoming deadlines"
    subtitle="All maintenance tasks are on track"
  />
) : (
  <DeadlinesTable data={deadlines} />
)}
```

#### 4. **Personnel — Alpha Roster**

File: `frontend/src/pages/PersonnelPage.tsx`

**After**:
```typescript
import { EmptyState } from '../components/ui/EmptyState';
import { Users } from 'lucide-react';

{personnel.length === 0 ? (
  <EmptyState
    icon={<Users size={48} />}
    title="No personnel assigned"
    subtitle="Add personnel to your roster to track assignments and readiness"
    actionLabel="+ Add Personnel"
    onAction={() => setShowAddPersonnelModal(true)}
  />
) : (
  <PersonnelTable data={personnel} />
)}
```

#### 5. **Custody Page**

File: `frontend/src/pages/CustodyPage.tsx`

**After**:
```typescript
import { EmptyState } from '../components/ui/EmptyState';
import { Lock } from 'lucide-react';

{custodyItems.length === 0 ? (
  <EmptyState
    icon={<Lock size={48} />}
    title="No custody items"
    subtitle="Items checked out to personnel will appear here"
  />
) : (
  <CustodyTable data={custodyItems} />
)}
```

#### 6. **Fuel Page** (if applicable)

File: `frontend/src/pages/FuelPage.tsx`

**After**:
```typescript
import { EmptyState } from '../components/ui/EmptyState';
import { Droplet } from 'lucide-react';

{fuelRecords.length === 0 ? (
  <EmptyState
    icon={<Droplet size={48} />}
    title="No fuel transactions"
    subtitle="Fuel usage and inventory transactions will appear here"
  />
) : (
  <FuelTable data={fuelRecords} />
)}
```

#### 7. **Any other empty table states**

Search for patterns like:
```typescript
if (data.length === 0) {
  return <div>No data</div>;
}
```

Replace all with `<EmptyState>` component.

### Migration Checklist

- [ ] Create `/frontend/src/components/ui/EmptyState.tsx`
- [ ] Update Maintenance page work orders tab
- [ ] Update Maintenance page PM schedule tab
- [ ] Update Maintenance page deadlines tab
- [ ] Update Personnel page alpha roster
- [ ] Update Custody page
- [ ] Update Fuel page (if applicable)
- [ ] Search for any other empty list patterns and update them
- [ ] Test: Each empty state should show icon + title + subtitle + optional action button

---

## Issue 4: Auto-Refresh After Mutations

### Problem

After creating, updating, or deleting items (e.g., approving a requisition, creating a work order), the page does not automatically refresh to show the new data. Users must manually refresh the page to see changes.

### Solution: Ensure Mutations Invalidate Relevant Query Keys

All pages using TanStack Query must call `queryClient.invalidateQueries()` in the `onSuccess` callback of mutations to trigger automatic refetch.

#### Pattern to Apply Everywhere

**Current (broken) pattern**:
```typescript
const approveMutation = useMutation({
  mutationFn: (id: string) => api.approveRequisition(id),
  // NO onSuccess — data stales immediately
});
```

**Fixed pattern**:
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

const approveMutation = useMutation({
  mutationFn: (id: string) => api.approveRequisition(id),
  onSuccess: () => {
    // Invalidate the requisitions query so it refetches automatically
    queryClient.invalidateQueries({ queryKey: ['requisitions'] });
  },
});
```

### Pages to Fix

#### 1. **Requisitions Page**

File: `frontend/src/pages/RequisitionsPage.tsx`

Find ALL mutations and add `onSuccess` callbacks:

```typescript
const queryClient = useQueryClient();

// Approve mutation
const approveMutation = useMutation({
  mutationFn: (id: string) => api.requisitions.approve(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['requisitions'] });
  },
});

// Deny mutation
const denyMutation = useMutation({
  mutationFn: (id: string) => api.requisitions.deny(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['requisitions'] });
  },
});

// Create mutation
const createMutation = useMutation({
  mutationFn: (data: RequisitionCreateInput) => api.requisitions.create(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['requisitions'] });
    setShowCreateModal(false); // Close modal
  },
});
```

#### 2. **Maintenance Dashboard Page**

File: `frontend/src/pages/MaintenanceDashboardPage.tsx` (or MaintenancePage.tsx)

```typescript
const queryClient = useQueryClient();

// Create work order mutation
const createWorkOrderMutation = useMutation({
  mutationFn: (data: WorkOrderInput) => api.maintenance.createWorkOrder(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
    queryClient.invalidateQueries({ queryKey: ['maintenanceDashboard'] });
    setShowCreateModal(false);
  },
});

// Update work order mutation
const updateWorkOrderMutation = useMutation({
  mutationFn: (data: WorkOrderInput) => api.maintenance.updateWorkOrder(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
  },
});

// Delete work order mutation
const deleteWorkOrderMutation = useMutation({
  mutationFn: (id: string) => api.maintenance.deleteWorkOrder(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['workOrders'] });
  },
});

// Create PM schedule mutation
const createPMMutation = useMutation({
  mutationFn: (data: PMScheduleInput) => api.maintenance.createPMSchedule(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['pmSchedules'] });
    setShowScheduleModal(false);
  },
});
```

#### 3. **Personnel Page**

File: `frontend/src/pages/PersonnelPage.tsx`

```typescript
const queryClient = useQueryClient();

// Add personnel mutation
const addPersonnelMutation = useMutation({
  mutationFn: (data: PersonnelInput) => api.personnel.add(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['personnel'] });
    setShowAddModal(false);
  },
});

// Update personnel mutation
const updatePersonnelMutation = useMutation({
  mutationFn: (data: PersonnelInput) => api.personnel.update(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['personnel'] });
  },
});

// Remove personnel mutation
const removePersonnelMutation = useMutation({
  mutationFn: (id: string) => api.personnel.remove(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['personnel'] });
  },
});
```

#### 4. **Custody Page**

File: `frontend/src/pages/CustodyPage.tsx`

```typescript
const queryClient = useQueryClient();

// Transfer custody mutation
const transferMutation = useMutation({
  mutationFn: (data: TransferInput) => api.custody.transfer(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['custody'] });
    setShowTransferModal(false);
  },
});

// Check in mutation
const checkInMutation = useMutation({
  mutationFn: (id: string) => api.custody.checkIn(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['custody'] });
  },
});

// Check out mutation
const checkOutMutation = useMutation({
  mutationFn: (data: CheckOutInput) => api.custody.checkOut(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['custody'] });
    setShowCheckOutModal(false);
  },
});
```

#### 5. **Fuel Page** (if applicable)

File: `frontend/src/pages/FuelPage.tsx`

```typescript
const queryClient = useQueryClient();

// Create fuel transaction mutation
const createTransactionMutation = useMutation({
  mutationFn: (data: FuelTransactionInput) => api.fuel.createTransaction(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fuel'] });
    queryClient.invalidateQueries({ queryKey: ['fuelInventory'] });
    setShowTransactionModal(false);
  },
});

// Update fuel allocation mutation
const updateAllocationMutation = useMutation({
  mutationFn: (data: FuelAllocationInput) => api.fuel.updateAllocation(data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['fuel'] });
    queryClient.invalidateQueries({ queryKey: ['fuelAllocation'] });
  },
});
```

#### 6. **Any other page with mutations**

Search for all `useMutation` calls:

```bash
grep -r "useMutation" frontend/src/pages --include="*.tsx"
```

For each mutation found, ensure it has an `onSuccess` callback that invalidates the appropriate query key.

### Query Key Convention

Use consistent query key naming:
- `['requisitions']` — for requisition list queries
- `['workOrders']` — for work order list queries
- `['personnel']` — for personnel list queries
- `['custody']` — for custody item list queries
- `['fuel']` — for fuel transaction list queries
- `['pmSchedules']` — for preventive maintenance schedules
- `['maintenanceDashboard']` — for dashboard-specific data
- etc.

Make sure `useQuery` calls use the same key as the mutation invalidation.

### Migration Checklist

- [ ] Find all `useMutation` hooks across all pages
- [ ] Add `onSuccess` callback to each mutation
- [ ] Invalidate the appropriate query key in each `onSuccess`
- [ ] Ensure modal closes (if applicable) in `onSuccess`
- [ ] Test: After create/update/delete, table should automatically refresh without manual page reload
- [ ] Test: Modal should close after successful mutation
- [ ] Verify no stale data appears on screen

---

## Implementation Guidelines

### Code Style

All changes must follow existing patterns:

1. **Inline styles with CSS variables**:
   ```typescript
   style={{
     backgroundColor: 'var(--color-bg)',
     color: 'var(--color-text)',
     borderRadius: 'var(--radius)',
     transition: 'all var(--transition)',
   }}
   ```

2. **Lucide React icons**:
   ```typescript
   import { Heart, Droplet, Shield, FileSearch } from 'lucide-react';
   ```

3. **TypeScript strictly typed**:
   ```typescript
   interface ModalProps {
     title: string;
     onClose: () => void;
     children: React.ReactNode;
     maxWidth?: string;
   }
   ```

4. **React hooks patterns**:
   - Use `useCallback` for event handlers to prevent re-renders
   - Use `useEffect` for side effects (ESC key listener)
   - Use `useQueryClient` from TanStack Query for mutations

### Testing Checklist

**Modal Centering**:
- [ ] Create requisition modal appears centered
- [ ] Route planner modal appears centered
- [ ] Movement detail modal appears centered
- [ ] All modals stay centered when page scrolls
- [ ] Modals close on ESC key
- [ ] Modals close on backdrop click
- [ ] No part of modal is clipped or hidden

**Sidebar Navigation**:
- [ ] Fuel link appears in sidebar after Medical
- [ ] Custody link appears in sidebar after Alerts
- [ ] Audit link appears in sidebar after Custody
- [ ] All three links navigate to correct pages
- [ ] All three pages load without errors

**Empty States**:
- [ ] Work orders tab shows empty state when no orders exist
- [ ] PM schedules tab shows empty state when empty
- [ ] Personnel roster shows empty state when empty
- [ ] Custody page shows empty state when no items
- [ ] Each empty state has icon + title + subtitle
- [ ] Action buttons work correctly (open modals, etc.)

**Auto-Refresh**:
- [ ] Create requisition → list updates automatically
- [ ] Approve requisition → list updates, item status changes
- [ ] Deny requisition → list updates, item removed
- [ ] Create work order → maintenance list updates
- [ ] Transfer custody item → custody list updates
- [ ] No manual page refresh needed after mutations
- [ ] Modals close automatically after successful mutation

### Build & Test Commands

```bash
# Type check
cd frontend && npx tsc -b

# Run tests
npx vitest run

# Dev server (if needed for manual testing)
npm run dev
```

---

## Acceptance Criteria

All fixes must meet these criteria:

1. **Modal Centering**: ALL modals are perfectly centered on screen, not clipped, and stay centered during scroll
2. **Sidebar**: Three new nav links present and functional
3. **Empty States**: Consistent UX guidance when pages have no data; action buttons work
4. **Auto-Refresh**: All mutations automatically refresh their corresponding query lists; modals close on success
5. **No Breaking Changes**: All existing component APIs preserved; refactoring is internal only
6. **Type Safety**: Zero TypeScript errors; `tsc -b` passes
7. **Tests Pass**: `vitest run` completes with no failures
8. **Styling Consistency**: All new components use existing CSS variables and inline style patterns

---

## Files to Create

- `frontend/src/components/ui/Modal.tsx` (NEW)
- `frontend/src/components/ui/EmptyState.tsx` (NEW)

## Files to Modify

**Modal Refactoring**:
- `frontend/src/components/requisitions/CreateRequisitionModal.tsx`
- `frontend/src/components/transportation/RoutePlannerModal.tsx`
- `frontend/src/components/transportation/MovementDetailModal.tsx`
- `frontend/src/components/maintenance/*.tsx` (work order modals)
- Any other modal components (use grep to find all)

**Sidebar Navigation**:
- `frontend/src/components/layout/Sidebar.tsx`

**Empty States**:
- `frontend/src/pages/MaintenancePage.tsx` (or MaintenanceDashboardPage.tsx)
- `frontend/src/pages/PersonnelPage.tsx`
- `frontend/src/pages/CustodyPage.tsx`
- `frontend/src/pages/FuelPage.tsx`
- Any other page with empty table/list states

**Auto-Refresh Mutations**:
- `frontend/src/pages/RequisitionsPage.tsx`
- `frontend/src/pages/MaintenancePage.tsx` (or MaintenanceDashboardPage.tsx)
- `frontend/src/pages/PersonnelPage.tsx`
- `frontend/src/pages/CustodyPage.tsx`
- `frontend/src/pages/FuelPage.tsx`
- Any other page with mutations

---

## Wave Execution (After Feature Development)

### Wave 2: Verification (Parallel)

**Tester**:
```bash
cd frontend && npx tsc -b                    # Type check
npx vitest run                                # Unit tests
```

**DevSecOps**:
```bash
# Check for:
# - No hardcoded secrets in modal/empty state components
# - No XSS vulnerabilities (all user input sanitized)
# - No improper state management (modals don't expose internal state)
# - No CSRF issues (mutations use proper tokens)
```

### Wave 5: Smoke Test

```bash
# Build and start Docker stack
docker compose build
docker compose up -d

# Verify:
# 1. All pages load without errors
# 2. Modals appear centered and functional
# 3. Sidebar nav items work
# 4. Empty states display correctly
# 5. Create/update/delete operations refresh lists automatically
# 6. No ERROR/FATAL in logs

docker compose logs --tail=50
docker compose down
```

---

## Notes for Developers

- **No database changes required** — all fixes are frontend-only
- **No API changes required** — existing endpoints are sufficient
- **Preserve all existing behavior** — this is a UX improvement pass, not a refactor
- **Test each fix independently** — modal centering, sidebar links, empty states, and mutations are separate concerns
- **Use TypeScript strictly** — no `any` types; properly type all props and callbacks
- **Document non-obvious patterns** — add comments for complex modal close logic or query invalidation

---

**End of Prompt**
