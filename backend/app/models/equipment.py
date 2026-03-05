"""Equipment status tracking and individual equipment asset models."""

import enum

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


class EquipmentStatus(Base):
    __tablename__ = "equipment_statuses"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    tamcn = Column(String(20), nullable=False)
    nomenclature = Column(String(100), nullable=False)
    total_possessed = Column(Integer, nullable=False)
    mission_capable = Column(Integer, nullable=False)
    not_mission_capable_maintenance = Column(Integer, nullable=False, default=0)
    not_mission_capable_supply = Column(Integer, nullable=False, default=0)
    readiness_pct = Column(Float, nullable=False)
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    source = Column(String(50), nullable=True)
    raw_data_id = Column(Integer, ForeignKey("raw_data.id"), nullable=True)
    catalog_item_id = Column(Integer, ForeignKey("equipment_catalog.id"), nullable=True)

    unit = relationship("Unit", back_populates="equipment_statuses")


# --- Individual equipment asset models ---


class EquipmentAssetStatus(str, enum.Enum):
    FMC = "FMC"
    NMC_M = "NMC_M"
    NMC_S = "NMC_S"
    ADMIN = "ADMIN"
    DEADLINED = "DEADLINED"


class FaultSeverity(str, enum.Enum):
    SAFETY = "SAFETY"
    MAJOR = "MAJOR"
    MINOR = "MINOR"
    COSMETIC = "COSMETIC"


class Equipment(Base):
    __tablename__ = "equipment"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    equipment_type = Column(String(80), nullable=False)
    tamcn = Column(String(20), nullable=False)
    nomenclature = Column(String(100), nullable=False)
    bumper_number = Column(String(20), unique=True, nullable=False)
    serial_number = Column(String(50), nullable=True)
    usmc_id = Column(String(30), nullable=True)
    status = Column(
        SQLEnum(EquipmentAssetStatus),
        nullable=False,
        default=EquipmentAssetStatus.FMC,
    )
    odometer_miles = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit", back_populates="equipment_assets")
    work_orders = relationship(
        "MaintenanceWorkOrder",
        back_populates="individual_equipment",
        foreign_keys="MaintenanceWorkOrder.individual_equipment_id",
    )
    faults = relationship(
        "EquipmentFault", back_populates="equipment", cascade="all, delete-orphan"
    )
    driver_assignments = relationship(
        "EquipmentDriverAssignment",
        back_populates="equipment",
        cascade="all, delete-orphan",
    )
    convoy_vehicles = relationship(
        "ConvoyVehicle",
        back_populates="equipment",
        foreign_keys="ConvoyVehicle.equipment_id",
    )


class EquipmentFault(Base):
    __tablename__ = "equipment_faults"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(
        Integer,
        ForeignKey("equipment.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    fault_description = Column(Text, nullable=False)
    severity = Column(SQLEnum(FaultSeverity), nullable=False)
    reported_by = Column(String(100), nullable=False)
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    work_order_id = Column(
        Integer, ForeignKey("maintenance_work_orders.id"), nullable=True
    )

    equipment = relationship("Equipment", back_populates="faults")
    work_order = relationship("MaintenanceWorkOrder")


class EquipmentDriverAssignment(Base):
    __tablename__ = "equipment_driver_assignments"

    id = Column(Integer, primary_key=True, index=True)
    equipment_id = Column(
        Integer,
        ForeignKey("equipment.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    personnel_id = Column(
        Integer, ForeignKey("personnel.id"), nullable=False, index=True
    )
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    released_at = Column(DateTime(timezone=True), nullable=True)
    is_primary = Column(Boolean, default=True)

    equipment = relationship("Equipment", back_populates="driver_assignments")
    personnel = relationship("Personnel")
