# KEYSTONE Personnel & Billets CRUD Management

**Project**: USMC Logistics Intelligence System (KEYSTONE)
**Date**: 2026-03-05
**Scope**: Add full CRUD management UI for Personnel and Billets + seed realistic data

---

## Current State

**Frontend**:
- Stack: React 18, TypeScript, Tailwind CSS, Zustand, TanStack Query/Table, Vite
- PersonnelPage.tsx (5 tabs): ALPHA ROSTER, STRENGTH, BILLETS, QUALIFICATIONS, EAS TIMELINE
- Components: AlphaRosterTable, StrengthPanel, BilletTracker, QualificationMatrix, EASTimeline
- API Client: `/keystone/frontend/src/api/personnel.ts`

**Backend**:
- Stack: Python/FastAPI, SQLAlchemy async, PostgreSQL
- Personnel model: ~40 fields (edipi, names, rank, unit_id, mos, fitness data, quals, security clearance, etc.)
- BilletStructure model: unit_id, billet_id_code, mos_required, rank_required, billet_title, is_key_billet, is_filled, filled_by FK
- Qualification model: personnel_id, qualification_type, name, date_achieved, expiration_date, is_current
- Routes: `/keystone/backend/app/api/personnel.py` + `/keystone/backend/app/api/manning.py`

**Known Issues**:
- Alpha roster shows empty (no seeded personnel)
- Billets tab shows all zeros
- No CRUD UI for adding/editing Marines
- No way to assign Marines to billets
- Missing qualification management UI

---

## Requirements

### 1. Personnel Management CRUD UI

**Task 1.1: Add Personnel Modal Component**

File: `/keystone/frontend/src/components/personnel/AddEditPersonnelModal.tsx`

Create a reusable modal that:
- Opens from a `+ ADD MARINE` button in the AlphaRosterTable header
- Form has 4 collapsible sections:
  ```
  BASIC INFO (always expanded)
  - EDIPI (required, unique, pattern: \d{10})
  - First Name (required)
  - Last Name (required)
  - Rank (required, dropdown: PFC, LCpl, Cpl, Sgt, SSgt, GySgt, MSgt, 1stSgt, MGySgt)
  - Pay Grade (required, dropdown: E1-E9, W1-W5, O1-O10)
  - MOS (required, text, e.g., "0311", "0341")
  - Unit (required, unit selector dropdown)

  SERVICE (collapsible)
  - Date of Rank (date picker)
  - EAS Date (date picker)
  - Duty Status (dropdown: PRESENT, UA, AWOL, LIMDU, PTAD)
  - Status (dropdown: ACTIVE, DEPLOYED, TDY, LEAVE, MEDICAL, INACTIVE)
  - Security Clearance (dropdown: NONE, CONFIDENTIAL, SECRET, TOP_SECRET, TS_SCI)
  - Clearance Expiry (date picker)

  FITNESS & QUALIFICATIONS (collapsible)
  - PFT Score (number: 0-300)
  - PFT Date (date picker)
  - CFT Score (number: 0-300)
  - CFT Date (date picker)
  - Rifle Qual (dropdown: EXPERT, SHARPSHOOTER, MARKSMAN, UNQUAL)
  - Rifle Qual Date (date picker)
  - Swim Qual (dropdown: CWS1, CWS2, CWS3, CWS4, UNQUAL)
  - PME Complete (checkbox)

  ADDITIONAL (collapsible)
  - Blood Type (text: "O+", "A-", etc.)
  - Additional MOS (text, optional)
  - Assigned Billet (text, optional, or billet selector)
  - Notes (textarea)
  ```

- Form validation:
  - EDIPI: required, unique (check via API GET `/personnel` first), 10 digits
  - First Name, Last Name: required, min 2 chars
  - Rank, Pay Grade, MOS, Unit: required
  - Dates: ISO format, sensible ranges (DON < DOG < EAOS)

- Style:
  - Position: fixed, centered, scrollable body
  - Modal wrapper pattern (match existing Card component style)
  - Use var(--font-mono) for EDIPI field
  - Use Tailwind classes (bg-white, border, shadow-lg, rounded-lg)
  - Buttons: Cancel (ghost), Submit (primary blue)

