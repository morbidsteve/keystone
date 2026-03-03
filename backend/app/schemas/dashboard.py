"""Dashboard aggregation schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models.alert import AlertSeverity, AlertType
from app.models.supply import SupplyClass, SupplyStatus


class SupplyClassSummary(BaseModel):
    supply_class: SupplyClass
    avg_dos: float
    status: SupplyStatus
    item_count: int


class ReadinessSummary(BaseModel):
    unit_id: int
    unit_name: str
    overall_readiness_pct: float
    total_equipment: int
    mission_capable: int
    not_mission_capable: int


class SustainabilityProjection(BaseModel):
    supply_class: SupplyClass
    current_dos: float
    consumption_rate: float
    projected_exhaustion_days: Optional[float] = None
    status: SupplyStatus


class AlertSummary(BaseModel):
    id: int
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    unit_id: int
    acknowledged: bool
    created_at: datetime


class DashboardSummary(BaseModel):
    supply_overview: List[SupplyClassSummary]
    equipment_readiness: float
    active_movements: int
    critical_alerts: int
    total_alerts: int
    readiness_summaries: Optional[List[ReadinessSummary]] = None
    sustainability_projections: Optional[List[SustainabilityProjection]] = None
    recent_alerts: Optional[List[AlertSummary]] = None
