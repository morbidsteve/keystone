"""Logistics recommendations / predictions endpoints."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.database import get_db
from app.models.prediction import LogisticsRecommendation
from app.models.user import User
from app.schemas.prediction import (
    LogisticsRecommendationResponse,
    RecommendationApproveRequest,
    RecommendationDenyRequest,
)

router = APIRouter()


@router.get(
    "/recommendations",
    response_model=List[LogisticsRecommendationResponse],
)
async def list_recommendations(
    status: Optional[str] = Query(None),
    target_unit_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List logistics recommendations with optional filters."""
    query = select(LogisticsRecommendation).order_by(
        LogisticsRecommendation.created_at.desc()
    )
    if status:
        query = query.where(LogisticsRecommendation.status == status)
    if target_unit_id:
        query = query.where(
            LogisticsRecommendation.target_unit_id == target_unit_id
        )
    result = await db.execute(query)
    recs = result.scalars().all()
    return [
        LogisticsRecommendationResponse.model_validate(r) for r in recs
    ]


@router.get(
    "/recommendations/{rec_id}",
    response_model=LogisticsRecommendationResponse,
)
async def get_recommendation(
    rec_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific recommendation."""
    rec = await db.get(LogisticsRecommendation, rec_id)
    if not rec:
        raise NotFoundError("LogisticsRecommendation", rec_id)
    return LogisticsRecommendationResponse.model_validate(rec)


@router.post(
    "/recommendations/{rec_id}/approve",
    response_model=LogisticsRecommendationResponse,
)
async def approve_recommendation(
    rec_id: int,
    body: RecommendationApproveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a recommendation."""
    rec = await db.get(LogisticsRecommendation, rec_id)
    if not rec:
        raise NotFoundError("LogisticsRecommendation", rec_id)
    if rec.status != "PENDING":
        raise BadRequestError("Can only approve PENDING recommendations")

    rec.status = "APPROVED"
    rec.decided_at = datetime.now(timezone.utc)
    rec.decided_by = current_user.id
    rec.notes = body.notes
    await db.flush()
    await db.refresh(rec)
    return LogisticsRecommendationResponse.model_validate(rec)


@router.post(
    "/recommendations/{rec_id}/deny",
    response_model=LogisticsRecommendationResponse,
)
async def deny_recommendation(
    rec_id: int,
    body: RecommendationDenyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Deny a recommendation."""
    rec = await db.get(LogisticsRecommendation, rec_id)
    if not rec:
        raise NotFoundError("LogisticsRecommendation", rec_id)
    if rec.status != "PENDING":
        raise BadRequestError("Can only deny PENDING recommendations")

    rec.status = "DENIED"
    rec.decided_at = datetime.now(timezone.utc)
    rec.decided_by = current_user.id
    rec.notes = body.notes
    await db.flush()
    await db.refresh(rec)
    return LogisticsRecommendationResponse.model_validate(rec)
