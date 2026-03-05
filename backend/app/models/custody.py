"""Audit chain of custody & accountability models — sensitive items, transfers, inventories, audit log."""

import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class SensitiveItemType(str, enum.Enum):
    WEAPON = "WEAPON"
    OPTIC = "OPTIC"
    NVG = "NVG"
    CRYPTO = "CRYPTO"
    RADIO = "RADIO"
    COMSEC = "COMSEC"
    CLASSIFIED_DOCUMENT = "CLASSIFIED_DOCUMENT"
    EXPLOSIVE = "EXPLOSIVE"
    MISSILE = "MISSILE"
    OTHER = "OTHER"


class SecurityClassification(str, enum.Enum):
    UNCLASSIFIED = "UNCLASSIFIED"
    CUI = "CUI"
    CONFIDENTIAL = "CONFIDENTIAL"
    SECRET = "SECRET"
    TOP_SECRET = "TOP_SECRET"
    TS_SCI = "TS_SCI"


class ItemConditionCode(str, enum.Enum):
    A = "A"  # Serviceable
    B = "B"  # Serviceable with minor defects
    C = "C"  # Serviceable with major defects
    D = "D"  # Unserviceable — repairable
    F = "F"  # Unserviceable — condemned
    H = "H"  # Unserviceable — incomplete


class SensitiveItemStatus(str, enum.Enum):
    ON_HAND = "ON_HAND"
    ISSUED = "ISSUED"
    IN_TRANSIT = "IN_TRANSIT"
    IN_MAINTENANCE = "IN_MAINTENANCE"
    MISSING = "MISSING"
    LOST = "LOST"
    DESTROYED = "DESTROYED"
    TRANSFERRED = "TRANSFERRED"


class TransferType(str, enum.Enum):
    ISSUE = "ISSUE"
    TURN_IN = "TURN_IN"
    LATERAL_TRANSFER = "LATERAL_TRANSFER"
    TEMPORARY_LOAN = "TEMPORARY_LOAN"
    MAINTENANCE_TURN_IN = "MAINTENANCE_TURN_IN"
    MAINTENANCE_RETURN = "MAINTENANCE_RETURN"
    INVENTORY_ADJUSTMENT = "INVENTORY_ADJUSTMENT"


class InventoryType(str, enum.Enum):
    CYCLIC = "CYCLIC"
    SENSITIVE_ITEM = "SENSITIVE_ITEM"
    CHANGE_OF_COMMAND = "CHANGE_OF_COMMAND"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    ANNUAL = "ANNUAL"
    DIRECTED = "DIRECTED"
    LOSS_INVESTIGATION = "LOSS_INVESTIGATION"


class InventoryStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class DiscrepancyType(str, enum.Enum):
    NONE = "NONE"
    NOT_FOUND = "NOT_FOUND"
    WRONG_LOCATION = "WRONG_LOCATION"
    WRONG_HOLDER = "WRONG_HOLDER"
    CONDITION_CHANGED = "CONDITION_CHANGED"
    SERIAL_MISMATCH = "SERIAL_MISMATCH"


class AuditAction(str, enum.Enum):
    CREATE = "CREATE"
    UPDATE = "UPDATE"
    DELETE = "DELETE"
    VIEW = "VIEW"
    TRANSFER = "TRANSFER"
    STATUS_CHANGE = "STATUS_CHANGE"
    INVENTORY_START = "INVENTORY_START"
    INVENTORY_COMPLETE = "INVENTORY_COMPLETE"
    ITEM_VERIFIED = "ITEM_VERIFIED"
    LOGIN = "LOGIN"
    LOGOUT = "LOGOUT"
    PERMISSION_CHANGE = "PERMISSION_CHANGE"
    EXPORT = "EXPORT"


