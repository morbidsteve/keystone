"""Equipment status CRUD and analytics endpoints."""

from datetime import datetime, timedelta, timezone
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
from app.models.equipment import EquipmentStatus
from app.models.user import User
from app.schemas.equipment import EquipmentCreate, EquipmentResponse, EquipmentUpdate

router = APIRouter()


@router.get("/", response_model=List[EquipmentResponse])
async def list_equipment(
    unit_id: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List equipment status records."""
    accessible = await get_accessible_units(db, current_user)
    query = select(EquipmentStatus).where(EquipmentStatus.unit_id.in_(accessible))

    if unit_id and unit_id in accessible:
        query = query.where(EquipmentStatus.unit_id == unit_id)

    query = (
        query.order_by(EquipmentStatus.reported_at.desc()).offset(offset).limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{record_id}", response_model=EquipmentResponse)
async def get_equipment(
    record_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single equipment status record."""
    result = await db.execute(
        select(EquipmentStatus).where(EquipmentStatus.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundError("Equipment record", record_id)

    await check_unit_access(current_user, record.unit_id, db)
    return record


@router.post("/", response_model=EquipmentResponse, status_code=201)
async def create_equipment(
    data: EquipmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("equipment:create")),
):
    """Create a new equipment status record."""
    await check_unit_access(current_user, data.unit_id, db)

    record = EquipmentStatus(**data.model_dump())
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


@router.put("/{record_id}", response_model=EquipmentResponse)
async def update_equipment(
    record_id: int,
    data: EquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_permission("equipment:edit")),
):
    """Update an equipment status record."""
    result = await db.execute(
        select(EquipmentStatus).where(EquipmentStatus.id == record_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise NotFoundError("Equipment record", record_id)

    await check_unit_access(current_user, record.unit_id, db)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(record, field, value)

    await db.flush()
    await db.refresh(record)
    return record


@router.get("/analytics/readiness-trends")
async def get_readiness_trends(
    unit_id: Optional[int] = Query(None),
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Equipment readiness trend over time."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id and unit_id in accessible:
        unit_ids = [unit_id]
    else:
        unit_ids = accessible

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    query = (
        select(
            func.date_trunc("day", EquipmentStatus.reported_at).label("day"),
            func.avg(EquipmentStatus.readiness_pct).label("avg_readiness"),
            func.sum(EquipmentStatus.mission_capable).label("total_mc"),
            func.sum(EquipmentStatus.total_possessed).label("total_poss"),
        )
        .where(
            EquipmentStatus.unit_id.in_(unit_ids),
            EquipmentStatus.reported_at >= cutoff,
        )
        .group_by(func.date_trunc("day", EquipmentStatus.reported_at))
        .order_by(func.date_trunc("day", EquipmentStatus.reported_at))
    )

    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "date": row[0].isoformat() if row[0] else None,
            "avg_readiness_pct": round(row[1] or 0, 1),
            "total_mission_capable": row[2] or 0,
            "total_possessed": row[3] or 0,
        }
        for row in rows
    ]
