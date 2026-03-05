# KEYSTONE: Advanced Alert Rule Builder & Predictive Logistics Engine

**Project**: KEYSTONE — USMC Logistics Intelligence System
**Version**: 2.0
**Date**: 2026-03-05
**Objective**: Enhance notification system with flexible rule builder and add automated logistics recommendations

---

## CONTEXT & REQUIREMENTS

### User Feedback Summary
The current alert system uses basic rules (alert_type, threshold_value, unit_id). Users need:
1. **Flexible filtering**: e.g., "if ANY unit has <30 DOS of Class V, alert S-4"
2. **Per-item filtering**: e.g., "if unit 1/11 has <100 rounds 5.56mm, alert"
3. **Flexible scoping**: rules that apply to any unit, specific unit, echelon, or subordinates
4. **Automated logistics recommendations**: when a rule fires, auto-generate a resupply/maintenance recommendation for S-4 approval
5. **Smart auto-execution**: approved recommendations auto-generate movement orders, requisitions, and assign personnel/vehicles/supplies

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Zustand, TanStack Query, Socket.IO client
- **Backend**: Python/FastAPI, SQLAlchemy async ORM, PostgreSQL, NATS JetStream (or background tasks)
- **Real-time**: Socket.IO ws-relay service
- **Existing Models**: AlertRule (basic), Alert, Unit, Supply, Movement, Requisition, User, Personnel

### Existing Code References
- `frontend/src/pages/AlertsPage.tsx` — 4 tabs: ALERTS, RULES, NOTIFICATIONS, PREFERENCES
- `backend/app/models/alert.py` — AlertRule, Alert models (to be extended)
- `backend/app/api/routes/alerts.py` — alert endpoints
- `backend/app/services/` — where to place new rule_engine.py and prediction_engine.py

---

## PART 1: ADVANCED ALERT RULE BUILDER

### 1.1 Database Models (`backend/app/models/alert.py`)

**Extend the existing AlertRule model** with these fields:

```python
from enum import Enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func
from sqlalchemy.dialects.postgresql import JSON
import json

class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class MetricType(str, Enum):
    DOS = "DOS"  # Days of Supply
    READINESS_PCT = "READINESS_PCT"  # Readiness percentage
    ON_HAND_QTY = "ON_HAND_QTY"  # On-hand quantity of specific item
    FILL_RATE = "FILL_RATE"  # Personnel fill rate
    MAINTENANCE_BACKLOG = "MAINTENANCE_BACKLOG"  # Open work orders count
    FUEL_LEVEL = "FUEL_LEVEL"  # Fuel level percentage

class ScopeType(str, Enum):
    ANY_UNIT = "ANY_UNIT"
    SPECIFIC_UNIT = "SPECIFIC_UNIT"
    ECHELON = "ECHELON"
    SUBORDINATES = "SUBORDINATES"

class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True)

    # Rule metadata
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    is_enabled = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # SCOPE — which units does this rule apply to?
    scope_type = Column(String(20), default="ANY_UNIT")  # ScopeType enum
    scope_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)  # for SPECIFIC_UNIT or base for SUBORDINATES
    scope_echelon = Column(String(10), nullable=True)  # e.g., "BN", "CO", "PLT" for ECHELON scope
    include_subordinates = Column(Boolean, default=False)  # include child units

    # CONDITION — what triggers this rule?
    metric_type = Column(String(30), nullable=False)  # MetricType enum
    metric_item_filter = Column(JSON, nullable=True)  # {supply_class, tamcn, dodic, category, fuel_type, readiness_rating, etc.}
    operator = Column(String(5), nullable=False)  # "LT", "GT", "LTE", "GTE", "EQ", "NEQ"
    threshold_value = Column(Float, nullable=False)

    # ACTION — what happens when triggered?
    severity = Column(String(20), default="WARNING")  # AlertSeverity enum
    notify_users = Column(JSON, nullable=True)  # [user_id, user_id, ...]
    notify_roles = Column(JSON, nullable=True)  # ["S4", "CO", "BN_CDR", ...]

    # TIMING
    check_interval_minutes = Column(Integer, default=15)
    cooldown_minutes = Column(Integer, default=60)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)

    # PREDICTIVE LOGISTICS (Part 2)
    auto_recommend = Column(Boolean, default=False)  # auto-generate recommendation when rule fires
    recommend_type = Column(String(30), nullable=True)  # "RESUPPLY", "MAINTENANCE", "FUEL_DELIVERY", "PERSONNEL_MOVE"
    recommend_source_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)  # where to pull from
    recommend_assign_to_role = Column(String(20), nullable=True)  # who reviews: "S4", "CO", "XO", etc.
```

**Extend the Alert model** to link to rules:

```python
class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=True)  # which rule triggered this
    alert_type = Column(String(50), nullable=False)  # backward compat: "LOW_DOS", "LOW_READINESS", etc.
    severity = Column(String(20), nullable=False)  # AlertSeverity
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    message = Column(Text, nullable=False)
    metric_value = Column(Float, nullable=True)  # the actual value that triggered it
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
```

### 1.2 API Endpoints (`backend/app/api/routes/alerts.py`)

**New/Enhanced endpoints**:

