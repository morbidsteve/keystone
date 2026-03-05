# KEYSTONE — Requisition & Supply Chain Workflow Module

## Mission

Build a full **requisition lifecycle and supply chain inventory management system** for KEYSTONE (USMC logistics intelligence platform). Marines will use this to request supplies/ammunition, track approval chains, manage inventory across supply points, and maintain audit trails.

This module ties to the existing **SupplyStatusRecord**, **SupplyCatalogItem**, **AmmunitionCatalogItem**, **EquipmentCatalogItem**, and **User/Unit** models. It adds:
- Requisition request workflow (DRAFT → SUBMITTED → APPROVED → SOURCING → SHIPPED → RECEIVED)
- Inventory tracking by location with on-hand, on-order, due-out quantities
- Approval chain with rejection/return capabilities
- Full audit trail (who changed what, when)
- Priority escalation for urgent items (MILSTRIP priority codes 01-03)
- Low-stock alerts tied to reorder points

---

## Tech Stack (Python FastAPI Backend)

- **Framework:** FastAPI 0.95+
- **ORM:** SQLAlchemy 2.0 async (sqlalchemy.ext.asyncio)
- **Database:** PostgreSQL 15+ with async drivers (asyncpg)
- **Datetime:** datetime with timezone-aware UTC (no naive datetimes)
- **Auth:** JWT, existing get_current_user, get_accessible_units patterns
- **Error handling:** Structured exception wrapping with app.core.exceptions

---

## Phase 1: Database Models

### 1.1 Create `backend/app/models/requisition.py`

Full model definitions with all fields, FK relationships, and enums:

```python
"""Requisition workflow models — supply requests, approvals, audit trail."""

import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class RequisitionStatus(str, enum.Enum):
    """MILSTRIP requisition statuses."""
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    SOURCING = "SOURCING"
    BACKORDERED = "BACKORDERED"
    SHIPPED = "SHIPPED"
    RECEIVED = "RECEIVED"
    CANCELED = "CANCELED"


class ApprovalAction(str, enum.Enum):
    """Approval chain actions."""
    APPROVE = "APPROVE"
    DENY = "DENY"
    RETURN = "RETURN"


class RequisitionPriority(str, enum.Enum):
    """MILSTRIP priority codes (01 = highest, 15 = lowest)."""
    ROUTINE = "01"
    URGENT = "02"
    EMERGENCY = "03"
    PRIORITY_04 = "04"
    PRIORITY_05 = "05"
    PRIORITY_06 = "06"
    PRIORITY_07 = "07"
    PRIORITY_08 = "08"
    PRIORITY_09 = "09"
    PRIORITY_10 = "10"
    PRIORITY_11 = "11"
    PRIORITY_12 = "12"
    PRIORITY_13 = "13"
    PRIORITY_14 = "14"
    PRIORITY_15 = "15"


class ConditionCode(str, enum.Enum):
    """Supply condition codes per DODAAC."""
    A = "A"  # New/serviceable
    B = "B"  # Serviceable with repair
    F = "F"  # Reparable
    H = "H"  # Condemned/scrap


class Requisition(Base):
    """Core supply/ammo requisition record."""
    __tablename__ = "requisitions"

    id = Column(Integer, primary_key=True, index=True)

    # Auto-generated, format: R-{unit_abbrev}-{YYYYMMDD}-{seq}
    # Example: R-1-1-BN-20260305-0001
    requisition_number = Column(String(30), unique=True, nullable=False, index=True)

    # Foreign keys and basic info
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    requested_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    approved_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Catalog item linkage (one must be set)
    supply_catalog_item_id = Column(Integer, ForeignKey("supply_catalog.id"), nullable=True)
    ammo_catalog_item_id = Column(Integer, ForeignKey("ammunition_catalog.id"), nullable=True)
    equipment_catalog_item_id = Column(Integer, ForeignKey("equipment_catalog.id"), nullable=True)

    # Item details (captured at request time for audit/off-catalog requests)
    nsn = Column(String(16), nullable=True, index=True)
    dodic = Column(String(6), nullable=True, index=True)
    nomenclature = Column(String(200), nullable=False)

    # Quantities
    quantity_requested = Column(Float, nullable=False)
    quantity_approved = Column(Float, nullable=True)
    quantity_issued = Column(Float, nullable=True)

    # MILSTRIP codes
    unit_of_issue = Column(String(10), nullable=False, default="EA")
    priority = Column(SQLEnum(RequisitionPriority), nullable=False, default=RequisitionPriority.PRIORITY_05)
    advice_code = Column(String(2), nullable=True)  # F=FOB, S=Supply source, etc.
    signal_code = Column(String(2), nullable=True)  # D=Recycle, etc.
    fund_code = Column(String(20), nullable=True)  # Accounting/budgeting code

    # Status
    status = Column(SQLEnum(RequisitionStatus), nullable=False, default=RequisitionStatus.DRAFT, index=True)

    # Justification and denial reason
    justification = Column(Text, nullable=True)
    denial_reason = Column(Text, nullable=True)

    # Document tracking
    document_number = Column(String(50), nullable=True, index=True)  # MILSTRIP doc number

    # Dates
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    shipped_at = Column(DateTime(timezone=True), nullable=True)
    received_at = Column(DateTime(timezone=True), nullable=True)
    estimated_delivery_date = Column(DateTime(timezone=True), nullable=True)
    actual_delivery_date = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    unit = relationship("Unit", foreign_keys=[unit_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id], backref="requisitions_requested")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    supply_catalog_item = relationship("SupplyCatalogItem")
    ammo_catalog_item = relationship("AmmunitionCatalogItem")
    equipment_catalog_item = relationship("EquipmentCatalogItem")
    line_items = relationship("RequisitionLineItem", back_populates="requisition", cascade="all, delete-orphan")
    approvals = relationship("RequisitionApproval", back_populates="requisition", cascade="all, delete-orphan")
    status_history = relationship("RequisitionStatusHistory", back_populates="requisition", cascade="all, delete-orphan")


class RequisitionLineItem(Base):
    """Multi-line requisition support (for bulk requests)."""
    __tablename__ = "requisition_line_items"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey("requisitions.id"), nullable=False, index=True)
    line_number = Column(Integer, nullable=False)  # 1, 2, 3, etc.

    # Catalog linkage
    supply_catalog_item_id = Column(Integer, ForeignKey("supply_catalog.id"), nullable=True)
    ammo_catalog_item_id = Column(Integer, ForeignKey("ammunition_catalog.id"), nullable=True)

    # Item details
    nsn = Column(String(16), nullable=True)
    dodic = Column(String(6), nullable=True)
    nomenclature = Column(String(200), nullable=False)

    # Quantities and tracking
    quantity_requested = Column(Float, nullable=False)
    quantity_approved = Column(Float, nullable=True)
    quantity_issued = Column(Float, nullable=True)
    unit_of_issue = Column(String(10), nullable=False, default="EA")

    # Status per line
    status = Column(SQLEnum(RequisitionStatus), nullable=False, default=RequisitionStatus.DRAFT)

    # Relationships
    requisition = relationship("Requisition", back_populates="line_items")


class RequisitionApproval(Base):
    """Approval chain tracking — who approved/denied/returned and why."""
    __tablename__ = "requisition_approvals"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey("requisitions.id"), nullable=False, index=True)
    approver_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Action taken
    action = Column(SQLEnum(ApprovalAction), nullable=False)

    # Approver notes
    comments = Column(Text, nullable=True)

    # Timestamp
    action_date = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    requisition = relationship("Requisition", back_populates="approvals")
    approver = relationship("User", backref="requisition_approvals")


class RequisitionStatusHistory(Base):
    """Full audit trail of status changes."""
    __tablename__ = "requisition_status_history"

    id = Column(Integer, primary_key=True, index=True)
    requisition_id = Column(Integer, ForeignKey("requisitions.id"), nullable=False, index=True)

    # Status transition
    old_status = Column(SQLEnum(RequisitionStatus), nullable=True)
    new_status = Column(SQLEnum(RequisitionStatus), nullable=False)

    # Who changed it
    changed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # When and why
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(Text, nullable=True)

    # Relationships
    requisition = relationship("Requisition", back_populates="status_history")
    changed_by = relationship("User", backref="requisition_status_changes")
```

