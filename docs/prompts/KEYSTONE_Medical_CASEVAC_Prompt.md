# KEYSTONE — Medical Logistics & CASEVAC Tracking: Full Implementation

## Mission

Integrate a comprehensive medical logistics and CASEVAC (Casualty Evacuation) tracking module into KEYSTONE. This module enables:

1. **9-Line CASEVAC Reporting** — Real-time casualty reports following USMC/TCCC protocols
2. **Medical Treatment Facility (MTF) Management** — BAS, STP, FRSS, ROLE2, ROLE3 tracking with capacity
3. **Blood Product Inventory** — Whole blood, PRBC, FFP, walking blood bank management
4. **Medical Supply Burn Rates** — Class VIII consumption forecasting with exhaustion projections
5. **Evacuation Workflow** — Route from incident through triage to definitive care
6. **Interactive Medical Dashboard** — Casualty tracker, MTF map overlays, burn rate charts, PERSTAT medical widget
7. **USMC Medical Intelligence** — Integration with personnel blood types, triage categories, and TCCC interventions

---

## Part 1: Database Models

### 1.1 New Model: `CasualtyReport` (9-Line CASEVAC)

**File:** `backend/app/models/medical.py`

```python
"""Medical logistics, casualty evacuation, and TCCC-based tracking."""

import enum
from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    Column, DateTime, Float, Integer, String, Text, Boolean, Date,
    Enum as SQLEnum, ForeignKey, JSON, func
)
from sqlalchemy.orm import relationship
from app.database import Base


# ─── ENUMS ────────────────────────────────────────────────────────────────

class CASEVACPrecedence(str, enum.Enum):
    """CASEVAC/MEDEVAC precedence levels (9-Line Item 1)."""
    URGENT_SURGICAL = "URGENT_SURGICAL"  # T1, life-threatening, surgery needed
    URGENT = "URGENT"                    # Urgent, NOT surgical
    PRIORITY = "PRIORITY"                # Can wait 4 hours
    ROUTINE = "ROUTINE"                  # Can wait 24 hours
    CONVENIENCE = "CONVENIENCE"          # Medical convenience (non-emergency)


class SecurityAtPickup(str, enum.Enum):
    """Tactical situation at pickup location (9-Line Item 4)."""
    NO_ENEMY = "NO_ENEMY"
    POSSIBLE_ENEMY = "POSSIBLE_ENEMY"
    ENEMY_IN_AREA = "ENEMY_IN_AREA"
    ARMED_ESCORT_REQUIRED = "ARMED_ESCORT_REQUIRED"


class SpecialEquipmentRequired(str, enum.Enum):
    """Specialized lift/extraction requirements (9-Line Item 5)."""
    NONE = "NONE"
    HOIST = "HOIST"                      # Vertical lift
    EXTRACTION = "EXTRACTION"            # Rope/cable extraction
    VENTILATOR = "VENTILATOR"            # Patient on ventilator
    DIFFICULT_TERRAIN = "DIFFICULT_TERRAIN"


class PatientType(str, enum.Enum):
    """Patient mobility classification (9-Line Item 6a)."""
    LITTER = "LITTER"                    # Non-ambulatory
    AMBULATORY = "AMBULATORY"            # Mobile, can walk
    MIXED = "MIXED"                      # Mix of litter and ambulatory


class MarkingMethod(str, enum.Enum):
    """Ground-to-air signal method (9-Line Item 6b)."""
    PANELS = "PANELS"                    # VS-17 signal panels
    PYRO = "PYRO"                        # Colored smoke/flares
    SMOKE = "SMOKE"                      # Smoke grenades
    MIRROR = "MIRROR"                    # Signal mirror
    NONE = "NONE"
    OTHER = "OTHER"


class NationalityStatus(str, enum.Enum):
    """Patient nationality/status (9-Line Item 7)."""
    US_MILITARY = "US_MILITARY"
    US_CIVILIAN = "US_CIVILIAN"
    COALITION = "COALITION"
    EPW = "EPW"                          # Enemy Prisoner of War
    CIVILIAN = "CIVILIAN"


class TriageCategory(str, enum.Enum):
    """USMC triage classification (T1-T4)."""
    IMMEDIATE = "IMMEDIATE"              # T1: Life-threatening, salvageable
    DELAYED = "DELAYED"                  # T2: Serious but stable
    MINIMAL = "MINIMAL"                  # T3: Minor injuries
    EXPECTANT = "EXPECTANT"              # T4: Non-salvageable (expectant)


class EvacuationStatus(str, enum.Enum):
    """Current evacuation status."""
    PENDING = "PENDING"                  # Awaiting evacuation
    IN_TRANSIT = "IN_TRANSIT"            # En route to MTF
    AT_FACILITY = "AT_FACILITY"          # Arrived at medical facility
    TREATED = "TREATED"                  # Completed treatment
    RTD = "RTD"                          # Returned to duty


class TransportMethod(str, enum.Enum):
    """Evacuation transport type."""
    GROUND = "GROUND"                    # Ambulance, HMMWV
    ROTARY = "ROTARY"                    # Helicopter (HH-60, UH-1, etc.)
    FIXED_WING = "FIXED_WING"            # C-130, C-17, medical transport aircraft


class CasualtyReportStatus(str, enum.Enum):
    """Casualty report lifecycle status."""
    REPORTED = "REPORTED"                # Initial 9-line received
    ACKNOWLEDGED = "ACKNOWLEDGED"       # Command acknowledged
    DISPATCHED = "DISPATCHED"            # Transport assigned
    EVACUATING = "EVACUATING"            # In evacuation
    AT_MTF = "AT_MTF"                    # At medical facility
    CLOSED = "CLOSED"                    # Evacuation complete


# ─── CASUALTY REPORT MODEL (9-LINE CASEVAC/MEDEVAC) ──────────────────────

class CasualtyReport(Base):
    """USMC 9-Line CASEVAC/MEDEVAC Request.

    Represents a formal casualty evacuation report following:
    - USMC CASEVAC procedures (MCO 5330.1G)
    - TCCC (Tactical Combat Casualty Care) protocols
    - SAMVR (Standard Army Nomenclature Vector Response)
    - SALT triage (Sort, Assess, Lifesaving interventions, Treatment)

    The 9-Line format:
    1. Precedence (URGENT_SURGICAL, URGENT, PRIORITY, ROUTINE, CONVENIENCE)
    2. Number of patients (quantity)
    3. Special equipment (HOIST, EXTRACTION, VENTILATOR, etc.)
    4. Security at pickup (ENEMY_IN_AREA, ARMED_ESCORT_REQUIRED, etc.)
    5. Patient type & marking (LITTER/AMBULATORY, PANELS/SMOKE, etc.)
    6. Nationality & contamination (US_MILITARY/EPW, NBC_CONTAMINATION, etc.)
    7. Major injuries / diagnosis
    8. Receiving facility recommendations
    9. Remarks / special equipment needed
    """
    __tablename__ = "casualty_reports"

    # ─── IDENTIFICATION ───────────────────────────────────────────────────
    id = Column(Integer, primary_key=True, index=True)
    casualty_id = Column(String(50), unique=True, nullable=False, index=True)
    # Format: "CAS-UNIT-YYYY-MMDD-NNNN" e.g., "CAS-HQ1-2026-0305-0001"

    # ─── PERSONNEL REFERENCES ─────────────────────────────────────────────
    personnel_id = Column(Integer, ForeignKey("personnel.id"), nullable=True)
    # Null if casualty is non-KEYSTONE personnel (attached, enemy EPW, etc.)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    # Unit where casualty originated
    reported_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    # USEC user who submitted the 9-line

    # ─── INCIDENT DETAILS ─────────────────────────────────────────────────
    incident_datetime = Column(DateTime(timezone=True), nullable=False, index=True)
    # When casualty was identified / injury occurred
    reported_datetime = Column(DateTime(timezone=True), server_default=func.now())
    # When the 9-line was submitted

    # ─── LOCATION ─────────────────────────────────────────────────────────
    location_lat = Column(Float, nullable=False)
    location_lon = Column(Float, nullable=False)
    location_mgrs = Column(String(20), nullable=True)  # e.g., "32SPC0505065432"
    location_description = Column(String(200), nullable=True)
    # e.g., "Road ambush near Checkpoint 14", "Forward Operating Base Delta"

    # ─── 9-LINE ITEM 1: PRECEDENCE ────────────────────────────────────────
    precedence = Column(
        SQLEnum(CASEVACPrecedence), nullable=False, default=CASEVACPrecedence.PRIORITY
    )

    # ─── 9-LINE ITEM 2: NUMBER OF PATIENTS ────────────────────────────────
    number_of_patients = Column(Integer, nullable=False, default=1)

    # ─── 9-LINE ITEM 3: SPECIAL EQUIPMENT REQUIRED ────────────────────────
    special_equipment_required = Column(
        SQLEnum(SpecialEquipmentRequired), nullable=False, default=SpecialEquipmentRequired.NONE
    )

    # ─── 9-LINE ITEM 4: SECURITY AT PICKUP ────────────────────────────────
    security_at_pickup = Column(
        SQLEnum(SecurityAtPickup), nullable=False, default=SecurityAtPickup.NO_ENEMY
    )

    # ─── 9-LINE ITEM 5a: PATIENT TYPE ────────────────────────────────────
    patient_type = Column(
        SQLEnum(PatientType), nullable=False, default=PatientType.LITTER
    )

    # ─── 9-LINE ITEM 5b: GROUND-TO-AIR MARKING ────────────────────────────
    marking_method = Column(
        SQLEnum(MarkingMethod), nullable=False, default=MarkingMethod.PANELS
    )

    # ─── 9-LINE ITEM 6: NATIONALITY & NBC ────────────────────────────────
    nationality_status = Column(
        SQLEnum(NationalityStatus), nullable=False, default=NationalityStatus.US_MILITARY
    )
    nbc_contamination = Column(Boolean, default=False)
    # Chemical/biological/radiological contamination

    # ─── INJURY & TRIAGE ──────────────────────────────────────────────────
    mechanism_of_injury = Column(String(100), nullable=True)
    # e.g., "GSW ABDOMEN", "BLAST FRAGMENT", "CRUSH INJURY", "CONCUSSION", "HEAT CASUALTY"
    injuries_description = Column(Text, nullable=True)
    # Detailed description of injuries
    triage_category = Column(
        SQLEnum(TriageCategory), nullable=True, default=TriageCategory.IMMEDIATE
    )

    # ─── TCCC INTERVENTIONS ────────────────────────────────────────────────
    tccc_interventions = Column(JSON, nullable=True)
    # JSON object tracking TCCC Care Under Fire / Tactical Field Care:
    # {
    #   "tourniquet_applied": [{"location": "right_leg", "time": "2026-03-05T14:25:00Z"}],
    #   "chest_seal_applied": true,
    #   "nasopharyngeal_airway": true,
    #   "iv_access_established": [{"type": "18G_line_1", "location": "right_arm"}],
    #   "tranexamic_acid": {"given": true, "time": "2026-03-05T14:20:00Z"},
    #   "pain_management": "morphine_10mg_IM",
    #   "hypothermia_prevention": true,
    #   "notes": "Conscious, responds to verbal commands"
    # }

    # ─── EVACUATION STATUS ─────────────────────────────────────────────────
    status = Column(
        SQLEnum(CasualtyReportStatus), nullable=False, default=CasualtyReportStatus.REPORTED
    )

    # ─── TRANSPORT DETAILS ─────────────────────────────────────────────────
    transport_method = Column(
        SQLEnum(TransportMethod), nullable=True, default=TransportMethod.GROUND
    )
    evacuation_status = Column(
        SQLEnum(EvacuationStatus), nullable=True, default=EvacuationStatus.PENDING
    )
    # Whether patient is litter or ambulatory (redundant with patient_type, for sorting)

    # ─── FACILITY ASSIGNMENT ──────────────────────────────────────────────
    receiving_facility_id = Column(
        Integer, ForeignKey("medical_treatment_facilities.id"), nullable=True
    )
    # Assigned MTF for treatment

    pickup_time = Column(DateTime(timezone=True), nullable=True)
    # Actual time evacuation crew arrived at casualty location
    arrival_at_facility_time = Column(DateTime(timezone=True), nullable=True)
    # Actual arrival at MTF

    # ─── REMARKS ──────────────────────────────────────────────────────────
    remarks = Column(Text, nullable=True)
    # 9-Line Item 9: Special remarks, equipment, or authentication details

    # ─── METADATA ─────────────────────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── RELATIONSHIPS ────────────────────────────────────────────────────
    personnel = relationship("Personnel", foreign_keys=[personnel_id])
    unit = relationship("Unit", foreign_keys=[unit_id])
    reported_by = relationship("User", foreign_keys=[reported_by_user_id])
    receiving_facility = relationship("MedicalTreatmentFacility", back_populates="casualties")
    logs = relationship(
        "CasualtyLog",
        back_populates="casualty_report",
        cascade="all, delete-orphan"
    )


class CasualtyLog(Base):
    """Event log for casualty evacuation workflow.

    Tracks status transitions: REPORTED → ACKNOWLEDGED → DISPATCHED →
    EVACUATING → AT_MTF → CLOSED
    """
    __tablename__ = "casualty_logs"

    id = Column(Integer, primary_key=True, index=True)
    casualty_report_id = Column(
        Integer, ForeignKey("casualty_reports.id", ondelete="CASCADE"), nullable=False
    )
    event_type = Column(String(50), nullable=False)
    # e.g., "REPORTED", "ACKNOWLEDGED", "DISPATCHED", "EVACUATING", "ARRIVED", "CLOSED"
    event_time = Column(DateTime(timezone=True), server_default=func.now())
    recorded_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    notes = Column(Text, nullable=True)

    casualty_report = relationship("CasualtyReport", back_populates="logs")
    recorded_by = relationship("User")


# ─── MEDICAL TREATMENT FACILITY MODEL ──────────────────────────────────────

class MedicalTreatmentFacilityType(str, enum.Enum):
    """Medical treatment facility echelon/role."""
    BAS = "BAS"              # Battalion Aid Station (Company level)
    STP = "STP"              # Squad Trauma Platoon (forward casualty collection)
    FRSS = "FRSS"            # Forward Resuscitative Surgical Suite (battalion)
    ROLE2 = "ROLE2"          # Theater hospital (regiment/division)
    ROLE2E = "ROLE2E"        # Role 2 Enhanced (expanded surgical suite)
    ROLE3 = "ROLE3"          # General hospital (all services, definitive care)
    ROLE4 = "ROLE4"          # Stateside hospital


class MTFStatus(str, enum.Enum):
    """Medical facility operational status."""
    OPERATIONAL = "OPERATIONAL"
    DEGRADED = "DEGRADED"                # Limited capacity or equipment down
    NON_OPERATIONAL = "NON_OPERATIONAL"


class MedicalTreatmentFacility(Base):
    """Medical Treatment Facility (MTF) in KEYSTONE network.

    Represents forward surgical teams, battalion aid stations, and higher
    echelon hospitals. Tracks capacity, capabilities, and real-time status.
    """
    __tablename__ = "medical_treatment_facilities"

    id = Column(Integer, primary_key=True, index=True)

    # ─── IDENTIFICATION ────────────────────────────────────────────────────
    name = Column(String(100), nullable=False, index=True)
    # e.g., "BAS Co A", "2nd Bn FST", "Role 2 Theater Hospital"
    facility_type = Column(SQLEnum(MedicalTreatmentFacilityType), nullable=False)
    callsign = Column(String(50), nullable=True)
    # e.g., "DRAGON-6", "MEDEVAC-23"

    # ─── PARENT UNIT ───────────────────────────────────────────────────────
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)

    # ─── LOCATION ───────────────────────────────────────────────────────────
    location_lat = Column(Float, nullable=False)
    location_lon = Column(Float, nullable=False)
    location_mgrs = Column(String(20), nullable=True)

    # ─── CAPACITY & STATUS ─────────────────────────────────────────────────
    capacity = Column(Integer, nullable=False, default=10)
    # Total bed capacity
    current_census = Column(Integer, nullable=False, default=0)
    # Currently occupied beds
    status = Column(SQLEnum(MTFStatus), nullable=False, default=MTFStatus.OPERATIONAL)

    # ─── MEDICAL CAPABILITIES ──────────────────────────────────────────────
    surgical_capability = Column(Boolean, default=False)
    # Can perform emergency surgery
    blood_bank = Column(Boolean, default=False)
    # Has blood products on hand
    vent_capacity = Column(Integer, default=0)
    # Number of ventilator beds available
    x_ray_capability = Column(Boolean, default=False)
    ultrasound_capability = Column(Boolean, default=False)
    dental_capability = Column(Boolean, default=False)

    # ─── COMMUNICATIONS ───────────────────────────────────────────────────
    contact_freq = Column(String(20), nullable=True)
    # Primary radio frequency (e.g., "138.450")
    alternate_freq = Column(String(20), nullable=True)
    phone = Column(String(20), nullable=True)

    # ─── STAFFING ─────────────────────────────────────────────────────────
    physician_staffing = Column(Integer, default=0)
    # Number of doctors present
    pa_staffing = Column(Integer, default=0)
    # Physician assistants
    medic_staffing = Column(Integer, default=0)
    # Combat medics / military nurse technicians
    surgical_tech_staffing = Column(Integer, default=0)

    # ─── METADATA ───────────────────────────────────────────────────────────
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── RELATIONSHIPS ────────────────────────────────────────────────────
    unit = relationship("Unit", foreign_keys=[unit_id])
    casualties = relationship(
        "CasualtyReport",
        back_populates="receiving_facility",
        cascade="all, delete-orphan"
    )
    blood_inventory = relationship(
        "BloodProduct",
        back_populates="facility",
        cascade="all, delete-orphan"
    )


# ─── MEDICAL SUPPLY BURN RATE MODEL ────────────────────────────────────────

class MedicalSupplyBurnRate(Base):
    """Class VIII (Medical) supply consumption rate and forecast.

    Tracks consumption of medical supplies over a period and projects
    when supplies will be exhausted based on current burn rate.
    """
    __tablename__ = "medical_supply_burn_rates"

    id = Column(Integer, primary_key=True, index=True)

    # ─── REFERENCES ────────────────────────────────────────────────────────
    unit_id = Column(
        Integer, ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True
    )
    supply_catalog_item_id = Column(
        Integer, ForeignKey("supply_catalog.id"), nullable=False
    )
    # Points to existing SupplyCatalogItem (Class VIII items)

    # ─── PERIOD ─────────────────────────────────────────────────────────────
    period_start = Column(Date, nullable=False, index=True)
    period_end = Column(Date, nullable=False, index=True)
    # Observation period for burn rate calculation

    # ─── CONSUMPTION DATA ────────────────────────────────────────────────────
    quantity_used = Column(Integer, nullable=False)
    # Units consumed during period
    quantity_on_hand = Column(Integer, nullable=False)
    # Current inventory level
    days_of_supply = Column(Float, nullable=True)
    # quantity_on_hand / burn_rate_per_day
    burn_rate_per_day = Column(Float, nullable=False)
    # Units/day: quantity_used / (period_end - period_start).days

    # ─── PROJECTION ──────────────────────────────────────────────────────────
    projected_exhaustion_date = Column(Date, nullable=True)
    # When supplies will run out at current burn rate
    # Calculated as: today + (quantity_on_hand / burn_rate_per_day)

    # ─── ALERT THRESHOLDS ────────────────────────────────────────────────────
    critical_threshold = Column(Integer, nullable=True)
    # Alert when quantity <= this value
    warning_threshold = Column(Integer, nullable=True)
    # Yellow flag when quantity <= this value

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── RELATIONSHIPS ────────────────────────────────────────────────────
    unit = relationship("Unit")
    supply_item = relationship("SupplyCatalogItem")


# ─── BLOOD PRODUCT INVENTORY MODEL ──────────────────────────────────────────

class BloodProductType(str, enum.Enum):
    """Blood product types."""
    WHOLE_BLOOD = "WHOLE_BLOOD"        # Type and cross-matched
    PRBC = "PRBC"                      # Packed Red Blood Cells
    FFP = "FFP"                        # Fresh Frozen Plasma
    PLATELETS = "PLATELETS"
    CRYO = "CRYO"                      # Cryoprecipitate
    ALBUMIN = "ALBUMIN"


class BloodType(str, enum.Enum):
    """ABO/Rh blood types."""
    O_NEG = "O_NEG"                    # Universal donor
    O_POS = "O_POS"
    A_NEG = "A_NEG"
    A_POS = "A_POS"
    B_NEG = "B_NEG"
    B_POS = "B_POS"
    AB_NEG = "AB_NEG"
    AB_POS = "AB_POS"                 # Universal recipient


class BloodProduct(Base):
    """Blood product inventory at medical facility.

    Tracks blood availability, expiration, and walking blood bank
    (personnel pre-typed for emergency donation).
    """
    __tablename__ = "blood_products"

    id = Column(Integer, primary_key=True, index=True)

    # ─── LOCATION ───────────────────────────────────────────────────────────
    facility_id = Column(
        Integer, ForeignKey("medical_treatment_facilities.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # ─── PRODUCT DETAILS ────────────────────────────────────────────────────
    product_type = Column(SQLEnum(BloodProductType), nullable=False)
    blood_type = Column(SQLEnum(BloodType), nullable=False)
    # Blood type (O_NEG, A_POS, etc.)

    # ─── INVENTORY ──────────────────────────────────────────────────────────
    units_on_hand = Column(Integer, nullable=False, default=0)
    # Number of units in stock
    units_used_24h = Column(Integer, nullable=False, default=0)
    # Units consumed in last 24 hours (for burn rate tracking)
    expiration_date = Column(Date, nullable=True)
    # FIFO rotation date

    # ─── WALKING BLOOD BANK ──────────────────────────────────────────────────
    walking_blood_bank_donors = Column(Integer, nullable=False, default=0)
    # Number of pre-typed personnel available for emergency donation
    # (Marines/Sailors in unit who are approved blood donors)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # ─── RELATIONSHIPS ────────────────────────────────────────────────────
    facility = relationship("MedicalTreatmentFacility", back_populates="blood_inventory")
```

