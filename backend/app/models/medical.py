"""Medical logistics, CASEVAC, MTF, blood product, and burn rate models."""

import enum

from sqlalchemy import (
    Boolean,
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


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------


class CASEVACPrecedence(str, enum.Enum):
    """9-Line field 3 — evacuation precedence."""

    URGENT = "URGENT"
    URGENT_SURGICAL = "URGENT_SURGICAL"
    PRIORITY = "PRIORITY"
    ROUTINE = "ROUTINE"
    CONVENIENCE = "CONVENIENCE"


class SecurityAtPickup(str, enum.Enum):
    """9-Line field 6 — security at pickup site."""

    NO_ENEMY = "NO_ENEMY"
    POSSIBLE_ENEMY = "POSSIBLE_ENEMY"
    ENEMY_IN_AREA = "ENEMY_IN_AREA"
    ENEMY_CONTACT = "ENEMY_CONTACT"


class SpecialEquipmentRequired(str, enum.Enum):
    """9-Line field 5 — special equipment needed."""

    NONE = "NONE"
    HOIST = "HOIST"
    EXTRACTION = "EXTRACTION"
    VENTILATOR = "VENTILATOR"


class PatientType(str, enum.Enum):
    """9-Line field 7 — patient nationality/status classification."""

    US_MILITARY = "US_MILITARY"
    US_CIVILIAN = "US_CIVILIAN"
    NON_US_MILITARY = "NON_US_MILITARY"
    NON_US_CIVILIAN = "NON_US_CIVILIAN"
    EPW = "EPW"
    CHILD = "CHILD"


class MarkingMethod(str, enum.Enum):
    """9-Line field 4 — marking method at pickup site."""

    PANELS = "PANELS"
    PYROTECHNIC = "PYROTECHNIC"
    SMOKE = "SMOKE"
    NONE = "NONE"
    OTHER = "OTHER"


class NationalityStatus(str, enum.Enum):
    """9-Line field 8 — nationality and status."""

    US = "US"
    COALITION = "COALITION"
    NON_COALITION = "NON_COALITION"
    EPW = "EPW"
    CIVILIAN = "CIVILIAN"


class TriageCategory(str, enum.Enum):
    """Triage colour category."""

    IMMEDIATE = "IMMEDIATE"  # T1 / Red
    DELAYED = "DELAYED"  # T2 / Yellow
    MINIMAL = "MINIMAL"  # T3 / Green
    EXPECTANT = "EXPECTANT"  # T4 / Black


class EvacuationStatus(str, enum.Enum):
    """Evacuation workflow status."""

    REQUESTED = "REQUESTED"
    DISPATCHED = "DISPATCHED"
    EN_ROUTE = "EN_ROUTE"
    AT_PICKUP = "AT_PICKUP"
    IN_TRANSIT = "IN_TRANSIT"
    AT_FACILITY = "AT_FACILITY"
    RTD = "RTD"  # Returned to Duty
    CLOSED = "CLOSED"


class TransportMethod(str, enum.Enum):
    """Transport method for CASEVAC/MEDEVAC."""

    GROUND_AMBULANCE = "GROUND_AMBULANCE"
    ROTARY_WING = "ROTARY_WING"
    FIXED_WING = "FIXED_WING"
    LITTER_CARRY = "LITTER_CARRY"
    WALKING = "WALKING"
    VEHICLE_OPPORTUNITY = "VEHICLE_OPPORTUNITY"


class CasualtyReportStatus(str, enum.Enum):
    """Overall casualty report status."""

    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    CLOSED = "CLOSED"
    CANCELED = "CANCELED"


class MedicalTreatmentFacilityType(str, enum.Enum):
    """Medical Treatment Facility classification."""

    BAS = "BAS"  # Battalion Aid Station
    STP = "STP"  # Shock Trauma Platoon
    FRSS = "FRSS"  # Forward Resuscitative Surgical System
    ROLE2 = "ROLE2"  # Role 2 (Surgical Company)
    ROLE3 = "ROLE3"  # Role 3 (Combat Support Hospital)
    ROLE4 = "ROLE4"  # Role 4 (Definitive Care)
    CCP = "CCP"  # Casualty Collection Point


class MTFStatus(str, enum.Enum):
    """MTF operational status."""

    OPERATIONAL = "OPERATIONAL"
    DEGRADED = "DEGRADED"
    NON_OPERATIONAL = "NON_OPERATIONAL"
    RELOCATING = "RELOCATING"


class BloodProductType(str, enum.Enum):
    """Blood product classifications."""

    WHOLE_BLOOD = "WHOLE_BLOOD"
    PRBC = "PRBC"  # Packed Red Blood Cells
    FFP = "FFP"  # Fresh Frozen Plasma
    PLATELETS = "PLATELETS"
    CRYO = "CRYO"  # Cryoprecipitate


class BloodType(str, enum.Enum):
    """ABO + Rh blood types."""

    O_POS = "O_POS"
    O_NEG = "O_NEG"
    A_POS = "A_POS"
    A_NEG = "A_NEG"
    B_POS = "B_POS"
    B_NEG = "B_NEG"
    AB_POS = "AB_POS"
    AB_NEG = "AB_NEG"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class CasualtyReport(Base):
    """9-Line CASEVAC / MEDEVAC report for a single casualty event."""

    __tablename__ = "casualty_reports"

    id = Column(Integer, primary_key=True, index=True)
    casualty_id = Column(String(30), unique=True, nullable=False, index=True)

    # Linked personnel (nullable — may be unknown at report time)
    personnel_id = Column(
        Integer, ForeignKey("personnel.id"), nullable=True, index=True
    )
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    reported_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Incident
    incident_datetime = Column(DateTime(timezone=True), nullable=False)

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    mgrs = Column(String(20), nullable=True)
    location_description = Column(String(255), nullable=True)

    # 9-Line fields
    precedence = Column(
        SQLEnum(CASEVACPrecedence), nullable=False, default=CASEVACPrecedence.ROUTINE
    )
    number_of_patients = Column(Integer, nullable=False, default=1)
    special_equipment = Column(
        SQLEnum(SpecialEquipmentRequired),
        nullable=False,
        default=SpecialEquipmentRequired.NONE,
    )
    security_at_pickup = Column(
        SQLEnum(SecurityAtPickup),
        nullable=False,
        default=SecurityAtPickup.NO_ENEMY,
    )
    patient_type = Column(
        SQLEnum(PatientType), nullable=False, default=PatientType.US_MILITARY
    )
    marking_method = Column(
        SQLEnum(MarkingMethod), nullable=False, default=MarkingMethod.PANELS
    )
    nationality_status = Column(
        SQLEnum(NationalityStatus), nullable=False, default=NationalityStatus.US
    )
    nbc_contamination = Column(Boolean, nullable=False, default=False)

    # Injury detail
    mechanism_of_injury = Column(String(200), nullable=True)
    injuries_description = Column(Text, nullable=True)
    triage_category = Column(SQLEnum(TriageCategory), nullable=True)

    # TCCC interventions (JSON string for SQLite compat)
    tccc_interventions = Column(Text, nullable=True)

    # Evacuation workflow
    status = Column(
        SQLEnum(CasualtyReportStatus),
        nullable=False,
        default=CasualtyReportStatus.OPEN,
    )
    transport_method = Column(SQLEnum(TransportMethod), nullable=True)
    evacuation_status = Column(
        SQLEnum(EvacuationStatus),
        nullable=False,
        default=EvacuationStatus.REQUESTED,
    )
    receiving_facility_id = Column(
        Integer,
        ForeignKey("medical_treatment_facilities.id"),
        nullable=True,
    )
    pickup_time = Column(DateTime(timezone=True), nullable=True)
    arrival_at_facility_time = Column(DateTime(timezone=True), nullable=True)

    # Disposition / closure
    disposition = Column(String(200), nullable=True)
    remarks = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    personnel = relationship("Personnel", foreign_keys=[personnel_id])
    unit = relationship("Unit", foreign_keys=[unit_id])
    reported_by = relationship("User", foreign_keys=[reported_by_user_id])
    receiving_facility = relationship(
        "MedicalTreatmentFacility", foreign_keys=[receiving_facility_id]
    )
    logs = relationship(
        "CasualtyLog",
        back_populates="casualty_report",
        cascade="all, delete-orphan",
        order_by="CasualtyLog.event_time",
    )


class CasualtyLog(Base):
    """Event log entry for casualty evacuation workflow."""

    __tablename__ = "casualty_logs"

    id = Column(Integer, primary_key=True, index=True)
    casualty_report_id = Column(
        Integer,
        ForeignKey("casualty_reports.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type = Column(String(50), nullable=False)
    event_time = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    recorded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)

    casualty_report = relationship("CasualtyReport", back_populates="logs")
    recorded_by = relationship("User", foreign_keys=[recorded_by_user_id])


class MedicalTreatmentFacility(Base):
    """Medical Treatment Facility (BAS, STP, FRSS, Role 2-4, CCP)."""

    __tablename__ = "medical_treatment_facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    facility_type = Column(SQLEnum(MedicalTreatmentFacilityType), nullable=False)
    callsign = Column(String(30), nullable=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True, index=True)

    # Location
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    mgrs = Column(String(20), nullable=True)

    # Capacity
    capacity = Column(Integer, nullable=True)
    current_census = Column(Integer, nullable=False, default=0)
    status = Column(SQLEnum(MTFStatus), nullable=False, default=MTFStatus.OPERATIONAL)

    # Capabilities
    surgical = Column(Boolean, nullable=False, default=False)
    blood_bank = Column(Boolean, nullable=False, default=False)
    vent_capacity = Column(Integer, nullable=True, default=0)
    x_ray = Column(Boolean, nullable=False, default=False)
    ultrasound = Column(Boolean, nullable=False, default=False)
    dental = Column(Boolean, nullable=False, default=False)

    # Communications
    contact_freq = Column(String(30), nullable=True)
    alternate_freq = Column(String(30), nullable=True)
    phone = Column(String(30), nullable=True)

    # Staffing counts
    physician_count = Column(Integer, nullable=False, default=0)
    pa_count = Column(Integer, nullable=False, default=0)
    medic_count = Column(Integer, nullable=False, default=0)
    surgical_tech_count = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    unit = relationship("Unit", foreign_keys=[unit_id])
    casualties = relationship(
        "CasualtyReport",
        foreign_keys="CasualtyReport.receiving_facility_id",
        viewonly=True,
    )
    blood_inventory = relationship(
        "BloodProduct",
        back_populates="facility",
        cascade="all, delete-orphan",
    )


class MedicalSupplyBurnRate(Base):
    """Burn rate tracking for medical supplies per unit."""

    __tablename__ = "medical_supply_burn_rates"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(
        Integer,
        ForeignKey("units.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    supply_catalog_item_id = Column(
        Integer, ForeignKey("supply_catalog.id"), nullable=False, index=True
    )

    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    quantity_used = Column(Integer, nullable=False, default=0)
    quantity_on_hand = Column(Integer, nullable=False, default=0)
    days_of_supply = Column(Float, nullable=True)
    burn_rate_per_day = Column(Float, nullable=True)
    projected_exhaustion_date = Column(Date, nullable=True)
    critical_threshold = Column(Integer, nullable=False, default=3)
    warning_threshold = Column(Integer, nullable=False, default=7)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    unit = relationship("Unit", foreign_keys=[unit_id])
    supply_item = relationship(
        "SupplyCatalogItem", foreign_keys=[supply_catalog_item_id]
    )


class BloodProduct(Base):
    """Blood product inventory at a medical treatment facility."""

    __tablename__ = "blood_products"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(
        Integer,
        ForeignKey("medical_treatment_facilities.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    product_type = Column(SQLEnum(BloodProductType), nullable=False)
    blood_type = Column(SQLEnum(BloodType), nullable=False)
    units_on_hand = Column(Integer, nullable=False, default=0)
    units_used_24h = Column(Integer, nullable=False, default=0)
    expiration_date = Column(Date, nullable=True)
    walking_blood_bank_donors = Column(Integer, nullable=False, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    facility = relationship(
        "MedicalTreatmentFacility", back_populates="blood_inventory"
    )
