# KEYSTONE — Geospatial Logistics COP (Map View)

Paste this into your Claude Code session that already has the KEYSTONE codebase.

---

## Task

Add a full geospatial map view to KEYSTONE — an interactive map-based Logistics Common Operating Picture (COP) that lets users visually see WHERE everything is: units, supply status at each location, convoys in transit along routes, supply points, maintenance sites, and logistics nodes. Think of it as the spatial layer on top of all the data KEYSTONE already ingests.

The map must be **fully interactive** — users with appropriate permissions can **place and reposition units, supply points, and other entities** directly on the map using GPS coordinates, MGRS grid references, or by right-clicking the map. Clicking any entity on the map opens a detail panel with full logistics data. Everything is toggle-able — users control what layers are visible at any given time.

The map should use a real interactive map base layer (satellite/terrain/topo, user-selectable) with military-style symbology overlaid on top.

## Tech Stack Additions

- **Mapping Library:** Leaflet with React-Leaflet (`react-leaflet`)
- **Tile Providers:** OpenStreetMap (default), plus satellite and topo options. Use `leaflet-providers` for easy tile layer switching. In production, tiles would come from a locally-hosted tile server on the deployment network — build the tile source as a configurable setting so it can be pointed at any tile server URL.
- **Military Symbology:** `milsymbol` npm package for MIL-STD-2525 / APP-6 military symbols rendered as SVG icons on the map
- **Coordinate Conversion:** `mgrs` npm package for MGRS ↔ lat/lon conversion. Support both GPS (decimal degrees) and MGRS input anywhere coordinates are entered.
- **Real-time Updates:** Map data refreshes on the same 60-second polling interval as the rest of the dashboard
- **Geospatial Queries:** PostGIS extension on PostgreSQL for spatial queries (e.g., "all units within 50km of this point")
- **Context Menus:** `react-leaflet` event handlers for right-click context menus

## New Files

### Backend

```
backend/app/
├── api/
│   └── map.py                    # Map data API endpoints (GET + POST/PUT for placement)
├── models/
│   ├── location.py               # Location/position tracking model
│   └── supply_point.py           # Supply points, FARPs, LZs, etc.
├── schemas/
│   └── map.py                    # Map-specific request/response schemas
└── utils/
    └── coordinates.py            # MGRS ↔ lat/lon conversion utilities
```

### Frontend

```
frontend/src/
├── components/
│   └── map/
│       ├── LogisticsMap.tsx       # Main map component (Leaflet instance)
│       ├── MapControls.tsx        # Layer toggles, base map selector, filters
│       ├── MapContextMenu.tsx     # Right-click context menu (add unit, add supply point, etc.)
│       ├── layers/
│       │   ├── UnitLayer.tsx      # Unit positions with supply status indicators
│       │   ├── ConvoyLayer.tsx    # Active convoys with route lines and movement
│       │   ├── SupplyPointLayer.tsx   # Fixed logistics nodes (supply points, FARPs, LZs)
│       │   ├── MaintenanceLayer.tsx   # Maintenance collection points and sites
│       │   ├── RouteLayer.tsx     # MSRs, ASRs, and supply routes
│       │   └── AlertLayer.tsx     # Geographic alert indicators (critical shortfalls at location)
│       ├── symbols/
│       │   ├── MilSymbol.tsx      # Wrapper for milsymbol library rendering
│       │   └── symbolConfig.ts   # Symbol type mappings (unit type → MIL-STD-2525 SIDC)
│       ├── popups/
│       │   ├── UnitPopup.tsx      # Click a unit → full supply/readiness detail panel
│       │   ├── ConvoyPopup.tsx    # Click a convoy → cargo, origin, destination, ETA
│       │   ├── SupplyPointPopup.tsx  # Click a supply node → throughput, inventory
│       │   ├── RoutePopup.tsx     # Click a route → name, status, restrictions
│       │   └── AlertPopup.tsx     # Click an alert → threshold, current value, affected unit
│       ├── placement/
│       │   ├── PlaceEntityModal.tsx      # Modal for placing/editing entity position
│       │   ├── CoordinateInput.tsx       # Coordinate entry component (GPS + MGRS)
│       │   ├── EntityTypeSelector.tsx    # Select what type of entity to place
│       │   └── DraggableMarker.tsx       # Draggable marker for visual repositioning
│       ├── detail/
│       │   ├── DetailPanel.tsx           # Slide-out right panel for entity details
│       │   ├── UnitDetailPanel.tsx       # Full unit detail (supply, readiness, equipment, history)
│       │   ├── ConvoyDetailPanel.tsx     # Full convoy detail (cargo, route, timeline)
│       │   ├── SupplyPointDetailPanel.tsx # Full supply point detail (inventory, throughput)
│       │   └── RouteDetailPanel.tsx      # Route detail (status, traffic, convoys using it)
│       └── MapLegend.tsx          # Dynamic legend showing active layers and symbology
├── pages/
│   └── MapPage.tsx               # Full-page map view (new route: /map)
├── hooks/
│   ├── useMapData.ts             # Hook for fetching and managing map data
│   └── useMGRS.ts                # Hook for MGRS ↔ lat/lon conversion
└── utils/
    └── coordinates.ts            # Client-side MGRS/GPS conversion utilities
```

