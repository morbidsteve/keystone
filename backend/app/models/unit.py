"""Unit model representing the USMC organizational hierarchy."""

import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Echelon(str, enum.Enum):
    MEF = "MEF"
    DIV = "DIV"
    REGT = "REGT"
    BN = "BN"
    CO = "CO"
    PLT = "PLT"
    SQD = "SQD"
    FT = "FT"
    INDV = "INDV"
    CUSTOM = "CUSTOM"


class Unit(Base):
    __tablename__ = "units"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    abbreviation = Column(String(30), nullable=False)
    echelon = Column(SQLEnum(Echelon), nullable=False)
    custom_echelon_name = Column(String(50), nullable=True)
    parent_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    uic = Column(String(10), unique=True, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    mgrs = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    parent = relationship("Unit", remote_side="Unit.id", back_populates="children")
    children = relationship("Unit", back_populates="parent")
    users = relationship("User", back_populates="unit")
    supply_statuses = relationship("SupplyStatusRecord", back_populates="unit")
    equipment_statuses = relationship("EquipmentStatus", back_populates="unit")
    movements = relationship("Movement", back_populates="unit")
    alerts = relationship("Alert", back_populates="unit")
