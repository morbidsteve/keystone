"""Fuel/POL management endpoints — storage points, transactions, rates, forecasting."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units, require_role
from app.database import get_db
from app.models.fuel import (
    FuelConsumptionRate,
    FuelForecast,
    FuelStoragePoint,
    FuelTransaction,
    FuelTransactionType,
)
from app.models.user import Role, User
from app.schemas.fuel import (
    BulkRequirementRequest,
    BulkRequirementResponse,
    ForecastGenerateRequest,
    FuelConsumptionRateResponse,
    FuelConsumptionRateUpdate,
    FuelDashboardResponse,
    FuelForecastResponse,
    FuelStoragePointCreate,
    FuelStoragePointResponse,
    FuelStoragePointUpdate,
    FuelTransactionCreate,
    FuelTransactionResponse,
)
from app.services.fuel_analytics import FuelAnalyticsService

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S4]


# ---------------------------------------------------------------------------
# Storage Points
# ---------------------------------------------------------------------------


@router.get("/storage-points", response_model=List[FuelStoragePointResponse])
async def list_storage_points(
    unit_id: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List fuel storage points filtered by accessible units."""
    accessible = await get_accessible_units(db, current_user)
    query = select(FuelStoragePoint).where(FuelStoragePoint.unit_id.in_(accessible))

    if unit_id is not None:
        if unit_id not in accessible:
            raise NotFoundError("Unit", unit_id)
        query = query.where(FuelStoragePoint.unit_id == unit_id)

    query = query.order_by(FuelStoragePoint.name).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get(
    "/storage-points/{storage_point_id}", response_model=FuelStoragePointResponse
)
async def get_storage_point(
    storage_point_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single fuel storage point with recent transactions."""
    result = await db.execute(
        select(FuelStoragePoint)
        .where(FuelStoragePoint.id == storage_point_id)
        .options(selectinload(FuelStoragePoint.transactions))
    )
    point = result.scalar_one_or_none()
    if not point:
        raise NotFoundError("FuelStoragePoint", storage_point_id)

    accessible = await get_accessible_units(db, current_user)
    if point.unit_id not in accessible:
        raise NotFoundError("FuelStoragePoint", storage_point_id)

    return point


@router.post(
    "/storage-points",
    response_model=FuelStoragePointResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_storage_point(
    data: FuelStoragePointCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a fuel storage point."""
    await check_unit_access(current_user, data.unit_id, db)

    point = FuelStoragePoint(
        **data.model_dump(),
        updated_by_user_id=current_user.id,
    )
    db.add(point)
    await db.flush()
    await db.refresh(point)
    return point


@router.put(
    "/storage-points/{storage_point_id}",
    response_model=FuelStoragePointResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_storage_point(
    storage_point_id: int,
    data: FuelStoragePointUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a fuel storage point."""
    result = await db.execute(
        select(FuelStoragePoint).where(FuelStoragePoint.id == storage_point_id)
    )
    point = result.scalar_one_or_none()
    if not point:
        raise NotFoundError("FuelStoragePoint", storage_point_id)

    await check_unit_access(current_user, point.unit_id, db)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(point, field, value)
    point.updated_by_user_id = current_user.id

    await db.flush()
    await db.refresh(point)
    return point


@router.delete(
    "/storage-points/{storage_point_id}",
    status_code=204,
    dependencies=[Depends(require_role([Role.ADMIN]))],
)
async def delete_storage_point(
    storage_point_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a fuel storage point (ADMIN only)."""
    result = await db.execute(
        select(FuelStoragePoint).where(FuelStoragePoint.id == storage_point_id)
    )
    point = result.scalar_one_or_none()
    if not point:
        raise NotFoundError("FuelStoragePoint", storage_point_id)

    await check_unit_access(current_user, point.unit_id, db)

    await db.delete(point)
    await db.flush()


# ---------------------------------------------------------------------------
# Transactions
# ---------------------------------------------------------------------------


@router.post(
    "/transactions",
    response_model=FuelTransactionResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_transaction(
    data: FuelTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a fuel transaction and update storage point inventory."""
    # Validate storage point exists and user has access
    sp_result = await db.execute(
        select(FuelStoragePoint)
        .where(FuelStoragePoint.id == data.storage_point_id)
        .with_for_update()
    )
    storage_point = sp_result.scalar_one_or_none()
    if not storage_point:
        raise NotFoundError("FuelStoragePoint", data.storage_point_id)

    await check_unit_access(current_user, storage_point.unit_id, db)

    # Validate inventory after transaction
    new_level = storage_point.current_gallons + data.quantity_gallons
    if new_level < 0:
        raise BadRequestError(
            f"Insufficient inventory: current={storage_point.current_gallons}, "
            f"transaction={data.quantity_gallons}"
        )
    if new_level > storage_point.capacity_gallons:
        raise BadRequestError(
            f"Exceeds capacity: capacity={storage_point.capacity_gallons}, "
            f"resulting level={new_level}"
        )

    # Create transaction
    txn = FuelTransaction(
        **data.model_dump(),
        performed_by_user_id=current_user.id,
    )
    db.add(txn)

    # Update storage point inventory
    storage_point.current_gallons = new_level

    # If this is a receipt, update last resupply date
    if data.transaction_type == FuelTransactionType.RECEIPT:
        from datetime import datetime, timezone

        storage_point.last_resupply_date = datetime.now(timezone.utc)

    # Update status based on fill level
    fill_pct = (
        (new_level / storage_point.capacity_gallons * 100.0)
        if storage_point.capacity_gallons > 0
        else 0.0
    )
    if new_level == 0:
        from app.models.fuel import FuelStorageStatus

        storage_point.status = FuelStorageStatus.DRY
    elif fill_pct < 10:
        from app.models.fuel import FuelStorageStatus

        storage_point.status = FuelStorageStatus.DEGRADED
    else:
        from app.models.fuel import FuelStorageStatus

        storage_point.status = FuelStorageStatus.OPERATIONAL

    storage_point.updated_by_user_id = current_user.id

    await db.flush()
    await db.refresh(txn)
    return txn


@router.get("/transactions", response_model=List[FuelTransactionResponse])
async def list_transactions(
    storage_point_id: Optional[int] = Query(None),
    unit_id: Optional[int] = Query(None),
    transaction_type: Optional[FuelTransactionType] = Query(None),
    period_days: Optional[int] = Query(None, ge=1, le=365),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List fuel transactions with optional filters."""
    accessible = await get_accessible_units(db, current_user)

    query = (
        select(FuelTransaction)
        .join(FuelStoragePoint)
        .where(FuelStoragePoint.unit_id.in_(accessible))
    )

    if storage_point_id is not None:
        query = query.where(FuelTransaction.storage_point_id == storage_point_id)

    if unit_id is not None:
        if unit_id not in accessible:
            raise NotFoundError("Unit", unit_id)
        query = query.where(FuelStoragePoint.unit_id == unit_id)

    if transaction_type is not None:
        query = query.where(FuelTransaction.transaction_type == transaction_type)

    if period_days is not None:
        from datetime import datetime, timedelta, timezone

        cutoff = datetime.now(timezone.utc) - timedelta(days=period_days)
        query = query.where(FuelTransaction.transaction_date >= cutoff)

    query = (
        query.order_by(FuelTransaction.transaction_date.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


# ---------------------------------------------------------------------------
# Consumption Rates
# ---------------------------------------------------------------------------


@router.get("/consumption-rates", response_model=List[FuelConsumptionRateResponse])
async def list_consumption_rates(
    equipment_type: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List fuel consumption rates with optional equipment type filter."""
    query = select(FuelConsumptionRate)

    if equipment_type is not None:
        from app.models.catalog_equipment import EquipmentCatalogItem

        query = query.join(EquipmentCatalogItem).where(
            EquipmentCatalogItem.category == equipment_type
        )

    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.put(
    "/consumption-rates/{rate_id}",
    response_model=FuelConsumptionRateResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_consumption_rate(
    rate_id: int,
    data: FuelConsumptionRateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a fuel consumption rate record."""
    result = await db.execute(
        select(FuelConsumptionRate).where(FuelConsumptionRate.id == rate_id)
    )
    rate = result.scalar_one_or_none()
    if not rate:
        raise NotFoundError("FuelConsumptionRate", rate_id)

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rate, field, value)
    rate.updated_by_user_id = current_user.id

    await db.flush()
    await db.refresh(rate)
    return rate


# ---------------------------------------------------------------------------
# Forecasting & Dashboard
# ---------------------------------------------------------------------------


@router.get("/dashboard/{unit_id}", response_model=FuelDashboardResponse)
async def get_fuel_dashboard(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive fuel status dashboard for a unit."""
    await check_unit_access(current_user, unit_id, db)
    return await FuelAnalyticsService.generate_fuel_status_report(db, unit_id)


@router.get("/forecast/{unit_id}", response_model=FuelForecastResponse)
async def get_current_forecast(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the most recent fuel forecast for a unit."""
    await check_unit_access(current_user, unit_id, db)

    result = await db.execute(
        select(FuelForecast)
        .where(FuelForecast.unit_id == unit_id)
        .order_by(FuelForecast.created_at.desc())
        .limit(1)
    )
    forecast = result.scalar_one_or_none()
    if not forecast:
        raise NotFoundError("FuelForecast", f"unit_id={unit_id}")
    return forecast


@router.post(
    "/forecast/{unit_id}",
    response_model=FuelForecastResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def generate_forecast(
    unit_id: int,
    data: ForecastGenerateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and save a fuel forecast for a unit."""
    await check_unit_access(current_user, unit_id, db)
    forecast = await FuelAnalyticsService.project_fuel_needs(
        db=db,
        unit_id=unit_id,
        days_ahead=data.forecast_period_days,
        tempo=data.operational_tempo,
        user_id=current_user.id,
        notes=data.notes,
    )
    return forecast


@router.post(
    "/bulk-requirement",
    response_model=BulkRequirementResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def calculate_bulk_requirement(
    data: BulkRequirementRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Calculate fuel requirement for multiple units over a given period."""
    accessible = await get_accessible_units(db, current_user)
    for uid in data.unit_ids:
        if uid not in accessible:
            raise NotFoundError("Unit", uid)

    result = await FuelAnalyticsService.calculate_bulk_requirement(
        db=db,
        unit_ids=data.unit_ids,
        operation_days=data.operation_days,
        tempo=data.operational_tempo,
    )
    return result
