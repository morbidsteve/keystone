"""Dashboard endpoints for commander overview."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.military import determine_readiness_status, determine_supply_status_by_dos
from app.core.permissions import get_accessible_units
from app.database import get_db
from app.models.alert import Alert, AlertSeverity
from app.models.equipment import EquipmentStatus
from app.models.supply import SupplyClass, SupplyStatus, SupplyStatusRecord
from app.models.transportation import Movement, MovementStatus
from app.models.unit import Unit
from app.models.user import User
from app.schemas.dashboard import (
    AlertSummary,
    DashboardSummary,
    ReadinessSummary,
    SupplyClassSummary,
    SustainabilityProjection,
)

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    unit_id: Optional[int] = Query(None, description="Unit ID to filter by"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Commander overview: aggregated supply/readiness/alerts for user's unit and subordinates."""
    accessible = await get_accessible_units(db, current_user)

    if unit_id and unit_id in accessible:
        # Re-calculate accessible from the specified unit down
        from app.core.permissions import get_accessible_units as _get_units

        target_user = User(unit_id=unit_id, role=current_user.role)
        target_user.unit_id = unit_id
        unit_ids = []
        queue = [unit_id]
        while queue:
            cid = queue.pop(0)
            unit_ids.append(cid)
            result = await db.execute(
                select(Unit.id).where(Unit.parent_id == cid)
            )
            queue.extend([r[0] for r in result.all()])
    else:
        unit_ids = accessible

    if not unit_ids:
        return DashboardSummary(
            supply_overview=[],
            equipment_readiness=0.0,
            active_movements=0,
            critical_alerts=0,
            total_alerts=0,
        )

    # Supply overview by class
    supply_overview = await _get_supply_overview(db, unit_ids)

    # Equipment readiness
    equip_result = await db.execute(
        select(
            func.sum(EquipmentStatus.mission_capable),
            func.sum(EquipmentStatus.total_possessed),
        ).where(EquipmentStatus.unit_id.in_(unit_ids))
    )
    equip_row = equip_result.one()
    mc = equip_row[0] or 0
    total = equip_row[1] or 0
    equipment_readiness = (mc / total * 100) if total > 0 else 0.0

    # Active movements
    move_result = await db.execute(
        select(func.count(Movement.id)).where(
            Movement.unit_id.in_(unit_ids),
            Movement.status.in_([MovementStatus.PLANNED, MovementStatus.EN_ROUTE]),
        )
    )
    active_movements = move_result.scalar() or 0

    # Alerts
    critical_result = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.unit_id.in_(unit_ids),
            Alert.severity == AlertSeverity.CRITICAL,
            Alert.acknowledged == False,
        )
    )
    critical_alerts = critical_result.scalar() or 0

    total_alert_result = await db.execute(
        select(func.count(Alert.id)).where(
            Alert.unit_id.in_(unit_ids),
            Alert.acknowledged == False,
        )
    )
    total_alerts = total_alert_result.scalar() or 0

    # Recent alerts
    alerts_result = await db.execute(
        select(Alert)
        .where(Alert.unit_id.in_(unit_ids), Alert.acknowledged == False)
        .order_by(Alert.created_at.desc())
        .limit(20)
    )
    recent_alerts = [
        AlertSummary(
            id=a.id,
            alert_type=a.alert_type,
            severity=a.severity,
            message=a.message,
            unit_id=a.unit_id,
            acknowledged=a.acknowledged,
            created_at=a.created_at,
        )
        for a in alerts_result.scalars().all()
    ]

    return DashboardSummary(
        supply_overview=supply_overview,
        equipment_readiness=round(equipment_readiness, 1),
        active_movements=active_movements,
        critical_alerts=critical_alerts,
        total_alerts=total_alerts,
        recent_alerts=recent_alerts,
    )