---

### 1.2 Update Existing Models

**File:** `backend/app/models/personnel.py`

Add to the existing `Personnel` model:

```python
# ─── MEDICAL FIELDS (in existing Personnel class) ─────────────────────────

blood_type = Column(String(5), nullable=True)  # A_POS, O_NEG, etc. (existing)
medical_status = Column(
    SQLEnum(PersonnelStatus), nullable=False, default=PersonnelStatus.ACTIVE
)
# Can be ACTIVE, MEDICAL (on medical hold), MEDEVAC, DISCHARGED, etc.

# Walking blood bank authorization (pre-typed for emergency donation)
walking_blood_bank_authorized = Column(Boolean, default=False)
walking_blood_bank_qualified_date = Column(Date, nullable=True)

# Medical profile / restrictions
medical_profile_status = Column(String(20), nullable=True)
# "FULL_DUTY", "PROFILE", "LIMIT_DUTY", "NON_DEPLOYABLE", "MEDICAL_HOLD"
medical_profile_expiry = Column(Date, nullable=True)

# TCCC certification
tccc_certified = Column(Boolean, default=False)
tccc_cert_date = Column(Date, nullable=True)
tccc_cert_expiry = Column(Date, nullable=True)

# Allergy information (security: only visible to medical personnel)
allergies = Column(Text, nullable=True)  # "Penicillin, latex"
emergency_contact = Column(String(100), nullable=True)

# Relationships
casualty_reports = relationship(
    "CasualtyReport",
    foreign_keys="CasualtyReport.personnel_id",
    back_populates="personnel"
)
```

