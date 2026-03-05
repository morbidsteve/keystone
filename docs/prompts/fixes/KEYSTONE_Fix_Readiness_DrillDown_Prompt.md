# KEYSTONE — Fix Readiness Drill-Down & Subordinate Hierarchy

**System**: USMC Logistics Intelligence Platform (KEYSTONE)
**Date**: 2026-03-05
**Scope**: ReadinessPage and subordinate unit rollup fixes

---

## OVERVIEW

The ReadinessPage currently displays 5 gauges (Overall, Equipment, Supply, Personnel, Training) and a DRRS RATINGS card grid, but **clicking them does nothing**. Additionally, the SUBORDINATES tab shows incorrect units (parent units instead of direct children). This prompt specifies the fixes required to make the page fully interactive and correct the hierarchy display.

---

## ARCHITECTURE CONTEXT

### Frontend Stack
- **Framework**: React 18, TypeScript
- **Styling**: Tailwind CSS + inline var(--color-*) and var(--font-mono)
- **State**: Zustand (useDashboardStore)
- **Data**: TanStack Query/React Query, Recharts
- **Location**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/`

### Backend Stack
- **Framework**: Python 3.11+, FastAPI, SQLAlchemy async (pg/pgx)
- **ORM**: SQLAlchemy 2.0+ async sessions
- **Location**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/`

### Key Models

#### Unit (Hierarchy)
- Path: `backend/app/models/unit.py`
- Columns: `id`, `name`, `abbreviation`, `echelon` (Enum), `parent_id` (FK self-ref), `children` (relationship)
- **Echelon Enum**: HQMC, MEF, DIV, WING, GRP, REGT, BN, SQDN, CO, PLT, SQD, FT, INDV, CUSTOM
- Relationships: `parent` (self-ref), `children` (self-ref), `readiness_snapshots`, `strength_reports`

#### UnitReadinessSnapshot
- Path: `backend/app/models/readiness_snapshot.py`
- Columns:
  - Percentages: `overall_readiness_pct`, `equipment_readiness_pct`, `supply_readiness_pct`, `personnel_fill_pct`, `training_readiness_pct`
  - Ratings: `c_rating` (combined), `r_rating` (equipment/R), `s_rating` (supply), `p_rating` (personnel), `t_rating` (training)
  - Metadata: `limiting_factor`, `notes`, `snapshot_date`, `reported_by_id`, `is_official`

#### EquipmentStatus
- Path: `backend/app/models/equipment.py`
- Columns: `unit_id`, `tamcn`, `nomenclature`, `total_possessed`, `mission_capable`, `nmc_m`, `nmc_s`, `readiness_pct`
- Used by: `ReadinessService.calculate_equipment_readiness()`

#### SupplyStatusRecord
- Path: `backend/app/models/supply.py`
- Columns: `unit_id`, `supply_class`, `item_description`, `on_hand`, `required`, `dos` (Days of Supply), `status`

#### Personnel & Qualifications
- Path: `backend/app/models/personnel.py`
- Unit has `personnel` relationship
- MOS data stored in UnitStrength.mos_shortfalls (JSON array)

#### UnitStrength
- Path: `backend/app/models/unit_strength.py`
- Columns: `unit_id`, `authorized_*`, `assigned_*`, `fill_pct`, `mos_shortfalls` (JSON), `reported_at`

---

## ISSUE #1: RATING DRILL-DOWN (NON-CLICKABLE)

### Current Behavior
- ReadinessPage.tsx (lines 201–231) displays 5 `<ReadinessGauge>` components
- ReadinessPage.tsx (lines 307–363) displays DRRS RATINGS cards (COMBINED, EQUIPMENT, SUPPLY, PERSONNEL, TRAINING)
- **Neither is clickable**; clicking does nothing

### Expected Behavior
When a user clicks any rating (gauge or card):
1. A drill-down panel opens (expandable section below, drawer, or modal)
2. Display detailed breakdowns specific to that rating domain
3. Show tables, charts, and actionable summaries

---

## ISSUE #2: SUBORDINATE UNIT HIERARCHY BUG

### Current Behavior
- ReadinessPage.tsx → SUBORDINATES tab calls `getReadinessRollup(numericUnitId)`
- Backend endpoint: `GET /api/v1/readiness/{unit_id}/rollup` (app/api/readiness.py, line 219)
- **Bug**: The rollup may return wrong units (parents or entire tree) instead of direct children only

