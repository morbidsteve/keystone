"""Maintenance work order, parts, and labor models."""

import enum

from sqlalchemy import (
    Column,
    Date,
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


class WorkOrderStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    AWAITING_PARTS = "AWAITING_PARTS"
    COMPLETE = "COMPLETE"


class WorkOrderCategory(str, enum.Enum):
    CORRECTIVE = "CORRECTIVE"
    PREVENTIVE = "PREVENTIVE"
    MODIFICATION = "MODIFICATION"
    INSPECTION = "INSPECTION"


class PartSource(str, enum.Enum):
    ON_HAND = "ON_HAND"
    ON_ORDER = "ON_ORDER"
    CANNIBALIZED = "CANNIBALIZED"
    LOCAL_PURCHASE = "LOCAL_PURCHASE"


class PartStatus(str, enum.Enum):
    NEEDED = "NEEDED"
    ON_ORDER = "ON_ORDER"
    RECEIVED = "RECEIVED"
    INSTALLED = "INSTALLED"


class LaborType(str, enum.Enum):
    INSPECT = "INSPECT"
    DIAGNOSE = "DIAGNOSE"
    REPAIR = "REPAIR"
    REPLACE = "REPLACE"
    TEST = "TEST"


class EchelonOfMaintenance(str, enum.Enum):
    FIRST = "FIRST"
    SECOND = "SECOND"
    THIRD = "THIRD"
    FOURTH = "FOURTH"
    FIFTH = "FIFTH"


class MaintenanceLevel(str, enum.Enum):
    ORGANIZATIONAL = "ORGANIZATIONAL"
    INTERMEDIATE = "INTERMEDIATE"
    DEPOT = "DEPOT"


class MaintenanceWorkOrder(Base):
    __tablename__ = "maintenance_work_orders"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment_statuses.id"), nullable=True)
    individual_equipment_id = Column(
        Integer, ForeignKey("equipment.id"), nullable=True, index=True
    )
    work_order_number = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        SQLEnum(WorkOrderStatus), nullable=False, default=WorkOrderStatus.OPEN
    )
    category = Column(SQLEnum(WorkOrderCategory), nullable=True)
    priority = Column(Integer, nullable=False, default=3)
    parts_required = Column(Text, nullable=True)
    estimated_completion = Column(DateTime(timezone=True), nullable=True)
    actual_hours = Column(Float, nullable=True)
    location = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    assigned_to = Column(String(100), nullable=True)

    # Extended maintenance tracking columns
    echelon_of_maintenance = Column(SQLEnum(EchelonOfMaintenance), nullable=True)
    maintenance_level = Column(SQLEnum(MaintenanceLevel), nullable=True)
    deadline_date = Column(DateTime(timezone=True), nullable=True)
    eri_date = Column(DateTime(timezone=True), nullable=True)
    erb_number = Column(String(50), nullable=True)
    downtime_hours = Column(Float, nullable=True)
    nmcs_since = Column(DateTime(timezone=True), nullable=True)
    nmcm_since = Column(DateTime(timezone=True), nullable=True)

    individual_equipment = relationship(
        "Equipment",
        back_populates="work_orders",
        foreign_keys=[individual_equipment_id],
    )
    parts = relationship(
        "MaintenancePart",
        back_populates="work_order",
        cascade="all, delete-orphan",
    )
    labor_entries = relationship(
        "MaintenanceLabor",
        back_populates="work_order",
        cascade="all, delete-orphan",
    )
    deadline_records = relationship(
        "MaintenanceDeadline",
        back_populates="work_order",
    )
    ero = relationship(
        "EquipmentRepairOrder",
        back_populates="work_order",
        uselist=False,
    )


class MaintenancePart(Base):
    __tablename__ = "maintenance_parts"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(
        Integer,
        ForeignKey("maintenance_work_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    nsn = Column(String(20), nullable=True)
    part_number = Column(String(50), nullable=False)
    nomenclature = Column(String(100), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_cost = Column(Float, nullable=True)
    source = Column(SQLEnum(PartSource), nullable=False, default=PartSource.ON_HAND)
    status = Column(SQLEnum(PartStatus), nullable=False, default=PartStatus.NEEDED)

    work_order = relationship("MaintenanceWorkOrder", back_populates="parts")


class MaintenanceLabor(Base):
    __tablename__ = "maintenance_labor"

    id = Column(Integer, primary_key=True, index=True)
    work_order_id = Column(
        Integer,
        ForeignKey("maintenance_work_orders.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    personnel_id = Column(
        Integer, ForeignKey("personnel.id"), nullable=False, index=True
    )
    labor_type = Column(SQLEnum(LaborType), nullable=False)
    hours = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    notes = Column(Text, nullable=True)

    work_order = relationship("MaintenanceWorkOrder", back_populates="labor_entries")
    personnel = relationship("Personnel")
