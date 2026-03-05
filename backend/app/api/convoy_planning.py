"""Convoy planning and lift request API endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units, require_role
from app.database import get_db
from app.models.convoy_planning import (
    ConvoyPlan,
    ConvoyPlanStatus,
    ConvoySerial,
    LiftRequest,
    LiftRequestPriority,
    LiftRequestStatus,
)
from app.models.transportation import Movement, MovementStatus
from app.models.user import Role, User
from app.schemas.convoy_planning import (
    ConvoyPlanCreate,
    ConvoyPlanResponse,
    ConvoyPlanUpdate,
    ConvoySerialCreate,
    ConvoySerialResponse,
    ConvoySerialUpdate,
    LiftRequestApprove,
    LiftRequestAssign,
    LiftRequestCreate,
    LiftRequestResponse,
    LiftRequestUpdate,
)
from app.services.route_planning import generate_march_table, validate_convoy_plan

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S3, Role.S4]
APPROVAL_ROLES = [Role.ADMIN, Role.COMMANDER]
S4_ROLES = [Role.ADMIN, Role.S4]


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


async def _get_plan_or_404(
    db: AsyncSession, plan_id: int, *, load_serials: bool = False
) -> ConvoyPlan:
    """Fetch a ConvoyPlan or raise 404."""
    query = select(ConvoyPlan).where(ConvoyPlan.id == plan_id)
    if load_serials:
        query = query.options(selectinload(ConvoyPlan.serials))
    result = await db.execute(query)
    plan = result.scalar_one_or_none()
    if plan is None:
        raise NotFoundError("ConvoyPlan", plan_id)
    return plan


# ===========================================================================
# Convoy Plan endpoints
# ===========================================================================


@router.post(
    "/convoy-plans",
    response_model=ConvoyPlanResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_convoy_plan(
    data: ConvoyPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new convoy plan in DRAFT status."""
    await check_unit_access(current_user, data.unit_id, db)

    plan = ConvoyPlan(**data.model_dump(), created_by=current_user.id)
    db.add(plan)
    await db.flush()
    await db.refresh(plan, attribute_names=["serials"])
    return plan