### Expected Behavior
- Rollup API queries `Unit` table WHERE `parent_id = {unit_id}` (exact children)
- Frontend shows only direct subordinates with echelon labels
- Each subordinate row is clickable to navigate to that unit's readiness

---

## FIX #1: BACKEND — NEW DRILL-DOWN ENDPOINTS

Add these endpoints to `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/api/readiness.py`:

### 1a. GET /readiness/{unit_id}/equipment-detail
**Purpose**: Return detailed equipment readiness breakdown
**Response Model**:
```python
class EquipmentDetailItem(BaseModel):
    tamcn: str
    nomenclature: str
    total_possessed: int
    mission_capable: int
    nmc_m: int
    nmc_s: int
    readiness_pct: float

class EquipmentDetailResponse(BaseModel):
    unit_id: int
    snapshot_date: str
    overall_readiness_pct: float
    r_rating: str
    equipment_items: List[EquipmentDetailItem]  # sorted by readiness_pct ASC (worst first)
    summary_by_category: Optional[Dict[str, float]]  # e.g., {"Vehicles": 85, "Comms": 78, "Weapons": 92}
```

**Logic**:
- Query `EquipmentStatus` WHERE `unit_id = {unit_id}`
- Sort by `readiness_pct` ascending (problems first)
- Group by category (if nomenclature contains "HMMWV" → "Vehicles", etc.)
- Return all equipment types, even if zero readiness

### 1b. GET /readiness/{unit_id}/supply-detail
**Purpose**: Return detailed supply readiness breakdown
**Response Model**:
```python
class SupplyDetailItem(BaseModel):
    supply_class: str
    description: str
    on_hand: int
    required: int
    dos: float
    status: str  # "GREEN" (>=10 DOS), "AMBER" (5-9), "RED" (<5)

class SupplyDetailResponse(BaseModel):
    unit_id: int
    snapshot_date: str
    overall_readiness_pct: float
    s_rating: str
    supply_items: List[SupplyDetailItem]  # sorted by DOS ASC
    dos_by_class: Dict[str, float]  # e.g., {"Class I": 12.5, "Class III": 3.2, "Class IX": 8.1}
```

**Logic**:
- Query `SupplyStatusRecord` WHERE `unit_id = {unit_id}`
- Sort by `dos` ascending (critical shortages first)
- Color status: GREEN (≥10), AMBER (5–9), RED (<5)

### 1c. GET /readiness/{unit_id}/personnel-detail
**Purpose**: Return personnel fill rates and billet vacancies
**Response Model**:
```python
class MOSShortfall(BaseModel):
    mos: str
    mos_title: str
    authorized: int
    assigned: int
    shortfall: int

class PersonnelDetailResponse(BaseModel):
    unit_id: int
    snapshot_date: str
    overall_readiness_pct: float
    p_rating: str
    authorized_total: int
    assigned_total: int
    fill_rate_pct: float
    mos_shortfalls: List[MOSShortfall]  # sorted by shortfall DESC
    key_billet_vacancies: Optional[List[Dict[str, Any]]]  # from BilletStructure if available
    link_to_personnel_page: str  # e.g., "/personnel?unit_id={unit_id}"
```

**Logic**:
- Fetch latest `UnitStrength` WHERE `unit_id = {unit_id}`
- Extract fill_pct, authorized/assigned totals
- Parse `mos_shortfalls` JSON array

### 1d. GET /readiness/{unit_id}/training-detail
**Purpose**: Return training readiness and qualification currency
**Response Model**:
```python
class TrainingDetailResponse(BaseModel):
    unit_id: int
    snapshot_date: str
    overall_readiness_pct: float
    t_rating: str
    qualification_currency_rates: Dict[str, float]  # e.g., {"Annual PFT": 92.5, "CFT": 88.0}
    upcoming_expirations: Optional[List[Dict[str, Any]]]  # MOS certs/quals expiring in <30 days
    combat_readiness_stats: Optional[Dict[str, float]]  # e.g., {"Range Qualification": 95, "PFT Pass Rate": 88}
```

**Logic**:
- For now, return placeholder data from `training_readiness_pct` (placeholder = 80%)
- Schema ready for future training module integration

---

## FIX #1B: BACKEND — FIX ROLLUP API (Unit Hierarchy)

