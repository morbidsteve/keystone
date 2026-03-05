"""Rule engine for evaluating alert rules and generating alerts."""

import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert, AlertRule
from app.models.unit import Unit

logger = logging.getLogger(__name__)


class RuleEngine:
    """Evaluate alert rules against current data and generate alerts."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def evaluate_all_rules(self) -> List[Alert]:
        """Evaluate all enabled rules. Returns list of generated alerts."""
        result = await self.db.execute(
            select(AlertRule).where(AlertRule.is_active.is_(True))
        )
        rules = result.scalars().all()
        all_alerts: List[Alert] = []

        for rule in rules:
            if rule.last_fired_at:
                cooldown_expiry = rule.last_fired_at + timedelta(
                    minutes=rule.cooldown_minutes
                )
                if datetime.now(timezone.utc) < cooldown_expiry:
                    continue

            try:
                alerts = await self.evaluate_rule(rule.id)
                all_alerts.extend(alerts)
            except Exception as e:
                logger.error(f"Error evaluating rule {rule.id}: {e}")

        return all_alerts

    async def evaluate_rule(self, rule_id: int) -> List[Alert]:
        """Evaluate a single rule and return generated alerts."""
        rule = await self.db.get(AlertRule, rule_id)
        if not rule:
            return []

        target_units = await self._get_target_units(rule)
        alerts_generated: List[Alert] = []

        for unit in target_units:
            metric_value = await self._get_metric_value(rule, unit)
            if metric_value is None:
                continue

            if self._check_condition(
                rule.operator.value, metric_value, rule.threshold_value
            ):
                alert = Alert(
                    rule_id=rule.id,
                    alert_type=rule.alert_type,
                    severity=rule.severity,
                    unit_id=unit.id,
                    message=self._format_message(rule, unit, metric_value),
                    threshold_value=rule.threshold_value,
                    actual_value=metric_value,
                    metric_value=metric_value,
                    auto_generated=True,
                )
                self.db.add(alert)
                alerts_generated.append(alert)

        if alerts_generated:
            rule.last_fired_at = datetime.now(timezone.utc)
            await self.db.flush()

            if rule.auto_recommend and rule.recommend_type:
                try:
                    from app.services.prediction_engine import PredictionEngine

                    engine = PredictionEngine(self.db)
                    for alert in alerts_generated:
                        await engine.generate_recommendation(rule, alert)
                except Exception as e:
                    logger.error(
                        f"Failed to generate recommendation for rule {rule.id}: {e}"
                    )

        return alerts_generated

    async def _get_target_units(self, rule: AlertRule) -> List[Unit]:
        """Resolve which units the rule applies to."""
        scope = rule.scope_type or (
            "ANY_UNIT" if rule.is_scope_all else "SPECIFIC_UNIT"
        )

        if scope == "ANY_UNIT":
            result = await self.db.execute(select(Unit))
            return list(result.scalars().all())

        elif scope == "SPECIFIC_UNIT":
            uid = rule.scope_unit_id
            if not uid:
                return []
            unit = await self.db.get(Unit, uid)
            return [unit] if unit else []

        elif scope == "ECHELON":
            if not rule.scope_echelon:
                return []
            result = await self.db.execute(
                select(Unit).where(Unit.echelon == rule.scope_echelon)
            )
            return list(result.scalars().all())

        elif scope == "SUBORDINATES":
            uid = rule.scope_unit_id
            if not uid:
                return []
            parent = await self.db.get(Unit, uid)
            if not parent:
                return []
            subs = await self._get_subordinate_units(uid)
            return [parent] + subs

        return []

    async def _get_subordinate_units(self, parent_id: int) -> List[Unit]:
        """Recursively get all subordinate units."""
        result = await self.db.execute(select(Unit).where(Unit.parent_id == parent_id))
        children = list(result.scalars().all())
        all_subs = list(children)
        for child in children:
            all_subs.extend(await self._get_subordinate_units(child.id))
        return all_subs

    async def _get_metric_value(self, rule: AlertRule, unit: Unit) -> Optional[float]:
        """Query the database for the metric value."""
        metric = rule.metric_type or rule.metric

        if metric in ("DOS", "supply_dos"):
            from app.models.supply import SupplyStatusRecord

            query = select(SupplyStatusRecord).where(
                SupplyStatusRecord.unit_id == unit.id
            )
            if (
                rule.metric_item_filter
                and isinstance(rule.metric_item_filter, dict)
                and "supply_class" in rule.metric_item_filter
            ):
                query = query.where(
                    SupplyStatusRecord.supply_class
                    == rule.metric_item_filter["supply_class"]
                )
            result = await self.db.execute(query)
            records = result.scalars().all()
            if not records:
                return None
            return sum(r.dos for r in records) / len(records)

        elif metric in ("READINESS_PCT", "equipment_readiness_pct"):
            from app.models.equipment import EquipmentStatus

            query = select(EquipmentStatus).where(EquipmentStatus.unit_id == unit.id)
            result = await self.db.execute(query)
            records = result.scalars().all()
            if not records:
                return None
            total = sum(r.total_possessed for r in records)
            mc = sum(r.mission_capable for r in records)
            return (mc / total * 100) if total > 0 else 0.0

        elif metric in ("FILL_RATE", "personnel_strength_pct"):
            from app.models.unit_strength import UnitStrength

            result = await self.db.execute(
                select(UnitStrength)
                .where(UnitStrength.unit_id == unit.id)
                .order_by(UnitStrength.reported_at.desc())
                .limit(1)
            )
            strength = result.scalar_one_or_none()
            return strength.fill_pct if strength else None

        elif metric in ("MAINTENANCE_BACKLOG",):
            from app.models.maintenance import MaintenanceWorkOrder

            result = await self.db.execute(
                select(func.count(MaintenanceWorkOrder.id)).where(
                    MaintenanceWorkOrder.unit_id == unit.id,
                    MaintenanceWorkOrder.status == "OPEN",
                )
            )
            return float(result.scalar() or 0)

        elif metric in ("FUEL_LEVEL", "fuel_level_pct"):
            try:
                from app.models.fuel import FuelStorage

                result = await self.db.execute(
                    select(FuelStorage).where(FuelStorage.unit_id == unit.id)
                )
                storage = result.scalar_one_or_none()
                if not storage or not storage.capacity_gallons:
                    return None
                return storage.current_gallons / storage.capacity_gallons * 100
            except Exception:
                return None

        return None

    @staticmethod
    def _check_condition(operator: str, actual: float, threshold: float) -> bool:
        """Check if operator(actual, threshold) is true."""
        ops = {
            "LT": lambda a, t: a < t,
            "LTE": lambda a, t: a <= t,
            "GT": lambda a, t: a > t,
            "GTE": lambda a, t: a >= t,
            "EQ": lambda a, t: a == t,
            "NEQ": lambda a, t: a != t,
        }
        fn = ops.get(operator)
        return fn(actual, threshold) if fn else False

    @staticmethod
    def _format_message(rule: AlertRule, unit: Unit, metric_value: float) -> str:
        """Format a human-readable alert message."""
        metric_name = rule.metric_type or rule.metric
        op_symbols = {
            "LT": "<",
            "LTE": "<=",
            "GT": ">",
            "GTE": ">=",
            "EQ": "=",
            "NEQ": "!=",
        }
        op = op_symbols.get(rule.operator.value, rule.operator.value)
        return (
            f"[{rule.name}] {unit.name}: {metric_name} = "
            f"{metric_value:.1f} (threshold {op} {rule.threshold_value})"
        )
