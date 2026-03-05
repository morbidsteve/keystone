"""Pydantic schemas for medical logistics, CASEVAC, MTF, blood products, and burn rates."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.medical import (
    BloodProductType,
    BloodType,
    CASEVACPrecedence,
    CasualtyReportStatus,
    EvacuationStatus,
    MarkingMethod,
    MedicalTreatmentFacilityType,
    MTFStatus,
    NationalityStatus,
    PatientType,
    SecurityAtPickup,
    SpecialEquipmentRequired,
    TransportMethod,
    TriageCategory,
)


# ---------------------------------------------------------------------------
# Casualty Log
# ---------------------------------------------------------------------------


class CasualtyLogResponse(BaseModel):
    id: int
    casualty_report_id: int
    event_type: str
    event_time: Optional[datetime] = None
    recorded_by_user_id: int
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Casualty Report
# ---------------------------------------------------------------------------


class CasualtyReportCreate(BaseModel):
    personnel_id: Optional[int] = None
    unit_id: int
    incident_datetime: datetime

    # Location
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    mgrs: Optional[str] = Field(None, max_length=20)
    location_description: Optional[str] = Field(None, max_length=255)

    # 9-Line
    precedence: CASEVACPrecedence = CASEVACPrecedence.ROUTINE
    number_of_patients: int = Field(1, ge=1, le=999)
    special_equipment: SpecialEquipmentRequired = SpecialEquipmentRequired.NONE
    security_at_pickup: SecurityAtPickup = SecurityAtPickup.NO_ENEMY
    patient_type: PatientType = PatientType.US_MILITARY
    marking_method: MarkingMethod = MarkingMethod.PANELS
    nationality_status: NationalityStatus = NationalityStatus.US
    nbc_contamination: bool = False

    # Injury
    mechanism_of_injury: Optional[str] = Field(None, max_length=200)
    injuries_description: Optional[str] = Field(None, max_length=5000)
    triage_category: Optional[TriageCategory] = None

    # TCCC (JSON string or list)
    tccc_interventions: Optional[str] = Field(None, max_length=5000)

    # Evacuation (optional at creation)
    transport_method: Optional[TransportMethod] = None
    receiving_facility_id: Optional[int] = None

    remarks: Optional[str] = Field(None, max_length=5000)


class CasualtyReportUpdate(BaseModel):
    personnel_id: Optional[int] = None

    # Location
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    mgrs: Optional[str] = Field(None, max_length=20)
    location_description: Optional[str] = Field(None, max_length=255)

    # 9-Line
    precedence: Optional[CASEVACPrecedence] = None
    number_of_patients: Optional[int] = Field(None, ge=1, le=999)
    special_equipment: Optional[SpecialEquipmentRequired] = None
    security_at_pickup: Optional[SecurityAtPickup] = None
    patient_type: Optional[PatientType] = None
    marking_method: Optional[MarkingMethod] = None
    nationality_status: Optional[NationalityStatus] = None
    nbc_contamination: Optional[bool] = None

    # Injury
    mechanism_of_injury: Optional[str] = Field(None, max_length=200)
    injuries_description: Optional[str] = Field(None, max_length=5000)
    triage_category: Optional[TriageCategory] = None
    tccc_interventions: Optional[str] = Field(None, max_length=5000)

    # H-1 fix: transport_method removed — only settable via dispatch workflow
    remarks: Optional[str] = Field(None, max_length=5000)


class CasualtyReportResponse(BaseModel):
    id: int
    casualty_id: str
    personnel_id: Optional[int] = None
    unit_id: int
    reported_by_user_id: int
    incident_datetime: datetime

    # Location
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    mgrs: Optional[str] = None
    location_description: Optional[str] = None

    # 9-Line
    precedence: CASEVACPrecedence
    number_of_patients: int
    special_equipment: SpecialEquipmentRequired
    security_at_pickup: SecurityAtPickup
    patient_type: PatientType
    marking_method: MarkingMethod
    nationality_status: NationalityStatus
    nbc_contamination: bool

    # Injury
    mechanism_of_injury: Optional[str] = None
    injuries_description: Optional[str] = None
    triage_category: Optional[TriageCategory] = None
    tccc_interventions: Optional[str] = None

    # Evacuation
    status: CasualtyReportStatus
    transport_method: Optional[TransportMethod] = None
    evacuation_status: EvacuationStatus
    receiving_facility_id: Optional[int] = None
    pickup_time: Optional[datetime] = None
    arrival_at_facility_time: Optional[datetime] = None

    disposition: Optional[str] = None
    remarks: Optional[str] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    logs: List[CasualtyLogResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Medical Treatment Facility
# ---------------------------------------------------------------------------


class MTFCreate(BaseModel):
    name: str = Field(..., max_length=100)
    facility_type: MedicalTreatmentFacilityType
    callsign: Optional[str] = Field(None, max_length=30)
    unit_id: Optional[int] = None

    # Location
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    mgrs: Optional[str] = Field(None, max_length=20)

    # Capacity
    capacity: Optional[int] = Field(None, ge=0)
    current_census: int = Field(0, ge=0)
    status: MTFStatus = MTFStatus.OPERATIONAL

    # Capabilities
    surgical: bool = False
    blood_bank: bool = False
    vent_capacity: Optional[int] = Field(0, ge=0)
    x_ray: bool = False
    ultrasound: bool = False
    dental: bool = False

    # Comms
    contact_freq: Optional[str] = Field(None, max_length=30)
    alternate_freq: Optional[str] = Field(None, max_length=30)
    phone: Optional[str] = Field(None, max_length=30)

    # Staffing
    physician_count: int = Field(0, ge=0)
    pa_count: int = Field(0, ge=0)
    medic_count: int = Field(0, ge=0)
    surgical_tech_count: int = Field(0, ge=0)


class MTFUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    facility_type: Optional[MedicalTreatmentFacilityType] = None
    callsign: Optional[str] = Field(None, max_length=30)
    unit_id: Optional[int] = None

    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    mgrs: Optional[str] = Field(None, max_length=20)

    capacity: Optional[int] = Field(None, ge=0)
    current_census: Optional[int] = Field(None, ge=0)
    status: Optional[MTFStatus] = None

    surgical: Optional[bool] = None
    blood_bank: Optional[bool] = None
    vent_capacity: Optional[int] = Field(None, ge=0)
    x_ray: Optional[bool] = None
    ultrasound: Optional[bool] = None
    dental: Optional[bool] = None

    contact_freq: Optional[str] = Field(None, max_length=30)
    alternate_freq: Optional[str] = Field(None, max_length=30)
    phone: Optional[str] = Field(None, max_length=30)

    physician_count: Optional[int] = Field(None, ge=0)
    pa_count: Optional[int] = Field(None, ge=0)
    medic_count: Optional[int] = Field(None, ge=0)
    surgical_tech_count: Optional[int] = Field(None, ge=0)


class MTFResponse(BaseModel):
    id: int
    name: str
    facility_type: MedicalTreatmentFacilityType
    callsign: Optional[str] = None
    unit_id: Optional[int] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    mgrs: Optional[str] = None

    capacity: Optional[int] = None
    current_census: int
    status: MTFStatus

    surgical: bool
    blood_bank: bool
    vent_capacity: Optional[int] = None
    x_ray: bool
    ultrasound: bool
    dental: bool

    contact_freq: Optional[str] = None
    alternate_freq: Optional[str] = None
    phone: Optional[str] = None

    physician_count: int
    pa_count: int
    medic_count: int
    surgical_tech_count: int

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Blood Product
# ---------------------------------------------------------------------------


class BloodProductCreate(BaseModel):
    facility_id: int
    product_type: BloodProductType
    blood_type: BloodType
    units_on_hand: int = Field(0, ge=0)
    units_used_24h: int = Field(0, ge=0)
    expiration_date: Optional[date] = None
    walking_blood_bank_donors: int = Field(0, ge=0)


class BloodProductUpdate(BaseModel):
    product_type: Optional[BloodProductType] = None
    blood_type: Optional[BloodType] = None
    units_on_hand: Optional[int] = Field(None, ge=0)
    units_used_24h: Optional[int] = Field(None, ge=0)
    expiration_date: Optional[date] = None
    walking_blood_bank_donors: Optional[int] = Field(None, ge=0)


class BloodProductResponse(BaseModel):
    id: int
    facility_id: int
    product_type: BloodProductType
    blood_type: BloodType
    units_on_hand: int
    units_used_24h: int
    expiration_date: Optional[date] = None
    walking_blood_bank_donors: int

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Medical Supply Burn Rate
# ---------------------------------------------------------------------------


class BurnRateCreate(BaseModel):
    unit_id: int
    supply_catalog_item_id: int
    period_start: date
    period_end: date
    quantity_used: int = Field(0, ge=0)
    quantity_on_hand: int = Field(0, ge=0)
    days_of_supply: Optional[float] = Field(None, ge=0)
    burn_rate_per_day: Optional[float] = Field(None, ge=0)
    projected_exhaustion_date: Optional[date] = None
    critical_threshold: int = Field(3, ge=0)
    warning_threshold: int = Field(7, ge=0)


class BurnRateResponse(BaseModel):
    id: int
    unit_id: int
    supply_catalog_item_id: int
    period_start: date
    period_end: date
    quantity_used: int
    quantity_on_hand: int
    days_of_supply: Optional[float] = None
    burn_rate_per_day: Optional[float] = None
    projected_exhaustion_date: Optional[date] = None
    critical_threshold: int
    warning_threshold: int

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Dispatch / Arrival request bodies
# ---------------------------------------------------------------------------


class DispatchRequest(BaseModel):
    facility_id: int
    transport_method: TransportMethod


class ArrivalRequest(BaseModel):
    notes: Optional[str] = Field(None, max_length=2000)


class CloseRequest(BaseModel):
    disposition: str = Field(..., max_length=200)
