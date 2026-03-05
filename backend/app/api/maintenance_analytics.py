"""Maintenance analytics endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.permissions import check_unit_access
from app.database import get_db
from app.models.user import User
from app.services.maintenance_analytics import MaintenanceAnalytics

router = APIRouter()


@router.get("/analytics/{unit_id}")
async def get_maintenance_analytics(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comprehensive maintenance analytics for a unit."""
    await check_unit_access(current_user, unit_id, db)

    analytics = MaintenanceAnalytics(db, unit_id)
    return await analytics.get_comprehensive_analytics()


@router.get("/analytics/{unit_id}/personnel-workload")
async def get_personnel_workload(
    unit_id: int,
    days: int = Query(30, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Personnel workload analytics: hours, WO count, labor type breakdown."""
    await check_unit_access(current_user, unit_id, db)
    analytics = MaintenanceAnalytics(db, unit_id)
    return await analytics.get_personnel_workload(days)


@router.get("/analytics/{unit_id}/equipment-reliability")
async def get_equipment_reliability(
    unit_id: int,
    days: int = Query(90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Equipment reliability: WO frequency, corrective vs preventive."""
    await check_unit_access(current_user, unit_id, db)
    analytics = MaintenanceAnalytics(db, unit_id)
    return await analytics.get_equipment_reliability(days)


@router.get("/analytics/{unit_id}/parts-failure")
async def get_parts_failure_analysis(
    unit_id: int,
    days: int = Query(90, ge=7, le=365),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Parts failure analysis: top parts by replacement count and cost."""
    await check_unit_access(current_user, unit_id, db)
    analytics = MaintenanceAnalytics(db, unit_id)
    return await analytics.get_parts_failure_analysis(days)


@router.get("/analytics/{unit_id}/mtbf-mttr")
async def get_mtbf_mttr(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """MTBF and MTTR by equipment type."""
    await check_unit_access(current_user, unit_id, db)
    analytics = MaintenanceAnalytics(db, unit_id)
    return await analytics.get_mtbf_mttr()
