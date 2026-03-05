"""Manning, billet structure, and qualification schemas."""

from datetime import date, datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- BilletStructure schemas ---


class BilletStructureCreate(BaseModel):
    unit_id: int
    billet_id_code: str = Field(..., max_length=30)
    billet_title: str = Field(..., max_length=100)
    mos_required: Optional[str] = Field(None, max_length=10)
    rank_required: Optional[str] = Field(None, max_length=20)
    is_key_billet: bool = False
    filled_by_id: Optional[int] = None
    filled_date: Optional[date] = None


class BilletStructureUpdate(BaseModel):
    billet_title: Optional[str] = Field(None, max_length=100)
    mos_required: Optional[str] = Field(None, max_length=10)
    rank_required: Optional[str] = Field(None, max_length=20)
    is_key_billet: Optional[bool] = None
    is_filled: Optional[bool] = None
    filled_by_id: Optional[int] = None
    filled_date: Optional[date] = None


class BilletStructureResponse(BaseModel):
    id: int
    unit_id: int
    billet_id_code: str
    billet_title: str
    mos_required: Optional[str] = None
    rank_required: Optional[str] = None
    is_key_billet: bool
    is_filled: bool
    filled_by_id: Optional[int] = None
    filled_date: Optional[date] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- ManningSnapshot schemas ---


class ManningSnapshotCreate(BaseModel):
    unit_id: int
    authorized_total: int = Field(..., ge=0)
    assigned_total: int = Field(..., ge=0)
    present_for_duty: int = Field(..., ge=0)
    fill_rate_pct: Optional[float] = None
    mos_shortfalls: Optional[Dict[str, Any]] = None
    rank_distribution: Optional[Dict[str, Any]] = None


class ManningSnapshotResponse(BaseModel):
    id: int
    unit_id: int
    snapshot_date: Optional[datetime] = None
    authorized_total: int
    assigned_total: int
    present_for_duty: int
    fill_rate_pct: Optional[float] = None
    mos_shortfalls: Optional[Dict[str, Any]] = None
    rank_distribution: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Qualification schemas ---


class QualificationCreate(BaseModel):
    personnel_id: int
    qualification_type: str = Field(..., max_length=50)
    qualification_name: str = Field(..., max_length=100)
    date_achieved: Optional[date] = None
    expiration_date: Optional[date] = None
    is_current: bool = True


class QualificationUpdate(BaseModel):
    qualification_type: Optional[str] = Field(None, max_length=50)
    qualification_name: Optional[str] = Field(None, max_length=100)
    date_achieved: Optional[date] = None
    expiration_date: Optional[date] = None
    is_current: Optional[bool] = None


class QualificationResponse(BaseModel):
    id: int
    personnel_id: int
    qualification_type: str
    qualification_name: str
    date_achieved: Optional[date] = None
    expiration_date: Optional[date] = None
    is_current: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Analytics response schemas ---


class UnitStrengthReport(BaseModel):
    unit_id: int
    total_assigned: int = 0
    total_present: int = 0
    total_authorized: int = 0
    fill_rate_pct: float = 0.0
    duty_status_breakdown: Dict[str, int] = {}
    status_breakdown: Dict[str, int] = {}


class MOSFillReport(BaseModel):
    unit_id: int
    mos_fill: List[Dict[str, Any]] = []


class QualificationStatusReport(BaseModel):
    unit_id: int
    rifle_qual_pct: float = 0.0
    pft_current_pct: float = 0.0
    cft_current_pct: float = 0.0
    swim_qual_pct: float = 0.0
    total_personnel: int = 0


class UpcomingLossReport(BaseModel):
    unit_id: int
    days_window: int = 90
    losses: List[Dict[str, Any]] = []


class KeyBilletVacancyReport(BaseModel):
    unit_id: int
    vacancies: List[Dict[str, Any]] = []


class PersonnelReadinessReport(BaseModel):
    unit_id: int
    p_rating: str = "P5"
    fill_score: float = 0.0
    qual_score: float = 0.0
    fitness_score: float = 0.0
    composite_score: float = 0.0
    details: Dict[str, Any] = {}