---

## Part 2: API Endpoints

### 2.1 Medical Module API

**File:** `backend/app/api/medical.py`

```python
"""Medical logistics, casualty evacuation, and TCCC endpoints."""

from datetime import datetime, date, timedelta
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func as db_func
from typing import Optional

from app.database import get_db
from app.models import (
    CasualtyReport, CasualtyLog, MedicalTreatmentFacility, BloodProduct,
    MedicalSupplyBurnRate, Personnel, Unit, User, SupplyCatalogItem
)
from app.schemas import (
    CasualtyReportCreate, CasualtyReportUpdate, CasualtyReportResponse,
    MTFResponse, BloodProductResponse, BurnRateResponse
)
from app.services.auth import get_current_user
from app.services.casevac import (
    CasevacService, create_9line_report, dispatch_evacuation,
    update_patient_status, calculate_burn_rates, find_nearest_mtf,
    get_blood_status, generate_perstat_medical
)

router = APIRouter(prefix="/api/v1/medical", tags=["medical"])


# ─── CASUALTY REPORTS (9-LINE CASEVAC) ──────────────────────────────────

@router.post("/casualties", response_model=CasualtyReportResponse, status_code=201)
async def report_casualty(
    report: CasualtyReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a new 9-line CASEVAC/MEDEVAC report.

    Generates a casualty_id, logs the report, and initiates evacuation workflow.
    Must include at minimum: precedence, number_of_patients, location, mechanism_of_injury.
    """
    service = CasevacService(db, current_user)
    casualty = await service.create_casualty_report(report)
    return casualty


@router.get("/casualties", response_model=list[CasualtyReportResponse])
async def list_casualties(
    unit_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    evacuation_status: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List casualty reports with optional filtering.

    - unit_id: Filter by originating unit
    - status: REPORTED, ACKNOWLEDGED, DISPATCHED, EVACUATING, AT_MTF, CLOSED
    - evacuation_status: PENDING, IN_TRANSIT, AT_FACILITY, TREATED, RTD
    """
    query = select(CasualtyReport)

    # Filter by accessible units (user's own unit + subordinate units)
    accessible_unit_ids = await current_user.get_accessible_unit_ids(db)
    query = query.where(CasualtyReport.unit_id.in_(accessible_unit_ids))

    if unit_id:
        query = query.where(CasualtyReport.unit_id == unit_id)
    if status:
        query = query.where(CasualtyReport.status == status)
    if evacuation_status:
        query = query.where(CasualtyReport.evacuation_status == evacuation_status)

    query = query.order_by(CasualtyReport.incident_datetime.desc())
    query = query.offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/casualties/{casualty_id}", response_model=CasualtyReportResponse)
async def get_casualty(
    casualty_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve a specific casualty report by casualty_id."""
    query = select(CasualtyReport).where(CasualtyReport.casualty_id == casualty_id)
    result = await db.execute(query)
    casualty = result.scalar_one_or_none()

    if not casualty:
        raise HTTPException(status_code=404, detail="Casualty report not found")

    # Check access
    accessible_units = await current_user.get_accessible_unit_ids(db)
    if casualty.unit_id not in accessible_units:
        raise HTTPException(status_code=403, detail="Access denied")

    return casualty


@router.put("/casualties/{casualty_id}", response_model=CasualtyReportResponse)
async def update_casualty(
    casualty_id: str,
    update: CasualtyReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update casualty report (status, evacuation tracking, TCCC interventions)."""
    query = select(CasualtyReport).where(CasualtyReport.casualty_id == casualty_id)
    result = await db.execute(query)
    casualty = result.scalar_one_or_none()

    if not casualty:
        raise HTTPException(status_code=404, detail="Casualty report not found")

    service = CasevacService(db, current_user)
    updated = await service.update_casualty_report(casualty, update)
    return updated


@router.put("/casualties/{casualty_id}/dispatch", response_model=CasualtyReportResponse)
async def dispatch_casualty_evacuation(
    casualty_id: str,
    facility_id: int,
    transport_method: str = Query("GROUND"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Dispatch evacuation: assign transport and receiving facility.

    Transitions casualty status from REPORTED → DISPATCHED.
    """
    service = CasevacService(db, current_user)
    casualty = await service.dispatch_evacuation(casualty_id, facility_id, transport_method)
    return casualty


@router.put("/casualties/{casualty_id}/arrive", response_model=CasualtyReportResponse)
async def casualty_arrived_at_facility(
    casualty_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record arrival at medical facility.

    Transitions status: EVACUATING → AT_MTF. Updates arrival_at_facility_time.
    """
    service = CasevacService(db, current_user)
    casualty = await service.update_patient_status(casualty_id, "AT_MTF")
    return casualty


@router.put("/casualties/{casualty_id}/close", response_model=CasualtyReportResponse)
async def close_casualty_report(
    casualty_id: str,
    disposition: str = Query("TREATED"),  # TREATED, RTD, TRANSFERRED
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Close casualty report: mark evacuation complete.

    Transitions to CLOSED status.
    """
    service = CasevacService(db, current_user)
    casualty = await service.close_casualty_report(casualty_id, disposition)
    return casualty


# ─── MEDICAL TREATMENT FACILITIES ────────────────────────────────────────

@router.get("/facilities", response_model=list[MTFResponse])
async def list_mtfs(
    facility_type: Optional[str] = Query(None),
    unit_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all medical treatment facilities.

    - facility_type: BAS, STP, FRSS, ROLE2, ROLE2E, ROLE3
    - status: OPERATIONAL, DEGRADED, NON_OPERATIONAL
    """
    query = select(MedicalTreatmentFacility)

    if facility_type:
        query = query.where(MedicalTreatmentFacility.facility_type == facility_type)
    if unit_id:
        query = query.where(MedicalTreatmentFacility.unit_id == unit_id)
    if status:
        query = query.where(MedicalTreatmentFacility.status == status)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/facilities/{facility_id}", response_model=MTFResponse)
async def get_mtf(
    facility_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific medical facility with capacity and capability details."""
    query = select(MedicalTreatmentFacility).where(
        MedicalTreatmentFacility.id == facility_id
    )
    result = await db.execute(query)
    facility = result.scalar_one_or_none()

    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    return facility


@router.get("/nearest-facility", response_model=MTFResponse)
async def find_nearest_facility(
    lat: float = Query(...),
    lon: float = Query(...),
    db: AsyncSession = Depends(get_db),
):
    """Find nearest operational medical facility to coordinates.

    Searches OPERATIONAL or DEGRADED facilities sorted by distance.
    """
    service = CasevacService(db)
    facility = await service.find_nearest_mtf(lat, lon)

    if not facility:
        raise HTTPException(status_code=404, detail="No operational facilities found")

    return facility


@router.post("/facilities", response_model=MTFResponse, status_code=201)
async def create_mtf(
    mtf: MTFCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new medical treatment facility."""
    new_facility = MedicalTreatmentFacility(**mtf.dict())
    db.add(new_facility)
    await db.commit()
    await db.refresh(new_facility)
    return new_facility


@router.put("/facilities/{facility_id}", response_model=MTFResponse)
async def update_mtf(
    facility_id: int,
    update: MTFUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update medical facility status, capacity, staffing."""
    query = select(MedicalTreatmentFacility).where(
        MedicalTreatmentFacility.id == facility_id
    )
    result = await db.execute(query)
    facility = result.scalar_one_or_none()

    if not facility:
        raise HTTPException(status_code=404, detail="Facility not found")

    for key, value in update.dict(exclude_unset=True).items():
        setattr(facility, key, value)

    await db.commit()
    await db.refresh(facility)
    return facility


# ─── BLOOD PRODUCTS ──────────────────────────────────────────────────────

@router.get("/blood-products/{facility_id}", response_model=list[BloodProductResponse])
async def get_blood_inventory(
    facility_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get blood product inventory at a facility.

    Lists all blood types and products with expiration warnings.
    """
    query = select(BloodProduct).where(BloodProduct.facility_id == facility_id)
    result = await db.execute(query)
    products = result.scalars().all()

    if not products:
        raise HTTPException(status_code=404, detail="No blood inventory found for facility")

    return products


@router.post("/blood-products", response_model=BloodProductResponse, status_code=201)
async def add_blood_product(
    product: BloodProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add blood product to facility inventory."""
    new_product = BloodProduct(**product.dict())
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return new_product


@router.put("/blood-products/{product_id}", response_model=BloodProductResponse)
async def update_blood_product(
    product_id: int,
    update: BloodProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update blood product inventory levels (used for transfusion tracking)."""
    query = select(BloodProduct).where(BloodProduct.id == product_id)
    result = await db.execute(query)
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Blood product not found")

    for key, value in update.dict(exclude_unset=True).items():
        setattr(product, key, value)

    await db.commit()
    await db.refresh(product)
    return product


# ─── MEDICAL SUPPLY BURN RATES ───────────────────────────────────────────

@router.get("/burn-rates/{unit_id}", response_model=list[BurnRateResponse])
async def get_burn_rates(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get Class VIII supply burn rates and exhaustion projections for a unit.

    Shows: quantity_on_hand, burn_rate_per_day, days_of_supply, projected_exhaustion_date.
    """
    service = CasevacService(db, current_user)
    burn_rates = await service.calculate_medical_burn_rates(unit_id)
    return burn_rates


@router.post("/burn-rates", response_model=BurnRateResponse, status_code=201)
async def create_burn_rate_record(
    record: BurnRateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record Class VIII supply consumption for a period.

    Used to track burn rate trends over time.
    """
    new_record = MedicalSupplyBurnRate(**record.dict())
    db.add(new_record)
    await db.commit()
    await db.refresh(new_record)
    return new_record


# ─── PERSTAT & REPORTING ──────────────────────────────────────────────────

@router.get("/perstat-medical/{unit_id}")
async def get_medical_perstat(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get medical portion of PERSTAT (Personnel Status Report).

    Includes:
    - Effective strength (medical holds, MEDEVAC)
    - Casualties (active cases)
    - TCCC readiness (% certified)
    - Blood type distribution for walking blood bank
    - Critical supply shortfalls
    """
    service = CasevacService(db, current_user)
    perstat = await service.generate_perstat_medical(unit_id)
    return perstat


@router.get("/health-dashboard/{unit_id}")
async def get_medical_health_dashboard(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Comprehensive medical readiness dashboard for command visualization.

    Returns:
    - Active casualties (count, triage breakdown)
    - MTF capacity utilization
    - Blood product status (type distribution, shortfalls)
    - Class VIII burn rates (critical supply timeline)
    - TCCC certification status
    - Medical evacuation timeline
    """
    # Placeholder for comprehensive dashboard
    pass
```

