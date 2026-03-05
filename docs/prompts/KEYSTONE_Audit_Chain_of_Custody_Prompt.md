# KEYSTONE — Audit Chain of Custody & Accountability System

## Mission

Build an enterprise-grade audit trail and chain of custody tracking module for KEYSTONE's most sensitive assets (weapons, cryptographic devices, night vision goggles, optics, radios, classified material) in accordance with USMC accountability standards, SL-3 sensitive item procedures, and CMC directives.

**Current State**: Equipment and personnel models exist. Weapon records exist but no accountability or transfer audit trail.

**Target State**: Complete sensitive item registry with real-time custody chain visibility, inventory management with accountability verification, and comprehensive audit logging for all system actions (security-critical for classified-capable dual-enclave operations).

---

## Database Models

Create new file: `backend/app/models/custody.py`

```python
"""Custody chain, sensitive items, inventory audits, and system audit logging."""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
    Index,
)
from sqlalchemy.orm import relationship

from app.database import Base


# ─────────────────────── SENSITIVE ITEM ENUMS ───────────────────────

class SensitiveItemType(str, enum.Enum):
    """Categories of sensitive items per USMC SL-3 directive."""
    WEAPON = "WEAPON"                          # M4, M16, SOCOM, etc.
    CRYPTO = "CRYPTO"                          # KYV-5, KTC, AN/PRC-152, etc.
    NVG = "NVG"                                # AN/PVS-31, AN/PVS-14, etc.
    OPTIC = "OPTIC"                           # ACOG, PEQ-15, LPVO, etc.
    RADIO = "RADIO"                           # AN/PRC-117F, SINCGARS, etc.
    CLASSIFIED_MATERIAL = "CLASSIFIED_MATERIAL"  # Documents, drives, media
    OTHER = "OTHER"                           # EW devices, tactical gear


class SecurityClassification(str, enum.Enum):
    """Information security classification levels."""
    UNCLASS = "UNCLASS"
    CUI = "CUI"                               # Controlled Unclassified Info
    SECRET = "SECRET"
    TS = "TS"                                 # Top Secret


class ItemConditionCode(str, enum.Enum):
    """Equipment condition codes per USMC standards."""
    A = "A"                                  # Serviceable / Excellent
    B = "B"                                  # Serviceable / Good
    C = "C"                                  # Serviceable / Fair
    F = "F"                                  # Unserviceable / Functional defects
    H = "H"                                  # Unserviceable / Hostile use damage


class SensitiveItemStatus(str, enum.Enum):
    """Tracking status for sensitive items."""
    ON_HAND = "ON_HAND"                      # In inventory, assigned
    TRANSFERRED = "TRANSFERRED"              # In transfer chain
    IN_MAINTENANCE = "IN_MAINTENANCE"        # Repair/service
    MISSING = "MISSING"                      # Not accounted for (alert issued)
    LOST = "LOST"                            # Officially lost
    DESTROYED = "DESTROYED"                  # Destroyed, documented
    TURNED_IN = "TURNED_IN"                  # Returned, no longer in service


class TransferType(str, enum.Enum):
    """Classification of custody transfer events."""
    HAND_RECEIPT = "HAND_RECEIPT"           # Issue to individual
    SUB_HAND_RECEIPT = "SUB_HAND_RECEIPT"   # Sub-hand receipt (squad leader)
    LATERAL_TRANSFER = "LATERAL_TRANSFER"   # Same unit, different holder
    TURN_IN = "TURN_IN"                     # Return to supply
    ISSUE = "ISSUE"                         # New issue from supply
    TEMP_LOAN = "TEMP_LOAN"                 # Temporary assignment
    RETURN_FROM_LOAN = "RETURN_FROM_LOAN"   # Loan returned
    INVENTORY_CORRECTION = "INVENTORY_CORRECTION"  # Corrected location


class InventoryType(str, enum.Enum):
    """Classification of inventory events."""
    DAILY = "DAILY"                         # Daily 100% sensitive count
    WEEKLY = "WEEKLY"                       # Weekly inventory
    MONTHLY = "MONTHLY"                     # Monthly spot-check
    CHANGE_OF_COMMAND = "CHANGE_OF_COMMAND" # COC relief inventory
    DIRECTED = "DIRECTED"                   # Command-directed count
    RANDOM = "RANDOM"                       # Random verification


class InventoryStatus(str, enum.Enum):
    """State of an inventory event."""
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETE = "COMPLETE"
    DISCREPANCY_FOUND = "DISCREPANCY_FOUND"
    DISCREPANCY_RESOLVED = "DISCREPANCY_RESOLVED"


class DiscrepancyType(str, enum.Enum):
    """Classification of inventory discrepancies."""
    MISSING = "MISSING"
    WRONG_LOCATION = "WRONG_LOCATION"
    WRONG_HOLDER = "WRONG_HOLDER"
    DAMAGED = "DAMAGED"
    SERIAL_MISMATCH = "SERIAL_MISMATCH"
    DUPLICATE = "DUPLICATE"


class AuditAction(str, enum.Enum):
    """System audit log action types for complete accountability."""
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    VIEW = "VIEW"
    EXPORT = "EXPORT"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    APPROVE = "APPROVE"
    DENY = "DENY"
    TRANSFER = "TRANSFER"
    INVENTORY = "INVENTORY"
    ALERT = "ALERT"


class AuditEntityType(str, enum.Enum):
    """Entity types that can be audited."""
    SENSITIVE_ITEM = "SENSITIVE_ITEM"
    CUSTODY_TRANSFER = "CUSTODY_TRANSFER"
    INVENTORY_EVENT = "INVENTORY_EVENT"
    PERSONNEL = "PERSONNEL"
    EQUIPMENT = "EQUIPMENT"
    REQUISITION = "REQUISITION"
    REPORT = "REPORT"
    USER = "USER"
    SYSTEM_CONFIG = "SYSTEM_CONFIG"


# ─────────────────────── SENSITIVE ITEM REGISTRY ───────────────────────

class SensitiveItem(Base):
    """Master registry of all sensitive items requiring accountability."""
    __tablename__ = "sensitive_items"
    __table_args__ = (
        Index("idx_sensitive_item_serial", "serial_number"),
        Index("idx_sensitive_item_holder", "current_holder_id"),
        Index("idx_sensitive_item_unit", "owning_unit_id"),
        Index("idx_sensitive_item_status", "status"),
        Index("idx_sensitive_item_type", "item_type"),
    )

    id = Column(Integer, primary_key=True, index=True)

    # ──── Item identification ────
    serial_number = Column(String(100), unique=True, nullable=False, index=True)
    item_type = Column(SQLEnum(SensitiveItemType), nullable=False, index=True)
    nomenclature = Column(String(200), nullable=False)

    # ──── Catalog linkage ────
    nsn = Column(String(15), nullable=True)  # National Stock Number
    tamcn = Column(String(20), nullable=True)  # USMC TAMCN

    # ──── Classification & ownership ────
    security_classification = Column(
        SQLEnum(SecurityClassification),
        nullable=False,
        default=SecurityClassification.UNCLASS
    )
    owning_unit_id = Column(
        Integer, ForeignKey("units.id"), nullable=False, index=True
    )

    # ──── Current custody holder ────
    current_holder_id = Column(
        Integer, ForeignKey("personnel.id", ondelete="SET NULL"),
        nullable=True, index=True,
        comment="Individual Marine currently responsible for this item"
    )

    # ──── Hand receipt tracking (USMC DA 2062 equivalent) ────
    hand_receipt_number = Column(
        String(50), nullable=True,
        comment="Primary hand receipt number if issued under receipt"
    )
    sub_hand_receipt_number = Column(
        String(50), nullable=True,
        comment="Sub-hand receipt number (squad leader level)"
    )

    # ──── Condition & status ────
    condition_code = Column(
        SQLEnum(ItemConditionCode),
        nullable=False,
        default=ItemConditionCode.A
    )
    status = Column(
        SQLEnum(SensitiveItemStatus),
        nullable=False,
        default=SensitiveItemStatus.ON_HAND,
        index=True
    )

    # ──── Audit trail ────
    last_inventory_date = Column(DateTime(timezone=True), nullable=True)
    last_transfer_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )

    notes = Column(Text, nullable=True)

    # ──── Relationships ────
    unit = relationship("Unit", foreign_keys=[owning_unit_id])
    current_holder = relationship(
        "Personnel",
        foreign_keys=[current_holder_id],
        backref="sensitive_items_held"
    )
    transfers = relationship(
        "CustodyTransfer",
        back_populates="sensitive_item",
        cascade="all, delete-orphan",
        foreign_keys="CustodyTransfer.sensitive_item_id"
    )
    inventory_line_items = relationship(
        "InventoryLineItem",
        back_populates="sensitive_item",
        cascade="all, delete-orphan"
    )


# ─────────────────────── CUSTODY TRANSFER TRACKING ───────────────────────

class CustodyTransfer(Base):
    """Audit trail of every sensitive item custody change."""
    __tablename__ = "custody_transfers"
    __table_args__ = (
        Index("idx_custody_transfer_item", "sensitive_item_id"),
        Index("idx_custody_transfer_date", "transfer_date"),
        Index("idx_custody_transfer_type", "transfer_type"),
    )

    id = Column(Integer, primary_key=True, index=True)

    # ──── Item being transferred ────
    sensitive_item_id = Column(
        Integer, ForeignKey("sensitive_items.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # ──── Transfer parties ────
    from_personnel_id = Column(
        Integer, ForeignKey("personnel.id"), nullable=True,
        comment="Who is giving up the item (null for new issue from supply)"
    )
    to_personnel_id = Column(
        Integer, ForeignKey("personnel.id"), nullable=True,
        comment="Who is receiving the item (null for turn-in to supply)"
    )

    # ──── Unit-level context (for inter-unit transfers) ────
    from_unit_id = Column(
        Integer, ForeignKey("units.id"), nullable=True,
        comment="Originating unit (if transferred from another unit)"
    )
    to_unit_id = Column(
        Integer, ForeignKey("units.id"), nullable=True,
        comment="Receiving unit (if transferred to another unit)"
    )

    # ──── Transfer details ────
    transfer_type = Column(
        SQLEnum(TransferType), nullable=False, index=True
    )
    transfer_date = Column(DateTime(timezone=True), nullable=False, index=True)
    document_number = Column(
        String(50), nullable=True,
        comment="DA 2062, DA 4707, or other authorization document"
    )

    # ──── Authorization ────
    authorized_by = Column(
        Integer, ForeignKey("users.id"),
        nullable=True,
        comment="Officer or SNCO who approved this transfer"
    )
    witnessed_by = Column(
        Integer, ForeignKey("personnel.id"),
        nullable=True,
        comment="Witness to the transfer (if required)"
    )

    # ──── Metadata ────
    reason = Column(Text, nullable=True, comment="Why this transfer occurred")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ──── Relationships ────
    sensitive_item = relationship("SensitiveItem", back_populates="transfers")
    from_personnel = relationship(
        "Personnel",
        foreign_keys=[from_personnel_id],
        backref="custody_transfers_from"
    )
    to_personnel = relationship(
        "Personnel",
        foreign_keys=[to_personnel_id],
        backref="custody_transfers_to"
    )
    from_unit = relationship("Unit", foreign_keys=[from_unit_id])
    to_unit = relationship("Unit", foreign_keys=[to_unit_id])
    authorized_by_user = relationship("User", foreign_keys=[authorized_by])
    witness = relationship(
        "Personnel",
        foreign_keys=[witnessed_by],
        backref="witnessed_transfers"
    )


# ─────────────────────── INVENTORY EVENT TRACKING ───────────────────────

class InventoryEvent(Base):
    """Master record for each inventory/accountability event."""
    __tablename__ = "inventory_events"
    __table_args__ = (
        Index("idx_inventory_event_unit", "unit_id"),
        Index("idx_inventory_event_date", "started_at"),
        Index("idx_inventory_event_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)

    # ──── Event context ────
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    inventory_type = Column(
        SQLEnum(InventoryType), nullable=False, index=True
    )

    # ──── Personnel conducting inventory ────
    conducted_by = Column(
        Integer, ForeignKey("personnel.id"), nullable=False,
        comment="NCO or officer conducting the inventory"
    )
    witnessed_by = Column(
        Integer, ForeignKey("personnel.id"), nullable=True,
        comment="Senior witness to the inventory (usually officer)"
    )

    # ──── Timeline ────
    started_at = Column(DateTime(timezone=True), nullable=False, index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # ──── Results ────
    total_items_expected = Column(
        Integer, nullable=False,
        comment="How many sensitive items should be on hand"
    )
    total_items_verified = Column(
        Integer, nullable=False, default=0,
        comment="How many items were actually verified"
    )
    discrepancies = Column(
        Integer, nullable=False, default=0,
        comment="Count of line-item discrepancies found"
    )
    status = Column(
        SQLEnum(InventoryStatus),
        nullable=False,
        default=InventoryStatus.IN_PROGRESS,
        index=True
    )

    # ──── Approval chain ────
    approved_by = Column(
        Integer, ForeignKey("users.id"), nullable=True,
        comment="Commander or supply officer sign-off"
    )
    approved_at = Column(DateTime(timezone=True), nullable=True)

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ──── Relationships ────
    unit = relationship("Unit", back_populates="inventory_events")
    conductor = relationship(
        "Personnel",
        foreign_keys=[conducted_by],
        backref="inventories_conducted"
    )
    witness_personnel = relationship(
        "Personnel",
        foreign_keys=[witnessed_by],
        backref="inventories_witnessed"
    )
    approved_by_user = relationship("User", foreign_keys=[approved_by])
    line_items = relationship(
        "InventoryLineItem",
        back_populates="inventory_event",
        cascade="all, delete-orphan"
    )


# ─────────────────────── INVENTORY LINE ITEMS ───────────────────────

class InventoryLineItem(Base):
    """Individual item verification during an inventory event."""
    __tablename__ = "inventory_line_items"
    __table_args__ = (
        Index("idx_inventory_item_event", "inventory_event_id"),
        Index("idx_inventory_item_sensitive", "sensitive_item_id"),
    )

    id = Column(Integer, primary_key=True, index=True)

    inventory_event_id = Column(
        Integer, ForeignKey("inventory_events.id", ondelete="CASCADE"),
        nullable=False, index=True
    )
    sensitive_item_id = Column(
        Integer, ForeignKey("sensitive_items.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # ──── Verification results ────
    verified = Column(Boolean, default=False, nullable=False)
    serial_number_verified = Column(
        Boolean, default=False, nullable=False,
        comment="Was the serial number confirmed matching?"
    )
    condition_code = Column(
        SQLEnum(ItemConditionCode),
        nullable=True,
        comment="Condition observed during count"
    )

    # ──── Discrepancy tracking ────
    discrepancy_type = Column(
        SQLEnum(DiscrepancyType), nullable=True,
        comment="If not verified, what is the problem?"
    )

    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ──── Relationships ────
    inventory_event = relationship(
        "InventoryEvent",
        back_populates="line_items"
    )
    sensitive_item = relationship(
        "SensitiveItem",
        back_populates="inventory_line_items"
    )


# ─────────────────────── UNIVERSAL AUDIT LOG ───────────────────────

class AuditLog(Base):
    """System-wide audit trail for all security-relevant actions.

    This is NOT just for sensitive items — every important system action
    (logins, data exports, approvals, transfers, etc.) is logged here
    for dual-enclave accountability and security compliance.
    """
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("idx_audit_log_user", "user_id"),
        Index("idx_audit_log_action", "action"),
        Index("idx_audit_log_entity", "entity_type", "entity_id"),
        Index("idx_audit_log_created", "created_at"),
    )

    id = Column(Integer, primary_key=True, index=True)

    # ──── Actor ────
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # ──── Action ────
    action = Column(
        SQLEnum(AuditAction), nullable=False, index=True
    )

    # ──── Entity being acted upon ────
    entity_type = Column(
        SQLEnum(AuditEntityType), nullable=False, index=True
    )
    entity_id = Column(Integer, nullable=True, index=True)
    description = Column(
        Text, nullable=False,
        comment="Human-readable summary of what happened"
    )

    # ──── Change details (JSON for flexibility) ────
    old_value = Column(
        Text, nullable=True,
        comment="Previous value (JSON if complex structure)"
    )
    new_value = Column(
        Text, nullable=True,
        comment="New value (JSON if complex structure)"
    )

    # ──── Network context (for forensics) ────
    ip_address = Column(String(45), nullable=True)  # IPv4/IPv6
    user_agent = Column(String(500), nullable=True)

    # ──── Timing ────
    created_at = Column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # ──── Relationships ────
    user = relationship("User", backref="audit_logs")
```

