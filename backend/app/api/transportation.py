"""Transportation / movement CRUD endpoints."""

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units, require_role
from app.database import get_db
from app.models.transportation import Movement, MovementStatus
from app.models.user import Role, User
from app.schemas.transportation import MovementCreate, MovementResponse, MovementUpdate

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

    for field, value in update_data.items():
        setattr(record, field, value)

    await db.flush()
    await db.refresh(record)
    return record
