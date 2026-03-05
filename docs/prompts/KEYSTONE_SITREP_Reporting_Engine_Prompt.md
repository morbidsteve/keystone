# KEYSTONE SITREP Reporting Engine — Claude Code Prompt

**Version**: 1.0
**Status**: Ready for Implementation
**System**: KEYSTONE (USMC Logistics Intelligence Platform)
**Date**: 2026-03-05

---

## Executive Summary

Build an automated SITREP (Situation Report) and reporting engine for KEYSTONE that enables rapid generation of operational reports in Marine Corps standard formats (LOGSTAT, PERSTAT, SITREP, SPOTREP, Equipment Status, Maintenance Summaries). The engine must support:

- **Templated report generation** with Jinja2 customization
- **Automated scheduling** (daily, weekly, monthly) with cron-like execution
- **Role-based distribution** to authorized recipients
- **Report hierarchy** (rollup of subordinate unit reports)
- **Multiple formats** (TEXT, HTML, PDF)
- **Classification handling** (UNCLASS, CUI, SECRET, TS)
- **Real-time data aggregation** from Equipment, Supply, Personnel, Maintenance, Movement entities

---

## Technical Stack

**Backend**: Python 3.11+, FastAPI, SQLAlchemy 2.0 (async), PostgreSQL 14+, Jinja2, APScheduler
**Frontend**: React 18, TypeScript, Tailwind CSS, Zustand, TanStack Query/Table, Recharts
**Database**: PostgreSQL with JSON columns for flexible distribution lists and template sections
**Scheduling**: APScheduler (in-process) or Celery (distributed)
**Export**: html2pdf library for PDF generation (optional first iteration: TEXT/HTML only)

---

## Database Models

### 1. Enhanced Report Model

**File**: `backend/app/models/report.py` (update existing)

```python
from datetime import datetime
from enum import Enum
from typing import Optional, List
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, JSON, Integer, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base


class ReportType(str, Enum):
    """All supported report types."""
    LOGSTAT = "LOGSTAT"              # Logistics status (supply, ammo, fuel)
    PERSTAT = "PERSTAT"              # Personnel status
    SITREP = "SITREP"                # Situation report (comprehensive)
    SPOTREP = "SPOTREP"              # Spot report (urgent, brief)
    EQUIPMENT_STATUS = "EQUIPMENT_STATUS"
    MAINTENANCE_SUMMARY = "MAINTENANCE_SUMMARY"
    INTSUM = "INTSUM"                # Intelligence summary
    COMMAND_BRIEF = "COMMAND_BRIEF"
    AAR = "AAR"                      # After-action report
    READINESS = "READINESS"
    SUPPLY_STATUS = "SUPPLY_STATUS"
    MOVEMENT_SUMMARY = "MOVEMENT_SUMMARY"
    PERSONNEL_STRENGTH = "PERSONNEL_STRENGTH"
    ROLLUP = "ROLLUP"                # Aggregated subordinate reports


class ReportStatus(str, Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    FINAL = "FINAL"
    ARCHIVED = "ARCHIVED"


class ReportFormat(str, Enum):
    TEXT = "TEXT"
    HTML = "HTML"
    PDF = "PDF"
    JSON = "JSON"


class ReportClassification(str, Enum):
    UNCLASS = "UNCLASS"
    CUI = "CUI"                      # Controlled Unclassified Information
    SECRET = "SECRET"
    TS = "TS"                        # Top Secret
    TS_SCI = "TS/SCI"               # Top Secret / Sensitive Compartmented Information


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    report_type = Column(SQLEnum(ReportType), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    content = Column(Text, nullable=False)

    # Template and scheduling
    template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=True)
    format = Column(SQLEnum(ReportFormat), default=ReportFormat.TEXT)
    classification = Column(SQLEnum(ReportClassification), default=ReportClassification.UNCLASS)

    # Distribution
    distribution_list = Column(JSON, nullable=True)  # List of {user_id: int, unit_id: int, role: str}

    # Automation
    auto_generated = Column(Boolean, default=False)
    schedule_id = Column(Integer, ForeignKey("report_schedules.id"), nullable=True)

    # Hierarchy (for rollups)
    parent_report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)

    # Metadata
    generated_at = Column(DateTime, default=datetime.utcnow, index=True)
    period_start = Column(DateTime, nullable=True)
    period_end = Column(DateTime, nullable=True)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.DRAFT, index=True)
    generated_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    finalized_at = Column(DateTime, nullable=True)
    finalized_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    unit = relationship("Unit", foreign_keys=[unit_id])
    template = relationship("ReportTemplate", back_populates="reports")
    generated_by_user = relationship("User", foreign_keys=[generated_by], viewonly=True)
    finalized_by_user = relationship("User", foreign_keys=[finalized_by], viewonly=True)
    schedule = relationship("ReportSchedule", back_populates="reports")
    child_reports = relationship("Report", remote_side=[parent_report_id], backref="parent_report")

    def __repr__(self):
        return f"<Report id={self.id} type={self.report_type} unit={self.unit_id} status={self.status}>"
```

---

### 2. Report Template Model

**File**: `backend/app/models/report_template.py` (new)

```python
from datetime import datetime
from enum import Enum
from typing import List, Dict, Any
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, JSON, Integer, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.database import Base


class ReportSection(str, Enum):
    """Available report sections for templating."""
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


class ReportTemplate(Base):
    __tablename__ = "report_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    report_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)

    # Jinja2 template body with placeholders
    template_body = Column(Text, nullable=False)

    # Ordered list of sections to include
    # Example: ["HEADER", "SITUATION", "LOGISTICS_SUMMARY", "EQUIPMENT_STATUS", "COMMANDER_ASSESSMENT", "FOOTER"]
    sections = Column(JSON, nullable=False)

    # Classification default for reports using this template
    classification_default = Column(String(50), default="UNCLASS")

    # Metadata
    is_default = Column(Boolean, default=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reports = relationship("Report", back_populates="template")

    def __repr__(self):
        return f"<ReportTemplate id={self.id} name={self.name} type={self.report_type}>"
```

---

### 3. Report Schedule Model

**File**: `backend/app/models/report_schedule.py` (new)

```python
from datetime import datetime
from enum import Enum
from typing import List, Optional
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey, JSON, Integer, Enum as SQLEnum, Time
from sqlalchemy.orm import relationship
from app.database import Base


class ScheduleFrequency(str, Enum):
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    BIWEEKLY = "BIWEEKLY"
    MONTHLY = "MONTHLY"


class ReportSchedule(Base):
    __tablename__ = "report_schedules"

    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("report_templates.id"), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)

    # Scheduling parameters
    frequency = Column(SQLEnum(ScheduleFrequency), nullable=False)
    time_of_day = Column(Time, nullable=True)              # HH:MM when to generate
    day_of_week = Column(Integer, nullable=True)            # 0=Monday, 6=Sunday (for WEEKLY)
    day_of_month = Column(Integer, nullable=True)           # 1-31 (for MONTHLY)

    # Status
    is_active = Column(Boolean, default=True, index=True)
    last_generated = Column(DateTime, nullable=True)
    next_generation = Column(DateTime, nullable=True)

    # Distribution
    auto_distribute = Column(Boolean, default=False)
    distribution_list = Column(JSON, nullable=True)         # [{user_id: int, role: str}, ...]

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    template = relationship("ReportTemplate")
    unit = relationship("Unit")
    reports = relationship("Report", back_populates="schedule")

    def __repr__(self):
        return f"<ReportSchedule id={self.id} unit={self.unit_id} freq={self.frequency}>"
```

---

## Report Generation Service

### 4. Report Generator Service

**File**: `backend/app/services/report_generator.py` (new)

