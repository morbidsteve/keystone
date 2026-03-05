"""SITREP and military report generation service."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.alert import Alert
from app.models.equipment import EquipmentStatus
from app.models.maintenance import MaintenanceWorkOrder, WorkOrderStatus
from app.models.medical import CasualtyReport, CasualtyReportStatus
from app.models.personnel import Personnel, PersonnelStatus
from app.models.report import (
    Report,
    ReportClassification,
    ReportFormat,
    ReportStatus,
    ReportTemplate,
    ReportType,
)
from app.models.transportation import Movement, MovementStatus
from app.models.unit import Unit

logger = logging.getLogger(__name__)

_CLASSIFICATION_ORDER = {
    ReportClassification.UNCLASS: 0,
    ReportClassification.CUI: 1,
    ReportClassification.SECRET: 2,
    ReportClassification.TS: 3,
    ReportClassification.TS_SCI: 4,
}


class SitrepGeneratorService:
    """Generates SITREP, PERSTAT, SPOTREP, and other military-format reports."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def _get_unit(self, unit_id: int) -> Unit:
        result = await self.db.execute(select(Unit).where(Unit.id == unit_id))
        unit = result.scalar_one_or_none()
        if not unit:
            raise NotFoundError("Unit", unit_id)
        return unit

    async def generate_sitrep(
        self,
        unit_id: int,
        user_id: int,
        period_start: Optional[datetime] = None,
        period_end: Optional[datetime] = None,
    ) -> Report:
        """Generate comprehensive SITREP combining all operational data."""
        now = datetime.now(timezone.utc)
        period_start = period_start or (now - timedelta(hours=24))
        period_end = period_end or now
        unit = await self._get_unit(unit_id)
        dtg = now.strftime("%d%H%MZ%b%y").upper()

        # Personnel
        pers_result = await self.db.execute(
            select(Personnel).where(Personnel.unit_id == unit_id)
        )
        personnel = pers_result.scalars().all()
        total_pers = len(personnel)
        active_pers = sum(1 for p in personnel if p.status != PersonnelStatus.INACTIVE)

        # Equipment
        eq_result = await self.db.execute(
            select(EquipmentStatus).where(EquipmentStatus.unit_id == unit_id)
        )
        equipment = eq_result.scalars().all()
        total_poss = sum(r.total_possessed for r in equipment)
        total_mc = sum(r.mission_capable for r in equipment)
        mc_rate = round(total_mc / total_poss * 100, 1) if total_poss > 0 else 0.0

        # Open work orders
        wo_result = await self.db.execute(
            select(func.count(MaintenanceWorkOrder.id)).where(
                MaintenanceWorkOrder.unit_id == unit_id,
                MaintenanceWorkOrder.status != WorkOrderStatus.COMPLETE,
            )
        )
        open_wos = wo_result.scalar() or 0

        # Active movements
        mv_result = await self.db.execute(
            select(func.count(Movement.id)).where(
                Movement.unit_id == unit_id,
                Movement.status.in_([MovementStatus.EN_ROUTE, MovementStatus.PLANNED]),
            )
        )
        active_mvts = mv_result.scalar() or 0

        # Active casualties
        cas_result = await self.db.execute(
            select(func.count(CasualtyReport.id)).where(
                CasualtyReport.unit_id == unit_id,
                CasualtyReport.status.in_(
                    [CasualtyReportStatus.OPEN, CasualtyReportStatus.IN_PROGRESS]
                ),
            )
        )
        active_casualties = cas_result.scalar() or 0

        # Alerts
        alert_result = await self.db.execute(
            select(Alert)
            .where(Alert.unit_id == unit_id, Alert.created_at >= period_start)
            .order_by(Alert.created_at.desc())
            .limit(10)
        )
        alerts = alert_result.scalars().all()

        pers_readiness = round(active_pers / total_pers * 100, 1) if total_pers > 0 else 0.0

        content = (
            f"SITUATION REPORT (SITREP)\n"
            f"================================================\n"
            f"UNIT: {unit.name} ({unit.abbreviation or ''})\n"
            f"DTG: {dtg}\n"
            f"CLASSIFICATION: CUI\n"
            f"PERIOD: {period_start.strftime('%Y%m%d %H%M')}Z"
            f" - {period_end.strftime('%Y%m%d %H%M')}Z\n"
            f"\n"
            f"1. SITUATION:\n"
            f"   Unit Status: OPERATIONAL\n"
            f"\n"
            f"2. PERSONNEL:\n"
            f"   Assigned: {total_pers}\n"
            f"   Present/Active: {active_pers}\n"
            f"   Readiness: {pers_readiness}%\n"
            f"   Active Casualties: {active_casualties}\n"
            f"\n"
            f"3. LOGISTICS:\n"
            f"   Equipment MC Rate: {mc_rate}%\n"
            f"   Total Possessed: {total_poss}\n"
            f"   Mission Capable: {total_mc}\n"
            f"   Open Work Orders: {open_wos}\n"
            f"\n"
            f"4. MOVEMENTS:\n"
            f"   Active/Planned: {active_mvts}\n"
            f"\n"
            f"5. ALERTS/EVENTS:\n"
        )
        for a in alerts:
            sev = a.severity.value if hasattr(a, "severity") and a.severity else "INFO"
            content += f"   [{sev}] {a.message}\n"
        if not alerts:
            content += "   No significant events during reporting period.\n"

        content += (
            f"\n"
            f"6. COMMANDER'S ASSESSMENT:\n"
            f"   Unit is operational and mission capable.\n"
            f"\n"
            f"================================================\n"
            f"Report generated by KEYSTONE // {dtg}\n"
        )

        report = Report(
            unit_id=unit_id,
            report_type=ReportType.SITREP,
            title=f"SITREP {unit.name} {now.strftime('%Y%m%d %H%M')}Z",
            content=content,
            format=ReportFormat.TEXT,
            classification=ReportClassification.CUI,
            status=ReportStatus.READY,
            generated_by=user_id,
            auto_generated=False,
            period_start=period_start,
            period_end=period_end,
        )
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def generate_perstat(
        self,
        unit_id: int,
        user_id: int,
    ) -> Report:
        """Generate PERSTAT (Personnel Status) report."""
        now = datetime.now(timezone.utc)
        unit = await self._get_unit(unit_id)
        dtg = now.strftime("%d%H%MZ%b%y").upper()

        pers_result = await self.db.execute(
            select(Personnel).where(Personnel.unit_id == unit_id)
        )
        personnel = pers_result.scalars().all()

        status_counts: Dict[str, int] = {}
        for p in personnel:
            s = p.status.value if p.status else "ACTIVE"
            status_counts[s] = status_counts.get(s, 0) + 1

        total = len(personnel)
        active = status_counts.get(PersonnelStatus.ACTIVE.value, 0)
        pers_readiness = round(active / total * 100, 1) if total > 0 else 0.0

        content = (
            f"PERSONNEL STATUS REPORT (PERSTAT)\n"
            f"================================================\n"
            f"UNIT: {unit.name} ({unit.abbreviation or ''})\n"
            f"DTG: {dtg}\n"
            f"CLASSIFICATION: CUI\n"
            f"\n"
            f"STRENGTH SUMMARY:\n"
            f"  Total Assigned: {total}\n"
            f"  Present/Active: {active}\n"
            f"  Readiness: {pers_readiness}%\n"
            f"\n"
            f"PERSONNEL BY STATUS:\n"
        )
        for status, count in sorted(status_counts.items()):
            content += f"  {status}: {count}\n"

        content += (
            f"\n"
            f"================================================\n"
            f"Report generated by KEYSTONE // {dtg}\n"
        )

        report = Report(
            unit_id=unit_id,
            report_type=ReportType.PERSTAT,
            title=f"PERSTAT {unit.name} {now.strftime('%Y%m%d')}",
            content=content,
            format=ReportFormat.TEXT,
            classification=ReportClassification.CUI,
            status=ReportStatus.READY,
            generated_by=user_id,
            auto_generated=False,
            period_start=now.replace(hour=0, minute=0, second=0, microsecond=0),
            period_end=now,
        )
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def generate_spotrep(
        self,
        unit_id: int,
        user_id: int,
        title: str,
        situation_text: str,
        classification: ReportClassification = ReportClassification.CUI,
    ) -> Report:
        """Generate SPOTREP (Spot Report) -- urgent, user-initiated."""
        now = datetime.now(timezone.utc)
        unit = await self._get_unit(unit_id)
        dtg = now.strftime("%d%H%MZ%b%y").upper()

        cls = classification

        content = (
            f"SPOT REPORT (SPOTREP)\n"
            f"================================================\n"
            f"UNIT: {unit.name} ({unit.abbreviation or ''})\n"
            f"DTG: {dtg}\n"
            f"CLASSIFICATION: {cls.value}\n"
            f"\n"
            f"SITUATION:\n"
            f"{situation_text}\n"
            f"\n"
            f"================================================\n"
            f"Report generated by KEYSTONE // {dtg}\n"
        )

        report = Report(
            unit_id=unit_id,
            report_type=ReportType.SPOTREP,
            title=title,
            content=content,
            format=ReportFormat.TEXT,
            classification=cls,
            status=ReportStatus.READY,
            generated_by=user_id,
            auto_generated=False,
        )
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report

    async def generate_rollup(
        self,
        parent_unit_id: int,
        user_id: int,
        report_type: ReportType = ReportType.SITREP,
    ) -> Report:
        """Generate rollup report aggregating subordinate unit reports."""
        now = datetime.now(timezone.utc)
        unit = await self._get_unit(parent_unit_id)
        dtg = now.strftime("%d%H%MZ%b%y").upper()

        # Get subordinate units (Unit.parent_id is the FK column)
        sub_result = await self.db.execute(
            select(Unit).where(Unit.parent_id == parent_unit_id)
        )
        subordinates = sub_result.scalars().all()

        # Get latest report from each subordinate
        child_reports: List[Report] = []
        for sub in subordinates:
            rpt_result = await self.db.execute(
                select(Report)
                .where(
                    Report.unit_id == sub.id,
                    Report.report_type == report_type,
                    Report.status.in_([ReportStatus.READY, ReportStatus.FINAL]),
                )
                .order_by(Report.generated_at.desc())
                .limit(1)
            )
            rpt = rpt_result.scalar_one_or_none()
            if rpt:
                child_reports.append(rpt)

        # Compute rollup classification as the MAX of all child classifications
        max_cls = ReportClassification.UNCLASS
        for cr in child_reports:
            cr_cls = cr.classification or ReportClassification.UNCLASS
            if _CLASSIFICATION_ORDER.get(cr_cls, 0) > _CLASSIFICATION_ORDER.get(max_cls, 0):
                max_cls = cr_cls

        content = (
            f"ROLLUP REPORT -- {report_type.value}\n"
            f"================================================\n"
            f"PARENT UNIT: {unit.name} ({unit.abbreviation or ''})\n"
            f"DTG: {dtg}\n"
            f"CLASSIFICATION: {max_cls.value}\n"
            f"SUBORDINATE REPORTS INCLUDED: {len(child_reports)}\n"
            f"\n"
        )
        for cr in child_reports:
            content += f"--- {cr.title} (Status: {cr.status.value}) ---\n"
            snippet = (cr.content or "")[:500]
            content += f"{snippet}\n\n"

        content += (
            f"================================================\n"
            f"Report generated by KEYSTONE // {dtg}\n"
        )

        report = Report(
            unit_id=parent_unit_id,
            report_type=ReportType.ROLLUP,
            title=f"ROLLUP {report_type.value} {unit.name} {dtg}",
            content=content,
            format=ReportFormat.TEXT,
            classification=max_cls,
            status=ReportStatus.READY,
            generated_by=user_id,
            auto_generated=True,
        )
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)

        # Link child reports
        for cr in child_reports:
            cr.parent_report_id = report.id
        await self.db.flush()

        return report

    async def render_from_template(
        self,
        template_id: int,
        unit_id: int,
        user_id: int,
        data: Optional[Dict[str, Any]] = None,
    ) -> Report:
        """Render a report using a Jinja2 template."""
        from jinja2.sandbox import SandboxedEnvironment

        tpl_result = await self.db.execute(
            select(ReportTemplate).where(ReportTemplate.id == template_id)
        )
        template = tpl_result.scalar_one_or_none()
        if not template:
            raise NotFoundError("ReportTemplate", template_id)

        unit = await self._get_unit(unit_id)
        now = datetime.now(timezone.utc)

        env = SandboxedEnvironment(autoescape=True)
        jinja_tpl = env.from_string(template.template_body)

        render_data = {
            "unit": {"name": unit.name, "abbreviation": unit.abbreviation, "uic": unit.uic},
            "dtg": now.strftime("%d%H%MZ%b%y").upper(),
            "generated_at": now.isoformat(),
            **(data or {}),
        }

        rendered = jinja_tpl.render(**render_data)

        report_type = ReportType.SITREP
        try:
            report_type = ReportType(template.report_type)
        except ValueError:
            pass

        cls = ReportClassification.UNCLASS
        try:
            cls = ReportClassification(template.classification_default)
        except ValueError:
            pass

        report = Report(
            unit_id=unit_id,
            report_type=report_type,
            title=f"{template.report_type} {unit.name} {now.strftime('%Y%m%d')}",
            content=rendered,
            template_id=template_id,
            format=ReportFormat.TEXT,
            classification=cls,
            status=ReportStatus.READY,
            generated_by=user_id,
            auto_generated=False,
        )
        self.db.add(report)
        await self.db.flush()
        await self.db.refresh(report)
        return report
