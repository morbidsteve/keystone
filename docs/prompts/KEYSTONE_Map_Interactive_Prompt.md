# KEYSTONE — Map Interactive Placement & Click-to-Detail

Paste this into your Claude Code session that already has the KEYSTONE codebase with the map view built.

---

## Task

Add interactive features to the existing KEYSTONE map view:

1. **Place/reposition entities on the map** — users with appropriate permissions can place units, supply points, LZs, FARPs, maintenance sites, and route waypoints at specific locations using GPS coordinates, MGRS grid references, or by right-clicking the map.
2. **Click any entity to see full details** — clicking a unit, convoy, supply point, route, or alert on the map opens a detailed slide-out panel with all logistics data for that entity.
3. **MGRS support everywhere** — anywhere coordinates appear (input fields, popups, coordinate display, context menu), show both GPS (decimal degrees) and MGRS grid references.

## New Dependencies

```bash
# Backend
pip install mgrs --break-system-packages

# Frontend
cd frontend && npm install mgrs @types/mgrs
```

## Backend Changes

### Coordinate Conversion Utility

Create `backend/app/utils/coordinates.py`:

```python
import mgrs

_converter = mgrs.MGRS()

def latlon_to_mgrs(lat: float, lon: float, precision: int = 5) -> str:
    """Convert decimal lat/lon to MGRS string. Precision 5 = 1m accuracy."""
    return _converter.toMGRS(lat, lon, MGRSPrecision=precision)

def mgrs_to_latlon(mgrs_string: str) -> tuple[float, float]:
    """Convert MGRS string to (lat, lon) tuple."""
    lat, lon = _converter.toLatLon(mgrs_string.strip().replace(" ", ""))
    return float(lat), float(lon)

def validate_and_normalize(
    lat: float | None = None,
    lon: float | None = None,
    mgrs_str: str | None = None
) -> tuple[float, float, str]:
    """Accept either GPS or MGRS, return (lat, lon, mgrs). Auto-converts."""
    if mgrs_str and mgrs_str.strip():
        lat, lon = mgrs_to_latlon(mgrs_str)
        return lat, lon, mgrs_str.strip().replace(" ", "")
    elif lat is not None and lon is not None:
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError(f"Invalid coordinates: lat={lat}, lon={lon}")
        return lat, lon, latlon_to_mgrs(lat, lon)
    else:
        raise ValueError("Provide either lat/lon or MGRS")
```

### Database Migration — Add MGRS Column

Add an `mgrs` string column to every model that has lat/lon:
- `Location` model → add `mgrs: String`
- `Unit` model → add `mgrs: String`
- `SupplyPoint` model → add `mgrs: String`
- `Transportation` model (convoy) → add `origin_mgrs`, `dest_mgrs`, `current_mgrs`

Also add:
- `placed_by: FK → User (nullable)` on `Location` model — who manually placed this
- `position_override: Boolean (default False)` on `Location` — whether manual placement overrides TAK

On every save/update that touches coordinates, auto-compute the MGRS equivalent using the utility above. Add a SQLAlchemy `@validates` or use a service layer function.

### Route Model (if not already created)

```python
class Route(Base):
    __tablename__ = "routes"

    id = Column(UUID, primary_key=True, default=uuid4)
    name = Column(String, nullable=False)  # "MSR TAMPA", "ASR DETROIT"
    route_type = Column(Enum('MSR', 'ASR', 'CONVOY_ROUTE', 'AIR_CORRIDOR'), nullable=False)
    status = Column(Enum('OPEN', 'RESTRICTED', 'CLOSED'), default='OPEN')
    geometry = Column(Geometry('LINESTRING', srid=4326))  # PostGIS linestring
    waypoints = Column(JSON)  # [{lat, lon, mgrs, label}, ...]
    restrictions = Column(Text, nullable=True)
    created_by_id = Column(UUID, ForeignKey("users.id"))
    updated_by_id = Column(UUID, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
```

### New API Endpoints

Add these to `backend/app/api/map.py` alongside the existing GET endpoints:

#### POST `/api/v1/map/units/{unit_id}/position`
Set or update a unit's map position. Accepts GPS or MGRS.

Request (GPS):
```json
{ "latitude": 33.3012, "longitude": -117.3542 }
```

Request (MGRS):
```json
{ "mgrs": "11SMS8430514" }
```

