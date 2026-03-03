"""Alert management endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import get_accessible_units
from app.database import get_db
from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.user import User

router = APIRouter()


@router.get("/")
async def list_alerts(
    unit_id: Optional[int] = Query(None),
    severity: Optional[AlertSeverity] = Query(None),
    alert_type: Optional[AlertType] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List alerts for accessible units."""
    accessible = await get_accessible_units(db, current_user)
    query = select(Alert).where(Alert.unit_id.in_(accessible))

    if unit_id and unit_id in accessible:
        query = query.where(Alert.unit_id == unit_id)
    if severity:
        query = query.where(Alert.severity == severity)
    if alert_type:
        query = query.where(Alert.alert_type == alert_type)
    if acknowledged is not None:
        query = query.where(Alert.acknowledged == acknowledged)

    query = query.order_by(Alert.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return [
        {
            "id": a.id,
            "unit_id": a.unit_id,
            "alert_type": a.alert_type.value,
            "severity": a.severity.value,
            "message": a.message,
            "threshold_value": a.threshold_value,
            "actual_value": a.actual_value,
            "acknowledged": a.acknowledged,
            "acknowledged_by": a.acknowledged_by,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in alerts
    ]


@router.put("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Acknowledge an alert."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise NotFoundError("Alert", alert_id)

    # Verify user can see this unit
    accessible = await get_accessible_units(db, current_user)
    if alert.unit_id not in accessible:
        raise NotFoundError("Alert", alert_id)

    alert.acknowledged = True
    alert.acknowledged_by = current_user.id
    await db.flush()

    return {
        "id": alert.id,
        "acknowledged": True,
        "acknowledged_by": current_user.id,
        "message": "Alert acknowledged",
    }