- Form submission:
  - On Create: POST to `/api/v1/personnel` with Personnel schema
  - On Edit: PUT to `/api/v1/personnel/{id}`
  - After success: `queryClient.invalidateQueries({ queryKey: ['personnel-list'] })`
  - Show success toast, close modal
  - On error: show error message, don't close

**Task 1.2: Update AlphaRosterTable**

File: `/keystone/frontend/src/components/personnel/AlphaRosterTable.tsx`

Modify existing table to:
- Add header button: `<button className="...">+ ADD MARINE</button>` → opens AddEditPersonnelModal
- Add row click handler: clicking a Marine opens the modal in EDIT mode with pre-filled data
- Add "Edit" column action button (pencil icon) → same EDIT modal
- Add "Delete" column action (trash icon) → confirm dialog → DELETE `/api/v1/personnel/{id}` → invalidate query
- Display columns: EDIPI, Name, Rank, MOS, Unit, Status, Billet, PFT Score, Rifle Qual, EAS Date

**Task 1.3: Add Marine Detail Side Panel**

File: `/keystone/frontend/src/components/personnel/MarineDetailPanel.tsx`

When user clicks a Marine name in the roster:
- Show a side panel (fixed right, 400px wide, scrollable, overlay backdrop)
- Display all Personnel fields organized by section (Basic, Service, Fitness, Weapons, Qualifications)
- Action buttons: Edit (pencil), Close (X)
- Qualifications section: list existing Qualifications with Remove button, + Add Qualification button
- Weapons section (if API available): list weapons with specs
- Assignment history (optional): show which billets this Marine has held

---

### 2. Billet Management CRUD UI

**Task 2.1: Add Billet Modal**

File: `/keystone/frontend/src/components/personnel/AddEditBilletModal.tsx`

Create modal for billet CRUD:
- Opens from `+ ADD BILLET` button in BilletTracker header
- Form fields:
  ```
  - Unit (required, unit selector, read-only on edit)
  - Billet ID Code (required, text, e.g., "BN-CMD-001")
  - Billet Title (required, text, e.g., "Battalion Commander")
  - MOS Required (required, text, e.g., "0302")
  - Rank Required (required, dropdown)
  - Is Key Billet (checkbox)
  ```

- Validation:
  - All required fields must be filled
  - Billet ID Code must be unique (check via API)
  - Rank Required must be valid USMC rank

- Submission:
  - On Create: POST to `/api/v1/manning/billets`
  - On Edit: PUT to `/api/v1/manning/billets/{id}`
  - After success: invalidate `['manning-billets']` query
  - Show success toast

**Task 2.2: Update BilletTracker**

File: `/keystone/frontend/src/components/personnel/BilletTracker.tsx`

Enhance existing tracker to:
- Add header button: `+ ADD BILLET` → opens AddEditBilletModal
- Display table: Billet Code, Title, MOS Required, Rank Required, Is Key?, Status (Filled/Vacant)
- For each unfilled billet, add action button:
  - **Assign**: opens a modal to select a Marine from the unit
    - Searchable dropdown of unit personnel (name + EDIPI)
    - Filter by MOS match, Rank match (optional validation)
    - On select: PUT `/api/v1/manning/billets/{id}` with `{ filled_by_id: <personnel_id> }`
    - Invalidate query, show success toast

- For each filled billet, show:
  - Assigned Marine's name (link to detail panel)
  - **Unassign** button: confirms → PUT `/api/v1/manning/billets/{id}` with `{ filled_by_id: null }`
  - **Edit** button (pencil) → opens AddEditBilletModal in EDIT mode
  - **Delete** button (trash) → confirm → DELETE `/api/v1/manning/billets/{id}`

**Task 2.3: Bulk Billet Import (Optional)**

File: `/keystone/frontend/src/components/personnel/BilletImportModal.tsx` (if time permits)

- Button in BilletTracker: "Import Billets"
- Modal with textarea or file upload
- Parse CSV: `billet_id_code,billet_title,mos_required,rank_required,is_key_billet`
- Validate each row (uniqueness, required fields)
- Batch POST or PUT to create/update
- Show results: N created, M skipped (duplicates), X errors

---

### 3. Qualification Management UI

**Task 3.1: Add Qualification Modal**

