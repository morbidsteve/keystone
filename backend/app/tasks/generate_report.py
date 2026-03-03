"""Celery task for generating reports."""

import json
import logging

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.config import settings
from app.models.report import Report, ReportStatus, ReportType
from app.tasks import celery_app

logger = logging.getLogger(__name__)

sync_engine = create_engine(settings.DATABASE_URL_SYNC)


@celery_app.task(name="generate_report_task", bind=True, max_retries=3)
def generate_report_task(self, report_id: int):
    """Generate a report based on its type.

    Uses synchronous database access since Celery workers
    do not run an async event loop.
    """
    try:
        with Session(sync_engine) as db:
            report = db.execute(
                select(Report).where(Report.id == report_id)
            ).scalar_one_or_none()

            if not report:
                logger.error(f"Report {report_id} not found")
                return {"error": "Report not found"}

            # Generate content based on report type
            # Note: Report generation functions are async, so for Celery
            # we build a simplified synchronous version
            content = _generate_sync(db, report)

            report.content = json.dumps(content)
            report.status = ReportStatus.DRAFT
            db.commit()

            logger.info(f"Generated report {report_id} ({report.report_type.value})")

            return {
                "status": "success",
                "report_id": report_id,
                "report_type": report.report_type.value,
            }

    except Exception as exc:
        logger.exception(f"Failed to generate report {report_id}")
        raise self.retry(exc=exc, countdown=60)


def _generate_sync(db: Session, report: Report) -> dict:
    """Synchronous report content generation for Celery."""
    from sqlalchemy import func

    from app.core.military import SUPPLY_CLASS_NAMES, determine_supply_status_by_dos
    from app.models.equipment import EquipmentStatus
    from app.models.supply import SupplyClass, SupplyStatusRecord
    from app.models.unit import Unit

    unit = db.execute(
        select(Unit).where(Unit.id == report.unit_id)
    ).scalar_one_or_none()

    if not unit:
        return {"error": "Unit not found"}

    if report.report_type == ReportType.LOGSTAT:
        return _build_logstat_sync(db, unit, report)
    elif report.report_type == ReportType.READINESS:
        return _build_readiness_sync(db, unit, report)
    elif report.report_type == ReportType.SUPPLY_STATUS:
        return _build_supply_status_sync(db, unit, report)
    elif report.report_type == ReportType.ROLLUP:
        return _build_rollup_sync(db, unit, report)
    else:
        return {"error": f"Unknown report type: {report.report_type.value}"}


def _build_logstat_sync(db: Session, unit, report: Report) -> dict:
    """Build LOGSTAT data synchronously."""
    from app.core.military import SUPPLY_CLASS_NAMES, determine_supply_status_by_dos
    from app.models.supply import SupplyClass, SupplyStatusRecord

    sections = {}
    for sc in SupplyClass:
        query = select(SupplyStatusRecord).where(
            SupplyStatusRecord.unit_id == unit.id,
            SupplyStatusRecord.supply_class == sc,
        )
        if report.period_start:
            query = query.where(SupplyStatusRecord.reported_at >= report.period_start)
        if report.period_end:
            query = query.where(SupplyStatusRecord.reported_at <= report.period_end)

        records = db.execute(query).scalars().all()
        if records:
            avg_dos = sum(r.dos for r in records) / len(records)
            sections[sc.value] = {
                "class": sc.value,
                "class_name": SUPPLY_CLASS_NAMES.get(sc, sc.value),
                "items": [
                    {
                        "item": r.item_description,
                        "on_hand": r.on_hand_qty,
                        "required": r.required_qty,
                        "dos": r.dos,
                        "status": r.status.value,
                    }
                    for r in records
                ],
                "status": determine_supply_status_by_dos(avg_dos).value,
            }

    return {
        "report_type": "LOGSTAT",
        "unit_name": unit.name,
        "supply_status": sections,
    }


def _build_readiness_sync(db: Session, unit, report: Report) -> dict:
    """Build readiness data synchronously."""
    from app.models.equipment import EquipmentStatus

    query = select(EquipmentStatus).where(EquipmentStatus.unit_id == unit.id)
    records = db.execute(query).scalars().all()

    total_poss = sum(r.total_possessed for r in records)
    total_mc = sum(r.mission_capable for r in records)

    return {
        "report_type": "READINESS",
        "unit_name": unit.name,
        "overall_readiness_pct": round(total_mc / total_poss * 100, 1) if total_poss else 0,
        "equipment": [
            {
                "tamcn": r.tamcn,
                "nomenclature": r.nomenclature,
                "possessed": r.total_possessed,
                "mc": r.mission_capable,
                "readiness_pct": r.readiness_pct,
            }
            for r in records
        ],
    }


def _build_supply_status_sync(db: Session, unit, report: Report) -> dict:
    """Build supply status data synchronously."""
    return _build_logstat_sync(db, unit, report)


def _build_rollup_sync(db: Session, unit, report: Report) -> dict:
    """Build rollup data synchronously."""
    from app.models.unit import Unit

    children = db.execute(
        select(Unit).where(Unit.parent_id == unit.id)
    ).scalars().all()

    return {
        "report_type": "ROLLUP",
        "unit_name": unit.name,
        "subordinate_count": len(children),
        "subordinates": [
            {"id": c.id, "name": c.name, "abbreviation": c.abbreviation}
            for c in children
        ],
    }
