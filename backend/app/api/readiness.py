"""Readiness and unit strength CRUD and analytics endpoints."""

from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units
from app.database import get_db
from app.models.readiness_snapshot import UnitReadinessSnapshot
from app.models.unit import Unit
from app.models.unit_strength import UnitStrength
from app.models.user import User
from app.schemas.readiness import (
    ReadinessDashboardResponse,
    ReadinessRollupResponse,
    ReadinessSnapshotResponse,
    ReadinessTrendResponse,
    SnapshotCreateRequest,
    UnitDashboardEntry,
    UnitStrengthResponse,
    UnitStrengthUpdateRequest,
)
from app.services.readiness import ReadinessService

router = APIRouter()


@router.get("/", response_model=ReadinessDashboardResponse)
async def readiness_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get readiness dashboard for all accessible units."""
    accessible = await get_accessible_units(db, current_user)

    result = await db.execute(select(Unit).where(Unit.id.in_(accessible)))
    units = result.scalars().all()

    entries: List[UnitDashboardEntry] = []
    for unit in units:
        snap_result = await db.execute(
            select(UnitReadinessSnapshot)
            .where(UnitReadinessSnapshot.unit_id == unit.id)
            .order_by(UnitReadinessSnapshot.snapshot_date.desc())
            .limit(1)
        )
        snapshot = snap_result.scalar_one_or_none()

        entries.append(
            UnitDashboardEntry(
                unit_id=unit.id,
                unit_name=unit.name,
                abbreviation=unit.abbreviation,
                overall_readiness_pct=(
                    snapshot.overall_readiness_pct if snapshot else None
                ),
                c_rating=snapshot.c_rating if snapshot else None,
                snapshot_date=(
                    snapshot.snapshot_date.isoformat()
                    if snapshot and snapshot.snapshot_date
                    else None
                ),
            )
        )

    return ReadinessDashboardResponse(
        timestamp=datetime.now(timezone.utc).isoformat(),
        unit_count=len(entries),
        units=entries,
    )


@router.get("/strength/{unit_id}", response_model=UnitStrengthResponse)
async def get_unit_strength(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the latest unit strength report."""
    await check_unit_access(current_user, unit_id, db)

    # Verify unit exists
    unit_result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = unit_result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)

    result = await db.execute(
        select(UnitStrength)
        .where(UnitStrength.unit_id == unit_id)
        .order_by(UnitStrength.reported_at.desc())
        .limit(1)
    )
    strength = result.scalar_one_or_none()
    if not strength:
        raise NotFoundError("Unit strength data", unit_id)

    return strength


@router.put("/strength/{unit_id}", response_model=UnitStrengthResponse)
async def update_unit_strength(
    unit_id: int,
    data: UnitStrengthUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new timestamped unit strength record."""
    await check_unit_access(current_user, unit_id, db)

    # Verify unit exists
    unit_result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = unit_result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)

    # Calculate totals
    total_authorized = data.authorized_officers + data.authorized_enlisted
    total_assigned = data.assigned_officers + data.assigned_enlisted
    fill_pct = (
        round(total_assigned / total_authorized * 100, 1)
        if total_authorized > 0
        else 0.0
    )

    record = UnitStrength(
        unit_id=unit_id,
        authorized_officers=data.authorized_officers,
        assigned_officers=data.assigned_officers,
        authorized_enlisted=data.authorized_enlisted,
        assigned_enlisted=data.assigned_enlisted,
        attached=data.attached,
        detached=data.detached,
        tad=data.tad,
        leave=data.leave,
        medical=data.medical,
        ua=data.ua,
        total_authorized=total_authorized,
        total_assigned=total_assigned,
        fill_pct=fill_pct,
        mos_shortfalls=data.mos_shortfalls or [],
        notes=data.notes,
    )
    db.add(record)
    await db.flush()
    await db.refresh(record)
    return record


@router.get("/{unit_id}", response_model=ReadinessSnapshotResponse)
async def get_current_readiness(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the latest readiness snapshot for a unit."""
    await check_unit_access(current_user, unit_id, db)

    # Verify unit exists
    unit_result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = unit_result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)

    result = await db.execute(
        select(UnitReadinessSnapshot)
        .where(UnitReadinessSnapshot.unit_id == unit_id)
        .order_by(UnitReadinessSnapshot.snapshot_date.desc())
        .limit(1)
    )
    snapshot = result.scalar_one_or_none()
    if not snapshot:
        raise NotFoundError("Readiness snapshot", unit_id)

    return snapshot


@router.get("/{unit_id}/history", response_model=ReadinessTrendResponse)
async def get_readiness_history(
    unit_id: int,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get readiness trend data for the last N days."""
    await check_unit_access(current_user, unit_id, db)

    # Verify unit exists
    unit_result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = unit_result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)

    cutoff = datetime.now(timezone.utc) - timedelta(days=days)

    result = await db.execute(
        select(UnitReadinessSnapshot)
        .where(
            UnitReadinessSnapshot.unit_id == unit_id,
            UnitReadinessSnapshot.snapshot_date >= cutoff,
        )
        .order_by(UnitReadinessSnapshot.snapshot_date.desc())
    )
    snapshots = result.scalars().all()

    return ReadinessTrendResponse(
        unit_id=unit_id,
        days=days,
        snapshot_count=len(snapshots),
        snapshots=snapshots,
    )


@router.get("/{unit_id}/rollup", response_model=ReadinessRollupResponse)
async def get_readiness_rollup(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get readiness rollup for subordinate units."""
    await check_unit_access(current_user, unit_id, db)

    # Verify unit exists
    unit_result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = unit_result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)

    rollup = await ReadinessService.roll_up_readiness(unit_id, db)
    return rollup


@router.post(
    "/{unit_id}/snapshot",
    response_model=ReadinessSnapshotResponse,
    status_code=201,
)
async def create_readiness_snapshot(
    unit_id: int,
    data: Optional[SnapshotCreateRequest] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger readiness snapshot generation for a unit."""
    await check_unit_access(current_user, unit_id, db)

    # Verify unit exists
    unit_result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = unit_result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)

    notes = data.notes if data else None
    is_official = data.is_official if data else False

    snapshot = await ReadinessService.generate_readiness_snapshot(
        unit_id=unit_id,
        db=db,
        reported_by_id=current_user.id,
        notes=notes,
        is_official=is_official,
    )
    return snapshot
