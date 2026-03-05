"""Readiness calculation and snapshot generation service."""

from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.equipment import EquipmentStatus
from app.models.readiness_snapshot import UnitReadinessSnapshot
from app.models.supply import SupplyStatusRecord
from app.models.unit import Unit
from app.models.unit_strength import UnitStrength


class ReadinessService:
    """Calculate and manage unit readiness metrics."""

    @staticmethod
    def _percent_to_rating(pct: float, prefix: str = "C") -> str:
        """Convert a readiness percentage to a DRRS-style rating.

        >= 90 → -1 (highest)
        >= 75 → -2
        >= 60 → -3
        <  60 → -4 (lowest)
        """
        if pct >= 90:
            return f"{prefix}-1"
        elif pct >= 75:
            return f"{prefix}-2"
        elif pct >= 60:
            return f"{prefix}-3"
        else:
            return f"{prefix}-4"

    @staticmethod
    async def calculate_equipment_readiness(
        unit_id: int, db: AsyncSession
    ) -> tuple[float, Optional[str]]:
        """Calculate equipment readiness percentage for a unit.

        Uses EquipmentStatus records — ratio of mission_capable to
        total_possessed across all equipment types.
        """
        result = await db.execute(
            select(EquipmentStatus).where(EquipmentStatus.unit_id == unit_id)
        )
        records = result.scalars().all()

        if not records:
            return 0.0, "No equipment data available"

        total_possessed = sum(r.total_possessed for r in records)
        total_mc = sum(r.mission_capable for r in records)

        if total_possessed == 0:
            return 0.0, "No equipment possessed"

        pct = round(total_mc / total_possessed * 100, 1)

        limiting_text = None
        if pct < 90:
            # Identify lowest-readiness equipment type
            worst = min(records, key=lambda r: r.readiness_pct)
            limiting_text = (
                f"{worst.nomenclature} ({worst.tamcn}): {worst.readiness_pct:.0f}% MC"
            )

        return pct, limiting_text

    @staticmethod
    async def calculate_supply_readiness(
        unit_id: int, db: AsyncSession
    ) -> tuple[float, Optional[str]]:
        """Calculate supply readiness percentage for a unit.

        Items with >= 10 days of supply are considered ready.
        """
        result = await db.execute(
            select(SupplyStatusRecord).where(SupplyStatusRecord.unit_id == unit_id)
        )
        records = result.scalars().all()

        if not records:
            return 0.0, "No supply data available"

        ready_count = sum(1 for r in records if r.dos >= 10)
        total = len(records)
        pct = round(ready_count / total * 100, 1)

        limiting_text = None
        if pct < 90:
            critical = [r for r in records if r.dos < 10]
            if critical:
                worst = min(critical, key=lambda r: r.dos)
                limiting_text = (
                    f"{worst.item_description}: "
                    f"{worst.dos:.1f} DOS (Class {worst.supply_class.value})"
                )

        return pct, limiting_text

    @staticmethod
    async def calculate_personnel_readiness(
        unit_id: int, db: AsyncSession
    ) -> tuple[float, Optional[str]]:
        """Calculate personnel readiness from latest UnitStrength record."""
        result = await db.execute(
            select(UnitStrength)
            .where(UnitStrength.unit_id == unit_id)
            .order_by(UnitStrength.reported_at.desc())
            .limit(1)
        )
        strength = result.scalar_one_or_none()

        if not strength:
            return 0.0, "No personnel strength data available"

        pct = strength.fill_pct

        limiting_text = None
        if pct < 90 and strength.mos_shortfalls:
            shortfalls = strength.mos_shortfalls
            if isinstance(shortfalls, list) and shortfalls:
                limiting_text = f"MOS shortfalls: {len(shortfalls)} identified"

        return pct, limiting_text

    @staticmethod
    async def calculate_training_readiness(
        unit_id: int, db: AsyncSession
    ) -> tuple[float, Optional[str]]:
        """Calculate training readiness (placeholder).

        Returns a default 80% until training tracking is implemented.
        """
        return 80.0, None

    @staticmethod
    async def calculate_composite_readiness(
        unit_id: int,
        db: AsyncSession,
        weights: Optional[dict[str, float]] = None,
    ) -> tuple[float, Optional[str]]:
        """Calculate weighted composite readiness across all domains.

        Default weights: equipment 35%, supply 25%, personnel 25%, training 15%.
        """
        if weights is None:
            weights = {
                "equipment": 0.35,
                "supply": 0.25,
                "personnel": 0.25,
                "training": 0.15,
            }

        equip_pct, equip_lim = await ReadinessService.calculate_equipment_readiness(
            unit_id, db
        )
        supply_pct, supply_lim = await ReadinessService.calculate_supply_readiness(
            unit_id, db
        )
        pers_pct, pers_lim = await ReadinessService.calculate_personnel_readiness(
            unit_id, db
        )
        train_pct, train_lim = await ReadinessService.calculate_training_readiness(
            unit_id, db
        )

        composite = (
            equip_pct * weights["equipment"]
            + supply_pct * weights["supply"]
            + pers_pct * weights["personnel"]
            + train_pct * weights["training"]
        )
        composite = round(composite, 1)

        # Determine limiting factor from worst component
        components = [
            (equip_pct, equip_lim, "Equipment"),
            (supply_pct, supply_lim, "Supply"),
            (pers_pct, pers_lim, "Personnel"),
            (train_pct, train_lim, "Training"),
        ]
        worst = min(components, key=lambda c: c[0])
        limiting_text = worst[1] if worst[1] else f"{worst[2]} at {worst[0]:.1f}%"

        return composite, limiting_text

    @staticmethod
    async def generate_readiness_snapshot(
        unit_id: int,
        db: AsyncSession,
        reported_by_id: Optional[int] = None,
        notes: Optional[str] = None,
        is_official: bool = False,
    ) -> UnitReadinessSnapshot:
        """Generate a complete readiness snapshot for a unit."""
        equip_pct, equip_lim = await ReadinessService.calculate_equipment_readiness(
            unit_id, db
        )
        supply_pct, supply_lim = await ReadinessService.calculate_supply_readiness(
            unit_id, db
        )
        pers_pct, pers_lim = await ReadinessService.calculate_personnel_readiness(
            unit_id, db
        )
        train_pct, train_lim = await ReadinessService.calculate_training_readiness(
            unit_id, db
        )

        composite, limiting = await ReadinessService.calculate_composite_readiness(
            unit_id, db
        )

        snapshot = UnitReadinessSnapshot(
            unit_id=unit_id,
            snapshot_date=datetime.now(timezone.utc),
            overall_readiness_pct=composite,
            equipment_readiness_pct=equip_pct,
            supply_readiness_pct=supply_pct,
            personnel_fill_pct=pers_pct,
            training_readiness_pct=train_pct,
            t_rating=ReadinessService._percent_to_rating(train_pct, "T"),
            c_rating=ReadinessService._percent_to_rating(composite, "C"),
            s_rating=ReadinessService._percent_to_rating(supply_pct, "S"),
            r_rating=ReadinessService._percent_to_rating(equip_pct, "R"),
            p_rating=ReadinessService._percent_to_rating(pers_pct, "P"),
            limiting_factor=limiting,
            notes=notes,
            reported_by_id=reported_by_id,
            is_official=is_official,
        )

        db.add(snapshot)
        await db.flush()
        await db.refresh(snapshot)
        return snapshot

    @staticmethod
    async def roll_up_readiness(parent_unit_id: int, db: AsyncSession) -> dict:
        """Roll up readiness from subordinate units.

        Gets the latest snapshot for each subordinate and averages.
        """
        # Get subordinate units ordered by echelon and name
        result = await db.execute(
            select(Unit)
            .where(Unit.parent_id == parent_unit_id)
            .order_by(Unit.echelon, Unit.name)
        )
        subordinates = result.scalars().all()

        if not subordinates:
            return {
                "unit_id": parent_unit_id,
                "num_subordinates": 0,
                "avg_overall_readiness_pct": 0.0,
                "avg_equipment_readiness_pct": 0.0,
                "avg_supply_readiness_pct": 0.0,
                "avg_personnel_fill_pct": 0.0,
                "avg_training_readiness_pct": 0.0,
                "subordinates": [],
            }

        sub_data = []
        totals = {
            "overall": 0.0,
            "equipment": 0.0,
            "supply": 0.0,
            "personnel": 0.0,
            "training": 0.0,
        }
        count_with_snapshots = 0

        for sub in subordinates:
            snap_result = await db.execute(
                select(UnitReadinessSnapshot)
                .where(UnitReadinessSnapshot.unit_id == sub.id)
                .order_by(UnitReadinessSnapshot.snapshot_date.desc())
                .limit(1)
            )
            snapshot = snap_result.scalar_one_or_none()

            sub_info: dict = {
                "unit_id": sub.id,
                "unit_name": sub.name,
                "abbreviation": sub.abbreviation,
                "echelon_label": sub.echelon.value if sub.echelon else "CUSTOM",
            }

            if snapshot:
                count_with_snapshots += 1
                sub_info["overall_readiness_pct"] = snapshot.overall_readiness_pct
                sub_info["equipment_readiness_pct"] = snapshot.equipment_readiness_pct
                sub_info["supply_readiness_pct"] = snapshot.supply_readiness_pct
                sub_info["personnel_fill_pct"] = snapshot.personnel_fill_pct
                sub_info["training_readiness_pct"] = snapshot.training_readiness_pct
                sub_info["c_rating"] = snapshot.c_rating
                sub_info["snapshot_date"] = (
                    snapshot.snapshot_date.isoformat()
                    if snapshot.snapshot_date
                    else None
                )
                sub_info["limiting_factor"] = snapshot.limiting_factor

                totals["overall"] += snapshot.overall_readiness_pct or 0
                totals["equipment"] += snapshot.equipment_readiness_pct or 0
                totals["supply"] += snapshot.supply_readiness_pct or 0
                totals["personnel"] += snapshot.personnel_fill_pct or 0
                totals["training"] += snapshot.training_readiness_pct or 0
            else:
                sub_info["overall_readiness_pct"] = None
                sub_info["snapshot_date"] = None
                sub_info["limiting_factor"] = None

            sub_data.append(sub_info)

        divisor = max(count_with_snapshots, 1)

        return {
            "unit_id": parent_unit_id,
            "num_subordinates": len(subordinates),
            "avg_overall_readiness_pct": round(totals["overall"] / divisor, 1),
            "avg_equipment_readiness_pct": round(totals["equipment"] / divisor, 1),
            "avg_supply_readiness_pct": round(totals["supply"] / divisor, 1),
            "avg_personnel_fill_pct": round(totals["personnel"] / divisor, 1),
            "avg_training_readiness_pct": round(totals["training"] / divisor, 1),
            "subordinates": sub_data,
        }