## Database Changes

### Add PostGIS

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### Location Model (`location.py`)

Track the last known position of every entity. This is populated from:
- TAK CoT events (have lat/lon natively)
- Unit standing locations (configured in admin — e.g., "1/1 is at Camp Horno, 33.3012, -117.3542")
- Convoy waypoints (origin and destination coordinates, plus in-transit position updates from mIRC/TAK)
- Supply point locations (configured in admin — e.g., "FARP Eagle is at 33.2845, -117.3201")
- **Manual placement by users** (placed on the map via right-click, GPS entry, or MGRS entry)

Fields:
```
id: UUID
entity_type: ENUM('UNIT', 'CONVOY', 'SUPPLY_POINT', 'MAINTENANCE_SITE', 'LZ', 'FARP', 'ROUTE_WAYPOINT')
entity_id: UUID (FK → depends on entity_type: unit.id, convoy.id, etc.)
name: String (display name)
latitude: Float
longitude: Float
mgrs: String (MGRS grid reference, auto-calculated from lat/lon on save)
altitude: Float (nullable)
heading: Float (nullable — for convoys, degrees from north)
speed_kph: Float (nullable — for convoys)
position_source: ENUM('TAK', 'CONFIGURED', 'MIRC_PARSED', 'MANUAL')
position_accuracy_m: Float (nullable — CEP from TAK, null for configured)
placed_by: FK → User (nullable — who manually placed/updated this position)
last_updated: DateTime
geometry: GEOMETRY(POINT, 4326)  # PostGIS point for spatial queries
```

### Add location fields to existing models

Add `latitude`, `longitude`, `mgrs` columns to:
- `Unit` model — standing/configured location
- `Transportation` model (convoy) — current position, plus `origin_lat/lon` and `dest_lat/lon`

### Supply Point Model (new, `supply_point.py`)

```
id: UUID
name: String (e.g., "LOG BASE CHARLIE", "FARP EAGLE", "LZ ROBIN")
point_type: ENUM('LOG_BASE', 'SUPPLY_POINT', 'FARP', 'LZ', 'BEACH', 'PORT', 'AMMO_SUPPLY_POINT', 'WATER_POINT', 'MAINTENANCE_COLLECTION_POINT')
latitude: Float
longitude: Float
mgrs: String (auto-calculated)
geometry: GEOMETRY(POINT, 4326)
parent_unit_id: FK → Unit (which unit operates this point)
status: ENUM('ACTIVE', 'PLANNED', 'INACTIVE')
capacity_notes: Text (free text description of throughput/capacity)
created_by: FK → User
updated_by: FK → User
created_at: DateTime
updated_at: DateTime
```

### Route Model (new)

```
id: UUID
name: String (e.g., "MSR TAMPA", "ASR DETROIT")
route_type: ENUM('MSR', 'ASR', 'CONVOY_ROUTE', 'AIR_CORRIDOR')
status: ENUM('OPEN', 'RESTRICTED', 'CLOSED')
geometry: GEOMETRY(LINESTRING, 4326)  # PostGIS linestring for the route path
waypoints: JSON  # Array of {lat, lon, mgrs, label} for named waypoints
restrictions: Text (nullable — e.g., "No HMMWV+ width vehicles 0600-1800")
created_by: FK → User
updated_by: FK → User
```

## API Endpoints (`api/map.py`)

### Read Endpoints

#### GET `/api/v1/map/units`
Returns all units with their positions and a supply status summary (worst status across all classes). Respects RBAC — user only sees their unit and subordinates.

Response:
```json
[
  {
    "unit_id": "uuid",
    "name": "Alpha Co, 1/1",
    "abbreviation": "A/1/1",
    "echelon": "CO",
    "latitude": 33.3012,
    "longitude": -117.3542,
    "mgrs": "11SMS8430514",
    "position_source": "TAK",
    "last_position_update": "2026-03-03T14:30:00Z",
    "placed_by": null,
    "supply_status": "AMBER",
    "readiness_status": "GREEN",
    "worst_supply_class": "V",
    "worst_dos": 1.8,
    "personnel_strength": 182,
    "equipment_on_hand": 48,
    "equipment_mission_capable": 42,
    "symbol_sidc": "SFGPUCI----A"
  }
]
```

#### GET `/api/v1/map/convoys`
Returns all active convoys with route geometry and status.

