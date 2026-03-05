# KEYSTONE — Realistic Mock Data Simulator

## Mission

Replace the current static seed data approach (`seed/sample_data.py`) with a **live data simulation system** that pushes realistic, time-varying logistics data through KEYSTONE's actual ingestion pipelines — exactly the way real-world data would arrive. The simulator must make KEYSTONE feel like a live system connected to an active MAGTF.

**Critical constraint**: Data must NOT be inserted directly into the database. Every piece of mock data must flow through the same ingestion pipelines that real data would use — mIRC log upload endpoints, Excel file upload endpoints, TAK CoT ingestion endpoints, and manual entry forms. This exercises the parsers, classifiers, normalizers, and raw data audit trail.

---

## Architecture

### `simulator/` — New Top-Level Directory

```
backend/
  simulator/
    __init__.py
    engine.py              # Main simulation engine / orchestrator
    clock.py               # Simulated time management (accelerated or real-time)
    scenario.py            # Scenario definitions (exercise, deployment, garrison)
    units.py               # Unit state tracking during simulation
    generators/
      __init__.py
      mirc.py              # Generates realistic mIRC log content
      excel.py             # Generates realistic Excel LOGSTAT / readiness files
      tak.py               # Generates realistic TAK CoT XML events
      manual_entry.py      # Generates manual entry API calls
      gcss_mc.py           # Simulates GCSS-MC data feed (future)
    feeders/
      __init__.py
      mirc_feeder.py       # POSTs mIRC logs to /api/v1/ingestion/mirc
      excel_feeder.py      # POSTs Excel files to /api/v1/ingestion/excel
      tak_feeder.py        # POSTs CoT XML to /api/v1/tak/ingest/cot
      manual_feeder.py     # POSTs to supply/equipment/movement endpoints
    events/
      __init__.py
      event_types.py       # Enumerated event types (resupply, breakdown, contact, etc.)
      event_queue.py       # Priority queue for scheduled events
      event_handlers.py    # Event processing logic
    config.py              # Simulator configuration
    cli.py                 # CLI interface: `python -m simulator run --scenario=exercise`
```

### How It Works

```
Scenario (defines what happens)
  → Engine (manages time + event queue)
    → Events fire at simulated timestamps
      → Generators produce realistic raw content (mIRC text, Excel bytes, CoT XML)
        → Feeders POST that content to KEYSTONE's real API endpoints
          → KEYSTONE ingestion pipelines parse, structure, and store
            → Dashboards, alerts, analytics update naturally
```

---

## Simulation Engine (`engine.py`)

### Time Management

```python
class SimulationClock:
    """Manages simulated time with configurable acceleration."""

    def __init__(self, start_time: datetime, speed_multiplier: float = 60.0):
        """
        speed_multiplier: How fast sim runs vs real time.
          1.0  = real-time (1 sim second = 1 real second)
          60.0 = 1 sim minute per real second (1 sim hour = 1 real minute)
          3600.0 = 1 sim hour per real second (1 sim day = 24 real seconds)
        """
        self.start_time = start_time
        self.speed_multiplier = speed_multiplier
        self.real_start = datetime.now(timezone.utc)

    @property
    def now(self) -> datetime:
        """Current simulated time."""
        elapsed_real = (datetime.now(timezone.utc) - self.real_start).total_seconds()
        elapsed_sim = elapsed_real * self.speed_multiplier
        return self.start_time + timedelta(seconds=elapsed_sim)
```

### Event Queue

The engine maintains a priority queue of upcoming events, sorted by simulated time. As the clock advances, events fire and generate data that gets pushed through the pipelines.

```python
@dataclass
class SimEvent:
    fire_at: datetime          # Simulated time to fire
    event_type: EventType      # What kind of event
    unit_id: str               # Which unit (abbreviation, e.g., "A Co 1/1")
    data: dict                 # Event-specific payload
    priority: int = 5          # Lower = higher priority (0-10)

class EventQueue:
    """Priority queue for simulation events."""

    def __init__(self):
        self._queue: list[tuple[datetime, int, SimEvent]] = []

    def schedule(self, event: SimEvent):
        heapq.heappush(self._queue, (event.fire_at, event.priority, event))

    def pop_due(self, current_time: datetime) -> list[SimEvent]:
        """Return all events whose fire_at <= current_time."""
        due = []
        while self._queue and self._queue[0][0] <= current_time:
            _, _, event = heapq.heappop(self._queue)
            due.append(event)
        return due
```

### Main Loop

