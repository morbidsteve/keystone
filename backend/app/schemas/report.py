"""Report schemas."""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.report import ReportStatus, ReportType


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


class ExportDestinationResponse(ExportDestinationBase):
    id: int
    created_at: datetime

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
