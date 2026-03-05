"""Alert engine service for evaluating rules and firing alerts."""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import (
    Alert,
    AlertEntityType,
    AlertRule,
    AlertSeverity,
    AlertType,
    Notification,
    NotificationChannel,
    NotificationPreference,
    RuleOperator,
)
from app.models.equipment import EquipmentStatus
from app.models.personnel import Personnel, PersonnelStatus
from app.models.supply import SupplyStatusRecord
from app.models.unit import Unit
from app.models.user import User

logger = logging.getLogger(__name__)


def _safe_link_url(url: str | None) -> str | None:
    """Only allow relative URLs (starting with '/'). Reject absolute URLs."""
    if url is None:
        return None
    if url.startswith("/"):
        return url
    return None  # Reject absolute URLs


class AlertEngine:
    """Evaluates alert rules against current data and fires alerts."""

    @staticmethod
    async def evaluate_all_rules(db: AsyncSession) -> List[Alert]:
        """Evaluate all active alert rules and fire alerts where thresholds are breached."""
        result = await db.execute(
            select(AlertRule).where(AlertRule.is_active.is_(True))
        )
        rules = result.scalars().all()
        fired_alerts: List[Alert] = []

        for rule in rules:
            # Check cooldown period
            if rule.last_fired_at:
                cooldown_end = rule.last_fired_at + timedelta(
                    minutes=rule.cooldown_minutes
                )
                if datetime.now(timezone.utc) < cooldown_end:
                    logger.debug("Rule %s is in cooldown, skipping", rule.name)
                    continue

            # Determine target units
            if rule.is_scope_all:
                units_result = await db.execute(select(Unit))
                units = units_result.scalars().all()
            elif rule.scope_unit_id:
                units_result = await db.execute(
                    select(Unit).where(Unit.id == rule.scope_unit_id)
                )
                units = units_result.scalars().all()
            else:
                units = []

            if not units:
                continue

            metric = rule.metric.lower()
            alerts: List[Alert] = []

            if metric in ("supply_dos", "days_of_supply"):
                alerts = await AlertEngine.check_supply_thresholds(db, units, rule)
            elif metric in ("equipment_readiness", "readiness_pct", "mc_rate"):
                alerts = await AlertEngine.check_equipment_readiness(db, units, rule)
            elif metric in ("personnel_strength", "strength_pct", "fill_pct"):
                alerts = await AlertEngine.check_personnel_thresholds(db, units, rule)
            else:
                logger.warning(
                    "Unknown metric '%s' for rule %s", rule.metric, rule.name
                )
                continue

            if alerts:
                rule.last_fired_at = datetime.now(timezone.utc)
                fired_alerts.extend(alerts)

        await db.flush()
        return fired_alerts

    @staticmethod
    async def fire_alert(
        db: AsyncSession,
        rule: AlertRule,
        unit: Unit,
        actual_value: float,
        entity_type: Optional[AlertEntityType] = None,
        entity_id: Optional[int] = None,
    ) -> Alert:
        """Create an Alert from a triggered rule and dispatch notifications."""
        message = AlertEngine._build_alert_message(rule, unit, actual_value)

        # Map rule severity string to AlertSeverity enum
        try:
            severity = AlertSeverity(rule.severity)
        except ValueError:
            severity = AlertSeverity.WARNING

        # Map rule alert_type string to AlertType enum
        try:
            alert_type = AlertType(rule.alert_type)
        except ValueError:
            alert_type = AlertType.ANOMALY

        alert = Alert(
            unit_id=unit.id,
            alert_type=alert_type,
            severity=severity,
            message=message,
            threshold_value=rule.threshold_value,
            actual_value=actual_value,
            entity_type=entity_type,
            entity_id=entity_id,
            auto_generated=True,
        )
        db.add(alert)
        await db.flush()

        # Dispatch notifications to users in the affected unit
        await AlertEngine._dispatch_notifications(db, alert, unit)

        logger.info(
            "Alert fired: rule=%s unit=%s actual=%.2f threshold=%.2f",
            rule.name,
            unit.id,
            actual_value,
            rule.threshold_value,
        )
        return alert

    @staticmethod
    async def _dispatch_notifications(
        db: AsyncSession,
        alert: Alert,
        unit: Unit,
    ) -> None:
        """Create in-app notifications for users in the affected unit."""
        # Find users in this unit
        users_result = await db.execute(
            select(User).where(User.unit_id == unit.id, User.is_active.is_(True))
        )
        users = users_result.scalars().all()

        for user in users:
            # Check user preferences for this alert type
            pref_result = await db.execute(
                select(NotificationPreference).where(
                    NotificationPreference.user_id == user.id,
                    NotificationPreference.alert_type == alert.alert_type.value,
                )
            )
            pref = pref_result.scalar_one_or_none()

            # If preference is NONE, skip
            if pref and pref.channel == NotificationChannel.NONE.value:
                continue

            # Check minimum severity
            severity_order = {"INFO": 0, "WARNING": 1, "CRITICAL": 2}
            if pref and pref.min_severity:
                min_sev = severity_order.get(str(pref.min_severity), 0)
                alert_sev = severity_order.get(str(alert.severity.value), 0)
                if alert_sev < min_sev:
                    continue

            channel = NotificationChannel.IN_APP
            if pref and pref.channel:
                try:
                    channel = NotificationChannel(pref.channel)
                except ValueError:
                    channel = NotificationChannel.IN_APP

            notification = Notification(
                user_id=user.id,
                alert_id=alert.id,
                title=f"[{alert.severity.value}] {alert.alert_type.value}",
                body=alert.message,
                link_url=_safe_link_url(alert.link_url),
                channel=channel,
            )
            db.add(notification)

        await db.flush()

    @staticmethod
    def _compare_value(actual: float, operator: RuleOperator, threshold: float) -> bool:
        """Compare an actual value against a threshold using the given operator."""
        if operator == RuleOperator.LT:
            return actual < threshold
        elif operator == RuleOperator.LTE:
            return actual <= threshold
        elif operator == RuleOperator.GT:
            return actual > threshold
        elif operator == RuleOperator.GTE:
            return actual >= threshold
        elif operator == RuleOperator.EQ:
            return actual == threshold
        elif operator == RuleOperator.NEQ:
            return actual != threshold
        return False

    @staticmethod
    def _build_alert_message(rule: AlertRule, unit: Unit, actual_value: float) -> str:
        """Build a human-readable alert message from a rule and actual value."""
        unit_name = getattr(unit, "name", f"Unit {unit.id}")
        op_labels = {
            RuleOperator.LT: "below",
            RuleOperator.LTE: "at or below",
            RuleOperator.GT: "above",
            RuleOperator.GTE: "at or above",
            RuleOperator.EQ: "equal to",
            RuleOperator.NEQ: "not equal to",
        }
        op_label = op_labels.get(RuleOperator(rule.operator), str(rule.operator))
        return (
            f"{rule.name}: {unit_name} — {rule.metric} is {op_label} threshold. "
            f"Actual: {actual_value:.2f}, Threshold: {rule.threshold_value:.2f}"
        )

    @staticmethod
    async def check_supply_thresholds(
        db: AsyncSession,
        units: List[Unit],
        rule: AlertRule,
    ) -> List[Alert]:
        """Check supply days-of-supply (DOS) against rule threshold."""
        alerts: List[Alert] = []
        unit_ids = [u.id for u in units]
        unit_map = {u.id: u for u in units}

        result = await db.execute(
            select(SupplyStatusRecord).where(SupplyStatusRecord.unit_id.in_(unit_ids))
        )
        records = result.scalars().all()

        for record in records:
            actual = record.dos
            if actual is not None and AlertEngine._compare_value(
                actual, rule.operator, rule.threshold_value
            ):
                unit = unit_map.get(record.unit_id)
                if unit:
                    alert = await AlertEngine.fire_alert(
                        db,
                        rule,
                        unit,
                        actual,
                        entity_type=AlertEntityType.SUPPLY,
                        entity_id=record.id,
                    )
                    alerts.append(alert)

        return alerts

    @staticmethod
    async def check_equipment_readiness(
        db: AsyncSession,
        units: List[Unit],
        rule: AlertRule,
    ) -> List[Alert]:
        """Check equipment MC rate (readiness_pct) against rule threshold."""
        alerts: List[Alert] = []
        unit_ids = [u.id for u in units]
        unit_map = {u.id: u for u in units}

        result = await db.execute(
            select(EquipmentStatus).where(EquipmentStatus.unit_id.in_(unit_ids))
        )
        records = result.scalars().all()

        for record in records:
            # Use the pre-computed readiness_pct field
            actual = record.readiness_pct
            if actual is not None and AlertEngine._compare_value(
                actual, rule.operator, rule.threshold_value
            ):
                unit = unit_map.get(record.unit_id)
                if unit:
                    alert = await AlertEngine.fire_alert(
                        db,
                        rule,
                        unit,
                        actual,
                        entity_type=AlertEntityType.EQUIPMENT,
                        entity_id=record.id,
                    )
                    alerts.append(alert)

        return alerts

    @staticmethod
    async def check_personnel_thresholds(
        db: AsyncSession,
        units: List[Unit],
        rule: AlertRule,
    ) -> List[Alert]:
        """Check personnel strength percentage against rule threshold.

        Calculates present strength as: (ACTIVE count / total count) * 100
        for each unit.
        """
        alerts: List[Alert] = []
        unit_ids = [u.id for u in units]
        unit_map = {u.id: u for u in units}

        for uid in unit_ids:
            # Count total personnel in unit
            total_result = await db.execute(
                select(func.count(Personnel.id)).where(Personnel.unit_id == uid)
            )
            total = total_result.scalar() or 0

            if total == 0:
                continue

            # Count ACTIVE personnel
            active_result = await db.execute(
                select(func.count(Personnel.id)).where(
                    Personnel.unit_id == uid,
                    Personnel.status == PersonnelStatus.ACTIVE,
                )
            )
            active = active_result.scalar() or 0

            strength_pct = (active / total) * 100.0

            if AlertEngine._compare_value(
                strength_pct, rule.operator, rule.threshold_value
            ):
                unit = unit_map.get(uid)
                if unit:
                    alert = await AlertEngine.fire_alert(
                        db,
                        rule,
                        unit,
                        strength_pct,
                        entity_type=AlertEntityType.PERSONNEL,
                    )
                    alerts.append(alert)

        return alerts