File: `/keystone/frontend/src/components/personnel/AddEditQualificationModal.tsx`

- Opens from:
  - "Add Qualification" button in Marine Detail Panel (scoped to current personnel_id)
  - Qualifications tab (with personnel selector)

- Form fields:
  ```
  - Personnel (if not scoped, required dropdown/search)
  - Qualification Type (required, dropdown: "Rifle", "Swim", "PFT", "CFT", "PME", "Other")
  - Qualification Name (required, text, e.g., "Expert Rifleman", "CWS1")
  - Date Achieved (required, date picker)
  - Expiration Date (optional, date picker)
  - Is Current (checkbox, defaults true)
  ```

- Submission:
  - Create: POST `/api/v1/personnel/qualifications`
  - Update: PUT `/api/v1/personnel/qualifications/{id}`
  - Invalidate `['personnel-qualifications']` query

**Task 3.2: Qualifications Tab Enhancement**

File: `/keystone/frontend/src/pages/PersonnelPage.tsx`

- Ensure QualificationMatrix component:
  - Shows qualifications for all Marines in the unit
  - Has "Add" and "Edit" action buttons per row
  - Supports filtering by type, expiration status (expired, expiring soon)
  - (Or create new QualificationsTab component if QualificationMatrix is not suitable)

---

### 4. Backend API Completeness Check

**Task 4.1: Verify Personnel Endpoints**

File: `/keystone/backend/app/api/personnel.py`

Ensure these endpoints exist and work correctly:

```python
# GET /api/v1/personnel?unit_id=X — list Marines (✓ exists)
# GET /api/v1/personnel/{id} — get single Marine (may need to add)
# POST /api/v1/personnel — create Marine
#   Requires: PersonnelCreate schema with all fields
#   Validation: edipi unique, names not empty, rank not null
#   Returns: PersonnelResponse (201)
#   Check: WRITE_ROLES auth (ADMIN, COMMANDER, S3, S4)

# PUT /api/v1/personnel/{id} — update Marine
#   Partial update: PersonnelUpdate schema (all fields optional)
#   Returns: PersonnelResponse (200)
#   Check: unit_id access control, permission for update

# DELETE /api/v1/personnel/{id} — deactivate Marine (soft delete)
#   Set status=INACTIVE instead of hard delete
#   Returns: 204 No Content
#   Check: permission check, can only soft-delete active personnel
```

Add any missing endpoints. Verify schemas in `/keystone/backend/app/schemas/personnel.py`.

**Task 4.2: Verify Manning/Billet Endpoints**

File: `/keystone/backend/app/api/manning.py`

Ensure these endpoints exist and work:

```python
# GET /api/v1/manning/billets/{unit_id} — list billets (✓ exists)
# POST /api/v1/manning/billets — create billet (✓ exists)
#   Fields: unit_id, billet_id_code, billet_title, mos_required, rank_required, is_key_billet
#   Validation: billet_id_code unique, all required fields filled
#   Returns: BilletStructureResponse (201)

# PUT /api/v1/manning/billets/{id} — update or assign billet (✓ exists)
#   Supports: billet_title, mos_required, rank_required, is_key_billet, filled_by_id
#   Auto-set is_filled based on filled_by_id
#   Returns: BilletStructureResponse (200)

# DELETE /api/v1/manning/billets/{id} — remove billet (✓ exists)
#   Returns: 204 No Content
```

**Task 4.3: Verify Qualification Endpoints**

File: `/keystone/backend/app/api/personnel.py` (qualification routes section)

Check for:

```python
# POST /api/v1/personnel/qualifications — create qualification
#   Body: { personnel_id, qualification_type, qualification_name, date_achieved, expiration_date, is_current }
#   Returns: QualificationResponse (201)

# PUT /api/v1/personnel/qualifications/{id} — update qualification
#   Body: partial fields
#   Returns: QualificationResponse (200)

# DELETE /api/v1/personnel/qualifications/{id} — remove qualification
#   Returns: 204 No Content

# GET /api/v1/personnel/{id}/qualifications — list by personnel
#   Returns: List[QualificationResponse]
```

If missing, add these endpoints following the patterns in personnel.py.

---

### 5. Seed Data — Personnel & Billets

