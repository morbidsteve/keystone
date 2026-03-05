"""Requisition workflow service — state transitions, approvals, and requisition numbering."""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.requisition import (
    ApprovalAction,
    Requisition,
    RequisitionApproval,
    RequisitionLineItem,
    RequisitionStatus,
    RequisitionStatusHistory,
)
from app.models.unit import Unit
from app.models.user import User
from app.schemas.requisition import (
    RequisitionApprove,
    RequisitionCreate,
    RequisitionDeny,
    RequisitionReceive,
    RequisitionSubmit,
)


async def _get_unit_abbreviation(db: AsyncSession, unit_id: int) -> str:
    """Fetch unit abbreviation for requisition numbering."""
    result = await db.execute(select(Unit.abbreviation).where(Unit.id == unit_id))
    row = result.scalar_one_or_none()
    if row is None:
        raise NotFoundError("Unit", unit_id)
    return row.replace(" ", "")


async def generate_requisition_number(db: AsyncSession, unit_id: int) -> str:
    """Generate a unique requisition number: R-{unit_abbrev}-{YYYYMMDD}-{seq}."""
    unit_abbrev = await _get_unit_abbreviation(db, unit_id)
    today = datetime.now(timezone.utc).strftime("%Y%m%d")
    prefix = f"R-{unit_abbrev}-{today}"

    result = await db.execute(
        select(func.count(Requisition.id)).where(
            Requisition.requisition_number.like(f"{prefix}%")
        )
    )
    count = result.scalar() or 0
    seq = count + 1
    return f"{prefix}-{seq:04d}"


def _record_status_change(
    requisition: Requisition,
    from_status: RequisitionStatus | None,
    to_status: RequisitionStatus,
    changed_by: User,
    notes: str | None = None,
) -> RequisitionStatusHistory:
    """Create a status history record."""
    return RequisitionStatusHistory(
        requisition_id=requisition.id,
        from_status=from_status,
        to_status=to_status,
        changed_by_id=changed_by.id,
        notes=notes,
    )


async def get_requisition(
    db: AsyncSession,
    requisition_id: int,
    with_relations: bool = False,
) -> Requisition:
    """Fetch a requisition by ID, optionally with eager-loaded relations."""
    query = select(Requisition).where(Requisition.id == requisition_id)
    if with_relations:
        query = query.options(
            selectinload(Requisition.line_items),
            selectinload(Requisition.approvals),
            selectinload(Requisition.status_history),
        )
    result = await db.execute(query)
    req = result.scalar_one_or_none()
    if req is None:
        raise NotFoundError("Requisition", requisition_id)
    return req


async def create_requisition(
    db: AsyncSession,
    current_user: User,
    unit_id: int,
    data: RequisitionCreate,
) -> Requisition:
    """Create a new requisition in DRAFT status with line items."""
    req_number = await generate_requisition_number(db, unit_id)

    # Calculate estimated cost from line items
    estimated_cost = 0.0
    for item in data.line_items:
        if item.unit_cost is not None:
            estimated_cost += item.unit_cost * item.quantity

    requisition = Requisition(
        requisition_number=req_number,
        unit_id=unit_id,
        requested_by_id=current_user.id,
        status=RequisitionStatus.DRAFT,
        priority=data.priority,
        justification=data.justification,
        delivery_location=data.delivery_location,
        estimated_cost=estimated_cost if estimated_cost > 0 else None,
    )
    db.add(requisition)
    await db.flush()

    # Add line items
    for item_data in data.line_items:
        line_item = RequisitionLineItem(
            requisition_id=requisition.id,
            **item_data.model_dump(),
        )
        db.add(line_item)

    # Record initial status
    history = _record_status_change(
        requisition, None, RequisitionStatus.DRAFT, current_user, "Requisition created"
    )
    db.add(history)

    await db.flush()
    await db.refresh(requisition)

    # Eagerly load line_items for the response
    result = await db.execute(
        select(Requisition)
        .where(Requisition.id == requisition.id)
        .options(selectinload(Requisition.line_items))
    )
    return result.scalar_one()


async def submit_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
    data: RequisitionSubmit,
) -> Requisition:
    """Transition requisition from DRAFT to SUBMITTED."""
    requisition = await get_requisition(db, requisition_id)

    if requisition.status != RequisitionStatus.DRAFT:
        raise BadRequestError(
            f"Cannot submit requisition in '{requisition.status.value}' status. "
            "Must be in DRAFT."
        )

    old_status = requisition.status
    requisition.status = RequisitionStatus.SUBMITTED
    requisition.submitted_at = datetime.now(timezone.utc)
    if data.justification:
        requisition.justification = data.justification

    history = _record_status_change(
        requisition,
        old_status,
        RequisitionStatus.SUBMITTED,
        current_user,
        "Submitted for approval",
    )
    db.add(history)

    await db.flush()
    await db.refresh(requisition)

    result = await db.execute(
        select(Requisition)
        .where(Requisition.id == requisition.id)
        .options(selectinload(Requisition.line_items))
    )
    return result.scalar_one()