---

## Part 3: Services

### 3.1 CASEVAC Service

**File:** `backend/app/services/casevac.py`

```python
"""CASEVAC workflow, TCCC tracking, and medical logistics services."""

import uuid
from datetime import datetime, date, timedelta
from math import radians, cos, sin, asin, sqrt
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func as db_func

from app.models import (
    CasualtyReport, CasualtyLog, MedicalTreatmentFacility, BloodProduct,
    MedicalSupplyBurnRate, Personnel, Unit, User, SupplyCatalogItem
)
from app.schemas import CasualtyReportCreate, CasualtyReportUpdate


class CasevacService:
    """Service for casualty evacuation, TCCC, and medical logistics."""

    def __init__(self, db: AsyncSession, user: Optional[User] = None):
        self.db = db
        self.user = user

    async def create_casualty_report(self, data: CasualtyReportCreate) -> CasualtyReport:
        """Create new 9-line CASEVAC report.

        Generates unique casualty_id (CAS-UNIT-YYYY-MMDD-NNNN format).
        Logs initial REPORTED status.
        """
        # Generate casualty ID
        today = datetime.utcnow()
        unit = await self.db.get(Unit, data.unit_id)
        unit_code = unit.code[:4].upper() if unit else "XXXX"
        casualty_id = f"CAS-{unit_code}-{today.strftime('%Y-%m%d')}-{uuid.uuid4().hex[:4].upper()}"

        # Create report
        casualty = CasualtyReport(
            casualty_id=casualty_id,
            personnel_id=data.personnel_id,
            unit_id=data.unit_id,
            reported_by_user_id=self.user.id,
            incident_datetime=data.incident_datetime,
            location_lat=data.location_lat,
            location_lon=data.location_lon,
            location_mgrs=data.location_mgrs,
            location_description=data.location_description,
            precedence=data.precedence,
            number_of_patients=data.number_of_patients,
            special_equipment_required=data.special_equipment_required,
            security_at_pickup=data.security_at_pickup,
            patient_type=data.patient_type,
            marking_method=data.marking_method,
            nationality_status=data.nationality_status,
            nbc_contamination=data.nbc_contamination,
            mechanism_of_injury=data.mechanism_of_injury,
            injuries_description=data.injuries_description,
            triage_category=data.triage_category,
            tccc_interventions=data.tccc_interventions,
            remarks=data.remarks,
            status="REPORTED"
        )
        self.db.add(casualty)
        await self.db.flush()

        # Log initial report
        log = CasualtyLog(
            casualty_report_id=casualty.id,
            event_type="REPORTED",
            recorded_by_user_id=self.user.id,
            notes=f"9-Line CASEVAC received: {data.number_of_patients} patient(s)"
        )
        self.db.add(log)
        await self.db.commit()
        await self.db.refresh(casualty)

        return casualty

    async def dispatch_evacuation(
        self, casualty_id: str, facility_id: int, transport_method: str
    ) -> CasualtyReport:
        """Assign transport and receiving facility.

        Transitions: REPORTED → DISPATCHED
        """
        query = select(CasualtyReport).where(CasualtyReport.casualty_id == casualty_id)
        result = await self.db.execute(query)
        casualty = result.scalar_one_or_none()

        if not casualty:
            raise ValueError(f"Casualty {casualty_id} not found")

        casualty.status = "DISPATCHED"
        casualty.receiving_facility_id = facility_id
        casualty.transport_method = transport_method
        casualty.evacuation_status = "IN_TRANSIT"
        casualty.pickup_time = datetime.utcnow()

        log = CasualtyLog(
            casualty_report_id=casualty.id,
            event_type="DISPATCHED",
            recorded_by_user_id=self.user.id,
            notes=f"Transport dispatched via {transport_method} to facility {facility_id}"
        )
        self.db.add(log)

        await self.db.commit()
        await self.db.refresh(casualty)
        return casualty

    async def update_patient_status(self, casualty_id: str, new_status: str) -> CasualtyReport:
        """Update casualty status: PENDING → IN_TRANSIT → AT_FACILITY → TREATED → RTD."""
        query = select(CasualtyReport).where(CasualtyReport.casualty_id == casualty_id)
        result = await self.db.execute(query)
        casualty = result.scalar_one_or_none()

        if not casualty:
            raise ValueError(f"Casualty {casualty_id} not found")

        old_status = casualty.evacuation_status
        casualty.evacuation_status = new_status

        if new_status == "AT_FACILITY":
            casualty.status = "AT_MTF"
            casualty.arrival_at_facility_time = datetime.utcnow()

        if new_status == "RTD":
            casualty.status = "CLOSED"
            casualty.evacuation_status = "RTD"

        log = CasualtyLog(
            casualty_report_id=casualty.id,
            event_type=new_status,
            recorded_by_user_id=self.user.id,
            notes=f"Status updated: {old_status} → {new_status}"
        )
        self.db.add(log)

        await self.db.commit()
        await self.db.refresh(casualty)
        return casualty

    async def close_casualty_report(self, casualty_id: str, disposition: str) -> CasualtyReport:
        """Close casualty report: mark evacuation complete.

        Disposition: TREATED, RTD, TRANSFERRED, EXPECTANT, KIA
        """
        query = select(CasualtyReport).where(CasualtyReport.casualty_id == casualty_id)
        result = await self.db.execute(query)
        casualty = result.scalar_one_or_none()

        if not casualty:
            raise ValueError(f"Casualty {casualty_id} not found")

        casualty.status = "CLOSED"
        casualty.evacuation_status = disposition

        log = CasualtyLog(
            casualty_report_id=casualty.id,
            event_type="CLOSED",
            recorded_by_user_id=self.user.id,
            notes=f"Report closed: disposition = {disposition}"
        )
        self.db.add(log)

        await self.db.commit()
        await self.db.refresh(casualty)
        return casualty

    async def calculate_medical_burn_rates(self, unit_id: int) -> list:
        """Calculate Class VIII supply burn rates and exhaustion projections.

        Returns list of burn rate records with projected exhaustion dates.
        """
        query = select(MedicalSupplyBurnRate).where(
            MedicalSupplyBurnRate.unit_id == unit_id
        )
        result = await self.db.execute(query)
        records = result.scalars().all()

        for record in records:
            # Recalculate projected exhaustion
            today = date.today()
            if record.burn_rate_per_day > 0:
                days_remaining = record.quantity_on_hand / record.burn_rate_per_day
                record.days_of_supply = days_remaining
                record.projected_exhaustion_date = today + timedelta(days=days_remaining)

        await self.db.commit()
        return records

    async def find_nearest_mtf(self, lat: float, lon: float) -> Optional[MedicalTreatmentFacility]:
        """Find nearest operational medical facility to coordinates (Haversine distance)."""
        query = select(MedicalTreatmentFacility).where(
            MedicalTreatmentFacility.status.in_(["OPERATIONAL", "DEGRADED"])
        )
        result = await self.db.execute(query)
        facilities = result.scalars().all()

        if not facilities:
            return None

        def haversine(lat1, lon1, lat2, lon2):
            """Calculate great-circle distance in kilometers."""
            lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
            dlat = lat2 - lat1
            dlon = lon2 - lon1
            a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
            c = 2 * asin(sqrt(a))
            km = 6371 * c
            return km

        nearest = min(
            facilities,
            key=lambda f: haversine(lat, lon, f.location_lat, f.location_lon)
        )
        return nearest

    async def get_blood_product_status(self, facility_id: int) -> dict:
        """Get blood product inventory status for facility.

        Returns summary of all blood types with expiration alerts.
        """
        query = select(BloodProduct).where(BloodProduct.facility_id == facility_id)
        result = await self.db.execute(query)
        products = result.scalars().all()

        status = {
            "facility_id": facility_id,
            "products": [],
            "critical_shortages": [],
            "expiration_alerts": []
        }

        today = date.today()
        for product in products:
            product_summary = {
                "product_type": product.product_type,
                "blood_type": product.blood_type,
                "units_on_hand": product.units_on_hand,
                "units_used_24h": product.units_used_24h,
                "expiration_date": product.expiration_date
            }
            status["products"].append(product_summary)

            # Alert if critical shortage
            if product.units_on_hand <= 2:
                status["critical_shortages"].append(
                    f"{product.blood_type} {product.product_type}: only {product.units_on_hand} units"
                )

            # Alert if expiring within 7 days
            if product.expiration_date:
                days_to_expiration = (product.expiration_date - today).days
                if 0 <= days_to_expiration <= 7:
                    status["expiration_alerts"].append(
                        f"{product.blood_type}: expires in {days_to_expiration} days"
                    )

        return status

    async def generate_perstat_medical(self, unit_id: int) -> dict:
        """Generate medical portion of PERSTAT (Personnel Status Report).

        Includes:
        - Effective strength (accounting for medical holds, MEDEVAC)
        - Active casualties with triage breakdown
        - TCCC certification rate
        - Blood type distribution (for walking blood bank)
        - Class VIII critical supply shortfalls
        """
        # Query personnel
        personnel_query = select(Personnel).where(Personnel.unit_id == unit_id)
        personnel_result = await self.db.execute(personnel_query)
        personnel = personnel_result.scalars().all()

        # Query active casualties
        casualties_query = select(CasualtyReport).where(
            and_(
                CasualtyReport.unit_id == unit_id,
                CasualtyReport.status.notin_(["CLOSED"])
            )
        )
        casualties_result = await self.db.execute(casualties_query)
        casualties = casualties_result.scalars().all()

        # Build report
        total_strength = len(personnel)
        medical_holds = sum(1 for p in personnel if p.medical_status == "MEDICAL")
        effective_strength = total_strength - medical_holds

        tccc_certified = sum(1 for p in personnel if p.tccc_certified)
        tccc_cert_rate = (tccc_certified / total_strength * 100) if total_strength > 0 else 0

        # Blood type distribution
        blood_types = {}
        for p in personnel:
            if p.blood_type:
                blood_types[p.blood_type] = blood_types.get(p.blood_type, 0) + 1

        # Triage breakdown
        triage_breakdown = {
            "IMMEDIATE": sum(1 for c in casualties if c.triage_category == "IMMEDIATE"),
            "DELAYED": sum(1 for c in casualties if c.triage_category == "DELAYED"),
            "MINIMAL": sum(1 for c in casualties if c.triage_category == "MINIMAL"),
            "EXPECTANT": sum(1 for c in casualties if c.triage_category == "EXPECTANT")
        }

        return {
            "unit_id": unit_id,
            "total_strength": total_strength,
            "effective_strength": effective_strength,
            "medical_holds": medical_holds,
            "active_casualties": len(casualties),
            "triage_breakdown": triage_breakdown,
            "tccc_cert_rate_pct": round(tccc_cert_rate, 2),
            "blood_type_distribution": blood_types,
            "timestamp": datetime.utcnow().isoformat()
        }
```

