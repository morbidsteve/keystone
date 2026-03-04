"""Transportation / movement tracking model."""

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
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MovementStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    EN_ROUTE = "EN_ROUTE"
    COMPLETE = "COMPLETE"
    DELAYED = "DELAYED"


class Movement(Base):
    __tablename__ = "movements"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    convoy_id = Column(String(50), nullable=True)
    origin = Column(String(100), nullable=False)
    destination = Column(String(100), nullable=False)
    departure_time = Column(DateTime(timezone=True), nullable=True)
    eta = Column(DateTime(timezone=True), nullable=True)
    actual_arrival = Column(DateTime(timezone=True), nullable=True)
    vehicle_count = Column(Integer, nullable=False, default=0)
    cargo_description = Column(Text, nullable=True)
    origin_lat = Column(Float, nullable=True)
    origin_lon = Column(Float, nullable=True)
    origin_mgrs = Column(String(20), nullable=True)
    dest_lat = Column(Float, nullable=True)
    dest_lon = Column(Float, nullable=True)
    dest_mgrs = Column(String(20), nullable=True)
    current_lat = Column(Float, nullable=True)
    current_lon = Column(Float, nullable=True)
    current_mgrs = Column(String(20), nullable=True)
    heading = Column(Float, nullable=True)
    speed_kph = Column(Float, nullable=True)
    status = Column(
        SQLEnum(MovementStatus), nullable=False, default=MovementStatus.PLANNED
    )
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    source = Column(String(50), nullable=True)
    raw_data_id = Column(Integer, ForeignKey("raw_data.id"), nullable=True)

    unit = relationship("Unit", back_populates="movements")
    convoy_vehicles = relationship(
        "ConvoyVehicle", back_populates="movement", cascade="all, delete-orphan"
    )
    convoy_personnel = relationship(
        "ConvoyPersonnel", back_populates="movement", cascade="all, delete-orphan"
    )
