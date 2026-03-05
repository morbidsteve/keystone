"""Maintenance work order, parts, labor, deadline, PM schedule, and ERO schemas."""

from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.maintenance import (
    AssignmentRole,
    LaborType,
    PartSource,
    PartStatus,
    WorkOrderCategory,
    WorkOrderStatus,
)
from app.models.maintenance_schedule import (
    DeadlineReason,
    EROStatus,
    PMType,
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
    assigned_to_id: Optional[int] = None


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
    assigned_to_id: Optional[int] = None


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
    assigned_to_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


class MaintenanceWorkOrderDetailResponse(MaintenanceWorkOrderResponse):
    parts: List[MaintenancePartResponse] = []
    labor_entries: List[MaintenanceLaborResponse] = []

    model_config = ConfigDict(from_attributes=True)


# --- MaintenanceDeadline schemas ---


class MaintenanceDeadlineCreate(BaseModel):
    unit_id: int
    equipment_id: int
    reason: DeadlineReason
    work_order_id: Optional[int] = None
    notes: Optional[str] = Field(None, max_length=5000)


class MaintenanceDeadlineUpdate(BaseModel):
    notes: Optional[str] = Field(None, max_length=5000)


class MaintenanceDeadlineResponse(BaseModel):
    id: int
    unit_id: int
    equipment_id: int
    deadline_date: Optional[datetime] = None
    reason: DeadlineReason
    work_order_id: Optional[int] = None
    lifted_date: Optional[datetime] = None
    lifted_by: Optional[str] = None
    notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- PreventiveMaintenanceSchedule schemas ---


class PreventiveMaintenanceScheduleCreate(BaseModel):
    unit_id: int
    equipment_id: int
    pm_type: PMType
    interval_value: int = Field(..., ge=1)
    last_performed: Optional[datetime] = None
    next_due: Optional[datetime] = None


class PreventiveMaintenanceScheduleResponse(BaseModel):
    id: int
    unit_id: int
    equipment_id: int
    pm_type: PMType
    interval_value: int
    last_performed: Optional[datetime] = None
    next_due: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- EquipmentRepairOrder schemas ---


class EquipmentRepairOrderCreate(BaseModel):
    unit_id: int
    equipment_id: int
    ero_number: str = Field(..., max_length=50)
    status: EROStatus = EROStatus.SUBMITTED
    intermediate_maintenance_activity: str = Field(..., max_length=200)
    estimated_return_date: Optional[datetime] = None
    work_order_id: Optional[int] = None
    repair_description: Optional[str] = Field(None, max_length=5000)


class EquipmentRepairOrderResponse(BaseModel):
    id: int
    unit_id: int
    equipment_id: int
    ero_number: str
    submitted_date: Optional[datetime] = None
    status: EROStatus
    intermediate_maintenance_activity: str
    estimated_return_date: Optional[datetime] = None
    actual_return_date: Optional[datetime] = None
    work_order_id: Optional[int] = None
    repair_description: Optional[str] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- WorkOrderAssignment schemas ---


class WorkOrderAssignmentCreate(BaseModel):
    personnel_id: int
    role: AssignmentRole = AssignmentRole.SUPPORT


class WorkOrderAssignmentResponse(BaseModel):
    id: int
    work_order_id: int
    personnel_id: int
    role: AssignmentRole
    assigned_at: Optional[datetime] = None
    unassigned_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
