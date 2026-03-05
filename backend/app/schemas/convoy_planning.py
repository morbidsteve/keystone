"""Convoy planning, serial, and lift request Pydantic schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.convoy_planning import (
    CargoType,
    ConvoyPlanStatus,
    LiftRequestPriority,
    LiftRequestStatus,
    RiskAssessmentLevel,
)


# --- Convoy Serial schemas ---


class ConvoySerialCreate(BaseModel):
    serial_number: str = Field(..., max_length=10)
    serial_commander_id: Optional[int] = None
    vehicle_count: int = Field(0, ge=0)
    pax_count: int = Field(0, ge=0)
    march_order: Optional[int] = None
    march_speed_kph: float = Field(40.0, gt=0)
    catch_up_speed_kph: float = Field(60.0, gt=0)
    interval_meters: int = Field(50, ge=0)


class ConvoySerialUpdate(BaseModel):
    serial_number: Optional[str] = Field(None, max_length=10)
    serial_commander_id: Optional[int] = None
    vehicle_count: Optional[int] = Field(None, ge=0)
    pax_count: Optional[int] = Field(None, ge=0)
    march_order: Optional[int] = None
    march_speed_kph: Optional[float] = Field(None, gt=0)
    catch_up_speed_kph: Optional[float] = Field(None, gt=0)
    interval_meters: Optional[int] = Field(None, ge=0)


class ConvoySerialResponse(BaseModel):
    id: int
    convoy_plan_id: int
    serial_number: str
    serial_commander_id: Optional[int] = None
    vehicle_count: int
    pax_count: int
    march_order: Optional[int] = None
    march_speed_kph: float
    catch_up_speed_kph: float
    interval_meters: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Convoy Plan schemas ---


class ConvoyPlanCreate(BaseModel):
    name: str = Field(..., max_length=150)
    unit_id: int
    route_name: Optional[str] = Field(None, max_length=100)
    route_description: Optional[str] = None
    total_distance_km: Optional[float] = None
    estimated_duration_hours: Optional[float] = None
    route_primary: Optional[str] = None
    route_alternate: Optional[str] = None
    departure_time_planned: Optional[datetime] = None
    sp_time: Optional[datetime] = None
    rp_time: Optional[datetime] = None
    brief_time: Optional[datetime] = None
    rehearsal_time: Optional[datetime] = None
    movement_credit_number: Optional[str] = Field(None, max_length=50)
    convoy_commander_id: Optional[int] = None
    risk_assessment_level: RiskAssessmentLevel = RiskAssessmentLevel.MEDIUM
    comm_plan: Optional[str] = None
    recovery_plan: Optional[str] = None
    medevac_plan: Optional[str] = None


class ConvoyPlanUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=150)
    route_name: Optional[str] = Field(None, max_length=100)
    route_description: Optional[str] = None
    total_distance_km: Optional[float] = None
    estimated_duration_hours: Optional[float] = None
    route_primary: Optional[str] = None
    route_alternate: Optional[str] = None
    departure_time_planned: Optional[datetime] = None
    sp_time: Optional[datetime] = None
    rp_time: Optional[datetime] = None
    brief_time: Optional[datetime] = None
    rehearsal_time: Optional[datetime] = None
    movement_credit_number: Optional[str] = Field(None, max_length=50)
    convoy_commander_id: Optional[int] = None
    risk_assessment_level: Optional[RiskAssessmentLevel] = None
    comm_plan: Optional[str] = None
    recovery_plan: Optional[str] = None
    medevac_plan: Optional[str] = None


class ConvoyPlanResponse(BaseModel):
    id: int
    name: str
    unit_id: int
    created_by: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    route_name: Optional[str] = None
    route_description: Optional[str] = None
    total_distance_km: Optional[float] = None
    estimated_duration_hours: Optional[float] = None
    route_primary: Optional[str] = None
    route_alternate: Optional[str] = None
    departure_time_planned: Optional[datetime] = None
    sp_time: Optional[datetime] = None
    rp_time: Optional[datetime] = None
    brief_time: Optional[datetime] = None
    rehearsal_time: Optional[datetime] = None
    movement_credit_number: Optional[str] = None
    convoy_commander_id: Optional[int] = None
    status: ConvoyPlanStatus
    risk_assessment_level: RiskAssessmentLevel
    comm_plan: Optional[str] = None
    recovery_plan: Optional[str] = None
    medevac_plan: Optional[str] = None
    serials: List[ConvoySerialResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- Lift Request schemas ---


class LiftRequestCreate(BaseModel):
    requesting_unit_id: int
    cargo_type: CargoType
    cargo_description: Optional[str] = None
    weight_lbs: Optional[int] = None
    cube_ft: Optional[float] = None
    pax_count: int = Field(0, ge=0)
    hazmat: bool = False
    priority: LiftRequestPriority = LiftRequestPriority.ROUTINE
    required_delivery_date: Optional[datetime] = None
    pickup_location: Optional[str] = Field(None, max_length=150)
    pickup_lat: Optional[float] = None
    pickup_lon: Optional[float] = None
    delivery_location: Optional[str] = Field(None, max_length=150)
    delivery_lat: Optional[float] = None
    delivery_lon: Optional[float] = None


class LiftRequestUpdate(BaseModel):
    cargo_type: Optional[CargoType] = None
    cargo_description: Optional[str] = None
    weight_lbs: Optional[int] = None
    cube_ft: Optional[float] = None
    pax_count: Optional[int] = Field(None, ge=0)
    hazmat: Optional[bool] = None
    priority: Optional[LiftRequestPriority] = None
    required_delivery_date: Optional[datetime] = None
    pickup_location: Optional[str] = Field(None, max_length=150)
    pickup_lat: Optional[float] = None
    pickup_lon: Optional[float] = None
    delivery_location: Optional[str] = Field(None, max_length=150)
    delivery_lat: Optional[float] = None
    delivery_lon: Optional[float] = None


class LiftRequestAssign(BaseModel):
    assigned_movement_id: int


class LiftRequestApprove(BaseModel):
    supporting_unit_id: int


class LiftRequestResponse(BaseModel):
    id: int
    requesting_unit_id: int
    supporting_unit_id: Optional[int] = None
    cargo_type: CargoType
    cargo_description: Optional[str] = None
    weight_lbs: Optional[int] = None
    cube_ft: Optional[float] = None
    pax_count: int
    hazmat: bool
    priority: LiftRequestPriority
    required_delivery_date: Optional[datetime] = None
    status: LiftRequestStatus
    pickup_location: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lon: Optional[float] = None
    delivery_location: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_lon: Optional[float] = None
    assigned_movement_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