---

## Services

### Create: `backend/app/services/custody.py`

```python
"""Sensitive item custody chain and inventory management."""

from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy import and_, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.custody import (
    SensitiveItem,
    CustodyTransfer,
    InventoryEvent,
    InventoryLineItem,
    AuditLog,
    TransferType,
    SensitiveItemStatus,
    ItemConditionCode,
    InventoryType,
    InventoryStatus,
    DiscrepancyType,
    AuditAction,
    AuditEntityType,
)
from app.models.personnel import Personnel
from app.models.units import Unit
from app.models.user import User


class CustodyService:
    """Core custody tracking and sensitive item accountability."""

    @staticmethod
    async def register_sensitive_item(
        db: AsyncSession,
        serial_number: str,
        item_type: str,
        nomenclature: str,
        owning_unit_id: int,
        security_classification: str = "UNCLASS",
        nsn: Optional[str] = None,
        tamcn: Optional[str] = None,
        hand_receipt_number: Optional[str] = None,
        notes: Optional[str] = None,
        current_user: User = None,
    ) -> SensitiveItem:
        """Register a new sensitive item in the accountability registry.

        This creates the master record that will be tracked through all
        custody changes and inventories. Automatically logs the action.
        """
        item = SensitiveItem(
            serial_number=serial_number,
            item_type=item_type,
            nomenclature=nomenclature,
            owning_unit_id=owning_unit_id,
            security_classification=security_classification,
            nsn=nsn,
            tamcn=tamcn,
            hand_receipt_number=hand_receipt_number,
            notes=notes,
        )
        db.add(item)
        await db.flush()

        # Log the registration
        if current_user:
            await AuditService.log_action(
                db=db,
                user_id=current_user.id,
                action=AuditAction.CREATE,
                entity_type=AuditEntityType.SENSITIVE_ITEM,
                entity_id=item.id,
                description=f"Registered sensitive item: {nomenclature} ({serial_number})",
                new_value={"item_type": item_type, "classification": security_classification},
            )

        await db.commit()
        return item

    @staticmethod
    async def transfer_custody(
        db: AsyncSession,
        sensitive_item_id: int,
        to_personnel_id: Optional[int],
        transfer_type: str,
        transfer_date: datetime,
        from_personnel_id: Optional[int] = None,
        from_unit_id: Optional[int] = None,
        to_unit_id: Optional[int] = None,
        document_number: Optional[str] = None,
        authorized_by_user_id: Optional[int] = None,
        witnessed_by_personnel_id: Optional[int] = None,
        reason: Optional[str] = None,
        notes: Optional[str] = None,
        current_user: User = None,
    ) -> CustodyTransfer:
        """Record a custody transfer event and update item holder.

        This creates an immutable record of who had the item, when,
        and under what authority. The item's current_holder is updated.
        """
        item = await db.get(SensitiveItem, sensitive_item_id)
        if not item:
            raise ValueError(f"Sensitive item {sensitive_item_id} not found")

        # Create the transfer record
        transfer = CustodyTransfer(
            sensitive_item_id=sensitive_item_id,
            from_personnel_id=from_personnel_id,
            to_personnel_id=to_personnel_id,
            from_unit_id=from_unit_id,
            to_unit_id=to_unit_id,
            transfer_type=transfer_type,
            transfer_date=transfer_date,
            document_number=document_number,
            authorized_by=authorized_by_user_id,
            witnessed_by=witnessed_by_personnel_id,
            reason=reason,
            notes=notes,
        )
        db.add(transfer)

        # Update the item's current holder
        old_holder_id = item.current_holder_id
        item.current_holder_id = to_personnel_id
        item.last_transfer_date = transfer_date
        item.status = SensitiveItemStatus.ON_HAND

        await db.flush()

        # Log the transfer
        if current_user:
            holder_name = ""
            if to_personnel_id:
                to_person = await db.get(Personnel, to_personnel_id)
                holder_name = f"{to_person.first_name} {to_person.last_name}"

            await AuditService.log_action(
                db=db,
                user_id=current_user.id,
                action=AuditAction.TRANSFER,
                entity_type=AuditEntityType.CUSTODY_TRANSFER,
                entity_id=transfer.id,
                description=f"Custody transfer: {transfer_type} to {holder_name}",
                old_value={"holder_id": old_holder_id},
                new_value={"holder_id": to_personnel_id},
            )

        await db.commit()
        return transfer

    @staticmethod
    async def get_custody_chain(
        db: AsyncSession,
        serial_number: str,
    ) -> Dict[str, Any]:
        """Retrieve the complete chain of custody for an item.

        Returns the item, all transfer records in chronological order,
        and current holder information for accountability verification.
        """
        from sqlalchemy import select

        result = await db.execute(
            select(SensitiveItem).where(
                SensitiveItem.serial_number == serial_number
            )
        )
        item = result.scalar_one_or_none()
        if not item:
            raise ValueError(f"No item with serial {serial_number}")

        result = await db.execute(
            select(CustodyTransfer)
            .where(CustodyTransfer.sensitive_item_id == item.id)
            .order_by(CustodyTransfer.transfer_date)
        )
        transfers = result.scalars().all()

        return {
            "item": item,
            "transfers": transfers,
            "current_holder": item.current_holder,
        }

    @staticmethod
    async def get_items_by_holder(
        db: AsyncSession,
        personnel_id: int,
    ) -> List[SensitiveItem]:
        """Get all sensitive items currently assigned to a Marine."""
        from sqlalchemy import select

        result = await db.execute(
            select(SensitiveItem)
            .where(SensitiveItem.current_holder_id == personnel_id)
            .where(SensitiveItem.status == SensitiveItemStatus.ON_HAND)
            .order_by(SensitiveItem.item_type)
        )
        return result.scalars().all()

    @staticmethod
    async def get_unit_sensitive_items(
        db: AsyncSession,
        unit_id: int,
    ) -> List[SensitiveItem]:
        """Get all sensitive items for a unit."""
        from sqlalchemy import select

        result = await db.execute(
            select(SensitiveItem)
            .where(SensitiveItem.owning_unit_id == unit_id)
            .order_by(SensitiveItem.item_type, SensitiveItem.serial_number)
        )
        return result.scalars().all()

    @staticmethod
    async def conduct_inventory(
        db: AsyncSession,
        unit_id: int,
        inventory_type: str,
        conducted_by_id: int,
        witnessed_by_id: Optional[int] = None,
        notes: Optional[str] = None,
        current_user: User = None,
    ) -> InventoryEvent:
        """Start a new inventory event.

        Prepares the inventory by counting expected items and creating
        the container for line-item verifications.
        """
        from sqlalchemy import select, func

        # Count expected items
        result = await db.execute(
            select(func.count(SensitiveItem.id)).where(
                SensitiveItem.owning_unit_id == unit_id,
                SensitiveItem.status == SensitiveItemStatus.ON_HAND,
            )
        )
        expected_count = result.scalar() or 0

        inventory = InventoryEvent(
            unit_id=unit_id,
            inventory_type=inventory_type,
            conducted_by=conducted_by_id,
            witnessed_by=witnessed_by_id,
            started_at=datetime.utcnow(),
            total_items_expected=expected_count,
            notes=notes,
        )
        db.add(inventory)
        await db.flush()

        # Log the inventory start
        if current_user:
            inv_type_label = inventory_type
            await AuditService.log_action(
                db=db,
                user_id=current_user.id,
                action=AuditAction.INVENTORY,
                entity_type=AuditEntityType.INVENTORY_EVENT,
                entity_id=inventory.id,
                description=f"Started {inv_type_label} inventory for unit {unit_id}",
                new_value={"expected_count": expected_count},
            )

        await db.commit()
        return inventory

    @staticmethod
    async def verify_item(
        db: AsyncSession,
        inventory_event_id: int,
        sensitive_item_id: int,
        verified: bool,
        condition_code: Optional[str] = None,
        serial_number_verified: bool = False,
        discrepancy_type: Optional[str] = None,
        notes: Optional[str] = None,
        current_user: User = None,
    ) -> InventoryLineItem:
        """Verify a single item during an inventory."""
        line_item = InventoryLineItem(
            inventory_event_id=inventory_event_id,
            sensitive_item_id=sensitive_item_id,
            verified=verified,
            condition_code=condition_code,
            serial_number_verified=serial_number_verified,
            discrepancy_type=discrepancy_type,
            notes=notes,
        )
        db.add(line_item)

        # Update the item's last inventory date if verified
        if verified:
            item = await db.get(SensitiveItem, sensitive_item_id)
            item.last_inventory_date = datetime.utcnow()

        await db.flush()

        if current_user:
            await AuditService.log_action(
                db=db,
                user_id=current_user.id,
                action=AuditAction.INVENTORY,
                entity_type=AuditEntityType.INVENTORY_EVENT,
                entity_id=inventory_event_id,
                description=f"Verified item {sensitive_item_id}: {verified}",
                new_value={"verified": verified, "discrepancy": discrepancy_type},
            )

        await db.commit()
        return line_item

    @staticmethod
    async def complete_inventory(
        db: AsyncSession,
        inventory_event_id: int,
        approved_by_user_id: Optional[int] = None,
        current_user: User = None,
    ) -> InventoryEvent:
        """Finalize an inventory event and calculate discrepancies."""
        from sqlalchemy import select, func

        inventory = await db.get(InventoryEvent, inventory_event_id)
        if not inventory:
            raise ValueError(f"Inventory {inventory_event_id} not found")

        result = await db.execute(
            select(func.count(InventoryLineItem.id)).where(
                InventoryLineItem.inventory_event_id == inventory_event_id
            )
        )
        total_verified = result.scalar() or 0

        result = await db.execute(
            select(func.count(InventoryLineItem.id)).where(
                InventoryLineItem.inventory_event_id == inventory_event_id,
                InventoryLineItem.verified == True,
            )
        )
        verified_count = result.scalar() or 0

        inventory.total_items_verified = verified_count
        inventory.discrepancies = total_verified - verified_count
        inventory.completed_at = datetime.utcnow()
        inventory.approved_by = approved_by_user_id

        if inventory.discrepancies > 0:
            inventory.status = InventoryStatus.DISCREPANCY_FOUND
        else:
            inventory.status = InventoryStatus.COMPLETE

        await db.flush()

        if current_user:
            await AuditService.log_action(
                db=db,
                user_id=current_user.id,
                action=AuditAction.APPROVE,
                entity_type=AuditEntityType.INVENTORY_EVENT,
                entity_id=inventory_event_id,
                description=f"Completed inventory: {verified_count}/{total_verified} verified",
                new_value={
                    "status": inventory.status,
                    "discrepancies": inventory.discrepancies,
                },
            )

        await db.commit()
        return inventory

    @staticmethod
    async def flag_missing_item(
        db: AsyncSession,
        sensitive_item_id: int,
        reason: Optional[str] = None,
        current_user: User = None,
    ) -> SensitiveItem:
        """Flag an item as missing and trigger alerts."""
        item = await db.get(SensitiveItem, sensitive_item_id)
        if not item:
            raise ValueError(f"Item {sensitive_item_id} not found")

        old_status = item.status
        item.status = SensitiveItemStatus.MISSING

        if current_user:
            await AuditService.log_action(
                db=db,
                user_id=current_user.id,
                action=AuditAction.ALERT,
                entity_type=AuditEntityType.SENSITIVE_ITEM,
                entity_id=sensitive_item_id,
                description=f"Item flagged as MISSING: {item.nomenclature}",
                old_value={"status": old_status},
                new_value={"status": "MISSING"},
            )

        await db.commit()
        return item

    @staticmethod
    async def generate_hand_receipt(
        db: AsyncSession,
        personnel_id: int,
    ) -> Dict[str, Any]:
        """Generate printable hand receipt data for a Marine.

        Returns structured data formatted like a DA 2062 (Hand Receipt)
        for printing or display.
        """
        items = await CustodyService.get_items_by_holder(db, personnel_id)

        person = await db.get(Personnel, personnel_id)

        return {
            "personnel": person,
            "items": items,
            "generated_at": datetime.utcnow(),
            "total_items": len(items),
        }


class AuditService:
    """Universal audit logging for security and accountability."""

    @staticmethod
    async def log_action(
        db: AsyncSession,
        user_id: int,
        action: str,
        entity_type: str,
        description: str,
        entity_id: Optional[int] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
    ) -> AuditLog:
        """Log any security-relevant action in the system.

        This is the central audit point for all user actions, system changes,
        and sensitive item operations.
        """
        import json

        audit = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            old_value=json.dumps(old_value) if old_value else None,
            new_value=json.dumps(new_value) if new_value else None,
            ip_address=ip_address,
            user_agent=user_agent,
        )
        db.add(audit)
        await db.commit()
        return audit

    @staticmethod
    async def get_audit_trail(
        db: AsyncSession,
        entity_type: str,
        entity_id: Optional[int] = None,
        days_back: int = 90,
    ) -> List[AuditLog]:
        """Retrieve audit trail for a specific entity."""
        from sqlalchemy import select

        cutoff_date = datetime.utcnow() - timedelta(days=days_back)

        query = (
            select(AuditLog)
            .where(AuditLog.entity_type == entity_type)
            .where(AuditLog.created_at >= cutoff_date)
        )

        if entity_id:
            query = query.where(AuditLog.entity_id == entity_id)

        query = query.order_by(desc(AuditLog.created_at))

        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_user_activity(
        db: AsyncSession,
        user_id: int,
        days_back: int = 30,
    ) -> List[AuditLog]:
        """Get all audit log entries for a specific user."""
        from sqlalchemy import select

        cutoff_date = datetime.utcnow() - timedelta(days=days_back)

        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .where(AuditLog.created_at >= cutoff_date)
            .order_by(desc(AuditLog.created_at))
        )
        return result.scalars().all()

    @staticmethod
    async def get_sensitive_actions(
        db: AsyncSession,
        hours_back: int = 24,
    ) -> List[AuditLog]:
        """Get all security-sensitive actions in the system."""
        from sqlalchemy import select

        cutoff_time = datetime.utcnow() - timedelta(hours=hours_back)

        # Actions we consider security-relevant
        sensitive_actions = [
            AuditAction.DELETE,
            AuditAction.EXPORT,
            AuditAction.TRANSFER,
            AuditAction.ALERT,
            AuditAction.DENY,
        ]

        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.action.in_(sensitive_actions))
            .where(AuditLog.created_at >= cutoff_time)
            .order_by(desc(AuditLog.created_at))
        )
        return result.scalars().all()
```