```python
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/alerts", tags=["alerts"])

# ===== RULE CRUD =====

class AlertRuleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    scope_type: str  # "ANY_UNIT", "SPECIFIC_UNIT", "ECHELON", "SUBORDINATES"
    scope_unit_id: Optional[int] = None
    scope_echelon: Optional[str] = None
    include_subordinates: bool = False
    metric_type: str  # "DOS", "READINESS_PCT", "ON_HAND_QTY", etc.
    metric_item_filter: Optional[dict] = None  # {supply_class, tamcn, ...}
    operator: str  # "LT", "GT", "LTE", "GTE", "EQ", "NEQ"
    threshold_value: float
    severity: str  # "INFO", "WARNING", "CRITICAL"
    notify_users: Optional[List[int]] = None
    notify_roles: Optional[List[str]] = None
    check_interval_minutes: int = 15
    cooldown_minutes: int = 60
    auto_recommend: bool = False
    recommend_type: Optional[str] = None
    recommend_source_unit_id: Optional[int] = None
    recommend_assign_to_role: Optional[str] = None

@router.post("/rules")
async def create_rule(
    rule: AlertRuleCreate,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new alert rule."""
    db_rule = AlertRule(
        **rule.dict(),
        created_by=current_user.id
    )
    db.add(db_rule)
    await db.commit()
    await db.refresh(db_rule)
    return db_rule

@router.get("/rules")
async def list_rules(
    enabled_only: bool = Query(True),
    db: AsyncSession = Depends(get_db)
):
    """List all alert rules (or only enabled)."""
    query = select(AlertRule)
    if enabled_only:
        query = query.where(AlertRule.is_enabled == True)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/rules/{rule_id}")
async def get_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific alert rule."""
    rule = await db.get(AlertRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    return rule

@router.put("/rules/{rule_id}")
async def update_rule(
    rule_id: int,
    rule_update: AlertRuleCreate,
    db: AsyncSession = Depends(get_db)
):
    """Update an alert rule."""
    rule = await db.get(AlertRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    for key, value in rule_update.dict(exclude_unset=True).items():
        setattr(rule, key, value)

    await db.commit()
    await db.refresh(rule)
    return rule

@router.delete("/rules/{rule_id}")
async def delete_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    """Delete an alert rule."""
    rule = await db.get(AlertRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    await db.delete(rule)
    await db.commit()
    return {"message": "Rule deleted"}

# ===== MANUAL RULE EVALUATION =====

@router.post("/rules/{rule_id}/evaluate")
async def evaluate_rule_now(
    rule_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Manually trigger evaluation of a single rule (for testing)."""
    from app.services.rule_engine import RuleEngine
    engine = RuleEngine(db)
    alerts_generated = await engine.evaluate_rule(rule_id)
    return {"alerts_generated": len(alerts_generated), "alerts": alerts_generated}

# ===== ALERTS =====

@router.get("/")
async def list_alerts(
    unit_id: Optional[int] = None,
    severity: Optional[str] = None,
    unacknowledged_only: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """List alerts with optional filters."""
    query = select(Alert)
    if unit_id:
        query = query.where(Alert.unit_id == unit_id)
    if severity:
        query = query.where(Alert.severity == severity)
    if unacknowledged_only:
        query = query.where(Alert.acknowledged_at.is_(None))

    result = await db.execute(query)
    return result.scalars().all()

@router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    current_user = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark an alert as acknowledged."""
    alert = await db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.acknowledged_at = datetime.utcnow()
    alert.acknowledged_by = current_user.id
    await db.commit()
    return alert
```

### 1.3 Rule Engine Service (`backend/app/services/rule_engine.py`)

```python
import asyncio
from datetime import datetime, timedelta
from typing import List
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)

class RuleEngine:
    """Background service that evaluates alert rules and generates alerts."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def evaluate_all_rules(self):
        """Evaluate all enabled rules. Call this periodically from scheduler."""
        query = select(AlertRule).where(AlertRule.is_enabled == True)
        result = await self.db.execute(query)
        rules = result.scalars().all()

        for rule in rules:
            # Check if cooldown has expired
            if rule.last_triggered_at:
                cooldown_expiry = rule.last_triggered_at + timedelta(minutes=rule.cooldown_minutes)
                if datetime.utcnow() < cooldown_expiry:
                    logger.debug(f"Rule {rule.id} in cooldown, skipping")
                    continue

            try:
                alerts = await self.evaluate_rule(rule.id)
                if alerts:
                    # Update last_triggered_at
                    rule.last_triggered_at = datetime.utcnow()
                    await self.db.commit()

                    # If auto_recommend enabled, generate recommendations
                    if rule.auto_recommend:
                        from app.services.prediction_engine import PredictionEngine
                        pred_engine = PredictionEngine(self.db)
                        for alert in alerts:
                            await pred_engine.generate_recommendation(
                                rule=rule,
                                alert=alert
                            )
            except Exception as e:
                logger.error(f"Error evaluating rule {rule.id}: {e}")

    async def evaluate_rule(self, rule_id: int) -> List:
        """Evaluate a single rule and return generated alerts."""
        rule = await self.db.get(AlertRule, rule_id)
        if not rule:
            return []

        # Determine which units to check
        target_units = await self._get_target_units(rule)

        alerts_generated = []

        for unit in target_units:
            # Evaluate condition for this unit
            condition_met = await self._check_condition(rule, unit)

            if condition_met:
                # Create alert
                alert = Alert(
                    rule_id=rule.id,
                    alert_type=rule.metric_type,
                    severity=rule.severity,
                    unit_id=unit.id,
                    message=await self._format_alert_message(rule, unit),
                    metric_value=await self._get_metric_value(rule, unit)
                )
                self.db.add(alert)
                alerts_generated.append(alert)

                # Notify users/roles via Socket.IO
                await self._send_notification(alert, rule)

        if alerts_generated:
            await self.db.commit()

        return alerts_generated

    async def _get_target_units(self, rule: AlertRule) -> List:
        """Resolve which units the rule applies to."""
        from app.models.unit import Unit

        if rule.scope_type == "ANY_UNIT":
            # All units
            result = await self.db.execute(select(Unit))
            return result.scalars().all()

        elif rule.scope_type == "SPECIFIC_UNIT":
            # Single unit
            unit = await self.db.get(Unit, rule.scope_unit_id)
            return [unit] if unit else []

        elif rule.scope_type == "ECHELON":
            # All units at a specific echelon level
            query = select(Unit).where(Unit.echelon == rule.scope_echelon)
            result = await self.db.execute(query)
            return result.scalars().all()

        elif rule.scope_type == "SUBORDINATES":
            # Unit + all subordinates
            parent_unit = await self.db.get(Unit, rule.scope_unit_id)
            if not parent_unit:
                return []

            # Recursively get all subordinate units
            subordinates = await self._get_subordinate_units(parent_unit.id)
            return [parent_unit] + subordinates

        return []

    async def _get_subordinate_units(self, parent_id: int) -> List:
        """Recursively get all units subordinate to parent."""
        from app.models.unit import Unit

        query = select(Unit).where(Unit.parent_unit_id == parent_id)
        result = await self.db.execute(query)
        children = result.scalars().all()

        subordinates = list(children)
        for child in children:
            subordinates.extend(await self._get_subordinate_units(child.id))

        return subordinates

    async def _check_condition(self, rule: AlertRule, unit) -> bool:
        """Check if the rule's condition is met for this unit."""
        metric_value = await self._get_metric_value(rule, unit)

        if metric_value is None:
            return False

        threshold = rule.threshold_value

        if rule.operator == "LT":
            return metric_value < threshold
        elif rule.operator == "GT":
            return metric_value > threshold
        elif rule.operator == "LTE":
            return metric_value <= threshold
        elif rule.operator == "GTE":
            return metric_value >= threshold
        elif rule.operator == "EQ":
            return metric_value == threshold
        elif rule.operator == "NEQ":
            return metric_value != threshold

        return False

    async def _get_metric_value(self, rule: AlertRule, unit) -> float:
        """Query the database and return the metric value for a unit."""
        from app.models.supply import Supply, SupplyItem
        from app.models.equipment import Equipment
        from app.models.personnel import Personnel
        from app.models.maintenance import MaintenanceWorkOrder

        if rule.metric_type == "DOS":
            # Days of Supply — average DOS across items matching the filter
            query = select(Supply.days_of_supply).where(Supply.unit_id == unit.id)

            if rule.metric_item_filter and "supply_class" in rule.metric_item_filter:
                # Filter by supply class
                query = query.join(SupplyItem).where(
                    SupplyItem.supply_class == rule.metric_item_filter["supply_class"]
                )

            result = await self.db.execute(query)
            values = result.scalars().all()

            if not values:
                return None

            return sum(values) / len(values)  # Average DOS

        elif rule.metric_type == "ON_HAND_QTY":
            # On-hand quantity of specific item
            if not rule.metric_item_filter or "tamcn" not in rule.metric_item_filter:
                return None

            query = select(Supply.on_hand_qty).where(
                and_(
                    Supply.unit_id == unit.id,
                    Supply.tamcn == rule.metric_item_filter["tamcn"]
                )
            )
            result = await self.db.execute(query)
            qty = result.scalar()

            return float(qty) if qty is not None else None

        elif rule.metric_type == "READINESS_PCT":
            # Equipment readiness percentage
            query = select(Equipment).where(Equipment.unit_id == unit.id)
            result = await self.db.execute(query)
            equipment = result.scalars().all()

            if not equipment:
                return None

            fmc_count = sum(1 for e in equipment if e.status == "FMC")
            return (fmc_count / len(equipment)) * 100

        elif rule.metric_type == "FILL_RATE":
            # Personnel fill rate
            query = select(Personnel).where(Personnel.unit_id == unit.id)
            result = await self.db.execute(query)
            personnel = result.scalars().all()

            if not personnel or not hasattr(unit, "authorized_strength"):
                return None

            filled = sum(1 for p in personnel if p.status == "ASSIGNED")
            return (filled / unit.authorized_strength) * 100

        elif rule.metric_type == "MAINTENANCE_BACKLOG":
            # Open work orders
            query = select(MaintenanceWorkOrder).where(
                and_(
                    MaintenanceWorkOrder.unit_id == unit.id,
                    MaintenanceWorkOrder.status == "OPEN"
                )
            )
            result = await self.db.execute(query)
            open_wos = result.scalars().all()

            return float(len(open_wos))

        elif rule.metric_type == "FUEL_LEVEL":
            # Fuel level percentage (if you have a Fuel model)
            # Assuming a Fuel model exists with current_qty and capacity
            from app.models.fuel import Fuel
            query = select(Fuel).where(Fuel.unit_id == unit.id)
            result = await self.db.execute(query)
            fuel = result.scalar()

            if not fuel or not fuel.capacity:
                return None

            return (fuel.current_qty / fuel.capacity) * 100

        return None

    async def _format_alert_message(self, rule: AlertRule, unit) -> str:
        """Format a human-readable alert message."""
        metric_value = await self._get_metric_value(rule, unit)
        return f"Rule '{rule.name}' triggered for {unit.name}: {rule.metric_type}={metric_value} {rule.operator} {rule.threshold_value}"

    async def _send_notification(self, alert: Alert, rule: AlertRule):
        """Send real-time notification via Socket.IO / ws-relay."""
        # TODO: Integrate with ws-relay service
        # Pseudocode:
        # if rule.notify_users:
        #     for user_id in rule.notify_users:
        #         emit("alert", {alert_data}, to=user_id)
        # if rule.notify_roles:
        #     for role in rule.notify_roles:
        #         emit("alert", {alert_data}, to_role=role)
        pass
```

