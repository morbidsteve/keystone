"""Pydantic schemas for alerts, notifications, rules, and preferences."""

import math
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.alert import (
    AlertEntityType,
    AlertSeverity,
    AlertType,
    NotificationChannel,
    RuleOperator,
)

VALID_METRICS = {
    "supply_dos",
    "equipment_readiness_pct",
    "pm_overdue_days",
    "personnel_strength_pct",
    "eas_days_remaining",
    "fuel_level_pct",
    "ammo_vs_rsr_pct",
    "DOS",
    "READINESS_PCT",
    "ON_HAND_QTY",
    "FILL_RATE",
    "MAINTENANCE_BACKLOG",
    "FUEL_LEVEL",
}


# --- Alert ---


class AlertResponse(BaseModel):
    id: int
    unit_id: int
    alert_type: AlertType
    severity: AlertSeverity
    message: str
    threshold_value: Optional[float] = None
    actual_value: Optional[float] = None
    entity_type: Optional[AlertEntityType] = None
    entity_id: Optional[int] = None
    link_url: Optional[str] = None
    acknowledged: bool
    acknowledged_by: Optional[int] = None
    acknowledged_at: Optional[datetime] = None
    resolved: bool
    resolved_by: Optional[int] = None
    resolved_at: Optional[datetime] = None
    escalated: bool
    escalated_to: Optional[int] = None
    escalated_at: Optional[datetime] = None
    auto_generated: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AlertListResponse(BaseModel):
    items: List[AlertResponse]
    total: int
    offset: int
    limit: int


class AlertSummaryResponse(BaseModel):
    total_active: int
    by_severity: Dict[str, int]
    by_type: Dict[str, int]


# --- Alert Rule ---


class AlertRuleCreate(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    alert_type: str = Field(..., max_length=50)
    severity: str = Field(..., max_length=20)
    metric: str = Field(..., max_length=100)
    operator: RuleOperator
    threshold_value: float = Field(..., ge=-1e9, le=1e9)
    is_scope_all: bool = True
    scope_unit_id: Optional[int] = None
    cooldown_minutes: int = Field(60, ge=1, le=1440)
    is_active: bool = True

    # Advanced scoping
    scope_type: Optional[str] = "ANY_UNIT"
    scope_echelon: Optional[str] = None
    include_subordinates: bool = False

    # Advanced metric
    metric_type: Optional[str] = None
    metric_item_filter: Optional[Any] = None

    # Notification targets
    notify_roles: Optional[List[str]] = None
    check_interval_minutes: int = Field(15, ge=1, le=1440)

    # Predictive logistics
    auto_recommend: bool = False
    recommend_type: Optional[str] = None
    recommend_source_unit_id: Optional[int] = None
    recommend_assign_to_role: Optional[str] = None

    @field_validator("threshold_value")
    @classmethod
    def validate_threshold(cls, v: float) -> float:
        if v is not None and (math.isnan(v) or math.isinf(v)):
            raise ValueError("threshold_value must be a finite number")
        return v

    @field_validator("alert_type")
    @classmethod
    def validate_alert_type(cls, v: str) -> str:
        valid_types = {t.value for t in AlertType}
        if v not in valid_types:
            raise ValueError(f"Unknown alert_type: {v}. Valid: {sorted(valid_types)}")
        return v

    @field_validator("severity")
    @classmethod
    def validate_severity(cls, v: str) -> str:
        valid = {s.value for s in AlertSeverity}
        if v not in valid:
            raise ValueError(f"Unknown severity: {v}. Valid: {sorted(valid)}")
        return v

    @field_validator("metric")
    @classmethod
    def validate_metric(cls, v: str) -> str:
        if v not in VALID_METRICS:
            raise ValueError(f"Unknown metric: {v}. Valid: {sorted(VALID_METRICS)}")
        return v


class AlertRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    alert_type: Optional[str] = Field(None, max_length=50)
    severity: Optional[str] = Field(None, max_length=20)
    metric: Optional[str] = Field(None, max_length=100)
    operator: Optional[RuleOperator] = None
    threshold_value: Optional[float] = Field(None, ge=-1e9, le=1e9)
    is_scope_all: Optional[bool] = None
    scope_unit_id: Optional[int] = None
    cooldown_minutes: Optional[int] = Field(None, ge=1, le=1440)
    is_active: Optional[bool] = None

    # Advanced scoping
    scope_type: Optional[str] = None
    scope_echelon: Optional[str] = None
    include_subordinates: Optional[bool] = None

    # Advanced metric
    metric_type: Optional[str] = None
    metric_item_filter: Optional[Any] = None

    # Notification targets
    notify_roles: Optional[List[str]] = None
    check_interval_minutes: Optional[int] = Field(None, ge=1, le=1440)

    # Predictive logistics
    auto_recommend: Optional[bool] = None
    recommend_type: Optional[str] = None
    recommend_source_unit_id: Optional[int] = None
    recommend_assign_to_role: Optional[str] = None

    @field_validator("threshold_value")
    @classmethod
    def validate_threshold(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and (math.isnan(v) or math.isinf(v)):
            raise ValueError("threshold_value must be a finite number")
        return v


class AlertRuleResponse(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    alert_type: str
    severity: str
    metric: str
    operator: RuleOperator
    threshold_value: float
    is_scope_all: bool
    scope_unit_id: Optional[int] = None
    cooldown_minutes: int
    last_fired_at: Optional[datetime] = None
    is_active: bool
    created_by: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Advanced scoping
    scope_type: Optional[str] = "ANY_UNIT"
    scope_echelon: Optional[str] = None
    include_subordinates: bool = False

    # Advanced metric
    metric_type: Optional[str] = None
    metric_item_filter: Optional[Any] = None

    # Notification targets
    notify_roles: Optional[List[str]] = None
    check_interval_minutes: int = 15

    # Predictive logistics
    auto_recommend: bool = False
    recommend_type: Optional[str] = None
    recommend_source_unit_id: Optional[int] = None
    recommend_assign_to_role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


# --- Notification ---


class NotificationResponse(BaseModel):
    id: int
    user_id: int
    alert_id: Optional[int] = None
    title: str
    body: str
    link_url: Optional[str] = None
    channel: NotificationChannel
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# --- Notification Preference ---


class NotificationPreferenceUpdate(BaseModel):
    channel: str = Field("IN_APP", pattern=r"^(IN_APP|EMAIL|BOTH|NONE)$")
    min_severity: str = Field("INFO", pattern=r"^(INFO|WARNING|CRITICAL)$")


class NotificationPreferenceResponse(BaseModel):
    id: int
    user_id: int
    alert_type: str
    channel: str
    min_severity: str

    model_config = ConfigDict(from_attributes=True)


# --- Escalation ---


class EscalateRequest(BaseModel):
    escalate_to_user_id: int
