"""Seed a few sample notifications for development.

Idempotent — only inserts if the notifications table is empty.
Requires an admin user to exist (will skip gracefully if not).
"""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Notification, NotificationChannel
from app.models.user import User

logger = logging.getLogger(__name__)


async def seed_notifications(db: AsyncSession) -> int:
    """Insert sample notifications addressed to the admin user.

    Returns the number of rows inserted. Returns 0 if any of the following
    are true:
      - the notifications table already has rows
      - no admin user exists
    """
    existing = await db.execute(select(func.count(Notification.id)))
    if (existing.scalar() or 0) > 0:
        return 0

    admin_res = await db.execute(select(User).where(User.username == "admin"))
    admin = admin_res.scalars().first()
    if not admin:
        logger.info("No admin user found — skipping notification seed.")
        return 0

    now = datetime.now(timezone.utc)

    fixtures = [
        {
            "title": "CL V Ammunition Critical",
            "body": (
                "Ammunition stock at 1/1 BN below 50% of RSR — 2 DOS remaining. "
                "Recommend immediate resupply request."
            ),
            "channel": NotificationChannel.IN_APP,
            "is_read": False,
            "created_at": now - timedelta(hours=2),
        },
        {
            "title": "Convoy Departed",
            "body": (
                "CVY-20260414-0001 departed Camp Pendleton ASP en route to MCAGCC "
                "Twentynine Palms. ETA 14:30 local."
            ),
            "channel": NotificationChannel.IN_APP,
            "is_read": False,
            "created_at": now - timedelta(hours=4),
        },
        {
            "title": "Maintenance Overdue",
            "body": (
                "3 HMMWVs across 1st Marine Regiment are past scheduled preventive "
                "maintenance intervals. Oldest overdue: 14 days."
            ),
            "channel": NotificationChannel.IN_APP,
            "is_read": True,
            "read_at": now - timedelta(hours=6),
            "created_at": now - timedelta(days=1),
        },
        {
            "title": "Readiness Rollup Ready",
            "body": (
                "Weekly DRRS readiness snapshot is available for I MEF. "
                "Open Readiness page to review."
            ),
            "channel": NotificationChannel.IN_APP,
            "is_read": True,
            "read_at": now - timedelta(days=1, hours=12),
            "created_at": now - timedelta(days=2),
        },
        {
            "title": "Fuel Level Warning",
            "body": (
                "Bulk fuel level at FARP Alpha below 30%. Automatic replenishment "
                "request submitted."
            ),
            "channel": NotificationChannel.IN_APP,
            "is_read": False,
            "created_at": now - timedelta(hours=8),
        },
    ]

    count = 0
    for fx in fixtures:
        db.add(Notification(user_id=admin.id, **fx))
        count += 1

    if count:
        await db.flush()

    return count
