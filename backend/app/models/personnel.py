"""Personnel, weapons, ammo, and convoy assignment models."""

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


class PersonnelStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    DEPLOYED = "DEPLOYED"
    TDY = "TDY"
    LEAVE = "LEAVE"
    MEDICAL = "MEDICAL"
    INACTIVE = "INACTIVE"


class ConvoyRole(str, enum.Enum):
    DRIVER = "DRIVER"
    A_DRIVER = "A_DRIVER"
    GUNNER = "GUNNER"
    TC = "TC"
    VC = "VC"
    MEDIC = "MEDIC"
    PAX = "PAX"


class Personnel(Base):
    __tablename__ = "personnel"

    id = Column(Integer, primary_key=True, index=True)
    edipi = Column(String(10), unique=True, nullable=False, index=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    rank = Column(String(20), nullable=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True, index=True)
    mos = Column(String(10), nullable=True)
    blood_type = Column(String(5), nullable=True)
    status = Column(
        SQLEnum(PersonnelStatus), nullable=False, default=PersonnelStatus.ACTIVE
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit", back_populates="personnel")
    weapons = relationship(
        "Weapon", back_populates="personnel", cascade="all, delete-orphan"
    )
    ammo_loads = relationship(
        "AmmoLoad", back_populates="personnel", cascade="all, delete-orphan"
    )
    convoy_assignments = relationship("ConvoyPersonnel", back_populates="personnel")


class Weapon(Base):
    __tablename__ = "weapons"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(
        Integer, ForeignKey("personnel.id", ondelete="CASCADE"), nullable=False
    )
    weapon_type = Column(String(50), nullable=False)
    serial_number = Column(String(50), nullable=False)
    optic = Column(String(50), nullable=True)
    accessories = Column(Text, nullable=True)  # JSON string for SQLite compat

    personnel = relationship("Personnel", back_populates="weapons")


class AmmoLoad(Base):
    __tablename__ = "ammo_loads"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(
        Integer, ForeignKey("personnel.id", ondelete="CASCADE"), nullable=False
    )
    caliber = Column(String(20), nullable=False)
    magazine_count = Column(Integer, nullable=False)
    rounds_per_magazine = Column(Integer, nullable=False)
    total_rounds = Column(Integer, nullable=False)

    personnel = relationship("Personnel", back_populates="ammo_loads")


class ConvoyVehicle(Base):
    __tablename__ = "convoy_vehicles"

    id = Column(Integer, primary_key=True, index=True)
    movement_id = Column(
        Integer,
        ForeignKey("movements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    vehicle_type = Column(String(80), nullable=False)
    tamcn = Column(String(20), nullable=True)
    bumper_number = Column(String(20), nullable=True)
    call_sign = Column(String(30), nullable=True)
    sequence_number = Column(Integer, nullable=True)
    equipment_id = Column(
        Integer, ForeignKey("equipment.id"), nullable=True, index=True
    )

    movement = relationship("Movement", back_populates="convoy_vehicles")
    equipment = relationship(
        "Equipment", back_populates="convoy_vehicles", foreign_keys=[equipment_id]
    )
    assigned_personnel = relationship(
        "ConvoyPersonnel", back_populates="convoy_vehicle", cascade="all, delete-orphan"
    )


class ConvoyPersonnel(Base):
    __tablename__ = "convoy_personnel"

    id = Column(Integer, primary_key=True, index=True)
    movement_id = Column(
        Integer,
        ForeignKey("movements.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=False)
    convoy_vehicle_id = Column(
        Integer, ForeignKey("convoy_vehicles.id", ondelete="SET NULL"), nullable=True
    )
    role = Column(SQLEnum(ConvoyRole), nullable=False)

    movement = relationship("Movement", back_populates="convoy_personnel")
    personnel = relationship("Personnel", back_populates="convoy_assignments")
    convoy_vehicle = relationship("ConvoyVehicle", back_populates="assigned_personnel")
