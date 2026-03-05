"""Fuel/POL management models — storage points, transactions, consumption rates, forecasts."""

import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class FuelFacilityType(str, enum.Enum):
    FARP = "FARP"
    FSP = "FSP"
    BSA_FUEL_POINT = "BSA_FUEL_POINT"
    MOBILE_REFUELER = "MOBILE_REFUELER"
    BLADDER_FARM = "BLADDER_FARM"
    TANK_FARM = "TANK_FARM"
    DISTRIBUTED_CACHE = "DISTRIBUTED_CACHE"


class FuelType(str, enum.Enum):
    JP8 = "JP8"
    JP5 = "JP5"
    DF2 = "DF2"
    MOGAS = "MOGAS"
    OIL_ENGINE = "OIL_ENGINE"
    HYDRAULIC_FLUID = "HYDRAULIC_FLUID"
    COOLANT = "COOLANT"
    MIXED = "MIXED"


class FuelStorageStatus(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL"
    DEGRADED = "DEGRADED"
    NON_OPERATIONAL = "NON_OPERATIONAL"
    DRY = "DRY"


class FuelTransactionType(str, enum.Enum):
    RECEIPT = "RECEIPT"
    ISSUE = "ISSUE"
    TRANSFER = "TRANSFER"
    LOSS = "LOSS"
    SAMPLE = "SAMPLE"


class ConsumptionSource(str, enum.Enum):
    MANUAL = "MANUAL"
    CALCULATED = "CALCULATED"
    TM_REFERENCE = "TM_REFERENCE"


class OperationalTempo(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    SURGE = "SURGE"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class FuelStoragePoint(Base):
    __tablename__ = "fuel_storage_points"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    facility_type = Column(SQLEnum(FuelFacilityType), nullable=False)
    fuel_type = Column(SQLEnum(FuelType), nullable=False)
    capacity_gallons = Column(Float, nullable=False)
    current_gallons = Column(Float, nullable=False, default=0.0)
    status = Column(SQLEnum(FuelStorageStatus), default=FuelStorageStatus.OPERATIONAL)

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    mgrs = Column(String(20), nullable=True)
    location_description = Column(Text, nullable=True)

    # Resupply tracking
    last_resupply_date = Column(DateTime(timezone=True), nullable=True)
    next_resupply_eta = Column(DateTime(timezone=True), nullable=True)

    # Optional equipment link (for mobile refuelers)
    equipment_id = Column(Integer, ForeignKey("equipment_catalog.id"), nullable=True)

    # Audit
    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    unit = relationship("Unit")
    transactions = relationship("FuelTransaction", back_populates="storage_point")


class FuelTransaction(Base):
    __tablename__ = "fuel_transactions"

    id = Column(Integer, primary_key=True, index=True)
    storage_point_id = Column(Integer, ForeignKey("fuel_storage_points.id"), nullable=False, index=True)
    transaction_type = Column(SQLEnum(FuelTransactionType), nullable=False)
    fuel_type = Column(SQLEnum(FuelType), nullable=False)
    quantity_gallons = Column(Float, nullable=False)

    receiving_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    vehicle_bumper_number = Column(String(50), nullable=True)
    vehicle_type = Column(String(100), nullable=True)
    document_number = Column(String(50), nullable=True)

    meter_reading_before = Column(Float, nullable=True)
    meter_reading_after = Column(Float, nullable=True)
    notes = Column(Text, nullable=True)

    performed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    storage_point = relationship("FuelStoragePoint", back_populates="transactions")
    performed_by = relationship("User")


class FuelConsumptionRate(Base):
    __tablename__ = "fuel_consumption_rates"

    id = Column(Integer, primary_key=True, index=True)
    equipment_catalog_item_id = Column(Integer, ForeignKey("equipment_catalog.id"), nullable=False)
    fuel_type = Column(SQLEnum(FuelType), nullable=False)

    gallons_per_hour_idle = Column(Float, default=0.0)
    gallons_per_hour_tactical = Column(Float, default=0.0)
    gallons_per_mile = Column(Float, nullable=True)
    gallons_per_flight_hour = Column(Float, nullable=True)

    source = Column(SQLEnum(ConsumptionSource), default=ConsumptionSource.MANUAL)
    notes = Column(Text, nullable=True)

    updated_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    equipment = relationship("EquipmentCatalogItem")

    __table_args__ = (
        UniqueConstraint("equipment_catalog_item_id", "fuel_type", name="uc_equipment_fuel_rate"),
    )


class FuelForecast(Base):
    __tablename__ = "fuel_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)

    forecast_date = Column(DateTime(timezone=True), server_default=func.now())
    operational_tempo = Column(SQLEnum(OperationalTempo), nullable=False)
    forecast_period_days = Column(Integer, default=7)

    projected_daily_consumption_gallons = Column(Float, nullable=False)
    current_on_hand_gallons = Column(Float, nullable=False)
    days_of_supply = Column(Float, nullable=False)
    resupply_required_by_date = Column(DateTime(timezone=True), nullable=False)

    notes = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    unit = relationship("Unit")
    created_by = relationship("User")