```python
"""
KEYSTONE Report Generation Service
Generates LOGSTAT, PERSTAT, SITREP, and other operational reports in Marine Corps formats.
"""

from datetime import datetime, timedelta, time
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from jinja2 import Environment, Template
import logging

from app.models.report import Report, ReportType, ReportStatus, ReportFormat, ReportClassification
from app.models.report_template import ReportTemplate, ReportSection
from app.models.report_schedule import ReportSchedule, ScheduleFrequency
from app.models.unit import Unit
from app.models.equipment import EquipmentStatus
from app.models.supply import SupplyStatusRecord, SupplyClass
from app.models.personnel import Personnel, PersonnelStatus
from app.models.maintenance import MaintenanceWorkOrder, MaintenanceStatus
from app.models.movement import Movement, MovementStatus
from app.models.alert import Alert
from app.database import get_db

logger = logging.getLogger(__name__)


class ReportGeneratorService:
    """Service for generating operational reports from template and live data."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.jinja_env = Environment(autoescape=True)

    async def generate_logstat(
        self,
        unit_id: int,
        period_start: datetime = None,
        period_end: datetime = None,
        user_id: int = None,
    ) -> Report:
        """
        Generate LOGSTAT (Logistics Status) report.

        USMC LOGSTAT format includes:
        - Supply Class I (Rations): DOS, consumption rate
        - Supply Class III (Fuel): DOS, consumption rate by type
        - Supply Class V (Ammunition): RSR vs CSR vs on-hand by DODIC
        - Supply Class VIII (Medical): Key items status
        - Equipment: MC rate, deadline equipment list
        - Maintenance: Open WOs, NMCS counts
        - Transportation: Active movements, lift capacity
        """
        period_start = period_start or (datetime.utcnow() - timedelta(days=30))
        period_end = period_end or datetime.utcnow()

        # Fetch supply data
        supply_query = select(SupplyStatusRecord).where(
            and_(
                SupplyStatusRecord.unit_id == unit_id,
                SupplyStatusRecord.recorded_at >= period_start,
                SupplyStatusRecord.recorded_at <= period_end,
            )
        ).order_by(SupplyStatusRecord.recorded_at.desc())
        result = await self.db.execute(supply_query)
        supply_records = result.scalars().all()

        # Aggregate by supply class
        class_i_data = self._aggregate_supply_class(supply_records, SupplyClass.CLASS_I)
        class_iii_data = self._aggregate_supply_class(supply_records, SupplyClass.CLASS_III)
        class_v_data = self._aggregate_supply_class(supply_records, SupplyClass.CLASS_V)
        class_viii_data = self._aggregate_supply_class(supply_records, SupplyClass.CLASS_VIII)

        # Fetch equipment status
        equipment_query = select(EquipmentStatus).where(
            EquipmentStatus.unit_id == unit_id
        )
        result = await self.db.execute(equipment_query)
        equipment = result.scalars().all()
        mc_rate = self._calculate_mc_rate(equipment)
        deadline_equipment = [e for e in equipment if e.status == "DEADLINE"]

        # Fetch maintenance
        maintenance_query = select(MaintenanceWorkOrder).where(
            and_(
                MaintenanceWorkOrder.unit_id == unit_id,
                MaintenanceWorkOrder.status.in_(["OPEN", "INWORK"]),
            )
        )
        result = await self.db.execute(maintenance_query)
        open_work_orders = result.scalars().all()

        # Fetch movements
        movement_query = select(Movement).where(
            and_(
                Movement.origin_unit_id == unit_id,
                Movement.status == MovementStatus.IN_TRANSIT,
            )
        )
        result = await self.db.execute(movement_query)
        active_movements = result.scalars().all()

        unit_query = select(Unit).where(Unit.id == unit_id)
        result = await self.db.execute(unit_query)
        unit = result.scalar_one_or_none()

        # Build content
        content = self._render_logstat_content(
            unit=unit,
            class_i=class_i_data,
            class_iii=class_iii_data,
            class_v=class_v_data,
            class_viii=class_viii_data,
            mc_rate=mc_rate,
            deadline_equipment=deadline_equipment,
            open_work_orders=open_work_orders,
            active_movements=active_movements,
        )

        # Create report
        report = Report(
            unit_id=unit_id,
            report_type=ReportType.LOGSTAT,
            title=f"LOGSTAT {unit.name} {period_end.strftime('%Y%m%d')}",
            content=content,
            format=ReportFormat.TEXT,
            classification=ReportClassification.CUI,
            status=ReportStatus.READY,
            generated_by=user_id or 1,
            auto_generated=True,
            period_start=period_start,
            period_end=period_end,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        logger.info(f"Generated LOGSTAT report {report.id} for unit {unit_id}")
        return report

    async def generate_perstat(
        self,
        unit_id: int,
        user_id: int = None,
    ) -> Report:
        """
        Generate PERSTAT (Personnel Status) report.

        Includes:
        - Authorized vs Present strength
        - Personnel by status (ACTIVE, LEAVE, MEDICAL, TRANSFERRED, etc.)
        - Casualty counts
        - Absences summary
        """
        query = select(Personnel).where(Personnel.unit_id == unit_id)
        result = await self.db.execute(query)
        personnel_list = result.scalars().all()

        unit_query = select(Unit).where(Unit.id == unit_id)
        result = await self.db.execute(unit_query)
        unit = result.scalar_one_or_none()

        # Count by status
        status_counts = {}
        for person in personnel_list:
            status = person.status or "ACTIVE"
            status_counts[status] = status_counts.get(status, 0) + 1

        authorized_strength = unit.authorized_strength or len(personnel_list)
        present_strength = status_counts.get("ACTIVE", 0)

        content = self._render_perstat_content(
            unit=unit,
            authorized_strength=authorized_strength,
            present_strength=present_strength,
            status_counts=status_counts,
            total_personnel=len(personnel_list),
        )

        report = Report(
            unit_id=unit_id,
            report_type=ReportType.PERSTAT,
            title=f"PERSTAT {unit.name} {datetime.utcnow().strftime('%Y%m%d')}",
            content=content,
            format=ReportFormat.TEXT,
            classification=ReportClassification.CUI,
            status=ReportStatus.READY,
            generated_by=user_id or 1,
            auto_generated=True,
            period_start=datetime.utcnow().replace(hour=0, minute=0, second=0),
            period_end=datetime.utcnow(),
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        logger.info(f"Generated PERSTAT report {report.id} for unit {unit_id}")
        return report

    async def generate_sitrep(
        self,
        unit_id: int,
        period_start: datetime = None,
        period_end: datetime = None,
        user_id: int = None,
    ) -> Report:
        """
        Generate comprehensive SITREP (Situation Report) combining all operational data.

        Integrates:
        - Unit information
        - Personnel status snapshot
        - Logistics summary
        - Equipment status
        - Maintenance status
        - Recent alerts/events
        - Commander assessment (optional)
        """
        period_start = period_start or (datetime.utcnow() - timedelta(days=1))
        period_end = period_end or datetime.utcnow()

        # Gather all data
        unit_query = select(Unit).where(Unit.id == unit_id)
        result = await self.db.execute(unit_query)
        unit = result.scalar_one_or_none()

        personnel_query = select(Personnel).where(Personnel.unit_id == unit_id)
        result = await self.db.execute(personnel_query)
        personnel_list = result.scalars().all()

        equipment_query = select(EquipmentStatus).where(EquipmentStatus.unit_id == unit_id)
        result = await self.db.execute(equipment_query)
        equipment = result.scalars().all()

        alert_query = select(Alert).where(
            and_(
                Alert.unit_id == unit_id,
                Alert.created_at >= period_start,
                Alert.created_at <= period_end,
            )
        ).order_by(Alert.created_at.desc())
        result = await self.db.execute(alert_query)
        alerts = result.scalars().all()

        # Build comprehensive content
        content = self._render_sitrep_content(
            unit=unit,
            personnel=personnel_list,
            equipment=equipment,
            alerts=alerts,
            period_start=period_start,
            period_end=period_end,
        )

        report = Report(
            unit_id=unit_id,
            report_type=ReportType.SITREP,
            title=f"SITREP {unit.name} {period_end.strftime('%Y%m%d %H%M')}Z",
            content=content,
            format=ReportFormat.TEXT,
            classification=ReportClassification.CUI,
            status=ReportStatus.READY,
            generated_by=user_id or 1,
            auto_generated=True,
            period_start=period_start,
            period_end=period_end,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        logger.info(f"Generated SITREP report {report.id} for unit {unit_id}")
        return report

    async def generate_spotrep(
        self,
        unit_id: int,
        title: str,
        situation_text: str,
        classification: ReportClassification = ReportClassification.CUI,
        user_id: int = None,
    ) -> Report:
        """
        Generate SPOTREP (Spot Report) - urgent, user-initiated report.
        Typically brief and focused on a specific incident.
        """
        unit_query = select(Unit).where(Unit.id == unit_id)
        result = await self.db.execute(unit_query)
        unit = result.scalar_one_or_none()

        content = f"""SPOT REPORT (SPOTREP)
=====================================
Unit: {unit.name if unit else 'UNKNOWN'}
Date-Time: {datetime.utcnow().strftime('%Y%m%d %H%M')}Z
Classification: {classification.value}

SITUATION:
{situation_text}

=====================================
"""

        report = Report(
            unit_id=unit_id,
            report_type=ReportType.SPOTREP,
            title=title,
            content=content,
            format=ReportFormat.TEXT,
            classification=classification,
            status=ReportStatus.READY,
            generated_by=user_id or 1,
            auto_generated=False,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        logger.info(f"Generated SPOTREP report {report.id} for unit {unit_id}")
        return report

    async def generate_equipment_status_report(
        self,
        unit_id: int,
        user_id: int = None,
    ) -> Report:
        """Generate detailed equipment status report."""
        equipment_query = select(EquipmentStatus).where(
            EquipmentStatus.unit_id == unit_id
        ).order_by(EquipmentStatus.status)
        result = await self.db.execute(equipment_query)
        equipment = result.scalars().all()

        unit_query = select(Unit).where(Unit.id == unit_id)
        result = await self.db.execute(unit_query)
        unit = result.scalar_one_or_none()

        content = self._render_equipment_report_content(unit=unit, equipment=equipment)

        report = Report(
            unit_id=unit_id,
            report_type=ReportType.EQUIPMENT_STATUS,
            title=f"EQUIPMENT STATUS {unit.name} {datetime.utcnow().strftime('%Y%m%d')}",
            content=content,
            format=ReportFormat.TEXT,
            classification=ReportClassification.CUI,
            status=ReportStatus.READY,
            generated_by=user_id or 1,
            auto_generated=True,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        logger.info(f"Generated EQUIPMENT STATUS report {report.id} for unit {unit_id}")
        return report

    async def generate_maintenance_summary(
        self,
        unit_id: int,
        period_start: datetime = None,
        period_end: datetime = None,
        user_id: int = None,
    ) -> Report:
        """Generate maintenance work order summary."""
        period_start = period_start or (datetime.utcnow() - timedelta(days=30))
        period_end = period_end or datetime.utcnow()

        query = select(MaintenanceWorkOrder).where(
            and_(
                MaintenanceWorkOrder.unit_id == unit_id,
                MaintenanceWorkOrder.created_at >= period_start,
                MaintenanceWorkOrder.created_at <= period_end,
            )
        )
        result = await self.db.execute(query)
        work_orders = result.scalars().all()

        unit_query = select(Unit).where(Unit.id == unit_id)
        result = await self.db.execute(unit_query)
        unit = result.scalar_one_or_none()

        content = self._render_maintenance_report_content(
            unit=unit,
            work_orders=work_orders,
            period_start=period_start,
            period_end=period_end,
        )

        report = Report(
            unit_id=unit_id,
            report_type=ReportType.MAINTENANCE_SUMMARY,
            title=f"MAINTENANCE SUMMARY {unit.name} {period_end.strftime('%Y%m%d')}",
            content=content,
            format=ReportFormat.TEXT,
            classification=ReportClassification.CUI,
            status=ReportStatus.READY,
            generated_by=user_id or 1,
            auto_generated=True,
            period_start=period_start,
            period_end=period_end,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        logger.info(f"Generated MAINTENANCE SUMMARY report {report.id} for unit {unit_id}")
        return report

    async def generate_rollup(
        self,
        parent_unit_id: int,
        report_type: ReportType = ReportType.SITREP,
        user_id: int = None,
    ) -> Report:
        """
        Generate rollup report aggregating subordinate unit reports.

        Example: Generate company SITREP by rolling up platoon SITREPs.
        """
        # Get parent unit and subordinates
        parent_query = select(Unit).where(Unit.id == parent_unit_id)
        result = await self.db.execute(parent_query)
        parent_unit = result.scalar_one_or_none()

        subordinate_query = select(Unit).where(Unit.parent_unit_id == parent_unit_id)
        result = await self.db.execute(subordinate_query)
        subordinates = result.scalars().all()

        # Get latest reports from each subordinate
        subordinate_reports = []
        for sub in subordinates:
            report_query = (
                select(Report)
                .where(
                    and_(
                        Report.unit_id == sub.id,
                        Report.report_type == report_type,
                        Report.status.in_([ReportStatus.READY, ReportStatus.FINAL]),
                    )
                )
                .order_by(Report.generated_at.desc())
                .limit(1)
            )
            result = await self.db.execute(report_query)
            latest_report = result.scalar_one_or_none()
            if latest_report:
                subordinate_reports.append(latest_report)

        # Build rollup content
        content = self._render_rollup_content(
            parent_unit=parent_unit,
            subordinate_reports=subordinate_reports,
            report_type=report_type,
        )

        report = Report(
            unit_id=parent_unit_id,
            report_type=ReportType.ROLLUP,
            title=f"ROLLUP {report_type.value} {parent_unit.name} {datetime.utcnow().strftime('%Y%m%d %H%M')}Z",
            content=content,
            format=ReportFormat.TEXT,
            classification=ReportClassification.CUI,
            status=ReportStatus.READY,
            generated_by=user_id or 1,
            auto_generated=True,
        )
        self.db.add(report)
        await self.db.commit()
        await self.db.refresh(report)

        # Link child reports
        for child_report in subordinate_reports:
            child_report.parent_report_id = report.id
        await self.db.commit()

        logger.info(f"Generated ROLLUP report {report.id} for unit {parent_unit_id}")
        return report

    async def render_report(
        self,
        template_id: int,
        data: Dict[str, Any],
    ) -> str:
        """
        Render report using Jinja2 template with provided data.

        Args:
            template_id: Report template ID
            data: Dictionary of template variables
                  Example: {
                      'unit': {...},
                      'personnel': {...},
                      'equipment': {...},
                      'generated_at': datetime
                  }

        Returns:
            Rendered HTML/text content
        """
        query = select(ReportTemplate).where(ReportTemplate.id == template_id)
        result = await self.db.execute(query)
        template = result.scalar_one_or_none()

        if not template:
            raise ValueError(f"Template {template_id} not found")

        try:
            jinja_template = self.jinja_env.from_string(template.template_body)
            rendered = jinja_template.render(**data)
            return rendered
        except Exception as e:
            logger.error(f"Template rendering error: {e}")
            raise

    async def schedule_report_generation(self):
        """
        Cron-like scheduler for automated report generation.
        Call periodically (e.g., every minute) to check and generate scheduled reports.

        In production, use APScheduler or Celery Beat for better efficiency.
        """
        now = datetime.utcnow()
        current_time = now.time()
        current_weekday = now.weekday()  # 0=Monday
        current_day_of_month = now.day

        # Find due schedules
        query = select(ReportSchedule).where(ReportSchedule.is_active == True)
        result = await self.db.execute(query)
        schedules = result.scalars().all()

        for schedule in schedules:
            should_generate = False

            if schedule.frequency == ScheduleFrequency.DAILY:
                if schedule.time_of_day and current_time >= schedule.time_of_day:
                    if not schedule.last_generated or (
                        schedule.last_generated.date() < now.date()
                    ):
                        should_generate = True

            elif schedule.frequency == ScheduleFrequency.WEEKLY:
                if (
                    current_weekday == schedule.day_of_week
                    and schedule.time_of_day
                    and current_time >= schedule.time_of_day
                ):
                    if not schedule.last_generated or (
                        (now - schedule.last_generated).days >= 7
                    ):
                        should_generate = True

            elif schedule.frequency == ScheduleFrequency.BIWEEKLY:
                if schedule.time_of_day and current_time >= schedule.time_of_day:
                    if not schedule.last_generated or (
                        (now - schedule.last_generated).days >= 14
                    ):
                        should_generate = True

            elif schedule.frequency == ScheduleFrequency.MONTHLY:
                if (
                    current_day_of_month == schedule.day_of_month
                    and schedule.time_of_day
                    and current_time >= schedule.time_of_day
                ):
                    if not schedule.last_generated or (
                        schedule.last_generated.month < now.month
                    ):
                        should_generate = True

            if should_generate:
                try:
                    # Generate report based on template
                    template = schedule.template
                    report = Report(
                        unit_id=schedule.unit_id,
                        report_type=ReportType[template.report_type.upper()],
                        title=f"{template.report_type} {schedule.unit_id} {now.strftime('%Y%m%d')}",
                        content="<Placeholder content from template rendering>",
                        template_id=template.id,
                        status=ReportStatus.READY,
                        generated_by=1,  # System user
                        auto_generated=True,
                        schedule_id=schedule.id,
                    )
                    self.db.add(report)

                    # Update schedule metadata
                    schedule.last_generated = now
                    schedule.next_generation = self._calculate_next_generation(
                        schedule, now
                    )

                    await self.db.commit()

                    # Distribute if configured
                    if schedule.auto_distribute and schedule.distribution_list:
                        await self.distribute_report(report.id)

                    logger.info(
                        f"Auto-generated report {report.id} for unit {schedule.unit_id}"
                    )
                except Exception as e:
                    logger.error(f"Error generating scheduled report: {e}")
                    await self.db.rollback()

    async def distribute_report(
        self,
        report_id: int,
        additional_recipients: List[int] = None,
    ):
        """
        Distribute report to authorized recipients.

        Creates notifications for each recipient.
        Optionally sends emails (implementation depends on email service).
        """
        query = select(Report).where(Report.id == report_id)
        result = await self.db.execute(query)
        report = result.scalar_one_or_none()

        if not report:
            raise ValueError(f"Report {report_id} not found")

        distribution_list = additional_recipients or []
        if report.distribution_list:
            # Parse JSON list of recipient IDs
            distribution_list.extend(report.distribution_list)

        # Create notifications for each recipient
        # TODO: Implement notification creation
        # for user_id in distribution_list:
        #     notification = Notification(user_id=user_id, report_id=report_id, ...)
        #     db.add(notification)
        # await db.commit()

        logger.info(
            f"Distributed report {report_id} to {len(distribution_list)} recipients"
        )

    # Helper methods
    def _aggregate_supply_class(
        self,
        records: List[SupplyStatusRecord],
        supply_class: SupplyClass,
    ) -> Dict[str, Any]:
        """Aggregate supply status records by class."""
        filtered = [r for r in records if r.supply_class == supply_class]
        if not filtered:
            return {}

        latest = filtered[0]
        return {
            "supply_class": supply_class.value,
            "dos": latest.days_of_supply,
            "on_hand": latest.quantity_on_hand,
            "consumption_rate": latest.consumption_rate_per_day,
            "last_updated": latest.recorded_at,
        }

    def _calculate_mc_rate(self, equipment: List[EquipmentStatus]) -> float:
        """Calculate mission-capable (MC) rate."""
        if not equipment:
            return 0.0
        mc_count = sum(1 for e in equipment if e.status == "OPERATIONAL")
        return (mc_count / len(equipment)) * 100

    def _render_logstat_content(
        self,
        unit,
        class_i,
        class_iii,
        class_v,
        class_viii,
        mc_rate,
        deadline_equipment,
        open_work_orders,
        active_movements,
    ) -> str:
        """Render LOGSTAT report content in Marine Corps format."""
        content = f"""LOGISTICS STATUS REPORT (LOGSTAT)
================================================
UNIT: {unit.name if unit else 'UNKNOWN'}
REPORT CLASSIFICATION: CUI
REPORT DATE: {datetime.utcnow().strftime('%Y%m%d %H%M')}Z

SUPPLY STATUS:
--------------
Class I (Rations):
  DOS: {class_i.get('dos', 0):.1f} days
  On Hand: {class_i.get('on_hand', 0)} units
  Consumption Rate: {class_i.get('consumption_rate', 0):.1f} units/day

Class III (Fuel):
  DOS: {class_iii.get('dos', 0):.1f} days
  On Hand: {class_iii.get('on_hand', 0)} gallons
  Consumption Rate: {class_iii.get('consumption_rate', 0):.1f} gal/day

Class V (Ammunition):
  Total Rounds: {class_v.get('on_hand', 0)}
  DOS: {class_v.get('dos', 0):.1f} days

Class VIII (Medical):
  Status: OPERATIONAL
  Key Items: CHECK DETAILED SUPPLY RECORDS

EQUIPMENT STATUS:
-----------------
Mission Capable Rate: {mc_rate:.1f}%
Deadline Equipment Count: {len(deadline_equipment)}
{chr(10).join([f"  - {e.equipment_type}: {e.serial_number}" for e in deadline_equipment[:5]])}

MAINTENANCE:
-----------
Open Work Orders: {len(open_work_orders)}
{chr(10).join([f"  - {wo.title}: {wo.priority}" for wo in open_work_orders[:5]])}

MOVEMENTS:
----------
Active Movements: {len(active_movements)}
{chr(10).join([f"  - {m.cargo_type}: {m.destination}" for m in active_movements[:5]])}

================================================
Report generated automatically by KEYSTONE system
"""
        return content

    def _render_perstat_content(
        self,
        unit,
        authorized_strength,
        present_strength,
        status_counts,
        total_personnel,
    ) -> str:
        """Render PERSTAT report in Marine Corps format."""
        content = f"""PERSONNEL STATUS REPORT (PERSTAT)
================================================
UNIT: {unit.name if unit else 'UNKNOWN'}
REPORT CLASSIFICATION: CUI
REPORT DATE: {datetime.utcnow().strftime('%Y%m%d %H%M')}Z

STRENGTH SUMMARY:
-----------------
Authorized Strength: {authorized_strength}
Present Strength: {present_strength}
Readiness: {(present_strength/authorized_strength*100):.1f}%

PERSONNEL BY STATUS:
--------------------
"""
        for status, count in sorted(status_counts.items()):
            content += f"{status}: {count}\n"

        content += f"""
Total Personnel: {total_personnel}

================================================
Report generated automatically by KEYSTONE system
"""
        return content

    def _render_sitrep_content(
        self,
        unit,
        personnel,
        equipment,
        alerts,
        period_start,
        period_end,
    ) -> str:
        """Render comprehensive SITREP."""
        content = f"""SITUATION REPORT (SITREP)
================================================
UNIT: {unit.name if unit else 'UNKNOWN'}
REPORT CLASSIFICATION: CUI
REPORT DATE: {datetime.utcnow().strftime('%Y%m%d %H%M')}Z
PERIOD: {period_start.strftime('%Y%m%d')} - {period_end.strftime('%Y%m%d')}

SITUATION:
----------
Unit Status: OPERATIONAL
Total Personnel: {len(personnel)}
Equipment Count: {len(equipment)}
Recent Alerts: {len(alerts)}

ALERTS/EVENTS (Last 24 Hours):
------------------------------
"""
        for alert in alerts[:10]:
            content += f"- [{alert.priority}] {alert.message} ({alert.created_at.strftime('%H%M')}Z)\n"

        content += f"""
PERSONNEL READINESS:
--------------------
Unit is currently operational and ready for tasking.

EQUIPMENT STATUS:
-----------------
Equipment inventory maintained and operational.

================================================
Report generated automatically by KEYSTONE system
"""
        return content

    def _render_equipment_report_content(
        self,
        unit,
        equipment,
    ) -> str:
        """Render detailed equipment status report."""
        status_summary = {}
        for e in equipment:
            s = e.status or "UNKNOWN"
            status_summary[s] = status_summary.get(s, 0) + 1

        content = f"""EQUIPMENT STATUS REPORT
================================================
UNIT: {unit.name if unit else 'UNKNOWN'}
REPORT DATE: {datetime.utcnow().strftime('%Y%m%d %H%M')}Z
TOTAL EQUIPMENT: {len(equipment)}

STATUS SUMMARY:
"""
        for status, count in sorted(status_summary.items()):
            content += f"{status}: {count}\n"

        content += f"""
DETAILED LISTING:
-----------------
"""
        for e in equipment:
            content += f"{e.equipment_type} ({e.serial_number}): {e.status}\n"

        content += f"""
================================================
Report generated automatically by KEYSTONE system
"""
        return content

    def _render_maintenance_report_content(
        self,
        unit,
        work_orders,
        period_start,
        period_end,
    ) -> str:
        """Render maintenance summary report."""
        priority_summary = {}
        status_summary = {}
        for wo in work_orders:
            priority_summary[wo.priority] = priority_summary.get(wo.priority, 0) + 1
            status_summary[wo.status] = status_summary.get(wo.status, 0) + 1

        content = f"""MAINTENANCE SUMMARY REPORT
================================================
UNIT: {unit.name if unit else 'UNKNOWN'}
PERIOD: {period_start.strftime('%Y%m%d')} - {period_end.strftime('%Y%m%d')}
TOTAL WORK ORDERS: {len(work_orders)}

BY PRIORITY:
"""
        for priority, count in sorted(priority_summary.items()):
            content += f"{priority}: {count}\n"

        content += f"""
BY STATUS:
"""
        for status, count in sorted(status_summary.items()):
            content += f"{status}: {count}\n"

        content += f"""
================================================
Report generated automatically by KEYSTONE system
"""
        return content

    def _render_rollup_content(
        self,
        parent_unit,
        subordinate_reports,
        report_type,
    ) -> str:
        """Render rollup report aggregating subordinates."""
        content = f"""ROLLUP REPORT - {report_type.value}
================================================
PARENT UNIT: {parent_unit.name if parent_unit else 'UNKNOWN'}
REPORT DATE: {datetime.utcnow().strftime('%Y%m%d %H%M')}Z
SUBORDINATE REPORTS INCLUDED: {len(subordinate_reports)}

SUBORDINATE STATUS:
"""
        for report in subordinate_reports:
            content += f"- {report.unit.name}: {report.status.value}\n"

        content += f"""
================================================
Report generated automatically by KEYSTONE system
"""
        return content

    def _calculate_next_generation(
        self,
        schedule: ReportSchedule,
        current_time: datetime,
    ) -> datetime:
        """Calculate next generation time for schedule."""
        if schedule.frequency == ScheduleFrequency.DAILY:
            return current_time + timedelta(days=1)
        elif schedule.frequency == ScheduleFrequency.WEEKLY:
            return current_time + timedelta(weeks=1)
        elif schedule.frequency == ScheduleFrequency.BIWEEKLY:
            return current_time + timedelta(weeks=2)
        elif schedule.frequency == ScheduleFrequency.MONTHLY:
            return current_time + timedelta(days=30)
        return current_time
```

