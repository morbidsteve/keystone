"""Custody & Accountability endpoints — sensitive items, transfers, inventories, audit."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units, require_role
from app.database import get_db
from app.models.custody import (
    AuditAction,
    AuditEntityType,
    CustodyTransfer,
    DiscrepancyType,
    InventoryEvent,
    InventoryLineItem,
    InventoryStatus,
    SensitiveItem,
    SensitiveItemStatus,
    SensitiveItemType,
    TransferType,
)
from app.models.user import Role, User
from app.schemas.custody import (
    AuditLogResponse,
    CustodyChainResponse,
    CustodyTransferCreate,
    CustodyTransferResponse,
    HandReceiptResponse,
    InventoryEventCreate,
    InventoryEventResponse,
    InventoryLineItemCreate,
    InventoryLineItemResponse,
    InventoryResultResponse,
    SensitiveItemCreate,
    SensitiveItemResponse,
    SensitiveItemUpdate,
)
from app.services.custody import AuditService, CustodyService

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S4]

# Fields that may be updated via PUT /items/{item_id}
UPDATABLE_FIELDS = {
    "item_type",
    "serial_number",
    "nomenclature",
    "nsn",
    "tamcn",
    "condition_code",
    "current_holder_id",
    "hand_receipt_number",
    "notes",
}


# ---------------------------------------------------------------------------
# Sensitive Items
# ---------------------------------------------------------------------------


@router.get("/items", response_model=List[SensitiveItemResponse])
async def list_sensitive_items(
    unit_id: Optional[int] = Query(None),
    item_type: Optional[SensitiveItemType] = Query(None),
    status: Optional[SensitiveItemStatus] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List sensitive items filtered by accessible units."""
    accessible = await get_accessible_units(db, current_user)
    query = select(SensitiveItem).where(SensitiveItem.unit_id.in_(accessible))

    if unit_id is not None:
        if unit_id not in accessible:
            raise NotFoundError("Unit", unit_id)
        query = query.where(SensitiveItem.unit_id == unit_id)

    if item_type is not None:
        query = query.where(SensitiveItem.item_type == item_type)

    if status is not None:
        query = query.where(SensitiveItem.status == status)

    query = query.order_by(SensitiveItem.nomenclature).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/items/{item_id}", response_model=SensitiveItemResponse)
async def get_sensitive_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single sensitive item by ID."""
    result = await db.execute(select(SensitiveItem).where(SensitiveItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("SensitiveItem", item_id)

    accessible = await get_accessible_units(db, current_user)
    if item.unit_id not in accessible:
        raise NotFoundError("SensitiveItem", item_id)

    return item


@router.post(
    "/items",
    response_model=SensitiveItemResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_sensitive_item(
    data: SensitiveItemCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new sensitive item."""
    await check_unit_access(current_user, data.unit_id, db)

    item = SensitiveItem(
        **data.model_dump(),
        created_by_user_id=current_user.id,
    )
    db.add(item)
    await db.flush()
    await db.refresh(item)

    # Audit log
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        action=AuditAction.CREATE,
        entity_type=AuditEntityType.SENSITIVE_ITEM,
        entity_id=item.id,
        description=f"Created sensitive item: {item.nomenclature} (SN: {item.serial_number})",
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return item


