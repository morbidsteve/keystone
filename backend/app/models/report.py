"""Report model for generated logistics reports."""

import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.sql import func

from app.database import Base


class ReportType(str, enum.Enum):
    LOGSTAT = "LOGSTAT"
    READINESS = "READINESS"
    SUPPLY_STATUS = "SUPPLY_STATUS"
    EQUIPMENT_STATUS = "EQUIPMENT_STATUS"
    MAINTENANCE_SUMMARY = "MAINTENANCE_SUMMARY"
    MOVEMENT_SUMMARY = "MOVEMENT_SUMMARY"
    PERSONNEL_STRENGTH = "PERSONNEL_STRENGTH"
    ROLLUP = "ROLLUP"


class ReportStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    FINAL = "FINAL"


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    report_type = Column(SQLEnum(ReportType), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(SQLEnum(ReportStatus), nullable=False, default=ReportStatus.DRAFT)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    period_start = Column(DateTime(timezone=True), nullable=True)
    period_end = Column(DateTime(timezone=True), nullable=True)


class AuthType(str, enum.Enum):
    NONE = "none"
    BEARER = "bearer"
    API_KEY = "api_key"
    BASIC = "basic"


class ReportExportDestination(Base):
    __tablename__ = "report_export_destinations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    url = Column(String(500), nullable=False)
    auth_type = Column(String(20), default="none")
    auth_value = Column(String(500), nullable=True)
    headers = Column(JSON, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
