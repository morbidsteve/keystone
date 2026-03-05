"""Notification management endpoints."""

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.database import get_db
from app.models.alert import AlertType, Notification, NotificationPreference
from app.models.user import User
from app.schemas.alert import (
    NotificationPreferenceResponse,
    NotificationPreferenceUpdate,
    NotificationResponse,
)

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
async def list_notifications(
    is_read: bool | None = Query(None),
    limit: int = Query(50, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List current user's notifications."""
    query = select(Notification).where(Notification.user_id == current_user.id)

    if is_read is not None:
        query = query.where(Notification.is_read == is_read)

    query = query.order_by(Notification.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    notifications = result.scalars().all()
    return [NotificationResponse.model_validate(n) for n in notifications]


@router.put("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all of the current user's notifications as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
    )
    notifications = result.scalars().all()
    now = datetime.now(timezone.utc)
    count = 0
    for n in notifications:
        n.is_read = True
        n.read_at = now
        count += 1

    await db.flush()
    return {"marked_read": count}


@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the count of unread notifications for the current user."""
    result = await db.execute(
        select(func.count(Notification.id)).where(
            Notification.user_id == current_user.id,
            Notification.is_read.is_(False),
        )
    )
    count = result.scalar() or 0
    return {"unread_count": count}


@router.put("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a single notification as read."""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id,
        )
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise NotFoundError("Notification", notification_id)

    notification.is_read = True
    notification.read_at = datetime.now(timezone.utc)
    await db.flush()

    return NotificationResponse.model_validate(notification)


@router.get("/preferences", response_model=List[NotificationPreferenceResponse])
async def list_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the current user's notification preferences."""
    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id
        )
    )
    prefs = result.scalars().all()
    return [NotificationPreferenceResponse.model_validate(p) for p in prefs]


@router.put("/preferences/{alert_type}", response_model=NotificationPreferenceResponse)
async def upsert_preference(
    alert_type: str,
    body: NotificationPreferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create or update a notification preference for a given alert type."""
    valid_types = {t.value for t in AlertType}
    if alert_type not in valid_types:
        raise BadRequestError(f"Unknown alert_type: {alert_type}")

    result = await db.execute(
        select(NotificationPreference).where(
            NotificationPreference.user_id == current_user.id,
            NotificationPreference.alert_type == alert_type,
        )
    )
    pref = result.scalar_one_or_none()

    if pref:
        pref.channel = body.channel
        pref.min_severity = body.min_severity
    else:
        pref = NotificationPreference(
            user_id=current_user.id,
            alert_type=alert_type,
            channel=body.channel,
            min_severity=body.min_severity,
        )
        db.add(pref)

    await db.flush()
    await db.refresh(pref)
    return NotificationPreferenceResponse.model_validate(pref)
