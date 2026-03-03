"""Rollup report aggregating data from subordinate units."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.analytics.aggregation import aggregate_for_unit
from app.models.unit import Unit


async def generate_rollup(
    db: AsyncSession,
    unit_id: int,
) -> dict:
    """Generate a rollup report aggregating subordinate unit reports.

    Provides a high-level view of the logistics posture for a
    unit and all its subordinates.
    """
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        return {"error": f"Unit {unit_id} not found"}

    now = datetime.now(timezone.utc)

    # Get aggregated data
    agg = await aggregate_for_unit(db, unit_id)

    # Get subordinate unit details
    children_result = await db.execute(select(Unit).where(Unit.parent_id == unit_id))
    children = children_result.scalars().all()

    subordinate_summaries = []
    for child in children:
        child_agg = await aggregate_for_unit(db, child.id)
        subordinate_summaries.append(
            {
                "unit_id": child.id,
                "name": child.name,
                "abbreviation": child.abbreviation,
                "echelon": child.echelon.value,
                "supply": child_agg.get("supply", {}),
                "equipment": child_agg.get("equipment", {}),
            }
        )

    report = {
        "report_type": "ROLLUP",
        "unit": {
            "id": unit.id,
            "name": unit.name,
            "abbreviation": unit.abbreviation,
            "echelon": unit.echelon.value,
        },
        "generated_at": now.isoformat(),
        "aggregate": {
            "supply": agg.get("supply", {}),
            "equipment": agg.get("equipment", {}),
            "subordinate_unit_count": agg.get("subordinate_unit_count", 0),
        },
        "subordinate_summaries": subordinate_summaries,
    }

    return report
