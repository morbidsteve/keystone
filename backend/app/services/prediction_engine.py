"""Prediction engine for generating logistics recommendations."""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.alert import Alert, AlertRule
from app.models.prediction import LogisticsRecommendation
from app.models.unit import Unit

logger = logging.getLogger(__name__)


class PredictionEngine:
    """Generate automated logistics recommendations from alert rules."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_recommendation(
        self, rule: AlertRule, alert: Alert
    ) -> Optional[LogisticsRecommendation]:
        """Generate a recommendation when a rule with auto_recommend fires."""
        if not rule.auto_recommend or not rule.recommend_type:
            return None

        target_unit = await self.db.get(Unit, alert.unit_id)
        if not target_unit:
            return None

        rec_type = rule.recommend_type
        metric_desc = (
            f"{rule.metric_type or rule.metric} "
            f"{rule.operator.value} {rule.threshold_value} "
            f"at {target_unit.name}"
        )

        if rec_type == "RESUPPLY":
            rec = await self._build_resupply(rule, target_unit, metric_desc)
        elif rec_type == "MAINTENANCE":
            rec = await self._build_maintenance(rule, target_unit, metric_desc)
        elif rec_type == "FUEL_DELIVERY":
            rec = await self._build_fuel(rule, target_unit, metric_desc)
        elif rec_type == "PERSONNEL_MOVE":
            rec = await self._build_personnel(rule, target_unit, metric_desc)
        else:
            return None

        if rec:
            self.db.add(rec)
            await self.db.flush()
            logger.info(
                f"Generated {rec_type} recommendation {rec.id} for alert rule {rule.id}"
            )

        return rec

    async def _build_resupply(
        self, rule: AlertRule, unit: Unit, metric_desc: str
    ) -> LogisticsRecommendation:
        """Build a resupply recommendation."""
        source_name = "ASP Central"
        if rule.recommend_source_unit_id:
            source = await self.db.get(Unit, rule.recommend_source_unit_id)
            if source:
                source_name = source.name

        return LogisticsRecommendation(
            recommendation_type="RESUPPLY",
            triggered_by_rule_id=rule.id,
            triggered_by_metric=metric_desc,
            target_unit_id=unit.id,
            description=f"Resupply {unit.name} from {source_name}",
            recommended_source=source_name,
            recommended_items=[
                {
                    "item_name": "Supply shortfall items",
                    "quantity": 0,
                    "priority": "HIGH",
                }
            ],
            status="PENDING",
            assigned_to_role=rule.recommend_assign_to_role or "S4",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=24),
        )

    async def _build_maintenance(
        self, rule: AlertRule, unit: Unit, metric_desc: str
    ) -> LogisticsRecommendation:
        """Build a maintenance recommendation."""
        return LogisticsRecommendation(
            recommendation_type="MAINTENANCE",
            triggered_by_rule_id=rule.id,
            triggered_by_metric=metric_desc,
            target_unit_id=unit.id,
            description=f"Address maintenance backlog at {unit.name}",
            recommended_items=[{"category": "Open work orders", "count": 0}],
            status="PENDING",
            assigned_to_role=rule.recommend_assign_to_role or "CO",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )

    async def _build_fuel(
        self, rule: AlertRule, unit: Unit, metric_desc: str
    ) -> LogisticsRecommendation:
        """Build a fuel delivery recommendation."""
        source_name = "DLA DFSP"
        if rule.recommend_source_unit_id:
            source = await self.db.get(Unit, rule.recommend_source_unit_id)
            if source:
                source_name = source.name

        return LogisticsRecommendation(
            recommendation_type="FUEL_DELIVERY",
            triggered_by_rule_id=rule.id,
            triggered_by_metric=metric_desc,
            target_unit_id=unit.id,
            description=f"Deliver fuel to {unit.name} from {source_name}",
            recommended_source=source_name,
            recommended_items=[{"fuel_type": "JP-8", "quantity": 0, "unit": "gallons"}],
            status="PENDING",
            assigned_to_role=rule.recommend_assign_to_role or "S4",
            expires_at=datetime.now(timezone.utc) + timedelta(hours=12),
        )

    async def _build_personnel(
        self, rule: AlertRule, unit: Unit, metric_desc: str
    ) -> LogisticsRecommendation:
        """Build a personnel movement recommendation."""
        return LogisticsRecommendation(
            recommendation_type="PERSONNEL_MOVE",
            triggered_by_rule_id=rule.id,
            triggered_by_metric=metric_desc,
            target_unit_id=unit.id,
            description=f"Fill personnel shortfalls at {unit.name}",
            recommended_items=[
                {
                    "position_count": 0,
                    "note": "MOS shortfall analysis pending",
                }
            ],
            status="PENDING",
            assigned_to_role=rule.recommend_assign_to_role or "XO",
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),
        )
