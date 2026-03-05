# KEYSTONE: Fix Missing Sidebar Navigation for Fuel, Custody, and Audit Pages

## Objective
Restore user navigation to Fuel, Custody, and Audit pages by adding missing sidebar links. These pages exist in routes but are inaccessible via the sidebar menu.

## Current State
- **App.tsx**: Routes exist for `/fuel`, `/custody`, `/audit` pointing to FuelPage, CustodyPage, AuditPage
- **Sidebar.tsx**: `navItems` array missing entries for these 3 pages
- **Result**: Pages unreachable — users see no menu links

## Changes Required

### Fix 1: Add Navigation Links to Sidebar

**File**: `frontend/src/components/layout/Sidebar.tsx`

**Step 1a: Import Icons**
Add to the imports at the top of the file:
```typescript
import { Fuel, Shield, FileSearch } from 'lucide-react';
```

**Step 1b: Update navItems Array**
Locate the `navItems` array definition. Insert these three entries in the specified order within the array:

```typescript
{ to: '/fuel', icon: Fuel, label: 'FUEL' }           // Insert after MEDICAL
{ to: '/custody', icon: Shield, label: 'CUSTODY' }   // Insert after ALERTS
{ to: '/audit', icon: FileSearch, label: 'AUDIT' }   // Insert after CUSTODY
```

**Final navItems Order** (for reference):
```
1.  Dashboard
2.  Map
3.  Supply
4.  Equipment
5.  Maintenance
6.  Requisitions
7.  Personnel
8.  Readiness
9.  Medical
10. FUEL ← NEW
11. Transportation
12. Ingestion
13. Data Sources
14. Reports
15. Alerts
16. CUSTODY ← NEW
17. AUDIT ← NEW
18. Admin
19. Docs
```

### Fix 2: Verify Fuel Page Data Layer

**File**: `frontend/src/api/fuel.ts`

- [ ] Confirm file exists
- [ ] Verify API functions return data or empty arrays (not 404 errors)
- [ ] Ensure FuelPage.tsx imports and calls these functions correctly
- [ ] Check that the Fuel page displays empty state when no data: "No fuel records found. Check your supply sources."

### Fix 3: Verify Custody Page Data Layer

**File**: `frontend/src/api/custody.ts`

- [ ] Confirm file exists
- [ ] Verify API functions handle empty data gracefully
- [ ] Check CustodyPage.tsx imports and displays empty state: "No sensitive items registered. Click '+ Register Item' to begin tracking."

### Fix 4: Verify Audit Page Data Layer

**File**: `frontend/src/api/audit.ts`

- [ ] Confirm file exists
- [ ] Verify API functions return empty arrays on no data
- [ ] Check AuditPage.tsx displays empty state: "No audit events recorded."

### Fix 5: Test Navigation

After making changes:
1. Start dev server: `cd frontend && npm run dev`
2. Open app in browser (typically `http://localhost:5173` or as configured)
3. Verify sidebar now shows **FUEL**, **CUSTODY**, and **AUDIT** links
4. Click each link and confirm:
   - Page loads without errors
   - Correct page title displays
   - Empty states show gracefully (if no data)
   - No console errors or 404 API calls

## Optional Enhancement: Sidebar Grouping

If sidebar UX is cluttered, consider adding visual section headers. Add to Sidebar styles:

```typescript
// Group headers (optional)
const SectionHeader = ({ label }: { label: string }) => (
  <div className="px-4 py-2 mt-3 text-[9px] uppercase font-bold tracking-[1.5px] text-gray-500 dark:text-gray-600">
    {label}
  </div>
);
```

And reorganize navItems into groups:
- **OPERATIONS**: Dashboard, Map
- **LOGISTICS**: Supply, Equipment, Maintenance, Requisitions, Fuel
- **PERSONNEL**: Personnel, Readiness, Medical
- **MOVEMENT**: Transportation
- **DATA**: Ingestion, Data Sources
- **REPORTING**: Reports, Alerts
- **SECURITY**: Custody, Audit
- **SYSTEM**: Admin, Docs

## Acceptance Criteria
- [ ] Sidebar displays "FUEL", "CUSTODY", "AUDIT" links
- [ ] Links are clickable and navigate without errors
- [ ] All three pages load and render their UI correctly
- [ ] Empty state messages display when no data exists
- [ ] No console errors or broken icon imports
- [ ] TypeScript builds cleanly: `npx tsc -b`
- [ ] Frontend tests pass: `npx vitest run`

## Files to Modify
- `frontend/src/components/layout/Sidebar.tsx` (PRIMARY)
- `frontend/src/api/fuel.ts` (VERIFY)
- `frontend/src/api/custody.ts` (VERIFY)
- `frontend/src/api/audit.ts` (VERIFY)
- `frontend/src/pages/FuelPage.tsx` (VERIFY)
- `frontend/src/pages/CustodyPage.tsx` (VERIFY)
- `frontend/src/pages/AuditPage.tsx` (VERIFY)

## Context
KEYSTONE is a USMC logistics intelligence system tracking supply, equipment, fuel, personnel, and audit events. Fuel, Custody, and Audit are critical tracking pages for logistics accountability and compliance. Making them visible in navigation is essential for user workflow.