---

## Part 4: Frontend Components

### 4.1 MedicalPage.tsx

**File:** `frontend/src/pages/MedicalPage.tsx`

```typescript
/**
 * MedicalPage.tsx
 *
 * Medical logistics and CASEVAC tracking dashboard.
 * Shows:
 * - Active casualty tracker with evacuation status
 * - 9-Line CASEVAC form
 * - Medical facility map overlay
 * - Blood product inventory dashboard
 * - Class VIII supply burn rate charts
 * - PERSTAT medical summary
 */

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Heart, Truck, Droplet, Package } from "lucide-react";

import { api } from "@/lib/api";
import CasualtyTable from "@/components/medical/CasualtyTable";
import NineLineForm from "@/components/medical/NineLineForm";
import MTFStatusCards from "@/components/medical/MTFStatusCards";
import BloodBankDashboard from "@/components/medical/BloodBankDashboard";
import MedicalBurnRateChart from "@/components/medical/MedicalBurnRateChart";
import PERSTATMedicalWidget from "@/components/medical/PERSTATMedicalWidget";
import MapPage from "@/pages/MapPage";

interface CasualtyFilters {
  unit_id?: number;
  status?: string;
  evacuation_status?: string;
}

export default function MedicalPage() {
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [showNineLineForm, setShowNineLineForm] = useState(false);
  const [filters, setFilters] = useState<CasualtyFilters>({});

  // Fetch casualties
  const { data: casualties = [], isLoading: casualtiesLoading, refetch: refetchCasualties } = useQuery({
    queryKey: ["casualties", filters],
    queryFn: () => api.get(`/api/v1/medical/casualties`, { params: filters }),
  });

  // Fetch MTFs
  const { data: facilities = [] } = useQuery({
    queryKey: ["mtf-list"],
    queryFn: () => api.get(`/api/v1/medical/facilities`),
  });

  // Fetch medical PERSTAT
  const { data: perstat } = useQuery({
    queryKey: ["perstat-medical", selectedUnitId],
    queryFn: () => selectedUnitId
      ? api.get(`/api/v1/medical/perstat-medical/${selectedUnitId}`)
      : null,
    enabled: !!selectedUnitId,
  });

  // Count active casualties by priority
  const activeCasualties = casualties.filter(c => c.status !== "CLOSED");
  const urgentSurgical = activeCasualties.filter(c => c.precedence === "URGENT_SURGICAL").length;
  const urgent = activeCasualties.filter(c => c.precedence === "URGENT").length;
  const priority = activeCasualties.filter(c => c.precedence === "PRIORITY").length;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Heart className="w-8 h-8 text-red-600" />
            Medical Logistics & CASEVAC Tracking
          </h1>
          <p className="text-gray-600 mt-1">Real-time casualty evacuation and medical supply status</p>
        </div>
        <button
          onClick={() => setShowNineLineForm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
        >
          + New CASEVAC Report
        </button>
      </div>

      {/* Alert Summary */}
      {(urgentSurgical > 0 || urgent > 0) && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">
                  {urgentSurgical} Urgent Surgical + {urgent} Urgent casualties requiring immediate attention
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Casualty Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">{activeCasualties.length}</div>
              <div className="text-sm text-gray-600 mt-1">Active Casualties</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{urgentSurgical}</div>
              <div className="text-sm text-gray-600 mt-1">Urgent Surgical</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{priority}</div>
              <div className="text-sm text-gray-600 mt-1">Priority</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{facilities.length}</div>
              <div className="text-sm text-gray-600 mt-1">MTFs Online</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Interface */}
      <Tabs defaultValue="casualties" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="casualties">Casualties</TabsTrigger>
          <TabsTrigger value="facilities">Medical Facilities</TabsTrigger>
          <TabsTrigger value="blood">Blood Products</TabsTrigger>
          <TabsTrigger value="supplies">Supply Burn Rates</TabsTrigger>
          <TabsTrigger value="map">Medical Map</TabsTrigger>
        </TabsList>

        {/* CASUALTIES TAB */}
        <TabsContent value="casualties" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Casualty Tracker</CardTitle>
              <CardDescription>
                Real-time casualty status, triage classification, and evacuation tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CasualtyTable casualties={activeCasualties} loading={casualtiesLoading} />
            </CardContent>
          </Card>

          {/* PERSTAT Medical Widget */}
          {selectedUnitId && perstat && (
            <PERSTATMedicalWidget perstat={perstat} />
          )}
        </TabsContent>

        {/* FACILITIES TAB */}
        <TabsContent value="facilities" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Treatment Facilities (MTF)</CardTitle>
              <CardDescription>
                Capacity utilization, surgical capability, staffing status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MTFStatusCards facilities={facilities} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* BLOOD PRODUCTS TAB */}
        <TabsContent value="blood" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blood Bank Inventory</CardTitle>
              <CardDescription>
                Whole blood, PRBC, FFP, platelets, and walking blood bank status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {facilities.map(facility => (
                <BloodBankDashboard key={facility.id} facilityId={facility.id} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* BURN RATES TAB */}
        <TabsContent value="supplies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class VIII Medical Supply Burn Rates</CardTitle>
              <CardDescription>
                Consumption trends and exhaustion projections
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedUnitId && (
                <MedicalBurnRateChart unitId={selectedUnitId} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* MAP TAB */}
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Medical Facility Map Overlay</CardTitle>
              <CardDescription>
                MTF locations, CASEVAC routes, incident locations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MapPage showMTFLayer={true} showCasevacRoutes={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 9-Line CASEVAC Form Modal */}
      {showNineLineForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <NineLineForm
              onSubmit={async (data) => {
                await api.post(`/api/v1/medical/casualties`, data);
                setShowNineLineForm(false);
                refetchCasualties();
              }}
              onCancel={() => setShowNineLineForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

### 4.2 Component: CasualtyTable.tsx

```typescript
/**
 * CasualtyTable.tsx
 *
 * Table of active casualties with status, triage, evacuation tracking.
 */

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ColumnDef, createColumnHelper } from "@tanstack/react-table";
import DataTable from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Truck } from "lucide-react";

