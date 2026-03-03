"""Supply status report generation."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.military import SUPPLY_CLASS_NAMES, determine_supply_status_by_dos
from app.models.supply import SupplyClass, SupplyStatus, SupplyStatusRecord
from app.models.unit import Unit


async def generate_supply_status(
    db: AsyncSession,
    unit_id: int,
    period_start: Optional[datetime] = None,
    period_end: Optional[datetime] = None,
) -> dict:
    """Generate a comprehensive supply status report for a unit.

    Includes per-class summary, critical items, and trend indicators.
    """
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        return {"error": f"Unit {unit_id} not found"}

    now = datetime.now(timezone.utc)
    class_summaries = []

    for sc in SupplyClass:
        query = select(SupplyStatusRecord).where(
            SupplyStatusRecord.unit_id == unit_id,
            SupplyStatusRecord.supply_class == sc,
        )
        if period_start:
            query = query.where(SupplyStatusRecord.reported_at >= period_start)
        if period_end:
            query = query.where(SupplyStatusRecord.reported_at <= period_end)

        query = query.order_by(SupplyStatusRecord.reported_at.desc())
        result = await db.execute(query)
        records = result.scalars().all()

        if not records:
            continue

        total_on_hand = sum(r.on_hand_qty for r in records)
        total_required = sum(r.required_qty for r in records)
        avg_dos = sum(r.dos for r in records) / len(records) if records else 0
        avg_rate = sum(r.consumption_rate for r in records) / len(records) if records else 0

        red_items = [r for r in records if r.status == SupplyStatus.RED]
        amber_items = [r for r in records if r.status == SupplyStatus.AMBER]

        class_summaries.append({
            "supply_class": sc.value,
            "class_name": SUPPLY_CLASS_NAMES.get(sc, sc.value),
            "total_on_hand": round(total_on_hand, 1),
            "total_required": round(total_required, 1),
            "fill_rate_pct": round(total_on_hand / total_required * 100, 1) if total_required > 0 else 0.0,
            "avg_dos": round(avg_dos, 1),
            "avg_consumption_rate": round(avg_rate, 2),
            "item_count": len(records),
            "red_items": len(red_items),
            "amber_items": len(amber_items),
            "status": determine_supply_status_by_dos(avg_dos).value,
            "critical_items": [
                {
                    "item": r.item_description,
                    "on_hand": r.on_hand_qty,
                    "required": r.required_qty,
                    "dos": r.dos,
                }
                for r in red_items[:5]
            ],
        })

    # Overall supply health
    total_classes = len(class_summaries)
    red_classes = sum(1 for c in class_summaries if c["status"] == "RED")
    amber_classes = sum(1 for c in class_summaries if c["status"] == "AMBER")

    report = {
        "report_type": "SUPPLY_STATUS",
        "unit": {
            "id": unit.id,
            "name": unit.name,
            "abbreviation": unit.abbreviation,
        },
        "generated_at": now.isoformat(),
        "period_start": period_start.isoformat() if period_start else None,
        "period_end": period_end.isoformat() if period_end else None,
        "overall_health": "RED" if red_classes > 0 else ("AMBER" if amber_classes > 0 else "GREEN"),
        "total_classes_tracked": total_classes,
        "red_classes": red_classes,
        "amber_classes": amber_classes,
        "class_summaries": class_summaries,
    }

    return report