---

### 1.2 Create `backend/app/models/inventory.py`

Full inventory tracking models:

```python
"""Inventory management models — physical stock and transaction audit."""

import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class TransactionType(str, enum.Enum):
    """Inventory transaction types."""
    RECEIPT = "RECEIPT"
    ISSUE = "ISSUE"
    TURN_IN = "TURN_IN"
    ADJUSTMENT = "ADJUSTMENT"
    TRANSFER = "TRANSFER"
    LOSS = "LOSS"


class InventoryRecord(Base):
    """Physical inventory at a location (ASP, warehouse, supply point, etc.)."""
    __tablename__ = "inventory_records"

    id = Column(Integer, primary_key=True, index=True)

    # Unit/location
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    location = Column(String(100), nullable=False)  # "ASP-A", "Warehouse-1", "Supply Point Alpha", etc.

    # Catalog linkage
    supply_catalog_item_id = Column(Integer, ForeignKey("supply_catalog.id"), nullable=True, index=True)
    ammo_catalog_item_id = Column(Integer, ForeignKey("ammunition_catalog.id"), nullable=True, index=True)

    # Item details (cached for quick reference)
    nsn = Column(String(16), nullable=True, index=True)
    nomenclature = Column(String(200), nullable=False)
    unit_of_issue = Column(String(10), nullable=False, default="EA")

    # Stock quantities
    quantity_on_hand = Column(Float, nullable=False, default=0.0)
    quantity_on_order = Column(Float, nullable=False, default=0.0)  # Incoming POs/requisitions
    quantity_due_out = Column(Float, nullable=False, default=0.0)  # Approved but not yet shipped

    # Reorder triggers
    reorder_point = Column(Float, nullable=True)  # Min quantity before auto-alert
    reorder_quantity = Column(Float, nullable=True)  # Standard order-up-to level

    # Condition/lot tracking
    lot_number = Column(String(50), nullable=True)
    expiration_date = Column(DateTime(timezone=True), nullable=True)
    condition_code = Column(String(1), nullable=False, default="A")  # A/B/F/H per DODAAC

    # Timestamp
    last_inventory_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    unit = relationship("Unit")
    supply_catalog_item = relationship("SupplyCatalogItem")
    ammo_catalog_item = relationship("AmmunitionCatalogItem")
    transactions = relationship("InventoryTransaction", back_populates="inventory_record", cascade="all, delete-orphan")


class InventoryTransaction(Base):
    """Audit trail of every inventory in/out movement."""
    __tablename__ = "inventory_transactions"

    id = Column(Integer, primary_key=True, index=True)
    inventory_record_id = Column(Integer, ForeignKey("inventory_records.id"), nullable=False, index=True)

    # Transaction details
    transaction_type = Column(SQLEnum(TransactionType), nullable=False, index=True)
    quantity = Column(Float, nullable=False)  # Positive=in, negative=out (or always show type)

    # Linkage to requisition (if applicable)
    requisition_id = Column(Integer, ForeignKey("requisitions.id"), nullable=True, index=True)

    # Who/when
    performed_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())

    # Document reference
    document_number = Column(String(50), nullable=True)  # PO number, REQ number, etc.

    # Notes
    notes = Column(Text, nullable=True)

    # Relationships
    inventory_record = relationship("InventoryRecord", back_populates="transactions")
    requisition = relationship("Requisition")
    performed_by = relationship("User", backref="inventory_transactions")
```

---

## Phase 2: Schemas (Pydantic)

### 2.1 Create `backend/app/schemas/requisition.py`

