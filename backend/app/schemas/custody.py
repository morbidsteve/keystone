"""Pydantic schemas for Audit Chain of Custody & Accountability."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.custody import (
    AuditAction,
    AuditEntityType,
    DiscrepancyType,
    InventoryStatus,
    InventoryType,
    ItemConditionCode,
    SecurityClassification,
    SensitiveItemStatus,
    SensitiveItemType,
    TransferType,
)


# ---------------------------------------------------------------------------
# Sensitive Item
# ---------------------------------------------------------------------------


class SensitiveItemCreate(BaseModel):
    unit_id: int
    item_type: SensitiveItemType
    serial_number: str = Field(..., max_length=100)
    nomenclature: str = Field(..., max_length=200)
    nsn: Optional[str] = Field(None, max_length=15)
    tamcn: Optional[str] = Field(None, max_length=20)
    security_classification: SecurityClassification = (
        SecurityClassification.UNCLASSIFIED
    )
    condition_code: ItemConditionCode = ItemConditionCode.A
    status: SensitiveItemStatus = SensitiveItemStatus.ON_HAND
    current_holder_id: Optional[int] = None
    hand_receipt_number: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=4000)

    @field_validator("item_type")
    @classmethod
    def validate_item_type(cls, v: str) -> str:
        if isinstance(v, str):
            SensitiveItemType(v)
        return v

    @field_validator("security_classification")
    @classmethod
    def validate_security_classification(cls, v: str) -> str:
        if isinstance(v, str):
            SecurityClassification(v)
        return v

    @field_validator("condition_code")
    @classmethod
    def validate_condition_code(cls, v: str) -> str:
        if isinstance(v, str):
            ItemConditionCode(v)
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if isinstance(v, str):
            SensitiveItemStatus(v)
        return v


class SensitiveItemUpdate(BaseModel):
    item_type: Optional[SensitiveItemType] = None
    serial_number: Optional[str] = Field(None, max_length=100)
    nomenclature: Optional[str] = Field(None, max_length=200)
    nsn: Optional[str] = Field(None, max_length=15)
    tamcn: Optional[str] = Field(None, max_length=20)
    security_classification: Optional[SecurityClassification] = None
    condition_code: Optional[ItemConditionCode] = None
    current_holder_id: Optional[int] = None
    hand_receipt_number: Optional[str] = Field(None, max_length=50)
    notes: Optional[str] = Field(None, max_length=4000)


class SensitiveItemResponse(BaseModel):
    id: int
    unit_id: int
    item_type: SensitiveItemType
    serial_number: str
    nomenclature: str
    nsn: Optional[str] = None
    tamcn: Optional[str] = None
    security_classification: SecurityClassification
    condition_code: ItemConditionCode
    status: SensitiveItemStatus
    current_holder_id: Optional[int] = None
    hand_receipt_number: Optional[str] = None
    notes: Optional[str] = None
    created_by_user_id: int
    updated_by_user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Custody Transfer
# ---------------------------------------------------------------------------


class CustodyTransferCreate(BaseModel):
    sensitive_item_id: int
    transfer_type: TransferType
    from_personnel_id: Optional[int] = None
    to_personnel_id: Optional[int] = None
    from_unit_id: Optional[int] = None
    to_unit_id: Optional[int] = None
    document_number: Optional[str] = Field(None, max_length=50)
    reason: Optional[str] = Field(None, max_length=4000)
    notes: Optional[str] = Field(None, max_length=4000)

    @field_validator("transfer_type")
    @classmethod
    def validate_transfer_type(cls, v: str) -> str:
        if isinstance(v, str):
            TransferType(v)
        return v


class CustodyTransferResponse(BaseModel):
    id: int
    sensitive_item_id: int
    transfer_type: TransferType
    from_personnel_id: Optional[int] = None
    to_personnel_id: Optional[int] = None
    from_unit_id: Optional[int] = None
    to_unit_id: Optional[int] = None
    document_number: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    transferred_by_user_id: int
    transferred_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Inventory Event
# ---------------------------------------------------------------------------


class InventoryEventCreate(BaseModel):
    unit_id: int
    inventory_type: InventoryType
    scheduled_date: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=4000)

    @field_validator("inventory_type")
    @classmethod
    def validate_inventory_type(cls, v: str) -> str:
        if isinstance(v, str):
            InventoryType(v)
        return v


class InventoryEventResponse(BaseModel):
    id: int
    unit_id: int
    inventory_type: InventoryType
    status: InventoryStatus
    scheduled_date: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    total_items: int
    items_verified: int
    discrepancies_found: int
    notes: Optional[str] = None
    conducted_by_user_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Inventory Line Item
# ---------------------------------------------------------------------------


class InventoryLineItemCreate(BaseModel):
    sensitive_item_id: int
    verified: bool = False
    serial_number_verified: bool = False
    condition_code: Optional[ItemConditionCode] = None
    discrepancy_type: DiscrepancyType = DiscrepancyType.NONE
    discrepancy_notes: Optional[str] = Field(None, max_length=4000)

    @field_validator("discrepancy_type")
    @classmethod
    def validate_discrepancy_type(cls, v: str) -> str:
        if isinstance(v, str):
            DiscrepancyType(v)
        return v


class InventoryLineItemResponse(BaseModel):
    id: int
    inventory_event_id: int
    sensitive_item_id: int
    verified: bool
    serial_number_verified: bool
    condition_code: Optional[ItemConditionCode] = None
    discrepancy_type: DiscrepancyType
    discrepancy_notes: Optional[str] = None
    verified_by_user_id: Optional[int] = None
    verified_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Audit Log
# ---------------------------------------------------------------------------


class AuditLogResponse(BaseModel):
    id: int
    user_id: int
    action: AuditAction
    entity_type: AuditEntityType
    entity_id: Optional[int] = None
    description: str
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Composite Responses
# ---------------------------------------------------------------------------


class CustodyChainResponse(BaseModel):
    item: SensitiveItemResponse
    transfers: List[CustodyTransferResponse]


class HandReceiptResponse(BaseModel):
    personnel_id: int
    items: List[SensitiveItemResponse]
    total_items: int


class InventoryResultResponse(BaseModel):
    event: InventoryEventResponse
    line_items: List[InventoryLineItemResponse]
