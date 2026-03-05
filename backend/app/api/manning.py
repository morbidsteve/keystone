"""Manning and billet structure CRUD endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import ConflictError, NotFoundError
from app.core.permissions import check_unit_access, require_role
from app.database import get_db
from app.models.manning import BilletStructure, ManningSnapshot
from app.models.user import Role, User
from app.schemas.manning import (
    BilletStructureCreate,
    BilletStructureResponse,
    BilletStructureUpdate,
    KeyBilletVacancyReport,
    ManningSnapshotCreate,
    ManningSnapshotResponse,
)
from app.services.personnel_analytics import PersonnelAnalyticsService

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S3, Role.S4]


@router.get("/billets/{unit_id}", response_model=List[BilletStructureResponse])
async def list_billets(
    unit_id: int,
    filled_only: Optional[bool] = Query(None),
    key_only: Optional[bool] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List billets for a unit with optional filters."""
    await check_unit_access(current_user, unit_id, db)

    query = select(BilletStructure).where(BilletStructure.unit_id == unit_id)

    if filled_only is True:
        query = query.where(BilletStructure.is_filled.is_(True))
    elif filled_only is False:
        query = query.where(BilletStructure.is_filled.is_(False))

    if key_only is True:
        query = query.where(BilletStructure.is_key_billet.is_(True))

    query = query.order_by(BilletStructure.billet_id_code).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get(
    "/billets/{unit_id}/vacancies",
    response_model=KeyBilletVacancyReport,
)
async def get_billet_vacancies(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get vacant key billets for a unit."""
    await check_unit_access(current_user, unit_id, db)
    data = await PersonnelAnalyticsService.get_key_billet_vacancies(db, unit_id)
    return data


@router.post(
    "/billets",
    response_model=BilletStructureResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_billet(
    data: BilletStructureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new billet in the T/O structure."""
    await check_unit_access(current_user, data.unit_id, db)

    # Check billet_id_code uniqueness
    existing = await db.execute(
        select(BilletStructure).where(
            BilletStructure.billet_id_code == data.billet_id_code
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictError(f"Billet with code '{data.billet_id_code}' already exists")

    # M-4 fix: validate filled_by_id belongs to an accessible unit
    if data.filled_by_id is not None:
        from app.models.personnel import Personnel

        person_result = await db.execute(
            select(Personnel.unit_id).where(Personnel.id == data.filled_by_id)
        )
        person_unit = person_result.scalar_one_or_none()
        if person_unit is None:
            raise NotFoundError("Personnel", data.filled_by_id)
        await check_unit_access(current_user, person_unit, db)

    billet_data = data.model_dump()
    # Auto-set is_filled based on filled_by_id
    if billet_data.get("filled_by_id"):
        billet_data["is_filled"] = True

    billet = BilletStructure(**billet_data)
    db.add(billet)
    await db.flush()
    await db.refresh(billet)
    return billet


@router.put(
    "/billets/{billet_id}",
    response_model=BilletStructureResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_billet(
    billet_id: int,
    data: BilletStructureUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update or assign a billet."""
    result = await db.execute(
        select(BilletStructure).where(BilletStructure.id == billet_id)
    )
    billet = result.scalar_one_or_none()
    if not billet:
        raise NotFoundError("Billet", billet_id)

    await check_unit_access(current_user, billet.unit_id, db)

    update_data = data.model_dump(exclude_unset=True)

    # Auto-set is_filled when assigning/unassigning personnel
    if "filled_by_id" in update_data:
        if update_data["filled_by_id"] is not None:
            update_data["is_filled"] = True
        else:
            update_data["is_filled"] = False

    for field, value in update_data.items():
        setattr(billet, field, value)

    await db.flush()
    await db.refresh(billet)
    return billet


@router.delete(
    "/billets/{billet_id}",
    status_code=204,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def delete_billet(
    billet_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a billet from the T/O structure."""
    result = await db.execute(
        select(BilletStructure).where(BilletStructure.id == billet_id)
    )
    billet = result.scalar_one_or_none()
    if not billet:
        raise NotFoundError("Billet", billet_id)

    await check_unit_access(current_user, billet.unit_id, db)

    await db.delete(billet)
    await db.flush()


# --- Manning Snapshot endpoints ---


@router.get(
    "/snapshots/{unit_id}",
    response_model=List[ManningSnapshotResponse],
)
async def list_manning_snapshots(
    unit_id: int,
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List manning snapshots for a unit, most recent first."""
    await check_unit_access(current_user, unit_id, db)

    query = (
        select(ManningSnapshot)
        .where(ManningSnapshot.unit_id == unit_id)
        .order_by(ManningSnapshot.snapshot_date.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/snapshots",
    response_model=ManningSnapshotResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_manning_snapshot(
    data: ManningSnapshotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a point-in-time manning snapshot."""
    await check_unit_access(current_user, data.unit_id, db)

    snapshot_data = data.model_dump()

    # Auto-calculate fill rate if not provided
    if (
        snapshot_data.get("fill_rate_pct") is None
        and snapshot_data["authorized_total"] > 0
    ):
        snapshot_data["fill_rate_pct"] = round(
            snapshot_data["assigned_total"] / snapshot_data["authorized_total"] * 100, 1
        )

    snapshot = ManningSnapshot(**snapshot_data)
    db.add(snapshot)
    await db.flush()
    await db.refresh(snapshot)
    return snapshot
