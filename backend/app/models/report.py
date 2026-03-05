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
from sqlalchemy.orm import relationship
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
    SITREP = "SITREP"
    SPOTREP = "SPOTREP"
    PERSTAT = "PERSTAT"
    INTSUM = "INTSUM"
    COMMAND_BRIEF = "COMMAND_BRIEF"
    AAR = "AAR"


class ReportStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    FINAL = "FINAL"
    ARCHIVED = "ARCHIVED"


class ReportFormat(str, enum.Enum):
    TEXT = "TEXT"
    HTML = "HTML"
    PDF = "PDF"
    JSON = "JSON"


class ReportClassification(str, enum.Enum):
    UNCLASS = "UNCLASS"
    CUI = "CUI"
    SECRET = "SECRET"
    TS = "TS"
    TS_SCI = "TS_SCI"


class ScheduleFrequency(str, enum.Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"


class ReportSection(str, enum.Enum):
    HEADER = "HEADER"
    SITUATION = "SITUATION"
    LOGISTICS_SUMMARY = "LOGISTICS_SUMMARY"
    SUPPLY_CLASS_I = "SUPPLY_CLASS_I"
    SUPPLY_CLASS_III = "SUPPLY_CLASS_III"
    SUPPLY_CLASS_V = "SUPPLY_CLASS_V"
    SUPPLY_CLASS_VIII = "SUPPLY_CLASS_VIII"
    EQUIPMENT_STATUS = "EQUIPMENT_STATUS"
    MAINTENANCE_STATUS = "MAINTENANCE_STATUS"
    PERSONNEL_STRENGTH = "PERSONNEL_STRENGTH"
    MOVEMENT_STATUS = "MOVEMENT_STATUS"
    AMMUNITION_STATUS = "AMMUNITION_STATUS"
    MEDICAL_STATUS = "MEDICAL_STATUS"
    COMMUNICATIONS = "COMMUNICATIONS"
    MORALE = "MORALE"
    COMMANDER_ASSESSMENT = "COMMANDER_ASSESSMENT"
    REQUESTS = "REQUESTS"
    WEATHER = "WEATHER"
    FOOTER = "FOOTER"


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

    # --- New columns for SITREP expansion ---
    template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=True)
    format = Column(SQLEnum(ReportFormat), default=ReportFormat.TEXT)
    classification = Column(
        SQLEnum(ReportClassification), default=ReportClassification.UNCLASS
    )
    distribution_list = Column(JSON, nullable=True)
    auto_generated = Column(Boolean, default=False)
    schedule_id = Column(Integer, ForeignKey("report_schedules.id"), nullable=True)
    parent_report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    finalized_at = Column(DateTime(timezone=True), nullable=True)
    finalized_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # --- Relationships ---
    template = relationship(
        "ReportTemplate", back_populates="reports", foreign_keys=[template_id]
    )
    schedule = relationship(
        "ReportSchedule", back_populates="reports", foreign_keys=[schedule_id]
    )
    child_reports = relationship(
        "Report",
        backref="parent_report",
        remote_side=[id],
        foreign_keys=[parent_report_id],
    )


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


class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    report_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    template_body = Column(Text, nullable=False)
    sections = Column(JSON, nullable=False)
    classification_default = Column(String(50), default="UNCLASS")
    is_default = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    reports = relationship(
        "Report", back_populates="template", foreign_keys="Report.template_id"
    )


class ReportSchedule(Base):
    __tablename__ = "report_schedules"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    frequency = Column(SQLEnum(ScheduleFrequency), nullable=False)
    time_of_day = Column(
        String(5), nullable=True
    )  # HH:MM format (avoid Time for SQLite compat)
    day_of_week = Column(Integer, nullable=True)
    day_of_month = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    last_generated = Column(DateTime(timezone=True), nullable=True)
    next_generation = Column(DateTime(timezone=True), nullable=True)
    auto_distribute = Column(Boolean, default=False)
    distribution_list = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    template = relationship("ReportTemplate")
    unit = relationship("Unit")
    reports = relationship(
        "Report", back_populates="schedule", foreign_keys="Report.schedule_id"
    )