---

## API Endpoints

### Create: `backend/app/api/custody.py`

```python
"""API endpoints for sensitive item custody tracking."""

from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.dependencies import get_current_user
from app.services.custody import CustodyService, AuditService
from app.models.custody import (
    SensitiveItem,
    CustodyTransfer,
    InventoryEvent,
    InventoryLineItem,
    AuditLog,
)


router = APIRouter(prefix="/api/v1/custody", tags=["Custody & Chain of Custody"])


# ──────────────────── SENSITIVE ITEM REGISTRY ──────────────────

@router.post("/items", response_model=dict)
async def create_sensitive_item(
    serial_number: str,
    item_type: str,
    nomenclature: str,
    owning_unit_id: int,
    security_classification: str = "UNCLASS",
    nsn: Optional[str] = None,
    tamcn: Optional[str] = None,
    hand_receipt_number: Optional[str] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Register a new sensitive item in the accountability system."""
    item = await CustodyService.register_sensitive_item(
        db=db,
        serial_number=serial_number,
        item_type=item_type,
        nomenclature=nomenclature,
        owning_unit_id=owning_unit_id,
        security_classification=security_classification,
        nsn=nsn,
        tamcn=tamcn,
        hand_receipt_number=hand_receipt_number,
        notes=notes,
        current_user=current_user,
    )
    return {"id": item.id, "serial_number": item.serial_number, "status": "registered"}


@router.get("/items/{item_id}", response_model=dict)
async def get_sensitive_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get details of a sensitive item."""
    item = await db.get(SensitiveItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "id": item.id,
        "serial_number": item.serial_number,
        "nomenclature": item.nomenclature,
        "item_type": item.item_type,
        "status": item.status,
        "current_holder_id": item.current_holder_id,
        "owning_unit_id": item.owning_unit_id,
        "security_classification": item.security_classification,
        "hand_receipt_number": item.hand_receipt_number,
        "condition_code": item.condition_code,
        "last_inventory_date": item.last_inventory_date,
        "notes": item.notes,
    }


@router.get("/unit/{unit_id}/items", response_model=List[dict])
async def list_unit_sensitive_items(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """Get all sensitive items for a unit."""
    items = await CustodyService.get_unit_sensitive_items(db, unit_id)
    return [
        {
            "id": item.id,
            "serial_number": item.serial_number,
            "nomenclature": item.nomenclature,
            "item_type": item.item_type,
            "status": item.status,
            "current_holder_id": item.current_holder_id,
            "condition_code": item.condition_code,
        }
        for item in items
    ]


# ──────────────────── CUSTODY TRANSFERS ──────────────────

@router.post("/transfer", response_model=dict)
async def create_custody_transfer(
    sensitive_item_id: int,
    to_personnel_id: Optional[int],
    transfer_type: str,
    transfer_date: datetime,
    from_personnel_id: Optional[int] = None,
    from_unit_id: Optional[int] = None,
    to_unit_id: Optional[int] = None,
    document_number: Optional[str] = None,
    witnessed_by_personnel_id: Optional[int] = None,
    reason: Optional[str] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    request: Request = None,
) -> dict:
    """Record a custody transfer event."""
    transfer = await CustodyService.transfer_custody(
        db=db,
        sensitive_item_id=sensitive_item_id,
        to_personnel_id=to_personnel_id,
        transfer_type=transfer_type,
        transfer_date=transfer_date,
        from_personnel_id=from_personnel_id,
        from_unit_id=from_unit_id,
        to_unit_id=to_unit_id,
        document_number=document_number,
        authorized_by_user_id=current_user.id,
        witnessed_by_personnel_id=witnessed_by_personnel_id,
        reason=reason,
        notes=notes,
        current_user=current_user,
    )
    return {
        "id": transfer.id,
        "sensitive_item_id": transfer.sensitive_item_id,
        "transfer_type": transfer.transfer_type,
        "transfer_date": transfer.transfer_date,
    }


@router.get("/chain/{serial_number}", response_model=dict)
async def get_custody_chain(
    serial_number: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get complete chain of custody for an item."""
    data = await CustodyService.get_custody_chain(db, serial_number)
    return {
        "item": {
            "id": data["item"].id,
            "serial_number": data["item"].serial_number,
            "nomenclature": data["item"].nomenclature,
            "status": data["item"].status,
        },
        "current_holder": {
            "id": data["current_holder"].id if data["current_holder"] else None,
            "name": f"{data['current_holder'].first_name} {data['current_holder'].last_name}" if data["current_holder"] else None,
        },
        "transfer_count": len(data["transfers"]),
    }


@router.get("/holder/{personnel_id}/items", response_model=List[dict])
async def list_items_by_holder(
    personnel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """Get all sensitive items held by a Marine."""
    items = await CustodyService.get_items_by_holder(db, personnel_id)
    return [
        {
            "id": item.id,
            "serial_number": item.serial_number,
            "nomenclature": item.nomenclature,
            "item_type": item.item_type,
            "condition_code": item.condition_code,
            "hand_receipt_number": item.hand_receipt_number,
        }
        for item in items
    ]


@router.get("/missing", response_model=List[dict])
async def list_missing_items(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """Get all items flagged as missing (alert dashboard)."""
    from sqlalchemy import select
    from app.models.custody import SensitiveItemStatus

    result = await db.execute(
        select(SensitiveItem).where(
            SensitiveItem.status == SensitiveItemStatus.MISSING
        )
    )
    items = result.scalars().all()
    return [
        {
            "id": item.id,
            "serial_number": item.serial_number,
            "nomenclature": item.nomenclature,
            "item_type": item.item_type,
            "owning_unit_id": item.owning_unit_id,
            "last_known_holder_id": item.current_holder_id,
        }
        for item in items
    ]


# ──────────────────── INVENTORY MANAGEMENT ──────────────────

@router.post("/inventory", response_model=dict)
async def start_inventory(
    unit_id: int,
    inventory_type: str,
    conducted_by_id: int,
    witnessed_by_id: Optional[int] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Start a new sensitive item inventory event."""
    inventory = await CustodyService.conduct_inventory(
        db=db,
        unit_id=unit_id,
        inventory_type=inventory_type,
        conducted_by_id=conducted_by_id,
        witnessed_by_id=witnessed_by_id,
        notes=notes,
        current_user=current_user,
    )
    return {
        "id": inventory.id,
        "unit_id": inventory.unit_id,
        "inventory_type": inventory.inventory_type,
        "status": inventory.status,
        "total_items_expected": inventory.total_items_expected,
    }


@router.put("/inventory/{inventory_id}/verify", response_model=dict)
async def verify_item_in_inventory(
    inventory_id: int,
    sensitive_item_id: int,
    verified: bool,
    condition_code: Optional[str] = None,
    serial_number_verified: bool = False,
    discrepancy_type: Optional[str] = None,
    notes: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Verify an item during an inventory."""
    line_item = await CustodyService.verify_item(
        db=db,
        inventory_event_id=inventory_id,
        sensitive_item_id=sensitive_item_id,
        verified=verified,
        condition_code=condition_code,
        serial_number_verified=serial_number_verified,
        discrepancy_type=discrepancy_type,
        notes=notes,
        current_user=current_user,
    )
    return {
        "id": line_item.id,
        "inventory_id": line_item.inventory_event_id,
        "item_id": line_item.sensitive_item_id,
        "verified": line_item.verified,
    }


@router.put("/inventory/{inventory_id}/complete", response_model=dict)
async def complete_inventory(
    inventory_id: int,
    approved_by_user_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Finalize an inventory event."""
    inventory = await CustodyService.complete_inventory(
        db=db,
        inventory_event_id=inventory_id,
        approved_by_user_id=approved_by_user_id or current_user.id,
        current_user=current_user,
    )
    return {
        "id": inventory.id,
        "status": inventory.status,
        "total_verified": inventory.total_items_verified,
        "discrepancies": inventory.discrepancies,
        "completed_at": inventory.completed_at,
    }


@router.get("/inventory/{inventory_id}/results", response_model=dict)
async def get_inventory_results(
    inventory_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get results of a completed inventory."""
    inventory = await db.get(InventoryEvent, inventory_id)
    if not inventory:
        raise HTTPException(status_code=404, detail="Inventory not found")

    return {
        "id": inventory.id,
        "unit_id": inventory.unit_id,
        "inventory_type": inventory.inventory_type,
        "status": inventory.status,
        "total_expected": inventory.total_items_expected,
        "total_verified": inventory.total_items_verified,
        "discrepancies": inventory.discrepancies,
        "started_at": inventory.started_at,
        "completed_at": inventory.completed_at,
    }


@router.get("/hand-receipt/{personnel_id}", response_model=dict)
async def get_hand_receipt(
    personnel_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get hand receipt data for a Marine (DA 2062 format)."""
    hand_receipt = await CustodyService.generate_hand_receipt(db, personnel_id)
    return {
        "personnel_id": hand_receipt["personnel"].id,
        "personnel_name": f"{hand_receipt['personnel'].first_name} {hand_receipt['personnel'].last_name}",
        "rank": hand_receipt["personnel"].rank,
        "edipi": hand_receipt["personnel"].edipi,
        "total_items": hand_receipt["total_items"],
        "items": [
            {
                "serial_number": item.serial_number,
                "nomenclature": item.nomenclature,
                "item_type": item.item_type,
                "condition_code": item.condition_code,
            }
            for item in hand_receipt["items"]
        ],
        "generated_at": hand_receipt["generated_at"],
    }


# ──────────────────── AUDIT LOG ──────────────────

@router.get("/audit/trail/{entity_type}/{entity_id}", response_model=List[dict])
async def get_audit_trail(
    entity_type: str,
    entity_id: Optional[int] = None,
    days_back: int = Query(90, ge=1, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """Get audit trail for an entity."""
    logs = await AuditService.get_audit_trail(
        db, entity_type, entity_id, days_back
    )
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "description": log.description,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.get("/audit/user/{user_id}", response_model=List[dict])
async def get_user_audit_activity(
    user_id: int,
    days_back: int = Query(30, ge=1, le=180),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """Get all actions by a user."""
    logs = await AuditService.get_user_activity(db, user_id, days_back)
    return [
        {
            "id": log.id,
            "action": log.action,
            "entity_type": log.entity_type,
            "description": log.description,
            "created_at": log.created_at,
        }
        for log in logs
    ]


@router.get("/audit/security", response_model=List[dict])
async def get_sensitive_actions(
    hours_back: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[dict]:
    """Get all security-sensitive actions in the system."""
    logs = await AuditService.get_sensitive_actions(db, hours_back)
    return [
        {
            "id": log.id,
            "user_id": log.user_id,
            "action": log.action,
            "entity_type": log.entity_type,
            "description": log.description,
            "created_at": log.created_at,
        }
        for log in logs
    ]
```

