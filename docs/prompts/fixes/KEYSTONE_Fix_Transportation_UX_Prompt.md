# KEYSTONE Transportation UX Enhancement: Item Selection & Manifest Management

**Date**: 2026-03-05
**System**: KEYSTONE (USMC Logistics Intelligence)
**Module**: Transportation & Movement Planning
**Objective**: Enhance origin item selection UX with modal-based item addition, searchable/paginated inventory lists, and manifest management

---

## Context

### Current State

The Transportation module (`TransportationPage.tsx`) has a 4-tab interface:
1. ACTIVE CONVOYS — Real-time convoy tracking
2. CONVOY PLANNING — Plan creation, approval, execution
3. LIFT REQUESTS — Supply/equipment lift requests
4. MOVEMENT HISTORY — Historical movement records

When planning a convoy in the CONVOY PLANNING tab, users select an origin location (via `RoutePlannerModal`). The system displays available equipment, supplies, and personnel at that location. Currently, this list is static and non-interactive.

### User Feedback

Users want to:
1. Click on any available item at the origin
2. See a modal to select quantity, priority, special handling
3. Add items to the convoy's cargo manifest
4. Manage inventory efficiently when locations have thousands of items via search and pagination

### Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand, TanStack Query/Table, Lucide React
- **Backend**: Python/FastAPI, SQLAlchemy async, PostgreSQL
- **Modal pattern**: Centered, fixed position, overlay (see `MovementDetailModal.tsx`, `CreateRequisitionModal.tsx`)
- **Table pattern**: TanStack Table v8, paginated, sortable columns, row selection

---

## Implementation Scope

### Enhancement 1: Item Selection Modal (`AddToManifestModal.tsx`)

When a user clicks an available item from the origin inventory list, a modal opens with:

**Header**
- Title: "Add Item to Manifest"
- Close button (X) at top-right

**Form Fields**
- **Item Name** (read-only, pre-filled)
  - Format: `NOMENCLATURE (TAMCN/NSN)`
  - Example: "M240B Machine Gun (1005-01-234-5678)"

- **Category** (read-only, pre-filled)
  - Examples: VEHICLES, WEAPONS, COMMS, SUPPLY, AMMO, EQUIPMENT, PERSONNEL, OTHER

- **Available Quantity** (read-only label + display)
  - Show max available at the origin
  - Format: "Up to {max_qty} available"

- **Quantity Selector** (required, number input with +/- buttons)
  - Minimum: 1
  - Maximum: available quantity
  - Buttons: `−` (decrement) | [input field] | `+` (increment)
  - Width: ~80px for input

- **Priority** (dropdown, required)
  - Options: ROUTINE, PRIORITY, URGENT, FLASH
  - Default: ROUTINE
  - Visual indicator: color-coded per priority level

- **Special Handling Notes** (optional textarea)
  - Placeholder: "e.g., Fragile, HAZMAT, Oversized, Refrigerated, NOM, etc."
  - Rows: 3
  - Character limit: 500

**Buttons**
- **"Add to Manifest"** (primary, green/accent) — Validates and closes, adds to manifest
- **"Cancel"** (secondary, gray) — Closes without adding

**Styling**
- Modal: centered, fixed overlay (z-index 1000), 90% width max 600px
- Form labels: monospace, bold, small (10px)
- Input fields: transparent background with bottom border, Tailwind focus ring
- Buttons: consistent with existing modals (see `MovementDetailModal.tsx`)

**Data Structure** (pass to component)
```typescript
interface AddToManifestModalProps {
  isOpen: boolean;
  item: LocationInventoryItem | null;  // null when closed
  onClose: () => void;
  onAddToManifest: (entry: ManifestEntry) => void;  // Add to parent's manifest state
}

interface LocationInventoryItem {
  item_id: string;
  item_type: 'equipment' | 'supply' | 'personnel';
  nomenclature: string;
  tamcn?: string;
  nsn?: string;
  category: string;  // VEHICLES, WEAPONS, SUPPLY, etc.
  available_qty: number;
  weight_lbs?: number;
  status: string;  // SERVICEABLE, NMC, etc.
}

interface ManifestEntry {
  item_id: string;
  nomenclature: string;
  category: string;
  quantity: number;
  priority: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'FLASH';
  special_handling?: string;
  weight_lbs?: number;  // calculated: item.weight_lbs * quantity
  added_at: Date;
}
```