class AuditEntityType(str, enum.Enum):
    SENSITIVE_ITEM = "SENSITIVE_ITEM"
    CUSTODY_TRANSFER = "CUSTODY_TRANSFER"
    INVENTORY_EVENT = "INVENTORY_EVENT"
    USER = "USER"
    UNIT = "UNIT"
    PERSONNEL = "PERSONNEL"
    REPORT = "REPORT"
    SYSTEM = "SYSTEM"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class SensitiveItem(Base):
    __tablename__ = "sensitive_items"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    item_type = Column(SQLEnum(SensitiveItemType), nullable=False)
    serial_number = Column(String(100), unique=True, nullable=False, index=True)
    nomenclature = Column(String(200), nullable=False)
    nsn = Column(String(15), nullable=True)
    tamcn = Column(String(20), nullable=True)
    security_classification = Column(
        SQLEnum(SecurityClassification),
        nullable=False,
        default=SecurityClassification.UNCLASSIFIED,
    )
    condition_code = Column(
        SQLEnum(ItemConditionCode),
        nullable=False,
        default=ItemConditionCode.A,
    )
    status = Column(
        SQLEnum(SensitiveItemStatus),
        nullable=False,
        default=SensitiveItemStatus.ON_HAND,
    )

    # Custody tracking
    current_holder_id = Column(
        Integer, ForeignKey("personnel.id"), nullable=True, index=True
    )
    hand_receipt_number = Column(String(50), nullable=True)

    # Metadata
    notes = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit")
    current_holder = relationship("Personnel")
    created_by = relationship("User", foreign_keys=[created_by_user_id])
    updated_by = relationship("User", foreign_keys=[updated_by_user_id])
    transfers = relationship(
        "CustodyTransfer",
        back_populates="sensitive_item",
        order_by="CustodyTransfer.transferred_at.desc()",
    )


class CustodyTransfer(Base):
    __tablename__ = "custody_transfers"

    id = Column(Integer, primary_key=True, index=True)
    sensitive_item_id = Column(
        Integer, ForeignKey("sensitive_items.id"), nullable=False, index=True
    )
    transfer_type = Column(SQLEnum(TransferType), nullable=False)

    # From / To
    from_personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=True)
    to_personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=True)
    from_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    to_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)

    # Documentation
    document_number = Column(String(50), nullable=True)
    reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    # Audit
    transferred_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transferred_at = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    sensitive_item = relationship("SensitiveItem", back_populates="transfers")
    from_personnel = relationship("Personnel", foreign_keys=[from_personnel_id])
    to_personnel = relationship("Personnel", foreign_keys=[to_personnel_id])
    from_unit = relationship("Unit", foreign_keys=[from_unit_id])
    to_unit = relationship("Unit", foreign_keys=[to_unit_id])
    transferred_by = relationship("User", foreign_keys=[transferred_by_user_id])


class InventoryEvent(Base):
    __tablename__ = "inventory_events"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    inventory_type = Column(SQLEnum(InventoryType), nullable=False)
    status = Column(
        SQLEnum(InventoryStatus),
        nullable=False,
        default=InventoryStatus.PLANNED,
    )

    # Timing
    scheduled_date = Column(DateTime(timezone=True), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    # Results
    total_items = Column(Integer, default=0)
    items_verified = Column(Integer, default=0)
    discrepancies_found = Column(Integer, default=0)

    notes = Column(Text, nullable=True)
    conducted_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit")
    conducted_by = relationship("User", foreign_keys=[conducted_by_user_id])
    line_items = relationship(
        "InventoryLineItem",
        back_populates="inventory_event",
        cascade="all, delete-orphan",
    )


class InventoryLineItem(Base):
    __tablename__ = "inventory_line_items"

    id = Column(Integer, primary_key=True, index=True)
    inventory_event_id = Column(
        Integer, ForeignKey("inventory_events.id"), nullable=False, index=True
    )
    sensitive_item_id = Column(
        Integer, ForeignKey("sensitive_items.id"), nullable=False, index=True
    )

    verified = Column(Boolean, default=False)
    serial_number_verified = Column(Boolean, default=False)
    condition_code = Column(SQLEnum(ItemConditionCode), nullable=True)
    discrepancy_type = Column(
        SQLEnum(DiscrepancyType),
        nullable=False,
        default=DiscrepancyType.NONE,
    )
    discrepancy_notes = Column(Text, nullable=True)

    verified_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    inventory_event = relationship("InventoryEvent", back_populates="line_items")
    sensitive_item = relationship("SensitiveItem")
    verified_by = relationship("User", foreign_keys=[verified_by_user_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action = Column(SQLEnum(AuditAction), nullable=False, index=True)
    entity_type = Column(SQLEnum(AuditEntityType), nullable=False, index=True)
    entity_id = Column(Integer, nullable=True, index=True)
    description = Column(Text, nullable=False)

    # Change tracking
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)

    # Request metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User")