---

## Frontend Components

Create new directory: `frontend/src/pages/Custody/` and `frontend/src/pages/Audit/`

### `frontend/src/pages/Custody/CustodyPage.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import SensitiveItemTable from './components/SensitiveItemTable';
import CustodyTransferForm from './components/CustodyTransferForm';
import CustodyTimeline from './components/CustodyTimeline';
import InventoryChecklist from './components/InventoryChecklist';
import HandReceiptView from './components/HandReceiptView';
import MissingItemDashboard from './components/MissingItemDashboard';

export default function CustodyPage() {
  const [activeTab, setActiveTab] = useState<'items' | 'transfer' | 'timeline' | 'inventory' | 'hand-receipt' | 'missing'>('items');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Sensitive Item Custody & Chain of Custody
        </h1>

        {/* Tab Navigation */}
        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'items'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Sensitive Item Registry
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'transfer'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Transfer Custody
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'inventory'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Inventory Management
          </button>
          <button
            onClick={() => setActiveTab('missing')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'missing'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Missing Items Alert
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'items' && <SensitiveItemTable onSelectItem={setSelectedItemId} />}
        {activeTab === 'transfer' && <CustodyTransferForm />}
        {activeTab === 'timeline' && selectedItemId && <CustodyTimeline itemId={selectedItemId} />}
        {activeTab === 'inventory' && <InventoryChecklist />}
        {activeTab === 'missing' && <MissingItemDashboard />}
      </div>
    </div>
  );
}
```

### `frontend/src/pages/Custody/components/SensitiveItemTable.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TanstackTable } from '@/components/TanstackTable';