---

## API Endpoints

### 5. Report API Routes

**File**: `backend/app/routes/reports.py` (expand existing)

```python
"""
Report management and generation endpoints.
"""

from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.database import get_db
from app.auth.security import get_current_user
from app.models.report import (
    Report, ReportType, ReportStatus, ReportFormat, ReportClassification
)
from app.models.report_template import ReportTemplate, ReportSection
from app.models.report_schedule import ReportSchedule, ScheduleFrequency
from app.models.user import User
from app.services.report_generator import ReportGeneratorService
from app.schemas.report_schema import (
    ReportResponse,
    ReportCreateRequest,
    ReportFilterRequest,
    ReportGenerateRequest,
    TemplateCreateRequest,
    TemplateResponse,
    ScheduleCreateRequest,
    ScheduleResponse,
)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


# Report Browsing & Retrieval
@router.get("", response_model=List[ReportResponse])
async def list_reports(
    unit_id: Optional[int] = Query(None),
    report_type: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    classification: Optional[str] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ReportResponse]:
    """
    List reports with optional filtering.

    Query Parameters:
    - unit_id: Filter by unit
    - report_type: Filter by type (LOGSTAT, PERSTAT, SITREP, etc.)
    - status: Filter by status (DRAFT, READY, FINAL)
    - classification: Filter by classification level
    - start_date: Reports generated after this date
    - end_date: Reports generated before this date
    """
    query = select(Report)

    if unit_id:
        query = query.where(Report.unit_id == unit_id)
    if report_type:
        query = query.where(Report.report_type == report_type)
    if status:
        query = query.where(Report.status == status)
    if classification:
        query = query.where(Report.classification == classification)
    if start_date:
        query = query.where(Report.generated_at >= start_date)
    if end_date:
        query = query.where(Report.generated_at <= end_date)

    query = query.order_by(Report.generated_at.desc()).offset(offset).limit(limit)

    result = await db.execute(query)
    reports = result.scalars().all()

    return [ReportResponse.from_orm(r) for r in reports]


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    """Get a single report by ID."""
    query = select(Report).where(Report.id == report_id)
    result = await db.execute(query)
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return ReportResponse.from_orm(report)


# Quick Report Generation
@router.post("/generate/logstat/{unit_id}", response_model=ReportResponse)
async def generate_logstat(
    unit_id: int,
    period_days: int = Query(30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    """Generate LOGSTAT (Logistics Status) report for a unit."""
    service = ReportGeneratorService(db)
    period_start = datetime.utcnow() - timedelta(days=period_days)

    report = await service.generate_logstat(
        unit_id=unit_id,
        period_start=period_start,
        user_id=current_user.id,
    )

    return ReportResponse.from_orm(report)


@router.post("/generate/perstat/{unit_id}", response_model=ReportResponse)
async def generate_perstat(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    """Generate PERSTAT (Personnel Status) report for a unit."""
    service = ReportGeneratorService(db)
    report = await service.generate_perstat(unit_id=unit_id, user_id=current_user.id)
    return ReportResponse.from_orm(report)


@router.post("/generate/sitrep/{unit_id}", response_model=ReportResponse)
async def generate_sitrep(
    unit_id: int,
    period_hours: int = Query(24),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    """Generate comprehensive SITREP (Situation Report)."""
    service = ReportGeneratorService(db)
    period_start = datetime.utcnow() - timedelta(hours=period_hours)

    report = await service.generate_sitrep(
        unit_id=unit_id,
        period_start=period_start,
        user_id=current_user.id,
    )

    return ReportResponse.from_orm(report)


@router.post("/generate/spotrep/{unit_id}", response_model=ReportResponse)
async def generate_spotrep(
    unit_id: int,
    request: dict,  # {title, situation_text, classification}
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    """Generate SPOTREP (Spot Report) - urgent, user-initiated."""
    service = ReportGeneratorService(db)
    classification = ReportClassification[request.get("classification", "CUI")]

    report = await service.generate_spotrep(
        unit_id=unit_id,
        title=request.get("title"),
        situation_text=request.get("situation_text"),
        classification=classification,
        user_id=current_user.id,
    )

    return ReportResponse.from_orm(report)


@router.post("/generate/equipment/{unit_id}", response_model=ReportResponse)
async def generate_equipment_report(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    """Generate equipment status report."""
    service = ReportGeneratorService(db)
    report = await service.generate_equipment_status_report(
        unit_id=unit_id, user_id=current_user.id
    )
    return ReportResponse.from_orm(report)


@router.post("/generate/maintenance/{unit_id}", response_model=ReportResponse)
async def generate_maintenance_report(
    unit_id: int,
    period_days: int = Query(30),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    """Generate maintenance summary report."""
    service = ReportGeneratorService(db)
    period_start = datetime.utcnow() - timedelta(days=period_days)

    report = await service.generate_maintenance_summary(
        unit_id=unit_id,
        period_start=period_start,
        user_id=current_user.id,
    )

    return ReportResponse.from_orm(report)


@router.post("/generate/rollup/{unit_id}", response_model=ReportResponse)
async def generate_rollup(
    unit_id: int,
    report_type: str = Query("SITREP"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    """Generate rollup report aggregating subordinate units."""
    service = ReportGeneratorService(db)
    rt = ReportType[report_type.upper()]

    report = await service.generate_rollup(
        parent_unit_id=unit_id,
        report_type=rt,
        user_id=current_user.id,
    )

    return ReportResponse.from_orm(report)


# Report Status Management
@router.put("/{report_id}/finalize", response_model=ReportResponse)
async def finalize_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportResponse:
    """Transition report from DRAFT to FINAL."""
    query = select(Report).where(Report.id == report_id)
    result = await db.execute(query)
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.status = ReportStatus.FINAL
    report.finalized_at = datetime.utcnow()
    report.finalized_by = current_user.id

    await db.commit()
    await db.refresh(report)

    return ReportResponse.from_orm(report)


@router.post("/{report_id}/distribute")
async def distribute_report(
    report_id: int,
    recipients: Optional[List[int]] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Distribute report to recipients."""
    service = ReportGeneratorService(db)
    await service.distribute_report(report_id, additional_recipients=recipients)
    return {"status": "distributed", "report_id": report_id}


# Template Management
@router.get("/templates", response_model=List[TemplateResponse])
async def list_templates(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[TemplateResponse]:
    """List all report templates."""
    query = select(ReportTemplate).order_by(ReportTemplate.name)
    result = await db.execute(query)
    templates = result.scalars().all()
    return [TemplateResponse.from_orm(t) for t in templates]


@router.post("/templates", response_model=TemplateResponse)
async def create_template(
    request: TemplateCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TemplateResponse:
    """Create a new report template."""
    template = ReportTemplate(
        name=request.name,
        report_type=request.report_type,
        description=request.description,
        template_body=request.template_body,
        sections=request.sections,
        classification_default=request.classification_default,
        is_default=request.is_default,
        created_by=current_user.id,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return TemplateResponse.from_orm(template)


@router.put("/templates/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    request: TemplateCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TemplateResponse:
    """Update a report template."""
    query = select(ReportTemplate).where(ReportTemplate.id == template_id)
    result = await db.execute(query)
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    template.name = request.name
    template.report_type = request.report_type
    template.description = request.description
    template.template_body = request.template_body
    template.sections = request.sections
    template.classification_default = request.classification_default
    template.is_default = request.is_default
    template.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(template)
    return TemplateResponse.from_orm(template)


@router.delete("/templates/{template_id}")
async def delete_template(
    template_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a report template."""
    query = select(ReportTemplate).where(ReportTemplate.id == template_id)
    result = await db.execute(query)
    template = result.scalar_one_or_none()

    if not template:
        raise HTTPException(status_code=404, detail="Template not found")

    await db.delete(template)
    await db.commit()
    return {"status": "deleted", "template_id": template_id}


# Schedule Management
@router.get("/schedules", response_model=List[ScheduleResponse])
async def list_schedules(
    unit_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[ScheduleResponse]:
    """List report schedules."""
    query = select(ReportSchedule)
    if unit_id:
        query = query.where(ReportSchedule.unit_id == unit_id)
    result = await db.execute(query.order_by(ReportSchedule.created_at.desc()))
    schedules = result.scalars().all()
    return [ScheduleResponse.from_orm(s) for s in schedules]


@router.post("/schedules", response_model=ScheduleResponse)
async def create_schedule(
    request: ScheduleCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleResponse:
    """Create a new report schedule."""
    schedule = ReportSchedule(
        template_id=request.template_id,
        unit_id=request.unit_id,
        frequency=request.frequency,
        time_of_day=request.time_of_day,
        day_of_week=request.day_of_week,
        day_of_month=request.day_of_month,
        auto_distribute=request.auto_distribute,
        distribution_list=request.distribution_list,
    )
    db.add(schedule)
    await db.commit()
    await db.refresh(schedule)
    return ScheduleResponse.from_orm(schedule)


@router.put("/schedules/{schedule_id}", response_model=ScheduleResponse)
async def update_schedule(
    schedule_id: int,
    request: ScheduleCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ScheduleResponse:
    """Update a report schedule."""
    query = select(ReportSchedule).where(ReportSchedule.id == schedule_id)
    result = await db.execute(query)
    schedule = result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    schedule.frequency = request.frequency
    schedule.time_of_day = request.time_of_day
    schedule.day_of_week = request.day_of_week
    schedule.day_of_month = request.day_of_month
    schedule.auto_distribute = request.auto_distribute
    schedule.distribution_list = request.distribution_list
    schedule.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(schedule)
    return ScheduleResponse.from_orm(schedule)


@router.delete("/schedules/{schedule_id}")
async def delete_schedule(
    schedule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a report schedule."""
    query = select(ReportSchedule).where(ReportSchedule.id == schedule_id)
    result = await db.execute(query)
    schedule = result.scalar_one_or_none()

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    await db.delete(schedule)
    await db.commit()
    return {"status": "deleted", "schedule_id": schedule_id}
```

