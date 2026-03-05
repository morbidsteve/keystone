"""Supply status CRUD and analytics endpoints."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import (
    check_unit_access,
    get_accessible_units,
    require_permission,
)
from app.database import get_db
from app.models.supply import SupplyClass, SupplyStatus, SupplyStatusRecord
from app.models.user import User
from app.schemas.supply import SupplyCreate, SupplyResponse, SupplyUpdate

router = APIRouter()


@router.get("/", response_model=List[SupplyResponse])
async def list_supply_records(
    unit_id: Optional[int] = Query(None),
    supply_class: Optional[SupplyClass] = Query(None),
    status: Optional[SupplyStatus] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List supply records with filters."""
    accessible = await get_accessible_units(db, current_user)
    query = select(SupplyStatusRecord).where(SupplyStatusRecord.unit_id.in_(accessible))

    if unit_id and unit_id in accessible:
        query = query.where(SupplyStatusRecord.unit_id == unit_id)
    if supply_class:
        query = query.where(SupplyStatusRecord.supply_class == supply_class)
    if status:
        query = query.where(SupplyStatusRecord.status == status)
    if date_from:
        query = query.where(SupplyStatusRecord.reported_at >= date_from)
    if date_to:
        query = query.where(SupplyStatusRecord.reported_at <= date_to)

    query = (
        query.order_by(SupplyStatusRecord.reported_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{record_id}", response_model=SupplyResponse)
async def get_supply_record(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single supply record."""
    result = await db.execute(
        select(SupplyStatusRecord).where(SupplyStatusRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundError("Supply record", record_id)

    await check_unit_access(current_user, record.unit_id, db)
    return record


@router.post("/", response_model=SupplyResponse, status_code=201)
async def create_supply_record(
    data: SupplyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("supply:create")),
):
    """Create a new supply status record."""
    await check_unit_access(current_user, data.unit_id, db)

    record = SupplyStatusRecord(**data.model_dump())
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


@router.put("/{record_id}", response_model=SupplyResponse)
async def update_supply_record(
    record_id: int,
    data: SupplyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("supply:edit")),
):
    """Update an existing supply record."""
    result = await db.execute(
        select(SupplyStatusRecord).where(SupplyStatusRecord.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundError("Supply record", record_id)

    await check_unit_access(current_user, record.unit_id, db)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    await db.flush()
    await db.refresh(record)
    return record


@router.get("/analytics/consumption-rates")
async def get_consumption_rates(
    unit_id: Optional[int] = Query(None),
    supply_class: Optional[SupplyClass] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Consumption rate data for charts."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id and unit_id in accessible:
        unit_ids = [unit_id]
    else:
        unit_ids = accessible

    query = select(
        SupplyStatusRecord.supply_class,
        func.avg(SupplyStatusRecord.consumption_rate).label("avg_rate"),
        func.sum(SupplyStatusRecord.on_hand_qty).label("total_on_hand"),
        func.sum(SupplyStatusRecord.required_qty).label("total_required"),
    ).where(SupplyStatusRecord.unit_id.in_(unit_ids))

    if supply_class:
        query = query.where(SupplyStatusRecord.supply_class == supply_class)

    query = query.group_by(SupplyStatusRecord.supply_class)
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "supply_class": row[0].value,
            "avg_consumption_rate": round(row[1] or 0, 2),
            "total_on_hand": round(row[2] or 0, 1),
            "total_required": round(row[3] or 0, 1),
        }
        for row in rows
    ]


@router.get("/analytics/trends")
async def get_supply_trends(
    unit_id: Optional[int] = Query(None),
    supply_class: Optional[SupplyClass] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Supply trend data over time."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id and unit_id in accessible:
        unit_ids = [unit_id]
    else:
        unit_ids = accessible

    cutoff = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    from datetime import timedelta

    cutoff = cutoff - timedelta(days=days)

    query = select(
        func.date_trunc("day", SupplyStatusRecord.reported_at).label("day"),
        SupplyStatusRecord.supply_class,
        func.avg(SupplyStatusRecord.dos).label("avg_dos"),
        func.avg(SupplyStatusRecord.on_hand_qty).label("avg_on_hand"),
    ).where(
        SupplyStatusRecord.unit_id.in_(unit_ids),
        SupplyStatusRecord.reported_at >= cutoff,
    )

    if supply_class:
        query = query.where(SupplyStatusRecord.supply_class == supply_class)

    query = query.group_by(
        func.date_trunc("day", SupplyStatusRecord.reported_at),
        SupplyStatusRecord.supply_class,
    ).order_by(func.date_trunc("day", SupplyStatusRecord.reported_at))

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "date": row[0].isoformat() if row[0] else None,
            "supply_class": row[1].value,
            "avg_dos": round(row[2] or 0, 1),
            "avg_on_hand": round(row[3] or 0, 1),
        }
        for row in rows
    ]