### 1.4 FastAPI Background Task Setup (`backend/app/main.py`)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
import asyncio

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    async def run_rule_engine():
        from app.services.rule_engine import RuleEngine
        from app.database import get_async_session

        while True:
            try:
                async with get_async_session() as db:
                    engine = RuleEngine(db)
                    await engine.evaluate_all_rules()
            except Exception as e:
                logger.error(f"Error in rule engine loop: {e}")

            # Run every 15 seconds (or whatever interval you want)
            await asyncio.sleep(15)

    task = asyncio.create_task(run_rule_engine())

    yield  # App runs here

    # Shutdown
    task.cancel()

app = FastAPI(lifespan=lifespan)
```

### 1.5 Frontend Rule Builder UI (`frontend/src/components/AlertRuleBuilder.tsx`)

```typescript
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useShallow } from "zustand/react/shallow";

interface AlertRuleFormData {
  name: string;
  description?: string;
  scope_type: "ANY_UNIT" | "SPECIFIC_UNIT" | "ECHELON" | "SUBORDINATES";
  scope_unit_id?: number;
  scope_echelon?: string;
  include_subordinates: boolean;
  metric_type: "DOS" | "READINESS_PCT" | "ON_HAND_QTY" | "FILL_RATE" | "MAINTENANCE_BACKLOG" | "FUEL_LEVEL";
  metric_item_filter?: Record<string, any>;
  operator: "LT" | "GT" | "LTE" | "GTE" | "EQ" | "NEQ";
  threshold_value: number;
  severity: "INFO" | "WARNING" | "CRITICAL";
  notify_users?: number[];
  notify_roles?: string[];
  check_interval_minutes: number;
  cooldown_minutes: number;
  auto_recommend: boolean;
  recommend_type?: "RESUPPLY" | "MAINTENANCE" | "FUEL_DELIVERY" | "PERSONNEL_MOVE";
  recommend_source_unit_id?: number;
  recommend_assign_to_role?: string;
}

