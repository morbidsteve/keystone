"""Alert management endpoints."""

from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import BadRequestError, NotFoundError
from app.core.permissions import get_accessible_units, require_role
from app.database import get_db
from app.models.alert import Alert, AlertRule, AlertSeverity, AlertType
from app.models.user import Role, User
from app.schemas.alert import (
    AlertListResponse,
    AlertResponse,
    AlertRuleCreate,
    AlertRuleResponse,
    AlertRuleUpdate,
    AlertSummaryResponse,
    EscalateRequest,
)

router = APIRouter()

WRITE_ROLES = [Role.ADMIN, Role.COMMANDER, Role.S4]


# ---- Alert endpoints ----


@router.get("/summary", response_model=AlertSummaryResponse)
async def get_alert_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get alert counts by severity and type (unresolved only)."""
    accessible = await get_accessible_units(db, current_user)
    base_filter = [
        Alert.unit_id.in_(accessible),
        Alert.resolved.is_(False),
    ]

    # Count by severity
    sev_result = await db.execute(
        select(Alert.severity, func.count(Alert.id))
        .where(*base_filter)
        .group_by(Alert.severity)
    )
    by_severity = {row[0].value: row[1] for row in sev_result.all()}

    # Count by type
    type_result = await db.execute(
        select(Alert.alert_type, func.count(Alert.id))
        .where(*base_filter)
        .group_by(Alert.alert_type)
    )
    by_type = {row[0].value: row[1] for row in type_result.all()}

    total_active = sum(by_severity.values())

    return AlertSummaryResponse(
        total_active=total_active,
        by_severity=by_severity,
        by_type=by_type,
    )


@router.get("/", response_model=AlertListResponse)
async def list_alerts(
    unit_id: Optional[int] = Query(None),
    severity: Optional[AlertSeverity] = Query(None),
    alert_type: Optional[AlertType] = Query(None),
    acknowledged: Optional[bool] = Query(None),
    resolved: Optional[bool] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List alerts for accessible units with filtering and pagination."""
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
    if resolved is not None:
        query = query.where(Alert.resolved == resolved)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Alert.created_at.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    alerts = result.scalars().all()

    return AlertListResponse(
        items=[AlertResponse.model_validate(a) for a in alerts],
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single alert by ID."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise NotFoundError("Alert", alert_id)

    accessible = await get_accessible_units(db, current_user)
    if alert.unit_id not in accessible:
        raise NotFoundError("Alert", alert_id)

    return AlertResponse.model_validate(alert)


@router.put("/{alert_id}/acknowledge", response_model=AlertResponse)
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
    alert.acknowledged_at = datetime.now(timezone.utc)
    await db.flush()

    return AlertResponse.model_validate(alert)


@router.put("/{alert_id}/resolve", response_model=AlertResponse)
async def resolve_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark an alert as resolved."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise NotFoundError("Alert", alert_id)

    accessible = await get_accessible_units(db, current_user)
    if alert.unit_id not in accessible:
        raise NotFoundError("Alert", alert_id)

    if alert.resolved:
        raise BadRequestError("Alert is already resolved")

    alert.resolved = True
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.now(timezone.utc)
    await db.flush()

    return AlertResponse.model_validate(alert)


@router.put("/{alert_id}/escalate", response_model=AlertResponse)
async def escalate_alert(
    alert_id: int,
    body: EscalateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.COMMANDER])),
):
    """Escalate an alert to another user (ADMIN/COMMANDER only)."""
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise NotFoundError("Alert", alert_id)

    accessible = await get_accessible_units(db, current_user)
    if alert.unit_id not in accessible:
        raise NotFoundError("Alert", alert_id)

    # Verify target user exists
    target_result = await db.execute(
        select(User).where(User.id == body.escalate_to_user_id)
    )
    target_user = target_result.scalar_one_or_none()
    if not target_user:
        raise NotFoundError("User", body.escalate_to_user_id)

    # Verify the target user is reachable by the current user:
    # target must be an ADMIN or belong to a unit accessible to the current user.
    if target_user.role != Role.ADMIN:
        if target_user.unit_id not in accessible:
            raise BadRequestError("Target user is not within your accessible units")

    alert.escalated = True
    alert.escalated_to = body.escalate_to_user_id
    alert.escalated_at = datetime.now(timezone.utc)
    await db.flush()

    return AlertResponse.model_validate(alert)