interface Casualty {
  id: number;
  casualty_id: string;
  personnel_id?: number;
  number_of_patients: number;
  mechanism_of_injury: string;
  triage_category: string;
  precedence: string;
  status: string;
  evacuation_status: string;
  incident_datetime: string;
  receiving_facility: { name: string } | null;
}

const getCasualtyIcon = (precedence: string) => {
  switch (precedence) {
    case "URGENT_SURGICAL":
      return <AlertCircle className="w-4 h-4 text-red-600" />;
    case "URGENT":
      return <AlertCircle className="w-4 h-4 text-orange-600" />;
    default:
      return <CheckCircle className="w-4 h-4 text-yellow-600" />;
  }
};

const triageColors = {
  IMMEDIATE: "bg-red-100 text-red-800",
  DELAYED: "bg-yellow-100 text-yellow-800",
  MINIMAL: "bg-green-100 text-green-800",
  EXPECTANT: "bg-gray-100 text-gray-800"
};

const columnHelper = createColumnHelper<Casualty>();

const columns = [
  columnHelper.accessor("casualty_id", {
    header: "Casualty ID",
    cell: (info) => <code className="bg-gray-100 px-2 py-1 rounded text-sm">{info.getValue()}</code>,
  }),
  columnHelper.accessor("number_of_patients", {
    header: "Count",
    cell: (info) => <span className="font-semibold">{info.getValue()}</span>,
  }),
  columnHelper.accessor("mechanism_of_injury", {
    header: "Injury",
    cell: (info) => <span className="text-sm">{info.getValue() || "Unknown"}</span>,
  }),
  columnHelper.accessor("triage_category", {
    header: "Triage",
    cell: (info) => (
      <Badge className={triageColors[info.getValue() as keyof typeof triageColors] || "bg-gray-100"}>
        {info.getValue()}
      </Badge>
    ),
  }),
  columnHelper.accessor("precedence", {
    header: "Priority",
    cell: (info) => (
      <div className="flex items-center gap-2">
        {getCasualtyIcon(info.getValue())}
        <span className="text-sm">{info.getValue().replace(/_/g, " ")}</span>
      </div>
    ),
  }),
  columnHelper.accessor("evacuation_status", {
    header: "Status",
    cell: (info) => (
      <Badge variant="outline">
        {info.getValue().replace(/_/g, " ")}
      </Badge>
    ),
  }),
  columnHelper.accessor("receiving_facility", {
    header: "Receiving Facility",
    cell: (info) => info.getValue()?.name || "Not assigned",
  }),
  columnHelper.accessor("incident_datetime", {
    header: "Incident Time",
    cell: (info) => new Date(info.getValue()).toLocaleTimeString(),
  }),
];

export default function CasualtyTable({ casualties, loading }: { casualties: Casualty[]; loading: boolean }) {
  return <DataTable columns={columns} data={casualties} isLoading={loading} />;
}
```

### 4.3 Component: NineLineForm.tsx

```typescript
/**
 * NineLineForm.tsx
 *
 * 9-Line CASEVAC/MEDEVAC form following USMC protocol.
 * Fields follow the standard 9-line format exactly.
 */

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/lib/api";