Backend: call `validate_and_normalize()`, store lat, lon, and mgrs. Set `position_source = "MANUAL"`, `placed_by = current_user`. Update the PostGIS geometry column. Return the updated entity with both coordinate formats.

**RBAC**: Unit commander (CO/XO) or parent unit S-3 and above, or admin.

#### POST `/api/v1/map/supply-points`
Create a new supply point at a location.

Request:
```json
{
  "name": "WATER POINT BRAVO",
  "point_type": "WATER_POINT",
  "latitude": 33.2900,
  "longitude": -117.3300,
  "parent_unit_id": "uuid",
  "status": "ACTIVE",
  "capacity_notes": "2x 3000-gal HIPPO, 5000 gal/day throughput"
}
```

MGRS alternative — same payload but with `"mgrs": "11SMS8110911"` instead of lat/lon. Backend auto-converts.

**RBAC**: S-4 and above, or admin.

#### PUT `/api/v1/map/supply-points/{id}`
Update supply point (position, status, name, etc.). **RBAC**: same as create.

#### PUT `/api/v1/map/supply-points/{id}/position`
Quick position-only update (for drag-to-reposition). Accepts same GPS or MGRS body.

#### DELETE `/api/v1/map/supply-points/{id}`
Soft-delete (mark inactive). **RBAC**: admin only.

#### POST `/api/v1/map/routes`
Create a new route.

Request:
```json
{
  "name": "ASR PHOENIX",
  "route_type": "ASR",
  "status": "OPEN",
  "waypoints": [
    { "latitude": 33.2700, "longitude": -117.3100, "label": "SP 1" },
    { "latitude": 33.2800, "longitude": -117.3250 },
    { "latitude": 33.2900, "longitude": -117.3400, "label": "CP BRAVO" },
    { "latitude": 33.3000, "longitude": -117.3500, "label": "RP 1" }
  ]
}
```

Or with MGRS:
```json
{
  "waypoints": [
    { "mgrs": "11SMS8380700", "label": "SP 1" },
    { "mgrs": "11SMS8240800" },
    { "mgrs": "11SMS8110911", "label": "CP BRAVO" }
  ]
}
```

Backend: convert all waypoints to have both lat/lon and MGRS, build a PostGIS LINESTRING from the waypoints.

**RBAC**: S-3 and above at regiment/group level or higher.

#### PUT `/api/v1/map/routes/{id}`
Update route (status, waypoints, restrictions).

#### GET `/api/v1/map/nearby?lat=X&lon=X&radius_km=5`
OR: `GET /api/v1/map/nearby?mgrs=11SMS8090950&radius_km=5`

Returns all entities within the given radius, grouped by type. Uses PostGIS `ST_DWithin`.

### Update Existing GET Endpoints

Update all existing map GET endpoints (`/map/units`, `/map/convoys`, `/map/supply-points`, `/map/routes`, `/map/all`) to include `mgrs` in every response object that has coordinates. For convoys, include MGRS for origin, destination, and current position.

## Frontend Changes

### New Files to Create

```
frontend/src/
├── components/
│   └── map/
│       ├── MapContextMenu.tsx          # Right-click menu
│       ├── placement/
│       │   ├── PlaceEntityModal.tsx     # Modal for placing entities
│       │   ├── CoordinateInput.tsx      # GPS + MGRS input component
│       │   └── DraggableMarker.tsx      # Draggable marker for repositioning
│       └── detail/
│           ├── DetailPanel.tsx          # Slide-out right panel wrapper
│           ├── UnitDetailPanel.tsx      # Full unit details
│           ├── ConvoyDetailPanel.tsx    # Full convoy details
│           ├── SupplyPointDetailPanel.tsx
│           ├── RouteDetailPanel.tsx
│           └── AlertDetailPanel.tsx
├── hooks/
│   └── useMGRS.ts                      # MGRS conversion hook
└── utils/
    └── coordinates.ts                  # Client-side MGRS/GPS utils
```

### Coordinate Utilities (`frontend/src/utils/coordinates.ts`)