---

### Enhancement 2: Searchable & Paginated Origin Inventory (`OriginInventoryTable.tsx`)

Replace the static inventory display with a fully interactive, TanStack Table-based component.

**Search Bar** (top of component)
- Placeholder: "Search by nomenclature, TAMCN, NSN, or common name..."
- Icon: Search (Lucide)
- Debounce: 300ms
- Clears column filters and pagination when search changes

**Category Tabs/Filter** (below search bar)
- Buttons: `ALL | VEHICLES | WEAPONS | COMMS | SUPPLY | AMMO | EQUIPMENT | PERSONNEL | OTHER`
- Active tab: accent color border-bottom
- Clicking a tab filters results

**Paginated Table** (TanStack Table)

Columns:
1. **Item** — Nomenclature with optional icon/visual indicator
   - Sortable: Yes
   - Example: "M240B Machine Gun"

2. **TAMCN/NSN** — Concatenated display
   - Sortable: Yes
   - Example: "1005-01-234-5678"

3. **Category** — Item category
   - Sortable: Yes
   - Example: "WEAPONS"

4. **Available Qty** — Current quantity at origin
   - Sortable: Yes (numeric)
   - Right-aligned
   - Example: "24"

5. **Status** — Item condition badge
   - Sortable: Yes
   - Color-coded (SERVICEABLE=green, NMC=red, AWAITING_REPAIR=yellow)
   - Example: "SERVICEABLE"

**Table Behavior**
- Rows: clickable (full row), opens `AddToManifestModal`
- Row hover: subtle background highlight
- Pagination: 25 items per page, with previous/next buttons and page indicator
- Example indicator: "Showing 1–25 of 847 items"

**Pagination Controls** (bottom of table)
- `< Previous` button (disabled on page 1)
- Page input: "Page {current} of {total}"
- `Next >` button (disabled on last page)
- Optional: "Go to page" input field

**Load State**
- While fetching: show skeleton table rows (6 rows) or spinner
- Empty state: "No items found. Try adjusting search or filters."

**Data Flow**
- On mount: fetch location inventory with `limit=25&offset=0`
- On search: debounce 300ms, call API with `q={searchTerm}&limit=25&offset=0`
- On category filter: call API with `category={category}&limit=25&offset=0`
- On page change: call API with `limit=25&offset=(page-1)*25`
- Combine filters: `?q={searchTerm}&category={category}&limit=25&offset={offset}`

---

### Enhancement 3: Cargo Manifest Summary (`ManifestSummary.tsx`)

Display all items added to the convoy's manifest in a compact, editable table below the inventory list.

**Header**
- Title: "CARGO MANIFEST"
- Subtitle: "Items scheduled for transport"

**Summary Metrics** (above or beside table)
- Total Items: {count}
- Total Weight: {weight_lbs} lbs
- Total Cube/Volume: {cube_ft} ft³ (if available)
- Running total should update in real-time as items are added/removed

**Manifest Table**

Columns:
1. **Item** — Nomenclature (left-aligned)
2. **Qty** — Quantity selected (right-aligned, numeric)
3. **Weight** — Total weight for this line item (right-aligned)
   - Calculated: `weight_lbs * qty`
   - Format: "{weight} lbs"
4. **Priority** — Color-coded badge
5. **Handling** — Special notes (truncated if long, tooltip on hover)
6. **Edit** — Button to reopen modal with current values
7. **Remove** — X button to delete from manifest

**Row Styling**
- Alternating row colors (light/dark)
- Hover: subtle highlight
- Conditional warnings:
  - If priority is URGENT/FLASH: row border left accent color
  - If special handling includes HAZMAT: background tint

**Empty State**
- "No items added yet. Click on inventory items above to add to manifest."

**Delete Confirmation**
- Optional: small confirmation toast or simple confirm-before-delete

---

### Enhancement 4: Vehicle Load Planning Check (`VehicleLoadCheck.tsx`)

After manifest is built, show a warning if cargo exceeds vehicle capacity.

**Display** (in ConvoyPlanDetail, below manifest)

