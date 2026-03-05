"""Readiness and unit strength Pydantic schemas."""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict, Field


# --- Readiness Snapshot ---


class ReadinessSnapshotResponse(BaseModel):
    id: int
    unit_id: int
    snapshot_date: Optional[datetime] = None
    overall_readiness_pct: float
    equipment_readiness_pct: Optional[float] = None
    supply_readiness_pct: Optional[float] = None
    personnel_fill_pct: Optional[float] = None
    training_readiness_pct: Optional[float] = None
    t_rating: str
    c_rating: str
    s_rating: str
    r_rating: str
    p_rating: str
    limiting_factor: Optional[str] = None
    notes: Optional[str] = None
    reported_by_id: Optional[int] = None
    is_official: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ReadinessTrendResponse(BaseModel):
    unit_id: int
    days: int
    snapshot_count: int
    snapshots: List[ReadinessSnapshotResponse]


class SubordinateReadiness(BaseModel):
    unit_id: int
    unit_name: str
    abbreviation: str
    overall_readiness_pct: Optional[float] = None
    equipment_readiness_pct: Optional[float] = None
    supply_readiness_pct: Optional[float] = None
    personnel_fill_pct: Optional[float] = None
    training_readiness_pct: Optional[float] = None
    c_rating: Optional[str] = None
    snapshot_date: Optional[str] = None


class ReadinessAverages(BaseModel):
    avg_overall_readiness_pct: float
    avg_equipment_readiness_pct: float
    avg_supply_readiness_pct: float
    avg_personnel_fill_pct: float
    avg_training_readiness_pct: float


class ReadinessRollupResponse(BaseModel):
    unit_id: int
    num_subordinates: int
    avg_overall_readiness_pct: float
    avg_equipment_readiness_pct: float
    avg_supply_readiness_pct: float
    avg_personnel_fill_pct: float
    avg_training_readiness_pct: float
    subordinates: List[SubordinateReadiness]


class UnitDashboardEntry(BaseModel):
    unit_id: int
    unit_name: str
    abbreviation: str
    overall_readiness_pct: Optional[float] = None
    c_rating: Optional[str] = None
    snapshot_date: Optional[str] = None


class ReadinessDashboardResponse(BaseModel):
    timestamp: str
    unit_count: int
    units: List[UnitDashboardEntry]


class SnapshotCreateRequest(BaseModel):
    notes: Optional[str] = None
    is_official: bool = False


# --- Unit Strength ---


class UnitStrengthResponse(BaseModel):
    id: int
    unit_id: int
    reported_at: Optional[datetime] = None
    authorized_officers: int
    assigned_officers: int
    authorized_enlisted: int
    assigned_enlisted: int
    attached: int
    detached: int
    tad: int
    leave: int
    medical: int
    ua: int
    total_authorized: int
    total_assigned: int
    fill_pct: float
    mos_shortfalls: Optional[Any] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UnitStrengthUpdateRequest(BaseModel):
    authorized_officers: int = Field(0, ge=0)
    assigned_officers: int = Field(0, ge=0)
    authorized_enlisted: int = Field(0, ge=0)
    assigned_enlisted: int = Field(0, ge=0)
    attached: int = Field(0, ge=0)
    detached: int = Field(0, ge=0)
    tad: int = Field(0, ge=0)
    leave: int = Field(0, ge=0)
    medical: int = Field(0, ge=0)
    ua: int = Field(0, ge=0)
    mos_shortfalls: Optional[List[Any]] = None
    notes: Optional[str] = None
