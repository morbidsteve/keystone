"""Statistical anomaly detection for logistics metrics."""

import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.supply import SupplyStatusRecord
from app.models.equipment import EquipmentStatus


async def detect_anomalies(
    db: AsyncSession,
    unit_id: int,
    metric: str = "dos",
    window: int = 30,
    z_threshold: float = 2.0,
) -> List[Dict]:
    """Detect statistical anomalies using z-score method.

    Computes mean and standard deviation over the window period,
    then flags any data points that deviate by more than z_threshold
    standard deviations.

    Args:
        db: Database session
        unit_id: Unit to analyze
        metric: One of 'dos', 'on_hand_qty', 'consumption_rate', 'readiness_pct'
        window: Number of days to look back
        z_threshold: Number of std deviations to flag (default 2.0)

    Returns:
        List of anomaly dicts with the anomalous data points
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=window)

    if metric in ("dos", "on_hand_qty", "consumption_rate"):
        column_map = {
            "dos": SupplyStatusRecord.dos,
            "on_hand_qty": SupplyStatusRecord.on_hand_qty,
            "consumption_rate": SupplyStatusRecord.consumption_rate,
        }
        column = column_map[metric]

        # Get mean and stddev
        stats_result = await db.execute(
            select(
                func.avg(column),
                func.stddev(column),
                func.count(column),
            ).where(
                SupplyStatusRecord.unit_id == unit_id,
                SupplyStatusRecord.reported_at >= cutoff,
            )
        )
        stats = stats_result.one()
        mean = float(stats[0]) if stats[0] else 0.0
        stddev = float(stats[1]) if stats[1] else 0.0
        count = stats[2] or 0

        if count < 5 or stddev == 0:
            return []

        # Find anomalous records
        result = await db.execute(
            select(SupplyStatusRecord)
            .where(
                SupplyStatusRecord.unit_id == unit_id,
                SupplyStatusRecord.reported_at >= cutoff,
            )
            .order_by(SupplyStatusRecord.reported_at.desc())
        )
        records = result.scalars().all()

        anomalies = []
        for record in records:
            value = getattr(record, metric)
            if value is None:
                continue

            z_score = (value - mean) / stddev
            if abs(z_score) > z_threshold:
                anomalies.append({
                    "record_id": record.id,
                    "unit_id": record.unit_id,
                    "supply_class": record.supply_class.value,
                    "metric": metric,
                    "value": value,
                    "mean": round(mean, 2),
                    "stddev": round(stddev, 2),
                    "z_score": round(z_score, 2),
                    "reported_at": record.reported_at.isoformat() if record.reported_at else None,
                    "severity": "critical" if abs(z_score) > 3 else "warning",
                })

        return anomalies

    elif metric == "readiness_pct":
        stats_result = await db.execute(
            select(
                func.avg(EquipmentStatus.readiness_pct),
                func.stddev(EquipmentStatus.readiness_pct),
                func.count(EquipmentStatus.readiness_pct),
            ).where(
                EquipmentStatus.unit_id == unit_id,
                EquipmentStatus.reported_at >= cutoff,
            )
        )
        stats = stats_result.one()
        mean = float(stats[0]) if stats[0] else 0.0
        stddev = float(stats[1]) if stats[1] else 0.0
        count = stats[2] or 0

        if count < 5 or stddev == 0:
            return []

        result = await db.execute(
            select(EquipmentStatus)
            .where(
                EquipmentStatus.unit_id == unit_id,
                EquipmentStatus.reported_at >= cutoff,
            )
            .order_by(EquipmentStatus.reported_at.desc())
        )
        records = result.scalars().all()

        anomalies = []
        for record in records:
            z_score = (record.readiness_pct - mean) / stddev
            if abs(z_score) > z_threshold:
                anomalies.append({
                    "record_id": record.id,
                    "unit_id": record.unit_id,
                    "tamcn": record.tamcn,
                    "nomenclature": record.nomenclature,
                    "metric": metric,
                    "value": record.readiness_pct,
                    "mean": round(mean, 2),
                    "stddev": round(stddev, 2),
                    "z_score": round(z_score, 2),
                    "reported_at": record.reported_at.isoformat() if record.reported_at else None,
                    "severity": "critical" if abs(z_score) > 3 else "warning",
                })

        return anomalies

    return []