```
VEHICLE LOAD ANALYSIS
─────────────────────────────────────────
Total Manifest Weight:     12,400 lbs
Selected Vehicles:         8 HMMWVs + 2 MTVRs
Total Capacity:            45,000 lbs
Load Utilization:          27.6%

✓ WITHIN CAPACITY
```

**Warning** (if over capacity)

```
⚠ CARGO EXCEEDS VEHICLE CAPACITY
──────────────────────────────────
Total Manifest:    52,000 lbs
Available Capacity: 45,000 lbs
Excess:            7,000 lbs

Action: Add more vehicles or reduce cargo
```

---

### Enhancement 5: Backend API Endpoints

Ensure these endpoints exist in the Python/FastAPI backend:

#### GET `/api/v1/transportation/location-inventory`

**Query Parameters**
- `location` (string, required) — origin location identifier
- `q` (string, optional) — search term (nomenclature, TAMCN, NSN, common name)
- `category` (string, optional) — filter by category (VEHICLES, WEAPONS, SUPPLY, etc.)
- `limit` (int, default: 25) — pagination limit
- `offset` (int, default: 0) — pagination offset

**Response** (200 OK)
```json
{
  "data": [
    {
      "item_id": "eq-001-m240b",
      "item_type": "equipment",
      "nomenclature": "M240B Machine Gun",
      "tamcn": "1005-01-234-5678",
      "nsn": "1005-01-234-5678",
      "category": "WEAPONS",
      "available_qty": 24,
      "weight_lbs": 27.5,
      "status": "SERVICEABLE",
      "common_name": "Ma Deuce"
    },
    {
      "item_id": "sup-001-water",
      "item_type": "supply",
      "nomenclature": "Potable Water, Bottled",
      "tamcn": "8465-00-000-0001",
      "nsn": "8465-00-000-0001",
      "category": "SUPPLY",
      "available_qty": 150,
      "weight_lbs": 0.5,
      "status": "SERVICEABLE",
      "common_name": "Water bottle"
    }
  ],
  "total_count": 847,
  "limit": 25,
  "offset": 0
}
```

#### PUT `/api/v1/transportation/plans/{plan_id}/manifest`

**Request Body**
```json
{
  "manifest_entries": [
    {
      "item_id": "eq-001-m240b",
      "quantity": 4,
      "priority": "PRIORITY",
      "special_handling": "Fragile - inspection required"
    },
    {
      "item_id": "sup-001-water",
      "quantity": 50,
      "priority": "ROUTINE",
      "special_handling": null
    }
  ]
}
```

**Response** (200 OK)
```json
{
  "plan_id": 1,
  "manifest_entries": [
    {
      "entry_id": "me-001",
      "item_id": "eq-001-m240b",
      "nomenclature": "M240B Machine Gun",
      "quantity": 4,
      "priority": "PRIORITY",
      "special_handling": "Fragile - inspection required",
      "weight_lbs": 110.0,
      "category": "WEAPONS"
    }
  ],
  "total_weight_lbs": 110.0,
  "total_items": 4
}
```

#### GET `/api/v1/transportation/plans/{plan_id}/manifest`

**Response** (200 OK)
```json
{
  "plan_id": 1,
  "manifest_entries": [
    {
      "entry_id": "me-001",
      "item_id": "eq-001-m240b",
      "nomenclature": "M240B Machine Gun",
      "quantity": 4,
      "priority": "PRIORITY",
      "special_handling": "Fragile - inspection required",
      "weight_lbs": 110.0,
      "category": "WEAPONS",
      "added_at": "2026-03-05T14:30:00Z"
    }
  ],
  "summary": {
    "total_items": 4,
    "total_weight_lbs": 110.0,
    "total_cube_ft": 8.5
  }
}
```

---

## Integration Points

### 1. Modify `ConvoyPlanDetail.tsx`

When the user is viewing a plan in the detail view:

