"""Transportation / movement schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.transportation import MovementStatus


class MovementBase(BaseModel):
    unit_id: int
    convoy_id: Optional[str] = None
    origin: str = Field(..., max_length=100)
    destination: str = Field(..., max_length=100)
    departure_time: Optional[datetime] = None
    eta: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    vehicle_count: int = Field(0, ge=0)
    cargo_description: Optional[str] = None
    status: MovementStatus = MovementStatus.PLANNED
    source: Optional[str] = None


class MovementCreate(MovementBase):
    pass


class MovementUpdate(BaseModel):
    unit_id: Optional[int] = None
    convoy_id: Optional[str] = Field(None, max_length=50)
    origin: Optional[str] = Field(None, max_length=100)
    destination: Optional[str] = Field(None, max_length=100)
    departure_time: Optional[datetime] = None
    eta: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    vehicle_count: Optional[int] = Field(None, ge=0)
    cargo_description: Optional[str] = Field(None, max_length=500)
    status: Optional[MovementStatus] = None
    source: Optional[str] = Field(None, max_length=100)


class MovementResponse(MovementBase):
    id: int
    reported_at: datetime
    raw_data_id: Optional[int] = None
    convoy_plan_id: Optional[int] = None
    convoy_serial_id: Optional[int] = None
    march_table_data: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Convoy Cargo schemas ---


class ConvoyCargoCreate(BaseModel):
    convoy_vehicle_id: int
    description: Optional[str] = None
    quantity: int = Field(1, ge=1)
    weight_lbs: Optional[float] = Field(None, ge=0)
    is_hazmat: bool = False
    supply_catalog_item_id: Optional[int] = None
    equipment_catalog_item_id: Optional[int] = None


class ConvoyCargoResponse(BaseModel):
    id: int
    movement_id: int
    convoy_vehicle_id: int
    description: Optional[str] = None
    quantity: int
    weight_lbs: Optional[float] = None
    is_hazmat: bool
    supply_catalog_item_id: Optional[int] = None
    equipment_catalog_item_id: Optional[int] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Assignment validation schemas ---


class ValidateAssignmentRequest(BaseModel):
    personnel_id: int
    role: str
    vehicle_tamcn: str
    movement_id: int


class ValidateAssignmentResponse(BaseModel):
    valid: bool
    reason: str
    missing_qualifications: list[str] = []
    assigned_to_other_vehicle: bool = False


# --- Qualified personnel schemas ---


class QualifiedPersonnelItem(BaseModel):
    id: int
    edipi: str
    rank: Optional[str] = None
    first_name: str
    last_name: str
    mos: Optional[str] = None
    pay_grade: Optional[str] = None
    is_assigned_to_movement: bool = False
    qualifications: list[dict] = []

    model_config = ConfigDict(from_attributes=True)


class QualifiedPersonnelResponse(BaseModel):
    personnel: list[QualifiedPersonnelItem]
    total: int
    required_qualifications: list[str] = []
