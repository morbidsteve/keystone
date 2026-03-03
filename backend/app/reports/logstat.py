"""LOGSTAT report generation."""

import json
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.military import SUPPLY_CLASS_NAMES, determine_supply_status_by_dos
from app.models.supply import SupplyClass, SupplyStatusRecord
from app.models.unit import Unit


async def generate_logstat(
    db: AsyncSession,
    unit_id: int,
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None,
) -> dict:
    """Build LOGSTAT report data for a unit.

    Returns a structured dict containing supply status by class,
    formatted for standard USMC LOGSTAT format.
    """
    # Get unit info
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        return {"error": f"Unit {unit_id} not found"}

    now = datetime.now(timezone.utc)
    report_dtg = now.strftime("%d%H%MZ%b%y").upper()

    # Query supply records
    query = select(SupplyStatusRecord).where(
        SupplyStatusRecord.unit_id == unit_id
    )
    if period_start:
        query = query.where(SupplyStatusRecord.reported_at >= period_start)
    if period_end:
        query = query.where(SupplyStatusRecord.reported_at <= period_end)

    query = query.order_by(
        SupplyStatusRecord.supply_class,
        SupplyStatusRecord.reported_at.desc(),
    )
    result = await db.execute(query)
    records = result.scalars().all()

    # Group by supply class, take latest per class+item
    supply_sections = {}
    seen = set()
    for record in records:
        key = (record.supply_class.value, record.item_description)
        if key in seen:
            continue
        seen.add(key)

        sc = record.supply_class
        if sc not in supply_sections:
            supply_sections[sc] = {
                "class": sc.value,
                "class_name": SUPPLY_CLASS_NAMES.get(sc, sc.value),
                "items": [],
                "overall_status": None,
            }

        supply_sections[sc]["items"].append({
            "item": record.item_description,
            "on_hand": record.on_hand_qty,
            "required": record.required_qty,
            "dos": record.dos,
            "consumption_rate": record.consumption_rate,
            "status": record.status.value,
        })

    # Determine overall status per class
    for sc, section in supply_sections.items():
        if section["items"]:
            avg_dos = sum(i["dos"] for i in section["items"]) / len(section["items"])
            section["overall_status"] = determine_supply_status_by_dos(avg_dos).value

    logstat = {
        "report_type": "LOGSTAT",
        "unit": {
            "id": unit.id,
            "name": unit.name,
            "abbreviation": unit.abbreviation,
            "uic": unit.uic,
        },
        "dtg": report_dtg,
        "as_of": now.isoformat(),
        "period_start": period_start.isoformat() if period_start else None,
        "period_end": period_end.isoformat() if period_end else None,
        "supply_status": [
            supply_sections[sc]
            for sc in sorted(supply_sections.keys(), key=lambda x: x.value)
        ],
        "total_items": sum(len(s["items"]) for s in supply_sections.values()),
    }

    return logstat
