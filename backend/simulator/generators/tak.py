"""TAK Cursor-on-Target (CoT) XML generator for the KEYSTONE simulator.

Produces CoT XML event strings compatible with the TAK parser at
``app.ingestion.tak_parser``.  Each function returns a well-formed XML
string suitable for POST to ``/api/v1/tak/ingest/cot`` as
``{"xml_content": "<event .../>..."}``.

Position data is centered on the 29 Palms training area
(34.2367, -116.0542) with configurable jitter.
"""

from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING
from xml.etree.ElementTree import Element, SubElement, tostring

if TYPE_CHECKING:
    from simulator.units import EquipmentCategory, UnitState

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

# AO center coordinates for each scenario
AO_CENTERS: dict[str, tuple[float, float]] = {
    "29_palms": (34.2367, -116.0542),
    "lejeune": (34.6700, -77.3500),
    "okinawa": (26.3344, 127.7731),
}

# Default elevations by AO (meters)
AO_ELEVATIONS: dict[str, float] = {
    "29_palms": 800.0,
    "lejeune": 10.0,
    "okinawa": 50.0,
}

# Default center (29 Palms) for backward compatibility
_CENTER_LAT = 34.2367
_CENTER_LON = -116.0542
_JITTER_KM = 30.0

# Approximate degrees per km at mid-latitudes
_DEG_PER_KM_LAT = 1.0 / 111.0
_DEG_PER_KM_LON = 1.0 / (111.0 * 0.829)  # cos(34.2) ~ 0.829

# CoT type codes
COT_FRIENDLY_GROUND_INFANTRY = "a-f-G-U-C-I"
COT_FRIENDLY_GROUND_VEHICLE = "a-f-G-E-V"
COT_LOGISTICS_REPORT = "b-r-f-h-c"

# Stale time offset
_STALE_MINUTES = 5


