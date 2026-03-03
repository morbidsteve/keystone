"""Equipment status schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class EquipmentBase(BaseModel):
    unit_id: int
    tamcn: str = Field(..., max_length=20)
    nomenclature: str = Field(..., max_length=100)
    total_possessed: int = Field(..., ge=0)
    mission_capable: int = Field(..., ge=0)
    not_mission_capable_maintenance: int = Field(0, ge=0)
    not_mission_capable_supply: int = Field(0, ge=0)
    readiness_pct: float = Field(..., ge=0, le=100)
    source: Optional[str] = None


class EquipmentCreate(EquipmentBase):
    pass


class EquipmentUpdate(BaseModel):
    unit_id: Optional[int] = None
    tamcn: Optional[str] = None
    nomenclature: Optional[str] = None
    total_possessed: Optional[int] = None
    mission_capable: Optional[int] = None
    not_mission_capable_maintenance: Optional[int] = None
    not_mission_capable_supply: Optional[int] = None
    readiness_pct: Optional[float] = None
    source: Optional[str] = None


class EquipmentResponse(EquipmentBase):
    id: int
    reported_at: datetime
    raw_data_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)