```python
"""Request/response schemas for requisitions."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.requisition import (
    ApprovalAction,
    RequisitionPriority,
    RequisitionStatus,
)


class RequisitionCreate(BaseModel):
    """Create a new requisition (DRAFT)."""
    supply_catalog_item_id: Optional[int] = None
    ammo_catalog_item_id: Optional[int] = None
    equipment_catalog_item_id: Optional[int] = None
    nsn: Optional[str] = None
    dodic: Optional[str] = None
    nomenclature: str = Field(..., min_length=1, max_length=200)
    quantity_requested: float = Field(..., gt=0)
    unit_of_issue: str = Field(default="EA", max_length=10)
    priority: RequisitionPriority = Field(default=RequisitionPriority.PRIORITY_05)
    justification: Optional[str] = None
    advice_code: Optional[str] = None
    signal_code: Optional[str] = None
    fund_code: Optional[str] = None


class RequisitionSubmit(BaseModel):
    """Submit a requisition (DRAFT → SUBMITTED)."""
    justification: Optional[str] = None


class RequisitionApprove(BaseModel):
    """Approve a requisition (SUBMITTED → APPROVED)."""
    quantity_approved: float = Field(..., gt=0)
    estimated_delivery_date: Optional[datetime] = None


class RequisitionDeny(BaseModel):
    """Deny a requisition (SUBMITTED → DENIED)."""
    denial_reason: str = Field(..., min_length=1)


class RequisitionReceive(BaseModel):
    """Receive/close a requisition (SHIPPED → RECEIVED)."""
    quantity_issued: float = Field(..., ge=0)
    actual_delivery_date: Optional[datetime] = None


class RequisitionApprovalResponse(BaseModel):
    """Approval record in response."""
    id: int
    approver_id: int
    action: ApprovalAction
    comments: Optional[str]
    action_date: datetime

    class Config:
        from_attributes = True


class RequisitionStatusHistoryResponse(BaseModel):
    """Status history entry in response."""
    id: int
    old_status: Optional[RequisitionStatus]
    new_status: RequisitionStatus
    changed_by_id: int
    changed_at: datetime
    notes: Optional[str]

    class Config:
        from_attributes = True


class RequisitionResponse(BaseModel):
    """Full requisition in response."""
    id: int
    requisition_number: str
    unit_id: int
    requested_by_id: int
    approved_by_id: Optional[int]
    supply_catalog_item_id: Optional[int]
    ammo_catalog_item_id: Optional[int]
    equipment_catalog_item_id: Optional[int]
    nsn: Optional[str]
    dodic: Optional[str]
    nomenclature: str
    quantity_requested: float
    quantity_approved: Optional[float]
    quantity_issued: Optional[float]
    unit_of_issue: str
    priority: RequisitionPriority
    advice_code: Optional[str]
    signal_code: Optional[str]
    fund_code: Optional[str]
    status: RequisitionStatus
    justification: Optional[str]
    denial_reason: Optional[str]
    document_number: Optional[str]
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    approved_at: Optional[datetime]
    shipped_at: Optional[datetime]
    received_at: Optional[datetime]
    estimated_delivery_date: Optional[datetime]
    actual_delivery_date: Optional[datetime]
    approvals: List[RequisitionApprovalResponse] = []
    status_history: List[RequisitionStatusHistoryResponse] = []

    class Config:
        from_attributes = True


class RequisitionListResponse(BaseModel):
    """Abbreviated requisition for list views."""
    id: int
    requisition_number: str
    unit_id: int
    nomenclature: str
    quantity_requested: float
    quantity_approved: Optional[float]
    priority: RequisitionPriority
    status: RequisitionStatus
    created_at: datetime
    submitted_at: Optional[datetime]
    approved_at: Optional[datetime]

    class Config:
        from_attributes = True
```

### 2.2 Create `backend/app/schemas/inventory.py`

```python
"""Request/response schemas for inventory."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.inventory import TransactionType


class InventoryRecordResponse(BaseModel):
    """Inventory record view."""
    id: int
    unit_id: int
    location: str
    nsn: Optional[str]
    nomenclature: str
    unit_of_issue: str
    quantity_on_hand: float
    quantity_on_order: float
    quantity_due_out: float
    reorder_point: Optional[float]
    reorder_quantity: Optional[float]
    lot_number: Optional[str]
    expiration_date: Optional[datetime]
    condition_code: str
    last_inventory_date: datetime

    class Config:
        from_attributes = True


class InventoryTransactionCreate(BaseModel):
    """Record an inventory transaction."""
    inventory_record_id: int
    transaction_type: TransactionType
    quantity: float = Field(...)  # Can be positive or negative
    requisition_id: Optional[int] = None
    document_number: Optional[str] = None
    notes: Optional[str] = None


class InventoryTransactionResponse(BaseModel):
    """Inventory transaction in response."""
    id: int
    inventory_record_id: int
    transaction_type: TransactionType
    quantity: float
    requisition_id: Optional[int]
    performed_by_id: int
    transaction_date: datetime
    document_number: Optional[str]
    notes: Optional[str]

    class Config:
        from_attributes = True


class LowStockAlert(BaseModel):
    """Low-stock alert for items below reorder point."""
    inventory_record_id: int
    unit_id: int
    location: str
    nomenclature: str
    quantity_on_hand: float
    reorder_point: float
    quantity_below: float
    last_inventory_date: datetime
```

---

## Phase 3: Requisition Workflow Service

### 3.1 Create `backend/app/services/requisition_workflow.py`