async def _get_supply_overview(
    db: AsyncSession, unit_ids: list[int]
) -> list[SupplyClassSummary]:
    """Get supply overview aggregated by class."""
    summaries = []
    for sc in SupplyClass:
        result = await db.execute(
            select(
                func.avg(SupplyStatusRecord.dos),
                func.count(SupplyStatusRecord.id),
            ).where(
                SupplyStatusRecord.unit_id.in_(unit_ids),
                SupplyStatusRecord.supply_class == sc,
            )
        )
        row = result.one()
        avg_dos = row[0] or 0.0
        count = row[1] or 0

        if count > 0:
            summaries.append(
                SupplyClassSummary(
                    supply_class=sc,
                    avg_dos=round(avg_dos, 1),
                    status=determine_supply_status_by_dos(avg_dos),
                    item_count=count,
                )
            )

    return summaries


@router.get("/supply-overview", response_model=List[SupplyClassSummary])
async def get_supply_overview(
    unit_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supply status breakdown by class."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id and unit_id in accessible:
        unit_ids = [unit_id]
    else:
        unit_ids = accessible

    return await _get_supply_overview(db, unit_ids)


@router.get("/readiness-overview", response_model=List[ReadinessSummary])
async def get_readiness_overview(
    unit_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Equipment readiness overview per unit."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id and unit_id in accessible:
        target_ids = [unit_id]
    else:
        target_ids = accessible

    summaries = []
    for uid in target_ids:
        unit_result = await db.execute(select(Unit).where(Unit.id == uid))
        unit = unit_result.scalar_one_or_none()
        if not unit:
            continue

        equip_result = await db.execute(
            select(
                func.sum(EquipmentStatus.total_possessed),
                func.sum(EquipmentStatus.mission_capable),
                func.sum(
                    EquipmentStatus.not_mission_capable_maintenance
                    + EquipmentStatus.not_mission_capable_supply
                ),
            ).where(EquipmentStatus.unit_id == uid)
        )
        row = equip_result.one()
        total = row[0] or 0
        mc = row[1] or 0
        nmc = row[2] or 0

        if total > 0:
            summaries.append(
                ReadinessSummary(
                    unit_id=uid,
                    unit_name=unit.abbreviation,
                    overall_readiness_pct=round(mc / total * 100, 1),
                    total_equipment=total,
                    mission_capable=mc,
                    not_mission_capable=nmc,
                )
            )

    return summaries


@router.get("/sustainability", response_model=List[SustainabilityProjection])
async def get_sustainability(
    unit_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Days-of-supply projections by supply class."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id and unit_id in accessible:
        unit_ids = [unit_id]
    else:
        unit_ids = accessible

    projections = []
    for sc in SupplyClass:
        result = await db.execute(
            select(
                func.avg(SupplyStatusRecord.dos),
                func.avg(SupplyStatusRecord.consumption_rate),
                func.sum(SupplyStatusRecord.on_hand_qty),
            ).where(
                SupplyStatusRecord.unit_id.in_(unit_ids),
                SupplyStatusRecord.supply_class == sc,
            )
        )
        row = result.one()
        avg_dos = row[0] or 0.0
        avg_rate = row[1] or 0.0
        total_on_hand = row[2] or 0.0

        projected_days = None
        if avg_rate > 0:
            projected_days = round(total_on_hand / avg_rate, 1)

        if avg_dos > 0 or total_on_hand > 0:
            projections.append(
                SustainabilityProjection(
                    supply_class=sc,
                    current_dos=round(avg_dos, 1),
                    consumption_rate=round(avg_rate, 2),
                    projected_exhaustion_days=projected_days,
                    status=determine_supply_status_by_dos(avg_dos),
                )
            )

    return projections


@router.get("/alerts", response_model=List[AlertSummary])
async def get_dashboard_alerts(
    unit_id: Optional[int] = Query(None),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Active alerts for the user's accessible units."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id and unit_id in accessible:
        unit_ids = [unit_id]
    else:
        unit_ids = accessible

    result = await db.execute(
        select(Alert)
        .where(Alert.unit_id.in_(unit_ids))
        .order_by(Alert.created_at.desc())
        .limit(limit)
    )
    alerts = result.scalars().all()

    return [
        AlertSummary(
            id=a.id,
            alert_type=a.alert_type,
            severity=a.severity,
            message=a.message,
            unit_id=a.unit_id,
            acknowledged=a.acknowledged,
            created_at=a.created_at,
        )
        for a in alerts
    ]