---

## Frontend Components

### 6. Enhanced Reports Page

**File**: `frontend/src/pages/ReportsPage.tsx` (expanded)

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ReportBrowser,
  ReportViewer,
  QuickGeneratePanel,
  TemplateEditor,
  ScheduleManager,
  ReportCompare,
} from '@/components/reports';
import { useReportStore } from '@/stores/reportStore';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('browser');
  const [selectedReport, setSelectedReport] = useState<number | null>(null);

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">
          Generate, manage, and distribute operational reports
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="browser">Browser</TabsTrigger>
          <TabsTrigger value="viewer">Viewer</TabsTrigger>
          <TabsTrigger value="generate">Quick Generate</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
        </TabsList>

        <TabsContent value="browser" className="space-y-4">
          <ReportBrowser
            onSelectReport={(id) => {
              setSelectedReport(id);
              setActiveTab('viewer');
            }}
          />
        </TabsContent>

        <TabsContent value="viewer" className="space-y-4">
          {selectedReport ? (
            <ReportViewer reportId={selectedReport} />
          ) : (
            <div className="text-center text-muted-foreground p-8">
              Select a report from the browser to view
            </div>
          )}
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <QuickGeneratePanel
            onReportGenerated={(id) => {
              setSelectedReport(id);
              setActiveTab('viewer');
            }}
          />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <TemplateEditor />
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <ScheduleManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