```python
"""Requisition workflow orchestration service."""

import logging
from datetime import datetime, timezone
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, ForbiddenError, NotFoundError
from app.models.requisition import (
    ApprovalAction,
    Requisition,
    RequisitionApproval,
    RequisitionStatus,
    RequisitionStatusHistory,
)
from app.models.user import Role, User
from app.schemas.requisition import (
    RequisitionApprove,
    RequisitionCreate,
    RequisitionDeny,
    RequisitionReceive,
    RequisitionSubmit,
)

logger = logging.getLogger(__name__)


async def generate_requisition_number(
    db: AsyncSession, unit_id: int
) -> str:
    """Auto-generate requisition number: R-{unit_abbrev}-{YYYYMMDD}-{seq}."""
    # Get unit abbreviation
    from app.models.unit import Unit
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        raise NotFoundError("Unit", unit_id)

    unit_abbrev = unit.abbreviation or str(unit_id)
    today = datetime.now(timezone.utc).strftime("%Y%m%d")

    # Count existing today
    result = await db.execute(
        select(func.count(Requisition.id)).where(
            Requisition.unit_id == unit_id,
            Requisition.requisition_number.startswith(f"R-{unit_abbrev}-{today}")
        )
    )
    count = result.scalar() or 0
    seq = str(count + 1).zfill(4)

    return f"R-{unit_abbrev}-{today}-{seq}"


async def create_requisition(
    db: AsyncSession,
    current_user: User,
    unit_id: int,
    data: RequisitionCreate,
) -> Requisition:
    """Create a new requisition in DRAFT status."""
    from app.core.permissions import check_unit_access

    # Verify user can create for this unit
    await check_unit_access(current_user, unit_id, db)

    # Must specify at least one catalog item OR nsn/dodic
    if not any([
        data.supply_catalog_item_id,
        data.ammo_catalog_item_id,
        data.equipment_catalog_item_id,
        data.nsn,
        data.dodic,
    ]):
        raise BadRequestError(
            "Requisition must specify either a catalog item or NSN/DODIC"
        )

    # Generate requisition number
    req_number = await generate_requisition_number(db, unit_id)

    # Create requisition
    req = Requisition(
        requisition_number=req_number,
        unit_id=unit_id,
        requested_by_id=current_user.id,
        supply_catalog_item_id=data.supply_catalog_item_id,
        ammo_catalog_item_id=data.ammo_catalog_item_id,
        equipment_catalog_item_id=data.equipment_catalog_item_id,
        nsn=data.nsn,
        dodic=data.dodic,
        nomenclature=data.nomenclature,
        quantity_requested=data.quantity_requested,
        unit_of_issue=data.unit_of_issue,
        priority=data.priority,
        justification=data.justification,
        advice_code=data.advice_code,
        signal_code=data.signal_code,
        fund_code=data.fund_code,
        status=RequisitionStatus.DRAFT,
    )

    db.add(req)
    await db.flush()

    logger.info(
        f"Created requisition {req_number} for unit {unit_id} by user {current_user.id}"
    )

    return req


async def submit_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
    data: RequisitionSubmit,
) -> Requisition:
    """Submit a requisition: DRAFT → SUBMITTED."""
    from app.core.permissions import check_unit_access

    req = await get_requisition(db, requisition_id)

    # Must be in DRAFT
    if req.status != RequisitionStatus.DRAFT:
        raise BadRequestError(
            f"Cannot submit requisition in {req.status} status. Must be DRAFT."
        )

    # User must be requestor or S4/Admin
    if (
        current_user.id != req.requested_by_id
        and current_user.role not in [Role.S4, Role.ADMIN]
    ):
        raise ForbiddenError("Only the requestor or S4/Admin can submit")

    await check_unit_access(current_user, req.unit_id, db)

    # Update justification if provided
    if data.justification:
        req.justification = data.justification

    # Transition status
    req.status = RequisitionStatus.SUBMITTED
    req.submitted_at = datetime.now(timezone.utc)

    # Record status history
    history = RequisitionStatusHistory(
        requisition_id=req.id,
        old_status=RequisitionStatus.DRAFT,
        new_status=RequisitionStatus.SUBMITTED,
        changed_by_id=current_user.id,
        notes="Submitted for approval",
    )
    db.add(history)

    logger.info(
        f"Submitted requisition {req.requisition_number} by user {current_user.id}"
    )

    return req


async def approve_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
    data: RequisitionApprove,
) -> Requisition:
    """Approve a requisition: SUBMITTED → APPROVED."""
    from app.core.permissions import check_unit_access

    req = await get_requisition(db, requisition_id)

    # Must be in SUBMITTED
    if req.status != RequisitionStatus.SUBMITTED:
        raise BadRequestError(
            f"Cannot approve requisition in {req.status} status. Must be SUBMITTED."
        )

    # User must be S4 or higher
    if current_user.role not in [Role.S4, Role.ADMIN]:
        raise ForbiddenError("Only S4 or Admin can approve requisitions")

    await check_unit_access(current_user, req.unit_id, db)

    # Validate approved quantity
    if data.quantity_approved <= 0 or data.quantity_approved > req.quantity_requested:
        raise BadRequestError(
            "Approved quantity must be > 0 and <= requested quantity"
        )

    # Update requisition
    req.status = RequisitionStatus.APPROVED
    req.quantity_approved = data.quantity_approved
    req.approved_by_id = current_user.id
    req.approved_at = datetime.now(timezone.utc)
    req.estimated_delivery_date = data.estimated_delivery_date

    # Record approval
    approval = RequisitionApproval(
        requisition_id=req.id,
        approver_id=current_user.id,
        action=ApprovalAction.APPROVE,
        comments=None,
    )
    db.add(approval)

    # Record status history
    history = RequisitionStatusHistory(
        requisition_id=req.id,
        old_status=RequisitionStatus.SUBMITTED,
        new_status=RequisitionStatus.APPROVED,
        changed_by_id=current_user.id,
        notes=f"Approved for {data.quantity_approved} units",
    )
    db.add(history)

    logger.info(
        f"Approved requisition {req.requisition_number} for {data.quantity_approved} units"
    )

    return req


async def deny_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
    data: RequisitionDeny,
) -> Requisition:
    """Deny a requisition: SUBMITTED → DENIED."""
    from app.core.permissions import check_unit_access

    req = await get_requisition(db, requisition_id)

    # Must be in SUBMITTED
    if req.status != RequisitionStatus.SUBMITTED:
        raise BadRequestError(
            f"Cannot deny requisition in {req.status} status. Must be SUBMITTED."
        )

    # User must be S4 or higher
    if current_user.role not in [Role.S4, Role.ADMIN]:
        raise ForbiddenError("Only S4 or Admin can deny requisitions")

    await check_unit_access(current_user, req.unit_id, db)

    # Update requisition
    req.status = RequisitionStatus.DENIED
    req.denial_reason = data.denial_reason

    # Record approval
    approval = RequisitionApproval(
        requisition_id=req.id,
        approver_id=current_user.id,
        action=ApprovalAction.DENY,
        comments=data.denial_reason,
    )
    db.add(approval)

    # Record status history
    history = RequisitionStatusHistory(
        requisition_id=req.id,
        old_status=RequisitionStatus.SUBMITTED,
        new_status=RequisitionStatus.DENIED,
        changed_by_id=current_user.id,
        notes=f"Denied: {data.denial_reason}",
    )
    db.add(history)

    logger.info(
        f"Denied requisition {req.requisition_number}: {data.denial_reason}"
    )

    return req


async def process_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
) -> Requisition:
    """Process an approved requisition: APPROVED → SOURCING."""
    req = await get_requisition(db, requisition_id)

    # Must be in APPROVED
    if req.status != RequisitionStatus.APPROVED:
        raise BadRequestError(
            f"Cannot process requisition in {req.status} status. Must be APPROVED."
        )

    # Check inventory availability (optional; can backorder if needed)
    # For now, just move to SOURCING

    req.status = RequisitionStatus.SOURCING

    history = RequisitionStatusHistory(
        requisition_id=req.id,
        old_status=RequisitionStatus.APPROVED,
        new_status=RequisitionStatus.SOURCING,
        changed_by_id=current_user.id,
        notes="Processing for shipment",
    )
    db.add(history)

    logger.info(f"Processed requisition {req.requisition_number} for sourcing")

    return req


async def ship_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
) -> Requisition:
    """Ship an approved requisition: SOURCING → SHIPPED."""
    from app.core.permissions import check_unit_access

    req = await get_requisition(db, requisition_id)

    # Must be in SOURCING
    if req.status != RequisitionStatus.SOURCING:
        raise BadRequestError(
            f"Cannot ship requisition in {req.status} status. Must be SOURCING."
        )

    await check_unit_access(current_user, req.unit_id, db)

    req.status = RequisitionStatus.SHIPPED
    req.shipped_at = datetime.now(timezone.utc)

    history = RequisitionStatusHistory(
        requisition_id=req.id,
        old_status=RequisitionStatus.SOURCING,
        new_status=RequisitionStatus.SHIPPED,
        changed_by_id=current_user.id,
        notes="Shipped to unit",
    )
    db.add(history)

    logger.info(f"Shipped requisition {req.requisition_number}")

    return req


async def receive_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
    data: RequisitionReceive,
) -> Requisition:
    """Receive a requisition and close it: SHIPPED → RECEIVED."""
    from app.core.permissions import check_unit_access

    req = await get_requisition(db, requisition_id)

    # Must be in SHIPPED
    if req.status != RequisitionStatus.SHIPPED:
        raise BadRequestError(
            f"Cannot receive requisition in {req.status} status. Must be SHIPPED."
        )

    await check_unit_access(current_user, req.unit_id, db)

    # Validate received quantity
    if data.quantity_issued > (req.quantity_approved or req.quantity_requested):
        raise BadRequestError(
            "Received quantity cannot exceed approved quantity"
        )

    req.status = RequisitionStatus.RECEIVED
    req.quantity_issued = data.quantity_issued
    req.received_at = datetime.now(timezone.utc)
    if data.actual_delivery_date:
        req.actual_delivery_date = data.actual_delivery_date

    history = RequisitionStatusHistory(
        requisition_id=req.id,
        old_status=RequisitionStatus.SHIPPED,
        new_status=RequisitionStatus.RECEIVED,
        changed_by_id=current_user.id,
        notes=f"Received {data.quantity_issued} units",
    )
    db.add(history)

    logger.info(
        f"Closed requisition {req.requisition_number} with {data.quantity_issued} units received"
    )

    return req


async def cancel_requisition(
    db: AsyncSession,
    current_user: User,
    requisition_id: int,
    reason: Optional[str] = None,
) -> Requisition:
    """Cancel a requisition."""
    req = await get_requisition(db, requisition_id)

    # Can cancel if DRAFT, SUBMITTED, or APPROVED
    if req.status not in [
        RequisitionStatus.DRAFT,
        RequisitionStatus.SUBMITTED,
        RequisitionStatus.APPROVED,
    ]:
        raise BadRequestError(
            f"Cannot cancel requisition in {req.status} status"
        )

    old_status = req.status
    req.status = RequisitionStatus.CANCELED

    history = RequisitionStatusHistory(
        requisition_id=req.id,
        old_status=old_status,
        new_status=RequisitionStatus.CANCELED,
        changed_by_id=current_user.id,
        notes=reason or "Canceled by user",
    )
    db.add(history)

    logger.info(
        f"Canceled requisition {req.requisition_number}: {reason or 'no reason given'}"
    )

    return req


async def get_requisition(db: AsyncSession, requisition_id: int) -> Requisition:
    """Fetch a requisition by ID."""
    result = await db.execute(
        select(Requisition).where(Requisition.id == requisition_id)
    )
    req = result.scalar_one_or_none()
    if not req:
        raise NotFoundError("Requisition", requisition_id)
    return req
```