```typescript
import mgrs from 'mgrs';

export function latLonToMGRS(lat: number, lon: number): string {
  return mgrs.forward([lon, lat], 5); // 5 = 1m precision
}

export function mgrsToLatLon(mgrsStr: string): { lat: number; lon: number } {
  const [lon, lat] = mgrs.toPoint(mgrsStr.trim().replace(/\s/g, ''));
  return { lat, lon };
}

export function isValidMGRS(str: string): boolean {
  try {
    mgrs.toPoint(str.trim().replace(/\s/g, ''));
    return true;
  } catch {
    return false;
  }
}

export function formatCoords(lat: number, lon: number): string {
  return `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
}

export function formatMGRS(lat: number, lon: number): string {
  return latLonToMGRS(lat, lon);
}
```

### Coordinate Input Component (`CoordinateInput.tsx`)

Reusable component for entering coordinates anywhere in the app:

```
┌──────────────────────────────────────────┐
│  Format:  (●) GPS   ( ) MGRS            │
│                                          │
│  Latitude:   [ 33.295000_______ ]        │
│  Longitude:  [ -117.342000_____ ]        │
│                                          │
│  MGRS:       11SMS8090950       [📋]     │
│              (auto-computed)             │
│                                          │
│  [🗺️ Drag marker to fine-tune]           │
└──────────────────────────────────────────┘
```

When user selects MGRS mode:
```
┌──────────────────────────────────────────┐
│  Format:  ( ) GPS   (●) MGRS            │
│                                          │
│  MGRS:       [ 11SMS8090950___ ]         │
│                                          │
│  GPS:        33.295000, -117.342000 [📋] │
│              (auto-computed)             │
│                                          │
│  [🗺️ Drag marker to fine-tune]           │
└──────────────────────────────────────────┘
```

Key behaviors:
- Switching format mode swaps which fields are editable vs auto-computed
- Auto-conversion happens on blur or Enter key
- Invalid input shows red border + error message (e.g., "Invalid MGRS format")
- Copy button copies both formats to clipboard
- Accepts paste in either format and auto-detects
- Also accepts common GPS formats: `33°17'42"N 117°20'31"W` or `33 17.700N 117 20.520W` — parse into decimal degrees

### Right-Click Context Menu (`MapContextMenu.tsx`)

Listen for `contextmenu` event on the Leaflet map. When fired, show a floating menu at the click point:

```
┌────────────────────────────────────┐
│  33.2950, -117.3420                │
│  MGRS: 11SMS8090950                │
├────────────────────────────────────┤
│  📍 Place Unit Here                │  ← if role >= S-3/admin
│  📦 Add Supply Point Here          │  ← if role >= S-4/admin
│  🔧 Add Maintenance Site Here      │  ← if role >= S-4/admin
│  🛬 Add LZ / FARP Here             │  ← if role >= S-3/admin
├────────────────────────────────────┤
│  📋 Copy Coordinates               │  ← always
│  📐 Measure Distance               │  ← always
│  🔍 What's Nearby (5km)            │  ← always
└────────────────────────────────────┘
```

- GPS and MGRS shown at the top for the clicked location
- Menu items filtered by user's RBAC role
- **"Copy Coordinates"** — copies both lines to clipboard:
  ```
  33.2950, -117.3420
  MGRS: 11SMS8090950
  ```
- **"Measure Distance"** — enters a mode where user clicks a second point. Show a line between the two points with distance (km + miles) and grid azimuth. Click "Done" or press Escape to exit measurement mode.
- **"What's Nearby"** — calls `GET /api/v1/map/nearby?lat=33.295&lon=-117.342&radius_km=5` and shows results in a popup grouped by type.
- Clicking any placement option opens `PlaceEntityModal` with coordinates pre-filled from the right-click location.

### Place Entity Modal (`PlaceEntityModal.tsx`)

Opens when user selects a placement action from the context menu. Two modes depending on what's being placed:

**Place Unit mode:**
- Dropdown to select which unit to place (shows units the user has permission to manage)
- Already-placed units show current position as hint text in the dropdown
- `CoordinateInput` pre-filled with the right-click location
- A `DraggableMarker` appears on the map at the entered coords — user can drag it to fine-tune
- Dragging the marker updates the coordinate fields in real time
- "Place Unit" button saves via `POST /api/v1/map/units/{unit_id}/position`

**Add Supply Point mode:**
- Name field
- Type dropdown (LOG_BASE, SUPPLY_POINT, FARP, LZ, WATER_POINT, AMMO_SUPPLY_POINT, MAINTENANCE_COLLECTION_POINT)
- Parent unit dropdown
- Status dropdown (ACTIVE, PLANNED, INACTIVE)
- Capacity notes textarea
- `CoordinateInput` pre-filled
- DraggableMarker on map
- "Create Supply Point" saves via `POST /api/v1/map/supply-points`

