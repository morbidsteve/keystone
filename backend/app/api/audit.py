"""Audit log API aliases — frontend expects /api/v1/audit/logs and /audit/security-actions."""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.permissions import require_role
from app.database import get_db
from app.models.custody import AuditAction, AuditEntityType
from app.models.user import Role, User
from app.schemas.custody import AuditLogResponse
from app.services.custody import AuditService

router = APIRouter()


@router.get(
    "/logs",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_role([Role.ADMIN]))],
)
async def audit_logs_alias(
    entity_type: Optional[AuditEntityType] = Query(None),
    entity_id: Optional[int] = Query(None),
    action: Optional[AuditAction] = Query(None),
    days_back: int = Query(30, ge=1, le=365),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Alias for /custody/audit — frontend compatibility."""
    from app.api.custody import list_audit_logs

    return await list_audit_logs(
        entity_type=entity_type,
        entity_id=entity_id,
        action=action,
        days_back=days_back,
        limit=limit,
        offset=offset,
        db=db,
        current_user=current_user,
    )


@router.get(
    "/security-actions",
    response_model=List[AuditLogResponse],
    dependencies=[Depends(require_role([Role.ADMIN]))],
)
async def security_actions_alias(
    hours_back: int = Query(24, ge=1, le=720),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Alias for /custody/audit/security — frontend compatibility."""
    from app.api.custody import get_sensitive_actions

    return await get_sensitive_actions(
        hours_back=hours_back,
        db=db,
        current_user=current_user,
    )
