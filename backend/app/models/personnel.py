"""Personnel, weapons, ammo, and convoy assignment models."""

import enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
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


class PayGrade(str, enum.Enum):
    E1 = "E1"
    E2 = "E2"
    E3 = "E3"
    E4 = "E4"
    E5 = "E5"
    E6 = "E6"
    E7 = "E7"
    E8 = "E8"
    E9 = "E9"
    W1 = "W1"
    W2 = "W2"
    W3 = "W3"
    W4 = "W4"
    W5 = "W5"
    O1 = "O1"
    O2 = "O2"
    O3 = "O3"
    O4 = "O4"
    O5 = "O5"
    O6 = "O6"
    O7 = "O7"
    O8 = "O8"
    O9 = "O9"
    O10 = "O10"


class RifleQualification(str, enum.Enum):
    EXPERT = "EXPERT"
    SHARPSHOOTER = "SHARPSHOOTER"
    MARKSMAN = "MARKSMAN"
    UNQUAL = "UNQUAL"


class SwimQualification(str, enum.Enum):
    CWS1 = "CWS1"
    CWS2 = "CWS2"
    CWS3 = "CWS3"
    CWS4 = "CWS4"
    UNQUAL = "UNQUAL"


class SecurityClearance(str, enum.Enum):
    NONE = "NONE"
    CONFIDENTIAL = "CONFIDENTIAL"
    SECRET = "SECRET"
    TOP_SECRET = "TOP_SECRET"
    TS_SCI = "TS_SCI"


class DutyStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    UA = "UA"
    DESERTER = "DESERTER"
    AWOL = "AWOL"
    CONFINEMENT = "CONFINEMENT"
    LIMDU = "LIMDU"
    PTAD = "PTAD"


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

    # Manning & billet fields
    pay_grade = Column(SQLEnum(PayGrade), nullable=True)
    billet = Column(String(100), nullable=True)
    date_of_rank = Column(Date, nullable=True)
    eaos = Column(Date, nullable=True)
    pme_complete = Column(Boolean, default=False)

    # Qualifications & fitness
    rifle_qual = Column(SQLEnum(RifleQualification), nullable=True)
    rifle_qual_date = Column(Date, nullable=True)
    pft_score = Column(Integer, nullable=True)
    pft_date = Column(Date, nullable=True)
    cft_score = Column(Integer, nullable=True)
    cft_date = Column(Date, nullable=True)
    swim_qual = Column(SQLEnum(SwimQualification), nullable=True)

    # Security & admin
    security_clearance = Column(SQLEnum(SecurityClearance), nullable=True)
    clearance_expiry = Column(Date, nullable=True)
    drivers_license_military = Column(Boolean, default=False)
    duty_status = Column(SQLEnum(DutyStatus), nullable=True, default=DutyStatus.PRESENT)

    current_movement_id = Column(
        Integer,
        ForeignKey("movements.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit", back_populates="personnel")
    current_movement = relationship("Movement", foreign_keys=[current_movement_id])
    weapons = relationship(
        "Weapon", back_populates="personnel", cascade="all, delete-orphan"
    )
    ammo_loads = relationship(
        "AmmoLoad", back_populates="personnel", cascade="all, delete-orphan"
    )
    convoy_assignments = relationship("ConvoyPersonnel", back_populates="personnel")
    qualifications = relationship(
        "Qualification", back_populates="personnel", cascade="all, delete-orphan"
    )
    billet_assignments = relationship(
        "BilletStructure",
        foreign_keys="BilletStructure.filled_by_id",
        back_populates="assigned_personnel",
    )


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
    cargo = relationship(
        "ConvoyCargo", back_populates="convoy_vehicle", cascade="all, delete-orphan"
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
