"""Equipment readiness report generation."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.military import determine_readiness_status
from app.models.equipment import EquipmentStatus
from app.models.unit import Unit


async def generate_readiness_report(
    db: AsyncSession,
    unit_id: int,
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None,
) -> dict:
    """Generate an equipment readiness report for a unit.

    Includes per-equipment-type breakdown and overall readiness.
    """
    # Get unit info
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        return {"error": f"Unit {unit_id} not found"}

    now = datetime.now(timezone.utc)

    # Query equipment records
    query = select(EquipmentStatus).where(EquipmentStatus.unit_id == unit_id)
    if period_start:
        query = query.where(EquipmentStatus.reported_at >= period_start)
    if period_end:
        query = query.where(EquipmentStatus.reported_at <= period_end)

    query = query.order_by(EquipmentStatus.nomenclature, EquipmentStatus.reported_at.desc())
    result = await db.execute(query)
    records = result.scalars().all()

    # Group by nomenclature, take latest per type
    equipment_types = {}
    seen = set()
    for record in records:
        key = record.tamcn
        if key in seen:
            continue
        seen.add(key)

        equipment_types[key] = {
            "tamcn": record.tamcn,
            "nomenclature": record.nomenclature,
            "total_possessed": record.total_possessed,
            "mission_capable": record.mission_capable,
            "nmcm": record.not_mission_capable_maintenance,
            "nmcs": record.not_mission_capable_supply,
            "readiness_pct": record.readiness_pct,
            "status": determine_readiness_status(record.readiness_pct).value,
        }

    # Calculate overall readiness
    total_poss = sum(e["total_possessed"] for e in equipment_types.values())
    total_mc = sum(e["mission_capable"] for e in equipment_types.values())
    overall_pct = round(total_mc / total_poss * 100, 1) if total_poss > 0 else 0.0

    report = {
        "report_type": "READINESS",
        "unit": {
            "id": unit.id,
            "name": unit.name,
            "abbreviation": unit.abbreviation,
        },
        "generated_at": now.isoformat(),
        "period_start": period_start.isoformat() if period_start else None,
        "period_end": period_end.isoformat() if period_end else None,
        "overall_readiness_pct": overall_pct,
        "overall_status": determine_readiness_status(overall_pct).value,
        "total_possessed": total_poss,
        "total_mission_capable": total_mc,
        "total_nmc": total_poss - total_mc,
        "equipment_types": list(equipment_types.values()),
        "equipment_type_count": len(equipment_types),
    }

    return report