```python
async def run_simulation(scenario: Scenario, speed: float = 60.0):
    clock = SimulationClock(scenario.start_time, speed)
    queue = EventQueue()
    state = SimulationState(scenario)

    # Populate initial event schedule from scenario
    scenario.schedule_initial_events(queue, clock)

    while clock.now < scenario.end_time:
        due_events = queue.pop_due(clock.now)

        for event in due_events:
            # Process event: update unit state + generate data
            new_events = await handle_event(event, state, clock)

            # Events can spawn follow-on events
            for new_event in new_events:
                queue.schedule(new_event)

        # Periodic generators (mIRC chatter, status reports)
        await generate_periodic_data(state, clock)

        # Pace real-world API calls (don't overwhelm the server)
        await asyncio.sleep(0.5)
```

---

## Scenarios

Each scenario defines a realistic operational context. The scenario determines what units are doing, what data they generate, and what events occur.

### Scenario: `steel_guardian` — Battalion FEX at 29 Palms

A 2-week battalion field exercise. 1/1 is in the field at 29 Palms with full company operations. The scenario models realistic supply consumption, equipment breakdowns, convoy movements, and the daily reporting rhythm.

```python
STEEL_GUARDIAN = Scenario(
    name="Steel Guardian",
    description="1/1 Battalion Field Exercise, MCAGCC 29 Palms",
    start_time=datetime(2026, 3, 1, 6, 0, tzinfo=timezone.utc),  # 0600 Day 1
    end_time=datetime(2026, 3, 14, 18, 0, tzinfo=timezone.utc),   # 1800 Day 14
    participating_units=["1/1", "A Co 1/1", "B Co 1/1", "C Co 1/1", "D Co 1/1", "CLB-1"],
    location="MCAGCC 29 Palms",
    op_tempo="HIGH",
    phases=[
        Phase("Deployment", day_range=(1, 2), tempo="MEDIUM"),
        Phase("Offense", day_range=(3, 7), tempo="HIGH"),
        Phase("Defense", day_range=(8, 10), tempo="MEDIUM"),
        Phase("Retrograde", day_range=(11, 12), tempo="HIGH"),
        Phase("Recovery", day_range=(13, 14), tempo="LOW"),
    ],
)
```

### Scenario: `pacific_fury` — MEU Deployment

A 26th MEU pre-deployment training cycle and embark. Multiple unit types, ship-to-shore logistics, limited connectivity windows.

### Scenario: `iron_forge` — Garrison Steady-State

Normal garrison operations at Camp Lejeune. Lower op-tempo, regular reporting cycles, routine maintenance, periodic exercises. Good for demonstrating day-to-day analytics.

---

## Data Generators

### mIRC Log Generator (`generators/mirc.py`)

Generates realistic mIRC channel logs that look like actual Marine logistics chat traffic. Messages must match the patterns that the existing `mirc_parser.py` and `mirc_patterns.py` expect.

#### Channel Types to Simulate

| Channel | Content | Frequency |
|---------|---------|-----------|
| `#1-1-LOG-NET` | Battalion logistics net — LOGSTATs, supply requests, status reports | Every 15-60 min |
| `#1-1-MAINT-NET` | Maintenance traffic — deadline reports, parts requests, recovery ops | Every 30-90 min |
| `#1-1-SUPPLY-REQ` | Supply requests — urgent and routine | Burst on need |
| `#CLB1-DISTRO` | Distribution — convoy status, delivery confirmations, MSR updates | Every 30-60 min |
| `#1STMAR-LOG-COMMON` | Regimental log common — rollups, cross-battalion coordination | Every 1-4 hrs |

#### Message Templates

