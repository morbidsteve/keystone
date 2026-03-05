"""Inventory service — stock management and transaction recording."""

from typing import List

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.inventory import InventoryRecord, InventoryTransaction, TransactionType
from app.models.user import User
from app.schemas.inventory import InventoryTransactionCreate, LowStockAlert


async def get_or_create_inventory(
    db: AsyncSession,
    unit_id: int,
    location: str | None,
    nsn: str | None,
    nomenclature: str,
    unit_of_issue: str = "EA",
) -> InventoryRecord:
    """Get an existing inventory record or create a new one."""
    query = select(InventoryRecord).where(
        InventoryRecord.unit_id == unit_id,
        InventoryRecord.nomenclature == nomenclature,
    )
    if nsn:
        query = query.where(InventoryRecord.nsn == nsn)
    if location:
        query = query.where(InventoryRecord.location == location)

    result = await db.execute(query)
    record = result.scalar_one_or_none()

    if record is None:
        record = InventoryRecord(
            unit_id=unit_id,
            nsn=nsn,
            nomenclature=nomenclature,
            location=location,
            unit_of_issue=unit_of_issue,
            quantity_on_hand=0.0,
            quantity_due_in=0.0,
            quantity_due_out=0.0,
        )
        db.add(record)
        await db.flush()
        await db.refresh(record)

    return record


async def record_transaction(
    db: AsyncSession,
    current_user: User,
    data: InventoryTransactionCreate,
) -> InventoryTransaction:
    """Record an inventory transaction and update the associated record's quantities."""
    # Fetch the inventory record
    result = await db.execute(
        select(InventoryRecord).where(
            InventoryRecord.id == data.inventory_record_id
        )
    )
    record = result.scalar_one_or_none()
    if record is None:
        raise NotFoundError("Inventory record", data.inventory_record_id)

    # Apply quantity changes based on transaction type
    if data.transaction_type == TransactionType.RECEIPT:
        record.quantity_on_hand = (record.quantity_on_hand or 0) + data.quantity
    elif data.transaction_type == TransactionType.ISSUE:
        if (record.quantity_on_hand or 0) < data.quantity:
            raise BadRequestError(
                f"Insufficient stock: {record.quantity_on_hand} on hand, "
                f"{data.quantity} requested."
            )
        record.quantity_on_hand = (record.quantity_on_hand or 0) - data.quantity
    elif data.transaction_type == TransactionType.TURN_IN:
        record.quantity_on_hand = (record.quantity_on_hand or 0) + data.quantity
    elif data.transaction_type == TransactionType.ADJUSTMENT:
        # Adjustments set the quantity directly — but we record the delta
        record.quantity_on_hand = (record.quantity_on_hand or 0) + data.quantity
    elif data.transaction_type == TransactionType.TRANSFER:
        if (record.quantity_on_hand or 0) < data.quantity:
            raise BadRequestError(
                f"Insufficient stock for transfer: {record.quantity_on_hand} on hand, "
                f"{data.quantity} requested."
            )
        record.quantity_on_hand = (record.quantity_on_hand or 0) - data.quantity
    elif data.transaction_type == TransactionType.LOSS:
        record.quantity_on_hand = max(
            0, (record.quantity_on_hand or 0) - data.quantity
        )

    transaction = InventoryTransaction(
        inventory_record_id=data.inventory_record_id,
        transaction_type=data.transaction_type,
        quantity=data.quantity,
        performed_by_id=current_user.id,
        reference_number=data.reference_number,
        notes=data.notes,
    )
    db.add(transaction)
    await db.flush()
    await db.refresh(transaction)
    return transaction


async def get_low_stock_items(
    db: AsyncSession, unit_id: int
) -> List[LowStockAlert]:
    """Return inventory items where quantity_on_hand is below reorder_point."""
    result = await db.execute(
        select(InventoryRecord).where(
            InventoryRecord.unit_id == unit_id,
            InventoryRecord.reorder_point.isnot(None),
        )
    )
    records = result.scalars().all()

    alerts: List[LowStockAlert] = []
    for record in records:
        on_hand = record.quantity_on_hand or 0
        reorder = record.reorder_point or 0
        if on_hand < reorder:
            alerts.append(
                LowStockAlert(
                    inventory_record_id=record.id,
                    unit_id=record.unit_id,
                    nsn=record.nsn,
                    nomenclature=record.nomenclature,
                    location=record.location,
                    quantity_on_hand=on_hand,
                    reorder_point=reorder,
                    deficit=reorder - on_hand,
                )
            )
    return alerts


async def get_inventory_by_unit(
    db: AsyncSession,
    unit_id: int,
    location: str | None = None,
) -> list:
    """Get all inventory records for a unit, optionally filtered by location."""
    query = select(InventoryRecord).where(InventoryRecord.unit_id == unit_id)
    if location:
        query = query.where(InventoryRecord.location == location)
    query = query.order_by(InventoryRecord.nomenclature.asc())
    result = await db.execute(query)
    return list(result.scalars().all())
