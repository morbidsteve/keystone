"""Inventory management API endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.permissions import check_unit_access, get_accessible_units, require_role
from app.database import get_db
from app.models.user import Role, User
from app.schemas.inventory import (
    InventoryRecordCreate,
    InventoryRecordResponse,
    InventoryTransactionCreate,
    InventoryTransactionResponse,
    LowStockAlert,
)
from app.services.inventory_service import (
    get_inventory_by_unit,
    get_low_stock_items,
    get_or_create_inventory,
    record_transaction,
)

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S4, Role.S3, Role.OPERATOR]


@router.get("/", response_model=List[InventoryRecordResponse])
async def list_inventory(
    unit_id: Optional[int] = Query(None),
    location: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List inventory records filtered by unit access."""
    accessible = await get_accessible_units(db, current_user)

    if unit_id and unit_id in accessible:
        return await get_inventory_by_unit(db, unit_id, location)

    # Return inventory for all accessible units
    all_records: list = []
    for uid in accessible:
        records = await get_inventory_by_unit(db, uid, location)
        all_records.extend(records)
    return all_records


@router.get("/low-stock", response_model=List[LowStockAlert])
async def low_stock_alerts(
    unit_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get items below reorder point, scoped to accessible units."""
    accessible = await get_accessible_units(db, current_user)

    if unit_id and unit_id in accessible:
        return await get_low_stock_items(db, unit_id)

    all_alerts: List[LowStockAlert] = []
    for uid in accessible:
        alerts = await get_low_stock_items(db, uid)
        all_alerts.extend(alerts)
    return all_alerts


@router.post(
    "/",
    response_model=InventoryRecordResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_inventory_record(
    data: InventoryRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create or get an inventory record."""
    await check_unit_access(current_user, data.unit_id, db)
    record = await get_or_create_inventory(
        db,
        unit_id=data.unit_id,
        location=data.location,
        nsn=data.nsn,
        nomenclature=data.nomenclature,
        unit_of_issue=data.unit_of_issue,
    )
    # Apply initial quantities if this is a new record
    record.quantity_on_hand = data.quantity_on_hand
    record.quantity_due_in = data.quantity_due_in
    record.quantity_due_out = data.quantity_due_out
    record.reorder_point = data.reorder_point
    await db.flush()
    await db.refresh(record)
    return record


@router.post(
    "/transaction",
    response_model=InventoryTransactionResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_inventory_transaction(
    data: InventoryTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record an inventory transaction (receipt, issue, etc.)."""
    # H-2 fix: verify unit access for the target inventory record
    from sqlalchemy import select as sa_select
    from app.models.inventory import InventoryRecord

    result = await db.execute(
        sa_select(InventoryRecord.unit_id).where(
            InventoryRecord.id == data.inventory_record_id
        )
    )
    unit_id = result.scalar_one_or_none()
    if unit_id is None:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("InventoryRecord", data.inventory_record_id)
    await check_unit_access(current_user, unit_id, db)
    return await record_transaction(db, current_user, data)
