"""Transportation / movement CRUD endpoints."""

from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units, require_role
from app.database import get_db
from app.models.personnel import (
    ConvoyPersonnel,
    ConvoyVehicle,
    Personnel,
)
from app.models.transportation import (
    ConvoyCargo,
    Movement,
    MovementStatus,
    VEHICLE_LICENSE_REQUIREMENTS,
)
from app.models.user import Role, User
from app.schemas.transportation import (
    ConvoyCargoCreate,
    ConvoyCargoResponse,
    MovementCreate,
    MovementResponse,
    MovementUpdate,
    ValidateAssignmentRequest,
    ValidateAssignmentResponse,
)

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S3, Role.S4]


@router.get("/active", response_model=List[MovementResponse])
async def list_active_movements(
    unit_id: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return EN_ROUTE or DELAYED movements for accessible units."""
    accessible = await get_accessible_units(db, current_user)
    query = select(Movement).where(
        Movement.unit_id.in_(accessible),
        Movement.status.in_([MovementStatus.EN_ROUTE, MovementStatus.DELAYED]),
    )

    if unit_id and unit_id in accessible:
        query = query.where(Movement.unit_id == unit_id)

    query = query.order_by(Movement.reported_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/history", response_model=List[MovementResponse])
async def list_movement_history(
    unit_id: Optional[int] = Query(None),
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return COMPLETE movements for accessible units within a date range."""
    accessible = await get_accessible_units(db, current_user)
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    query = select(Movement).where(
        Movement.unit_id.in_(accessible),
        Movement.status == MovementStatus.COMPLETE,
        Movement.reported_at >= cutoff,
    )

    if unit_id and unit_id in accessible:
        query = query.where(Movement.unit_id == unit_id)

    query = query.order_by(Movement.reported_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/", response_model=List[MovementResponse])
async def list_movements(
    unit_id: Optional[int] = Query(None),
    status: Optional[MovementStatus] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List movement records."""
    accessible = await get_accessible_units(db, current_user)
    query = select(Movement).where(Movement.unit_id.in_(accessible))

    if unit_id and unit_id in accessible:
        query = query.where(Movement.unit_id == unit_id)
    if status:
        query = query.where(Movement.status == status)

    query = query.order_by(Movement.reported_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{record_id}", response_model=MovementResponse)
async def get_movement(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single movement record."""
    result = await db.execute(select(Movement).where(Movement.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundError("Movement", record_id)

    await check_unit_access(current_user, record.unit_id, db)
    return record


@router.post(
    "/",
    response_model=MovementResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_movement(
    data: MovementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new movement record."""
    await check_unit_access(current_user, data.unit_id, db)

    record = Movement(**data.model_dump())
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


@router.put(
    "/{record_id}",
    response_model=MovementResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_movement(
    record_id: int,
    data: MovementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a movement record."""
    result = await db.execute(select(Movement).where(Movement.id == record_id))
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundError("Movement", record_id)

    await check_unit_access(current_user, record.unit_id, db)

    update_data = data.model_dump(exclude_unset=True)

    # H-4 fix: if unit_id is changing, verify access to target unit
    if "unit_id" in update_data and update_data["unit_id"] != record.unit_id:
        await check_unit_access(current_user, update_data["unit_id"], db)

    old_status = record.status
    for field, value in update_data.items():
        setattr(record, field, value)

    # Personnel tracking: propagate status changes to assigned personnel
    new_status = record.status
    if old_status != new_status:
        if new_status == MovementStatus.EN_ROUTE:
            # Set current_movement_id for all assigned personnel
            cp_result = await db.execute(
                select(ConvoyPersonnel.personnel_id).where(
                    ConvoyPersonnel.movement_id == record_id
                )
            )
            personnel_ids = [row[0] for row in cp_result.all()]
            if personnel_ids:
                await db.execute(
                    update(Personnel)
                    .where(Personnel.id.in_(personnel_ids))
                    .values(current_movement_id=record_id)
                )

        elif new_status == MovementStatus.COMPLETE:
            # Clear current_movement_id for all personnel on this movement
            await db.execute(
                update(Personnel)
                .where(Personnel.current_movement_id == record_id)
                .values(current_movement_id=None)
            )

    await db.flush()
    await db.refresh(record)
    return record


# --- Assignment validation ---


@router.post(
    "/validate-assignment",
    response_model=ValidateAssignmentResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def validate_assignment(
    data: ValidateAssignmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Validate if a personnel can be assigned to a role on a vehicle."""
    # Load personnel with qualifications
    result = await db.execute(
        select(Personnel)
        .where(Personnel.id == data.personnel_id)
        .options(selectinload(Personnel.qualifications))
    )
    person = result.scalar_one_or_none()
    if not person:
        raise NotFoundError("Personnel", data.personnel_id)

    # Verify user has access to the personnel's unit
    accessible = await get_accessible_units(db, current_user)
    if person.unit_id not in accessible:
        raise NotFoundError("Personnel", data.personnel_id)

    # Validate role against ConvoyRole enum
    valid_roles = {"DRIVER", "A_DRIVER", "GUNNER", "TC", "VC", "MEDIC", "PAX"}
    if data.role.upper() not in valid_roles:
        raise BadRequestError(f"Invalid role: {data.role}. Must be one of {', '.join(sorted(valid_roles))}")

    # Check if already assigned to another vehicle in this movement
    cp_result = await db.execute(
        select(ConvoyPersonnel).where(
            ConvoyPersonnel.movement_id == data.movement_id,
            ConvoyPersonnel.personnel_id == data.personnel_id,
        )
    )
    existing = cp_result.scalar_one_or_none()
    assigned_to_other = existing is not None

    today = date.today()
    missing: list[str] = []
    role_upper = data.role.upper()
    vehicle_license = VEHICLE_LICENSE_REQUIREMENTS.get(data.vehicle_tamcn)

    def has_qual(qual_name: str) -> bool:
        for q in person.qualifications:
            if (
                q.qualification_name == qual_name
                and q.is_current
                and (q.expiration_date is None or q.expiration_date >= today)
            ):
                return True
        return False

    from app.models.personnel import PayGrade

    e5_plus = {
        PayGrade.E5, PayGrade.E6, PayGrade.E7, PayGrade.E8, PayGrade.E9,
    }
    e6_plus = {
        PayGrade.E6, PayGrade.E7, PayGrade.E8, PayGrade.E9,
    }
    officer_grades = {
        PayGrade.W1, PayGrade.W2, PayGrade.W3, PayGrade.W4, PayGrade.W5,
        PayGrade.O1, PayGrade.O2, PayGrade.O3, PayGrade.O4, PayGrade.O5,
        PayGrade.O6, PayGrade.O7, PayGrade.O8, PayGrade.O9, PayGrade.O10,
    }

    if role_upper in ("DRIVER", "A_DRIVER"):
        if not has_qual("MILITARY_DRIVER"):
            missing.append("MILITARY_DRIVER")
        if vehicle_license and not has_qual(vehicle_license):
            missing.append(vehicle_license)

    elif role_upper == "TC":
        if person.pay_grade not in e5_plus:
            missing.append("E5+ pay grade required")
        if not has_qual("MILITARY_DRIVER"):
            missing.append("MILITARY_DRIVER")
        if vehicle_license and not has_qual(vehicle_license):
            missing.append(vehicle_license)

    elif role_upper == "VC":
        if person.pay_grade not in (e6_plus | officer_grades):
            missing.append("E6+ or Officer pay grade required")

    elif role_upper == "GUNNER":
        if not has_qual("WEAPONS_QUAL"):
            missing.append("WEAPONS_QUAL")

    elif role_upper == "MEDIC":
        if person.mos != "8404" and not has_qual("TCCC"):
            missing.append("MOS 8404 or TCCC certification")

    # PAX has no requirements

    valid = len(missing) == 0
    reason = "Qualified" if valid else f"Missing: {', '.join(missing)}"
    if assigned_to_other and valid:
        reason = "Qualified but already assigned to a vehicle in this movement"

    return ValidateAssignmentResponse(
        valid=valid,
        reason=reason,
        missing_qualifications=missing,
        assigned_to_other_vehicle=assigned_to_other,
    )


# --- Convoy Cargo endpoints ---


@router.get(
    "/{movement_id}/cargo",
    response_model=List[ConvoyCargoResponse],
)
async def list_movement_cargo(
    movement_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List cargo for a movement."""
    result = await db.execute(select(Movement).where(Movement.id == movement_id))
    movement = result.scalar_one_or_none()
    if not movement:
        raise NotFoundError("Movement", movement_id)

    await check_unit_access(current_user, movement.unit_id, db)

    cargo_result = await db.execute(
        select(ConvoyCargo)
        .where(ConvoyCargo.movement_id == movement_id)
        .order_by(ConvoyCargo.id)
    )
    return cargo_result.scalars().all()


@router.post(
    "/{movement_id}/cargo",
    response_model=ConvoyCargoResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def add_movement_cargo(
    movement_id: int,
    data: ConvoyCargoCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add cargo to a movement."""
    result = await db.execute(select(Movement).where(Movement.id == movement_id))
    movement = result.scalar_one_or_none()
    if not movement:
        raise NotFoundError("Movement", movement_id)

    await check_unit_access(current_user, movement.unit_id, db)

    # Verify convoy vehicle belongs to this movement
    cv_result = await db.execute(
        select(ConvoyVehicle).where(
            ConvoyVehicle.id == data.convoy_vehicle_id,
            ConvoyVehicle.movement_id == movement_id,
        )
    )
    if not cv_result.scalar_one_or_none():
        raise BadRequestError(
            f"Convoy vehicle {data.convoy_vehicle_id} not found in movement {movement_id}"
        )

    cargo = ConvoyCargo(
        movement_id=movement_id,
        **data.model_dump(),
    )
    db.add(cargo)
    await db.flush()
    await db.refresh(cargo)
    return cargo
