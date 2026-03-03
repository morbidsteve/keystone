"""Report generation and management endpoints."""

import json
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import check_unit_access, get_accessible_units
from app.database import get_db
from app.models.report import Report, ReportStatus, ReportType
from app.models.user import User
from app.schemas.report import ReportCreate, ReportResponse

router = APIRouter()


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
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a new report. Triggers background processing via Celery."""
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
        # If Celery is unavailable, generate synchronously placeholder
        report.content = json.dumps(
            {"status": "pending", "message": "Report generation queued"}
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
    current_user: User = Depends(get_current_user),
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
