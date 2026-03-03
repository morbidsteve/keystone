"""Location tracking and supply point models for map view."""

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
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class EntityType(str, enum.Enum):
    UNIT = "UNIT"
    CONVOY = "CONVOY"
    SUPPLY_POINT = "SUPPLY_POINT"
    MAINTENANCE_SITE = "MAINTENANCE_SITE"
    LZ = "LZ"
    FARP = "FARP"


class PositionSource(str, enum.Enum):
    TAK = "TAK"
    CONFIGURED = "CONFIGURED"
    MIRC_PARSED = "MIRC_PARSED"
    MANUAL = "MANUAL"


class SupplyPointType(str, enum.Enum):
    LOG_BASE = "LOG_BASE"
    SUPPLY_POINT = "SUPPLY_POINT"
    FARP = "FARP"
    LZ = "LZ"
    BEACH = "BEACH"
    PORT = "PORT"
    AMMO_SUPPLY_POINT = "AMMO_SUPPLY_POINT"
    WATER_POINT = "WATER_POINT"
    MAINTENANCE_COLLECTION_POINT = "MAINTENANCE_COLLECTION_POINT"


class SupplyPointStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PLANNED = "PLANNED"
    INACTIVE = "INACTIVE"


class RouteStatus(str, enum.Enum):
    OPEN = "OPEN"
    RESTRICTED = "RESTRICTED"
    CLOSED = "CLOSED"


class RouteType(str, enum.Enum):
    MSR = "MSR"
    ASR = "ASR"
    SUPPLY_ROUTE = "SUPPLY_ROUTE"


class Location(Base):
    """Tracks the last known position of any entity."""

    __tablename__ = "locations"

    id = Column(Integer, primary_key=True, index=True)
    entity_type = Column(SQLEnum(EntityType), nullable=False, index=True)
    entity_id = Column(Integer, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    altitude = Column(Float, nullable=True)
    heading = Column(Float, nullable=True)
    speed_kph = Column(Float, nullable=True)
    position_source = Column(SQLEnum(PositionSource), default=PositionSource.CONFIGURED)
    position_accuracy_m = Column(Float, nullable=True)
    last_updated = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class SupplyPoint(Base):
    """Fixed logistics node (supply point, FARP, LZ, etc.)."""

    __tablename__ = "supply_points"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    point_type = Column(SQLEnum(SupplyPointType), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    parent_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    status = Column(SQLEnum(SupplyPointStatus), default=SupplyPointStatus.ACTIVE)
    capacity_notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parent_unit = relationship("Unit")
    creator = relationship("User")


class Route(Base):
    """Main Supply Route (MSR) or Alternate Supply Route (ASR)."""

    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    route_type = Column(SQLEnum(RouteType), nullable=False)
    status = Column(SQLEnum(RouteStatus), default=RouteStatus.OPEN)
    waypoints = Column(JSON, nullable=False, default=list)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
