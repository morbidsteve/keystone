"""Maintenance work order, parts, and labor schemas."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.maintenance import (
    LaborType,
    PartSource,
    PartStatus,
    WorkOrderCategory,
    WorkOrderStatus,
)


# --- MaintenancePart schemas ---


class MaintenancePartCreate(BaseModel):
    nsn: Optional[str] = Field(None, max_length=20)
    part_number: str = Field(..., max_length=50)
    nomenclature: str = Field(..., max_length=100)
    quantity: int = Field(..., ge=1)
    unit_cost: Optional[float] = Field(None, ge=0)
    source: PartSource = PartSource.ON_HAND
    status: PartStatus = PartStatus.NEEDED


class MaintenancePartUpdate(BaseModel):
    nsn: Optional[str] = Field(None, max_length=20)
    part_number: Optional[str] = Field(None, max_length=50)
    nomenclature: Optional[str] = Field(None, max_length=100)
    quantity: Optional[int] = Field(None, ge=1)
    unit_cost: Optional[float] = Field(None, ge=0)
    source: Optional[PartSource] = None
    status: Optional[PartStatus] = None


class MaintenancePartResponse(BaseModel):
    id: int
    work_order_id: int
    nsn: Optional[str] = None
    part_number: str
    nomenclature: str
    quantity: int
    unit_cost: Optional[float] = None
    source: PartSource
    status: PartStatus

    model_config = ConfigDict(from_attributes=True)


# --- MaintenanceLabor schemas ---


class MaintenanceLaborCreate(BaseModel):
    personnel_id: int
    labor_type: LaborType
    hours: float = Field(..., gt=0)
    date: date
    notes: Optional[str] = Field(None, max_length=2000)


class MaintenanceLaborUpdate(BaseModel):
    personnel_id: Optional[int] = None
    labor_type: Optional[LaborType] = None
    hours: Optional[float] = Field(None, gt=0)
    date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=2000)


class MaintenanceLaborResponse(BaseModel):
    id: int
    work_order_id: int
    personnel_id: int
    labor_type: LaborType
    hours: float
    date: date
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- MaintenanceWorkOrder schemas ---


class MaintenanceWorkOrderCreate(BaseModel):
    unit_id: int
    equipment_id: Optional[int] = None
    individual_equipment_id: Optional[int] = None
    work_order_number: str = Field(..., max_length=50)
    description: Optional[str] = Field(None, max_length=5000)
    status: WorkOrderStatus = WorkOrderStatus.OPEN
    category: Optional[WorkOrderCategory] = None
    priority: int = Field(3, ge=1, le=5)
    parts_required: Optional[str] = Field(None, max_length=2000)
    estimated_completion: Optional[datetime] = None
    actual_hours: Optional[float] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=100)
    assigned_to: Optional[str] = Field(None, max_length=100)


class MaintenanceWorkOrderUpdate(BaseModel):
    unit_id: Optional[int] = None
    equipment_id: Optional[int] = None
    individual_equipment_id: Optional[int] = None
    work_order_number: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=5000)
    status: Optional[WorkOrderStatus] = None
    category: Optional[WorkOrderCategory] = None
    priority: Optional[int] = Field(None, ge=1, le=5)
    parts_required: Optional[str] = Field(None, max_length=2000)
    estimated_completion: Optional[datetime] = None
    actual_hours: Optional[float] = Field(None, ge=0)
    location: Optional[str] = Field(None, max_length=100)
    completed_at: Optional[datetime] = None
    assigned_to: Optional[str] = Field(None, max_length=100)


class MaintenanceWorkOrderResponse(BaseModel):
    id: int
    unit_id: int
    equipment_id: Optional[int] = None
    individual_equipment_id: Optional[int] = None
    work_order_number: str
    description: Optional[str] = None
    status: WorkOrderStatus
    category: Optional[WorkOrderCategory] = None
    priority: int
    parts_required: Optional[str] = None
    estimated_completion: Optional[datetime] = None
    actual_hours: Optional[float] = None
    location: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    assigned_to: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MaintenanceWorkOrderDetailResponse(MaintenanceWorkOrderResponse):
    parts: List[MaintenancePartResponse] = []
    labor_entries: List[MaintenanceLaborResponse] = []

    model_config = ConfigDict(from_attributes=True)
