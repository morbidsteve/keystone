"""Preventive maintenance schedule, deadline, and ERO models."""

import enum

from sqlalchemy import (
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


class PMType(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    ANNUAL = "ANNUAL"
    MILEAGE = "MILEAGE"


class DeadlineReason(str, enum.Enum):
    AWAITING_PARTS = "AWAITING_PARTS"
    AWAITING_REPAIR = "AWAITING_REPAIR"
    UNSCHEDULED_MAINTENANCE = "UNSCHEDULED_MAINTENANCE"
    SAFETY_ISSUE = "SAFETY_ISSUE"
    MODIFICATION_IN_PROGRESS = "MODIFICATION_IN_PROGRESS"
    PENDING_INSPECTION = "PENDING_INSPECTION"
    DEPOT_OVERHAUL = "DEPOT_OVERHAUL"


class EROStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    RECEIVED_BY_IMA = "RECEIVED_BY_IMA"
    IN_REPAIR = "IN_REPAIR"
    AWAITING_RETURN_SHIPMENT = "AWAITING_RETURN_SHIPMENT"
    RETURNED = "RETURNED"
    REJECTED = "REJECTED"


class PreventiveMaintenanceSchedule(Base):
    __tablename__ = "preventive_maintenance_schedules"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    equipment_id = Column(
        Integer, ForeignKey("equipment.id"), nullable=False, index=True
    )
    pm_type = Column(SQLEnum(PMType), nullable=False)
    interval_value = Column(Integer, nullable=False)
    last_performed = Column(DateTime(timezone=True), nullable=True)
    next_due = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit")
    equipment = relationship("Equipment")


class MaintenanceDeadline(Base):
    __tablename__ = "maintenance_deadlines"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    equipment_id = Column(
        Integer, ForeignKey("equipment.id"), nullable=False, index=True
    )
    deadline_date = Column(DateTime(timezone=True), server_default=func.now())
    reason = Column(SQLEnum(DeadlineReason), nullable=False)
    work_order_id = Column(
        Integer, ForeignKey("maintenance_work_orders.id"), nullable=True
    )
    lifted_date = Column(DateTime(timezone=True), nullable=True)
    lifted_by = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

    unit = relationship("Unit")
    equipment = relationship("Equipment")
    work_order = relationship("MaintenanceWorkOrder", back_populates="deadline_records")


class EquipmentRepairOrder(Base):
    __tablename__ = "equipment_repair_orders"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    equipment_id = Column(
        Integer, ForeignKey("equipment.id"), nullable=False, index=True
    )
    ero_number = Column(String(50), unique=True, nullable=False)
    submitted_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(
        SQLEnum(EROStatus), nullable=False, default=EROStatus.SUBMITTED
    )
    intermediate_maintenance_activity = Column(String(200), nullable=False)
    estimated_return_date = Column(DateTime(timezone=True), nullable=True)
    actual_return_date = Column(DateTime(timezone=True), nullable=True)
    work_order_id = Column(
        Integer, ForeignKey("maintenance_work_orders.id"), nullable=True
    )
    repair_description = Column(Text, nullable=True)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit")
    equipment = relationship("Equipment")
    work_order = relationship("MaintenanceWorkOrder", back_populates="ero")