---

## Phase 4: Inventory Service

### 4.1 Create `backend/app/services/inventory_service.py`

```python
"""Inventory management service."""

import logging
from datetime import datetime, timezone
from typing import List

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.inventory import (
    InventoryRecord,
    InventoryTransaction,
    TransactionType,
)
from app.models.user import User
from app.schemas.inventory import (
    InventoryTransactionCreate,
    LowStockAlert,
)

logger = logging.getLogger(__name__)


async def get_or_create_inventory(
    db: AsyncSession,
    unit_id: int,
    location: str,
    nsn: str,
    nomenclature: str,
    unit_of_issue: str = "EA",
) -> InventoryRecord:
    """Get or create an inventory record."""
    result = await db.execute(
        select(InventoryRecord).where(
            and_(
                InventoryRecord.unit_id == unit_id,
                InventoryRecord.location == location,
                InventoryRecord.nsn == nsn,
            )
        )
    )
    inv = result.scalar_one_or_none()

    if not inv:
        inv = InventoryRecord(
            unit_id=unit_id,
            location=location,
            nsn=nsn,
            nomenclature=nomenclature,
            unit_of_issue=unit_of_issue,
            quantity_on_hand=0.0,
            quantity_on_order=0.0,
            quantity_due_out=0.0,
        )
        db.add(inv)
        await db.flush()

    return inv


async def record_transaction(
    db: AsyncSession,
    current_user: User,
    data: InventoryTransactionCreate,
) -> InventoryTransaction:
    """Record an inventory transaction (RECEIPT, ISSUE, etc.)."""
    # Get inventory record
    result = await db.execute(
        select(InventoryRecord).where(InventoryRecord.id == data.inventory_record_id)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise NotFoundError("InventoryRecord", data.inventory_record_id)

    # Create transaction
    txn = InventoryTransaction(
        inventory_record_id=inv.id,
        transaction_type=data.transaction_type,
        quantity=data.quantity,
        requisition_id=data.requisition_id,
        performed_by_id=current_user.id,
        document_number=data.document_number,
        notes=data.notes,
    )
    db.add(txn)

    # Update inventory quantities based on transaction type
    if data.transaction_type == TransactionType.RECEIPT:
        inv.quantity_on_hand += data.quantity
    elif data.transaction_type == TransactionType.ISSUE:
        inv.quantity_on_hand -= data.quantity
    elif data.transaction_type == TransactionType.TURN_IN:
        inv.quantity_on_hand += data.quantity
    elif data.transaction_type == TransactionType.TRANSFER:
        inv.quantity_on_hand -= data.quantity
    elif data.transaction_type == TransactionType.LOSS:
        inv.quantity_on_hand -= abs(data.quantity)
    elif data.transaction_type == TransactionType.ADJUSTMENT:
        inv.quantity_on_hand += data.quantity

    inv.last_inventory_date = datetime.now(timezone.utc)

    logger.info(
        f"Recorded {data.transaction_type.value} of {data.quantity} units "
        f"for inventory {inv.id} by user {current_user.id}"
    )

    return txn


async def get_low_stock_items(
    db: AsyncSession,
    unit_id: int,
) -> List[LowStockAlert]:
    """Get items below reorder point."""
    result = await db.execute(
        select(InventoryRecord).where(
            and_(
                InventoryRecord.unit_id == unit_id,
                InventoryRecord.reorder_point.isnot(None),
                InventoryRecord.quantity_on_hand < InventoryRecord.reorder_point,
            )
        )
    )
    records = result.scalars().all()

    alerts = [
        LowStockAlert(
            inventory_record_id=inv.id,
            unit_id=inv.unit_id,
            location=inv.location,
            nomenclature=inv.nomenclature,
            quantity_on_hand=inv.quantity_on_hand,
            reorder_point=inv.reorder_point,
            quantity_below=inv.reorder_point - inv.quantity_on_hand,
            last_inventory_date=inv.last_inventory_date,
        )
        for inv in records
    ]

    return sorted(
        alerts, key=lambda a: a.quantity_below, reverse=True
    )  # Worst first


async def get_inventory_by_unit(
    db: AsyncSession, unit_id: int
) -> List[InventoryRecord]:
    """Get all inventory records for a unit."""
    result = await db.execute(
        select(InventoryRecord).where(InventoryRecord.unit_id == unit_id)
    )
    return result.scalars().all()
```