```python
# Formatted LOGSTAT line items (these should be parseable by mirc_patterns.py)
LOGSTAT_TEMPLATES = [
    "[{timestamp}] <{callsign}> LOGSTAT {unit} CL I: MRE {on_hand}/{required} DOS {dos:.1f} | WATER {water_on_hand}/{water_required} GAL DOS {water_dos:.1f}",
    "[{timestamp}] <{callsign}> LOGSTAT {unit} CL III: JP8 {jp8_on_hand}/{jp8_required} GAL DOS {jp8_dos:.1f} | DIESEL {diesel_on_hand}/{diesel_required} GAL DOS {diesel_dos:.1f}",
    "[{timestamp}] <{callsign}> LOGSTAT {unit} CL V: 5.56 {ammo_556}/{ammo_556_req} RDS | 7.62 {ammo_762}/{ammo_762_req} RDS | 40MM {ammo_40mm}/{ammo_40mm_req} RDS",
    "[{timestamp}] <{callsign}> LOGSTAT {unit} CL VIII: CLS BAGS {cls}/{cls_req} | IV FLUID {iv}/{iv_req} | COMBAT GAUZE {gauze}/{gauze_req}",
]

# Free-text supply requests
REQUEST_TEMPLATES = [
    "[{timestamp}] <{callsign}> {unit} requesting emergency resupply CL {supply_class}. Current DOS {dos:.1f}. Need {quantity} {item} NLT {deadline}.",
    "[{timestamp}] <{callsign}> FLASH PRIORITY: {unit} BLACK on CL {supply_class}. {item} exhausted. Request immediate push.",
    "[{timestamp}] <{callsign}> {unit} routine resupply request: {quantity} {item} for next 72hrs.",
]

# Convoy / movement updates
CONVOY_TEMPLATES = [
    "[{timestamp}] <{callsign}> CONVOY {convoy_id} SP {origin} EN ROUTE {destination}. {vehicle_count} VEH. ETD {etd} ETA {eta}. CARGO: {cargo}.",
    "[{timestamp}] <{callsign}> CONVOY {convoy_id} ARRIVED {destination} at {arrival_time}. All pax/cargo accounted for.",
    "[{timestamp}] <{callsign}> CONVOY {convoy_id} DELAYED AT {location}. {reason}. New ETA {new_eta}.",
    "[{timestamp}] <{callsign}> MSR {route_name} STATUS: {status}. {details}.",
]

# Maintenance traffic
MAINT_TEMPLATES = [
    "[{timestamp}] <{callsign}> DEADLINE REPORT {unit}: {tamcn} {nomen} SN {serial} NMCM — {fault}. ECD {ecd}.",
    "[{timestamp}] <{callsign}> EQUIPMENT STATUS {unit}: {nomen} TOTAL {total} MC {mc} NMCM {nmcm} NMCS {nmcs} — {readiness:.0f}% MC RATE.",
    "[{timestamp}] <{callsign}> PARTS REQUEST: NSN {nsn} QTY {qty} for {nomen} SN {serial}. Priority {priority}. Current source: {source}.",
    "[{timestamp}] <{callsign}> VEH RECOVERY: {nomen} from {unit} at GRID {grid}. Recovery asset dispatched. ETA {eta}.",
]

# General chatter (realistic noise the parser must handle gracefully)
CHATTER_TEMPLATES = [
    "[{timestamp}] <{callsign}> Roger, tracking. Will push that to S4.",
    "[{timestamp}] <{callsign}> {unit} S4 on net. Send traffic.",
    "[{timestamp}] <{callsign}> Good copy on the LOGSTAT. Any change to CL V status?",
    "[{timestamp}] <{callsign}> Negative change. Still AMBER on 5.56, waiting on push from CLB.",
    "[{timestamp}] <{callsign}> Be advised, COC displaced to alternate. Same net, new physical location.",
    "[{timestamp}] <{callsign}> WILCO. {unit} out.",
]
```

#### Realistic Callsigns

```python
CALLSIGNS = {
    "A Co 1/1": ["ASSASSIN-6", "ASSASSIN-4", "ASSASSIN-LOG"],
    "B Co 1/1": ["BARBARIAN-6", "BARBARIAN-4", "BARBARIAN-LOG"],
    "C Co 1/1": ["CRUSADER-6", "CRUSADER-4", "CRUSADER-LOG"],
    "D Co 1/1": ["DESTROYER-6", "DESTROYER-4", "DESTROYER-LOG"],
    "1/1":      ["RAIDER-6", "RAIDER-4", "RAIDER-S4", "RAIDER-LOG"],
    "CLB-1":    ["IRONHORSE-6", "IRONHORSE-4", "IRONHORSE-DISTRO", "IRONHORSE-MAINT"],
    "CLR-1":    ["FORGE-6", "FORGE-4", "FORGE-S4"],
}
```

#### Log File Assembly

Don't send one message at a time. Accumulate messages over a simulated time window (e.g., 30 minutes of channel traffic) and upload the batch as a single `.log` file — just like a real mIRC log export would work.

```python
async def generate_mirc_log_batch(channel: str, state: SimulationState,
                                   window_start: datetime, window_end: datetime) -> str:
    """Generate a batch of mIRC messages for a time window.

    Returns the content as a string formatted like an mIRC log file export.
    The feeder will save this to a temp file and POST it to /api/v1/ingestion/mirc.
    """
    messages = []
    current = window_start

    while current < window_end:
        # Determine what messages fire at this time based on unit states
        for unit in state.active_units_on_channel(channel):
            if should_report(unit, current, channel):
                msg = generate_message(unit, current, channel, state)
                messages.append(msg)

        # Random chatter
        if random.random() < 0.15:
            messages.append(generate_chatter(channel, current, state))

        # Advance 1-15 minutes
        current += timedelta(minutes=random.randint(1, 15))

    return "\n".join(messages)
```