**Task 5.1: Create Personnel Seed Script**

File: `/keystone/backend/seed/seed_personnel.py`

Create idempotent seed function that populates a battalion (e.g., unit_id=4, "1/1 Bn") with realistic Marines:

```python
async def seed_personnel(db: AsyncSession) -> int:
    """Seed 25-30 Marines across ranks with realistic data.

    Idempotent: checks edipi uniqueness before inserting each record.
    """
    # Get battalion unit (unit_id=4 or first BN unit)
    # Seed personnel across ranks:
    #   Officers: 1 LtCol (BN CDR), 1 Maj (XO/S3), 2 Capt (Co Cmds), 2 1stLt (Plt Cdrs), 2 2ndLt (asst plt cdrs)
    #   NCOs: 1 SgtMaj (BN SGTMAJ), 4 GySgt, 8 SSgt (PLT SGT, squad ldrs), 12 Sgt/Cpl/LCpl

    # For each Marine, provide:
    - edipi: unique 10-digit string
    - first_name, last_name: realistic names
    - rank: appropriate for billet
    - pay_grade: corresponding to rank (E5=Sgt, E6=SSgt, E7=GySgt, E9=SgtMaj, O3=Capt, O5=LtCol, etc.)
    - mos: varied (0311, 0331, 0341, 0351, 0352, 0811, 0861, 3531, 0621, 0629)
    - unit_id: 4 (battalion)
    - date_of_rank: varies, realistic DoR dates
    - eaos: varies (some soon: 6-12 months, some far: 3-5 years)
    - pft_score: realistic range 200-300, mostly 250-290
    - pft_date: recent (within 6 months)
    - cft_score: realistic range 200-300, mostly 250-280
    - cft_date: recent
    - rifle_qual: mix of EXPERT (50%), SHARPSHOOTER (35%), MARKSMAN (15%), UNQUAL (5%)
    - rifle_qual_date: recent
    - swim_qual: mostly CWS1/CWS2, some unqualified
    - security_clearance: mostly SECRET, some CONFIDENTIAL, 2-3 TOP_SECRET for leadership
    - blood_type: realistic (O+, O-, A+, A-, B+, B-, AB+, AB-)
    - status: mostly ACTIVE, 1-2 DEPLOYED or LEAVE
    - duty_status: mostly PRESENT, 1-2 LIMDU
    - billet: assign some to billets (e.g., BN CDR, XO, CO CDR, PLT SGT, etc.)
    - drivers_license_military: true for vehicle-crewed roles
```

**Example Marines to seed** (adjust as needed):

```
1. EDIPI: 1234567890, James Richardson, LtCol, O5, 0302, BN CDR, Date of Rank: 2023-06-01, EAOS: 2028-06-01
2. EDIPI: 1234567891, Michael Torres, Maj, O4, 0302, XO, Date of Rank: 2024-08-01, EAOS: 2027-08-01
3. EDIPI: 1234567892, Robert Jenkins, SgtMaj, E9, 0369, BN SGTMAJ, Date of Rank: 2022-01-01, EAOS: 2027-01-01
4. EDIPI: 1234567893, David Nguyen, Capt, O3, 0302, ALPHA CO CDR, Date of Rank: 2024-02-01, EAOS: 2026-06-15 (soon!)
5. EDIPI: 1234567894, Kevin Martinez, Capt, O3, 0802, BRAVO CO CDR, Date of Rank: 2024-04-01, EAOS: 2027-04-01
... (20+ more with varied MOS, varied fitness, some billets assigned, some expiring soon)
```

