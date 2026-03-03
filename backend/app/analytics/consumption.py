"""Supply consumption rate analytics."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.supply import SupplyClass, SupplyStatusRecord


async def calculate_consumption_rate(
    db: AsyncSession,
    unit_id: int,
    supply_class: SupplyClass,
    days: int = 30,
) -> float:
    """Compute average daily consumption rate for a supply class over a period.

    Looks at the difference between the earliest and latest on-hand quantities
    divided by the number of days in the window.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(func.avg(SupplyStatusRecord.consumption_rate)).where(
            SupplyStatusRecord.unit_id == unit_id,
            SupplyStatusRecord.supply_class == supply_class,
            SupplyStatusRecord.reported_at >= cutoff,
        )
    )
    avg_rate = result.scalar()
    return float(avg_rate) if avg_rate else 0.0


async def forecast_exhaustion(
    db: AsyncSession,
    unit_id: int,
    supply_class: SupplyClass,
) -> Optional[float]:
    """Project number of days until supply exhaustion based on current levels and consumption.

    Returns None if consumption rate is zero or no data available.
    """
    # Get latest supply record
    result = await db.execute(
        select(SupplyStatusRecord)
        .where(
            SupplyStatusRecord.unit_id == unit_id,
            SupplyStatusRecord.supply_class == supply_class,
        )
        .order_by(SupplyStatusRecord.reported_at.desc())
        .limit(1)
    )
    latest = result.scalar_one_or_none()
    if not latest:
        return None

    # Get average consumption rate
    avg_rate = await calculate_consumption_rate(db, unit_id, supply_class)
    if avg_rate <= 0:
        return None

    # Project days until exhaustion
    return round(latest.on_hand_qty / avg_rate, 1)