@router.get("/convoy-plans", response_model=List[ConvoyPlanResponse])
async def list_convoy_plans(
    unit_id: Optional[int] = Query(None),
    plan_status: Optional[ConvoyPlanStatus] = Query(None, alias="status"),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List convoy plans filtered by accessible units."""
    accessible = await get_accessible_units(db, current_user)
    query = (
        select(ConvoyPlan)
        .where(ConvoyPlan.unit_id.in_(accessible))
        .options(selectinload(ConvoyPlan.serials))
    )

    if unit_id and unit_id in accessible:
        query = query.where(ConvoyPlan.unit_id == unit_id)
    if plan_status:
        query = query.where(ConvoyPlan.status == plan_status)

    query = query.order_by(ConvoyPlan.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/convoy-plans/{plan_id}", response_model=ConvoyPlanResponse)
async def get_convoy_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single convoy plan with serials."""
    plan = await _get_plan_or_404(db, plan_id, load_serials=True)
    await check_unit_access(current_user, plan.unit_id, db)
    return plan


@router.put(
    "/convoy-plans/{plan_id}",
    response_model=ConvoyPlanResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_convoy_plan(
    plan_id: int,
    data: ConvoyPlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a convoy plan."""
    plan = await _get_plan_or_404(db, plan_id, load_serials=True)
    await check_unit_access(current_user, plan.unit_id, db)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(plan, field, value)

    await db.flush()
    await db.refresh(plan, attribute_names=["serials"])
    return plan


# --- Serial management ---


@router.post(
    "/convoy-plans/{plan_id}/serials",
    response_model=ConvoySerialResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def add_serial(
    plan_id: int,
    data: ConvoySerialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a serial to a convoy plan."""
    plan = await _get_plan_or_404(db, plan_id)
    await check_unit_access(current_user, plan.unit_id, db)

    serial = ConvoySerial(**data.model_dump(), convoy_plan_id=plan_id)
    db.add(serial)
    await db.flush()
    await db.refresh(serial)
    return serial


@router.put(
    "/convoy-plans/{plan_id}/serials/{serial_id}",
    response_model=ConvoySerialResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_serial(
    plan_id: int,
    serial_id: int,
    data: ConvoySerialUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a serial within a convoy plan."""
    plan = await _get_plan_or_404(db, plan_id)
    await check_unit_access(current_user, plan.unit_id, db)

    result = await db.execute(
        select(ConvoySerial).where(
            ConvoySerial.id == serial_id,
            ConvoySerial.convoy_plan_id == plan_id,
        )
    )
    serial = result.scalar_one_or_none()
    if serial is None:
        raise NotFoundError("ConvoySerial", serial_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(serial, field, value)

    await db.flush()
    await db.refresh(serial)
    return serial


@router.delete(
    "/convoy-plans/{plan_id}/serials/{serial_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def delete_serial(
    plan_id: int,
    serial_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a serial from a convoy plan."""
    plan = await _get_plan_or_404(db, plan_id)
    await check_unit_access(current_user, plan.unit_id, db)

    result = await db.execute(
        select(ConvoySerial).where(
            ConvoySerial.id == serial_id,
            ConvoySerial.convoy_plan_id == plan_id,
        )
    )
    serial = result.scalar_one_or_none()
    if serial is None:
        raise NotFoundError("ConvoySerial", serial_id)

    await db.delete(serial)
    await db.flush()


# --- State transitions ---


@router.post(
    "/convoy-plans/{plan_id}/approve",
    response_model=ConvoyPlanResponse,
    dependencies=[Depends(require_role(APPROVAL_ROLES))],
)
async def approve_convoy_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a DRAFT convoy plan (validates completeness)."""
    plan = await _get_plan_or_404(db, plan_id, load_serials=True)
    await check_unit_access(current_user, plan.unit_id, db)

    if plan.status != ConvoyPlanStatus.DRAFT:
        raise BadRequestError(
            f"Cannot approve plan in '{plan.status.value}' status; must be DRAFT"
        )

    # Validate completeness
    plan_dict = {
        "name": plan.name,
        "unit_id": plan.unit_id,
        "route_name": plan.route_name,
        "departure_time_planned": (
            plan.departure_time_planned.isoformat()
            if plan.departure_time_planned
            else None
        ),
        "total_distance_km": plan.total_distance_km,
        "convoy_commander_id": plan.convoy_commander_id,
        "comm_plan": plan.comm_plan,
        "recovery_plan": plan.recovery_plan,
    }
    is_valid, errors = validate_convoy_plan(plan_dict)
    if not is_valid:
        raise BadRequestError(
            f"Plan validation failed: {'; '.join(errors)}"
        )

    plan.status = ConvoyPlanStatus.APPROVED
    await db.flush()
    await db.refresh(plan, attribute_names=["serials"])
    return plan


@router.post(
    "/convoy-plans/{plan_id}/execute",
    response_model=ConvoyPlanResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def execute_convoy_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transition APPROVED plan to EXECUTING and create a Movement."""
    plan = await _get_plan_or_404(db, plan_id, load_serials=True)
    await check_unit_access(current_user, plan.unit_id, db)

    if plan.status != ConvoyPlanStatus.APPROVED:
        raise BadRequestError(
            f"Cannot execute plan in '{plan.status.value}' status; must be APPROVED"
        )

    # Create a Movement from the plan
    movement = Movement(
        unit_id=plan.unit_id,
        convoy_id=plan.movement_credit_number,
        origin=plan.route_name or "SP",
        destination=plan.route_description or "RP",
        departure_time=plan.departure_time_planned,
        vehicle_count=sum(s.vehicle_count for s in plan.serials),
        status=MovementStatus.EN_ROUTE,
        convoy_plan_id=plan.id,
    )
    db.add(movement)

    plan.status = ConvoyPlanStatus.EXECUTING
    await db.flush()
    await db.refresh(plan, attribute_names=["serials"])
    return plan


@router.get("/convoy-plans/{plan_id}/march-table")
async def get_march_table(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a march table for a convoy plan."""
    plan = await _get_plan_or_404(db, plan_id, load_serials=True)
    await check_unit_access(current_user, plan.unit_id, db)

    if not plan.departure_time_planned:
        raise BadRequestError("Plan must have a planned departure time")
    if not plan.total_distance_km or plan.total_distance_km <= 0:
        raise BadRequestError("Plan must have a valid total distance")

    # Use first serial's speed or default
    march_speed = 40.0
    catch_up_speed = 60.0
    if plan.serials:
        march_speed = plan.serials[0].march_speed_kph
        catch_up_speed = plan.serials[0].catch_up_speed_kph

    return generate_march_table(
        departure_time=plan.departure_time_planned,
        distance_km=plan.total_distance_km,
        march_speed_kph=march_speed,
        catch_up_speed_kph=catch_up_speed,
        checkpoints=None,
    )


@router.post(
    "/convoy-plans/{plan_id}/cancel",
    response_model=ConvoyPlanResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def cancel_convoy_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a convoy plan (from DRAFT or APPROVED)."""
    plan = await _get_plan_or_404(db, plan_id, load_serials=True)
    await check_unit_access(current_user, plan.unit_id, db)

    if plan.status not in (ConvoyPlanStatus.DRAFT, ConvoyPlanStatus.APPROVED):
        raise BadRequestError(
            f"Cannot cancel plan in '{plan.status.value}' status; "
            "must be DRAFT or APPROVED"
        )

    plan.status = ConvoyPlanStatus.CANCELED
    await db.flush()
    await db.refresh(plan, attribute_names=["serials"])
    return plan


# ===========================================================================
# Lift Request endpoints
# ===========================================================================


@router.post(
    "/lift-requests",
    response_model=LiftRequestResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_lift_request(
    data: LiftRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new lift request in REQUESTED status."""
    await check_unit_access(current_user, data.requesting_unit_id, db)

    lift = LiftRequest(**data.model_dump())
    db.add(lift)
    await db.flush()
    await db.refresh(lift)
    return lift


@router.get("/lift-requests", response_model=List[LiftRequestResponse])
async def list_lift_requests(
    lift_status: Optional[LiftRequestStatus] = Query(None, alias="status"),
    priority: Optional[LiftRequestPriority] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List lift requests visible to the current user."""
    accessible = await get_accessible_units(db, current_user)
    query = select(LiftRequest).where(
        or_(
            LiftRequest.requesting_unit_id.in_(accessible),
            LiftRequest.supporting_unit_id.in_(accessible),
        )
    )

    if lift_status:
        query = query.where(LiftRequest.status == lift_status)
    if priority:
        query = query.where(LiftRequest.priority == priority)

    query = query.order_by(LiftRequest.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/lift-requests/{request_id}", response_model=LiftRequestResponse)
async def get_lift_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single lift request."""
    result = await db.execute(
        select(LiftRequest).where(LiftRequest.id == request_id)
    )
    lift = result.scalar_one_or_none()
    if lift is None:
        raise NotFoundError("LiftRequest", request_id)

    # H-1 fix: allow access from either requesting or supporting unit
    accessible = await get_accessible_units(db, current_user)
    if lift.requesting_unit_id not in accessible and (
        lift.supporting_unit_id is None or lift.supporting_unit_id not in accessible
    ):
        raise NotFoundError("LiftRequest", request_id)
    return lift


@router.put(
    "/lift-requests/{request_id}",
    response_model=LiftRequestResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_lift_request(
    request_id: int,
    data: LiftRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a lift request."""
    result = await db.execute(
        select(LiftRequest).where(LiftRequest.id == request_id)
    )
    lift = result.scalar_one_or_none()
    if lift is None:
        raise NotFoundError("LiftRequest", request_id)

    await check_unit_access(current_user, lift.requesting_unit_id, db)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lift, field, value)

    await db.flush()
    await db.refresh(lift)
    return lift


@router.put(
    "/lift-requests/{request_id}/approve",
    response_model=LiftRequestResponse,
    dependencies=[Depends(require_role(S4_ROLES))],
)
async def approve_lift_request(
    request_id: int,
    data: LiftRequestApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a REQUESTED lift request and assign supporting unit."""
    result = await db.execute(
        select(LiftRequest).where(LiftRequest.id == request_id)
    )
    lift = result.scalar_one_or_none()
    if lift is None:
        raise NotFoundError("LiftRequest", request_id)

    # H-2 fix: allow access from either requesting or supporting unit
    accessible = await get_accessible_units(db, current_user)
    if lift.requesting_unit_id not in accessible and (
        lift.supporting_unit_id is None or lift.supporting_unit_id not in accessible
    ):
        raise NotFoundError("LiftRequest", request_id)

    if lift.status != LiftRequestStatus.REQUESTED:
        raise BadRequestError(
            f"Cannot approve lift request in '{lift.status.value}' status; "
            "must be REQUESTED"
        )

    # M-4 fix: validate supporting unit exists and user has access
    from app.models.unit import Unit
    unit_result = await db.execute(
        select(Unit.id).where(Unit.id == data.supporting_unit_id)
    )
    if unit_result.scalar_one_or_none() is None:
        raise NotFoundError("Unit", data.supporting_unit_id)

    lift.status = LiftRequestStatus.APPROVED
    lift.supporting_unit_id = data.supporting_unit_id
    await db.flush()
    await db.refresh(lift)
    return lift


@router.put(
    "/lift-requests/{request_id}/assign",
    response_model=LiftRequestResponse,
    dependencies=[Depends(require_role(S4_ROLES))],
)
async def assign_lift_request(
    request_id: int,
    data: LiftRequestAssign,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign an APPROVED lift request to a movement (SCHEDULED)."""
    result = await db.execute(
        select(LiftRequest).where(LiftRequest.id == request_id)
    )
    lift = result.scalar_one_or_none()
    if lift is None:
        raise NotFoundError("LiftRequest", request_id)

    # H-2 fix: allow access from either requesting or supporting unit
    accessible = await get_accessible_units(db, current_user)
    if lift.requesting_unit_id not in accessible and (
        lift.supporting_unit_id is None or lift.supporting_unit_id not in accessible
    ):
        raise NotFoundError("LiftRequest", request_id)

    if lift.status != LiftRequestStatus.APPROVED:
        raise BadRequestError(
            f"Cannot assign lift request in '{lift.status.value}' status; "
            "must be APPROVED"
        )

    # M-5 fix: verify movement exists AND belongs to accessible unit
    mov_result = await db.execute(
        select(Movement).where(Movement.id == data.assigned_movement_id)
    )
    movement = mov_result.scalar_one_or_none()
    if movement is None:
        raise NotFoundError("Movement", data.assigned_movement_id)
    if movement.unit_id not in accessible:
        raise NotFoundError("Movement", data.assigned_movement_id)

    lift.status = LiftRequestStatus.SCHEDULED
    lift.assigned_movement_id = data.assigned_movement_id
    await db.flush()
    await db.refresh(lift)
    return lift


@router.put(
    "/lift-requests/{request_id}/cancel",
    response_model=LiftRequestResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def cancel_lift_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a lift request."""
    result = await db.execute(
        select(LiftRequest).where(LiftRequest.id == request_id)
    )
    lift = result.scalar_one_or_none()
    if lift is None:
        raise NotFoundError("LiftRequest", request_id)

    await check_unit_access(current_user, lift.requesting_unit_id, db)

    # H-3 fix: only allow cancel from REQUESTED, APPROVED, or SCHEDULED
    cancellable = {
        LiftRequestStatus.REQUESTED,
        LiftRequestStatus.APPROVED,
        LiftRequestStatus.SCHEDULED,
    }
    if lift.status not in cancellable:
        raise BadRequestError(
            f"Cannot cancel lift request in '{lift.status.value}' status; "
            "must be REQUESTED, APPROVED, or SCHEDULED"
        )

    lift.status = LiftRequestStatus.CANCELED
    await db.flush()
    await db.refresh(lift)
    return lift
