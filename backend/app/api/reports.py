"""Report generation and management endpoints."""

import json
import logging
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units, require_role
from app.database import get_db
from app.models.report import Report, ReportStatus, ReportType
from app.models.user import Role, User
from app.schemas.report import ReportCreate, ReportResponse
from app.services.report_generator import generate_and_save_report

logger = logging.getLogger(__name__)

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S4]

# Valid report types for the generate endpoint
VALID_REPORT_TYPES = {
    "LOGSTAT",
    "READINESS",
    "SUPPLY_STATUS",
    "EQUIPMENT_STATUS",
    "MAINTENANCE_SUMMARY",
    "MOVEMENT_SUMMARY",
    "PERSONNEL_STRENGTH",
}


@router.get("/", response_model=List[ReportResponse])
async def list_reports(
    unit_id: Optional[int] = Query(None),
    report_type: Optional[ReportType] = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List generated reports."""
    accessible = await get_accessible_units(db, current_user)
    query = select(Report).where(Report.unit_id.in_(accessible))

    if unit_id and unit_id in accessible:
        query = query.where(Report.unit_id == unit_id)
    if report_type:
        query = query.where(Report.report_type == report_type)

    query = query.order_by(Report.generated_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/generate", response_model=ReportResponse, status_code=201)
async def generate_report(
    report_type: str = Query(...),
    unit_id: int = Query(...),
    title: Optional[str] = Query(None, max_length=255),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(WRITE_ROLES)),
):
    """Generate a new report by querying live data sources.

    Supported report types:
    - LOGSTAT: Daily logistics status (supply, equipment, maintenance, movements, personnel)
    - READINESS: Equipment readiness with MC/NMC rates
    - SUPPLY_STATUS: Supply levels by class with critical items
    - EQUIPMENT_STATUS: Fleet readiness and individual equipment breakdown
    - MAINTENANCE_SUMMARY: Work order counts, completion times, parts, labor
    - MOVEMENT_SUMMARY: Active/planned/completed movements
    - PERSONNEL_STRENGTH: Assigned vs active, status breakdown by rank/MOS
    """
    if report_type not in VALID_REPORT_TYPES:
        raise BadRequestError(
            f"Invalid report type. Valid types: {', '.join(sorted(VALID_REPORT_TYPES))}"
        )

    await check_unit_access(current_user, unit_id, db)

    # Parse dates if provided
    parsed_from: Optional[datetime] = None
    parsed_to: Optional[datetime] = None
    if date_from:
        try:
            parsed_from = datetime.fromisoformat(date_from)
        except ValueError:
            raise BadRequestError("Invalid date_from format. Use ISO 8601 (e.g. 2026-01-15)")
    if date_to:
        try:
            parsed_to = datetime.fromisoformat(date_to)
        except ValueError:
            raise BadRequestError("Invalid date_to format. Use ISO 8601 (e.g. 2026-01-15)")

    report_title = title or f"{report_type} Report"

    report = await generate_and_save_report(
        db=db,
        report_type=report_type,
        unit_id=unit_id,
        title=report_title,
        user_id=current_user.id,
        date_from=parsed_from,
        date_to=parsed_to,
    )
    return report


@router.post("/", response_model=ReportResponse, status_code=201)
async def create_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new report record (legacy endpoint, uses Celery for generation)."""
    await check_unit_access(current_user, data.unit_id, db)

    report = Report(
        unit_id=data.unit_id,
        report_type=data.report_type,
        title=data.title,
        status=ReportStatus.DRAFT,
        generated_by=current_user.id,
        period_start=data.period_start,
        period_end=data.period_end,
    )
    db.add(report)
    await db.flush()
    await db.refresh(report)

    # Trigger Celery task for report generation
    try:
        from app.tasks.generate_report import generate_report_task

        generate_report_task.delay(report.id)
    except Exception:
        logger.warning("Celery broker unavailable; report %s queued locally", report.id, exc_info=True)
        report.content = json.dumps(
            {"status": "pending", "message": "Report generation queued (async worker unavailable)"}
        )

    return report


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single report."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("Report", report_id)

    await check_unit_access(current_user, report.unit_id, db)
    return report


@router.put("/{report_id}/finalize", response_model=ReportResponse)
async def finalize_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role(WRITE_ROLES)),
):
    """Mark a report as final."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundError("Report", report_id)

    await check_unit_access(current_user, report.unit_id, db)

    if report.status == ReportStatus.FINAL:
        raise BadRequestError("Report is already finalized")

    report.status = ReportStatus.FINAL
    await db.flush()
    await db.refresh(report)
    return report
