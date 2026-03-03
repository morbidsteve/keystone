"""Data aggregation across the unit hierarchy."""

from typing import Dict, List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.equipment import EquipmentStatus
from app.models.supply import SupplyClass, SupplyStatusRecord
from app.models.unit import Unit


async def _get_subordinate_ids(db: AsyncSession, unit_id: int) -> List[int]:
    """Recursively collect all subordinate unit IDs via BFS."""
    all_ids = []
    queue = [unit_id]

    while queue:
        current_id = queue.pop(0)
        all_ids.append(current_id)
        result = await db.execute(select(Unit.id).where(Unit.parent_id == current_id))
        children = [row[0] for row in result.all()]
        queue.extend(children)

    return all_ids


async def aggregate_for_unit(db: AsyncSession, unit_id: int) -> Dict:
    """Roll up supply and equipment data from all subordinate units.

    Returns aggregated totals, averages, and status summaries.
    """
    unit_ids = await _get_subordinate_ids(db, unit_id)

    # Aggregate supply data by class
    supply_agg = {}
    for sc in SupplyClass:
        result = await db.execute(
            select(
                func.sum(SupplyStatusRecord.on_hand_qty),
                func.sum(SupplyStatusRecord.required_qty),
                func.avg(SupplyStatusRecord.dos),
                func.avg(SupplyStatusRecord.consumption_rate),
                func.count(SupplyStatusRecord.id),
            ).where(
                SupplyStatusRecord.unit_id.in_(unit_ids),
                SupplyStatusRecord.supply_class == sc,
            )
        )
        row = result.one()
        on_hand = float(row[0]) if row[0] else 0.0
        required = float(row[1]) if row[1] else 0.0
        avg_dos = float(row[2]) if row[2] else 0.0
        avg_rate = float(row[3]) if row[3] else 0.0
        count = row[4] or 0

        if count > 0:
            supply_agg[sc.value] = {
                "total_on_hand": round(on_hand, 1),
                "total_required": round(required, 1),
                "fill_rate_pct": round(on_hand / required * 100, 1)
                if required > 0
                else 0.0,
                "avg_dos": round(avg_dos, 1),
                "avg_consumption_rate": round(avg_rate, 2),
                "record_count": count,
            }

    # Aggregate equipment data
    equip_result = await db.execute(
        select(
            func.sum(EquipmentStatus.total_possessed),
            func.sum(EquipmentStatus.mission_capable),
            func.sum(EquipmentStatus.not_mission_capable_maintenance),
            func.sum(EquipmentStatus.not_mission_capable_supply),
            func.count(EquipmentStatus.id),
        ).where(EquipmentStatus.unit_id.in_(unit_ids))
    )
    equip_row = equip_result.one()
    total_poss = equip_row[0] or 0
    total_mc = equip_row[1] or 0
    total_nmcm = equip_row[2] or 0
    total_nmcs = equip_row[3] or 0
    equip_count = equip_row[4] or 0

    equipment_agg = {
        "total_possessed": total_poss,
        "total_mission_capable": total_mc,
        "total_nmcm": total_nmcm,
        "total_nmcs": total_nmcs,
        "overall_readiness_pct": round(total_mc / total_poss * 100, 1)
        if total_poss > 0
        else 0.0,
        "equipment_lines": equip_count,
    }

    return {
        "unit_id": unit_id,
        "subordinate_unit_count": len(unit_ids) - 1,
        "supply": supply_agg,
        "equipment": equipment_agg,
    }