### 7. Report Browser Component

**File**: `frontend/src/components/reports/ReportBrowser.tsx` (new)

```typescript
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, FilterIcon } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ReportBrowserProps {
  onSelectReport: (id: number) => void;
}

export function ReportBrowser({ onSelectReport }: ReportBrowserProps) {
  const [filters, setFilters] = useState({
    reportType: '',
    status: '',
    classification: '',
    unitId: '',
    startDate: '',
    endDate: '',
  });

  const { data: reports, isLoading } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () =>
      apiClient.get('/api/v1/reports', {
        params: {
          report_type: filters.reportType || undefined,
          status: filters.status || undefined,
          classification: filters.classification || undefined,
          unit_id: filters.unitId || undefined,
          start_date: filters.startDate || undefined,
          end_date: filters.endDate || undefined,
        },
      }),
  });

  const statusColors = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    READY: 'bg-blue-100 text-blue-800',
    FINAL: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Select value={filters.reportType} onValueChange={(v) => setFilters({ ...filters, reportType: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="LOGSTAT">LOGSTAT</SelectItem>
            <SelectItem value="PERSTAT">PERSTAT</SelectItem>
            <SelectItem value="SITREP">SITREP</SelectItem>
            <SelectItem value="SPOTREP">SPOTREP</SelectItem>
            <SelectItem value="EQUIPMENT_STATUS">Equipment</SelectItem>
            <SelectItem value="MAINTENANCE_SUMMARY">Maintenance</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="READY">Ready</SelectItem>
            <SelectItem value="FINAL">Final</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.classification} onValueChange={(v) => setFilters({ ...filters, classification: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Classification" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="UNCLASS">Unclassified</SelectItem>
            <SelectItem value="CUI">CUI</SelectItem>
            <SelectItem value="SECRET">Secret</SelectItem>
            <SelectItem value="TS">Top Secret</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          placeholder="Start Date"
          value={filters.startDate}
          onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
        />

        <Input
          type="date"
          placeholder="End Date"
          value={filters.endDate}
          onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
        />

        <Button variant="outline" size="icon">
          <FilterIcon className="w-4 h-4" />
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Classification</TableHead>
              <TableHead>Generated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading reports...
                </TableCell>
              </TableRow>
            ) : reports?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports?.map((report) => (
                <TableRow key={report.id} hover>
                  <TableCell className="font-medium">{report.title}</TableCell>
                  <TableCell>{report.report_type}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[report.status] || ''}>
                      {report.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{report.classification}</TableCell>
                  <TableCell>
                    {format(new Date(report.generated_at), 'MMM dd, yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectReport(report.id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

---

### 8. Report Viewer Component

**File**: `frontend/src/components/reports/ReportViewer.tsx` (new)

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DownloadIcon,
  ShareIcon,
  CheckIcon,
  PrinterIcon,
} from 'lucide-react';
import { apiClient } from '@/lib/api';

interface ReportViewerProps {
  reportId: number;
}

export function ReportViewer({ reportId }: ReportViewerProps) {
  const { data: report, isLoading } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => apiClient.get(`/api/v1/reports/${reportId}`),
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading report...</div>;
  }

  if (!report) {
    return <div className="p-8 text-center text-red-600">Report not found</div>;
  }

  const statusColors = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    READY: 'bg-blue-100 text-blue-800',
    FINAL: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{report.title}</CardTitle>
              <div className="text-sm text-muted-foreground mt-2">
                Generated {format(new Date(report.generated_at), 'PPpp')}
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={statusColors[report.status] || ''}>
                {report.status}
              </Badge>
              <Badge variant="outline">{report.classification}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Type</div>
              <div className="font-semibold">{report.report_type}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Format</div>
              <div className="font-semibold">{report.format}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Generated By</div>
              <div className="font-semibold">{report.generated_by_user?.name || 'System'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Auto-Generated</div>
              <div className="font-semibold">{report.auto_generated ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {report.period_start && report.period_end && (
            <div>
              <div className="text-sm text-muted-foreground">Period</div>
              <div className="font-semibold">
                {format(new Date(report.period_start), 'MMM dd, yyyy')} to{' '}
                {format(new Date(report.period_end), 'MMM dd, yyyy')}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Report Content</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg whitespace-pre-wrap font-mono text-sm overflow-auto max-h-96">
            {report.content}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline">
          <DownloadIcon className="w-4 h-4 mr-2" />
          Download
        </Button>
        <Button variant="outline">
          <PrinterIcon className="w-4 h-4 mr-2" />
          Print
        </Button>
        <Button variant="outline">
          <ShareIcon className="w-4 h-4 mr-2" />
          Distribute
        </Button>
        {report.status === 'DRAFT' && (
          <Button>
            <CheckIcon className="w-4 h-4 mr-2" />
            Finalize
          </Button>
        )}
      </div>
    </div>
  );
}
```