**File**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/api/readiness.py`, line 219–235

**Current Code**:
```python
@router.get("/{unit_id}/rollup", response_model=ReadinessRollupResponse)
async def get_readiness_rollup(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get readiness rollup for subordinate units."""
    await check_unit_access(current_user, unit_id, db)

    unit_result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = unit_result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)

    rollup = await ReadinessService.roll_up_readiness(unit_id, db)
    return rollup
```

**Fix**: Ensure `ReadinessService.roll_up_readiness()` does:
1. Query `Unit` WHERE `parent_id = unit_id` (direct children ONLY)
2. For each child, get latest `UnitReadinessSnapshot` by `snapshot_date DESC LIMIT 1`
3. **Include units with NULL snapshots** (return them with null/N/A readiness)
4. Return list in echelon order (if possible)

**Update in**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/backend/app/services/readiness.py`

Add or fix method:
```python
@staticmethod
async def roll_up_readiness(unit_id: int, db: AsyncSession) -> ReadinessRollupResponse:
    """Get readiness rollup for DIRECT children only."""
    # Query direct children
    children_result = await db.execute(
        select(Unit)
        .where(Unit.parent_id == unit_id)
        .order_by(Unit.echelon, Unit.name)
    )
    children = children_result.scalars().all()

    subordinates = []
    avg_pct = 0.0
    valid_snapshots = 0

    for child in children:
        # Get latest snapshot
        snap_result = await db.execute(
            select(UnitReadinessSnapshot)
            .where(UnitReadinessSnapshot.unit_id == child.id)
            .order_by(UnitReadinessSnapshot.snapshot_date.desc())
            .limit(1)
        )
        snapshot = snap_result.scalar_one_or_none()

        subordinates.append({
            "unit_id": child.id,
            "unit_name": f"{child.abbreviation or child.name}",
            "echelon_label": child.echelon.value if child.echelon else "CUSTOM",
            "c_rating": snapshot.c_rating if snapshot else None,
            "overall_readiness_pct": snapshot.overall_readiness_pct if snapshot else None,
            "limiting_factor": snapshot.limiting_factor if snapshot else None,
        })

        if snapshot:
            avg_pct += snapshot.overall_readiness_pct
            valid_snapshots += 1

    avg_pct = (avg_pct / valid_snapshots) if valid_snapshots > 0 else 0.0

    return ReadinessRollupResponse(
        unit_id=unit_id,
        num_subordinates=len(subordinates),
        avg_overall_readiness_pct=avg_pct,
        subordinates=subordinates,
    )
```

---

## FIX #2: FRONTEND — MAKE GAUGES & RATINGS CLICKABLE

**File**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/pages/ReadinessPage.tsx`

### 2a. Add State for Drill-Down Panel
Near line 64–66, add:
```typescript
const [activeDrillDown, setActiveDrillDown] = useState<'equipment' | 'supply' | 'personnel' | 'training' | null>(null);
```

### 2b. Update ReadinessGauge Props
**File**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/readiness/ReadinessGauge.tsx`

Modify component to accept `onClick`:
```typescript
interface ReadinessGaugeProps {
  percentage: number;
  rating?: string;
  size?: number;
  label?: string;
  domain?: 'overall' | 'equipment' | 'supply' | 'personnel' | 'training';
  onDrillDown?: (domain: string) => void;
}

export default function ReadinessGauge({
  percentage,
  rating,
  size = 80,
  label,
  domain,
  onDrillDown,
}: ReadinessGaugeProps) {
  // ... existing code ...

  return (
    <div
      onClick={() => domain && domain !== 'overall' && onDrillDown?.(domain)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: domain && domain !== 'overall' ? 'pointer' : 'default',
        transition: 'opacity var(--transition)',
        opacity: /* hover state */ 1,
      }}
    >
      {/* SVG gauge ... */}
    </div>
  );
}
```

### 2c. Wire Gauges in ReadinessPage
Around lines 201–231, update:
```typescript
<ReadinessGauge
  percentage={snapshot.overallReadinessPct}
  rating={snapshot.cRating}
  size={90}
  label="Overall"
  domain="overall"
  onDrillDown={setActiveDrillDown}
/>
<ReadinessGauge
  percentage={snapshot.equipmentReadinessPct ?? 0}
  rating={snapshot.rRating}
  size={80}
  label="Equipment"
  domain="equipment"
  onDrillDown={setActiveDrillDown}
/>
<ReadinessGauge
  percentage={snapshot.supplyReadinessPct ?? 0}
  rating={snapshot.sRating}
  size={80}
  label="Supply"
  domain="supply"
  onDrillDown={setActiveDrillDown}
/>
<ReadinessGauge
  percentage={snapshot.personnelFillPct ?? 0}
  rating={snapshot.pRating}
  size={80}
  label="Personnel"
  domain="personnel"
  onDrillDown={setActiveDrillDown}
/>
<ReadinessGauge
  percentage={snapshot.trainingReadinessPct ?? 0}
  rating={snapshot.tRating}
  size={80}
  label="Training"
  domain="training"
  onDrillDown={setActiveDrillDown}
/>
```

### 2d. Make DRRS Cards Clickable
Around lines 316–361, update the card grid:
```typescript
{[
  { label: 'COMBINED', rating: snapshot.cRating, pct: snapshot.overallReadinessPct, domain: null },
  { label: 'EQUIPMENT', rating: snapshot.rRating, pct: snapshot.equipmentReadinessPct, domain: 'equipment' },
  { label: 'SUPPLY', rating: snapshot.sRating, pct: snapshot.supplyReadinessPct, domain: 'supply' },
  { label: 'PERSONNEL', rating: snapshot.pRating, pct: snapshot.personnelFillPct, domain: 'personnel' },
  { label: 'TRAINING', rating: snapshot.tRating, pct: snapshot.trainingReadinessPct, domain: 'training' },
].map((item) => (
  <div
    key={item.label}
    onClick={() => item.domain && setActiveDrillDown(item.domain)}
    style={{
      padding: 12,
      backgroundColor: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      cursor: item.domain ? 'pointer' : 'default',
      transition: 'all var(--transition)',
    }}
    onMouseEnter={(e) => {
      if (item.domain) {
        e.currentTarget.style.backgroundColor = 'var(--color-bg-hover)';
        e.currentTarget.style.borderColor = 'var(--color-accent)';
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'var(--color-bg)';
      e.currentTarget.style.borderColor = 'var(--color-border)';
    }}
  >
    {/* ... existing label and badge code ... */}
  </div>
))}
```

---

## FIX #2B: FRONTEND — ADD DRILL-DOWN COMPONENT

Create file: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/readiness/DrillDownPanel.tsx`

**Example Structure** (use Recharts for charts, TanStack Table for tables):
```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';
import Card from '@/components/ui/Card';

interface DrillDownPanelProps {
  unitId: number;
  domain: 'equipment' | 'supply' | 'personnel' | 'training';
  onClose: () => void;
}

export default function DrillDownPanel({ unitId, domain, onClose }: DrillDownPanelProps) {
  // Fetch domain-specific detail
  const { data, isLoading } = useQuery({
    queryKey: ['drill-down', unitId, domain],
    queryFn: () => {
      // Use new API endpoints (e.g., getEquipmentDetail)
      // See new API functions below
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{
      marginTop: 16,
      padding: 16,
      backgroundColor: 'var(--color-bg-elevated)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)',
      position: 'relative',
    }}>
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-text-muted)',
        }}
      >
        <X size={16} />
      </button>

      {domain === 'equipment' && <EquipmentDrillDown data={data} />}
      {domain === 'supply' && <SupplyDrillDown data={data} />}
      {domain === 'personnel' && <PersonnelDrillDown data={data} />}
      {domain === 'training' && <TrainingDrillDown data={data} />}
    </div>
  );
}

function EquipmentDrillDown({ data }: any) {
  return (
    <Card title="EQUIPMENT READINESS DETAIL">
      <table style={{ width: '100%', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th style={{ textAlign: 'left', padding: 8 }}>TAMCN</th>
            <th style={{ textAlign: 'left', padding: 8 }}>Nomenclature</th>
            <th style={{ textAlign: 'center', padding: 8 }}>Total</th>
            <th style={{ textAlign: 'center', padding: 8 }}>MC</th>
            <th style={{ textAlign: 'center', padding: 8 }}>NMC-M</th>
            <th style={{ textAlign: 'center', padding: 8 }}>NMC-S</th>
            <th style={{ textAlign: 'right', padding: 8 }}>Readiness %</th>
          </tr>
        </thead>
        <tbody>
          {data.equipment_items.map((item: any) => (
            <tr key={item.tamcn} style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: 8 }}>{item.tamcn}</td>
              <td style={{ padding: 8 }}>{item.nomenclature}</td>
              <td style={{ textAlign: 'center', padding: 8 }}>{item.total_possessed}</td>
              <td style={{ textAlign: 'center', padding: 8 }}>{item.mission_capable}</td>
              <td style={{ textAlign: 'center', padding: 8 }}>{item.nmc_m}</td>
              <td style={{ textAlign: 'center', padding: 8 }}>{item.nmc_s}</td>
              <td style={{
                textAlign: 'right',
                padding: 8,
                color: item.readiness_pct >= 90 ? '#4ade80' : item.readiness_pct >= 70 ? '#fbbf24' : '#f87171',
                fontWeight: 700,
              }}>
                {item.readiness_pct.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* Optional: Bar chart by category using Recharts */}
    </Card>
  );
}

// Similar for SupplyDrillDown, PersonnelDrillDown, TrainingDrillDown
```

---

## FIX #2C: FRONTEND — ADD API FUNCTIONS

Update file: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/api/readiness.ts`

Add:
```typescript
export async function getEquipmentDetail(
  unitId: number,
): Promise<EquipmentDetailResponse> {
  if (isDemoMode) {
    await mockDelay();
    // Return mock data for demo
    return {
      unit_id: unitId,
      snapshot_date: new Date().toISOString().split('T')[0],
      overall_readiness_pct: 85,
      r_rating: 'R-2',
      equipment_items: [
        { tamcn: 'ABC123', nomenclature: 'HMMWV', total_possessed: 24, mission_capable: 20, nmc_m: 2, nmc_s: 2, readiness_pct: 83 },
        { tamcn: 'DEF456', nomenclature: '7-Ton Truck', total_possessed: 12, mission_capable: 10, nmc_m: 1, nmc_s: 1, readiness_pct: 83 },
      ],
      summary_by_category: { Vehicles: 85, Comms: 90, Weapons: 88 },
    };
  }
  const response = await apiClient.get<{ data: EquipmentDetailResponse }>(
    `/readiness/${unitId}/equipment-detail`,
  );
  return response.data.data;
}

export async function getSupplyDetail(
  unitId: number,
): Promise<SupplyDetailResponse> {
  if (isDemoMode) {
    await mockDelay();
    return {
      unit_id: unitId,
      snapshot_date: new Date().toISOString().split('T')[0],
      overall_readiness_pct: 76,
      s_rating: 'S-2',
      supply_items: [
        { supply_class: 'CL III', description: 'Bulk Fuel', on_hand: 15000, required: 50000, dos: 3.2, status: 'RED' },
        { supply_class: 'CL IX', description: 'Repair Parts', on_hand: 2000, required: 5000, dos: 8.5, status: 'AMBER' },
      ],
      dos_by_class: { 'CL I': 12, 'CL III': 3.2, 'CL IX': 8.5 },
    };
  }
  const response = await apiClient.get<{ data: SupplyDetailResponse }>(
    `/readiness/${unitId}/supply-detail`,
  );
  return response.data.data;
}

export async function getPersonnelDetail(
  unitId: number,
): Promise<PersonnelDetailResponse> {
  if (isDemoMode) {
    await mockDelay();
    return {
      unit_id: unitId,
      snapshot_date: new Date().toISOString().split('T')[0],
      overall_readiness_pct: 82,
      p_rating: 'P-2',
      authorized_total: 850,
      assigned_total: 698,
      fill_rate_pct: 82.1,
      mos_shortfalls: [
        { mos: '0311', mos_title: 'Rifleman', authorized: 180, assigned: 162, shortfall: 18 },
      ],
      key_billet_vacancies: null,
      link_to_personnel_page: `/personnel?unit_id=${unitId}`,
    };
  }
  const response = await apiClient.get<{ data: PersonnelDetailResponse }>(
    `/readiness/${unitId}/personnel-detail`,
  );
  return response.data.data;
}

export async function getTrainingDetail(
  unitId: number,
): Promise<TrainingDetailResponse> {
  if (isDemoMode) {
    await mockDelay();
    return {
      unit_id: unitId,
      snapshot_date: new Date().toISOString().split('T')[0],
      overall_readiness_pct: 80,
      t_rating: 'T-2',
      qualification_currency_rates: {
        'Annual PFT': 92.5,
        'CFT': 88.0,
      },
      upcoming_expirations: null,
      combat_readiness_stats: {
        'Range Qualification': 95,
        'PFT Pass Rate': 88,
      },
    };
  }
  const response = await apiClient.get<{ data: TrainingDetailResponse }>(
    `/readiness/${unitId}/training-detail`,
  );
  return response.data.data;
}
```

---

## FIX #2D: RENDER DRILL-DOWN IN READINESS PAGE

Around line 305 (after the gauges card), add:

```typescript
{activeDrillDown && (
  <DrillDownPanel
    unitId={numericUnitId}
    domain={activeDrillDown}
    onClose={() => setActiveDrillDown(null)}
  />
)}
```

---

## FIX #3: FRONTEND — FIX SUBORDINATES TAB

### 3a. Update ReadinessRollupTree to Add Echelon Labels & Clickability

**File**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/components/readiness/ReadinessRollupTree.tsx`

Modify `SubordinateRow` (around line 85–86):
```typescript
function SubordinateRow({ sub }: SubordinateRowProps) {
  const { setSelectedUnitId } = useDashboardStore();
  const borderColor = getBorderColor(sub.cRating);
  const pctColor = getTextColor(sub.overallReadinessPct);

  const handleClick = () => {
    setSelectedUnitId(String(sub.unitId));
    // Optional: auto-scroll to top or show confirmation
  };

  return (
    <div
      onClick={handleClick}
      style={{
        borderLeft: `3px solid ${borderColor}`,
        marginBottom: 2,
        cursor: 'pointer',
        transition: 'background-color var(--transition)',
      }}
    >
      {/* ... existing flex layout ... */}
      {/* Unit name + echelon */}
      <span
        style={{
          flex: 1,
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-text-bright)',
        }}
      >
        {sub.unitName} <span style={{ color: 'var(--color-text-muted)', fontSize: 10 }}>({sub.echelon_label})</span>
      </span>
      {/* ... rest of row ... */}
    </div>
  );
}
```

### 3b. Remove Hardcoded UNIT_NAMES

**File**: `/sessions/nifty-festive-wozniak/mnt/LPI/keystone/frontend/src/pages/ReadinessPage.tsx`, lines 47–57

**Current**:
```typescript
const UNIT_NAMES: Record<number, string> = {
  1: 'I MEF',
  2: '1st MarDiv',
  3: '1st Marines',
  4: '1/1',
  5: '2/1',
};

function getUnitName(id: number): string {
  return UNIT_NAMES[id] ?? `Unit ${id}`;
}
```

**Replace with**: Fetch unit name from dashboard store or cached API data:
```typescript
function getUnitName(id: number): string {
  // Try to get from dashboard store or cache
  const dashboardData = useDashboardStore((s) => s.unitsCache); // or similar
  if (dashboardData && dashboardData[id]) {
    return dashboardData[id].name;
  }
  return `Unit ${id}`;
}
```

Or, fetch unit metadata via API:
```typescript
const { data: unitMetadata } = useQuery({
  queryKey: ['unit', numericUnitId],
  queryFn: () => apiClient.get(`/units/${numericUnitId}`),
});

function getUnitName(id: number): string {
  if (unitMetadata && unitMetadata.id === id) {
    return unitMetadata.name;
  }
  return `Unit ${id}`;
}
```

---

## TESTING CHECKLIST

### Backend Tests
- [ ] `pytest backend/tests/test_readiness_equipment_detail.py` — Verify equipment detail endpoint
  - [ ] Returns all equipment types for a unit
  - [ ] Sorts by readiness_pct ascending (worst first)
  - [ ] Includes summary by category
- [ ] `pytest backend/tests/test_readiness_supply_detail.py` — Verify supply detail endpoint
  - [ ] Returns supply items sorted by DOS ascending
  - [ ] Correctly categorizes status (GREEN/AMBER/RED)
- [ ] `pytest backend/tests/test_readiness_personnel_detail.py` — Verify personnel detail endpoint
  - [ ] Returns fill_rate and MOS shortfalls
  - [ ] Includes link to personnel page
- [ ] `pytest backend/tests/test_readiness_rollup.py` — Verify rollup fix
  - [ ] For battalion (BN), returns ONLY company (CO) children
  - [ ] For company, returns ONLY platoon (PLT) children
  - [ ] Includes units with null snapshots
  - [ ] Sorted by echelon

### Frontend Tests
- [ ] `npm run test:unit -- ReadinessPage` — Verify gauge clickability
  - [ ] Clicking Equipment gauge opens drill-down
  - [ ] Clicking DRRS card opens drill-down
  - [ ] Drill-down panels render correct data
- [ ] `npm run test:unit -- ReadinessRollupTree` — Verify subordinate row clickability
  - [ ] Clicking row navigates to subordinate unit
  - [ ] Echelon label displays correctly
- [ ] `npm run test:e2e -- readiness-drilldown` — Full integration
  - [ ] Navigate to unit with subordinates (e.g., battalion)
  - [ ] Click Equipment rating → see detail table sorted by worst readiness
  - [ ] Click Supply rating → see DOS breakdown by class
  - [ ] Click Personnel rating → see fill rate and MOS shortfalls
  - [ ] Go to SUBORDINATES tab → see only direct children with (CO), (PLT) labels
  - [ ] Click a subordinate → page updates to show that unit's readiness
  - [ ] No ERROR in console logs

---

## ACCEPTANCE CRITERIA

1. **Drill-Down Panels**
   - All 4 gauges (Equipment, Supply, Personnel, Training) are clickable ✓
   - All 5 DRRS RATING cards (except COMBINED) are clickable ✓
   - Clicking opens a drill-down panel below the gauges ✓
   - Each panel shows relevant tables, charts, or summaries ✓
   - Close button (X) or ESC key closes the panel ✓

2. **Subordinate Hierarchy**
   - SUBORDINATES tab shows ONLY direct children ✓
   - Each row includes echelon label (e.g., "(CO)", "(PLT)", "(BN)") ✓
   - Clicking a subordinate row updates the unit selector and reloads the page ✓
   - Units with no snapshot are still displayed (with N/A status) ✓
   - No hardcoded unit name mapping in ReadinessPage ✓

3. **Backend API**
   - `GET /readiness/{unit_id}/equipment-detail` returns equipment breakdown ✓
   - `GET /readiness/{unit_id}/supply-detail` returns supply breakdown ✓
   - `GET /readiness/{unit_id}/personnel-detail` returns personnel fill rate ✓
   - `GET /readiness/{unit_id}/training-detail` returns training stats ✓
   - `GET /readiness/{unit_id}/rollup` returns only direct children, sorted ✓

4. **UX**
   - Hover states on clickable gauges/cards ✓
   - Color coding: GREEN (≥90%), AMBER (70–89%), RED (<70%) ✓
   - Data is sorted by severity (worst first) ✓
   - No console errors or warnings ✓

---

## FILE SUMMARY

| File | Change | Type |
|------|--------|------|
| `backend/app/api/readiness.py` | Add 4 new drill-down endpoints | New Routes |
| `backend/app/services/readiness.py` | Fix `roll_up_readiness()` to query direct children | Fix |
| `backend/app/schemas/readiness.py` | Add response models for drill-down endpoints | New Schemas |
| `frontend/src/pages/ReadinessPage.tsx` | Wire gauges/cards to drill-down, remove hardcoded unit names | Fix + Enhance |
| `frontend/src/components/readiness/ReadinessGauge.tsx` | Add `onDrillDown` prop, make clickable | Enhance |
| `frontend/src/components/readiness/DrillDownPanel.tsx` | NEW component to display drill-down details | New Component |
| `frontend/src/components/readiness/ReadinessRollupTree.tsx` | Add echelon labels, make rows clickable | Enhance |
| `frontend/src/api/readiness.ts` | Add 4 new API functions (`getEquipmentDetail`, etc.) | New Functions |

---

## DEMO DATA (for development)

For demo mode, use seed data:
- **Unit 1** (I MEF): Equipment 84%, Supply 78%, Personnel 85%, Training 80%
- **Unit 2** (1st MarDiv): Equipment 81%, Supply 74%, Personnel 82%, Training 78%
- **Unit 4** (1/1 — Battalion): Children are companies (3–5 sub-units) with varying readiness
- **Unit 5** (2/1 — Battalion): Critically low supply (CL III, CL IX); 4× HMMWV deadlined

---

## NEXT STEPS

1. **Backend Dev**: Implement drill-down endpoints + fix rollup service
2. **Frontend Dev**: Implement drill-down component + wire gauges/cards + fix rollup tree
3. **Tester**: Run all test scenarios and verify UI/API behavior
4. **DevSecOps**: Review for SQL injection, XSS, and auth gaps
5. **Smoke Tester**: Boot stack, navigate pages, verify no errors

