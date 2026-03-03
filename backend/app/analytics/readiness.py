"""Equipment readiness analytics."""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.equipment import EquipmentStatus


async def calculate_readiness(
    db: AsyncSession,
    unit_id: int,
    equipment_type: Optional[str] = None,
) -> float:
    """Calculate current readiness percentage for a unit.

    Optionally filter by equipment type (nomenclature).
    """
    query = select(
        func.sum(EquipmentStatus.mission_capable),
        func.sum(EquipmentStatus.total_possessed),
    ).where(EquipmentStatus.unit_id == unit_id)

    if equipment_type:
        query = query.where(EquipmentStatus.nomenclature.ilike(f"%{equipment_type}%"))

    result = await db.execute(query)
    row = result.one()

    mc = row[0] or 0
    total = row[1] or 0

    if total == 0:
        return 0.0

    return round(mc / total * 100, 1)


async def readiness_trend(
    db: AsyncSession,
    unit_id: int,
    days: int = 30,
) -> List[Dict]:
    """Get historical readiness data points for a unit.

    Returns list of {date, readiness_pct, total_mc, total_poss} dicts.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(
            func.date_trunc("day", EquipmentStatus.reported_at).label("day"),
            func.sum(EquipmentStatus.mission_capable).label("mc"),
            func.sum(EquipmentStatus.total_possessed).label("total"),
        )
        .where(
            EquipmentStatus.unit_id == unit_id,
            EquipmentStatus.reported_at >= cutoff,
        )
        .group_by(func.date_trunc("day", EquipmentStatus.reported_at))
        .order_by(func.date_trunc("day", EquipmentStatus.reported_at))
    )

    data_points = []
    for row in result.all():
        mc = row[1] or 0
        total = row[2] or 0
        pct = round(mc / total * 100, 1) if total > 0 else 0.0

        data_points.append(
            {
                "date": row[0].isoformat() if row[0] else None,
                "readiness_pct": pct,
                "total_mission_capable": mc,
                "total_possessed": total,
            }
        )

    return data_points