---

## Phase 5: API Endpoints

### 5.1 Create `backend/app/api/requisitions.py`

```python
"""Requisition CRUD and workflow endpoints."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units
from app.database import get_db
from app.models.requisition import Requisition, RequisitionStatus
from app.models.user import User
from app.schemas.requisition import (
    RequisitionApprove,
    RequisitionCreate,
    RequisitionDeny,
    RequisitionListResponse,
    RequisitionReceive,
    RequisitionResponse,
    RequisitionSubmit,
)
from app.services.requisition_workflow import (
    approve_requisition,
    cancel_requisition,
    create_requisition,
    deny_requisition,
    get_requisition,
    process_requisition,
    receive_requisition,
    ship_requisition,
    submit_requisition,
)

router = APIRouter()


@router.get("/", response_model=List[RequisitionListResponse])
async def list_requisitions(
    unit_id: Optional[int] = Query(None),
    status: Optional[RequisitionStatus] = Query(None),
    priority: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List requisitions with filters."""
    accessible = await get_accessible_units(db, current_user)

    query = select(Requisition).where(Requisition.unit_id.in_(accessible))

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

    query = (
        query.order_by(Requisition.created_at.desc())
        .offset(offset)
        .limit(limit)
    )

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{requisition_id}", response_model=RequisitionResponse)
async def get_requisition_detail(
    requisition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get full requisition detail with history."""
    req = await get_requisition(db, requisition_id)
    await check_unit_access(current_user, req.unit_id, db)
    return req


@router.post("/", response_model=RequisitionResponse, status_code=status.HTTP_201_CREATED)
async def create_new_requisition(
    unit_id: int,
    data: RequisitionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new requisition (DRAFT)."""
    req = await create_requisition(db, current_user, unit_id, data)
    await db.commit()
    await db.refresh(req)
    return req


@router.put("/{requisition_id}/submit", response_model=RequisitionResponse)
async def submit_req(
    requisition_id: int,
    data: RequisitionSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a requisition (DRAFT → SUBMITTED)."""
    req = await submit_requisition(db, current_user, requisition_id, data)
    await db.commit()
    await db.refresh(req)
    return req


@router.put("/{requisition_id}/approve", response_model=RequisitionResponse)
async def approve_req(
    requisition_id: int,
    data: RequisitionApprove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a requisition (SUBMITTED → APPROVED)."""
    req = await approve_requisition(db, current_user, requisition_id, data)
    await db.commit()
    await db.refresh(req)
    return req


@router.put("/{requisition_id}/deny", response_model=RequisitionResponse)
async def deny_req(
    requisition_id: int,
    data: RequisitionDeny,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deny a requisition (SUBMITTED → DENIED)."""
    req = await deny_requisition(db, current_user, requisition_id, data)
    await db.commit()
    await db.refresh(req)
    return req


@router.put("/{requisition_id}/receive", response_model=RequisitionResponse)
async def receive_req(
    requisition_id: int,
    data: RequisitionReceive,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Receive a requisition (SHIPPED → RECEIVED)."""
    req = await receive_requisition(db, current_user, requisition_id, data)
    await db.commit()
    await db.refresh(req)
    return req


@router.put("/{requisition_id}/cancel", response_model=RequisitionResponse)
async def cancel_req(
    requisition_id: int,
    reason: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a requisition."""
    req = await cancel_requisition(db, current_user, requisition_id, reason)
    await db.commit()
    await db.refresh(req)
    return req


@router.get("/{requisition_id}/history")
async def get_requisition_history(
    requisition_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get status history timeline for a requisition."""
    req = await get_requisition(db, requisition_id)
    await check_unit_access(current_user, req.unit_id, db)
    return req.status_history
```

