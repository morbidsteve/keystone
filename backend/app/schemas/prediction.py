"""Pydantic schemas for logistics recommendations."""

from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, ConfigDict


class LogisticsRecommendationResponse(BaseModel):
    id: int
    recommendation_type: str
    triggered_by_rule_id: Optional[int] = None
    triggered_by_metric: Optional[str] = None
    target_unit_id: int
    description: str
    recommended_items: Optional[List[Any]] = None
    recommended_source: Optional[str] = None
    recommended_vehicles: Optional[List[Any]] = None
    recommended_personnel: Optional[List[Any]] = None
    recommended_route: Optional[str] = None
    estimated_weight: Optional[float] = None
    estimated_cost: Optional[float] = None
    estimated_duration: Optional[str] = None
    status: str
    assigned_to_user_id: Optional[int] = None
    assigned_to_role: Optional[str] = None
    generated_movement_id: Optional[int] = None
    generated_requisition_id: Optional[int] = None
    created_at: Optional[datetime] = None
    decided_at: Optional[datetime] = None
    decided_by: Optional[int] = None
    notes: Optional[str] = None
    expires_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RecommendationApproveRequest(BaseModel):
    notes: Optional[str] = None
    auto_execute: bool = True


class RecommendationDenyRequest(BaseModel):
    notes: Optional[str] = None