async def approve_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
    data: RequisitionApprove,
) -> Requisition:
    """Transition requisition from SUBMITTED to APPROVED (S4/ADMIN only)."""
    requisition = await get_requisition(db, requisition_id)

    if requisition.status != RequisitionStatus.SUBMITTED:
        raise BadRequestError(
            f"Cannot approve requisition in '{requisition.status.value}' status. "
            "Must be in SUBMITTED."
        )

    old_status = requisition.status
    requisition.status = RequisitionStatus.APPROVED
    requisition.approved_at = datetime.now(timezone.utc)

    approval = RequisitionApproval(
        requisition_id=requisition.id,
        approver_id=current_user.id,
        action=ApprovalAction.APPROVE,
        comments=data.comments,
    )
    db.add(approval)

    history = _record_status_change(
        requisition,
        old_status,
        RequisitionStatus.APPROVED,
        current_user,
        data.comments or "Approved",
    )
    db.add(history)

    await db.flush()
    await db.refresh(requisition)

    result = await db.execute(
        select(Requisition)
        .where(Requisition.id == requisition.id)
        .options(selectinload(Requisition.line_items))
    )
    return result.scalar_one()


async def deny_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
    data: RequisitionDeny,
) -> Requisition:
    """Transition requisition from SUBMITTED to DENIED (S4/ADMIN only)."""
    requisition = await get_requisition(db, requisition_id)

    if requisition.status != RequisitionStatus.SUBMITTED:
        raise BadRequestError(
            f"Cannot deny requisition in '{requisition.status.value}' status. "
            "Must be in SUBMITTED."
        )

    old_status = requisition.status
    requisition.status = RequisitionStatus.DENIED

    approval = RequisitionApproval(
        requisition_id=requisition.id,
        approver_id=current_user.id,
        action=ApprovalAction.DENY,
        comments=data.comments,
    )
    db.add(approval)

    history = _record_status_change(
        requisition,
        old_status,
        RequisitionStatus.DENIED,
        current_user,
        data.comments,
    )
    db.add(history)

    await db.flush()
    await db.refresh(requisition)

    result = await db.execute(
        select(Requisition)
        .where(Requisition.id == requisition.id)
        .options(selectinload(Requisition.line_items))
    )
    return result.scalar_one()


async def process_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
) -> Requisition:
    """Transition requisition from APPROVED to SOURCING."""
    requisition = await get_requisition(db, requisition_id)

    if requisition.status != RequisitionStatus.APPROVED:
        raise BadRequestError(
            f"Cannot process requisition in '{requisition.status.value}' status. "
            "Must be in APPROVED."
        )

    old_status = requisition.status
    requisition.status = RequisitionStatus.SOURCING

    history = _record_status_change(
        requisition,
        old_status,
        RequisitionStatus.SOURCING,
        current_user,
        "Sourcing initiated",
    )
    db.add(history)

    await db.flush()
    await db.refresh(requisition)

    result = await db.execute(
        select(Requisition)
        .where(Requisition.id == requisition.id)
        .options(selectinload(Requisition.line_items))
    )
    return result.scalar_one()


async def ship_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
) -> Requisition:
    """Transition requisition from SOURCING to SHIPPED."""
    requisition = await get_requisition(db, requisition_id)

    if requisition.status != RequisitionStatus.SOURCING:
        raise BadRequestError(
            f"Cannot ship requisition in '{requisition.status.value}' status. "
            "Must be in SOURCING."
        )

    old_status = requisition.status
    requisition.status = RequisitionStatus.SHIPPED
    requisition.shipped_at = datetime.now(timezone.utc)

    history = _record_status_change(
        requisition,
        old_status,
        RequisitionStatus.SHIPPED,
        current_user,
        "Shipment dispatched",
    )
    db.add(history)

    await db.flush()
    await db.refresh(requisition)

    result = await db.execute(
        select(Requisition)
        .where(Requisition.id == requisition.id)
        .options(selectinload(Requisition.line_items))
    )
    return result.scalar_one()


async def receive_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
    data: RequisitionReceive,
) -> Requisition:
    """Transition requisition from SHIPPED to RECEIVED."""
    requisition = await get_requisition(db, requisition_id)

    if requisition.status != RequisitionStatus.SHIPPED:
        raise BadRequestError(
            f"Cannot receive requisition in '{requisition.status.value}' status. "
            "Must be in SHIPPED."
        )

    old_status = requisition.status
    requisition.status = RequisitionStatus.RECEIVED
    requisition.received_at = datetime.now(timezone.utc)

    history = _record_status_change(
        requisition,
        old_status,
        RequisitionStatus.RECEIVED,
        current_user,
        data.notes or "Items received",
    )
    db.add(history)

    await db.flush()
    await db.refresh(requisition)

    result = await db.execute(
        select(Requisition)
        .where(Requisition.id == requisition.id)
        .options(selectinload(Requisition.line_items))
    )
    return result.scalar_one()


async def cancel_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
    reason: str,
) -> Requisition:
    """Cancel a requisition from DRAFT, SUBMITTED, or APPROVED status."""
    requisition = await get_requisition(db, requisition_id)

    cancellable = {
        RequisitionStatus.DRAFT,
        RequisitionStatus.SUBMITTED,
        RequisitionStatus.APPROVED,
    }
    if requisition.status not in cancellable:
        raise BadRequestError(
            f"Cannot cancel requisition in '{requisition.status.value}' status. "
            "Must be in DRAFT, SUBMITTED, or APPROVED."
        )

    old_status = requisition.status
    requisition.status = RequisitionStatus.CANCELED
    requisition.canceled_at = datetime.now(timezone.utc)
    requisition.cancel_reason = reason

    history = _record_status_change(
        requisition,
        old_status,
        RequisitionStatus.CANCELED,
        current_user,
        reason,
    )
    db.add(history)

    await db.flush()
    await db.refresh(requisition)

    result = await db.execute(
        select(Requisition)
        .where(Requisition.id == requisition.id)
        .options(selectinload(Requisition.line_items))
    )
    return result.scalar_one()