### 5.2 Create `backend/app/api/inventory.py`

```python
"""Inventory management endpoints."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.permissions import get_accessible_units
from app.database import get_db
from app.models.inventory import InventoryRecord
from app.models.user import User
from app.schemas.inventory import (
    InventoryRecordResponse,
    InventoryTransactionCreate,
    InventoryTransactionResponse,
    LowStockAlert,
)
from app.services.inventory_service import (
    get_inventory_by_unit,
    get_low_stock_items,
    record_transaction,
)

router = APIRouter()


@router.get("/", response_model=List[InventoryRecordResponse])
async def list_inventory(
    unit_id: Optional[int] = Query(None),
    location: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List inventory records for accessible units."""
    accessible = await get_accessible_units(db, current_user)

    if unit_id:
        if unit_id not in accessible:
            raise HTTPException(status_code=403, detail="Unit not accessible")
        records = await get_inventory_by_unit(db, unit_id)
    else:
        # Get inventory for all accessible units
        from sqlalchemy import select
        from app.models.inventory import InventoryRecord

        result = await db.execute(
            select(InventoryRecord)
            .where(InventoryRecord.unit_id.in_(accessible))
            .offset(offset)
            .limit(limit)
        )
        records = result.scalars().all()

    if location:
        records = [r for r in records if r.location == location]

    return records


@router.get("/low-stock", response_model=List[LowStockAlert])
async def get_low_stock(
    unit_id: int = Query(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get items below reorder point for a unit."""
    from app.core.permissions import check_unit_access

    await check_unit_access(current_user, unit_id, db)

    alerts = await get_low_stock_items(db, unit_id)
    return alerts


@router.post("/transaction", response_model=InventoryTransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    data: InventoryTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record an inventory transaction."""
    from app.core.permissions import check_unit_access
    from app.models.inventory import InventoryRecord
    from sqlalchemy import select

    # Verify unit access
    result = await db.execute(
        select(InventoryRecord).where(InventoryRecord.id == data.inventory_record_id)
    )
    inv = result.scalar_one_or_none()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    await check_unit_access(current_user, inv.unit_id, db)

    txn = await record_transaction(db, current_user, data)
    await db.commit()
    await db.refresh(txn)
    return txn
```

---

## Phase 6: Frontend Components

### 6.1 Create `frontend/src/pages/RequisitionsPage.tsx`

```typescript
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Filter } from 'lucide-react';
import { RequisitionTable } from '@/components/requisitions/RequisitionTable';
import { RequisitionForm } from '@/components/requisitions/RequisitionForm';
import { ApprovalQueue } from '@/components/requisitions/ApprovalQueue';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import type { RequisitionStatus } from '@/lib/types';

export default function RequisitionsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<RequisitionStatus | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Requisitions</h1>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
          variant="primary"
        >
          <Plus className="w-4 h-4" />
          New Requisition
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-lg">
        <Filter className="w-4 h-4 text-gray-600" />
        <select
          value={statusFilter || ''}
          onChange={(e) => setStatusFilter(e.target.value as RequisitionStatus || null)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="APPROVED">Approved</option>
          <option value="DENIED">Denied</option>
          <option value="SHIPPING">Shipping</option>
          <option value="RECEIVED">Received</option>
        </select>
        <select
          value={priorityFilter || ''}
          onChange={(e) => setPriorityFilter(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="">All Priorities</option>
          <option value="01">Routine</option>
          <option value="02">Urgent</option>
          <option value="03">Emergency</option>
        </select>
      </div>

      {/* Main content: tabs for different views */}
      <div className="grid grid-cols-12 gap-6">
        {/* Requisition list/table */}
        <div className="col-span-9">
          <RequisitionTable statusFilter={statusFilter} priorityFilter={priorityFilter} />
        </div>

        {/* Approval queue sidebar */}
        <div className="col-span-3">
          <ApprovalQueue />
        </div>
      </div>

      {/* Create modal */}
      <Modal
        isOpen={showCreateForm}
        onClose={() => setShowCreateForm(false)}
        title="New Requisition"
        size="lg"
      >
        <RequisitionForm onSuccess={() => setShowCreateForm(false)} />
      </Modal>
    </div>
  );
}
```

### 6.2 Create `frontend/src/components/requisitions/RequisitionTable.tsx`

```typescript
import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpDown, Eye } from 'lucide-react';
import { getRequisitions } from '@/api/requisitions';
import type { Requisition, RequisitionStatus } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

interface RequisitionTableProps {
  statusFilter?: RequisitionStatus | null;
  priorityFilter?: string | null;
}

const columnHelper = createColumnHelper<Requisition>();

export function RequisitionTable({ statusFilter, priorityFilter }: RequisitionTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: requisitions = [], isLoading } = useQuery({
    queryKey: ['requisitions', statusFilter, priorityFilter],
    queryFn: () =>
      getRequisitions({ status: statusFilter, priority: priorityFilter }),
  });

  const tableData = useMemo(() => {
    let filtered = requisitions;
    if (statusFilter) {
      filtered = filtered.filter((r) => r.status === statusFilter);
    }
    if (priorityFilter) {
      filtered = filtered.filter((r) => r.priority === priorityFilter);
    }
    return filtered;
  }, [requisitions, statusFilter, priorityFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('requisition_number', {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting()}
            className="flex items-center gap-2"
          >
            REQ #
            <ArrowUpDown className="w-4 h-4" />
          </button>
        ),
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('nomenclature', {
        header: 'Item',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('quantity_requested', {
        header: 'Qty Req',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('quantity_approved', {
        header: 'Qty App',
        cell: (info) => info.getValue() || '-',
      }),
      columnHelper.accessor('priority', {
        header: 'Priority',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('status', {
        header: 'Status',
        cell: (info) => <StatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('created_at', {
        header: 'Created',
        cell: (info) => new Date(info.getValue()).toLocaleDateString(),
      }),
      columnHelper.display({
        id: 'actions',
        cell: (info) => (
          <button
            onClick={() => setSelectedId(info.row.original.id)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
    },
    onSortingChange: setSorting,
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gray-50 border-b">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedId(row.original.id)}
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-6 py-4 text-sm text-gray-900"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {selectedId && (
        <RequisitionDetail
          requisitionId={selectedId}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
```