Response:
```json
[
  {
    "convoy_id": "uuid",
    "name": "Convoy 7A",
    "origin": { "name": "LOG BASE CHARLIE", "lat": 33.28, "lon": -117.32, "mgrs": "11SMS8200800" },
    "destination": { "name": "1/1 BN CP", "lat": 33.30, "lon": -117.35, "mgrs": "11SMS7931022" },
    "current_position": { "lat": 33.29, "lon": -117.33, "mgrs": "11SMS8110911" },
    "route_geometry": [[33.28, -117.32], [33.285, -117.325], [33.29, -117.33]],
    "status": "EN_ROUTE",
    "vehicle_count": 8,
    "vehicles": [
      { "type": "MTVR", "count": 4, "cargo": "CL I (MREs, Water)" },
      { "type": "M970", "count": 2, "cargo": "CL III (JP-8)" },
      { "type": "HMMWV", "count": 2, "cargo": "Security" }
    ],
    "cargo_summary": "CL I, CL III resupply for 1/1",
    "total_weight_lbs": 48000,
    "departure_time": "2026-03-03T11:00:00Z",
    "eta": "2026-03-03T14:00:00Z",
    "speed_kph": 35,
    "heading": 315,
    "convoy_commander": "SSgt Martinez"
  }
]
```

#### GET `/api/v1/map/supply-points`
Returns all logistics nodes/supply points.

#### GET `/api/v1/map/routes`
Returns configured MSRs/ASRs as line geometries with status (OPEN/RESTRICTED/CLOSED).

#### GET `/api/v1/map/alerts/geo`
Returns active alerts that have a geographic component (critical supply shortfall at a unit location, delayed convoy, etc.) — displayed as warning icons on the map.

#### GET `/api/v1/map/all`
Combined endpoint that returns all map layers in a single request (reduces round trips). Accepts `?layers=units,convoys,supply_points,routes,alerts` query param to select which layers to fetch.

### Write Endpoints (RBAC-Protected)

These endpoints allow authorized users to place, move, and manage entities on the map.

#### POST `/api/v1/map/units/{unit_id}/position`
Set or update a unit's position. Accepts GPS or MGRS coordinates. RBAC: Only unit commanders and above, or S-3/S-4 of parent unit and above, or admin.

Request:
```json
{
  "latitude": 33.3012,
  "longitude": -117.3542,
  "position_source": "MANUAL"
}
```

OR (MGRS input):
```json
{
  "mgrs": "11SMS8430514",
  "position_source": "MANUAL"
}
```

The backend auto-converts between GPS and MGRS — store both. If MGRS is provided, convert to lat/lon. If lat/lon is provided, convert to MGRS. Always validate the coordinates are within a reasonable range.

#### POST `/api/v1/map/supply-points`
Create a new supply point. RBAC: S-4 and above, or admin.

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

#### PUT `/api/v1/map/supply-points/{id}`
Update a supply point (including position). RBAC: same as create.

#### DELETE `/api/v1/map/supply-points/{id}`
Remove a supply point. RBAC: admin only. Soft-delete (mark inactive, don't destroy data).

#### PUT `/api/v1/map/convoys/{convoy_id}/position`
Update a convoy's current position. Primarily used by automated TAK/mIRC ingestion, but also available for manual update.

#### POST `/api/v1/map/routes`
Create a new route (MSR/ASR). Accepts an array of waypoints in GPS or MGRS.

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
  ],
  "restrictions": null
}
```

OR with MGRS waypoints:
```json
{
  "name": "ASR PHOENIX",
  "route_type": "ASR",
  "status": "OPEN",
  "waypoints": [
    { "mgrs": "11SMS8380700", "label": "SP 1" },
    { "mgrs": "11SMS8240800" },
    { "mgrs": "11SMS8110911", "label": "CP BRAVO" },
    { "mgrs": "11SMS7931022", "label": "RP 1" }
  ]
}
```

#### PUT `/api/v1/map/routes/{id}`
Update route (status, waypoints, restrictions).

### Coordinate Conversion Utility (Backend)

```python
# backend/app/utils/coordinates.py
import mgrs

converter = mgrs.MGRS()

def latlon_to_mgrs(lat: float, lon: float, precision: int = 5) -> str:
    """Convert decimal lat/lon to MGRS string. Precision 5 = 1m accuracy."""
    return converter.toMGRS(lat, lon, MGRSPrecision=precision)

def mgrs_to_latlon(mgrs_string: str) -> tuple[float, float]:
    """Convert MGRS string to (lat, lon) tuple."""
    lat, lon = converter.toLatLon(mgrs_string)
    return float(lat), float(lon)

