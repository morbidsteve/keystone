"""Convoy planning, serial management, and lift request models."""

import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ConvoyPlanStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    EXECUTING = "EXECUTING"
    COMPLETE = "COMPLETE"
    CANCELED = "CANCELED"


class RiskAssessmentLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


class LiftRequestPriority(str, enum.Enum):
    ROUTINE = "ROUTINE"
    PRIORITY = "PRIORITY"
    EMERGENCY = "EMERGENCY"


class LiftRequestStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    SCHEDULED = "SCHEDULED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELED = "CANCELED"


class CargoType(str, enum.Enum):
    PERSONNEL = "PERSONNEL"
    EQUIPMENT = "EQUIPMENT"
    SUPPLY = "SUPPLY"
    MIXED = "MIXED"


class ConvoyPlan(Base):
    __tablename__ = "convoy_plans"
    __table_args__ = (
        Index("ix_convoy_plans_unit_status", "unit_id", "status"),
        Index("ix_convoy_plans_created_by", "created_by"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    route_name = Column(String(100), nullable=True)
    route_description = Column(Text, nullable=True)
    total_distance_km = Column(Float, nullable=True)
    estimated_duration_hours = Column(Float, nullable=True)

    route_primary = Column(Text, nullable=True)
    route_alternate = Column(Text, nullable=True)

    departure_time_planned = Column(DateTime(timezone=True), nullable=True)
    sp_time = Column(DateTime(timezone=True), nullable=True)
    rp_time = Column(DateTime(timezone=True), nullable=True)
    brief_time = Column(DateTime(timezone=True), nullable=True)
    rehearsal_time = Column(DateTime(timezone=True), nullable=True)

    movement_credit_number = Column(String(50), nullable=True)
    convoy_commander_id = Column(
        Integer, ForeignKey("personnel.id"), nullable=True
    )

    status = Column(
        SQLEnum(ConvoyPlanStatus),
        nullable=False,
        default=ConvoyPlanStatus.DRAFT,
    )
    risk_assessment_level = Column(
        SQLEnum(RiskAssessmentLevel),
        nullable=False,
        default=RiskAssessmentLevel.MEDIUM,
    )

    comm_plan = Column(Text, nullable=True)
    recovery_plan = Column(Text, nullable=True)
    medevac_plan = Column(Text, nullable=True)

    unit = relationship("Unit")
    created_by_user = relationship("User", foreign_keys=[created_by])
    convoy_commander = relationship("Personnel", foreign_keys=[convoy_commander_id])
    serials = relationship(
        "ConvoySerial",
        back_populates="convoy_plan",
        cascade="all, delete-orphan",
    )


class ConvoySerial(Base):
    __tablename__ = "convoy_serials"

    id = Column(Integer, primary_key=True, index=True)
    convoy_plan_id = Column(
        Integer, ForeignKey("convoy_plans.id", ondelete="CASCADE"), nullable=False
    )
    serial_number = Column(String(10), nullable=False)
    serial_commander_id = Column(
        Integer, ForeignKey("personnel.id"), nullable=True
    )
    vehicle_count = Column(Integer, nullable=False, default=0)
    pax_count = Column(Integer, nullable=False, default=0)
    march_order = Column(Integer, nullable=True)
    march_speed_kph = Column(Float, nullable=False, default=40.0)
    catch_up_speed_kph = Column(Float, nullable=False, default=60.0)
    interval_meters = Column(Integer, nullable=False, default=50)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    convoy_plan = relationship("ConvoyPlan", back_populates="serials")
    serial_commander = relationship("Personnel", foreign_keys=[serial_commander_id])


class LiftRequest(Base):
    __tablename__ = "lift_requests"
    __table_args__ = (
        Index("ix_lift_requests_requesting_unit", "requesting_unit_id"),
        Index("ix_lift_requests_assigned_movement", "assigned_movement_id"),
        Index("ix_lift_requests_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    requesting_unit_id = Column(
        Integer, ForeignKey("units.id"), nullable=False
    )
    supporting_unit_id = Column(
        Integer, ForeignKey("units.id"), nullable=True
    )

    cargo_type = Column(SQLEnum(CargoType), nullable=False)
    cargo_description = Column(Text, nullable=True)
    weight_lbs = Column(Integer, nullable=True)
    cube_ft = Column(Float, nullable=True)
    pax_count = Column(Integer, nullable=False, default=0)
    hazmat = Column(Boolean, nullable=False, default=False)

    priority = Column(
        SQLEnum(LiftRequestPriority),
        nullable=False,
        default=LiftRequestPriority.ROUTINE,
    )
    required_delivery_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(
        SQLEnum(LiftRequestStatus),
        nullable=False,
        default=LiftRequestStatus.REQUESTED,
    )

    pickup_location = Column(String(150), nullable=True)
    pickup_lat = Column(Float, nullable=True)
    pickup_lon = Column(Float, nullable=True)
    delivery_location = Column(String(150), nullable=True)
    delivery_lat = Column(Float, nullable=True)
    delivery_lon = Column(Float, nullable=True)

    assigned_movement_id = Column(
        Integer, ForeignKey("movements.id"), nullable=True
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    requesting_unit = relationship(
        "Unit", foreign_keys=[requesting_unit_id]
    )
    supporting_unit = relationship(
        "Unit", foreign_keys=[supporting_unit_id]
    )
    assigned_movement = relationship("Movement", foreign_keys=[assigned_movement_id])