### Excel Generator (`generators/excel.py`)

Generates realistic `.xlsx` files using `openpyxl` that match actual USMC LOGSTAT and readiness report formats. These get uploaded to `/api/v1/ingestion/excel`.

#### File Types to Generate

1. **Battalion LOGSTAT** — The standard logistics status report
   - Sheet: "LOGSTAT"
   - Columns: Unit, Supply Class, Item, On-Hand, Required, DOS, Status, Remarks
   - One row per item per reporting unit
   - Header rows with unit name, DTG, classification

2. **Equipment Readiness Report**
   - Sheet: "Equipment Readiness"
   - Columns: TAMCN, Nomenclature, Auth, Poss, MC, NMCM, NMCS, MC%, Remarks
   - Summary rows for each category

3. **Convoy Manifest**
   - Sheet: "Convoy Manifest"
   - Columns: Convoy ID, Vehicle, Bumper #, Cargo, Weight, Origin, Destination, ETD, ETA

4. **CSS Status Roll-Up**
   - Multi-sheet workbook submitted by BN S-4
   - Tabs: Supply Status, Equipment, Transportation, Services

#### Generation Logic

```python
async def generate_logstat_excel(unit: UnitState, report_time: datetime) -> bytes:
    """Generate a realistic LOGSTAT Excel file for a unit.

    Returns the .xlsx file as bytes, ready to POST to /api/v1/ingestion/excel.
    """
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "LOGSTAT"

    # Header block (matches real USMC format)
    ws.merge_cells("A1:H1")
    ws["A1"] = f"LOGISTICS STATUS REPORT (LOGSTAT)"
    ws["A2"] = f"UNIT: {unit.name}"
    ws["A3"] = f"DTG: {report_time.strftime('%d%H%MZ %b %Y').upper()}"
    ws["A4"] = f"CLASSIFICATION: UNCLASSIFIED // EXERCISE"

    # Column headers
    headers = ["UNIT", "CL", "ITEM", "ON HAND", "REQUIRED", "DOS", "STATUS", "REMARKS"]
    for col, header in enumerate(headers, 1):
        ws.cell(row=6, column=col, value=header)

    # Data rows from unit's current supply state
    row = 7
    for supply_class, items in unit.supply_status.items():
        for item in items:
            ws.cell(row=row, column=1, value=unit.abbreviation)
            ws.cell(row=row, column=2, value=supply_class.value)
            ws.cell(row=row, column=3, value=item.name)
            ws.cell(row=row, column=4, value=round(item.on_hand, 0))
            ws.cell(row=row, column=5, value=round(item.required, 0))
            ws.cell(row=row, column=6, value=round(item.dos, 1))
            ws.cell(row=row, column=7, value=item.status_color)  # GREEN/AMBER/RED
            ws.cell(row=row, column=8, value=item.remarks or "")
            row += 1

    buffer = io.BytesIO()
    wb.save(buffer)
    return buffer.getvalue()
```

#### Reporting Rhythm

- **Company LOGSTATs**: Every 12 hours (0600 and 1800 simulated time), uploaded as Excel
- **Battalion rollup**: Every 24 hours (generated from aggregated company data)
- **Equipment readiness**: Every 24 hours from BN maintenance chief
- **Ad-hoc reports**: Triggered by events (mass casualty, emergency resupply, etc.)

### TAK CoT Generator (`generators/tak.py`)

Generates realistic Cursor-on-Target (CoT) XML events that get POSTed to `/api/v1/tak/ingest/cot`. Each event represents a TAK logistics plugin submission from the field.

#### CoT Event Types