def validate_coordinates(lat: float | None, lon: float | None, mgrs_str: str | None) -> tuple[float, float, str]:
    """Validate and normalize coordinates. Returns (lat, lon, mgrs).
    Accepts either lat/lon OR mgrs. Converts whichever is provided to the other."""
    if mgrs_str:
        lat, lon = mgrs_to_latlon(mgrs_str)
        return lat, lon, mgrs_str
    elif lat is not None and lon is not None:
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValueError(f"Invalid coordinates: lat={lat}, lon={lon}")
        mgrs_str = latlon_to_mgrs(lat, lon)
        return lat, lon, mgrs_str
    else:
        raise ValueError("Must provide either lat/lon or MGRS string")
```

Install backend dependency: `pip install mgrs`

## Frontend — Interactive Placement Features

### Right-Click Context Menu (`MapContextMenu.tsx`)

When a user right-clicks anywhere on the map, show a context menu at the click location with options based on their RBAC role:

```
┌──────────────────────────────┐
│  33.2950, -117.3420          │
│  MGRS: 11SMS8090950          │
├──────────────────────────────┤
│  📍 Place Unit Here          │   ← Only if role >= S-3 or admin
│  📦 Add Supply Point Here    │   ← Only if role >= S-4 or admin
│  🔧 Add Maintenance Site     │   ← Only if role >= S-4 or admin
│  🛬 Add LZ / FARP            │   ← Only if role >= S-3 or admin
│  📋 Copy Coordinates          │   ← Always available
│  📐 Measure Distance          │   ← Always available
├──────────────────────────────┤
│  🔍 What's Nearby (5km)      │   ← Always available
└──────────────────────────────┘
```

The context menu always shows the GPS coordinates AND MGRS grid reference of the right-click location.

**"Copy Coordinates"** copies both formats to clipboard:
```
33.2950, -117.3420
11SMS8090950
```

**"Measure Distance"** activates a distance measurement mode — user clicks two points and sees the distance in km and miles, plus the grid azimuth.

**"What's Nearby"** runs a spatial query showing all entities within 5km of the clicked point, grouped by type.

### Place Entity Modal (`PlaceEntityModal.tsx`)

When a user selects "Place Unit Here" (or any placement option) from the context menu, open a modal:

```
┌─────────────────────────────────────────────┐
│  PLACE UNIT ON MAP                      [X] │
├─────────────────────────────────────────────┤
│                                             │
│  Unit:  [▼ Select Unit________________]     │
│         Dropdown of unplaced units or       │
│         all units (to reposition)           │
│                                             │
│  ─── Location ────────────────────────────  │
│                                             │
│  Format:  (●) GPS   ( ) MGRS               │
│                                             │
│  Latitude:   [ 33.295000  ]                 │
│  Longitude:  [ -117.342000 ]                │
│                                             │
│  — OR —                                     │
│                                             │
│  MGRS:       [ 11SMS8090950 ]               │
│                                             │
│  ─── Fine-Tune ──────────────────────────   │
│                                             │
│  [🗺️ Drag marker on map to adjust]          │
│  (A draggable marker appears on the map     │
│   at the entered coordinates. User can      │
│   drag it to fine-tune the position.        │
│   Coordinate fields update live.)           │
│                                             │
├─────────────────────────────────────────────┤
│              [Cancel]  [Place Unit]         │
└─────────────────────────────────────────────┘
```

Key behaviors:
- **Pre-populated coordinates** from the right-click location
- **Live coordinate sync**: Editing GPS fields auto-updates MGRS field and vice versa. Dragging the marker updates both.
- **DraggableMarker**: A Leaflet marker appears on the map that the user can drag. As they drag, the coordinate fields in the modal update in real time.
- **Validation**: Highlight invalid coordinates in red. Validate MGRS format before conversion.
- **Unit dropdown**: Shows all units the user has permission to manage. Already-placed units show their current location as hint text.

The same modal pattern applies for supply points, maintenance sites, LZs/FARPs — just with different entity-specific fields.

### Coordinate Input Component (`CoordinateInput.tsx`)

A reusable component for entering coordinates that appears in multiple places (placement modal, search, convoy waypoints, etc.):

```tsx
interface CoordinateInputProps {
  value: { lat: number; lon: number; mgrs: string } | null;
  onChange: (coords: { lat: number; lon: number; mgrs: string }) => void;
  showDragHint?: boolean;  // "Drag marker to adjust"
  label?: string;
}
```

Features:
- Toggle between GPS and MGRS input modes
- Auto-conversion between formats on blur/enter
- Validation with error messages (e.g., "Invalid MGRS: check grid zone designator")
- Copy-to-clipboard button for current coordinates
- Optional "paste coordinates" that accepts either format and auto-detects which
- Accepts common GPS formats: decimal degrees (33.2950, -117.3420), degrees-minutes (33°17'42"N, 117°20'31"W), or decimal minutes (33 17.700N, 117 20.520W)

### Draggable Marker (`DraggableMarker.tsx`)

A Leaflet marker that the user can drag to reposition entities:

- Renders at the current entity position
- When dragged, fires `onPositionChange(lat, lon)` continuously
- On drag end, shows a confirmation: "Move [entity name] to [new coords]? [Confirm] [Cancel]"
- Animated snap: marker briefly pulses when dropped
- Ghost marker: shows the original position with a dashed line to the new position during drag

### Entity Repositioning (Drag to Move)

For entities the user has permission to edit, enable drag-to-reposition directly on the map:

1. **Click an entity** → opens detail panel (see below)
2. **Click "Edit Position" button** in the detail panel → entity marker becomes draggable
3. **Drag the marker** to new location
4. **Coordinate fields update** in the detail panel as the user drags
5. **User can also type new coordinates** (GPS or MGRS) in the detail panel and the marker moves
6. **"Save Position"** commits the change via the API
7. **"Cancel"** snaps the marker back to its original position

## Frontend — Click-to-Detail Feature

### Detail Panel (`DetailPanel.tsx`)

When a user **clicks any entity on the map**, a **slide-out detail panel** opens on the right side of the screen (not a small popup — a full panel with room for comprehensive data). The map shifts left slightly to accommodate the panel.

The panel has:
- **Header**: Entity name, type icon, and status indicator
- **Coordinate bar**: GPS + MGRS, with copy buttons and "Edit Position" button (if permitted)
- **Tabbed content**: Different tabs depending on entity type
- **Close button**: X in top-right corner, or click empty map space to close
- **"View Full Dashboard" link**: Navigates to the entity's page in the main tabular dashboard

### Unit Detail Panel (`UnitDetailPanel.tsx`)

When clicking a unit on the map, the detail panel shows:

```
┌──────────────────────────────────────────────┐
│ ═══ ALPHA CO, 1st BN, 1st MARINES ═══  [X]  │
│ [MIL-STD-2525 Symbol]  A/1/1                 │
│                                              │
│ 📍 33.3012, -117.3542 | MGRS: 11SMS8430514  │
│ Source: TAK | Updated: 5 min ago             │
│ [📋 Copy] [✏️ Edit Position]                  │
├──────────────────────────────────────────────┤
│ [Supply] [Equipment] [Personnel] [History]   │
├──────────────────────────────────────────────┤
│                                              │
│ ── SUPPLY STATUS ─── Overall: ⬤ AMBER ───── │
│                                              │
│ Class I  (Food/Water)                        │
│ ████████████████░░░░  80%    2.1 DOS   🟢   │
│ 14,400 MREs | 2,800 gal water               │
│ Last report: 0630 today via mIRC             │
│                                              │
│ Class III (Fuel)                              │
│ ████████░░░░░░░░░░░░  45%    1.2 DOS   🔴   │
│ 3,200 gal JP-8 | 800 gal diesel             │
│ Last report: 0745 today via TAK              │
│ ⚠️ Below 1.5 DOS threshold                   │
│                                              │
│ Class V  (Ammunition)                        │
│ ████████████░░░░░░░░  60%    2.8 DOS   🟡   │
│ 5.56mm: 42,000 rds | 7.62mm: 8,400 rds     │
│ Last report: 0630 today via Excel            │
│                                              │
│ Class VIII (Medical)                         │
│ ████████████████░░░░  75%    3.0 DOS   🟢   │
│ CL VIII complete                             │
│                                              │
│ Class IX (Repair Parts)                      │
│ ██████████████░░░░░░  68%    2.5 DOS   🟢   │
│                                              │
│ ── INBOUND RESUPPLY ─────────────────────── │
│ 🚛 Convoy 7A — CL I, CL III                 │
│    ETA: 45 min | 12 vehicles                 │
│    [Click to view convoy on map →]           │
│                                              │
│ [View Full Dashboard →]                      │
└──────────────────────────────────────────────┘
```

**Equipment tab**: Shows equipment readiness table (type, on-hand, MC, NMC, MC%), same data as the dashboard equipment view but scoped to this unit.

**Personnel tab**: Strength numbers (T/O vs assigned vs present for duty), casualty summary if applicable.

**History tab**: Timeline of recent events for this unit — supply reports received, convoy arrivals, status changes, position updates. Shows source (mIRC, TAK, Excel, manual) and timestamp for each.

### Convoy Detail Panel (`ConvoyDetailPanel.tsx`)

When clicking a convoy on the map:

```
┌──────────────────────────────────────────────┐
│ ═══ CONVOY 7A ═══════════════════════  [X]   │
│ Status: ⬤ EN ROUTE                           │
│                                              │
│ 📍 Current: 33.2900, -117.3300               │
│    MGRS: 11SMS8110911                        │
│    Speed: 35 kph | Heading: 315° (NW)        │
│    Updated: 2 min ago via TAK                │
├──────────────────────────────────────────────┤
│ [Cargo] [Vehicles] [Route] [Timeline]        │
├──────────────────────────────────────────────┤
│                                              │
│ ── MOVEMENT ─────────────────────────────── │
│                                              │
│ From: LOG BASE CHARLIE                       │
│       33.2845, -117.3201                     │
│       Departed: 1100 today                   │
│                                              │
│ To:   1/1 BN CP                              │
│       33.3012, -117.3542                     │
│       ETA: 1400 (45 min)                     │
│                                              │
│ Progress: ████████████░░░░░░  65%            │
│ Distance: 8.2 km total | 2.9 km remaining   │
│                                              │
│ ── CARGO MANIFEST ───────────────────────── │
│                                              │
│ CL I  — 4,800 MREs, 1,200 gal water         │
│ CL III — 2,400 gal JP-8                      │
│ Total weight: 48,000 lbs                     │
│                                              │
│ ── VEHICLES ─────────────────────────────── │
│ 4x MTVR (cargo) | 2x M970 (fuel)            │
│ 2x HMMWV (security)                          │
│ Commander: SSgt Martinez                     │
│                                              │
│ [Zoom to Route →] [View Full Dashboard →]    │
└──────────────────────────────────────────────┘
```

**"Zoom to Route"** button: Fits the map viewport to show the entire convoy route from origin to destination, with the convoy's current position highlighted.

**Route tab**: Shows the route on a mini-map within the panel, or highlights the route on the main map with waypoints labeled.

**Timeline tab**: Departure time, checkpoint times, projected vs actual pace, estimated arrival.

### Supply Point Detail Panel (`SupplyPointDetailPanel.tsx`)

When clicking a supply point:

```
┌──────────────────────────────────────────────┐
│ ═══ LOG BASE CHARLIE ════════════════  [X]   │
│ Type: Logistics Support Area (LOG BASE)      │
│ Status: ⬤ ACTIVE                             │
│ Operated by: CLR-1                           │
│                                              │
│ 📍 33.2845, -117.3201 | MGRS: 11SMS8200800  │
│ [📋 Copy] [✏️ Edit Position]                  │
├──────────────────────────────────────────────┤
│                                              │
│ ── CURRENT INVENTORY ────────────────────── │
│                                              │
│ CL I   ████████████████████ 92%  18,000 MREs│
│ CL III ██████████████░░░░░░ 70%  8,400 gal  │
│ CL V   █████████████████░░░ 85%  Full range │
│ CL VIII████████████████████ 95%  Complete    │
│                                              │
│ ── THROUGHPUT (Last 24h) ────────────────── │
│ Convoys dispatched: 6                        │
│ Convoys received: 4                          │
│ Total tonnage moved: 142,000 lbs             │
│                                              │
│ ── ACTIVE CONVOYS ───────────────────────── │
│ 🚛 Convoy 7A → 1/1 BN (en route, ETA 45m)   │
│ 🚛 Convoy 12B → 3/1 BN (planned, departs 2h)│
│ 🚛 Convoy 9D → CLR-1 (delayed)               │
│                                              │
│ ── CAPACITY ─────────────────────────────── │
│ 2x 3000-gal HIPPO water trailers            │
│ Ammo holding area: 4x 20-ft ISO containers  │
│ Fuel farm: 2x 5000-gal bladders             │
│                                              │
│ [View Full Dashboard →]                      │
└──────────────────────────────────────────────┘
```

### Route Detail Panel (`RouteDetailPanel.tsx`)

When clicking a route on the map:

```
┌──────────────────────────────────────────────┐
│ ═══ MSR TAMPA ═══════════════════════  [X]   │
│ Type: Main Supply Route (MSR)                │
│ Status: ⬤ OPEN                               │
│                                              │
│ Length: 14.3 km                               │
│ Waypoints: 6                                 │
│                                              │
│ ── CURRENT TRAFFIC ──────────────────────── │
│ 🚛 Convoy 7A (northbound, km 9.2)            │
│ 🚛 Convoy 9D (southbound, km 3.8, delayed)   │
│                                              │
│ ── RESTRICTIONS ─────────────────────────── │
│ None active                                  │
│                                              │
│ ── LAST 24 HOURS ────────────────────────── │
│ Convoys completed: 8                         │
│ Average transit time: 2h 15m                 │
│ Incidents: 0                                 │
│                                              │
│ [✏️ Edit Route] [Highlight on Map →]          │
└──────────────────────────────────────────────┘
```

## Frontend — Map Component Details

### LogisticsMap.tsx (Main Component)

Full-viewport Leaflet map. Key features:

- **Base map selector** (top-right): Toggle between OpenStreetMap, Satellite, and Topographic tile layers. Tile source URL is configurable via env var `VITE_TILE_SERVER_URL` (default: public OSM tiles for dev; in production, point at a local tile server).
- **Layer control panel** (left sidebar, collapsible): Checkboxes to toggle each data layer on/off:
  - Units (on by default)
  - Supply Status Overlay (on by default — colors unit icons by supply status)
  - Equipment Readiness Overlay (off by default)
  - Active Convoys (on by default)
  - Convoy Routes (on by default)
  - Supply Points / Logistics Nodes (on by default)
  - Maintenance Sites (off by default)
  - MSR/ASR Routes (off by default)
  - Alert Indicators (on by default)
- **Echelon filter**: Same echelon selector as the dashboard — controls which level of detail is shown. At MEF level, show regiment/group icons. At regiment level, show battalion icons. At battalion level, show company icons. User can override to "show all" for max detail.
- **Time slider** (bottom of map): Scrub through historical positions to see how the logistics picture evolved over time (e.g., replay convoy movements over the last 24 hours).
- **Search bar** (top-left): Search for a unit, supply point, or convoy by name — map pans and zooms to it. Also accepts GPS coordinates or MGRS grid references — entering "11SMS8430514" pans to that location.
- **Coordinate display** (bottom-left): Always shows the cursor's current position in both GPS and MGRS format as the mouse moves over the map.
- **Clustering**: At zoomed-out levels, cluster nearby unit icons to prevent overlap. Cluster icon shows count and worst status color. Click to expand.
- **Right-click context menu**: See MapContextMenu section above.

### UnitLayer.tsx

- Render each unit as a MIL-STD-2525 symbol using the `milsymbol` library
- Symbol type based on unit type (infantry, logistics, HQ, etc.)
- Symbol color modifier based on supply/readiness status:
  - GREEN border/glow: All good
  - AMBER border/glow: One or more supply classes at WARNING level
  - RED border/glow: One or more supply classes CRITICAL
- Small badge icons next to the symbol showing:
  - Worst DOS number (e.g., "1.8d" in red text if critical)
  - Readiness percentage if below threshold
- Hover: Show unit name + one-line status
- Click: Open detail panel (not a small popup) with full supply breakdown, readiness, equipment, and history
- Drag (if user has edit permission and is in edit mode): Reposition the unit

### ConvoyLayer.tsx

- Render convoys as directional truck icons moving along route polylines
- Route polyline: dashed line from origin to current position (traveled), solid line from current position to destination (remaining)
- Color: GREEN if on schedule, AMBER if behind ETA, RED if significantly delayed
- Animated movement: icon position interpolates between polling updates for smooth visual movement
- Arrow markers on the route line showing direction of travel
- Click: Open ConvoyDetailPanel with cargo manifest, vehicle breakdown, route, timeline
- Hover: Show convoy name, cargo summary, ETA

### SupplyPointLayer.tsx

- Render supply points as appropriate military symbols (LOG BASE, FARP, LZ, water point, ammo point, etc.)
- Icon size proportional to importance/throughput
- Status color: GREEN (active and operational), AMBER (reduced capacity), RED (non-operational)
- Click: Open SupplyPointDetailPanel with inventory, throughput, capacity, active convoys

### RouteLayer.tsx

- MSRs and ASRs rendered as polylines on the map
- Color by status: GREEN (open), AMBER (restricted), RED (closed)
- Line thickness indicates route importance (MSR thicker than ASR)
- Labels along the route with route name (e.g., "MSR TAMPA")
- Click on a route segment: Open RouteDetailPanel with traffic, restrictions, history
- Waypoint markers at named waypoints (start point, checkpoints, release point)

### AlertLayer.tsx

- Pulsing red/amber circles at geographic locations where critical alerts are active
- Alert icon with exclamation mark
- Click: Open popup with alert details (what threshold was crossed, current value, affected unit)
- Multiple alerts at the same location stack with a count badge

## RBAC for Map Placement

Map placement actions are governed by the existing KEYSTONE RBAC system:

| Action | Minimum Role |
|--------|-------------|
| View map (all layers) | Any authenticated user (respecting unit visibility rules) |
| Copy coordinates | Any authenticated user |
| Measure distance | Any authenticated user |
| Place/move own unit | Unit commander (CO/XO) or parent unit S-3 |
| Place/move subordinate unit | Parent unit S-3 or above |
| Create/edit supply points | S-4 or above at operating unit level |
| Create/edit routes | S-3 or above at regiment/group level or higher |
| Create/edit LZ/FARP | S-3 or above |
| Delete any entity | Admin only |
| Override TAK-sourced position with manual | S-3 or above (manual override gets a flag/note) |

When a manual position override is applied to an entity that also receives TAK updates, the system should:
1. Flag the entity as "manually overridden"
2. Show both the TAK position and manual position on the map (TAK position as a ghost marker)
3. Allow the user to "release to TAK" to resume automatic position updates

## Navigation Integration

- Add "Map" as a primary navigation item in the sidebar (between Dashboard and Supply, or as a top-level item)
- The main Dashboard page should have a "View on Map" button that opens the Map view centered on the currently-selected unit
- The Map page should have a "View Dashboard" link in unit detail panels that navigates back to the tabular dashboard for that unit
- Clicking "View convoy on map" from anywhere in the app navigates to `/map?focus=convoy:{id}` which pans/zooms to that convoy

## Seed Data Updates

Update the seed data generator to include:

- **Unit positions**: Place all seeded units at realistic locations around Camp Pendleton, CA:
  - 1st Marines Regt HQ: ~33.3060, -117.3535
  - 1/1 BN area: ~33.3012, -117.3542
  - 2/1 BN area: ~33.2875, -117.3410
  - 3/1 BN area: ~33.2950, -117.3680
  - Companies spread ~1-3km from their BN positions
  - CLR-1 / logistics units near Camp Margarita area: ~33.3180, -117.3280

- **Supply points**: Seed 5-8 logistics nodes:
  - LOG BASE CHARLIE (main LSA): 33.2845, -117.3201
  - FARP EAGLE: 33.2650, -117.3450
  - ASP 1 (ammo supply point): 33.2780, -117.3100
  - WATER POINT ALPHA: 33.2900, -117.3300
  - LZ ROBIN: 33.2720, -117.3600
  - MAINTENANCE COLLECTION POINT: 33.2810, -117.3250

- **Active convoys**: Seed 3-5 convoys in various states:
  - Convoy 7A: EN_ROUTE from LOG BASE CHARLIE to 1/1, 60% complete
  - Convoy 12B: PLANNED, departing ASP 1 to 3/1 in 2 hours
  - Convoy 3C: COMPLETE, arrived at 2/1 30 minutes ago
  - Convoy 9D: DELAYED, en route from LOG BASE CHARLIE to CLR-1

- **MSR/ASR routes**: Seed 2-3 routes as coordinate arrays:
  - MSR TAMPA: Main supply route through the area
  - ASR DETROIT: Alternate route
  - Both as realistic polylines through Camp Pendleton terrain

- **Historical position data**: Generate 24 hours of position history for convoys (position snapshots every 15 minutes) to enable the time slider replay feature.

- **All seed data should include MGRS**: Every seeded coordinate should also store the MGRS equivalent, demonstrating that the system supports both coordinate formats.

## PostGIS Spatial Queries

Add these spatial query capabilities:

```python
# Find all units within radius of a point
def units_within_radius(lat, lon, radius_km):
    return db.query(Unit).filter(
        func.ST_DWithin(
            Unit.geometry,
            func.ST_SetSRID(func.ST_MakePoint(lon, lat), 4326),
            radius_km / 111.0  # approximate degrees
        )
    ).all()

