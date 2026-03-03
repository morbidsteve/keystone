"""Sustainability and days-of-supply projection analytics."""

from typing import Dict, List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.supply import SupplyClass, SupplyStatusRecord
from app.core.military import determine_supply_status_by_dos


async def days_of_supply(
    db: AsyncSession,
    unit_id: int,
    supply_class: SupplyClass,
) -> float:
    """Calculate current days-of-supply for a specific supply class and unit."""
    result = await db.execute(
        select(func.avg(SupplyStatusRecord.dos)).where(
            SupplyStatusRecord.unit_id == unit_id,
            SupplyStatusRecord.supply_class == supply_class,
        )
    )
    avg_dos = result.scalar()
    return float(avg_dos) if avg_dos else 0.0


async def sustainability_projection(
    db: AsyncSession,
    unit_id: int,
) -> List[Dict]:
    """Project days until critical for each supply class.

    Returns a list of projections with current DOS, consumption rate,
    and estimated days until the supply reaches critical (RED) status.
    """
    projections = []

    for sc in SupplyClass:
        # Get latest supply records for this class
        result = await db.execute(
            select(
                func.avg(SupplyStatusRecord.dos),
                func.avg(SupplyStatusRecord.consumption_rate),
                func.sum(SupplyStatusRecord.on_hand_qty),
            ).where(
                SupplyStatusRecord.unit_id == unit_id,
                SupplyStatusRecord.supply_class == sc,
            )
        )
        row = result.one()
        avg_dos = float(row[0]) if row[0] else 0.0
        avg_rate = float(row[1]) if row[1] else 0.0
        total_on_hand = float(row[2]) if row[2] else 0.0

        if avg_dos == 0 and total_on_hand == 0:
            continue

        # Calculate days until critical (DOS < 3)
        days_to_critical = None
        if avg_rate > 0 and avg_dos > 3:
            # How many days at current rate until DOS drops to 3?
            days_to_critical = round(
                (avg_dos - 3.0) * (total_on_hand / avg_rate) / max(avg_dos, 1), 1
            )

        # Calculate days until exhaustion
        days_to_exhaustion = None
        if avg_rate > 0:
            days_to_exhaustion = round(total_on_hand / avg_rate, 1)

        projections.append(
            {
                "supply_class": sc.value,
                "current_dos": round(avg_dos, 1),
                "consumption_rate": round(avg_rate, 2),
                "total_on_hand": round(total_on_hand, 1),
                "days_to_critical": days_to_critical,
                "days_to_exhaustion": days_to_exhaustion,
                "status": determine_supply_status_by_dos(avg_dos).value,
            }
        )

    return projections
