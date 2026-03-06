"""Full-text search endpoint querying across multiple entity types."""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.permissions import get_accessible_units
from app.database import get_db
from app.models.alert import Alert
from app.models.equipment import EquipmentStatus
from app.models.maintenance import MaintenanceWorkOrder
from app.models.personnel import Personnel
from app.models.requisition import Requisition
from app.models.unit import Unit
from app.models.user import User

router = APIRouter()


@router.get("/search")
async def search(
    q: str = Query(..., min_length=2, max_length=100),
    limit: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search across personnel, equipment, work orders, requisitions, units, and alerts.

    Returns results grouped by category with a total count.
    """
    accessible = await get_accessible_units(db, current_user)
    term = f"%{q}%"

    results: Dict[str, List[Dict[str, Any]]] = {
        "personnel": [],
        "equipment": [],
        "work_orders": [],
        "requisitions": [],
        "units": [],
        "alerts": [],
    }

    # --- Personnel (full_name = last_name + first_name, edipi, mos) ---
    personnel_q = (
        select(Personnel)
        .where(
            Personnel.unit_id.in_(accessible),
            or_(
                (Personnel.last_name + ", " + Personnel.first_name).ilike(term),
                Personnel.first_name.ilike(term),
                Personnel.last_name.ilike(term),
                Personnel.edipi.ilike(term),
                Personnel.mos.ilike(term),
            ),
        )
        .limit(limit)
    )
    personnel_result = await db.execute(personnel_q)
    for p in personnel_result.scalars().all():
        results["personnel"].append(
            {
                "id": p.id,
                "label": f"{p.rank or ''} {p.last_name}, {p.first_name}".strip(),
                "sublabel": f"{p.mos or ''} / Unit {p.unit_id}".strip(),
            }
        )

    # --- Equipment (EquipmentStatus: nomenclature, tamcn) ---
    equip_q = (
        select(EquipmentStatus)
        .where(
            EquipmentStatus.unit_id.in_(accessible),
            or_(
                EquipmentStatus.nomenclature.ilike(term),
                EquipmentStatus.tamcn.ilike(term),
            ),
        )
        .limit(limit)
    )
    equip_result = await db.execute(equip_q)
    for e in equip_result.scalars().all():
        results["equipment"].append(
            {
                "id": e.id,
                "label": e.nomenclature,
                "sublabel": f"TAMCN {e.tamcn} / Unit {e.unit_id}",
            }
        )

    # --- Maintenance Work Orders (work_order_number, description) ---
    wo_q = (
        select(MaintenanceWorkOrder)
        .where(
            MaintenanceWorkOrder.unit_id.in_(accessible),
            or_(
                MaintenanceWorkOrder.work_order_number.ilike(term),
                MaintenanceWorkOrder.description.ilike(term),
            ),
        )
        .limit(limit)
    )
    wo_result = await db.execute(wo_q)
    for w in wo_result.scalars().all():
        results["work_orders"].append(
            {
                "id": w.id,
                "label": w.work_order_number,
                "sublabel": (w.description or "")[:80],
            }
        )

    # --- Requisitions (requisition_number) ---
    req_q = (
        select(Requisition)
        .where(
            Requisition.unit_id.in_(accessible),
            Requisition.requisition_number.ilike(term),
        )
        .limit(limit)
    )
    req_result = await db.execute(req_q)
    for r in req_result.scalars().all():
        results["requisitions"].append(
            {
                "id": r.id,
                "label": r.requisition_number,
                "sublabel": f"{r.status.value} / Unit {r.unit_id}",
            }
        )

    # --- Units (name, uic) ---
    unit_q = (
        select(Unit)
        .where(
            Unit.id.in_(accessible),
            or_(
                Unit.name.ilike(term),
                Unit.uic.ilike(term),
            ),
        )
        .limit(limit)
    )
    unit_result = await db.execute(unit_q)
    for u in unit_result.scalars().all():
        results["units"].append(
            {
                "id": u.id,
                "label": u.name,
                "sublabel": f"UIC {u.uic or 'N/A'} / {u.echelon.value}",
            }
        )

    # --- Alerts (message field — Alert model does not have a 'title' column) ---
    alert_q = (
        select(Alert)
        .where(
            Alert.unit_id.in_(accessible),
            Alert.message.ilike(term),
        )
        .limit(limit)
    )
    alert_result = await db.execute(alert_q)
    for a in alert_result.scalars().all():
        results["alerts"].append(
            {
                "id": a.id,
                "label": f"[{a.severity.value}] {a.alert_type.value}",
                "sublabel": (a.message or "")[:80],
            }
        )

    total = sum(len(v) for v in results.values())

    return {
        "query": q,
        "results": results,
        "total": total,
    }
