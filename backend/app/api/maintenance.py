"""Maintenance work order CRUD endpoints with parts and labor sub-routes."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import get_accessible_units, require_role
from app.database import get_db
from app.models.maintenance import (
    MaintenanceLabor,
    MaintenancePart,
    MaintenanceWorkOrder,
    WorkOrderStatus,
)
from app.models.maintenance_schedule import (
    MaintenanceDeadline,
    PreventiveMaintenanceSchedule,
)
from app.models.user import Role, User
from app.schemas.maintenance import (
    MaintenanceDeadlineCreate,
    MaintenanceDeadlineResponse,
    MaintenanceDeadlineUpdate,
    MaintenanceLaborCreate,
    MaintenanceLaborResponse,
    MaintenanceLaborUpdate,
    MaintenancePartCreate,
    MaintenancePartResponse,
    MaintenancePartUpdate,
    MaintenanceWorkOrderCreate,
    MaintenanceWorkOrderDetailResponse,
    MaintenanceWorkOrderResponse,
    MaintenanceWorkOrderUpdate,
    PreventiveMaintenanceScheduleCreate,
    PreventiveMaintenanceScheduleResponse,
)

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S4]


# --- Work Order CRUD ---


@router.get("/", response_model=List[MaintenanceWorkOrderResponse])
async def list_work_orders(
    unit_id: Optional[int] = Query(None),
    equipment_id: Optional[int] = Query(None),
    status: Optional[WorkOrderStatus] = Query(None),
    priority: Optional[int] = Query(None, ge=1, le=5),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List maintenance work orders filtered by unit access."""
    accessible = await get_accessible_units(db, current_user)
    query = select(MaintenanceWorkOrder).where(
        MaintenanceWorkOrder.unit_id.in_(accessible)
    )

    if unit_id and unit_id in accessible:
        query = query.where(MaintenanceWorkOrder.unit_id == unit_id)
    if equipment_id is not None:
        query = query.where(
            MaintenanceWorkOrder.individual_equipment_id == equipment_id
        )
    if status:
        query = query.where(MaintenanceWorkOrder.status == status)
    if priority is not None:
        query = query.where(MaintenanceWorkOrder.priority == priority)

    query = (
        query.order_by(
            MaintenanceWorkOrder.priority.asc(),
            MaintenanceWorkOrder.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{wo_id}", response_model=MaintenanceWorkOrderDetailResponse)
async def get_work_order(
    wo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single work order with parts and labor entries."""
    query = (
        select(MaintenanceWorkOrder)
        .where(MaintenanceWorkOrder.id == wo_id)
        .options(
            selectinload(MaintenanceWorkOrder.parts),
            selectinload(MaintenanceWorkOrder.labor_entries),
        )
    )
    result = await db.execute(query)
    wo = result.scalar_one_or_none()
    if not wo:
        raise NotFoundError("Work Order", wo_id)

    accessible = await get_accessible_units(db, current_user)
    if wo.unit_id not in accessible:
        raise NotFoundError("Work Order", wo_id)

    return wo


@router.post(
    "/",
    response_model=MaintenanceWorkOrderResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_work_order(
    data: MaintenanceWorkOrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new maintenance work order."""
    accessible = await get_accessible_units(db, current_user)
    if data.unit_id not in accessible:
        raise NotFoundError("Unit", data.unit_id)

    wo = MaintenanceWorkOrder(**data.model_dump())
    db.add(wo)
    await db.flush()
    await db.refresh(wo)
    return wo


@router.put(
    "/{wo_id}",
    response_model=MaintenanceWorkOrderResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_work_order(
    wo_id: int,
    data: MaintenanceWorkOrderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a maintenance work order."""
    result = await db.execute(
        select(MaintenanceWorkOrder).where(MaintenanceWorkOrder.id == wo_id)
    )
    wo = result.scalar_one_or_none()
    if not wo:
        raise NotFoundError("Work Order", wo_id)

    accessible = await get_accessible_units(db, current_user)
    if wo.unit_id not in accessible:
        raise NotFoundError("Work Order", wo_id)

    update_data = data.model_dump(exclude_unset=True)

    # HIGH-1: Validate new unit_id is accessible before allowing reassignment
    if "unit_id" in update_data and update_data["unit_id"] not in accessible:
        raise NotFoundError("Unit", update_data["unit_id"])

    for field, value in update_data.items():
        setattr(wo, field, value)

    await db.flush()
    await db.refresh(wo)
    return wo


@router.delete(
    "/{wo_id}",
    status_code=204,
    dependencies=[Depends(require_role([Role.ADMIN]))],
)
async def delete_work_order(
    wo_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a maintenance work order (ADMIN only)."""
    result = await db.execute(
        select(MaintenanceWorkOrder).where(MaintenanceWorkOrder.id == wo_id)
    )
    wo = result.scalar_one_or_none()
    if not wo:
        raise NotFoundError("Work Order", wo_id)

    accessible = await get_accessible_units(db, current_user)
    if wo.unit_id not in accessible:
        raise NotFoundError("Work Order", wo_id)

    await db.delete(wo)
    await db.flush()


# --- Part sub-routes ---


async def _get_work_order_for_sub(
    wo_id: int, db: AsyncSession, current_user: User
) -> MaintenanceWorkOrder:
    """Helper: fetch and authorize a work order for sub-resource operations."""
    result = await db.execute(
        select(MaintenanceWorkOrder).where(MaintenanceWorkOrder.id == wo_id)
    )
    wo = result.scalar_one_or_none()
    if not wo:
        raise NotFoundError("Work Order", wo_id)

    accessible = await get_accessible_units(db, current_user)
    if wo.unit_id not in accessible:
        raise NotFoundError("Work Order", wo_id)
    return wo


@router.post(
    "/{wo_id}/parts",
    response_model=MaintenancePartResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def add_part(
    wo_id: int,
    data: MaintenancePartCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a part line item to a work order."""
    await _get_work_order_for_sub(wo_id, db, current_user)

    part = MaintenancePart(work_order_id=wo_id, **data.model_dump())
    db.add(part)
    await db.flush()
    await db.refresh(part)
    return part


@router.put(
    "/{wo_id}/parts/{part_id}",
    response_model=MaintenancePartResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_part(
    wo_id: int,
    part_id: int,
    data: MaintenancePartUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a part line item."""
    await _get_work_order_for_sub(wo_id, db, current_user)

    result = await db.execute(
        select(MaintenancePart).where(
            MaintenancePart.id == part_id,
            MaintenancePart.work_order_id == wo_id,
        )
    )
    part = result.scalar_one_or_none()
    if not part:
        raise NotFoundError("Part", part_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(part, field, value)

    await db.flush()
    await db.refresh(part)
    return part


@router.delete(
    "/{wo_id}/parts/{part_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def delete_part(
    wo_id: int,
    part_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a part line item from a work order."""
    await _get_work_order_for_sub(wo_id, db, current_user)

    result = await db.execute(
        select(MaintenancePart).where(
            MaintenancePart.id == part_id,
            MaintenancePart.work_order_id == wo_id,
        )
    )
    part = result.scalar_one_or_none()
    if not part:
        raise NotFoundError("Part", part_id)

    await db.delete(part)
    await db.flush()


# --- Labor sub-routes ---


@router.post(
    "/{wo_id}/labor",
    response_model=MaintenanceLaborResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def add_labor(
    wo_id: int,
    data: MaintenanceLaborCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a labor entry to a work order."""
    await _get_work_order_for_sub(wo_id, db, current_user)

    labor = MaintenanceLabor(work_order_id=wo_id, **data.model_dump())
    db.add(labor)
    await db.flush()
    await db.refresh(labor)
    return labor


@router.put(
    "/{wo_id}/labor/{labor_id}",
    response_model=MaintenanceLaborResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_labor(
    wo_id: int,
    labor_id: int,
    data: MaintenanceLaborUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a labor entry."""
    await _get_work_order_for_sub(wo_id, db, current_user)

    result = await db.execute(
        select(MaintenanceLabor).where(
            MaintenanceLabor.id == labor_id,
            MaintenanceLabor.work_order_id == wo_id,
        )
    )
    labor = result.scalar_one_or_none()
    if not labor:
        raise NotFoundError("Labor entry", labor_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(labor, field, value)

    await db.flush()
    await db.refresh(labor)
    return labor


@router.delete(
    "/{wo_id}/labor/{labor_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def delete_labor(
    wo_id: int,
    labor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a labor entry from a work order."""
    await _get_work_order_for_sub(wo_id, db, current_user)

    result = await db.execute(
        select(MaintenanceLabor).where(
            MaintenanceLabor.id == labor_id,
            MaintenanceLabor.work_order_id == wo_id,
        )
    )
    labor = result.scalar_one_or_none()
    if not labor:
        raise NotFoundError("Labor entry", labor_id)

    await db.delete(labor)
    await db.flush()


# --- Deadline routes ---


@router.get("/deadlines", response_model=List[MaintenanceDeadlineResponse])
async def list_deadlines(
    unit_id: Optional[int] = Query(None),
    active_only: bool = Query(False),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List maintenance deadlines filtered by unit access."""
    accessible = await get_accessible_units(db, current_user)
    query = select(MaintenanceDeadline).where(
        MaintenanceDeadline.unit_id.in_(accessible)
    )

    if unit_id and unit_id in accessible:
        query = query.where(MaintenanceDeadline.unit_id == unit_id)
    if active_only:
        query = query.where(MaintenanceDeadline.lifted_date.is_(None))

    query = (
        query.order_by(MaintenanceDeadline.deadline_date.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/deadlines",
    response_model=MaintenanceDeadlineResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_deadline(
    data: MaintenanceDeadlineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new maintenance deadline."""
    accessible = await get_accessible_units(db, current_user)
    if data.unit_id not in accessible:
        raise NotFoundError("Unit", data.unit_id)

    deadline = MaintenanceDeadline(**data.model_dump())
    db.add(deadline)
    await db.flush()
    await db.refresh(deadline)
    return deadline


@router.put(
    "/deadlines/{deadline_id}",
    response_model=MaintenanceDeadlineResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def lift_deadline(
    deadline_id: int,
    data: MaintenanceDeadlineUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lift (resolve) a maintenance deadline."""
    result = await db.execute(
        select(MaintenanceDeadline).where(MaintenanceDeadline.id == deadline_id)
    )
    deadline = result.scalar_one_or_none()
    if not deadline:
        raise NotFoundError("Maintenance Deadline", deadline_id)

    accessible = await get_accessible_units(db, current_user)
    if deadline.unit_id not in accessible:
        raise NotFoundError("Maintenance Deadline", deadline_id)

    deadline.lifted_date = datetime.now(timezone.utc)
    deadline.lifted_by = current_user.username
    if data.notes is not None:
        deadline.notes = data.notes

    await db.flush()
    await db.refresh(deadline)
    return deadline


# --- PM Schedule routes ---


@router.get("/pm-schedule", response_model=List[PreventiveMaintenanceScheduleResponse])
async def list_pm_schedules(
    unit_id: Optional[int] = Query(None),
    overdue_only: bool = Query(False),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List preventive maintenance schedules filtered by unit access."""
    accessible = await get_accessible_units(db, current_user)
    query = select(PreventiveMaintenanceSchedule).where(
        PreventiveMaintenanceSchedule.unit_id.in_(accessible)
    )

    if unit_id and unit_id in accessible:
        query = query.where(PreventiveMaintenanceSchedule.unit_id == unit_id)
    if overdue_only:
        now = datetime.now(timezone.utc)
        query = query.where(PreventiveMaintenanceSchedule.next_due < now)

    query = (
        query.order_by(PreventiveMaintenanceSchedule.next_due.asc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/pm-schedule",
    response_model=PreventiveMaintenanceScheduleResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_pm_schedule(
    data: PreventiveMaintenanceScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new preventive maintenance schedule."""
    accessible = await get_accessible_units(db, current_user)
    if data.unit_id not in accessible:
        raise NotFoundError("Unit", data.unit_id)

    pm = PreventiveMaintenanceSchedule(**data.model_dump())
    db.add(pm)
    await db.flush()
    await db.refresh(pm)
    return pm