### 6.3 Create `frontend/src/components/requisitions/RequisitionForm.tsx`

```typescript
import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { createRequisition } from '@/api/requisitions';
import { getSupplyItems } from '@/api/supply';
import { Button } from '@/components/ui/Button';
import { SupplySelector } from '@/components/catalog/SupplySelector';
import type { Requisition } from '@/lib/types';

interface RequisitionFormProps {
  onSuccess?: (requisition: Requisition) => void;
}

export function RequisitionForm({ onSuccess }: RequisitionFormProps) {
  const [unitId, setUnitId] = useState<number | null>(null);
  const [catalogItemId, setCatalogItemId] = useState<number | null>(null);
  const [nomenclature, setNomenclature] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priority, setPriority] = useState('05');
  const [justification, setJustification] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) =>
      createRequisition(unitId!, {
        supply_catalog_item_id: catalogItemId,
        nomenclature,
        quantity_requested: parseFloat(quantity),
        priority,
        justification,
      }),
    onSuccess: (data) => {
      if (onSuccess) onSuccess(data);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Unit</label>
        <select
          value={unitId || ''}
          onChange={(e) => setUnitId(parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        >
          <option value="">Select Unit</option>
          {/* Populate from units API */}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Supply Item
        </label>
        <SupplySelector
          onSelect={(item) => {
            setCatalogItemId(item.id);
            setNomenclature(item.nomenclature);
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Quantity
        </label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
          min="1"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="01">Routine</option>
          <option value="02">Urgent</option>
          <option value="03">Emergency</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Justification
        </label>
        <textarea
          value={justification}
          onChange={(e) => setJustification(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={4}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Creating...' : 'Create Requisition'}
        </Button>
      </div>
    </form>
  );
}
```

### 6.4 Create `frontend/src/components/requisitions/ApprovalQueue.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { getRequisitions } from '@/api/requisitions';
import { RequisitionStatus } from '@/lib/types';
import StatusBadge from '@/components/ui/StatusBadge';

export function ApprovalQueue() {
  const { data: pendingRequisitions = [] } = useQuery({
    queryKey: ['requisitions', 'pending'],
    queryFn: () => getRequisitions({ status: RequisitionStatus.SUBMITTED }),
    refetchInterval: 30000, // Poll every 30s
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Pending Approvals
      </h2>
      <div className="space-y-3">
        {pendingRequisitions.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending approvals</p>
        ) : (
          pendingRequisitions.map((req) => (
            <div
              key={req.id}
              className="border border-gray-200 rounded p-3 hover:bg-gray-50 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {req.requisition_number}
                  </p>
                  <p className="text-xs text-gray-600">{req.nomenclature}</p>
                  <p className="text-xs text-gray-500">
                    Qty: {req.quantity_requested}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

---

## Phase 7: Integration Points

### 7.1 Update `backend/app/main.py` to register routers

```python
from app.api import requisitions, inventory

app.include_router(requisitions.router, prefix="/api/v1/requisitions", tags=["requisitions"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])
```

### 7.2 Update `frontend/src/lib/types.ts` to include Requisition types

```typescript
export type RequisitionStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'DENIED'
  | 'SOURCING'
  | 'BACKORDERED'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'CANCELED';

export interface Requisition {
  id: number;
  requisition_number: string;
  unit_id: number;
  requested_by_id: number;
  approved_by_id: number | null;
  supply_catalog_item_id: number | null;
  ammo_catalog_item_id: number | null;
  equipment_catalog_item_id: number | null;
  nsn: string | null;
  dodic: string | null;
  nomenclature: string;
  quantity_requested: number;
  quantity_approved: number | null;
  quantity_issued: number | null;
  unit_of_issue: string;
  priority: string;
  status: RequisitionStatus;
  justification: string | null;
  denial_reason: string | null;
  document_number: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  shipped_at: string | null;
  received_at: string | null;
  estimated_delivery_date: string | null;
  actual_delivery_date: string | null;
}

export interface InventoryRecord {
  id: number;
  unit_id: number;
  location: string;
  nsn: string | null;
  nomenclature: string;
  unit_of_issue: string;
  quantity_on_hand: number;
  quantity_on_order: number;
  quantity_due_out: number;
  reorder_point: number | null;
  reorder_quantity: number | null;
  lot_number: string | null;
  expiration_date: string | null;
  condition_code: string;
  last_inventory_date: string;
}
```

---

## Quality Gates

**Before shipping, verify:**

1. **Models created & migrated:**
   - `backend/app/models/requisition.py` (all enums + 4 models)
   - `backend/app/models/inventory.py` (2 models)
   - Alembic migration runs cleanly

2. **Services implemented:**
   - `backend/app/services/requisition_workflow.py` (7+ functions)
   - `backend/app/services/inventory_service.py` (3+ functions)

3. **API endpoints pass:**
   - POST /api/v1/requisitions → 201, generates number
   - PUT /api/v1/requisitions/{id}/submit → 200
   - PUT /api/v1/requisitions/{id}/approve → 200
   - GET /api/v1/requisitions?status=SUBMITTED → list filtered
   - GET /api/v1/inventory/low-stock?unit_id=1 → low-stock alerts
   - POST /api/v1/inventory/transaction → 201, updates quantity

4. **Frontend pages load:**
   - /requisitions page renders
   - RequisitionTable shows demo data
   - RequisitionForm can be opened
   - ApprovalQueue shows pending

5. **Tests pass:**
   - Backend: `pytest backend/tests/test_requisitions.py -v`
   - Frontend: `npm run test` (no errors)

6. **No security issues:**
   - RBAC enforced (only S4/Admin can approve)
   - Unit access checks on all endpoints
   - No credential leaks in logs

---

## Implementation Notes

- **MILSTRIP compliance:** Requisition number format, priority codes (01-15), advice/signal codes are per DODIC
- **Audit trail:** Every status change logged with user + timestamp
- **Extensibility:** InventoryRecord supports multiple catalog types; RequisitionLineItem for bulk orders
- **Scale:** Indexes on unit_id, status, priority, nsn for fast queries
- **Real-time:** ApprovalQueue polls every 30s; can upgrade to WebSocket later
- **Offline:** Forms save to localStorage if connection lost
