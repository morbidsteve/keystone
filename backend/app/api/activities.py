"""Activity feed API — list recent activities across the system."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.core.auth import get_current_user
from app.database import get_db
from app.models.activity import Activity, ActivityType
from app.models.user import User

router = APIRouter()


class ActivityResponse(BaseModel):
    """Schema for a single activity record."""

    id: int
    activity_type: ActivityType
    unit_id: Optional[int] = None
    user_id: Optional[int] = None
    action: str
    description: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime
    user_full_name: Optional[str] = None
    unit_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


@router.get("", response_model=List[ActivityResponse])
async def list_activities(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    unit_id: Optional[int] = Query(None, description="Filter by unit ID"),
    activity_type: Optional[ActivityType] = Query(
        None, description="Filter by activity type"
    ),
    limit: int = Query(50, ge=1, le=500, description="Max records to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
) -> List[ActivityResponse]:
    """List recent activities with optional filtering."""
    stmt = (
        select(Activity)
        .options(joinedload(Activity.user), joinedload(Activity.unit))
        .order_by(Activity.created_at.desc())
    )

    if unit_id is not None:
        stmt = stmt.where(Activity.unit_id == unit_id)

    if activity_type is not None:
        stmt = stmt.where(Activity.activity_type == activity_type)

    stmt = stmt.offset(offset).limit(limit)

    result = await db.execute(stmt)
    activities = result.unique().scalars().all()

    response: List[ActivityResponse] = []
    for act in activities:
        resp = ActivityResponse(
            id=act.id,
            activity_type=act.activity_type,
            unit_id=act.unit_id,
            user_id=act.user_id,
            action=act.action,
            description=act.description,
            entity_type=act.entity_type,
            entity_id=act.entity_id,
            details=act.details,
            created_at=act.created_at,
            user_full_name=act.user.full_name if act.user else None,
            unit_name=act.unit.name if act.unit else None,
        )
        response.append(resp)

    return response