# Find nearest supply point to a unit
def nearest_supply_point(unit_id):
    unit = db.query(Unit).get(unit_id)
    return db.query(SupplyPoint).order_by(
        func.ST_Distance(SupplyPoint.geometry, unit.geometry)
    ).first()

# Calculate distance between two entities
def distance_between(entity_a, entity_b):
    return db.query(
        func.ST_Distance(entity_a.geometry, entity_b.geometry) * 111.0  # km
    ).scalar()

# Find all entities within a bounding box (for map viewport queries)
def entities_in_bbox(min_lat, min_lon, max_lat, max_lon):
    bbox = func.ST_MakeEnvelope(min_lon, min_lat, max_lon, max_lat, 4326)
    return db.query(Location).filter(
        func.ST_Within(Location.geometry, bbox)
    ).all()
```

## Build Instructions

1. Add PostGIS extension to the PostgreSQL Docker image (use `postgis/postgis:15-3.4` instead of plain `postgres:15`)
2. Install backend dependency: `pip install mgrs`
3. Create the location, supply_point, and route models + migrations
4. Add lat/lon/mgrs columns to existing unit and transportation models
5. Build the coordinate conversion utility (`coordinates.py`)
6. Build the map API endpoints (read + write)
7. Install frontend dependencies: `react-leaflet`, `leaflet`, `milsymbol`, `leaflet-providers`, `mgrs` (npm package)
8. Build the coordinate input component and MGRS hook first (used everywhere)
9. Build the map components (LogisticsMap first, then layers one by one)
10. Build the detail panels (unit, convoy, supply point, route)
11. Build the right-click context menu and placement modal
12. Build the draggable marker for entity repositioning
13. Add the MapPage route and sidebar navigation
14. Update seed data with positions, supply points, routes, convoy tracks, and MGRS values
15. Test the full map view with seed data — every layer should render with realistic Camp Pendleton positions
16. Test placement flow: right-click → place unit → enter MGRS → drag to adjust → save
17. Test click-to-detail: click a unit → detail panel slides out → all tabs work → "View on Map" from dashboard works
18. Add the time slider for historical replay
19. Add the coordinate display (bottom-left) showing cursor position in GPS + MGRS

Make sure the map works in the browser at `/map` and displays all seeded data with proper military symbology, layer toggles, clickable detail panels, and interactive entity placement with both GPS and MGRS coordinate support.
