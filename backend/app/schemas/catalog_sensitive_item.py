"""Pydantic schemas for the sensitive item catalog."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.custody import SensitiveItemType


class CatalogItemCreate(BaseModel):
    nomenclature: str = Field(..., max_length=200)
    nsn: Optional[str] = Field(None, max_length=20)
    item_type: SensitiveItemType
    tamcn: Optional[str] = Field(None, max_length=20)
    aliases: list[str] = []
    category: Optional[str] = Field(None, max_length=50)


class CatalogItemUpdate(BaseModel):
    nomenclature: Optional[str] = Field(None, max_length=200)
    nsn: Optional[str] = Field(None, max_length=20)
    item_type: Optional[SensitiveItemType] = None
    tamcn: Optional[str] = Field(None, max_length=20)
    aliases: Optional[list[str]] = None
    category: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class CatalogItemResponse(BaseModel):
    id: int
    nomenclature: str
    nsn: Optional[str] = None
    item_type: SensitiveItemType
    tamcn: Optional[str] = None
    aliases: list[str] = []
    category: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
