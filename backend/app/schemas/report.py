"""Report schemas."""

from datetime import datetime
from typing import Optional

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