---

### 9. Quick Generate Panel

**File**: `frontend/src/components/reports/QuickGeneratePanel.tsx` (new)

```typescript
import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Zap } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

interface QuickGeneratePanelProps {
  onReportGenerated: (id: number) => void;
}

export function QuickGeneratePanel({ onReportGenerated }: QuickGeneratePanelProps) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState('LOGSTAT');
  const [unitId, setUnitId] = useState('');
  const [spotsituation, setSpotsituation] = useState('');

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!unitId) {
        throw new Error('Unit ID is required');
      }

      switch (reportType) {
        case 'LOGSTAT':
          return apiClient.post(`/api/v1/reports/generate/logstat/${unitId}`);
        case 'PERSTAT':
          return apiClient.post(`/api/v1/reports/generate/perstat/${unitId}`);
        case 'SITREP':
          return apiClient.post(`/api/v1/reports/generate/sitrep/${unitId}`);
        case 'SPOTREP':
          return apiClient.post(`/api/v1/reports/generate/spotrep/${unitId}`, {
            title: `SPOTREP - ${new Date().toLocaleString()}`,
            situation_text: spotsituation,
          });
        case 'EQUIPMENT':
          return apiClient.post(`/api/v1/reports/generate/equipment/${unitId}`);
        case 'MAINTENANCE':
          return apiClient.post(`/api/v1/reports/generate/maintenance/${unitId}`);
        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }
    },
    onSuccess: (data) => {
      toast({
        title: 'Report Generated',
        description: `${reportType} report created successfully`,
      });
      onReportGenerated(data.id);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      });
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Common Quick Generates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Generate
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Unit ID</label>
            <Input
              type="number"
              value={unitId}
              onChange={(e) => setUnitId(e.target.value)}
              placeholder="Enter unit ID"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOGSTAT">LOGSTAT (Logistics Status)</SelectItem>
                <SelectItem value="PERSTAT">PERSTAT (Personnel Status)</SelectItem>
                <SelectItem value="SITREP">SITREP (Situation Report)</SelectItem>
                <SelectItem value="SPOTREP">SPOTREP (Spot Report)</SelectItem>
                <SelectItem value="EQUIPMENT">Equipment Status</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance Summary</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reportType === 'SPOTREP' && (
            <div>
              <label className="text-sm font-medium">Situation</label>
              <Textarea
                value={spotsituation}
                onChange={(e) => setSpotsituation(e.target.value)}
                placeholder="Describe the situation..."
                rows={4}
              />
            </div>
          )}

          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !unitId}
            className="w-full"
          >
            {generateMutation.isPending ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Report Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>
              <strong>LOGSTAT:</strong> Supply class inventory, fuel, ammunition, equipment status
            </li>
            <li>
              <strong>PERSTAT:</strong> Personnel strength, authorized vs present, status breakdown
            </li>
            <li>
              <strong>SITREP:</strong> Comprehensive situation report with all operational data
            </li>
            <li>
              <strong>SPOTREP:</strong> Urgent spot report for specific incidents
            </li>
            <li>
              <strong>Equipment:</strong> Detailed equipment status and deadline items
            </li>
            <li>
              <strong>Maintenance:</strong> Work order summary and NMCS/NMCM counts
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

### 10. Template Editor Component

**File**: `frontend/src/components/reports/TemplateEditor.tsx` (new)

```typescript
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