**Task 5.2: Update Seed Billets Script** (or verify it's complete)

File: `/keystone/backend/seed/seed_billets.py` (already exists but may need updates)

- Ensure it covers at minimum:
  - Battalion Staff: CDR, XO, SGTMAJ, S1, S3, S4
  - Alpha Company: CDR, 1SG, 3x Plt CDR, 3x Plt SGT, 6x Sqd LDR
  - Bravo Company: CDR, 1SG, Plt CDR, Plt SGT, Sqd LDR
  - Weapons Company: CDR, Mortar Section Leader
  - H&S Company: CDR, Comms Chief

- Billets should be assigned to personnel via the frontend (not pre-assigned in seed) or optionally match personnel EDIPI in seed data.

**Task 5.3: Call seed functions in app initialization**

File: `/keystone/backend/app/__init__.py` or app startup hook

- Ensure `seed_personnel()` is called (idempotent) on app startup or via a management command
- Verify execution order: seed_units → seed_billets → seed_personnel → seed_qualifications

Example:

```python
@app.on_event("startup")
async def startup():
    async with get_db() as db:
        # ... existing startup code ...
        await seed_personnel(db)
        await db.commit()
```

Or via management CLI:

```bash
python -m keystone.backend seed --module personnel
```

---

## Implementation Plan (Parallel Waves)

### Wave 0 — Plan (Orchestrator)

- [ ] Identify team allocation:
  - **Frontend Dev**: Tasks 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.2
  - **Backend Dev (Python)**: Tasks 4.1, 4.2, 4.3, 5.1, 5.2, 5.3

### Wave 1 — Build (Parallel)

- [ ] **Frontend Dev**: Build AddEditPersonnelModal, AddEditBilletModal, AddEditQualificationModal, MarineDetailPanel
  - Update AlphaRosterTable, BilletTracker, QualificationMatrix with CRUD buttons
  - Wire up API calls in `/keystone/frontend/src/api/personnel.ts`

- [ ] **Backend Dev**: Add missing endpoints, verify schemas, ensure auth checks
  - Implement POST /personnel, PUT /personnel/{id}, DELETE (soft)
  - Implement POST /qualifications, PUT /qualifications/{id}, DELETE /qualifications/{id}
  - Verify /manning/billets endpoints are complete

- [ ] **Backend Dev (parallel)**: Seed realistic personnel data, verify billets
  - Create seed_personnel.py with 25-30 Marines
  - Ensure seed_billets.py covers all T/O structure
  - Integrate into app startup or CLI

### Wave 2 — Verify (Parallel)

After Wave 1:

- [ ] **Frontend Tester**: Run `npx tsc -b`, `npx vitest run`, test all CRUD flows (add, edit, delete, assign)
- [ ] **Backend Tester**: Run `go test ./...` (if Go services), `python -m pytest` (if tests exist), verify endpoints with curl/Postman
- [ ] **DevSecOps**: Review for injection vulns, auth checks, data validation, soft-delete correctness

### Wave 3 — Fix (if needed)

- [ ] Address any TypeScript, test, or security findings from Wave 2

### Wave 4 — Re-verify

- [ ] Re-run Tester + DevSecOps

### Wave 5 — Smoke Test

- [ ] Boot `docker compose up`, verify:
  - Personnel API responds with seeded data
  - Can create/edit/delete Marines via UI
  - Can create/edit/delete billets
  - Can assign Marines to billets
  - Marines display in Alpha Roster table
  - Billets show correct status (filled/vacant)
  - Qualifications can be added/removed

### Wave 6 — Ship

- [ ] Bump version in Helm chart, create commit, open PR, merge

---

## Technical Details

### Component Structure

```
/keystone/frontend/src/components/personnel/
├── PersonnelPage.tsx (existing, parent)
├── AlphaRosterTable.tsx (modify: add CRUD buttons)
├── BilletTracker.tsx (modify: add CRUD buttons)
├── QualificationMatrix.tsx (modify or replace with new QualificationsTab)
├── StrengthPanel.tsx (existing)
├── EASTimeline.tsx (existing)
├── AddEditPersonnelModal.tsx (new)
├── AddEditBilletModal.tsx (new)
├── AddEditQualificationModal.tsx (new)
├── MarineDetailPanel.tsx (new)
└── BilletImportModal.tsx (new, optional)
```

### Modal Pattern

All modals should follow this pattern (based on existing components):

```tsx
import { useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: TData) => Promise<void>;
  initialData?: TData;
}

export default function MyModal({ isOpen, onClose, onSubmit, initialData }: ModalProps) {
  const [formData, setFormData] = useState<TData>(initialData || defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit?.(formData);
      onClose();
    } catch (error) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl max-h-screen overflow-y-auto bg-white rounded-lg shadow-xl">
        {/* Header */}
        <div className="sticky top-0 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Modal Title</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
          {/* Form fields */}
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 border-t px-6 py-4 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
```

### API Integration

Frontend calls should use TanStack Query for caching:

```tsx
const queryClient = useQueryClient();

const createPersonnel = useMutation({
  mutationFn: (data: PersonnelCreate) => apiClient.post('/personnel', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['personnel-list'] });
    toast.success('Marine added successfully');
  },
  onError: (error) => {
    toast.error(error.message || 'Failed to add Marine');
  },
});

const handleSubmit = async (formData: PersonnelCreate) => {
  await createPersonnel.mutateAsync(formData);
};
```

### Validation Rules

**Personnel**:
- EDIPI: 10 digits, unique (async validation)
- First Name, Last Name: 2-50 chars, letters + apostrophes/hyphens
- Rank, Pay Grade: required enum values
- MOS: 4 digits or alphanumeric
- Unit: required reference
- Dates: ISO format, sensible ranges (DON <= DOG <= EAOS)

**Billet**:
- Billet ID Code: unique, format e.g., "BN-CMD-001"
- Billet Title: 3-100 chars
- MOS Required, Rank Required: enum values
- Unit: required reference

**Qualification**:
- Personnel: required reference
- Type & Name: required, non-empty
- Date Achieved: required, ≤ today
- Expiration Date: optional, but if set, must be > date_achieved

---

## Files to Create/Modify

### Frontend (React/TypeScript)

**New Files**:
- `/keystone/frontend/src/components/personnel/AddEditPersonnelModal.tsx`
- `/keystone/frontend/src/components/personnel/AddEditBilletModal.tsx`
- `/keystone/frontend/src/components/personnel/AddEditQualificationModal.tsx`
- `/keystone/frontend/src/components/personnel/MarineDetailPanel.tsx`
- `/keystone/frontend/src/components/personnel/BilletImportModal.tsx` (optional)

**Modified Files**:
- `/keystone/frontend/src/components/personnel/AlphaRosterTable.tsx` — add CRUD buttons
- `/keystone/frontend/src/components/personnel/BilletTracker.tsx` — add CRUD buttons
- `/keystone/frontend/src/components/personnel/QualificationMatrix.tsx` — add CRUD buttons (or replace with new tab)
- `/keystone/frontend/src/pages/PersonnelPage.tsx` — integrate modals and side panels
- `/keystone/frontend/src/api/personnel.ts` — add functions for create/update/delete APIs

### Backend (Python/FastAPI)

**New Files**:
- `/keystone/backend/seed/seed_personnel.py` — personnel seeding

**Modified Files**:
- `/keystone/backend/app/api/personnel.py` — add/verify create, update, delete endpoints for personnel & qualifications
- `/keystone/backend/app/api/manning.py` — verify billet endpoints complete
- `/keystone/backend/app/schemas/personnel.py` — verify PersonnelCreate, PersonnelUpdate schemas
- `/keystone/backend/app/schemas/manning.py` — verify BilletStructureCreate, BilletStructureUpdate schemas
- `/keystone/backend/app/__init__.py` or startup hook — call seed_personnel on app init
- `/keystone/backend/seed/__init__.py` — register seed_personnel in seed registry (if applicable)

---

## Success Criteria

- [ ] All 5 tabs in PersonnelPage render without errors
- [ ] Alpha Roster table shows 25+ seeded Marines with correct fields
- [ ] Can add a new Marine via modal with all fields
- [ ] Can edit an existing Marine (pre-fills, updates correctly)
- [ ] Can soft-delete a Marine (status → INACTIVE, not removed from DB)
- [ ] Can click a Marine name to open detail panel
- [ ] Can view qualifications in detail panel
- [ ] Billets tab shows all company/battalion billets
- [ ] Can add, edit, delete billets
- [ ] Can assign a Marine to a vacant billet
- [ ] Can unassign a Marine from a filled billet
- [ ] Billet "is_filled" status updates correctly when assigned/unassigned
- [ ] Can add qualifications to a Marine
- [ ] Can update/remove qualifications
- [ ] All mutations invalidate appropriate queries (roster refreshes, billets refresh, quals refresh)
- [ ] Frontend type-checks pass (`npx tsc -b`)
- [ ] Backend auth checks prevent unauthorized writes (non-WRITE_ROLES cannot POST/PUT/DELETE)
- [ ] No hardcoded credentials, secrets, or injection vulnerabilities
- [ ] Soft-delete: Marines are marked INACTIVE, not hard-deleted
- [ ] UI is responsive, modals are centered and scrollable
- [ ] Toast notifications for success/error states
- [ ] Form validation shows inline error messages

---

## References

### Existing Files (Read-Only)

- `/keystone/frontend/src/components/ui/Card.tsx` — card component pattern
- `/keystone/frontend/src/pages/PersonnelPage.tsx` — parent page structure (lines 1-150)
- `/keystone/frontend/src/api/personnel.ts` — mock data + API functions
- `/keystone/frontend/src/api/client.ts` — apiClient instance (axios config)
- `/keystone/backend/app/models/personnel.py` — Personnel model (lines 101-158)
- `/keystone/backend/app/models/manning.py` — BilletStructure, Qualification models
- `/keystone/backend/app/api/personnel.py` — personnel routes (lines 1-100+)
- `/keystone/backend/app/api/manning.py` — manning/billet routes (complete)
- `/keystone/backend/seed/seed_billets.py` — billet seed example (idempotent pattern)
- `/keystone/backend/app/schemas/personnel.py` — PersonnelCreate, PersonnelUpdate schemas
- `/keystone/backend/app/schemas/manning.py` — Billet, Qualification schemas

### Model Enums

**PersonnelStatus**: ACTIVE, DEPLOYED, TDY, LEAVE, MEDICAL, INACTIVE
**PayGrade**: E1-E9, W1-W5, O1-O10
**RifleQualification**: EXPERT, SHARPSHOOTER, MARKSMAN, UNQUAL
**SwimQualification**: CWS1, CWS2, CWS3, CWS4, UNQUAL
**SecurityClearance**: NONE, CONFIDENTIAL, SECRET, TOP_SECRET, TS_SCI
**DutyStatus**: PRESENT, UA, DESERTER, AWOL, CONFINEMENT, LIMDU, PTAD

---

## Notes

- **Demo Mode**: If frontend is in demo/mock mode (`isDemoMode()`), use mock API calls that update in-memory state
- **Authorization**: All POST/PUT/DELETE operations require `WRITE_ROLES = [ADMIN, COMMANDER, S3, S4]`
- **Unit Access**: All operations must check user's accessible units (cannot modify/view other units' data)
- **Soft Delete**: Do NOT hard-delete Marines; set `status = INACTIVE`
- **Idempotency**: Seed functions must check uniqueness (EDIPI, billet_id_code) before inserting
- **Toast Notifications**: Use existing toast/notification library (check App.tsx for pattern)
- **Responsive Design**: Modals should work on tablets (max-width-2xl) and mobile (full width minus padding)
- **Accessibility**: Ensure form labels, ARIA labels, and keyboard navigation (Tab, Enter, Escape to close)

---

## Schedule Estimate

- **Frontend CRUD UI**: 6-8 hours (modals, validation, API integration)
- **Backend API Verification**: 2-3 hours (add missing endpoints, test)
- **Seed Data**: 3-4 hours (realistic personnel, integration)
- **Testing & QA**: 2-3 hours (manual testing, UI/UX, edge cases)
- **Total**: 13-18 hours (can be done in parallel across 2 developers)

---

## Glossary

- **EDIPI**: Electronic Data Interchange Personnel Identity (10-digit ID)
- **MOS**: Military Occupational Specialty (e.g., 0311 = Rifleman)
- **DON**: Date of Navy (commissioning)
- **DOG**: Date of Appointment to Grade
- **EAOS**: Expiration of Appointment of Service (end of contract)
- **PFT**: Physical Fitness Test (pullups/crunches/3-mile run, scored 0-300)
- **CFT**: Combat Fitness Test (ammo can runs, movement-to-contact, 880-yard sprint, scored 0-300)
- **T/O**: Table of Organization (authorized billets for a unit)
- **Billet**: Authorized position (e.g., "Battalion Commander", "Squad Leader")
- **PME**: Professional Military Education
- **CWS**: Combat Water Survival (swimming qualification level)

---

**End of Prompt**