```python
# Supply status report via TAK logistics plugin
SUPPLY_COT_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<event version="2.0" uid="{uid}" type="b-r-f-h-c"
       time="{event_time}" start="{start_time}" stale="{stale_time}" how="h-g-i-g-o">
  <point lat="{lat}" lon="{lon}" hae="{hae}" ce="10.0" le="10.0"/>
  <detail>
    <contact callsign="{callsign}"/>
    <__group name="{group}" role="Team Member"/>
    <remarks>{remarks}</remarks>
    <logistics>
      <supply class="{supply_class}" item="{item}" onhand="{on_hand}"
              required="{required}" dos="{dos}" unit="{unit_abbr}"/>
    </logistics>
  </detail>
</event>"""

# Unit position report
POSITION_COT_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<event version="2.0" uid="{uid}" type="a-f-G-U-C-I"
       time="{event_time}" start="{start_time}" stale="{stale_time}" how="m-g">
  <point lat="{lat}" lon="{lon}" hae="{hae}" ce="5.0" le="5.0"/>
  <detail>
    <contact callsign="{callsign}"/>
    <__group name="{group}" role="{role}"/>
    <remarks>{unit_abbr} position report</remarks>
  </detail>
</event>"""

# Vehicle / equipment status via TAK
EQUIPMENT_COT_TEMPLATE = """<?xml version="1.0" encoding="UTF-8"?>
<event version="2.0" uid="{uid}" type="a-f-G-E-V"
       time="{event_time}" start="{start_time}" stale="{stale_time}" how="h-g-i-g-o">
  <point lat="{lat}" lon="{lon}" hae="{hae}" ce="15.0" le="15.0"/>
  <detail>
    <contact callsign="{callsign}"/>
    <__group name="{group}" role="Team Member"/>
    <remarks>{remarks}</remarks>
    <equipment tamcn="{tamcn}" nomen="{nomen}" status="{status}"
               serial="{serial}" unit="{unit_abbr}"/>
  </detail>
</event>"""
```

#### TAK Submission Rhythm

- **Position updates**: Every 30-120 seconds per active TAK user (but batched for simulation — send 5-10 per push)
- **Supply reports via TAK plugin**: Every 2-4 hours from company-level TAK operators
- **Equipment status**: On status change (breakdown, recovery, return to service)

#### Realistic GPS Coordinates

```python
# 29 Palms MCAGCC area of operations
AO_29_PALMS = {
    "center": (34.2367, -116.0542),
    "radius_km": 30,
    "key_locations": {
        "MAINSIDE": (34.2367, -116.0542),
        "CAMP_WILSON": (34.3092, -116.2214),
        "LEAD_MT": (34.2850, -116.1200),
        "EMERSON_LAKE": (34.3500, -116.0800),
        "LAVIC_LAKE": (34.4200, -116.2500),
        "BULLION_MOUNTAINS": (34.3100, -116.3500),
        "ASP_1": (34.2400, -116.0600),   # Ammo Supply Point
        "FARP_NORTH": (34.3200, -116.1500),  # Forward Arming and Refueling Point
        "CSS_AREA": (34.2500, -116.0700),     # Combat Service Support area
        "MSR_ALPHA_SP": (34.2200, -116.0400),
        "MSR_ALPHA_EP": (34.3800, -116.2000),
    }
}

# Camp Lejeune for garrison scenario
AO_LEJEUNE = {
    "center": (34.6700, -77.3500),
    "radius_km": 15,
    "key_locations": {
        "MAINSIDE": (34.6700, -77.3500),
        "CAMP_GEIGER": (34.6567, -77.3872),
        "COURTHOUSE_BAY": (34.6192, -77.3461),
        "ONSLOW_BEACH": (34.5800, -77.3200),
        "G11_RANGE": (34.7100, -77.3800),
    }
}
```

### Manual Entry Generator (`generators/manual_entry.py`)

Generates direct API calls that simulate a logistics operator typing data into KEYSTONE's manual entry forms. These hit the supply, equipment, and transportation endpoints directly.

Use this sparingly — most data should flow through mIRC/Excel/TAK pipelines. Manual entry should be:
- Corrections to parsed data (via the review queue endpoints)
- Data from sources that don't have a pipeline yet
- Quick updates from the ops center

---

## Feeders — Pushing Data Through the Pipelines

Each feeder is responsible for taking generated content and pushing it through the correct KEYSTONE API endpoint. Feeders must authenticate using a simulator service account.

### Authentication