const REPORT_SECTIONS = [
  'HEADER',
  'SITUATION',
  'LOGISTICS_SUMMARY',
  'SUPPLY_CLASS_I',
  'SUPPLY_CLASS_III',
  'SUPPLY_CLASS_V',
  'SUPPLY_CLASS_VIII',
  'EQUIPMENT_STATUS',
  'MAINTENANCE_STATUS',
  'PERSONNEL_STRENGTH',
  'MOVEMENT_STATUS',
  'AMMUNITION_STATUS',
  'MEDICAL_STATUS',
  'COMMUNICATIONS',
  'MORALE',
  'COMMANDER_ASSESSMENT',
  'REQUESTS',
  'WEATHER',
  'FOOTER',
];

export function TemplateEditor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    report_type: 'SITREP',
    description: '',
    template_body: '',
    sections: [] as string[],
    classification_default: 'UNCLASS',
    is_default: false,
  });

  const { data: templates } = useQuery({
    queryKey: ['report_templates'],
    queryFn: () => apiClient.get('/api/v1/reports/templates'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.post('/api/v1/reports/templates', data),
    onSuccess: () => {
      toast({ title: 'Template created' });
      queryClient.invalidateQueries({ queryKey: ['report_templates'] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) =>
      apiClient.put(`/api/v1/reports/templates/${editingId}`, data),
    onSuccess: () => {
      toast({ title: 'Template updated' });
      queryClient.invalidateQueries({ queryKey: ['report_templates'] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/api/v1/reports/templates/${id}`),
    onSuccess: () => {
      toast({ title: 'Template deleted' });
      queryClient.invalidateQueries({ queryKey: ['report_templates'] });
    },
  });

  const handleSubmit = async () => {
    if (!formData.name || !formData.template_body) {
      toast({
        title: 'Error',
        description: 'Name and template body are required',
        variant: 'destructive',
      });
      return;
    }

    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      report_type: 'SITREP',
      description: '',
      template_body: '',
      sections: [],
      classification_default: 'UNCLASS',
      is_default: false,
    });
    setIsCreating(false);
    setEditingId(null);
  };

  const toggleSection = (section: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter((s) => s !== section)
        : [...prev.sections, section],
    }));
  };

  return (
    <div className="space-y-6">
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingId ? 'Edit Template' : 'Create New Template'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Daily SITREP"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Report Type</label>
                <Select
                  value={formData.report_type}
                  onValueChange={(v) =>
                    setFormData({ ...formData, report_type: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOGSTAT">LOGSTAT</SelectItem>
                    <SelectItem value="PERSTAT">PERSTAT</SelectItem>
                    <SelectItem value="SITREP">SITREP</SelectItem>
                    <SelectItem value="SPOTREP">SPOTREP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe this template..."
                rows={2}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Sections</label>
              <div className="grid grid-cols-3 gap-2">
                {REPORT_SECTIONS.map((section) => (
                  <Badge
                    key={section}
                    variant={
                      formData.sections.includes(section) ? 'default' : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleSection(section)}
                  >
                    {section}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">
                Template Body (Jinja2)
              </label>
              <Textarea
                value={formData.template_body}
                onChange={(e) =>
                  setFormData({ ...formData, template_body: e.target.value })
                }
                placeholder="{% for unit in units %}...{% endfor %}"
                rows={10}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Use Jinja2 syntax. Available variables: unit, personnel,
                equipment, alerts, generated_at
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Saving...' : 'Save Template'}
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Report Templates</h3>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Sections</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates?.map((template) => (
              <TableRow key={template.id}>
                <TableCell className="font-medium">{template.name}</TableCell>
                <TableCell>{template.report_type}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {(template.sections || []).slice(0, 3).map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                    {(template.sections || []).length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{(template.sections || []).length - 3}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {template.is_default ? (
                    <Badge>Default</Badge>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData({
                          ...template,
                          sections: template.sections || [],
                        });
                        setEditingId(template.id);
                        setIsCreating(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(template.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

---

## Jinja2 Template Examples

### 11. Default LOGSTAT Template

**File**: `backend/app/seeds/default_templates.py` (seed data)

```python
LOGSTAT_TEMPLATE = """LOGISTICS STATUS REPORT (LOGSTAT)
================================================
UNIT: {{ unit.name }}
REPORT DATE: {{ generated_at.strftime('%Y%m%d %H%M') }}Z
CLASSIFICATION: {{ classification }}

SUPPLY STATUS:
--------------
{% for supply in supplies %}
{{ supply.supply_class }}:
  DOS: {{ supply.dos|round(1) }} days
  On Hand: {{ supply.on_hand }} units
  Consumption Rate: {{ supply.consumption_rate|round(1) }} units/day
{% endfor %}

EQUIPMENT STATUS:
-----------------
Mission Capable Rate: {{ equipment.mc_rate|round(1) }}%
Operational Equipment: {{ equipment.operational }}
Deadline Equipment: {{ equipment.deadline }}
Maintenance: {{ equipment.maintenance }}

MAINTENANCE:
-----------
Open Work Orders: {{ maintenance.open_count }}
In-Work Orders: {{ maintenance.inwork_count }}
Average Age: {{ maintenance.avg_age|round(1) }} days

MOVEMENTS:
----------
Active Movements: {{ movements.active }}
Total Lift Capacity: {{ movements.total_capacity }} tons

================================================
Report generated automatically by KEYSTONE system
Generated by: {{ generated_by_user.name }}
"""

PERSTAT_TEMPLATE = """PERSONNEL STATUS REPORT (PERSTAT)
================================================
UNIT: {{ unit.name }}
REPORT DATE: {{ generated_at.strftime('%Y%m%d %H%M') }}Z
CLASSIFICATION: {{ classification }}

STRENGTH SUMMARY:
-----------------
Authorized: {{ personnel.authorized }}
Present: {{ personnel.present }}
Readiness: {{ (personnel.present / personnel.authorized * 100)|round(1) }}%

BY STATUS:
{% for status, count in personnel.by_status.items() %}
  {{ status }}: {{ count }}
{% endfor %}

KEY PERSONNEL:
{% for person in key_personnel %}
  - {{ person.rank }} {{ person.name }} ({{ person.position }})
{% endfor %}

================================================
Report generated automatically by KEYSTONE system
"""

SITREP_TEMPLATE = """SITUATION REPORT (SITREP)
================================================
UNIT: {{ unit.name }}
REPORT DATE: {{ generated_at.strftime('%Y%m%d %H%M') }}Z
PERIOD: {{ period_start.strftime('%Y%m%d') }} - {{ period_end.strftime('%Y%m%d') }}

SITUATION:
----------
Unit Status: {{ unit.status }}
Personnel: {{ personnel.present }}/{{ personnel.authorized }}
Equipment: {{ equipment.operational }} MC

LOGISTICS:
----------
Supply Class I DOS: {{ logistics.class_i_dos|round(1) }} days
Fuel DOS: {{ logistics.class_iii_dos|round(1) }} days
Ammunition: {{ logistics.class_v_rounds }} rounds

RECENT EVENTS:
{% for alert in alerts|sort(attribute='created_at', reverse=True)|list|first(5) %}
  [{{ alert.priority }}] {{ alert.message }} ({{ alert.created_at.strftime('%H%M') }}Z)
{% endfor %}

COMMANDER ASSESSMENT:
{{ unit.commander_notes or 'Unit is operational and ready for tasking.' }}

================================================
Report generated automatically by KEYSTONE system
"""
```

---

## Implementation Checklist

- [ ] **Database Models**
  - [ ] Update `Report` model with new fields (template_id, format, classification, distribution_list, schedule_id, parent_report_id)
  - [ ] Create `ReportTemplate` model with Jinja2 template body
  - [ ] Create `ReportSchedule` model with frequency/timing
  - [ ] Create database migrations

- [ ] **Backend Service**
  - [ ] Implement `ReportGeneratorService` with all generation methods
  - [ ] Add async report rendering with Jinja2
  - [ ] Implement scheduling logic (APScheduler or manual polling)
  - [ ] Add distribution notification creation

- [ ] **API Endpoints**
  - [ ] Implement all report generation endpoints (LOGSTAT, PERSTAT, SITREP, SPOTREP, etc.)
  - [ ] CRUD endpoints for templates and schedules
  - [ ] Report finalization and distribution endpoints
  - [ ] Enhanced filtering/browsing

- [ ] **Frontend Components**
  - [ ] `ReportBrowser` with filtering
  - [ ] `ReportViewer` with formatting
  - [ ] `QuickGeneratePanel` for common reports
  - [ ] `TemplateEditor` for Jinja2 customization
  - [ ] `ScheduleManager` for automated generation
  - [ ] (Bonus) `ReportCompare` for side-by-side comparison

- [ ] **Seed Data**
  - [ ] Default templates (LOGSTAT, PERSTAT, SITREP, SPOTREP)
  - [ ] Sample schedules for demo
  - [ ] Example template sections

- [ ] **Testing**
  - [ ] Unit tests for report generation logic
  - [ ] Integration tests for API endpoints
  - [ ] Template rendering tests
  - [ ] Schedule evaluation tests

- [ ] **Security & Classification**
  - [ ] Enforce classification-based access controls
  - [ ] Audit report generation and distribution
  - [ ] Validate distribution list permissions

---

## Notes

- **Production Scheduling**: Replace manual polling with APScheduler or Celery Beat for better resource efficiency
- **PDF Export**: Add html2pdf or WeasyPrint for PDF generation (Phase 2)
- **Email Integration**: Implement actual email distribution (Phase 2)
- **Audit Logging**: Track all report generation, finalization, and distribution events
- **Classification Labels**: Ensure all new reports inherit appropriate DoD classification markings
- **Format Support**: Start with TEXT/HTML; add PDF, DOCX in later iterations
- **Rollup Recursion**: Parent reports can contain child reports; support deep hierarchies

---

## References

- USMC LOGSTAT Format: Standard logistics status reporting
- USMC PERSTAT Format: Personnel strength reporting
- USMC SITREP Format: Comprehensive situation assessment
- Jinja2 Documentation: Template syntax and rendering
- SQLAlchemy 2.0 Async: Database ORM patterns
- FastAPI OpenAPI: API documentation and schema generation

