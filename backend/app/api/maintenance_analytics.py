"""Maintenance analytics endpoints."""

from fastapi import APIRouter, Depends
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