interface NineLineFormProps {
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function NineLineForm({ onSubmit, onCancel }: NineLineFormProps) {
  const [formData, setFormData] = useState({
    unit_id: null,
    precedence: "PRIORITY",
    number_of_patients: 1,
    special_equipment_required: "NONE",
    security_at_pickup: "NO_ENEMY",
    patient_type: "LITTER",
    marking_method: "PANELS",
    nationality_status: "US_MILITARY",
    nbc_contamination: false,
    mechanism_of_injury: "",
    injuries_description: "",
    triage_category: "IMMEDIATE",
    location_lat: 0,
    location_lon: 0,
    location_mgrs: "",
    location_description: "",
    incident_datetime: new Date().toISOString().slice(0, 16),
    remarks: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">9-Line CASEVAC/MEDEVAC Report</h2>
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700">×</button>
      </div>

      {/* LINE 1: PRECEDENCE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line 1: Precedence</CardTitle>
          <CardDescription>Urgency of evacuation</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={formData.precedence} onValueChange={(v) => setFormData({...formData, precedence: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="URGENT_SURGICAL">Urgent Surgical (Life-threatening)</SelectItem>
              <SelectItem value="URGENT">Urgent (Non-surgical)</SelectItem>
              <SelectItem value="PRIORITY">Priority (Can wait 4 hours)</SelectItem>
              <SelectItem value="ROUTINE">Routine (Can wait 24 hours)</SelectItem>
              <SelectItem value="CONVENIENCE">Convenience (Medical convenience)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* LINE 2: NUMBER OF PATIENTS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line 2: Number of Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            min="1"
            value={formData.number_of_patients}
            onChange={(e) => setFormData({...formData, number_of_patients: parseInt(e.target.value) || 1})}
          />
        </CardContent>
      </Card>

      {/* LINE 3: SPECIAL EQUIPMENT */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line 3: Special Equipment Required</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={formData.special_equipment_required} onValueChange={(v) => setFormData({...formData, special_equipment_required: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">None</SelectItem>
              <SelectItem value="HOIST">Hoist (Vertical lift)</SelectItem>
              <SelectItem value="EXTRACTION">Extraction (Rope/cable)</SelectItem>
              <SelectItem value="VENTILATOR">Ventilator</SelectItem>
              <SelectItem value="DIFFICULT_TERRAIN">Difficult terrain extraction</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* LINE 4: SECURITY AT PICKUP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line 4: Security at Pickup</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={formData.security_at_pickup} onValueChange={(v) => setFormData({...formData, security_at_pickup: v})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NO_ENEMY">No enemy in area</SelectItem>
              <SelectItem value="POSSIBLE_ENEMY">Possible enemy in area</SelectItem>
              <SelectItem value="ENEMY_IN_AREA">Enemy in area</SelectItem>
              <SelectItem value="ARMED_ESCORT_REQUIRED">Armed escort required</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* LINES 5a & 5b: PATIENT TYPE & MARKING */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Line 5a: Patient Type</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={formData.patient_type} onValueChange={(v) => setFormData({...formData, patient_type: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LITTER">Litter (Non-ambulatory)</SelectItem>
                <SelectItem value="AMBULATORY">Ambulatory</SelectItem>
                <SelectItem value="MIXED">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Line 5b: Marking Method</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={formData.marking_method} onValueChange={(v) => setFormData({...formData, marking_method: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PANELS">VS-17 Panels</SelectItem>
                <SelectItem value="PYRO">Pyrotechnic (smoke/flares)</SelectItem>
                <SelectItem value="SMOKE">Smoke grenades</SelectItem>
                <SelectItem value="MIRROR">Signal mirror</SelectItem>
                <SelectItem value="NONE">None</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* LOCATION & TIME */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Incident Location & Time</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Latitude</Label>
              <Input type="number" step="0.0001" value={formData.location_lat} onChange={(e) => setFormData({...formData, location_lat: parseFloat(e.target.value)})} />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input type="number" step="0.0001" value={formData.location_lon} onChange={(e) => setFormData({...formData, location_lon: parseFloat(e.target.value)})} />
            </div>
          </div>
          <div>
            <Label>MGRS (Optional)</Label>
            <Input value={formData.location_mgrs} onChange={(e) => setFormData({...formData, location_mgrs: e.target.value})} />
          </div>
          <div>
            <Label>Location Description</Label>
            <Input value={formData.location_description} onChange={(e) => setFormData({...formData, location_description: e.target.value})} placeholder="e.g., Checkpoint 14, Forward Operating Base" />
          </div>
          <div>
            <Label>Incident Date/Time</Label>
            <Input type="datetime-local" value={formData.incident_datetime} onChange={(e) => setFormData({...formData, incident_datetime: e.target.value})} />
          </div>
        </CardContent>
      </Card>

      {/* INJURIES & TRIAGE */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Injury & Triage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mechanism of Injury</Label>
            <Input
              value={formData.mechanism_of_injury}
              onChange={(e) => setFormData({...formData, mechanism_of_injury: e.target.value})}
              placeholder="e.g., GSW ABDOMEN, BLAST FRAGMENT, CRUSH INJURY"
            />
          </div>
          <div>
            <Label>Injuries Description</Label>
            <Textarea
              value={formData.injuries_description}
              onChange={(e) => setFormData({...formData, injuries_description: e.target.value})}
              placeholder="Detailed description of injuries"
              rows={3}
            />
          </div>
          <div>
            <Label>Triage Category</Label>
            <Select value={formData.triage_category} onValueChange={(v) => setFormData({...formData, triage_category: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="IMMEDIATE">Immediate (T1 - Life-threatening)</SelectItem>
                <SelectItem value="DELAYED">Delayed (T2 - Serious but stable)</SelectItem>
                <SelectItem value="MINIMAL">Minimal (T3 - Minor)</SelectItem>
                <SelectItem value="EXPECTANT">Expectant (T4 - Non-salvageable)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* NBC & NATIONALITY */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">NBC Contamination</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2">
              <Checkbox
                checked={formData.nbc_contamination}
                onCheckedChange={(v) => setFormData({...formData, nbc_contamination: !!v})}
              />
              <span>Contaminated</span>
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Nationality Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={formData.nationality_status} onValueChange={(v) => setFormData({...formData, nationality_status: v})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US_MILITARY">US Military</SelectItem>
                <SelectItem value="US_CIVILIAN">US Civilian</SelectItem>
                <SelectItem value="COALITION">Coalition</SelectItem>
                <SelectItem value="EPW">EPW</SelectItem>
                <SelectItem value="CIVILIAN">Civilian</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* REMARKS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Line 9: Remarks</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.remarks}
            onChange={(e) => setFormData({...formData, remarks: e.target.value})}
            placeholder="Special equipment, authentication, or other remarks"
            rows={2}
          />
        </CardContent>
      </Card>

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 justify-end pt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button disabled={submitting} className="bg-red-600 hover:bg-red-700">
          {submitting ? "Submitting..." : "Submit 9-Line CASEVAC"}
        </Button>
      </div>
    </form>
  );
}
```

### 4.4 Component: MTFStatusCards.tsx

```typescript
/**
 * MTFStatusCards.tsx
 *
 * Medical Treatment Facility status cards showing capacity, capability, staffing.
 */

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Droplets, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MTF {
  id: number;
  name: string;
  facility_type: string;
  status: string;
  capacity: number;
  current_census: number;
  surgical_capability: boolean;
  blood_bank: boolean;
  physician_staffing: number;
  medic_staffing: number;
}

const mtfTypeLabels = {
  BAS: "Battalion Aid Station",
  STP: "Squad Trauma Platoon",
  FRSS: "Forward Resuscitative Surgical Suite",
  ROLE2: "Role 2 Hospital",
  ROLE2E: "Role 2 Enhanced",
  ROLE3: "Role 3 Hospital",
  ROLE4: "Stateside Hospital"
};

export default function MTFStatusCards({ facilities }: { facilities: MTF[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {facilities.map((facility) => {
        const capacityPercent = (facility.current_census / facility.capacity) * 100;
        const isAtCapacity = capacityPercent >= 90;

        return (
          <Card key={facility.id} className={isAtCapacity ? "border-red-300 bg-red-50" : ""}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    {facility.name}
                  </CardTitle>
                  <CardDescription>
                    {mtfTypeLabels[facility.facility_type as keyof typeof mtfTypeLabels]} ({facility.facility_type})
                  </CardDescription>
                </div>
                <Badge variant={facility.status === "OPERATIONAL" ? "default" : facility.status === "DEGRADED" ? "secondary" : "destructive"}>
                  {facility.status}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* CAPACITY */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Bed Capacity</span>
                  <span className="text-sm text-gray-600">{facility.current_census} / {facility.capacity}</span>
                </div>
                <Progress value={capacityPercent} className={isAtCapacity ? "bg-red-200" : ""} />
              </div>

              {/* CAPABILITIES & STAFFING */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Zap className="w-4 h-4" />
                    Surgical
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {facility.surgical_capability ? "Available" : "Not available"}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Droplets className="w-4 h-4 text-red-600" />
                    Blood Bank
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    {facility.blood_bank ? "Available" : "Not available"}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Users className="w-4 h-4" />
                    Doctors
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{facility.physician_staffing} present</p>
                </div>
              </div>

              {/* MEDIC STAFFING */}
              <div className="text-sm text-gray-600">
                {facility.medic_staffing} Combat Medics on duty
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
```

---

## Part 5: Pydantic Schemas

### 5.1 Medical Schemas

**File:** `backend/app/schemas/medical.py`

```python
"""Pydantic schemas for medical/CASEVAC endpoints."""

from datetime import datetime, date
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field


# ─── REQUEST SCHEMAS ──────────────────────────────────────────────────────

class CasualtyReportCreate(BaseModel):
    """Create a new 9-line CASEVAC report."""
    unit_id: int
    personnel_id: Optional[int] = None
    incident_datetime: datetime
    location_lat: float
    location_lon: float
    location_mgrs: Optional[str] = None
    location_description: Optional[str] = None

    precedence: str  # CASEVACPrecedence enum
    number_of_patients: int = 1
    special_equipment_required: str = "NONE"
    security_at_pickup: str = "NO_ENEMY"
    patient_type: str = "LITTER"
    marking_method: str = "PANELS"
    nationality_status: str = "US_MILITARY"
    nbc_contamination: bool = False

    mechanism_of_injury: Optional[str] = None
    injuries_description: Optional[str] = None
    triage_category: Optional[str] = "IMMEDIATE"
    tccc_interventions: Optional[dict] = None
    remarks: Optional[str] = None


class CasualtyReportUpdate(BaseModel):
    """Update a casualty report."""
    status: Optional[str] = None
    evacuation_status: Optional[str] = None
    receiving_facility_id: Optional[int] = None
    tccc_interventions: Optional[dict] = None
    pickup_time: Optional[datetime] = None
    arrival_at_facility_time: Optional[datetime] = None
    remarks: Optional[str] = None


# ─── RESPONSE SCHEMAS ────────────────────────────────────────────────────

class CasualtyLogResponse(BaseModel):
    id: int
    casualty_report_id: int
    event_type: str
    event_time: datetime
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class CasualtyReportResponse(BaseModel):
    """Full casualty report response."""
    id: int
    casualty_id: str
    unit_id: int
    personnel_id: Optional[int] = None
    incident_datetime: datetime
    reported_datetime: datetime

    location_lat: float
    location_lon: float
    location_mgrs: Optional[str] = None
    location_description: Optional[str] = None

    precedence: str
    number_of_patients: int
    special_equipment_required: str
    security_at_pickup: str
    patient_type: str
    marking_method: str
    nationality_status: str
    nbc_contamination: bool

    mechanism_of_injury: Optional[str] = None
    injuries_description: Optional[str] = None
    triage_category: Optional[str] = None
    tccc_interventions: Optional[dict] = None

    status: str
    evacuation_status: Optional[str] = None
    receiving_facility_id: Optional[int] = None
    pickup_time: Optional[datetime] = None
    arrival_at_facility_time: Optional[datetime] = None
    remarks: Optional[str] = None

    logs: List[CasualtyLogResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── MEDICAL TREATMENT FACILITY SCHEMAS ────────────────────────────────

class MTFResponse(BaseModel):
    """Medical treatment facility response."""
    id: int
    name: str
    facility_type: str
    callsign: Optional[str] = None
    unit_id: Optional[int] = None

    location_lat: float
    location_lon: float
    location_mgrs: Optional[str] = None

    capacity: int
    current_census: int
    status: str

    surgical_capability: bool
    blood_bank: bool
    vent_capacity: int

    contact_freq: Optional[str] = None
    physician_staffing: int
    medic_staffing: int

    class Config:
        from_attributes = True


class MTFCreate(BaseModel):
    """Create new MTF."""
    name: str
    facility_type: str
    unit_id: Optional[int] = None
    location_lat: float
    location_lon: float
    location_mgrs: Optional[str] = None
    capacity: int = 10
    surgical_capability: bool = False
    blood_bank: bool = False


class MTFUpdate(BaseModel):
    """Update MTF."""
    status: Optional[str] = None
    current_census: Optional[int] = None
    contact_freq: Optional[str] = None
    physician_staffing: Optional[int] = None
    medic_staffing: Optional[int] = None


# ─── BLOOD PRODUCT SCHEMAS ────────────────────────────────────────────

class BloodProductResponse(BaseModel):
    """Blood product inventory response."""
    id: int
    facility_id: int
    product_type: str
    blood_type: str
    units_on_hand: int
    units_used_24h: int
    expiration_date: Optional[date] = None
    walking_blood_bank_donors: int

    class Config:
        from_attributes = True


class BloodProductCreate(BaseModel):
    facility_id: int
    product_type: str
    blood_type: str
    units_on_hand: int = 0
    units_used_24h: int = 0
    expiration_date: Optional[date] = None
    walking_blood_bank_donors: int = 0


class BloodProductUpdate(BaseModel):
    units_on_hand: Optional[int] = None
    units_used_24h: Optional[int] = None
    expiration_date: Optional[date] = None
    walking_blood_bank_donors: Optional[int] = None


# ─── BURN RATE SCHEMAS ──────────────────────────────────────────────────

class BurnRateResponse(BaseModel):
    """Medical supply burn rate response."""
    id: int
    unit_id: int
    supply_catalog_item_id: int
    period_start: date
    period_end: date
    quantity_used: int
    quantity_on_hand: int
    days_of_supply: Optional[float] = None
    burn_rate_per_day: float
    projected_exhaustion_date: Optional[date] = None

    class Config:
        from_attributes = True


class BurnRateCreate(BaseModel):
    unit_id: int
    supply_catalog_item_id: int
    period_start: date
    period_end: date
    quantity_used: int
    quantity_on_hand: int
    burn_rate_per_day: float


# ─── PERSTAT MEDICAL SCHEMA ────────────────────────────────────────────

class PERSTATMedical(BaseModel):
    """Medical portion of PERSTAT (Personnel Status Report)."""
    unit_id: int
    total_strength: int
    effective_strength: int
    medical_holds: int
    active_casualties: int
    triage_breakdown: dict  # {IMMEDIATE, DELAYED, MINIMAL, EXPECTANT counts}
    tccc_cert_rate_pct: float
    blood_type_distribution: dict  # {O_NEG, O_POS, etc.}
    timestamp: str
```

---

## Part 6: Route Registration

**File:** `backend/app/main.py` (Update)

```python
# Add to the FastAPI app initialization:

from app.api import medical

# Include medical router
app.include_router(medical.router)
```

---

## Part 7: Database Migration

Create migration file `backend/alembic/versions/[timestamp]_add_medical_models.py`:

```python
"""Add medical logistics and CASEVAC models."""
from alembic import op
import sqlalchemy as sa

def upgrade():
    # Create casualty_reports table
    op.create_table(
        'casualty_reports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('casualty_id', sa.String(50), nullable=False, unique=True),
        sa.Column('personnel_id', sa.Integer(), nullable=True),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('reported_by_user_id', sa.Integer(), nullable=False),
        sa.Column('incident_datetime', sa.DateTime(timezone=True), nullable=False),
        sa.Column('reported_datetime', sa.DateTime(timezone=True), server_default=sa.func.now()),
        # ... (remaining columns)
        sa.ForeignKeyConstraint(['personnel_id'], ['personnel.id']),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id']),
        sa.ForeignKeyConstraint(['reported_by_user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    # ... (create other tables)

def downgrade():
    op.drop_table('casualty_reports')
    # ... (drop other tables)
```

---

## Part 8: Routes & Integration

**Update** `frontend/src/lib/api-routes.ts` to include:

```typescript
export const MEDICAL_ROUTES = {
  casualties: "/api/v1/medical/casualties",
  facilities: "/api/v1/medical/facilities",
  bloodProducts: "/api/v1/medical/blood-products",
  burnRates: "/api/v1/medical/burn-rates",
  perstat: "/api/v1/medical/perstat-medical",
};

// In router config:
{
  path: "/medical",
  element: <MedicalPage />,
  name: "Medical & CASEVAC",
}
```

---

## Key Features Summary

1. **9-Line CASEVAC Reporting** — Full form with USMC-compliant fields
2. **Casualty Evacuation Workflow** — Status tracking from REPORTED → CLOSED
3. **Medical Treatment Facility Management** — Capacity tracking, surgical capability, staffing
4. **Blood Product Inventory** — Type/product distribution, expiration tracking, walking blood bank
5. **Medical Supply Burn Rates** — Class VIII consumption forecasting with exhaustion projections
6. **PERSTAT Medical** — Unit medical readiness summary for command
7. **Map Integration** — MTF markers, CASEVAC routes, incident locations on Leaflet map
8. **TCCC Compliance** — Tourniquets, chest seals, airways, IV access tracking in JSON

---

## USMC/Military Terminology

- **9-Line**: Standard casualty evacuation request format (DoD standard)
- **TCCC**: Tactical Combat Casualty Care (care under fire → tactical field care → casualty evacuation care)
- **CASEVAC/MEDEVAC**: Combat Casualty Evacuation vs. Medical Evacuation
- **SALT Triage**: Sort, Assess, Lifesaving interventions, Treatment
- **MTF**: Medical Treatment Facility (aid station through hospital)
- **FRSS**: Forward Resuscitative Surgical Suite (battalion-level surgical capability)
- **BAS**: Battalion Aid Station (company-level medical)
- **Class VIII**: Medical supply classification
- **Triage**: T1-T4 (Immediate, Delayed, Minimal, Expectant)
- **Walking Blood Bank**: Pre-typed unit personnel available for emergency donation

---

## Testing & Deployment

- Run migrations: `alembic upgrade head`
- Seed test data with realistic USMC battalion medical structure
- Test 9-line form submission, casualty status workflow, MTF capacity updates
- Verify nearest-MTF routing algorithm with known coordinates
- Validate burn rate calculations with sample data
- Load test with 500+ concurrent casualties (stress test evacuations)

---

**Status**: Ready for Wave 1 development across Go/Node backend specialists and React frontend developer.
