"""Inventory Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.inventory import TransactionType


class InventoryRecordCreate(BaseModel):
    unit_id: int
    nsn: Optional[str] = Field(None, max_length=20)
    nomenclature: str = Field(..., max_length=200)
    location: Optional[str] = Field(None, max_length=200)
    unit_of_issue: str = Field("EA", max_length=20)
    quantity_on_hand: float = Field(0.0, ge=0)
    quantity_due_in: float = Field(0.0, ge=0)
    quantity_due_out: float = Field(0.0, ge=0)
    reorder_point: Optional[float] = Field(None, ge=0)


class InventoryRecordResponse(BaseModel):
    id: int
    unit_id: int
    nsn: Optional[str] = None
    nomenclature: str
    location: Optional[str] = None
    unit_of_issue: str
    quantity_on_hand: float
    quantity_due_in: float
    quantity_due_out: float
    reorder_point: Optional[float] = None
    last_inventoried: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InventoryTransactionCreate(BaseModel):
    inventory_record_id: int
    transaction_type: TransactionType
    quantity: float = Field(..., gt=0)
    reference_number: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = None


class InventoryTransactionResponse(BaseModel):
    id: int
    inventory_record_id: int
    transaction_type: TransactionType
    quantity: float
    performed_by_id: int
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LowStockAlert(BaseModel):
    inventory_record_id: int
    unit_id: int
    nsn: Optional[str] = None
    nomenclature: str
    location: Optional[str] = None
    quantity_on_hand: float
    reorder_point: float
    deficit: float
