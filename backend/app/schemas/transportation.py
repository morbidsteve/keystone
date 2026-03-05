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
    convoy_id: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    departure_time: Optional[datetime] = None
    eta: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    vehicle_count: Optional[int] = None
    cargo_description: Optional[str] = None
    status: Optional[MovementStatus] = None
    source: Optional[str] = None


class MovementResponse(MovementBase):
    id: int
    reported_at: datetime
    raw_data_id: Optional[int] = None
    convoy_plan_id: Optional[int] = None
    convoy_serial_id: Optional[int] = None
    march_table_data: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
