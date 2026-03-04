"""Individual equipment asset CRUD endpoints with faults and driver assignments."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import ConflictError, NotFoundError
from app.core.permissions import get_accessible_units, require_role
from app.database import get_db
from app.models.equipment import (
    Equipment,
    EquipmentAssetStatus,
    EquipmentDriverAssignment,
    EquipmentFault,
)
from app.models.maintenance import MaintenanceWorkOrder
from app.models.user import Role, User
from app.schemas.equipment import (
    DriverAssignmentCreate,
    DriverAssignmentResponse,
    DriverAssignmentUpdate,
    EquipmentFaultCreate,
    EquipmentFaultResponse,
    EquipmentFaultUpdate,
    EquipmentItemCreate,
    EquipmentItemDetailResponse,
    EquipmentItemResponse,
    EquipmentItemUpdate,
)

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.S4]


# --- Equipment CRUD ---


@router.get("/", response_model=List[EquipmentItemResponse])
async def list_equipment_items(
    unit_id: Optional[int] = Query(None),
    status: Optional[EquipmentAssetStatus] = Query(None),
    equipment_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List individual equipment items filtered by unit access."""
    accessible = await get_accessible_units(db, current_user)
    query = select(Equipment).where(Equipment.unit_id.in_(accessible))

    if unit_id and unit_id in accessible:
        query = query.where(Equipment.unit_id == unit_id)
    if status:
        query = query.where(Equipment.status == status)
    if equipment_type:
        query = query.where(Equipment.equipment_type == equipment_type)
    if search:
        import re

        escaped = re.sub(r"([%_])", r"\\\1", search)
        term = f"%{escaped}%"
        query = query.where(
            or_(
                Equipment.bumper_number.ilike(term),
                Equipment.nomenclature.ilike(term),
                Equipment.serial_number.ilike(term),
                Equipment.tamcn.ilike(term),
            )
        )

    query = query.order_by(Equipment.bumper_number.asc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{item_id}", response_model=EquipmentItemDetailResponse)
async def get_equipment_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single equipment item with faults, drivers, work orders, and convoys."""
    query = (
        select(Equipment)
        .where(Equipment.id == item_id)
        .options(
            selectinload(Equipment.faults),
            selectinload(Equipment.driver_assignments),
        )
    )
    result = await db.execute(query)
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("Equipment", item_id)

    accessible = await get_accessible_units(db, current_user)
    if item.unit_id not in accessible:
        raise NotFoundError("Equipment", item_id)

    return item


@router.post(
    "/",
    response_model=EquipmentItemResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_equipment_item(
    data: EquipmentItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new individual equipment item."""
    accessible = await get_accessible_units(db, current_user)
    if data.unit_id not in accessible:
        raise NotFoundError("Unit", data.unit_id)

    # Check bumper number uniqueness
    existing = await db.execute(
        select(Equipment).where(Equipment.bumper_number == data.bumper_number)
    )
    if existing.scalar_one_or_none():
        raise ConflictError(
            f"Equipment with bumper number '{data.bumper_number}' already exists"
        )

    item = Equipment(**data.model_dump())
    db.add(item)
    await db.flush()
    await db.refresh(item)
    return item


@router.put(
    "/{item_id}",
    response_model=EquipmentItemResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_equipment_item(
    item_id: int,
    data: EquipmentItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an individual equipment item."""
    result = await db.execute(select(Equipment).where(Equipment.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("Equipment", item_id)

    accessible = await get_accessible_units(db, current_user)
    if item.unit_id not in accessible:
        raise NotFoundError("Equipment", item_id)

    update_data = data.model_dump(exclude_unset=True)

    # HIGH-1: Validate new unit_id is accessible before allowing reassignment
    if "unit_id" in update_data and update_data["unit_id"] not in accessible:
        raise NotFoundError("Unit", update_data["unit_id"])

    # Check bumper number uniqueness if being updated
    if (
        "bumper_number" in update_data
        and update_data["bumper_number"] != item.bumper_number
    ):
        existing = await db.execute(
            select(Equipment).where(
                Equipment.bumper_number == update_data["bumper_number"]
            )
        )
        if existing.scalar_one_or_none():
            raise ConflictError(
                f"Equipment with bumper number '{update_data['bumper_number']}' already exists"
            )

    for field, value in update_data.items():
        setattr(item, field, value)

    await db.flush()
    await db.refresh(item)
    return item


@router.delete(
    "/{item_id}",
    status_code=204,
    dependencies=[Depends(require_role([Role.ADMIN]))],
)
async def delete_equipment_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete an individual equipment item (ADMIN only)."""
    result = await db.execute(select(Equipment).where(Equipment.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("Equipment", item_id)

    accessible = await get_accessible_units(db, current_user)
    if item.unit_id not in accessible:
        raise NotFoundError("Equipment", item_id)

    await db.delete(item)
    await db.flush()


@router.get("/{item_id}/history")
async def get_equipment_history(
    item_id: int,
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full timeline for an equipment item (faults, WOs, driver changes)."""
    # Verify equipment exists and is accessible
    result = await db.execute(select(Equipment).where(Equipment.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("Equipment", item_id)

    accessible = await get_accessible_units(db, current_user)
    if item.unit_id not in accessible:
        raise NotFoundError("Equipment", item_id)

    # Gather faults
    fault_result = await db.execute(
        select(EquipmentFault).where(EquipmentFault.equipment_id == item_id)
    )
    faults = fault_result.scalars().all()

    # Gather work orders
    wo_result = await db.execute(
        select(MaintenanceWorkOrder).where(
            MaintenanceWorkOrder.individual_equipment_id == item_id
        )
    )
    work_orders = wo_result.scalars().all()

    # Gather driver assignment changes
    driver_result = await db.execute(
        select(EquipmentDriverAssignment).where(
            EquipmentDriverAssignment.equipment_id == item_id
        )
    )
    driver_changes = driver_result.scalars().all()

    # Build unified timeline
    timeline = []

    for f in faults:
        timeline.append(
            {
                "type": "fault",
                "timestamp": f.reported_at.isoformat() if f.reported_at else None,
                "summary": f"Fault reported: {f.severity.value} - {f.fault_description[:100]}",
                "id": f.id,
                "severity": f.severity.value,
            }
        )
        if f.resolved_at:
            timeline.append(
                {
                    "type": "fault_resolved",
                    "timestamp": f.resolved_at.isoformat(),
                    "summary": f"Fault resolved: {f.fault_description[:100]}",
                    "id": f.id,
                }
            )

    for wo in work_orders:
        timeline.append(
            {
                "type": "work_order",
                "timestamp": wo.created_at.isoformat() if wo.created_at else None,
                "summary": f"WO {wo.work_order_number}: {wo.description or 'No description'}",
                "id": wo.id,
                "status": wo.status.value,
            }
        )

    for da in driver_changes:
        role = "Primary" if da.is_primary else "A-Driver"
        timeline.append(
            {
                "type": "driver_assigned",
                "timestamp": da.assigned_at.isoformat() if da.assigned_at else None,
                "summary": f"{role} driver assigned (personnel #{da.personnel_id})",
                "id": da.id,
            }
        )
        if da.released_at:
            timeline.append(
                {
                    "type": "driver_released",
                    "timestamp": da.released_at.isoformat(),
                    "summary": f"{role} driver released (personnel #{da.personnel_id})",
                    "id": da.id,
                }
            )

    # Sort by timestamp descending (most recent first), then paginate
    timeline.sort(key=lambda x: x.get("timestamp") or "", reverse=True)
    total_count = len(timeline)
    timeline = timeline[offset : offset + limit]

    return {
        "equipment_id": item_id,
        "bumper_number": item.bumper_number,
        "total_count": total_count,
        "timeline": timeline,
    }


# --- Fault sub-routes ---


async def _get_equipment_for_sub(
    item_id: int, db: AsyncSession, current_user: User
) -> Equipment:
    """Helper: fetch and authorize equipment for sub-resource operations."""
    result = await db.execute(select(Equipment).where(Equipment.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("Equipment", item_id)

    accessible = await get_accessible_units(db, current_user)
    if item.unit_id not in accessible:
        raise NotFoundError("Equipment", item_id)
    return item


@router.post(
    "/{item_id}/faults",
    response_model=EquipmentFaultResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def report_fault(
    item_id: int,
    data: EquipmentFaultCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Report a fault on an equipment item."""
    await _get_equipment_for_sub(item_id, db, current_user)

    fault = EquipmentFault(equipment_id=item_id, **data.model_dump())
    db.add(fault)
    await db.flush()
    await db.refresh(fault)
    return fault


@router.put(
    "/{item_id}/faults/{fault_id}",
    response_model=EquipmentFaultResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_fault(
    item_id: int,
    fault_id: int,
    data: EquipmentFaultUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a fault on an equipment item."""
    await _get_equipment_for_sub(item_id, db, current_user)

    result = await db.execute(
        select(EquipmentFault).where(
            EquipmentFault.id == fault_id,
            EquipmentFault.equipment_id == item_id,
        )
    )
    fault = result.scalar_one_or_none()
    if not fault:
        raise NotFoundError("Fault", fault_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(fault, field, value)

    await db.flush()
    await db.refresh(fault)
    return fault


# --- Driver assignment sub-routes ---


@router.post(
    "/{item_id}/drivers",
    response_model=DriverAssignmentResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def assign_driver(
    item_id: int,
    data: DriverAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign a driver to an equipment item."""
    await _get_equipment_for_sub(item_id, db, current_user)

    assignment = EquipmentDriverAssignment(equipment_id=item_id, **data.model_dump())
    db.add(assignment)
    await db.flush()
    await db.refresh(assignment)
    return assignment


@router.put(
    "/{item_id}/drivers/{assignment_id}",
    response_model=DriverAssignmentResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_driver_assignment(
    item_id: int,
    assignment_id: int,
    data: DriverAssignmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a driver assignment (e.g., release driver, change primary flag)."""
    await _get_equipment_for_sub(item_id, db, current_user)

    result = await db.execute(
        select(EquipmentDriverAssignment).where(
            EquipmentDriverAssignment.id == assignment_id,
            EquipmentDriverAssignment.equipment_id == item_id,
        )
    )
    assignment = result.scalar_one_or_none()
    if not assignment:
        raise NotFoundError("Driver assignment", assignment_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assignment, field, value)

    await db.flush()
    await db.refresh(assignment)
    return assignment