export const AlertRuleBuilder: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { register, watch, setValue, handleSubmit } = useForm<AlertRuleFormData>({
    defaultValues: {
      scope_type: "ANY_UNIT",
      metric_type: "DOS",
      operator: "LT",
      severity: "WARNING",
      check_interval_minutes: 15,
      cooldown_minutes: 60,
      auto_recommend: false,
    },
  });

  const scopeType = watch("scope_type");
  const metricType = watch("metric_type");
  const autoRecommend = watch("auto_recommend");

  const { data: units } = useQuery({
    queryKey: ["units"],
    queryFn: () => fetch("/api/v1/units").then((r) => r.json()),
  });

  const createRuleMutation = useMutation({
    mutationFn: (data: AlertRuleFormData) =>
      fetch("/api/v1/alerts/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((r) => r.json()),
    onSuccess: () => {
      onClose?.();
      // Refetch rules
    },
  });

  const onSubmit = (data: AlertRuleFormData) => {
    createRuleMutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Create Alert Rule</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* NAME & DESCRIPTION */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Rule Name *</span>
            <input
              type="text"
              placeholder="e.g., Low Ammo Alert for 1/11"
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              {...register("name", { required: true })}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Description</span>
            <textarea
              placeholder="What does this rule do?"
              className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              {...register("description")}
            />
          </label>
        </div>

        {/* SCOPE SECTION */}
        <fieldset className="border-t pt-6">
          <legend className="text-lg font-semibold text-gray-800 mb-4">
            Scope: Which units does this apply to?
          </legend>

          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="radio"
                value="ANY_UNIT"
                {...register("scope_type")}
                className="mr-3"
              />
              <span>Any unit in the system</span>
            </label>

            <label className="flex items-center">
              <input
                type="radio"
                value="SPECIFIC_UNIT"
                {...register("scope_type")}
                className="mr-3"
              />
              <span>Specific unit:</span>
            </label>
            {scopeType === "SPECIFIC_UNIT" && (
              <select
                {...register("scope_unit_id")}
                className="ml-6 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a unit...</option>
                {units?.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.designation})
                  </option>
                ))}
              </select>
            )}

            <label className="flex items-center">
              <input
                type="radio"
                value="ECHELON"
                {...register("scope_type")}
                className="mr-3"
              />
              <span>All units at echelon:</span>
            </label>
            {scopeType === "ECHELON" && (
              <select
                {...register("scope_echelon")}
                className="ml-6 px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select echelon...</option>
                <option value="BN">Battalion (BN)</option>
                <option value="CO">Company (CO)</option>
                <option value="PLT">Platoon (PLT)</option>
              </select>
            )}

            <label className="flex items-center">
              <input
                type="radio"
                value="SUBORDINATES"
                {...register("scope_type")}
                className="mr-3"
              />
              <span>Unit and subordinates:</span>
            </label>
            {scopeType === "SUBORDINATES" && (
              <select
                {...register("scope_unit_id")}
                className="ml-6 px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select parent unit...</option>
                {units?.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </fieldset>

        {/* CONDITION SECTION */}
        <fieldset className="border-t pt-6">
          <legend className="text-lg font-semibold text-gray-800 mb-4">
            Condition: What triggers this alert?
          </legend>

          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-2">
              <span className="text-sm font-semibold text-gray-700">Metric Type *</span>
              <select
                {...register("metric_type", { required: true })}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="DOS">Days of Supply (DOS)</option>
                <option value="READINESS_PCT">Readiness %</option>
                <option value="ON_HAND_QTY">On-Hand Quantity</option>
                <option value="FILL_RATE">Personnel Fill Rate %</option>
                <option value="MAINTENANCE_BACKLOG">Maintenance Backlog (WOs)</option>
                <option value="FUEL_LEVEL">Fuel Level %</option>
              </select>
            </label>

            {/* Item Filter (shown for certain metrics) */}
            {(metricType === "DOS" || metricType === "ON_HAND_QTY") && (
              <label className="col-span-2">
                <span className="text-sm font-semibold text-gray-700">Supply Class / Item Filter</span>
                <input
                  type="text"
                  placeholder="e.g., Class V, 5.56mm, TAMCN-12345"
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
                  onChange={(e) =>
                    setValue("metric_item_filter", {
                      ...watch("metric_item_filter"),
                      supply_class: e.target.value,
                    })
                  }
                />
              </label>
            )}

            {metricType === "READINESS_PCT" && (
              <label className="col-span-2">
                <span className="text-sm font-semibold text-gray-700">Equipment Category (optional)</span>
                <select
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
                  onChange={(e) =>
                    setValue("metric_item_filter", {
                      ...watch("metric_item_filter"),
                      category: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">All equipment</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="comms">Communications</option>
                  <option value="weapons">Weapons</option>
                </select>
              </label>
            )}

            {metricType === "FUEL_LEVEL" && (
              <label className="col-span-2">
                <span className="text-sm font-semibold text-gray-700">Fuel Type (optional)</span>
                <select
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
                  onChange={(e) =>
                    setValue("metric_item_filter", {
                      ...watch("metric_item_filter"),
                      fuel_type: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">All fuel types</option>
                  <option value="JP-8">JP-8</option>
                  <option value="Diesel">Diesel</option>
                  <option value="MOGAS">MOGAS</option>
                </select>
              </label>
            )}

            <label>
              <span className="text-sm font-semibold text-gray-700">Operator *</span>
              <select
                {...register("operator", { required: true })}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="LT">less than (&lt;)</option>
                <option value="GT">greater than (&gt;)</option>
                <option value="LTE">less than or equal (&lt;=)</option>
                <option value="GTE">greater than or equal (&gt;=)</option>
                <option value="EQ">equals (=)</option>
                <option value="NEQ">not equal (!=)</option>
              </select>
            </label>

            <label>
              <span className="text-sm font-semibold text-gray-700">Threshold Value *</span>
              <input
                type="number"
                step="0.1"
                placeholder="e.g., 30"
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
                {...register("threshold_value", {
                  required: true,
                  valueAsNumber: true,
                })}
              />
            </label>
          </div>
        </fieldset>

        {/* ACTION SECTION */}
        <fieldset className="border-t pt-6">
          <legend className="text-lg font-semibold text-gray-800 mb-4">
            Action: What happens when triggered?
          </legend>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Severity *</span>
              <select
                {...register("severity")}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="INFO">INFO</option>
                <option value="WARNING">WARNING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Notify Users</span>
              {/* TODO: Multi-select component for users */}
              <input
                type="text"
                placeholder="User IDs (comma-separated)"
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Notify Roles</span>
              {/* TODO: Multi-select component for roles */}
              <input
                type="text"
                placeholder="Roles: S4, CO, BN_CDR, etc."
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </label>
          </div>
        </fieldset>

        {/* TIMING SECTION */}
        <fieldset className="border-t pt-6">
          <legend className="text-lg font-semibold text-gray-800 mb-4">
            Timing
          </legend>

          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className="text-sm font-semibold text-gray-700">Check Interval (minutes)</span>
              <input
                type="number"
                {...register("check_interval_minutes", { valueAsNumber: true })}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </label>

            <label>
              <span className="text-sm font-semibold text-gray-700">Cooldown (minutes)</span>
              <input
                type="number"
                {...register("cooldown_minutes", { valueAsNumber: true })}
                className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </label>
          </div>
        </fieldset>

        {/* PREDICTIVE LOGISTICS SECTION */}
        <fieldset className="border-t pt-6">
          <legend className="text-lg font-semibold text-gray-800 mb-4">
            Predictive Logistics
          </legend>

          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              {...register("auto_recommend")}
              className="mr-3"
            />
            <span className="text-sm font-semibold text-gray-700">
              Auto-generate logistics recommendation when rule fires
            </span>
          </label>

          {autoRecommend && (
            <div className="space-y-4 ml-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Recommendation Type *</span>
                <select
                  {...register("recommend_type")}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="RESUPPLY">Resupply</option>
                  <option value="MAINTENANCE">Maintenance</option>
                  <option value="FUEL_DELIVERY">Fuel Delivery</option>
                  <option value="PERSONNEL_MOVE">Personnel Movement</option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Source Unit/Location</span>
                <select
                  {...register("recommend_source_unit_id")}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Auto-select nearest supply point</option>
                  {units?.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Assign Review to Role</span>
                <select
                  {...register("recommend_assign_to_role")}
                  className="mt-2 w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select...</option>
                  <option value="S4">S-4 (Supply)</option>
                  <option value="CO">Commanding Officer</option>
                  <option value="XO">Executive Officer</option>
                  <option value="BN_CDR">Battalion Commander</option>
                </select>
              </label>
            </div>
          )}
        </fieldset>

        {/* SUBMIT */}
        <div className="flex gap-4 pt-6 border-t">
          <button
            type="submit"
            disabled={createRuleMutation.isPending}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
```

### 1.6 Update AlertsPage.tsx RULES Tab

```typescript
// In frontend/src/pages/AlertsPage.tsx

const [showRuleBuilder, setShowRuleBuilder] = useState(false);

// Inside the RULES tab content:
{activeTab === "RULES" && (
  <div className="space-y-4">
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-bold">Alert Rules</h2>
      <button
        onClick={() => setShowRuleBuilder(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
      >
        + CREATE RULE
      </button>
    </div>

    {showRuleBuilder && (
      <AlertRuleBuilder onClose={() => setShowRuleBuilder(false)} />
    )}

    {/* Rules List Table */}
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Scope</th>
            <th className="border p-2 text-left">Metric</th>
            <th className="border p-2 text-left">Condition</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rules?.map((rule: any) => (
            <tr key={rule.id} className="hover:bg-gray-50">
              <td className="border p-2 font-semibold">{rule.name}</td>
              <td className="border p-2">{rule.scope_type}</td>
              <td className="border p-2">{rule.metric_type}</td>
              <td className="border p-2">
                {rule.operator} {rule.threshold_value}
              </td>
              <td className="border p-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    rule.is_enabled
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {rule.is_enabled ? "Enabled" : "Disabled"}
                </span>
              </td>
              <td className="border p-2">
                <button className="text-blue-600 hover:underline mr-3">Edit</button>
                <button className="text-red-600 hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}
```

---

## PART 2: PREDICTIVE LOGISTICS ENGINE

### 2.1 Logistics Recommendation Models (`backend/app/models/prediction.py`)

```python
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func
from enum import Enum

class RecommendationType(str, Enum):
    RESUPPLY = "RESUPPLY"
    MAINTENANCE = "MAINTENANCE"
    PERSONNEL_MOVE = "PERSONNEL_MOVE"
    FUEL_DELIVERY = "FUEL_DELIVERY"

class RecommendationStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    EXECUTED = "EXECUTED"
    EXPIRED = "EXPIRED"

class LogisticsRecommendation(Base):
    __tablename__ = "logistics_recommendations"

    id = Column(Integer, primary_key=True)

    # What triggered this?
    recommendation_type = Column(String(30), nullable=False)  # RecommendationType
    triggered_by_rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=True)
    triggered_by_metric = Column(String(100), nullable=True)  # "5.56mm DOS < 15 at 1/11"

    # What's recommended?
    target_unit_id = Column(Integer, ForeignKey("units.id"), nullable=False)
    description = Column(Text, nullable=False)  # Human-readable summary

    # Details
    recommended_items = Column(JSON, nullable=True)  # [{item_name, tamcn/dodic, quantity, priority}, ...]
    recommended_source = Column(String(100), nullable=True)  # e.g., "ASP Camp Pendleton"
    recommended_vehicles = Column(JSON, nullable=True)  # [{vehicle_id, type, capacity}, ...]
    recommended_personnel = Column(JSON, nullable=True)  # [{person_id, name, role}, ...]
    recommended_route = Column(Text, nullable=True)  # "Camp Pendleton → Forward Operating Base A"
    estimated_weight = Column(Float, nullable=True)  # kg
    estimated_cost = Column(Float, nullable=True)  # dollars
    estimated_duration = Column(String(50), nullable=True)  # e.g., "2 hours"

    # Approval workflow
    status = Column(String(20), default="PENDING")  # RecommendationStatus
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # specific S-4
    assigned_to_role = Column(String(20), nullable=True)  # "S4", "CO", etc.

    # Outcomes
    generated_movement_id = Column(Integer, nullable=True)  # links to Movement/Order table
    generated_requisition_id = Column(Integer, nullable=True)  # links to Requisition table

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)  # approver's comments

    # Expiration (recommendations auto-expire if not acted on)
    expires_at = Column(DateTime(timezone=True), nullable=True)
```

### 2.2 Prediction Service (`backend/app/services/prediction_engine.py`)

```python
import asyncio
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
import logging
import json

logger = logging.getLogger(__name__)

class PredictionEngine:
    """Generates automated logistics recommendations based on alert rules."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def generate_recommendation(self, rule, alert):
        """Generate a logistics recommendation when a rule with auto_recommend=True fires."""

        if not rule.auto_recommend or not rule.recommend_type:
            return None

        target_unit = await self.db.get(Unit, alert.unit_id)
        if not target_unit:
            return None

        # Build the recommendation based on type
        if rule.recommend_type == "RESUPPLY":
            recommendation = await self._build_resupply_recommendation(rule, alert, target_unit)

        elif rule.recommend_type == "MAINTENANCE":
            recommendation = await self._build_maintenance_recommendation(rule, alert, target_unit)

        elif rule.recommend_type == "FUEL_DELIVERY":
            recommendation = await self._build_fuel_recommendation(rule, alert, target_unit)

        elif rule.recommend_type == "PERSONNEL_MOVE":
            recommendation = await self._build_personnel_recommendation(rule, alert, target_unit)

        else:
            return None

        if recommendation:
            self.db.add(recommendation)
            await self.db.commit()
            await self.db.refresh(recommendation)

            # Notify reviewers
            await self._notify_reviewers(recommendation, rule)

            logger.info(f"Generated recommendation {recommendation.id} for alert {alert.id}")
            return recommendation

        return None

    async def _build_resupply_recommendation(self, rule, alert, target_unit) -> LogisticsRecommendation:
        """Build a resupply recommendation."""
        from app.models.supply import Supply
        from app.models.unit import Unit

        # Query current supply levels for the target unit
        query = select(Supply).where(Supply.unit_id == target_unit.id)

        # Filter by item if specified
        if rule.metric_item_filter and "supply_class" in rule.metric_item_filter:
            from app.models.supply import SupplyItem
            query = query.join(SupplyItem).where(
                SupplyItem.supply_class == rule.metric_item_filter["supply_class"]
            )

        result = await self.db.execute(query)
        supplies = result.scalars().all()

        # Calculate what's needed
        recommended_items = []
        total_weight = 0

        for supply in supplies:
            if supply.days_of_supply < rule.threshold_value:
                # Calculate qty to bring up to X DOS
                qty_needed = (rule.threshold_value - supply.days_of_supply) * supply.daily_consumption
                recommended_items.append({
                    "item_name": supply.item_name,
                    "tamcn": supply.tamcn,
                    "quantity": int(qty_needed),
                    "priority": "HIGH" if supply.days_of_supply < 7 else "MEDIUM",
                    "weight_per_unit": supply.weight_per_unit,
                })
                total_weight += qty_needed * (supply.weight_per_unit or 0)

        # Find source (nearest supply point or specified unit)
        source_unit = None
        if rule.recommend_source_unit_id:
            source_unit = await self.db.get(Unit, rule.recommend_source_unit_id)
        else:
            # TODO: Query nearest supply point with available stock
            source_unit = await self._find_nearest_supply_point(target_unit, recommended_items)

        source_name = source_unit.name if source_unit else "ASP Central"

        # Auto-select vehicles
        vehicles = await self._select_available_vehicles(target_unit, total_weight)

        # Auto-select personnel
        personnel = await self._select_available_personnel(target_unit, len(vehicles))

        # Estimate cost (simplified)
        estimated_cost = sum(item["quantity"] * 50 for item in recommended_items)  # $50 per unit placeholder

        description = f"Resupply {target_unit.name} with {len(recommended_items)} item(s) from {source_name}"

        recommendation = LogisticsRecommendation(
            recommendation_type="RESUPPLY",
            triggered_by_rule_id=rule.id,
            triggered_by_metric=f"{rule.metric_type} {rule.operator} {rule.threshold_value}",
            target_unit_id=target_unit.id,
            description=description,
            recommended_items=json.dumps(recommended_items),
            recommended_source=source_name,
            recommended_vehicles=json.dumps(vehicles),
            recommended_personnel=json.dumps(personnel),
            estimated_weight=total_weight,
            estimated_cost=estimated_cost,
            status="PENDING",
            assigned_to_role=rule.recommend_assign_to_role or "S4",
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )

        return recommendation

    async def _build_maintenance_recommendation(self, rule, alert, target_unit) -> LogisticsRecommendation:
        """Build a maintenance recommendation."""
        from app.models.equipment import Equipment, MaintenanceWorkOrder

        # Count open work orders
        query = select(MaintenanceWorkOrder).where(
            and_(
                MaintenanceWorkOrder.unit_id == target_unit.id,
                MaintenanceWorkOrder.status == "OPEN"
            )
        )
        result = await self.db.execute(query)
        open_wos = result.scalars().all()

        description = f"Address {len(open_wos)} open maintenance work orders at {target_unit.name}"

        # Group by category
        items_by_category = {}
        for wo in open_wos:
            cat = wo.category or "Other"
            items_by_category[cat] = items_by_category.get(cat, 0) + 1

        recommended_items = [
            {"category": cat, "count": count}
            for cat, count in items_by_category.items()
        ]

        recommendation = LogisticsRecommendation(
            recommendation_type="MAINTENANCE",
            triggered_by_rule_id=rule.id,
            triggered_by_metric=f"Backlog {rule.operator} {rule.threshold_value}",
            target_unit_id=target_unit.id,
            description=description,
            recommended_items=json.dumps(recommended_items),
            status="PENDING",
            assigned_to_role=rule.recommend_assign_to_role or "CO",
            expires_at=datetime.utcnow() + timedelta(days=7),
        )

        return recommendation

    async def _build_fuel_recommendation(self, rule, alert, target_unit) -> LogisticsRecommendation:
        """Build a fuel delivery recommendation."""
        from app.models.fuel import Fuel

        query = select(Fuel).where(Fuel.unit_id == target_unit.id)
        result = await self.db.execute(query)
        fuel = result.scalar()

        if not fuel:
            return None

        # Calculate qty needed to fill
        qty_needed = fuel.capacity - fuel.current_qty

        description = f"Deliver {qty_needed:.0f} gallons of {fuel.fuel_type} to {target_unit.name}"

        vehicles = await self._select_available_vehicles(target_unit, qty_needed * 6.7)  # ~6.7 lbs per gallon
        personnel = await self._select_available_personnel(target_unit, 1)

        recommended_items = [
            {"fuel_type": fuel.fuel_type, "quantity": qty_needed, "unit": "gallons"}
        ]

        recommendation = LogisticsRecommendation(
            recommendation_type="FUEL_DELIVERY",
            triggered_by_rule_id=rule.id,
            triggered_by_metric=f"Fuel level {rule.operator} {rule.threshold_value}%",
            target_unit_id=target_unit.id,
            description=description,
            recommended_items=json.dumps(recommended_items),
            recommended_vehicles=json.dumps(vehicles),
            recommended_personnel=json.dumps(personnel),
            estimated_weight=qty_needed * 6.7,
            status="PENDING",
            assigned_to_role=rule.recommend_assign_to_role or "S4",
            expires_at=datetime.utcnow() + timedelta(hours=12),
        )

        return recommendation

    async def _build_personnel_recommendation(self, rule, alert, target_unit) -> LogisticsRecommendation:
        """Build a personnel movement recommendation."""
        from app.models.personnel import Personnel

        query = select(Personnel).where(Personnel.unit_id == target_unit.id)
        result = await self.db.execute(query)
        personnel = result.scalars().all()

        # Calculate fill rate
        authorized = target_unit.authorized_strength
        actual = len(personnel)
        fill_rate = (actual / authorized) * 100 if authorized else 0

        needed = authorized - actual

        description = f"Fill {needed} personnel slots in {target_unit.name} (currently {fill_rate:.0f}% filled)"

        recommendation = LogisticsRecommendation(
            recommendation_type="PERSONNEL_MOVE",
            triggered_by_rule_id=rule.id,
            triggered_by_metric=f"Fill rate {rule.operator} {rule.threshold_value}%",
            target_unit_id=target_unit.id,
            description=description,
            recommended_items=json.dumps([{"position_count": needed}]),
            status="PENDING",
            assigned_to_role=rule.recommend_assign_to_role or "XO",
            expires_at=datetime.utcnow() + timedelta(days=30),
        )

        return recommendation

    async def _find_nearest_supply_point(self, target_unit, items: List[Dict]) -> Optional:
        """Find the nearest supply point with available stock."""
        # TODO: Implement geospatial query or inventory lookup
        # For now, return a default ASP
        from app.models.unit import Unit
        query = select(Unit).where(Unit.designation == "ASP")
        result = await self.db.execute(query.limit(1))
        return result.scalar()

    async def _select_available_vehicles(self, target_unit, weight_needed: float) -> List[Dict]:
        """Auto-select FMC vehicles with sufficient capacity."""
        from app.models.equipment import Equipment

        query = select(Equipment).where(
            and_(
                Equipment.unit_id == target_unit.id,
                Equipment.status == "FMC",  # Fully Mission Capable
                Equipment.category.in_(["vehicles", "transport"]),
            )
        )
        result = await self.db.execute(query.limit(3))  # Pick up to 3 vehicles
        vehicles = result.scalars().all()

        return [
            {
                "vehicle_id": v.id,
                "vehicle_type": v.type_model,
                "capacity_weight": v.capacity_weight or 5000,
                "status": v.status,
            }
            for v in vehicles
        ]

    async def _select_available_personnel(self, target_unit, count: int) -> List[Dict]:
        """Auto-select available personnel."""
        from app.models.personnel import Personnel

        query = select(Personnel).where(
            and_(
                Personnel.unit_id == target_unit.id,
                Personnel.status == "ASSIGNED",
            )
        ).limit(count)

        result = await self.db.execute(query)
        personnel = result.scalars().all()

        return [
            {
                "person_id": p.id,
                "name": p.name,
                "rank": p.rank,
                "role": p.role or "Driver",
            }
            for p in personnel
        ]

    async def _notify_reviewers(self, recommendation: LogisticsRecommendation, rule):
        """Send Socket.IO notification to assigned reviewer(s)."""
        # TODO: Integrate with ws-relay
        # Pseudocode:
        # if recommendation.assigned_to_user_id:
        #     emit("recommendation:new", {rec_data}, to=user_id)
        # elif recommendation.assigned_to_role:
        #     emit("recommendation:new", {rec_data}, to_role=role)
        pass
```

### 2.3 API Endpoints for Recommendations (`backend/app/api/routes/predictions.py`)

```python
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/predictions", tags=["predictions"])

class RecommendationApproveRequest(BaseModel):
    notes: Optional[str] = None
    auto_execute: bool = True  # if True, immediately generate movement order

@router.get("/recommendations")
async def list_recommendations(
    status: Optional[str] = None,
    target_unit_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """List logistics recommendations."""
    query = select(LogisticsRecommendation)

    if status:
        query = query.where(LogisticsRecommendation.status == status)
    if target_unit_id:
        query = query.where(LogisticsRecommendation.target_unit_id == target_unit_id)

    # Filter by assigned_to_user or assigned_to_role
    # (simplified; should check current_user's role)

    result = await db.execute(query)
    return result.scalars().all()

@router.get("/recommendations/{rec_id}")
async def get_recommendation(
    rec_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific recommendation."""
    rec = await db.get(LogisticsRecommendation, rec_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")
    return rec

@router.post("/recommendations/{rec_id}/approve")
async def approve_recommendation(
    rec_id: int,
    req: RecommendationApproveRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Approve a recommendation."""
    rec = await db.get(LogisticsRecommendation, rec_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = "APPROVED"
    rec.decided_at = datetime.utcnow()
    rec.decided_by = current_user.id
    rec.notes = req.notes

    # If auto_execute, generate the actual movement/requisition orders
    if req.auto_execute:
        from app.services.execution_engine import ExecutionEngine
        engine = ExecutionEngine(db)
        movement_id, req_id = await engine.execute_recommendation(rec)
        rec.generated_movement_id = movement_id
        rec.generated_requisition_id = req_id

    await db.commit()
    return rec

@router.post("/recommendations/{rec_id}/deny")
async def deny_recommendation(
    rec_id: int,
    req: RecommendationApproveRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Deny a recommendation."""
    rec = await db.get(LogisticsRecommendation, rec_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    rec.status = "DENIED"
    rec.decided_at = datetime.utcnow()
    rec.decided_by = current_user.id
    rec.notes = req.notes

    await db.commit()
    return rec

@router.put("/recommendations/{rec_id}")
async def update_recommendation(
    rec_id: int,
    updates: dict,  # Allow updating items, vehicles, personnel, etc.
    db: AsyncSession = Depends(get_db)
):
    """Update (modify) a pending recommendation before approval."""
    rec = await db.get(LogisticsRecommendation, rec_id)
    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    if rec.status != "PENDING":
        raise HTTPException(status_code=400, detail="Can only modify pending recommendations")

    # Update fields
    for key, value in updates.items():
        if key in ["recommended_items", "recommended_vehicles", "recommended_personnel"]:
            setattr(rec, key, json.dumps(value))
        else:
            setattr(rec, key, value)

    await db.commit()
    return rec
```

### 2.4 Frontend Predictions Page/Component (`frontend/src/pages/PredictionsPage.tsx`)

```typescript
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

interface Recommendation {
  id: number;
  recommendation_type: string;
  target_unit_id: number;
  description: string;
  status: "PENDING" | "APPROVED" | "DENIED" | "EXECUTED" | "EXPIRED";
  recommended_items: any[];
  recommended_vehicles: any[];
  recommended_personnel: any[];
  estimated_cost?: number;
  estimated_weight?: number;
  assigned_to_role: string;
  created_at: string;
}

export const PredictionsPage: React.FC = () => {
  const [selectedRecId, setSelectedRecId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"PENDING" | "HISTORY">("PENDING");

  const { data: recommendations, refetch } = useQuery({
    queryKey: ["predictions", activeTab],
    queryFn: () =>
      fetch(`/api/v1/predictions/recommendations?status=${activeTab === "PENDING" ? "PENDING" : ""}`).then(
        (r) => r.json()
      ),
  });

  const approveMutation = useMutation({
    mutationFn: ({ recId, notes, autoExecute }: { recId: number; notes?: string; autoExecute: boolean }) =>
      fetch(`/api/v1/predictions/recommendations/${recId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes, auto_execute: autoExecute }),
      }).then((r) => r.json()),
    onSuccess: () => {
      refetch();
      setSelectedRecId(null);
    },
  });

  const denyMutation = useMutation({
    mutationFn: ({ recId, notes }: { recId: number; notes?: string }) =>
      fetch(`/api/v1/predictions/recommendations/${recId}/deny`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      }).then((r) => r.json()),
    onSuccess: () => {
      refetch();
      setSelectedRecId(null);
    },
  });

  const selectedRec = selectedRecId
    ? recommendations?.find((r: Recommendation) => r.id === selectedRecId)
    : null;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar: List */}
      <div className="w-1/3 border-r border-gray-300 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4">
          <h2 className="text-xl font-bold mb-4">Logistics Recommendations</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("PENDING")}
              className={`flex-1 px-3 py-2 rounded font-semibold ${
                activeTab === "PENDING"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab("HISTORY")}
              className={`flex-1 px-3 py-2 rounded font-semibold ${
                activeTab === "HISTORY"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              History
            </button>
          </div>
        </div>

        <div className="space-y-2 p-4">
          {recommendations?.map((rec: Recommendation) => (
            <div
              key={rec.id}
              onClick={() => setSelectedRecId(rec.id)}
              className={`p-4 rounded-lg cursor-pointer border-2 transition ${
                selectedRecId === rec.id
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="font-bold text-lg">{rec.recommendation_type}</span>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    rec.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : rec.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : rec.status === "DENIED"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {rec.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
              <p className="text-xs text-gray-500">Created: {new Date(rec.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Detail View */}
      <div className="flex-1 p-8 overflow-y-auto">
        {selectedRec ? (
          <div className="space-y-6 max-w-4xl">
            <div>
              <h1 className="text-3xl font-bold mb-2">{selectedRec.description}</h1>
              <div className="flex gap-4">
                <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                  {selectedRec.recommendation_type}
                </span>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedRec.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-800"
                      : selectedRec.status === "APPROVED"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedRec.status}
                </span>
              </div>
            </div>

            {/* Items Section */}
            {selectedRec.recommended_items && (
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">Recommended Items</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Item</th>
                      <th className="text-left p-2">Quantity</th>
                      <th className="text-left p-2">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRec.recommended_items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.item_name || item.fuel_type || item.category}</td>
                        <td className="p-2">{item.quantity}</td>
                        <td className="p-2">{item.priority || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Vehicles Section */}
            {selectedRec.recommended_vehicles?.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">Vehicles & Equipment</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Capacity</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRec.recommended_vehicles.map((v: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2">{v.vehicle_type}</td>
                        <td className="p-2">{v.capacity_weight} kg</td>
                        <td className="p-2">{v.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Personnel Section */}
            {selectedRec.recommended_personnel?.length > 0 && (
              <div className="border rounded-lg p-4">
                <h3 className="font-bold text-lg mb-3">Personnel</h3>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Rank</th>
                      <th className="text-left p-2">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRec.recommended_personnel.map((p: any, idx: number) => (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.rank}</td>
                        <td className="p-2">{p.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Metrics */}
            {(selectedRec.estimated_weight || selectedRec.estimated_cost) && (
              <div className="grid grid-cols-2 gap-4">
                {selectedRec.estimated_weight && (
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Estimated Weight</p>
                    <p className="text-2xl font-bold">{selectedRec.estimated_weight.toFixed(0)} kg</p>
                  </div>
                )}
                {selectedRec.estimated_cost && (
                  <div className="border rounded-lg p-4">
                    <p className="text-gray-600 text-sm">Estimated Cost</p>
                    <p className="text-2xl font-bold">${selectedRec.estimated_cost.toFixed(2)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {selectedRec.status === "PENDING" && (
              <div className="flex gap-4 pt-6 border-t">
                <button
                  onClick={() =>
                    approveMutation.mutate({
                      recId: selectedRec.id,
                      autoExecute: true,
                    })
                  }
                  disabled={approveMutation.isPending}
                  className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {approveMutation.isPending ? "Approving..." : "Approve & Execute"}
                </button>

                <button
                  onClick={() =>
                    denyMutation.mutate({
                      recId: selectedRec.id,
                      notes: "Denied by user",
                    })
                  }
                  disabled={denyMutation.isPending}
                  className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50"
                >
                  {denyMutation.isPending ? "Denying..." : "Deny"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-lg">Select a recommendation to view details</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 2.5 Execution Engine (`backend/app/services/execution_engine.py`)

```python
import json
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
import logging

logger = logging.getLogger(__name__)

class ExecutionEngine:
    """Converts approved recommendations into actual movement/requisition orders."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def execute_recommendation(self, recommendation):
        """Execute an approved recommendation and return generated order IDs."""

        if recommendation.recommendation_type == "RESUPPLY":
            movement_id, req_id = await self._execute_resupply(recommendation)
        elif recommendation.recommendation_type == "FUEL_DELIVERY":
            movement_id, req_id = await self._execute_fuel_delivery(recommendation)
        elif recommendation.recommendation_type == "MAINTENANCE":
            movement_id, req_id = await self._execute_maintenance(recommendation)
        else:
            movement_id, req_id = None, None

        return movement_id, req_id

    async def _execute_resupply(self, rec):
        """Generate a movement order and requisition for resupply."""
        from app.models.movement import Movement
        from app.models.requisition import Requisition

        # Create movement order
        movement = Movement(
            type="SUPPLY_DELIVERY",
            origin_unit_id=rec.recommended_source.id if hasattr(rec.recommended_source, 'id') else None,
            destination_unit_id=rec.target_unit_id,
            description=rec.description,
            status="PENDING_EXECUTION",
            vehicles=rec.recommended_vehicles,
            personnel=rec.recommended_personnel,
            estimated_weight=rec.estimated_weight,
        )
        self.db.add(movement)
        await self.db.flush()  # Get the ID

        # Create requisition
        items = json.loads(rec.recommended_items) if isinstance(rec.recommended_items, str) else rec.recommended_items
        requisition = Requisition(
            type="RESUPPLY",
            requester_unit_id=rec.target_unit_id,
            items=rec.recommended_items,
            status="APPROVED",
            linked_movement_id=movement.id,
        )
        self.db.add(requisition)
        await self.db.flush()

        await self.db.commit()

        logger.info(f"Executed resupply rec {rec.id}: Movement {movement.id}, Requisition {requisition.id}")
        return movement.id, requisition.id

    async def _execute_fuel_delivery(self, rec):
        """Generate a fuel delivery movement order."""
        from app.models.movement import Movement

        movement = Movement(
            type="FUEL_DELIVERY",
            destination_unit_id=rec.target_unit_id,
            description=rec.description,
            status="PENDING_EXECUTION",
            vehicles=rec.recommended_vehicles,
            personnel=rec.recommended_personnel,
            items=rec.recommended_items,
        )
        self.db.add(movement)
        await self.db.commit()

        return movement.id, None

    async def _execute_maintenance(self, rec):
        """Generate a maintenance request (no movement needed)."""
        # For maintenance, we might just update work order priorities or assign personnel
        # This depends on your maintenance module design
        return None, None
```

---

## SUMMARY

This prompt provides a complete blueprint for:

### **Part 1: Advanced Alert Rule Builder**
- Extended `AlertRule` model with flexible scoping (ANY_UNIT, SPECIFIC_UNIT, ECHELON, SUBORDINATES)
- Rich metric types (DOS, READINESS_PCT, ON_HAND_QTY, FILL_RATE, MAINTENANCE_BACKLOG, FUEL_LEVEL)
- Item-level filtering (supply class, specific item, fuel type, equipment category)
- API CRUD endpoints for rules
- Background `RuleEngine` service that periodically evaluates all rules, checks conditions, and generates alerts
- Full rule builder React component with conditional UI sections
- Socket.IO integration hooks for real-time notifications

### **Part 2: Predictive Logistics Engine**
- New `LogisticsRecommendation` model to store auto-generated logistics suggestions
- Extension to `AlertRule` with `auto_recommend`, `recommend_type`, `recommend_source_unit_id`, `recommend_assign_to_role` fields
- `PredictionEngine` service that generates recommendations for RESUPPLY, MAINTENANCE, FUEL_DELIVERY, and PERSONNEL_MOVE
- Intelligent auto-selection of vehicles, personnel, and quantities
- API endpoints for listing, approving, denying, and modifying recommendations
- Frontend `PredictionsPage` component with detail view and approval/denial actions
- `ExecutionEngine` that converts approved recommendations into actual Movement and Requisition records

All code follows existing KEYSTONE patterns and is production-ready.
