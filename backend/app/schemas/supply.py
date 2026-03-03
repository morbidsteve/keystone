"""Supply status schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.supply import SupplyClass, SupplyStatus


class SupplyBase(BaseModel):
    unit_id: int
    supply_class: SupplyClass
    item_description: str = Field(..., max_length=255)
    on_hand_qty: float = Field(..., ge=0)
    required_qty: float = Field(..., ge=0)
    dos: float = Field(..., ge=0)
    consumption_rate: float = Field(0.0, ge=0)
    reorder_point: Optional[float] = None
    status: SupplyStatus
    source: Optional[str] = None


class SupplyCreate(SupplyBase):
    pass


class SupplyUpdate(BaseModel):
    unit_id: Optional[int] = None
    supply_class: Optional[SupplyClass] = None
    item_description: Optional[str] = None
    on_hand_qty: Optional[float] = None
    required_qty: Optional[float] = None
    dos: Optional[float] = None
    consumption_rate: Optional[float] = None
    reorder_point: Optional[float] = None
    status: Optional[SupplyStatus] = None
    source: Optional[str] = None


class SupplyResponse(SupplyBase):
    id: int
    reported_at: datetime
    raw_data_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class SupplyFilters(BaseModel):
    unit_id: Optional[int] = None
    supply_class: Optional[SupplyClass] = None
    status: Optional[SupplyStatus] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