**Add LZ/FARP mode:** Same as supply point but with type pre-selected.

### Draggable Marker (`DraggableMarker.tsx`)

A Leaflet marker component that supports drag-to-reposition:

```typescript
interface DraggableMarkerProps {
  position: [number, number];       // [lat, lon]
  onPositionChange: (lat: number, lon: number) => void;
  showGhostLine?: boolean;          // Show line from original position
  originalPosition?: [number, number];
}
```

- Uses Leaflet's `draggable: true` marker option
- On `dragend`, fires `onPositionChange` with new coordinates
- If `showGhostLine` is true, renders a dashed line from original position to current position
- Marker pulses briefly when dropped (CSS animation)

### Detail Panel (`DetailPanel.tsx`)

A slide-out panel that opens on the **right side** of the map when any entity is clicked. The map viewport shifts left to accommodate (don't cover the map — resize it).

```
┌─────────────────────────────┬──────────────────────────────────────┐
│                             │  ═══ ALPHA CO, 1/1 MARINES ═══ [X] │
│                             │  [MIL-STD Symbol]  A/1/1            │
│                             │                                     │
│                             │  📍 33.3012, -117.3542              │
│       MAP                   │  MGRS: 11SMS8430514                 │
│     (resized)               │  Source: TAK | 5 min ago            │
│                             │  [📋 Copy] [✏️ Edit Position]       │
│                             ├─────────────────────────────────────┤
│                             │  [Supply] [Equip] [Personnel] [Hx] │
│                             ├─────────────────────────────────────┤
│                             │                                     │
│                             │  ... tabbed content ...             │
│                             │                                     │
│                             │  [View Full Dashboard →]            │
└─────────────────────────────┴──────────────────────────────────────┘
```

Panel width: ~400px on desktop, full-screen overlay on mobile.
Close: X button, Escape key, or click empty map space.

### Unit Detail Panel (`UnitDetailPanel.tsx`)

Shows comprehensive unit data in tabs:

**Supply Tab** (default):
- Overall status indicator (GREEN/AMBER/RED)
- Each supply class as a row: class name, progress bar, percentage, DOS, status dot
- Below each class: quantity details and last report source/time
- Inbound resupply section: any convoys headed to this unit, with ETA and cargo summary (clickable — pans map to convoy)

**Equipment Tab**:
- Table: Equipment Type | On-Hand | MC | NMC | MC% | Status
- Color-code rows below readiness threshold
- Roll-up readiness percentage at top

**Personnel Tab**:
- T/O strength vs assigned vs present-for-duty
- Key personnel status (CO, XO, 1stSgt)
- Casualty summary if any

**History Tab**:
- Scrollable timeline of recent events for this unit
- Each entry: timestamp, event type icon, description, source (mIRC/TAK/Excel/Manual)
- Examples: "0745 — Supply status received via TAK", "0630 — LOGSTAT submitted via Excel", "1030 — Position updated by SSgt Jones (manual)"

**Edit Position button**:
- When clicked, the unit's marker on the map becomes draggable
- Coordinate fields in the panel become editable (GPS or MGRS)
- Two buttons appear: "Save Position" and "Cancel"
- Saving calls `POST /api/v1/map/units/{id}/position`
- Cancel snaps marker back to original position

### Convoy Detail Panel (`ConvoyDetailPanel.tsx`)

**Cargo Tab** (default):
- Vehicle manifest: type, count, cargo description per vehicle
- Total weight / total fuel
- Cargo summary

**Route Tab**:
- Origin and destination with coordinates (GPS + MGRS) and names
- Progress bar with percentage and km remaining
- Current speed and heading
- "Zoom to Full Route" button — fits map to show entire convoy route

**Timeline Tab**:
- Departure time, checkpoint arrivals, projected vs actual pace
- ETA and whether on schedule

### Supply Point Detail Panel (`SupplyPointDetailPanel.tsx`)

- Type, status, operating unit
- Coordinates (GPS + MGRS)
- Current inventory levels (if available from ingested data)
- Throughput stats (convoys in/out in last 24h)
- Active convoys to/from this point (clickable)
- Capacity notes
- Edit Position button (same drag-to-reposition flow)

### Route Detail Panel (`RouteDetailPanel.tsx`)

- Route name, type (MSR/ASR), status
- Total length
- Named waypoints with coordinates
- Current traffic (convoys using this route right now, clickable)
- Restrictions if any
- "Highlight on Map" button — thickens and brightens the route polyline
- Edit Route button — allows adding/removing/repositioning waypoints

### Cursor Coordinate Display

Add a fixed overlay at the **bottom-left** of the map that shows the cursor's current position as the mouse moves:

```
┌──────────────────────────────────────┐
│  33.295432, -117.342187              │
│  MGRS: 11SMS8090950                  │
└──────────────────────────────────────┘
```

Updates on `mousemove` event. Semi-transparent dark background for readability over any basemap.

### Search Bar Enhancement

Update the existing search bar (top-left) to also accept:
- **GPS coordinates**: typing `33.3012, -117.3542` pans the map to that location and drops a temporary pin
- **MGRS grid reference**: typing `11SMS8430514` converts to lat/lon and pans there
- Auto-detect whether the input is a name search, GPS, or MGRS based on pattern matching

### Update All Existing Popups

If any of the existing layer components (UnitLayer, ConvoyLayer, etc.) currently use small Leaflet popups on click, **replace them** with the new slide-out DetailPanel. The click handler on each layer should:
1. Set the selected entity in a shared state (Zustand store or React context)
2. DetailPanel reads that state and renders the appropriate sub-panel

Keep hover tooltips as lightweight name + status summary. The detailed data moves to the click panel.

### RBAC Integration

The current user's role (available from the auth context / Zustand store) determines what's shown:

| Feature | Required Role |
|---------|--------------|
| View map, click details, copy coords, measure | Any authenticated user |
| Place/move own unit position | Unit CO/XO or parent S-3+ |
| Place/move subordinate units | Parent unit S-3+ |
| Create/edit supply points | S-4+ at operating unit level |
| Create/edit routes | S-3+ at regiment level or higher |
| Create/edit LZ/FARP | S-3+ |
| Delete entities | Admin only |

Hide placement options in the context menu and edit buttons in the detail panel if the user lacks permission. Don't just disable them — hide them entirely so the UI stays clean.

**TAK Override Rule**: If a unit's position comes from TAK (automatic), and a user manually overrides it:
- Store `position_override = true` on the location record
- Show a small "📌 Manual Override" badge on the unit's map marker
- In the detail panel, show both the manual position and the last TAK-reported position
- Add a "Release to TAK" button that clears the override and resumes automatic TAK updates

## Seed Data Updates

Update the existing seed data to include MGRS values for every coordinate. Use the `mgrs` npm package in the seed script:

```javascript
import mgrs from 'mgrs';

function toMGRS(lat, lon) {
  return mgrs.forward([lon, lat], 5);
}

// Example: when seeding a unit position
{ latitude: 33.3012, longitude: -117.3542, mgrs: toMGRS(33.3012, -117.3542) }
```

## Build Order

1. Backend: Create `coordinates.py` utility
2. Backend: Add `mgrs` column migration to all location-bearing models
3. Backend: Create the new write endpoints (POST/PUT for positions, supply points, routes)
4. Backend: Update existing GET endpoints to include `mgrs` in responses
5. Backend: Add the `/nearby` spatial query endpoint
6. Frontend: Create `coordinates.ts` utility and `useMGRS` hook
7. Frontend: Build `CoordinateInput` component
8. Frontend: Build `DraggableMarker` component
9. Frontend: Build `DetailPanel` wrapper + all sub-panels (Unit, Convoy, SupplyPoint, Route, Alert)
10. Frontend: Refactor existing layer click handlers to open DetailPanel instead of small popups
11. Frontend: Build `MapContextMenu` with right-click handler
12. Frontend: Build `PlaceEntityModal`
13. Frontend: Add cursor coordinate display overlay (bottom-left)
14. Frontend: Enhance search bar to accept GPS/MGRS input
15. Frontend: Update seed data with MGRS values
16. Test: Right-click → Place Unit → enter MGRS → drag marker → save → verify unit appears
17. Test: Click any entity → detail panel opens → all tabs render → "View Full Dashboard" link works
18. Test: Measure distance between two points
19. Test: Search by MGRS grid reference → map pans to location