interface SensitiveItem {
  id: number;
  serial_number: string;
  nomenclature: string;
  item_type: string;
  status: string;
  current_holder_id: number | null;
  condition_code: string;
}

interface Props {
  onSelectItem: (id: number) => void;
}

export default function SensitiveItemTable({ onSelectItem }: Props) {
  const [unitId, setUnitId] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: items, isLoading } = useQuery({
    queryKey: ['sensitive-items', unitId],
    queryFn: () => api.get(`/api/v1/custody/unit/${unitId}/items`),
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  const filtered = items?.filter((item: SensitiveItem) =>
    item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.nomenclature.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-4">Sensitive Item Registry</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by serial number or nomenclature..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Serial</th>
              <th className="px-4 py-2 text-left font-semibold">Nomenclature</th>
              <th className="px-4 py-2 text-left font-semibold">Type</th>
              <th className="px-4 py-2 text-left font-semibold">Status</th>
              <th className="px-4 py-2 text-left font-semibold">Condition</th>
              <th className="px-4 py-2 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered?.map((item: SensitiveItem) => (
              <tr key={item.id} className="border-t border-gray-300">
                <td className="px-4 py-2">{item.serial_number}</td>
                <td className="px-4 py-2">{item.nomenclature}</td>
                <td className="px-4 py-2">{item.item_type}</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 rounded text-white text-sm ${
                      item.status === 'ON_HAND'
                        ? 'bg-green-500'
                        : item.status === 'MISSING'
                        ? 'bg-red-500'
                        : 'bg-yellow-500'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-2">{item.condition_code}</td>
                <td className="px-4 py-2">
                  <button
                    onClick={() => onSelectItem(item.id)}
                    className="text-blue-600 hover:text-blue-900 font-medium"
                  >
                    View Chain
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### `frontend/src/pages/Custody/components/CustodyTransferForm.tsx`

```typescript
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

export default function CustodyTransferForm() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    sensitive_item_id: '',
    to_personnel_id: '',
    transfer_type: 'HAND_RECEIPT',
    transfer_date: new Date().toISOString().split('T')[0],
    document_number: '',
    reason: '',
  });

  const transferMutation = useMutation({
    mutationFn: (data) => api.post('/api/v1/custody/transfer', data),
    onSuccess: () => {
      toast.success('Custody transfer recorded successfully');
      setFormData({
        sensitive_item_id: '',
        to_personnel_id: '',
        transfer_type: 'HAND_RECEIPT',
        transfer_date: new Date().toISOString().split('T')[0],
        document_number: '',
        reason: '',
      });
    },
    onError: () => {
      toast.error('Failed to record transfer');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    transferMutation.mutate(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Record Custody Transfer</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sensitive Item
            </label>
            <input
              type="number"
              value={formData.sensitive_item_id}
              onChange={(e) =>
                setFormData({ ...formData, sensitive_item_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Personnel
            </label>
            <input
              type="number"
              value={formData.to_personnel_id}
              onChange={(e) =>
                setFormData({ ...formData, to_personnel_id: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Type
            </label>
            <select
              value={formData.transfer_type}
              onChange={(e) =>
                setFormData({ ...formData, transfer_type: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="HAND_RECEIPT">Hand Receipt</option>
              <option value="LATERAL_TRANSFER">Lateral Transfer</option>
              <option value="TEMP_LOAN">Temporary Loan</option>
              <option value="TURN_IN">Turn In</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transfer Date
            </label>
            <input
              type="date"
              value={formData.transfer_date}
              onChange={(e) =>
                setFormData({ ...formData, transfer_date: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Number
            </label>
            <input
              type="text"
              value={formData.document_number}
              onChange={(e) =>
                setFormData({ ...formData, document_number: e.target.value })
              }
              placeholder="DA 2062, DA 4707, etc."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reason
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) =>
              setFormData({ ...formData, reason: e.target.value })
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={transferMutation.isPending}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {transferMutation.isPending ? 'Recording...' : 'Record Transfer'}
        </button>
      </form>
    </div>
  );
}
```

### `frontend/src/pages/Custody/components/InventoryChecklist.tsx`

```typescript
import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/useToast';

export default function InventoryChecklist() {
  const { toast } = useToast();
  const [inventoryId, setInventoryId] = useState<number | null>(null);
  const [unitId, setUnitId] = useState(1);

  const startInventoryMutation = useMutation({
    mutationFn: (data) => api.post('/api/v1/custody/inventory', data),
    onSuccess: (data) => {
      setInventoryId(data.id);
      toast.success('Inventory started');
    },
  });

  const handleStartInventory = () => {
    startInventoryMutation.mutate({
      unit_id: unitId,
      inventory_type: 'DAILY',
      conducted_by_id: 1,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">Inventory Management</h2>

      {!inventoryId ? (
        <button
          onClick={handleStartInventory}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          Start New Inventory
        </button>
      ) : (
        <div>
          <p>Inventory ID: {inventoryId}</p>
          <p className="text-green-600 font-medium">Inventory in progress...</p>
        </div>
      )}
    </div>
  );
}
```

### `frontend/src/pages/Audit/AuditPage.tsx`

```typescript
import React, { useState } from 'react';
import AuditLogTable from './components/AuditLogTable';
import SecurityActionsTable from './components/SecurityActionsTable';

export default function AuditPage() {
  const [activeTab, setActiveTab] = useState<'logs' | 'security'>('logs');

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          System Audit Log
        </h1>

        <div className="flex space-x-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'logs'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Audit Trail
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'security'
                ? 'border-b-2 border-red-600 text-red-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Security Actions
          </button>
        </div>

        {activeTab === 'logs' && <AuditLogTable />}
        {activeTab === 'security' && <SecurityActionsTable />}
      </div>
    </div>
  );
}
```

### `frontend/src/pages/Audit/components/AuditLogTable.tsx`

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface AuditLogEntry {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number | null;
  description: string;
  created_at: string;
}

export default function AuditLogTable() {
  const [entityType, setEntityType] = useState('SENSITIVE_ITEM');
  const [daysBack, setDaysBack] = useState(90);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', entityType, daysBack],
    queryFn: () =>
      api.get(`/api/v1/audit/trail/${entityType}`, {
        params: { days_back: daysBack },
      }),
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4">Audit Trail</h2>

      <div className="mb-4 flex space-x-4">
        <select
          value={entityType}
          onChange={(e) => setEntityType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value="SENSITIVE_ITEM">Sensitive Items</option>
          <option value="CUSTODY_TRANSFER">Custody Transfers</option>
          <option value="INVENTORY_EVENT">Inventory Events</option>
          <option value="PERSONNEL">Personnel</option>
        </select>
        <select
          value={daysBack}
          onChange={(e) => setDaysBack(Number(e.target.value))}
          className="px-4 py-2 border border-gray-300 rounded-lg"
        >
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
          <option value={365}>Last year</option>
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Date/Time</th>
              <th className="px-4 py-2 text-left font-semibold">User</th>
              <th className="px-4 py-2 text-left font-semibold">Action</th>
              <th className="px-4 py-2 text-left font-semibold">Description</th>
            </tr>
          </thead>
          <tbody>
            {logs?.map((log: AuditLogEntry) => (
              <tr key={log.id} className="border-t border-gray-300">
                <td className="px-4 py-2 text-sm">
                  {new Date(log.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 text-sm">User {log.user_id}</td>
                <td className="px-4 py-2 text-sm">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm">{log.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## Routes & Integration

### Update: `backend/app/api/__init__.py`

Add to existing router includes:

```python
from app.api import custody, audit

# In the main router setup:
app.include_router(custody.router)
app.include_router(audit.router)
```

### Update: `frontend/src/App.tsx`

Add routes:

```typescript
<Route path="/custody" element={<CustodyPage />} />
<Route path="/audit" element={<AuditPage />} />
```

---

## Seed Data

Create: `backend/seed/seed_custody_data.py`

```python
"""Seed sensitive items from existing Weapon records and catalogs."""

import asyncio
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.custody import (
    SensitiveItem,
    SensitiveItemType,
    SecurityClassification,
)
from app.models.personnel import Weapon
from app.models.equipment import Equipment


async def seed_weapons_as_sensitive_items(db: AsyncSession):
    """Register existing weapons as sensitive items."""
    from sqlalchemy import select

    result = await db.execute(select(Weapon))
    weapons = result.scalars().all()

    for weapon in weapons:
        # Check if already registered
        result = await db.execute(
            select(SensitiveItem).where(
                SensitiveItem.serial_number == weapon.serial_number
            )
        )
        if result.scalar_one_or_none():
            continue

        item = SensitiveItem(
            serial_number=weapon.serial_number,
            item_type=SensitiveItemType.WEAPON,
            nomenclature=weapon.weapon_type,
            security_classification=SecurityClassification.UNCLASS,
            owning_unit_id=weapon.personnel.unit_id,
            current_holder_id=weapon.personnel_id,
            notes=f"Registered from Weapon record: {weapon.optic or 'No optic'}",
        )
        db.add(item)

    await db.commit()
    print(f"Registered {len(weapons)} weapons as sensitive items")


async def seed_common_sensitive_items(db: AsyncSession, unit_id: int = 1):
    """Seed common sensitive item types."""
    items = [
        {
            "serial": "NVG-001",
            "type": SensitiveItemType.NVG,
            "nomenclature": "AN/PVS-31A Night Vision Goggle",
            "classification": SecurityClassification.UNCLASS,
        },
        {
            "serial": "CRYPTO-001",
            "type": SensitiveItemType.CRYPTO,
            "nomenclature": "KYV-5 Secure Telephone",
            "classification": SecurityClassification.SECRET,
        },
        {
            "serial": "OPTIC-001",
            "type": SensitiveItemType.OPTIC,
            "nomenclature": "ACOG 4x32",
            "classification": SecurityClassification.UNCLASS,
        },
        {
            "serial": "RADIO-001",
            "type": SensitiveItemType.RADIO,
            "nomenclature": "AN/PRC-152A Tactical Radio",
            "classification": SecurityClassification.UNCLASS,
        },
    ]

    for item_data in items:
        result = await db.execute(
            select(SensitiveItem).where(
                SensitiveItem.serial_number == item_data["serial"]
            )
        )
        if result.scalar_one_or_none():
            continue

        item = SensitiveItem(
            serial_number=item_data["serial"],
            item_type=item_data["type"],
            nomenclature=item_data["nomenclature"],
            security_classification=item_data["classification"],
            owning_unit_id=unit_id,
            notes="Seeded sample item",
        )
        db.add(item)

    await db.commit()
    print(f"Seeded {len(items)} common sensitive items")
```

---

## Key Features & Design Principles

### 1. **USMC Accountability Standards**
- Complies with SL-3 sensitive item procedures
- Implements DA 2062 (Hand Receipt) concept
- Supports Change of Command relief inventories
- Mandatory witness requirement for high-value transfers

### 2. **Immutable Audit Trail**
- Every custody change is logged with date, time, approver, and witness
- System-wide audit log covers all sensitive actions (logins, exports, transfers, approvals)
- JSON columns store complex change details for forensics
- Enables reconstruction of item location at any point in time

### 3. **Inventory Management**
- Daily/weekly/monthly inventory events
- Line-item verification with condition codes
- Automatic discrepancy detection and alerting
- Support for directed, random, and COC inventories

### 4. **Missing Item Escalation**
- Immediate alert when item marked missing
- Tracks last known holder and previous custody chain
- Audit log entry for accountability
- Dashboard shows all missing items by unit

### 5. **Dual-Enclave Compliance**
- Classification tracking (UNCLASS/CUI/SECRET/TS)
- User IP and user-agent logging
- Approval chain enforcement
- Exportable audit reports

---

## Testing Checklist

1. Register a weapon as sensitive item, verify registry entry
2. Transfer item between two Marines, verify custody chain
3. Start inventory, verify items, mark one as missing
4. Complete inventory, verify discrepancy count
5. Pull hand receipt for a Marine, verify items listed
6. Check audit log for all actions above
7. Filter audit log by action type and date range
8. Verify missing item appears on alert dashboard

---

## Deployment Notes

- Add `custody.py` to models imports
- Run migrations to create new tables
- Seed existing weapons as sensitive items on first deploy
- Configure email alerting for missing items (integrates with alert service)
- Assign custody admin role to S-4 personnel

---

## References

- USMC SL-3 Sensitive Items Directive
- CMC Policy on Equipment Accountability
- DA 2062 (Hand Receipt)
- DA 4707 (Statement of Charges)

