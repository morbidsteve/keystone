"""Unit schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.unit import Echelon


class UnitBase(BaseModel):
    name: str = Field(..., max_length=100)
    abbreviation: str = Field(..., max_length=30)
    echelon: Echelon
    parent_id: Optional[int] = None
    uic: Optional[str] = None


class UnitCreate(UnitBase):
    pass


class UnitResponse(UnitBase):
    id: int
    created_at: Optional[datetime] = None
    children: Optional[List["UnitResponse"]] = None

    model_config = ConfigDict(from_attributes=True)


# Allow self-referential schema
UnitResponse.model_rebuild()