```typescript
// Add state to track manifest
const [manifest, setManifest] = useState<ManifestEntry[]>([]);
const [selectedOrigin, setSelectedOrigin] = useState<string | null>(null);

// Load manifest on mount
useEffect(() => {
  if (plan) {
    getManifest(plan.id).then(setManifest);
  }
}, [plan]);

// When user opens RoutePlannerModal and selects an origin
const handleOriginSelected = (originLocation: string) => {
  setSelectedOrigin(originLocation);
};

// Render OriginInventoryTable after origin is selected
{selectedOrigin && (
  <OriginInventoryTable
    location={selectedOrigin}
    onItemClick={(item) => {
      // Open AddToManifestModal
      setSelectedItem(item);
      setAddToManifestOpen(true);
    }}
  />
)}

// Render ManifestSummary
<ManifestSummary
  entries={manifest}
  onEdit={(entryId) => {
    // Reopen AddToManifestModal with current values
  }}
  onRemove={(entryId) => {
    setManifest(manifest.filter(e => e.item_id !== entryId));
  }}
/>

// On save/submit convoy plan
const handleSavePlan = async () => {
  await updateConvoyPlan(plan.id, { /* plan data */ });
  await updateManifest(plan.id, manifest);
};
```

### 2. Add Components to Transportation Module

Create these new files in `/keystone/frontend/src/components/transportation/`:

- `AddToManifestModal.tsx` — Item selection modal
- `OriginInventoryTable.tsx` — Searchable/paginated inventory
- `ManifestSummary.tsx` — Manifest display & management
- `VehicleLoadCheck.tsx` — Vehicle capacity analysis (optional, if needed)

### 3. Update Types in `/lib/types.ts`

Add/extend types:
```typescript
export interface LocationInventoryItem {
  item_id: string;
  item_type: 'equipment' | 'supply' | 'personnel';
  nomenclature: string;
  tamcn?: string;
  nsn?: string;
  category: string;
  available_qty: number;
  weight_lbs?: number;
  status: string;
  common_name?: string;
}

export interface ManifestEntry {
  item_id: string;
  entry_id?: string;
  nomenclature: string;
  category: string;
  quantity: number;
  priority: 'ROUTINE' | 'PRIORITY' | 'URGENT' | 'FLASH';
  special_handling?: string;
  weight_lbs?: number;
  added_at?: Date;
}

export interface ManifestSummary {
  total_items: number;
  total_weight_lbs: number;
  total_cube_ft?: number;
}
```

### 4. Add API Functions to `/frontend/src/api/transportation.ts`

```typescript
export async function getLocationInventory(
  location: string,
  query?: { q?: string; category?: string; limit?: number; offset?: number }
): Promise<{ data: LocationInventoryItem[]; total_count: number }> {
  // ...
}

export async function updateManifest(
  planId: number,
  entries: ManifestEntry[]
): Promise<{ data: ManifestEntry[] }> {
  // ...
}

export async function getManifest(planId: number): Promise<ManifestEntry[]> {
  // ...
}
```

---

## Code Patterns to Follow

### Modal Structure (from `MovementDetailModal.tsx`)

```tsx
export default function AddToManifestModal({ isOpen, item, onClose, onAddToManifest }: Props) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1000">
      <div
        className="bg-gray-900 rounded-lg border border-gray-700 p-6 w-[90%] max-w-[600px] max-h-[80vh] overflow-auto"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white">Add Item to Manifest</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form fields */}
        <form onSubmit={handleSubmit}>
          {/* ... form content ... */}
        </form>
      </div>
    </div>
  );
}
```

### TanStack Table Structure (from existing tables)

```tsx
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, columnHelper } from '@tanstack/react-table';

const columns = [
  columnHelper.accessor('nomenclature', {
    header: 'Item',
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('available_qty', {
    header: 'Available Qty',
    cell: (info) => info.getValue().toLocaleString(),
    sortingFn: 'auto',
  }),
  // ...
];

const table = useReactTable({
  data,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  state: { pagination: { pageIndex, pageSize: 25 }, sorting },
  onSortingChange: setSorting,
  onPaginationChange: setPagination,
});
```

### Badge/Label Styles (for priority, status)

```tsx
const priorityColors = {
  ROUTINE: 'var(--color-text-muted)',
  PRIORITY: 'var(--color-warning)',
  URGENT: 'var(--color-danger)',
  FLASH: 'var(--color-accent-dark-red)',
};

const badge = (color: string) => ({
  fontFamily: 'var(--font-mono)',
  fontSize: '9px',
  fontWeight: 600,
  letterSpacing: '0.5px',
  padding: '2px 8px',
  borderRadius: 2,
  border: `1px solid ${color}`,
  color,
  backgroundColor: `${color}15`,
  whiteSpace: 'nowrap' as const,
});
```

---

## Acceptance Criteria