# ---- Alert Rule endpoints (admin only) ----


@router.get("/rules", response_model=List[AlertRuleResponse])
async def list_alert_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """List all alert rules (admin only)."""
    result = await db.execute(select(AlertRule).order_by(AlertRule.created_at.desc()))
    rules = result.scalars().all()
    return [AlertRuleResponse.model_validate(r) for r in rules]


@router.post("/rules", response_model=AlertRuleResponse, status_code=201)
async def create_alert_rule(
    body: AlertRuleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Create a new alert rule (admin only)."""
    rule = AlertRule(
        name=body.name,
        description=body.description,
        alert_type=body.alert_type,
        severity=body.severity,
        metric=body.metric,
        operator=body.operator,
        threshold_value=body.threshold_value,
        is_scope_all=body.is_scope_all,
        scope_unit_id=body.scope_unit_id,
        cooldown_minutes=body.cooldown_minutes,
        is_active=body.is_active,
        created_by=current_user.id,
        scope_type=body.scope_type,
        scope_echelon=body.scope_echelon,
        include_subordinates=body.include_subordinates,
        metric_type=body.metric_type,
        metric_item_filter=body.metric_item_filter,
        notify_roles=body.notify_roles,
        check_interval_minutes=body.check_interval_minutes,
        auto_recommend=body.auto_recommend,
        recommend_type=body.recommend_type,
        recommend_source_unit_id=body.recommend_source_unit_id,
        recommend_assign_to_role=body.recommend_assign_to_role,
    )
    db.add(rule)
    await db.flush()
    await db.refresh(rule)
    return AlertRuleResponse.model_validate(rule)


@router.put("/rules/{rule_id}", response_model=AlertRuleResponse)
async def update_alert_rule(
    rule_id: int,
    body: AlertRuleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Update an alert rule (admin only)."""
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise NotFoundError("AlertRule", rule_id)

    RULE_UPDATABLE_FIELDS = {
        "name",
        "description",
        "alert_type",
        "severity",
        "metric",
        "operator",
        "threshold_value",
        "is_scope_all",
        "scope_unit_id",
        "cooldown_minutes",
        "is_active",
        "scope_type",
        "scope_echelon",
        "include_subordinates",
        "metric_type",
        "metric_item_filter",
        "notify_roles",
        "check_interval_minutes",
        "auto_recommend",
        "recommend_type",
        "recommend_source_unit_id",
        "recommend_assign_to_role",
    }
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field in RULE_UPDATABLE_FIELDS:
            setattr(rule, field, value)

    await db.flush()
    await db.refresh(rule)
    return AlertRuleResponse.model_validate(rule)


@router.post("/rules/{rule_id}/evaluate")
async def evaluate_alert_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Manually trigger evaluation of a specific alert rule (admin only)."""
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise NotFoundError("AlertRule", rule_id)

    from app.services.rule_engine import RuleEngine

    engine = RuleEngine(db)
    alerts = await engine.evaluate_rule(rule_id)

    return {
        "rule_id": rule_id,
        "alerts_fired": len(alerts),
        "message": (
            f"Rule '{rule.name}' evaluated: {len(alerts)} alert(s) fired"
        ),
    }


@router.delete("/rules/{rule_id}", status_code=204)
async def delete_alert_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Delete an alert rule (admin only)."""
    result = await db.execute(select(AlertRule).where(AlertRule.id == rule_id))
    rule = result.scalar_one_or_none()
    if not rule:
        raise NotFoundError("AlertRule", rule_id)

    await db.delete(rule)
    await db.flush()
