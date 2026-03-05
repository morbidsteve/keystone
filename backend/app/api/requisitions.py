"""Requisition workflow API endpoints."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units, require_role
from app.database import get_db
from app.models.requisition import (
    Requisition,
    RequisitionPriority,
    RequisitionStatus,
)
from app.models.user import Role, User
from app.schemas.requisition import (
    RequisitionApprove,
    RequisitionCreate,
    RequisitionDeny,
    RequisitionDetailResponse,
    RequisitionReceive,
    RequisitionResponse,
    RequisitionStatusHistoryResponse,
    RequisitionSubmit,
)
from app.services.requisition_workflow import (
    approve_requisition as svc_approve,
    cancel_requisition as svc_cancel,
    create_requisition as svc_create,
    deny_requisition as svc_deny,
    get_requisition as svc_get,
    process_requisition as svc_process,
    receive_requisition as svc_receive,
    ship_requisition as svc_ship,
    submit_requisition as svc_submit,
)

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S4, Role.S3, Role.OPERATOR]
APPROVAL_ROLES = [Role.ADMIN, Role.S4]


async def _verify_req_access(
    db: AsyncSession, current_user: User, requisition_id: int
) -> Requisition:
    """Fetch requisition and verify unit-level access (H-1 fix)."""
    result = await db.execute(
        select(Requisition).where(Requisition.id == requisition_id)
    )
    req = result.scalar_one_or_none()
    if req is None:
        raise NotFoundError("Requisition", requisition_id)
    accessible = await get_accessible_units(db, current_user)
    if req.unit_id not in accessible:
        raise NotFoundError("Requisition", requisition_id)
    return req


# --- List / Detail ---


@router.get("/", response_model=List[RequisitionResponse])
async def list_requisitions(
    unit_id: Optional[int] = Query(None),
    status: Optional[RequisitionStatus] = Query(None),
    priority: Optional[RequisitionPriority] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List requisitions with filters, scoped to accessible units."""
    accessible = await get_accessible_units(db, current_user)
    query = (
        select(Requisition)
        .where(Requisition.unit_id.in_(accessible))
        .options(selectinload(Requisition.line_items))
    )

    if unit_id and unit_id in accessible:
        query = query.where(Requisition.unit_id == unit_id)
    if status:
        query = query.where(Requisition.status == status)
    if priority:
        query = query.where(Requisition.priority == priority)
    if date_from:
        query = query.where(Requisition.created_at >= date_from)
    if date_to:
        query = query.where(Requisition.created_at <= date_to)

    query = query.order_by(Requisition.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{requisition_id}", response_model=RequisitionDetailResponse)
async def get_requisition_detail(
    requisition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full requisition detail with approvals and status history."""
    requisition = await svc_get(db, requisition_id, with_relations=True)

    accessible = await get_accessible_units(db, current_user)
    if requisition.unit_id not in accessible:
        raise NotFoundError("Requisition", requisition_id)

    return requisition


# --- Create ---


@router.post(
    "/",
    response_model=RequisitionResponse,
    status_code=201,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def create_requisition(
    data: RequisitionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new requisition in DRAFT status."""
    await check_unit_access(current_user, data.unit_id, db)
    return await svc_create(db, current_user, data.unit_id, data)


# --- State transition endpoints ---


@router.put(
    "/{requisition_id}/submit",
    response_model=RequisitionResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def submit_requisition(
    requisition_id: int,
    data: RequisitionSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a DRAFT requisition for approval."""
    req = await _verify_req_access(db, current_user, requisition_id)
    # H-3: only creator or S4/ADMIN can submit
    if current_user.id != req.requested_by_id and current_user.role not in [
        Role.ADMIN,
        Role.S4,
    ]:
        raise NotFoundError("Requisition", requisition_id)
    return await svc_submit(db, current_user, requisition_id, data)


@router.put(
    "/{requisition_id}/approve",
    response_model=RequisitionResponse,
    dependencies=[Depends(require_role(APPROVAL_ROLES))],
)
async def approve_requisition(
    requisition_id: int,
    data: RequisitionApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a SUBMITTED requisition (S4/ADMIN only)."""
    await _verify_req_access(db, current_user, requisition_id)
    return await svc_approve(db, current_user, requisition_id, data)


@router.put(
    "/{requisition_id}/deny",
    response_model=RequisitionResponse,
    dependencies=[Depends(require_role(APPROVAL_ROLES))],
)
async def deny_requisition(
    requisition_id: int,
    data: RequisitionDeny,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deny a SUBMITTED requisition (S4/ADMIN only)."""
    await _verify_req_access(db, current_user, requisition_id)
    return await svc_deny(db, current_user, requisition_id, data)


@router.put(
    "/{requisition_id}/process",
    response_model=RequisitionResponse,
    dependencies=[Depends(require_role(APPROVAL_ROLES))],
)
async def process_requisition(
    requisition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Move an APPROVED requisition to SOURCING."""
    await _verify_req_access(db, current_user, requisition_id)
    return await svc_process(db, current_user, requisition_id)


@router.put(
    "/{requisition_id}/ship",
    response_model=RequisitionResponse,
    dependencies=[Depends(require_role(APPROVAL_ROLES))],
)
async def ship_requisition(
    requisition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a SOURCING requisition as SHIPPED."""
    await _verify_req_access(db, current_user, requisition_id)
    return await svc_ship(db, current_user, requisition_id)


@router.put(
    "/{requisition_id}/receive",
    response_model=RequisitionResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def receive_requisition(
    requisition_id: int,
    data: RequisitionReceive,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a SHIPPED requisition as RECEIVED."""
    await _verify_req_access(db, current_user, requisition_id)
    return await svc_receive(db, current_user, requisition_id, data)


class CancelRequest(BaseModel):
    reason: str = Field(..., min_length=1)


@router.put(
    "/{requisition_id}/cancel",
    response_model=RequisitionResponse,
    dependencies=[Depends(require_role(WRITE_ROLES))],
)
async def cancel_requisition(
    requisition_id: int,
    data: CancelRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a requisition (from DRAFT, SUBMITTED, or APPROVED)."""
    req = await _verify_req_access(db, current_user, requisition_id)
    # H-3: only creator or S4/ADMIN can cancel
    if current_user.id != req.requested_by_id and current_user.role not in [
        Role.ADMIN,
        Role.S4,
    ]:
        raise NotFoundError("Requisition", requisition_id)
    return await svc_cancel(db, current_user, requisition_id, data.reason)


# --- History ---


@router.get(
    "/{requisition_id}/history",
    response_model=List[RequisitionStatusHistoryResponse],
)
async def get_requisition_history(
    requisition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the status change history for a requisition."""
    requisition = await svc_get(db, requisition_id, with_relations=True)

    accessible = await get_accessible_units(db, current_user)
    if requisition.unit_id not in accessible:
        raise NotFoundError("Requisition", requisition_id)

    return requisition.status_history