```python
class SimulatorClient:
    """HTTP client that authenticates against KEYSTONE and pushes data."""

    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token = None

    async def authenticate(self):
        """Login as the simulator service account."""
        resp = await self.session.post(f"{self.base_url}/api/v1/auth/login", json={
            "username": "simulator",
            "password": "sim-dev-only"  # Only works in development mode
        })
        self.token = resp.json()["access_token"]

    async def post_mirc_log(self, content: str, channel: str, filename: str):
        """Upload mIRC log file through ingestion pipeline."""
        files = {"file": (filename, content.encode(), "text/plain")}
        params = {"channel_name": channel}
        return await self.session.post(
            f"{self.base_url}/api/v1/ingestion/mirc",
            files=files, params=params,
            headers={"Authorization": f"Bearer {self.token}"}
        )

    async def post_excel(self, content: bytes, filename: str):
        """Upload Excel file through ingestion pipeline."""
        files = {"file": (filename, content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        return await self.session.post(
            f"{self.base_url}/api/v1/ingestion/excel",
            files=files,
            headers={"Authorization": f"Bearer {self.token}"}
        )

    async def post_tak_cot(self, xml_content: str):
        """Submit CoT message through TAK ingestion pipeline."""
        return await self.session.post(
            f"{self.base_url}/api/v1/tak/ingest/cot",
            json={"xml_content": xml_content},
            headers={"Authorization": f"Bearer {self.token}"}
        )
```

### mIRC Feeder

```python
async def feed_mirc(client: SimulatorClient, state: SimulationState, clock: SimulationClock):
    """Generate and push mIRC log batches for all active channels."""
    for channel in state.active_channels:
        window_end = clock.now
        window_start = window_end - timedelta(minutes=30)

        log_content = await generate_mirc_log_batch(channel, state, window_start, window_end)

        if log_content.strip():
            filename = f"{channel.replace('#', '')}_{window_end.strftime('%Y%m%d_%H%M')}.log"
            await client.post_mirc_log(log_content, channel, filename)
```

### Excel Feeder

```python
async def feed_excel(client: SimulatorClient, state: SimulationState, clock: SimulationClock):
    """Generate and push Excel reports on reporting schedule."""
    for unit in state.units_due_for_excel_report(clock.now):
        # Generate LOGSTAT
        logstat_bytes = await generate_logstat_excel(unit, clock.now)
        filename = f"LOGSTAT_{unit.abbreviation}_{clock.now.strftime('%d%H%MZ%b%Y').upper()}.xlsx"
        await client.post_excel(logstat_bytes, filename)

        # Equipment readiness (if due)
        if unit.equipment_report_due(clock.now):
            equip_bytes = await generate_equipment_excel(unit, clock.now)
            equip_filename = f"EQUIP_STATUS_{unit.abbreviation}_{clock.now.strftime('%d%H%MZ%b%Y').upper()}.xlsx"
            await client.post_excel(equip_bytes, equip_filename)
```

---

## Event System — What Makes It Feel Real

The simulation should not just generate periodic reports. It should simulate events that create cascading data across multiple pipelines — just like real operations.

### Event Types

```python
class EventType(Enum):
    # Supply events
    SUPPLY_CONSUMPTION = "supply_consumption"      # Normal daily draw-down
    EMERGENCY_RESUPPLY = "emergency_resupply"      # Unit goes RED, urgent request
    RESUPPLY_CONVOY = "resupply_convoy"            # Convoy dispatched
    RESUPPLY_DELIVERY = "resupply_delivery"        # Convoy arrives, on-hand replenished

    # Equipment events
    EQUIPMENT_BREAKDOWN = "equipment_breakdown"     # Vehicle goes deadline
    PARTS_ORDERED = "parts_ordered"                # Maintenance requests parts
    PARTS_RECEIVED = "parts_received"              # Parts arrive
    EQUIPMENT_REPAIRED = "equipment_repaired"      # Vehicle returns to service
    RECOVERY_OP = "recovery_op"                    # Disabled vehicle needs tow

    # Movement events
    CONVOY_PLANNED = "convoy_planned"              # Convoy scheduled
    CONVOY_SP = "convoy_sp"                        # Convoy departs start point
    CONVOY_CHECKPOINT = "convoy_checkpoint"         # Convoy passes checkpoint
    CONVOY_ARRIVED = "convoy_arrived"              # Convoy reaches destination
    CONVOY_DELAYED = "convoy_delayed"              # Convoy held up (weather, IED, breakdown)

    # Operational events
    PHASE_CHANGE = "phase_change"                  # Exercise transitions phases
    UNIT_DISPLACED = "unit_displaced"              # Unit moves to new position
    MASS_CASUALTY = "mass_casualty"                # CL VIII spike
    INCREASED_TEMPO = "increased_tempo"            # Higher consumption rates
    DECREASED_TEMPO = "decreased_tempo"            # Lower consumption rates

    # Reporting events
    LOGSTAT_DUE = "logstat_due"                    # Scheduled LOGSTAT submission
    SITREP_DUE = "sitrep_due"                     # Scheduled SITREP
    READINESS_REPORT_DUE = "readiness_report_due"  # Equipment readiness report
```

### Cascading Event Example: Equipment Breakdown

