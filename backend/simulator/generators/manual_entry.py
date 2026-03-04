"""Manual API entry payload generator for the KEYSTONE simulator.

Produces Python dicts that match the Pydantic schemas used by the
KEYSTONE REST endpoints:

- ``POST /api/v1/supply/status``       -> ``SupplyCreate`` schema
- ``POST /api/v1/equipment/status``     -> ``EquipmentCreate`` schema
- ``POST /api/v1/transportation/movements`` -> ``MovementCreate`` schema

Field names are taken directly from the schema definitions in
``app.schemas.supply``, ``app.schemas.equipment``, and
``app.schemas.transportation``.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from simulator.units import EquipmentCategory, SupplyItem, UnitState


def _status_from_percentage(pct: float) -> str:
    """Derive supply status string from fill percentage.

    Returns:
        One of ``"GREEN"``, ``"AMBER"``, or ``"RED"``.
    """
    if pct >= 80.0:
        return "GREEN"
    if pct >= 60.0:
        return "AMBER"
    return "RED"


def generate_supply_update_payload(
    unit: UnitState,
    item: SupplyItem,
    report_time: datetime,
) -> dict:
    """Generate a payload for ``POST /api/v1/supply/status``.

    Matches the ``SupplyCreate`` Pydantic schema::

        unit_id, supply_class, item_description, on_hand_qty,
        required_qty, dos, consumption_rate, reorder_point, status, source

    Args:
        unit: The unit this supply item belongs to.
        item: The supply item to report.
        report_time: Timestamp of the report.

    Returns:
        Dict ready for JSON serialization and POST.
    """
    pct = item.percentage if item.percentage else 0.0
    status = (
        item.status
        if hasattr(item, "status") and item.status
        else _status_from_percentage(pct)
    )

    return {
        "unit_id": getattr(unit, "unit_id", 1),
        "supply_class": item.supply_class,
        "item_description": item.name,
        "on_hand_qty": float(item.on_hand),
        "required_qty": float(item.required),
        "dos": float(item.dos),
        "consumption_rate": float(item.daily_consumption_rate)
        if hasattr(item, "daily_consumption_rate") and item.daily_consumption_rate
        else 0.0,
        "reorder_point": None,
        "status": str(status),
        "source": "SIM_MANUAL",
    }


def generate_equipment_update_payload(
    unit: UnitState,
    category: EquipmentCategory,
    report_time: datetime,
) -> dict:
    """Generate a payload for ``POST /api/v1/equipment/status``.

    Matches the ``EquipmentCreate`` Pydantic schema::

        unit_id, tamcn, nomenclature, total_possessed, mission_capable,
        not_mission_capable_maintenance, not_mission_capable_supply,
        readiness_pct, source

    Args:
        unit: The owning unit.
        category: Equipment category to report.
        report_time: Timestamp of the report.

    Returns:
        Dict ready for JSON serialization and POST.
    """
    return {
        "unit_id": getattr(unit, "unit_id", 1),
        "tamcn": category.tamcn,
        "nomenclature": category.nomenclature,
        "total_possessed": category.total_possessed,
        "mission_capable": category.mission_capable,
        "not_mission_capable_maintenance": category.nmcm,
        "not_mission_capable_supply": category.nmcs,
        "readiness_pct": round(category.readiness_pct, 1),
        "source": "SIM_MANUAL",
    }


def generate_movement_payload(
    convoy_data: dict,
    report_time: datetime,
) -> dict:
    """Generate a payload for ``POST /api/v1/transportation/movements``.

    Matches the ``MovementCreate`` Pydantic schema::

        unit_id, convoy_id, origin, destination, departure_time, eta,
        actual_arrival, vehicle_count, cargo_description, status, source

    Args:
        convoy_data: Dict with ``convoy_id``, ``origin``, ``destination``,
            ``vehicle_count``, ``eta`` (HHMMZ string or datetime),
            ``departure_time`` (datetime), ``unit_id`` (int),
            ``cargo_description`` (str), ``status`` (str).
        report_time: Timestamp of the report.

    Returns:
        Dict ready for JSON serialization and POST.
    """
    # Parse ETA if provided as HHMMZ string
    eta_raw = convoy_data.get("eta")
    eta_dt = None
    if isinstance(eta_raw, datetime):
        eta_dt = eta_raw.isoformat()
    elif isinstance(eta_raw, str) and len(eta_raw) >= 4:
        # Parse "1200Z" style -> datetime on same day as report_time
        try:
            hh = int(eta_raw[:2])
            mm = int(eta_raw[2:4])
            eta_dt = report_time.replace(
                hour=hh,
                minute=mm,
                second=0,
                microsecond=0,
                tzinfo=timezone.utc,
            ).isoformat()
        except (ValueError, IndexError):
            eta_dt = None

    dep_time = convoy_data.get("departure_time")
    if isinstance(dep_time, datetime):
        dep_time = dep_time.isoformat()
    elif dep_time is None:
        dep_time = report_time.replace(tzinfo=timezone.utc).isoformat()

    status = convoy_data.get("status", "EN_ROUTE")

    return {
        "unit_id": convoy_data.get("unit_id", 1),
        "convoy_id": convoy_data.get("convoy_id", "C-2026-001"),
        "origin": convoy_data.get("origin", "CSS AREA"),
        "destination": convoy_data.get("destination", "CAMP WILSON"),
        "departure_time": dep_time,
        "eta": eta_dt,
        "actual_arrival": None,
        "vehicle_count": convoy_data.get("vehicle_count", 8),
        "cargo_description": convoy_data.get("cargo_description", "MIXED CARGO"),
        "status": status,
        "source": "SIM_MANUAL",
    }