### Feature 1: Item Selection Modal
- [ ] Modal opens when user clicks an item in the origin inventory
- [ ] Item name, TAMCN/NSN, category are pre-filled and read-only
- [ ] Quantity selector has +/- buttons and enforces min/max bounds
- [ ] Priority dropdown works with 4 options (ROUTINE, PRIORITY, URGENT, FLASH)
- [ ] Special handling textarea is optional and limited to 500 chars
- [ ] "Add to Manifest" button validates and closes, calls parent callback with ManifestEntry
- [ ] "Cancel" button closes without adding
- [ ] Modal is centered, fixed, with appropriate z-index

### Feature 2: Searchable & Paginated Inventory
- [ ] Search bar debounces 300ms and filters on nomenclature/TAMCN/NSN
- [ ] Category tabs filter results dynamically
- [ ] TanStack Table renders 25 items per page
- [ ] Columns are sortable (click header to toggle asc/desc)
- [ ] Rows are clickable and open AddToManifestModal
- [ ] Pagination controls work (Previous/Next, page indicator)
- [ ] API calls include `limit`, `offset`, `q`, `category` params as needed
- [ ] Empty state message displays when no results
- [ ] Loading skeleton or spinner shows while fetching

### Feature 3: Cargo Manifest
- [ ] ManifestSummary table displays all added items
- [ ] Columns show: Item, Qty, Weight, Priority, Handling, Edit, Remove
- [ ] Running totals update in real-time (total items, weight, cube)
- [ ] Edit button reopens modal with current entry values
- [ ] Remove button deletes item from manifest
- [ ] Empty state message when no items in manifest

### Feature 4: Vehicle Load Planning (Optional)
- [ ] VehicleLoadCheck compares manifest weight to vehicle capacity
- [ ] Shows utilization percentage
- [ ] Displays warning if over capacity
- [ ] Suggests adding more vehicles or reducing cargo

### Feature 5: Backend Integration
- [ ] GET `/api/v1/transportation/location-inventory` returns paginated results with filters
- [ ] PUT `/api/v1/transportation/plans/{plan_id}/manifest` persists manifest entries
- [ ] GET `/api/v1/transportation/plans/{plan_id}/manifest` retrieves saved manifest

### Quality Gates
- [ ] TypeScript strict mode: no errors or warnings
- [ ] All new components have full prop interface documentation
- [ ] Existing ConvoyPlanDetail integration is non-breaking
- [ ] Modal, table, and form styles match KEYSTONE design system
- [ ] All interactive elements are keyboard accessible (Tab, Enter, Escape)
- [ ] Modals close on Escape key press
- [ ] Component unit tests cover happy path + edge cases (empty data, max quantity, etc.)
- [ ] No console errors or warnings
- [ ] Performance: search debounce prevents excessive re-renders
- [ ] Pagination works smoothly with large datasets (1000+ items)

---

## Reference Files

- `/keystone/frontend/src/pages/TransportationPage.tsx` — Main transportation page
- `/keystone/frontend/src/components/transportation/ConvoyPlanDetail.tsx` — Detail view (integration point)
- `/keystone/frontend/src/components/transportation/RoutePlannerModal.tsx` — Route selection modal
- `/keystone/frontend/src/components/transportation/MovementDetailModal.tsx` — Modal pattern reference
- `/keystone/frontend/src/components/requisitions/CreateRequisitionModal.tsx` — Form modal pattern
- `/keystone/frontend/src/api/transportation.ts` — API functions
- `/keystone/frontend/src/lib/types.ts` — TypeScript types

---

## Notes

- The search bar should be debounced at 300ms to avoid excessive API calls
- Consider caching location inventory results in React Query to improve UX
- The manifest should be stored in component state until the convoy plan is formally saved
- If integrating with a real database, ensure proper indices on `nomenclature`, `tamcn`, `nsn`, and `category` columns for fast search
- Consider adding a "quick add" feature: pre-set default quantities (e.g., "+5", "+10") for rapid manifest building
- Validation: ensure quantity does not exceed available inventory at the origin
- For HAZMAT items, consider requiring additional confirmation or flag them visually
- Use React hooks (`useCallback`, `useMemo`) to optimize re-renders in large tables
- Follow EMS-COP/KEYSTONE patterns for error handling and user feedback (toasts, inline errors)