@router.put(
    "/items/{item_id}",
    response_model=SensitiveItemResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_sensitive_item(
    item_id: int,
    data: SensitiveItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a sensitive item (allowlisted fields only)."""
    result = await db.execute(select(SensitiveItem).where(SensitiveItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("SensitiveItem", item_id)

    await check_unit_access(current_user, item.unit_id, db)

    update_data = data.model_dump(exclude_unset=True)

    # Capture old values before applying changes
    old_values = {}
    for field in update_data:
        if field in UPDATABLE_FIELDS:
            old_values[field] = getattr(item, field)

    # Classification changes require ADMIN role
    if "security_classification" in update_data:
        if current_user.role != Role.ADMIN:
            raise BadRequestError("Only ADMIN can change security classification")
        old_classification = getattr(item, "security_classification", None)
        setattr(item, "security_classification", update_data["security_classification"])
        # Specific audit log for classification change
        await AuditService.log_action(
            db=db,
            user_id=current_user.id,
            action=AuditAction.UPDATE,
            entity_type=AuditEntityType.SENSITIVE_ITEM,
            description=f"Classification changed for item {item_id}",
            entity_id=item_id,
            old_value={
                "security_classification": str(old_classification)
                if old_classification
                else None
            },
            new_value={
                "security_classification": update_data["security_classification"]
            },
        )

    for field, value in update_data.items():
        if field in UPDATABLE_FIELDS:
            setattr(item, field, value)
    item.updated_by_user_id = current_user.id

    await db.flush()
    await db.refresh(item)

    # Audit log
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        action=AuditAction.UPDATE,
        entity_type=AuditEntityType.SENSITIVE_ITEM,
        description=f"Updated sensitive item {item_id}: {list(update_data.keys())}",
        entity_id=item_id,
        old_value=old_values,
        new_value=update_data,
    )

    return item


@router.put(
    "/items/{item_id}/status",
    response_model=SensitiveItemResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def update_item_status(
    item_id: int,
    new_status: SensitiveItemStatus = Query(...),
    request: Request = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update the status of a sensitive item (e.g., flag as MISSING)."""
    result = await db.execute(select(SensitiveItem).where(SensitiveItem.id == item_id))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("SensitiveItem", item_id)

    await check_unit_access(current_user, item.unit_id, db)

    old_status = item.status.value if item.status else None
    item.status = new_status
    item.updated_by_user_id = current_user.id

    await db.flush()

    # Audit log for status change
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        action=AuditAction.STATUS_CHANGE,
        entity_type=AuditEntityType.SENSITIVE_ITEM,
        entity_id=item.id,
        description=(
            f"Status change for {item.nomenclature} "
            f"(SN: {item.serial_number}): {old_status} -> {new_status.value}"
        ),
        old_value=old_status,
        new_value=new_status.value,
        ip_address=request.client.host if request and request.client else None,
        user_agent=request.headers.get("user-agent") if request else None,
    )

    await db.refresh(item)
    return item


@router.get("/items/{item_id}/chain", response_model=CustodyChainResponse)
async def get_custody_chain(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the full custody chain for a sensitive item."""
    chain = await CustodyService.get_custody_chain(db, item_id)

    accessible = await get_accessible_units(db, current_user)
    if chain["item"].unit_id not in accessible:
        raise NotFoundError("SensitiveItem", item_id)

    return chain


# ---------------------------------------------------------------------------
# Custody Transfers
# ---------------------------------------------------------------------------


@router.get("/transfers", response_model=List[CustodyTransferResponse])
async def list_transfers(
    item_id: Optional[int] = Query(None),
    unit_id: Optional[int] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List custody transfers with optional filters."""
    accessible = await get_accessible_units(db, current_user)

    query = (
        select(CustodyTransfer)
        .join(SensitiveItem)
        .where(SensitiveItem.unit_id.in_(accessible))
    )

    if item_id is not None:
        query = query.where(CustodyTransfer.sensitive_item_id == item_id)

    if unit_id is not None:
        if unit_id not in accessible:
            raise NotFoundError("Unit", unit_id)
        query = query.where(SensitiveItem.unit_id == unit_id)

    query = (
        query.order_by(CustodyTransfer.transferred_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/transfers",
    response_model=CustodyTransferResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_transfer(
    data: CustodyTransferCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record a custody transfer and update item's current holder."""
    # Validate the sensitive item exists
    item_result = await db.execute(
        select(SensitiveItem).where(SensitiveItem.id == data.sensitive_item_id)
    )
    item = item_result.scalar_one_or_none()
    if not item:
        raise NotFoundError("SensitiveItem", data.sensitive_item_id)

    await check_unit_access(current_user, item.unit_id, db)

    # Validate from_personnel matches current holder (unless ISSUE type where item has no holder)
    if data.transfer_type != TransferType.ISSUE:
        if data.from_personnel_id is not None and item.current_holder_id is not None:
            if data.from_personnel_id != item.current_holder_id:
                raise BadRequestError(
                    f"from_personnel_id ({data.from_personnel_id}) does not match "
                    f"current holder ({item.current_holder_id})"
                )

    transfer = CustodyTransfer(
        **data.model_dump(),
        transferred_by_user_id=current_user.id,
    )
    db.add(transfer)

    # Update item's current holder
    old_holder_id = item.current_holder_id
    if data.to_personnel_id is not None:
        item.current_holder_id = data.to_personnel_id
    item.updated_by_user_id = current_user.id

    await db.flush()
    await db.refresh(transfer)

    # Audit log
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        action=AuditAction.TRANSFER,
        entity_type=AuditEntityType.CUSTODY_TRANSFER,
        entity_id=transfer.id,
        description=(
            f"Custody transfer for {item.nomenclature} "
            f"(SN: {item.serial_number}): "
            f"holder {old_holder_id} -> {data.to_personnel_id}"
        ),
        old_value=old_holder_id,
        new_value=data.to_personnel_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return transfer


@router.get("/holder/{personnel_id}", response_model=List[SensitiveItemResponse])
async def get_items_by_holder(
    personnel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all sensitive items held by a specific person."""
    items = await CustodyService.get_items_by_holder(db, personnel_id)

    # Filter to accessible units
    accessible = await get_accessible_units(db, current_user)
    return [i for i in items if i.unit_id in accessible]


# ---------------------------------------------------------------------------
# Inventory Events
# ---------------------------------------------------------------------------


@router.get("/inventory", response_model=List[InventoryEventResponse])
async def list_inventory_events(
    unit_id: Optional[int] = Query(None),
    status: Optional[InventoryStatus] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List inventory events with optional filters."""
    accessible = await get_accessible_units(db, current_user)
    query = select(InventoryEvent).where(InventoryEvent.unit_id.in_(accessible))

    if unit_id is not None:
        if unit_id not in accessible:
            raise NotFoundError("Unit", unit_id)
        query = query.where(InventoryEvent.unit_id == unit_id)

    if status is not None:
        query = query.where(InventoryEvent.status == status)

    query = query.order_by(InventoryEvent.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post(
    "/inventory",
    response_model=InventoryEventResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def start_inventory(
    data: InventoryEventCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new inventory event."""
    await check_unit_access(current_user, data.unit_id, db)

    # Get total sensitive items for the unit
    items_result = await db.execute(
        select(SensitiveItem).where(SensitiveItem.unit_id == data.unit_id)
    )
    unit_items = items_result.scalars().all()

    event = InventoryEvent(
        **data.model_dump(),
        status=InventoryStatus.IN_PROGRESS,
        started_at=datetime.now(timezone.utc),
        total_items=len(unit_items),
        conducted_by_user_id=current_user.id,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)

    # Create line items for all sensitive items in the unit
    for item in unit_items:
        line = InventoryLineItem(
            inventory_event_id=event.id,
            sensitive_item_id=item.id,
        )
        db.add(line)
    await db.flush()

    # Audit log
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        action=AuditAction.INVENTORY_START,
        entity_type=AuditEntityType.INVENTORY_EVENT,
        entity_id=event.id,
        description=(
            f"Started {data.inventory_type.value} inventory for unit {data.unit_id} "
            f"with {len(unit_items)} items"
        ),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    return event


@router.post(
    "/inventory/{inventory_id}/verify",
    response_model=InventoryLineItemResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def verify_line_item(
    inventory_id: int,
    data: InventoryLineItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Verify a line item during an inventory event."""
    # Validate the inventory event exists and is in progress
    event_result = await db.execute(
        select(InventoryEvent).where(InventoryEvent.id == inventory_id)
    )
    event = event_result.scalar_one_or_none()
    if not event:
        raise NotFoundError("InventoryEvent", inventory_id)

    if event.status != InventoryStatus.IN_PROGRESS:
        raise BadRequestError(
            f"Inventory event is not in progress (status: {event.status.value})"
        )

    await check_unit_access(current_user, event.unit_id, db)

    # Find the line item for this sensitive item in this inventory
    line_result = await db.execute(
        select(InventoryLineItem).where(
            InventoryLineItem.inventory_event_id == inventory_id,
            InventoryLineItem.sensitive_item_id == data.sensitive_item_id,
        )
    )
    line = line_result.scalar_one_or_none()
    if not line:
        raise NotFoundError(
            "InventoryLineItem",
            f"item_id={data.sensitive_item_id} in inventory={inventory_id}",
        )

    # Prevent silent re-verification
    if line.verified and data.verified:
        raise BadRequestError(
            "Line item already verified. Use update to change verification."
        )

    # Update event counters (idempotent — only increment on state transitions)
    # Only increment if changing from unverified to verified
    if data.verified and not line.verified:
        event.items_verified = (event.items_verified or 0) + 1
    # Only increment discrepancy if not previously a discrepancy
    if (
        data.discrepancy_type is not None
        and data.discrepancy_type != DiscrepancyType.NONE
    ):
        if (
            line.discrepancy_type is None
            or line.discrepancy_type == DiscrepancyType.NONE
        ):
            event.discrepancies_found = (event.discrepancies_found or 0) + 1

    # Update verification data
    line.verified = data.verified
    line.serial_number_verified = data.serial_number_verified
    line.condition_code = data.condition_code
    line.discrepancy_type = data.discrepancy_type
    line.discrepancy_notes = data.discrepancy_notes
    line.verified_by_user_id = current_user.id
    line.verified_at = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(line)

    # Audit log
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        action=AuditAction.ITEM_VERIFIED,
        entity_type=AuditEntityType.INVENTORY_EVENT,
        description=(
            f"Verified line item for sensitive_item_id={data.sensitive_item_id} "
            f"in inventory={inventory_id}: verified={data.verified}"
        ),
        entity_id=inventory_id,
    )

    return line


@router.put(
    "/inventory/{inventory_id}/complete",
    response_model=InventoryEventResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def complete_inventory(
    inventory_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Complete an inventory event."""
    event_result = await db.execute(
        select(InventoryEvent).where(InventoryEvent.id == inventory_id)
    )
    event = event_result.scalar_one_or_none()
    if not event:
        raise NotFoundError("InventoryEvent", inventory_id)

    if event.status != InventoryStatus.IN_PROGRESS:
        raise BadRequestError(
            f"Inventory event is not in progress (status: {event.status.value})"
        )

    await check_unit_access(current_user, event.unit_id, db)

    event.status = InventoryStatus.COMPLETED
    event.completed_at = datetime.now(timezone.utc)

    await db.flush()

    # Audit log
    await AuditService.log_action(
        db=db,
        user_id=current_user.id,
        action=AuditAction.INVENTORY_COMPLETE,
        entity_type=AuditEntityType.INVENTORY_EVENT,
        entity_id=event.id,
        description=(
            f"Completed inventory {inventory_id}: "
            f"{event.items_verified}/{event.total_items} verified, "
            f"{event.discrepancies_found} discrepancies"
        ),
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
    )

    await db.refresh(event)
    return event


@router.get("/inventory/{inventory_id}", response_model=InventoryResultResponse)
async def get_inventory_results(
    inventory_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get inventory event results including all line items."""
    result = await db.execute(
        select(InventoryEvent)
        .where(InventoryEvent.id == inventory_id)
        .options(selectinload(InventoryEvent.line_items))
    )
    event = result.scalar_one_or_none()
    if not event:
        raise NotFoundError("InventoryEvent", inventory_id)

    accessible = await get_accessible_units(db, current_user)
    if event.unit_id not in accessible:
        raise NotFoundError("InventoryEvent", inventory_id)

    return {"event": event, "line_items": list(event.line_items)}


# ---------------------------------------------------------------------------
# Audit Log
# ---------------------------------------------------------------------------


@router.get(
    "/audit",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_role([Role.ADMIN]))],
)
async def list_audit_logs(
    entity_type: Optional[AuditEntityType] = Query(None),
    entity_id: Optional[int] = Query(None),
    action: Optional[AuditAction] = Query(None),
    days_back: int = Query(30, ge=1, le=365),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List audit logs with filters (ADMIN only)."""
    logs = await AuditService.get_audit_trail(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
        days_back=days_back,
    )

    # Apply action filter if provided
    if action is not None:
        logs = [log for log in logs if log.action == action]

    return logs[offset : offset + limit]


@router.get(
    "/audit/user/{user_id}",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_role([Role.ADMIN]))],
)
async def get_user_activity(
    user_id: int,
    days_back: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get audit entries for a specific user (ADMIN only)."""
    return await AuditService.get_user_activity(
        db=db,
        user_id=user_id,
        days_back=days_back,
    )


@router.get(
    "/audit/security",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_role([Role.ADMIN]))],
)
async def get_sensitive_actions(
    hours_back: int = Query(24, ge=1, le=720),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get high-sensitivity actions within a time window (ADMIN only)."""
    return await AuditService.get_sensitive_actions(
        db=db,
        hours_back=hours_back,
    )


# ---------------------------------------------------------------------------
# Hand Receipt
# ---------------------------------------------------------------------------


@router.get("/hand-receipt/{personnel_id}", response_model=HandReceiptResponse)
async def get_hand_receipt(
    personnel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate hand receipt data for a person."""
    receipt = await CustodyService.generate_hand_receipt(db, personnel_id)

    # Filter items to accessible units
    accessible = await get_accessible_units(db, current_user)
    receipt["items"] = [i for i in receipt["items"] if i.unit_id in accessible]
    receipt["total_items"] = len(receipt["items"])

    return receipt