When a vehicle breaks down, it should trigger a realistic chain of events across multiple data streams:

```
1. EQUIPMENT_BREAKDOWN fires at T+0
   → mIRC message on #1-1-MAINT-NET: "DEADLINE REPORT A Co 1/1: HMMWV M1151 SN 12345 NMCM — ENGINE OVERHEAT. ECD 48HRS."
   → TAK CoT: Equipment status update with position
   → Unit equipment state updates (MC count decreases)

2. If vehicle is in field → RECOVERY_OP fires at T+15min
   → mIRC message: "VEH RECOVERY: HMMWV from A Co 1/1 at GRID 11S QA 12345 67890. Recovery asset dispatched."
   → TAK CoT: Recovery vehicle position updates

3. PARTS_ORDERED fires at T+1hr
   → mIRC message on #1-1-MAINT-NET: "PARTS REQUEST: NSN 2930-01-XXX-XXXX QTY 1 for HMMWV M1151."
   → Excel: Updated equipment readiness report

4. PARTS_RECEIVED fires at T+24-72hrs (randomized)
   → mIRC message: "PARTS RECEIVED for HMMWV M1151 SN 12345."

5. EQUIPMENT_REPAIRED fires at T+6-48hrs after parts
   → mIRC message: "EQUIPMENT STATUS A Co 1/1: HMMWV M1151 SN 12345 RETURNED TO SERVICE. MC RATE NOW 87%."
   → TAK CoT: Equipment status update
   → Unit equipment state updates (MC count increases)
```

### Cascading Event Example: Resupply Cycle

```
1. SUPPLY_CONSUMPTION runs continuously
   → Each unit's on-hand quantities decrease based on tempo + class
   → When a unit hits AMBER → mIRC message warning
   → When a unit hits RED → EMERGENCY_RESUPPLY event fires

2. EMERGENCY_RESUPPLY at T+0
   → mIRC flash message on #1-1-LOG-NET and #CLB1-DISTRO
   → Unit S4 submits LOGSTAT via Excel (triggered off-cycle)

3. RESUPPLY_CONVOY planned at T+2-6hrs
   → mIRC on #CLB1-DISTRO: convoy planned, manifest listed
   → Excel convoy manifest uploaded

4. CONVOY_SP at T+planned_departure
   → mIRC: "CONVOY C-XXX SP at [time]"
   → TAK: Convoy leader position starts updating

5. CONVOY_CHECKPOINT at intervals
   → TAK position updates along route
   → mIRC: checkpoint passage times

6. Possible CONVOY_DELAYED (15% chance)
   → mIRC: delay notification with reason
   → New ETA calculated

7. CONVOY_ARRIVED at destination
   → mIRC: arrival confirmation
   → RESUPPLY_DELIVERY fires

8. RESUPPLY_DELIVERY
   → Unit on-hand quantities increase
   → mIRC: "RESUPPLY COMPLETE. A Co 1/1 now GREEN on CL I, CL III."
   → Next LOGSTAT reflects updated quantities
```

---

## Unit State Tracking

The simulator maintains state for each unit that evolves over time. This state drives all data generation.

```python
@dataclass
class SupplyItem:
    name: str
    supply_class: str
    on_hand: float
    required: float
    daily_consumption_rate: float
    last_resupply: datetime

    @property
    def dos(self) -> float:
        if self.daily_consumption_rate <= 0:
            return 99.0
        return self.on_hand / self.daily_consumption_rate

    @property
    def status(self) -> str:
        if self.dos > 5:
            return "GREEN"
        elif self.dos > 3:
            return "AMBER"
        else:
            return "RED"

@dataclass
class EquipmentItem:
    tamcn: str
    nomenclature: str
    serial: str
    status: str  # "MC", "NMCM", "NMCS"
    fault_description: str | None = None
    ecd: datetime | None = None

@dataclass
class UnitState:
    unit_name: str
    abbreviation: str
    echelon: str
    position: tuple[float, float]  # (lat, lon)
    supply_items: list[SupplyItem]
    equipment: list[EquipmentItem]
    active_movements: list[dict]
    last_logstat: datetime | None = None
    last_equip_report: datetime | None = None
    current_tempo: str = "MEDIUM"  # LOW, MEDIUM, HIGH

    def consume_supplies(self, hours: float):
        """Reduce on-hand by consumption rate * hours * tempo multiplier."""
        tempo_mult = {"LOW": 0.5, "MEDIUM": 1.0, "HIGH": 1.5}[self.current_tempo]
        for item in self.supply_items:
            consumed = item.daily_consumption_rate * (hours / 24.0) * tempo_mult
            consumed *= random.uniform(0.8, 1.2)  # Variance
            item.on_hand = max(0, item.on_hand - consumed)
```

