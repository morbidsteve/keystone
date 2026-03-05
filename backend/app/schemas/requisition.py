"""Requisition workflow Pydantic schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.requisition import (
    ApprovalAction,
    ConditionCode,
    RequisitionPriority,
    RequisitionStatus,
)


# --- Line Item schemas ---


class RequisitionLineItemCreate(BaseModel):
    nsn: Optional[str] = Field(None, max_length=20)
    nomenclature: str = Field(..., max_length=200)
    quantity: int = Field(..., ge=1)
    unit_of_issue: str = Field("EA", max_length=20)
    unit_cost: Optional[float] = Field(None, ge=0)
    condition_code: Optional[ConditionCode] = ConditionCode.A
    notes: Optional[str] = None


class RequisitionLineItemResponse(BaseModel):
    id: int
    requisition_id: int
    nsn: Optional[str] = None
    nomenclature: str
    quantity: int
    unit_of_issue: str
    unit_cost: Optional[float] = None
    condition_code: Optional[ConditionCode] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Create / Action schemas ---


class RequisitionCreate(BaseModel):
    unit_id: int
    priority: RequisitionPriority = RequisitionPriority.P08
    justification: Optional[str] = None
    delivery_location: Optional[str] = Field(None, max_length=200)
    line_items: List[RequisitionLineItemCreate] = Field(..., min_length=1)


class RequisitionSubmit(BaseModel):
    justification: Optional[str] = None


class RequisitionApprove(BaseModel):
    comments: Optional[str] = None


class RequisitionDeny(BaseModel):
    comments: str = Field(..., min_length=1)


class RequisitionReceive(BaseModel):
    notes: Optional[str] = None


# --- Approval and History response schemas ---


class RequisitionApprovalResponse(BaseModel):
    id: int
    requisition_id: int
    approver_id: int
    action: ApprovalAction
    comments: Optional[str] = None
    acted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RequisitionStatusHistoryResponse(BaseModel):
    id: int
    requisition_id: int
    from_status: Optional[RequisitionStatus] = None
    to_status: RequisitionStatus
    changed_by_id: int
    notes: Optional[str] = None
    changed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Requisition response schemas ---


class RequisitionResponse(BaseModel):
    id: int
    requisition_number: str
    unit_id: int
    requested_by_id: int
    status: RequisitionStatus
    priority: RequisitionPriority
    justification: Optional[str] = None
    delivery_location: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    submitted_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    shipped_at: Optional[datetime] = None
    received_at: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    cancel_reason: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    line_items: List[RequisitionLineItemResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RequisitionDetailResponse(RequisitionResponse):
    approvals: List[RequisitionApprovalResponse] = []
    status_history: List[RequisitionStatusHistoryResponse] = []

    model_config = ConfigDict(from_attributes=True)


class RequisitionListResponse(BaseModel):
    items: List[RequisitionResponse]
    total: int
