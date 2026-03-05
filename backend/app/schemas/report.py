"""Report schemas."""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.report import (
    ReportClassification,
    ReportStatus,
    ReportType,
    ScheduleFrequency,
)


class ReportBase(BaseModel):
    unit_id: int
    report_type: ReportType
    title: str = Field(..., max_length=255)
    period_start: Optional[datetime] = None
    period_end: Optional[datetime] = None


class ReportCreate(ReportBase):
    pass


class ReportResponse(ReportBase):
    id: int
    content: Optional[str] = None
    generated_at: datetime
    status: ReportStatus
    generated_by: Optional[int] = None
    format: Optional[str] = None
    classification: Optional[str] = None
    auto_generated: bool = False
    finalized_at: Optional[datetime] = None
    finalized_by: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)


# --- Export Destination schemas ---


class ExportDestinationBase(BaseModel):
    name: str = Field(..., max_length=100)
    url: str = Field(..., max_length=500)
    auth_type: str = Field(default="none", max_length=20)
    auth_value: Optional[str] = Field(None, max_length=500)
    headers: Optional[Dict[str, str]] = None
    is_active: bool = True


class ExportDestinationCreate(ExportDestinationBase):
    pass


class ExportDestinationUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    url: Optional[str] = Field(None, max_length=500)
    auth_type: Optional[str] = Field(None, max_length=20)
    auth_value: Optional[str] = Field(None, max_length=500)
    headers: Optional[Dict[str, str]] = None
    is_active: Optional[bool] = None


class ExportDestinationResponse(BaseModel):
    id: int
    name: str
    url: str
    auth_type: str
    is_active: bool
    created_at: datetime
    # NO auth_value or headers — sensitive data excluded from responses

    model_config = ConfigDict(from_attributes=True)


class ApiExportRequest(BaseModel):
    destination_ids: List[int]


class ApiExportResultItem(BaseModel):
    destination_id: int
    destination_name: str
    success: bool
    status_code: Optional[int] = None
    error: Optional[str] = None


class ApiExportResponse(BaseModel):
    report_id: int
    results: List[ApiExportResultItem]


# --- Template schemas ---


class TemplateCreate(BaseModel):
    name: str = Field(..., max_length=255)
    report_type: str = Field(..., max_length=50)
    description: Optional[str] = Field(None, max_length=2000)
    template_body: str = Field(..., max_length=50000)
    sections: List[str]
    classification_default: str = Field("UNCLASS", max_length=50)
    is_default: bool = False


class TemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    report_type: Optional[str] = Field(None, max_length=50)
    description: Optional[str] = Field(None, max_length=2000)
    template_body: Optional[str] = Field(None, max_length=50000)
    sections: Optional[List[str]] = None
    classification_default: Optional[str] = Field(None, max_length=50)
    is_default: Optional[bool] = None


class TemplateResponse(BaseModel):
    id: int
    name: str
    report_type: str
    description: Optional[str] = None
    template_body: str
    sections: List[str]
    classification_default: str
    is_default: bool
    created_by: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Schedule schemas ---


class ScheduleCreate(BaseModel):
    template_id: int
    unit_id: int
    frequency: ScheduleFrequency
    time_of_day: Optional[str] = Field(None, max_length=5, pattern=r"^\d{2}:\d{2}$")
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    auto_distribute: bool = False
    distribution_list: Optional[List[dict]] = None


class ScheduleUpdate(BaseModel):
    frequency: Optional[ScheduleFrequency] = None
    time_of_day: Optional[str] = Field(None, max_length=5, pattern=r"^\d{2}:\d{2}$")
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    is_active: Optional[bool] = None
    auto_distribute: Optional[bool] = None
    distribution_list: Optional[List[dict]] = None


class ScheduleResponse(BaseModel):
    id: int
    template_id: int
    unit_id: int
    frequency: ScheduleFrequency
    time_of_day: Optional[str] = None
    day_of_week: Optional[int] = None
    day_of_month: Optional[int] = None
    is_active: bool
    last_generated: Optional[datetime] = None
    next_generation: Optional[datetime] = None
    auto_distribute: bool
    distribution_list: Optional[List[dict]] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- SPOTREP generation ---


class SpotrepCreate(BaseModel):
    title: str = Field(..., max_length=255)
    situation_text: str = Field(..., max_length=10000)
    classification: ReportClassification = ReportClassification.CUI


# --- Enhanced Report Response ---


class ReportDetailResponse(ReportResponse):
    """Extended report response with new fields."""

    template_id: Optional[int] = None
    distribution_list: Optional[List[dict]] = None
    schedule_id: Optional[int] = None
    parent_report_id: Optional[int] = None