---

## CLI Interface

```bash
# Run the Steel Guardian scenario at 60x speed (1 sim hour = 1 real minute)
python -m simulator run --scenario=steel_guardian --speed=60

# Run in real-time (for demos)
python -m simulator run --scenario=steel_guardian --speed=1

# Fast-forward: compress 14 days into ~6 minutes
python -m simulator run --scenario=steel_guardian --speed=3600

# Run garrison steady-state
python -m simulator run --scenario=iron_forge --speed=60

# List available scenarios
python -m simulator list

# Run with custom KEYSTONE URL
python -m simulator run --scenario=steel_guardian --speed=60 --url=http://localhost:8000
```

### Docker Integration

Add a `simulator` service to `docker-compose.yml` that optionally runs alongside KEYSTONE:

```yaml
simulator:
  build:
    context: ./backend
    dockerfile: Dockerfile
  command: python -m simulator run --scenario=steel_guardian --speed=60 --url=http://backend:8000
  depends_on:
    backend:
      condition: service_healthy
  environment:
    - SIM_SPEED=60
    - SIM_SCENARIO=steel_guardian
    - KEYSTONE_URL=http://backend:8000
  profiles:
    - demo  # Only runs when: docker compose --profile demo up
```

---

## Simulator Service Account

Add a simulator user to `seed/seed_users.py` that only exists in development mode:

```python
SIMULATOR_USER = {
    "username": "simulator",
    "display_name": "KEYSTONE Simulator",
    "role": Role.ADMIN,  # Needs access to all ingestion endpoints
    "password": "sim-dev-only",
    "is_service_account": True,
}
```

Ensure this account is only created when `ENV_MODE == "development"`.

---

## What "Done" Looks Like

1. **`python -m simulator run --scenario=steel_guardian --speed=60`** starts and immediately begins pushing data
2. Within 1 real minute (~1 sim hour), the dashboard shows live supply status for all companies in 1/1
3. mIRC logs appear in the ingestion status page with PARSED/REVIEWED status
4. Excel LOGSTATs appear as uploaded files in the ingestion queue
5. TAK CoT events populate the map with unit positions and supply status markers
6. Supply consumption trends are visible in charts (quantities declining over time)
7. Equipment readiness fluctuates as breakdowns and repairs occur
8. Convoy markers appear on the map, move between waypoints, and arrive
9. Alerts fire when units go AMBER/RED on any supply class
10. The analytics page shows meaningful trends, not flat lines
11. Stopping and restarting the simulator picks up where it left off (or starts a new run)
12. No data is inserted directly into the database — all flows through API endpoints

---

## Implementation Priority

1. **Phase 1**: Simulation engine + clock + basic mIRC generator + mIRC feeder. Get messages flowing through `/api/v1/ingestion/mirc`.
2. **Phase 2**: Excel generator + feeder. LOGSTAT and equipment readiness files flowing through `/api/v1/ingestion/excel`.
3. **Phase 3**: TAK CoT generator + feeder. Position and supply CoT events flowing through `/api/v1/tak/ingest/cot`.
4. **Phase 4**: Event system with cascading events (breakdown → recovery → repair chain).
5. **Phase 5**: Full scenarios (Steel Guardian, Pacific Fury, Iron Forge) with phase transitions.
6. **Phase 6**: CLI polish, Docker integration, `--profile demo` support.

---

## Important Notes

- **Do NOT break existing seed data**. Keep `seed/sample_data.py` as a fallback. The simulator is an alternative, not a replacement.
- **Rate limiting**: Don't overwhelm the API. Space out POSTs by at least 200ms. The `speed` parameter controls simulated time, not API call rate.
- **Idempotency**: Running the simulator twice should produce additional data, not duplicates. Use unique timestamps and IDs.
- **Logging**: The simulator should log what it's pushing (`INFO: [SIM 2026-03-01 08:30Z] Pushing LOGSTAT for A Co 1/1 to /api/v1/ingestion/excel`) so operators can trace sim data through the system.
- **Source tagging**: All generated raw data should be identifiable as simulation data. Use a `SIM_` prefix in file names (e.g., `SIM_LOGSTAT_ACO11_010630ZMAR2026.xlsx`) and tag source as `SIMULATOR` where possible.
- **Graceful shutdown**: Ctrl+C should cleanly stop the simulator and print a summary of what was pushed.