def _iso(dt: datetime) -> str:
    """Format a datetime as CoT-compatible ISO 8601 with trailing Z."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _jitter_position(base: tuple[float, float], km: float = _JITTER_KM) -> tuple[float, float]:
    """Apply random jitter to a base (lat, lon) position within *km* radius."""
    dlat = random.uniform(-km, km) * _DEG_PER_KM_LAT
    dlon = random.uniform(-km, km) * _DEG_PER_KM_LON
    return (base[0] + dlat, base[1] + dlon)


def _uid(unit_abbrev: str, msg_type: str, event_time: datetime) -> str:
    """Generate a unique CoT UID: ``SIM-{abbrev}-{type}-{epoch}``."""
    epoch = int(event_time.timestamp())
    safe_abbrev = unit_abbrev.replace(" ", "_").replace("/", "-")
    return f"SIM-{safe_abbrev}-{msg_type}-{epoch}"


def _build_event(
    uid: str,
    cot_type: str,
    event_time: datetime,
    lat: float,
    lon: float,
    hae: float = 800.0,
    ce: float = 15.0,
    le: float = 10.0,
) -> Element:
    """Build a base ``<event>`` element with ``<point>``."""
    stale = event_time + timedelta(minutes=_STALE_MINUTES)
    event = Element("event")
    event.set("version", "2.0")
    event.set("uid", uid)
    event.set("type", cot_type)
    event.set("time", _iso(event_time))
    event.set("start", _iso(event_time))
    event.set("stale", _iso(stale))
    event.set("how", "h-g-i-g-o")

    point = SubElement(event, "point")
    point.set("lat", f"{lat:.6f}")
    point.set("lon", f"{lon:.6f}")
    point.set("hae", f"{hae:.1f}")
    point.set("ce", f"{ce:.1f}")
    point.set("le", f"{le:.1f}")

    return event


def _add_contact(detail: Element, callsign: str) -> None:
    contact = SubElement(detail, "contact")
    contact.set("callsign", callsign)


def _add_group(detail: Element, name: str, role: str = "Team Member") -> None:
    group = SubElement(detail, "__group")
    group.set("name", name)
    group.set("role", role)


def _add_remarks(detail: Element, text: str) -> None:
    remarks = SubElement(detail, "remarks")
    remarks.text = text


def _to_xml_string(event: Element) -> str:
    """Serialize an Element to a UTF-8 XML string."""
    return tostring(event, encoding="unicode", xml_declaration=False)


# ---------------------------------------------------------------------------
# Public generators
# ---------------------------------------------------------------------------


def generate_position_cot(unit: UnitState, event_time: datetime) -> str:
    """Generate a unit position CoT event XML string.

    Uses the unit's actual position with small jitter (approx 500m) for
    movement simulation, rather than always jittering from a fixed center.

    Type: ``a-f-G-U-C-I`` (friendly ground unit, combat infantry).

    Args:
        unit: Unit whose position to report.
        event_time: Event timestamp.

    Returns:
        CoT XML string.
    """
    uid = _uid(unit.abbreviation, "POS", event_time)
    lat, lon = unit.position
    # Small jitter for movement simulation (approx +/-500m)
    lat += random.uniform(-0.005, 0.005)
    lon += random.uniform(-0.005, 0.005)
    event = _build_event(uid, COT_FRIENDLY_GROUND_INFANTRY, event_time, lat, lon)

    detail = SubElement(event, "detail")
    callsign = unit.callsigns[0] if unit.callsigns else unit.abbreviation
    _add_contact(detail, callsign)
    _add_group(detail, unit.unit_name, role="Team Lead")
    _add_remarks(detail, f"SIM position update for {unit.unit_name}")

    return _to_xml_string(event)


def generate_supply_cot(unit: UnitState, event_time: datetime) -> str:
    """Generate a supply status CoT event with ``<logistics>`` detail.

    Type: ``b-r-f-h-c`` (logistics report).

    The ``<logistics>`` sub-element contains ``<supply>`` children that
    the TAK parser's ``extract_logistics_data`` expects::

        <supply class="I" onhand="2400" auth="3000" dos="2.1"/>

    Args:
        unit: Unit whose supply state to report.
        event_time: Event timestamp.

    Returns:
        CoT XML string.
    """
    uid = _uid(unit.abbreviation, "SUP", event_time)
    lat, lon = _jitter_position(unit.position)
    event = _build_event(uid, COT_LOGISTICS_REPORT, event_time, lat, lon)

    detail = SubElement(event, "detail")
    callsign = unit.callsigns[0] if unit.callsigns else unit.abbreviation
    _add_contact(detail, callsign)
    _add_group(detail, unit.unit_name)
    _add_remarks(detail, f"SIM supply status for {unit.unit_name}")

    logistics = SubElement(detail, "logistics")
    for item in unit.supply_items:
        supply_elem = SubElement(logistics, "supply")
        supply_elem.set("class", item.supply_class)
        supply_elem.set("desc", item.name)
        supply_elem.set("onhand", str(int(item.on_hand)))
        supply_elem.set("auth", str(int(item.required)))
        supply_elem.set("required", str(int(item.required)))
        supply_elem.set("dos", f"{item.dos:.1f}")

    return _to_xml_string(event)


def generate_equipment_cot(
    unit: UnitState,
    equipment: EquipmentCategory,
    event_time: datetime,
) -> str:
    """Generate an equipment status CoT event.

    Type: ``a-f-G-E-V`` (friendly ground equipment/vehicle).

    The ``<logistics>`` sub-element contains ``<equipment>`` children::

        <equipment tamcn="HMMWV" mc="42" total="48" nmc="6"/>

    Args:
        unit: Owning unit.
        equipment: Equipment category to report.
        event_time: Event timestamp.

    Returns:
        CoT XML string.
    """
    uid = _uid(unit.abbreviation, f"EQP-{equipment.tamcn}", event_time)
    lat, lon = _jitter_position(unit.position)
    event = _build_event(uid, COT_FRIENDLY_GROUND_VEHICLE, event_time, lat, lon)

    detail = SubElement(event, "detail")
    callsign = unit.callsigns[0] if unit.callsigns else unit.abbreviation
    _add_contact(detail, callsign)
    _add_group(detail, unit.unit_name)
    _add_remarks(
        detail,
        f"SIM equipment status: {equipment.nomenclature} "
        f"{equipment.mission_capable}/{equipment.total_possessed} MC",
    )

    logistics = SubElement(detail, "logistics")
    equip_elem = SubElement(logistics, "equipment")
    equip_elem.set("tamcn", equipment.tamcn)
    equip_elem.set("nomen", equipment.nomenclature)
    equip_elem.set("mc", str(equipment.mission_capable))
    equip_elem.set("total", str(equipment.total_possessed))
    nmc = equipment.total_possessed - equipment.mission_capable
    equip_elem.set("nmc", str(nmc))

    return _to_xml_string(event)


def generate_convoy_cot(
    convoy_data: dict,
    position: tuple[float, float],
    event_time: datetime,
) -> str:
    """Generate a convoy position/status CoT event.

    Type: ``a-f-G-E-V`` (friendly ground equipment/vehicle) for convoy
    tracking.

    Args:
        convoy_data: Dict with ``convoy_id``, ``origin``, ``destination``,
            ``vehicle_count``, and optionally ``cargo_description``.
        position: Current (lat, lon) of the convoy.
        event_time: Event timestamp.

    Returns:
        CoT XML string.
    """
    cid = convoy_data.get("convoy_id", "C-2026-001")
    uid = f"SIM-CONVOY-{cid}-{int(event_time.timestamp())}"
    lat, lon = _jitter_position(position, km=2.0)  # small jitter for convoy
    event = _build_event(uid, COT_FRIENDLY_GROUND_VEHICLE, event_time, lat, lon)

    detail = SubElement(event, "detail")
    _add_contact(detail, f"CONVOY {cid}")
    _add_group(detail, "CLB-1", role="Logistics")

    origin = convoy_data.get("origin", "CSS AREA")
    dest = convoy_data.get("destination", "CAMP WILSON")
    veh_count = convoy_data.get("vehicle_count", 8)
    cargo = convoy_data.get("cargo_description", "MIXED CARGO")

    _add_remarks(
        detail,
        f"SIM convoy {cid}: {origin} -> {dest}, "
        f"{veh_count} vehicles, cargo: {cargo}",
    )

    return _to_xml_string(event)
