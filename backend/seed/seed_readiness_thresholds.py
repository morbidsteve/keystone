"""Seed readiness thresholds for DRRS-style unit readiness evaluation.

Covers PLATOON, COMPANY, BATTALION, REGIMENT echelons with 5 metrics each:
equipment_readiness, supply_readiness, personnel_fill, training_readiness,
and overall_readiness.

Idempotent — checks (echelon, metric_name) unique constraint before inserting.
"""

import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.readiness_snapshot import ReadinessThreshold

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Threshold definitions by echelon and metric.
# green_min_pct: minimum % for GREEN status
# amber_min_pct: minimum % for AMBER status (below this = RED)
# ---------------------------------------------------------------------------

_READINESS_THRESHOLDS: list[dict] = [
    # --- PLATOON ---
    {
        "echelon": "PLATOON",
        "metric_name": "equipment_readiness",
        "green_min_pct": 90.0,
        "amber_min_pct": 75.0,
        "notes": "Equipment MC rate threshold for platoon-level reporting",
    },
    {
        "echelon": "PLATOON",
        "metric_name": "supply_readiness",
        "green_min_pct": 85.0,
        "amber_min_pct": 70.0,
        "notes": "Supply sufficiency threshold for platoon-level reporting",
    },
    {
        "echelon": "PLATOON",
        "metric_name": "personnel_fill",
        "green_min_pct": 90.0,
        "amber_min_pct": 80.0,
        "notes": "Personnel fill rate threshold for platoon-level reporting",
    },
    {
        "echelon": "PLATOON",
        "metric_name": "training_readiness",
        "green_min_pct": 85.0,
        "amber_min_pct": 70.0,
        "notes": "Training completion threshold for platoon-level reporting",
    },
    {
        "echelon": "PLATOON",
        "metric_name": "overall_readiness",
        "green_min_pct": 90.0,
        "amber_min_pct": 75.0,
        "notes": "Composite readiness threshold for platoon-level reporting",
    },
    # --- COMPANY ---
    {
        "echelon": "COMPANY",
        "metric_name": "equipment_readiness",
        "green_min_pct": 90.0,
        "amber_min_pct": 75.0,
        "notes": "Equipment MC rate threshold for company-level reporting",
    },
    {
        "echelon": "COMPANY",
        "metric_name": "supply_readiness",
        "green_min_pct": 85.0,
        "amber_min_pct": 70.0,
        "notes": "Supply sufficiency threshold for company-level reporting",
    },
    {
        "echelon": "COMPANY",
        "metric_name": "personnel_fill",
        "green_min_pct": 90.0,
        "amber_min_pct": 80.0,
        "notes": "Personnel fill rate threshold for company-level reporting",
    },
    {
        "echelon": "COMPANY",
        "metric_name": "training_readiness",
        "green_min_pct": 85.0,
        "amber_min_pct": 70.0,
        "notes": "Training completion threshold for company-level reporting",
    },
    {
        "echelon": "COMPANY",
        "metric_name": "overall_readiness",
        "green_min_pct": 90.0,
        "amber_min_pct": 75.0,
        "notes": "Composite readiness threshold for company-level reporting",
    },
    # --- BATTALION ---
    {
        "echelon": "BATTALION",
        "metric_name": "equipment_readiness",
        "green_min_pct": 90.0,
        "amber_min_pct": 75.0,
        "notes": "Equipment MC rate threshold for battalion-level reporting",
    },
    {
        "echelon": "BATTALION",
        "metric_name": "supply_readiness",
        "green_min_pct": 90.0,
        "amber_min_pct": 75.0,
        "notes": "Supply sufficiency threshold for battalion-level reporting",
    },
    {
        "echelon": "BATTALION",
        "metric_name": "personnel_fill",
        "green_min_pct": 90.0,
        "amber_min_pct": 80.0,
        "notes": "Personnel fill rate threshold for battalion-level reporting",
    },
    {
        "echelon": "BATTALION",
        "metric_name": "training_readiness",
        "green_min_pct": 85.0,
        "amber_min_pct": 70.0,
        "notes": "Training completion threshold for battalion-level reporting",
    },
    {
        "echelon": "BATTALION",
        "metric_name": "overall_readiness",
        "green_min_pct": 90.0,
        "amber_min_pct": 75.0,
        "notes": "Composite readiness threshold for battalion-level reporting",
    },
    # --- REGIMENT ---
    {
        "echelon": "REGIMENT",
        "metric_name": "equipment_readiness",
        "green_min_pct": 90.0,
        "amber_min_pct": 75.0,
        "notes": "Equipment MC rate threshold for regiment-level reporting",
    },
    {
        "echelon": "REGIMENT",
        "metric_name": "supply_readiness",
        "green_min_pct": 90.0,
        "amber_min_pct": 75.0,
        "notes": "Supply sufficiency threshold for regiment-level reporting",
    },
    {
        "echelon": "REGIMENT",
        "metric_name": "personnel_fill",
        "green_min_pct": 92.0,
        "amber_min_pct": 82.0,
        "notes": "Personnel fill rate threshold for regiment-level reporting",
    },
    {
        "echelon": "REGIMENT",
        "metric_name": "training_readiness",
        "green_min_pct": 85.0,
        "amber_min_pct": 70.0,
        "notes": "Training completion threshold for regiment-level reporting",
    },
    {
        "echelon": "REGIMENT",
        "metric_name": "overall_readiness",
        "green_min_pct": 90.0,
        "amber_min_pct": 75.0,
        "notes": "Composite readiness threshold for regiment-level reporting",
    },
]


async def seed_readiness_thresholds(db: AsyncSession) -> int:
    """Seed readiness thresholds. Returns count of items inserted.

    Idempotent — checks (echelon, metric_name) before inserting each record.
    """
    inserted = 0

    for threshold_data in _READINESS_THRESHOLDS:
        echelon = threshold_data["echelon"]
        metric_name = threshold_data["metric_name"]

        result = await db.execute(
            select(ReadinessThreshold).where(
                ReadinessThreshold.echelon == echelon,
                ReadinessThreshold.metric_name == metric_name,
            )
        )
        if result.scalar_one_or_none():
            continue

        record = ReadinessThreshold(**threshold_data)
        db.add(record)
        inserted += 1

    if inserted:
        await db.flush()

    return inserted
