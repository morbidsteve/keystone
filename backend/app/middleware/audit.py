"""Audit logging utility for write operations.

Provides a lightweight helper that creates an Activity record for any
create / update / delete action.  This is intentionally decoupled from the
Custody-specific ``AuditService`` so it can be used across all domains.
"""

from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity import Activity, ActivityType

# Map entity_type strings to ActivityType enum values where possible.
_ENTITY_ACTIVITY_MAP = {
    "work_order": ActivityType.WORK_ORDER,
    "requisition": ActivityType.REQUISITION,
    "alert": ActivityType.ALERT,
    "custody_transfer": ActivityType.SUPPLY,
    "personnel": ActivityType.PERSONNEL,
    "convoy": ActivityType.CONVOY,
    "supply": ActivityType.SUPPLY,
    "report": ActivityType.REPORT,
}


async def log_audit(
    db: AsyncSession,
    user_id: int,
    action: str,
    entity_type: str,
    entity_id: str,
    details: Optional[dict] = None,
    unit_id: Optional[int] = None,
):
    """Log an audit entry for a write operation.

    Creates an ``Activity`` record that is persisted alongside the current
    transaction (caller is responsible for flushing / committing).

    Parameters
    ----------
    db:
        The current async database session.
    user_id:
        ID of the user performing the action.
    action:
        Short verb — ``"CREATE"``, ``"UPDATE"``, or ``"DELETE"``.
    entity_type:
        Logical entity name, e.g. ``"work_order"``, ``"requisition"``.
    entity_id:
        String representation of the entity's primary key.
    details:
        Optional JSON-serialisable dict with extra context (old/new values, etc.).
    unit_id:
        Optional unit scope for the activity.
    """
    activity_type = _ENTITY_ACTIVITY_MAP.get(entity_type, ActivityType.SUPPLY)

    activity = Activity(
        activity_type=activity_type,
        unit_id=unit_id,
        user_id=user_id,
        action=action,
        description=f"{action} {entity_type} {entity_id}",
        entity_type=entity_type,
        entity_id=int(entity_id) if entity_id.isdigit() else None,
        details=details,
    )
    db.add(activity)
    # We intentionally do NOT flush here — the caller controls the transaction.
