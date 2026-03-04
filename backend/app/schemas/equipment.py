"""Equipment status and individual equipment asset schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.equipment import EquipmentAssetStatus, FaultSeverity


# --- Aggregate equipment status schemas (existing) ---


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


# --- EquipmentFault schemas ---


class EquipmentFaultCreate(BaseModel):
    fault_description: str = Field(..., max_length=5000)
    severity: FaultSeverity
    reported_by: str = Field(..., max_length=100)
    work_order_id: Optional[int] = None


class EquipmentFaultUpdate(BaseModel):
    fault_description: Optional[str] = None
    severity: Optional[FaultSeverity] = None
    reported_by: Optional[str] = Field(None, max_length=100)
    resolved_at: Optional[datetime] = None
    work_order_id: Optional[int] = None


class EquipmentFaultResponse(BaseModel):
    id: int
    equipment_id: int
    fault_description: str
    severity: FaultSeverity
    reported_by: str
    reported_at: datetime
    resolved_at: Optional[datetime] = None
    work_order_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# --- EquipmentDriverAssignment schemas ---


class DriverAssignmentCreate(BaseModel):
    personnel_id: int
    is_primary: bool = True


class DriverAssignmentUpdate(BaseModel):
    released_at: Optional[datetime] = None
    is_primary: Optional[bool] = None


class DriverAssignmentResponse(BaseModel):
    id: int
    equipment_id: int
    personnel_id: int
    assigned_at: datetime
    released_at: Optional[datetime] = None
    is_primary: bool

    model_config = ConfigDict(from_attributes=True)


# --- Individual equipment item schemas ---


class EquipmentItemCreate(BaseModel):
    unit_id: int
    equipment_type: str = Field(..., max_length=80)
    tamcn: str = Field(..., max_length=20)
    nomenclature: str = Field(..., max_length=100)
    bumper_number: str = Field(..., max_length=20)
    serial_number: Optional[str] = Field(None, max_length=50)
    usmc_id: Optional[str] = Field(None, max_length=30)
    status: EquipmentAssetStatus = EquipmentAssetStatus.FMC
    odometer_miles: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=5000)


class EquipmentItemUpdate(BaseModel):
    unit_id: Optional[int] = None
    equipment_type: Optional[str] = Field(None, max_length=80)
    tamcn: Optional[str] = Field(None, max_length=20)
    nomenclature: Optional[str] = Field(None, max_length=100)
    bumper_number: Optional[str] = Field(None, max_length=20)
    serial_number: Optional[str] = Field(None, max_length=50)
    usmc_id: Optional[str] = Field(None, max_length=30)
    status: Optional[EquipmentAssetStatus] = None
    odometer_miles: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=5000)


class EquipmentItemResponse(BaseModel):
    id: int
    unit_id: int
    equipment_type: str
    tamcn: str
    nomenclature: str
    bumper_number: str
    serial_number: Optional[str] = None
    usmc_id: Optional[str] = None
    status: EquipmentAssetStatus
    odometer_miles: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class EquipmentItemDetailResponse(EquipmentItemResponse):
    faults: List[EquipmentFaultResponse] = []
    driver_assignments: List[DriverAssignmentResponse] = []

    model_config = ConfigDict(from_attributes=True)
