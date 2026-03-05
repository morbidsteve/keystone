# KEYSTONE Notifications & Alerting System Prompt

## Overview

This prompt expands KEYSTONE's alerting system into a full enterprise notifications engine. The system enables configurable alert rules based on logistical thresholds (supply DOS, equipment readiness, maintenance deadlines, personnel strength, security compliance), fires real-time notifications to relevant personnel via multiple channels (in-app, email), and provides user-facing dashboards for alert management, rule configuration, and notification preferences.

**Architecture**:
- Backend: Python/FastAPI + SQLAlchemy async + PostgreSQL
- Frontend: React 18 + TypeScript + Socket.IO client for real-time
- Real-time push: Existing ws-relay (Node.js Socket.IO)
- Background task: Scheduled alert evaluation (5-minute cycle)

---

## Part 1: Database Models

### Enhanced Alert Model

**File**: `backend/app/models/alert.py`

```python
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    Float, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base

class AlertType(str, Enum):
    """All alert types in KEYSTONE."""
    LOW_DOS = "LOW_DOS"
    LOW_READINESS = "LOW_READINESS"
    CONVOY_DELAYED = "CONVOY_DELAYED"
    ANOMALY = "ANOMALY"
    EQUIPMENT_DEADLINED = "EQUIPMENT_DEADLINED"
    PM_OVERDUE = "PM_OVERDUE"
    PARTS_BACKORDERED = "PARTS_BACKORDERED"
    CASUALTY_REPORTED = "CASUALTY_REPORTED"
    BLOOD_PRODUCT_EXPIRING = "BLOOD_PRODUCT_EXPIRING"
    REQUISITION_PENDING_APPROVAL = "REQUISITION_PENDING_APPROVAL"
    REPORT_DUE = "REPORT_DUE"
    STRENGTH_BELOW_THRESHOLD = "STRENGTH_BELOW_THRESHOLD"
    EAS_APPROACHING = "EAS_APPROACHING"
    SECURITY_CLEARANCE_EXPIRING = "SECURITY_CLEARANCE_EXPIRING"
    FUEL_CRITICAL = "FUEL_CRITICAL"
    AMMO_BELOW_RSR = "AMMO_BELOW_RSR"

class AlertSeverity(str, Enum):
    """Alert severity levels."""
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

class EntityType(str, Enum):
    """Entity types that trigger alerts."""
    EQUIPMENT = "equipment"
    SUPPLY = "supply"
    PERSONNEL = "personnel"
    MOVEMENT = "movement"
    MAINTENANCE = "maintenance"
    UNIT = "unit"
    REQUISITION = "requisition"

class Alert(Base):
    """
    Alert entity representing a fired condition.
    Alerts are created by the alert engine when rules are triggered.
    Each alert may generate multiple Notifications to different users.
    """
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    alert_type = Column(SQLEnum(AlertType), nullable=False, index=True)
    severity = Column(SQLEnum(AlertSeverity), nullable=False, index=True)
    message = Column(Text, nullable=False)

    # Numeric context
    threshold_value = Column(Float, nullable=True)
    actual_value = Column(Float, nullable=True)

    # Entity reference
    entity_type = Column(SQLEnum(EntityType), nullable=False)
    entity_id = Column(Integer, nullable=True, index=True)

    # Deep link to relevant page
    link_url = Column(String(500), nullable=True)

    # Alert lifecycle
    acknowledged = Column(Boolean, default=False, index=True)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)

    resolved = Column(Boolean, default=False, index=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime, nullable=True)

    # Escalation
    escalated = Column(Boolean, default=False, index=True)
    escalated_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    escalated_at = Column(DateTime, nullable=True)

    # Metadata
    auto_generated = Column(Boolean, default=True)
    notification_sent = Column(Boolean, default=False)
    notification_sent_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    unit = relationship("Unit", backref="alerts")
    acknowledged_by_user = relationship("User", foreign_keys=[acknowledged_by], backref="alerts_acknowledged")
    resolved_by_user = relationship("User", foreign_keys=[resolved_by], backref="alerts_resolved")
    escalated_to_user = relationship("User", foreign_keys=[escalated_to], backref="alerts_escalated_to")
    notifications = relationship("Notification", back_populates="alert")

    class Config:
        from_attributes = True
```

---

### New: AlertRule Model

**File**: `backend/app/models/alert_rule.py`

```python
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    Float, ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base

class RuleOperator(str, Enum):
    """Comparison operators for rule thresholds."""
    LT = "LT"      # Less than
    LTE = "LTE"    # Less than or equal
    GT = "GT"      # Greater than
    GTE = "GTE"    # Greater than or equal
    EQ = "EQ"      # Equal
    NEQ = "NEQ"    # Not equal

class RuleScope(str, Enum):
    """Scope of alert rule application."""
    ALL = "ALL"           # All units
    SPECIFIC = "SPECIFIC" # Specific unit only

class AlertRule(Base):
    """
    Configurable rule that triggers alerts when metric crosses threshold.
    Rules are evaluated by the alert engine on a scheduled interval.
    """
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)

    # Rule definition
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    alert_type = Column(String(50), nullable=False, index=True)  # Maps to AlertType
    severity = Column(String(20), nullable=False)  # Maps to AlertSeverity

    # Condition
    metric = Column(String(100), nullable=False)  # e.g., "equipment_readiness_pct", "supply_dos"
    operator = Column(SQLEnum(RuleOperator), nullable=False)
    threshold_value = Column(Float, nullable=False)

    # Scope
    is_scope_all = Column(Boolean, default=True)  # ALL vs SPECIFIC
    scope_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    echelon_scope = Column(String(50), nullable=True)  # e.g., "Company", "Platoon" (optional)

    # Frequency control (avoid alert storm)
    cooldown_minutes = Column(Integer, default=60)  # Min minutes between firings for same condition
    last_fired_at = Column(DateTime, nullable=True)

    # Configuration
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    scope_unit = relationship("Unit", foreign_keys=[scope_unit_id])
    created_by_user = relationship("User", backref="alert_rules_created")

    class Config:
        from_attributes = True
```

---

### New: Notification Model

**File**: `backend/app/models/notification.py`

```python
from datetime import datetime
from enum import Enum
from typing import Optional
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Boolean,
    ForeignKey, Enum as SQLEnum
)
from sqlalchemy.orm import relationship
from app.db.base import Base

class NotificationChannel(str, Enum):
    """Channels for delivering notifications."""
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    BOTH = "BOTH"

class Notification(Base):
    """
    User-facing notification generated from an Alert.
    One Alert may generate multiple Notifications to different users.
    """
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    # Recipient and source
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True, index=True)

    # Content
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    link_url = Column(String(500), nullable=True)  # Link to relevant detail page

    # Delivery
    channel = Column(SQLEnum(NotificationChannel), default=NotificationChannel.IN_APP, index=True)

    # User interaction
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", backref="notifications")
    alert = relationship("Alert", back_populates="notifications")

    class Config:
        from_attributes = True
```

---

### New: NotificationPreference Model

**File**: `backend/app/models/notification_preference.py`

```python
from enum import Enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum as SQLEnum, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base

class NotificationPreference(Base):
    """
    Per-user settings controlling alert notification delivery.
    Users can choose to disable/silence specific alert types,
    select delivery channels (in-app, email, both), and set minimum severity.
    """
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)  # Maps to AlertType

    # Channel preference
    channel = Column(String(20), default="IN_APP")  # IN_APP / EMAIL / BOTH / NONE

    # Severity filter: only notify at or above this level
    min_severity = Column(String(20), default="INFO")  # INFO / WARNING / CRITICAL

    # Relationships
    user = relationship("User", backref="notification_preferences")

    __table_args__ = (UniqueConstraint("user_id", "alert_type", name="uq_user_alert_type"),)

    class Config:
        from_attributes = True
```

---

## Part 2: Core Alert Engine Service

**File**: `backend/app/services/alert_engine.py`

```python
"""
Alert engine for KEYSTONE.
Evaluates configured rules against current system state.
Fires alerts when conditions are met, respects cooldown periods,
and dispatches notifications to relevant users.
"""

from datetime import datetime, timedelta
from typing import List, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
import logging

from app.models.alert import Alert, AlertType, AlertSeverity, EntityType
from app.models.alert_rule import AlertRule, RuleOperator, RuleScope
from app.models.notification import Notification, NotificationChannel
from app.models.notification_preference import NotificationPreference
from app.models.equipment import EquipmentStatus
from app.models.supply import SupplyStatusRecord
from app.models.maintenance import MaintenanceWorkOrder
from app.models.personnel import Personnel
from app.models.movement import Movement
from app.models.unit import Unit
from app.models.user import User

logger = logging.getLogger(__name__)

class AlertEngine:
    """
    Core alert evaluation and notification engine.
    Runs on a scheduled interval (every 5 minutes).
    """

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def evaluate_all_rules(self) -> None:
        """
        Main entry point: evaluate all active rules against current system state.
        Called by scheduler every 5 minutes.
        """
        try:
            stmt = select(AlertRule).where(AlertRule.is_active == True)
            result = await self.db.execute(stmt)
            active_rules = result.scalars().all()

            for rule in active_rules:
                await self.evaluate_rule(rule)

            logger.info(f"Alert evaluation cycle complete. Evaluated {len(active_rules)} rules.")
        except Exception as e:
            logger.error(f"Error in evaluate_all_rules: {e}", exc_info=True)

    async def evaluate_rule(self, rule: AlertRule) -> None:
        """
        Evaluate a single rule.
        Determines if condition is met and fires alert if needed.
        """
        try:
            # Check cooldown: has rule fired recently?
            if rule.last_fired_at:
                cooldown_expired = datetime.utcnow() >= (
                    rule.last_fired_at + timedelta(minutes=rule.cooldown_minutes)
                )
                if not cooldown_expired:
                    logger.debug(f"Rule {rule.id} ({rule.name}) in cooldown period, skipping.")
                    return

            # Get target units based on scope
            units = await self._get_rule_scope_units(rule)
            if not units:
                logger.debug(f"Rule {rule.id} ({rule.name}) has no units in scope.")
                return

            # Evaluate metric for each unit
            conditions_met: List[Tuple[Unit, float]] = []

            if rule.metric == "supply_dos":
                conditions_met = await self.check_supply_thresholds(units, rule)
            elif rule.metric == "equipment_readiness_pct":
                conditions_met = await self.check_equipment_readiness(units, rule)
            elif rule.metric == "pm_overdue_days":
                conditions_met = await self.check_maintenance_deadlines(units, rule)
            elif rule.metric == "personnel_strength_pct":
                conditions_met = await self.check_personnel_thresholds(units, rule)
            elif rule.metric == "eas_days_remaining":
                conditions_met = await self.check_eas_approaching(units, rule)
            elif rule.metric == "fuel_level_pct":
                conditions_met = await self.check_fuel_critical(units, rule)
            elif rule.metric == "ammo_vs_rsr_pct":
                conditions_met = await self.check_ammo_below_rsr(units, rule)

            # Fire alert for each condition met
            for unit, actual_value in conditions_met:
                await self.fire_alert(
                    rule=rule,
                    unit=unit,
                    actual_value=actual_value
                )

            # Update rule's last_fired_at if any alerts were fired
            if conditions_met:
                rule.last_fired_at = datetime.utcnow()
                await self.db.commit()

        except Exception as e:
            logger.error(f"Error evaluating rule {rule.id}: {e}", exc_info=True)

    async def _get_rule_scope_units(self, rule: AlertRule) -> List[Unit]:
        """Get list of units to which rule applies."""
        if rule.is_scope_all:
            stmt = select(Unit)
            result = await self.db.execute(stmt)
            return result.scalars().all()
        else:
            if rule.scope_unit_id:
                stmt = select(Unit).where(Unit.id == rule.scope_unit_id)
                result = await self.db.execute(stmt)
                return result.scalars().all()
            return []

    async def check_supply_thresholds(
        self, units: List[Unit], rule: AlertRule
    ) -> List[Tuple[Unit, float]]:
        """
        Check supply DOS (Days of Supply) against threshold.
        Returns list of (unit, actual_dos) where condition is met.
        """
        conditions_met = []

        for unit in units:
            stmt = select(SupplyStatusRecord).where(
                SupplyStatusRecord.unit_id == unit.id
            ).order_by(SupplyStatusRecord.recorded_at.desc()).limit(1)
            result = await self.db.execute(stmt)
            latest = result.scalar_one_or_none()

            if latest and latest.days_of_supply is not None:
                dos = latest.days_of_supply
                if self._compare_value(dos, rule.operator, rule.threshold_value):
                    conditions_met.append((unit, dos))

        return conditions_met

    async def check_equipment_readiness(
        self, units: List[Unit], rule: AlertRule
    ) -> List[Tuple[Unit, float]]:
        """
        Check equipment readiness percentage against threshold.
        Readiness = (not_deadlined / total) * 100
        """
        conditions_met = []

        for unit in units:
            stmt = select(EquipmentStatus).where(
                EquipmentStatus.unit_id == unit.id
            )
            result = await self.db.execute(stmt)
            equipment = result.scalars().all()

            if not equipment:
                continue

            total = len(equipment)
            deadlined = sum(1 for e in equipment if e.is_deadlined)
            readiness_pct = ((total - deadlined) / total * 100) if total > 0 else 0

            if self._compare_value(readiness_pct, rule.operator, rule.threshold_value):
                conditions_met.append((unit, readiness_pct))

        return conditions_met

    async def check_maintenance_deadlines(
        self, units: List[Unit], rule: AlertRule
    ) -> List[Tuple[Unit, float]]:
        """
        Check for overdue preventive maintenance.
        Returns max days overdue for each unit.
        """
        conditions_met = []

        for unit in units:
            stmt = select(MaintenanceWorkOrder).where(
                and_(
                    MaintenanceWorkOrder.unit_id == unit.id,
                    MaintenanceWorkOrder.scheduled_date < datetime.utcnow(),
                    MaintenanceWorkOrder.completed_date.is_(None)
                )
            ).order_by(MaintenanceWorkOrder.scheduled_date.asc()).limit(1)
            result = await self.db.execute(stmt)
            overdue_wo = result.scalar_one_or_none()

            if overdue_wo:
                days_overdue = (datetime.utcnow() - overdue_wo.scheduled_date).days
                if self._compare_value(days_overdue, rule.operator, rule.threshold_value):
                    conditions_met.append((unit, days_overdue))

        return conditions_met

    async def check_personnel_thresholds(
        self, units: List[Unit], rule: AlertRule
    ) -> List[Tuple[Unit, float]]:
        """
        Check personnel strength as percentage of authorized.
        """
        conditions_met = []

        for unit in units:
            stmt = select(Personnel).where(Personnel.unit_id == unit.id)
            result = await self.db.execute(stmt)
            personnel = result.scalars().all()

            if not unit.authorized_strength or unit.authorized_strength == 0:
                continue

            actual_strength = len([p for p in personnel if not p.date_lost])
            strength_pct = (actual_strength / unit.authorized_strength) * 100

            if self._compare_value(strength_pct, rule.operator, rule.threshold_value):
                conditions_met.append((unit, strength_pct))

        return conditions_met

    async def check_eas_approaching(
        self, units: List[Unit], rule: AlertRule
    ) -> List[Tuple[Unit, float]]:
        """
        Check for personnel with EAS (Expiration of Active Service) within threshold days.
        """
        conditions_met = []
        threshold_days = rule.threshold_value

        for unit in units:
            stmt = select(Personnel).where(
                and_(
                    Personnel.unit_id == unit.id,
                    Personnel.eas_date.isnot(None)
                )
            )
            result = await self.db.execute(stmt)
            personnel = result.scalars().all()

            for person in personnel:
                if person.eas_date:
                    days_until_eas = (person.eas_date - datetime.utcnow().date()).days
                    if 0 <= days_until_eas <= threshold_days:
                        conditions_met.append((unit, days_until_eas))
                        break  # One alert per unit

        return conditions_met

    async def check_fuel_critical(
        self, units: List[Unit], rule: AlertRule
    ) -> List[Tuple[Unit, float]]:
        """
        Check fuel levels against critical threshold.
        """
        conditions_met = []

        for unit in units:
            stmt = select(EquipmentStatus).where(
                and_(
                    EquipmentStatus.unit_id == unit.id,
                    EquipmentStatus.fuel_level_pct.isnot(None)
                )
            )
            result = await self.db.execute(stmt)
            equipment = result.scalars().all()

            if equipment:
                avg_fuel = sum(e.fuel_level_pct for e in equipment) / len(equipment)
                if self._compare_value(avg_fuel, rule.operator, rule.threshold_value):
                    conditions_met.append((unit, avg_fuel))

        return conditions_met

    async def check_ammo_below_rsr(
        self, units: List[Unit], rule: AlertRule
    ) -> List[Tuple[Unit, float]]:
        """
        Check ammunition levels against Recommended Supply Rate.
        """
        conditions_met = []

        for unit in units:
            stmt = select(SupplyStatusRecord).where(
                SupplyStatusRecord.unit_id == unit.id
            ).order_by(SupplyStatusRecord.recorded_at.desc()).limit(1)
            result = await self.db.execute(stmt)
            latest = result.scalar_one_or_none()

            if latest and latest.ammo_vs_rsr_pct is not None:
                pct = latest.ammo_vs_rsr_pct
                if self._compare_value(pct, rule.operator, rule.threshold_value):
                    conditions_met.append((unit, pct))

        return conditions_met

    def _compare_value(self, actual: float, operator: RuleOperator, threshold: float) -> bool:
        """Compare actual value against threshold using operator."""
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

    async def fire_alert(
        self,
        rule: AlertRule,
        unit: Unit,
        actual_value: float,
        entity_type: EntityType = EntityType.UNIT,
        entity_id: Optional[int] = None,
        link_url: Optional[str] = None
    ) -> Alert:
        """
        Create an Alert and dispatch Notifications to relevant users.
        """
        # Create alert
        alert = Alert(
            unit_id=unit.id,
            alert_type=rule.alert_type,
            severity=rule.severity,
            message=self._build_alert_message(rule, unit, actual_value),
            threshold_value=rule.threshold_value,
            actual_value=actual_value,
            entity_type=entity_type,
            entity_id=entity_id,
            link_url=link_url,
            auto_generated=True,
            notification_sent=False
        )
        self.db.add(alert)
        await self.db.flush()  # Ensure alert is persisted before creating notifications

        # Get unit's personnel (assumed they have user accounts)
        stmt = select(User).where(User.unit_id == unit.id)
        result = await self.db.execute(stmt)
        unit_users = result.scalars().all()

        # Create notifications respecting user preferences
        for user in unit_users:
            should_notify = await self._check_notification_preference(
                user, rule.alert_type, rule.severity
            )
            if should_notify:
                pref = await self._get_notification_preference(user, rule.alert_type)
                channel = pref.channel if pref else NotificationChannel.IN_APP

                notification = Notification(
                    user_id=user.id,
                    alert_id=alert.id,
                    title=f"{rule.alert_type}: {unit.name}",
                    body=alert.message,
                    link_url=link_url,
                    channel=channel,
                    is_read=False
                )
                self.db.add(notification)

        await self.db.commit()

        logger.info(
            f"Alert fired: {rule.alert_type} for unit {unit.id} "
            f"(threshold={rule.threshold_value}, actual={actual_value})"
        )

        return alert

    def _build_alert_message(self, rule: AlertRule, unit: Unit, actual_value: float) -> str:
        """Build human-readable alert message."""
        return (
            f"{rule.name}: {unit.name} has crossed threshold. "
            f"Threshold: {rule.threshold_value}, Actual: {actual_value:.2f}"
        )

    async def _check_notification_preference(
        self, user: User, alert_type: str, severity: str
    ) -> bool:
        """Check if user should be notified based on preferences."""
        pref = await self._get_notification_preference(user, alert_type)

        if not pref or pref.channel == "NONE":
            return False

        severity_levels = {"INFO": 0, "WARNING": 1, "CRITICAL": 2}
        user_min = severity_levels.get(pref.min_severity, 0)
        alert_severity = severity_levels.get(severity, 0)

        return alert_severity >= user_min

    async def _get_notification_preference(
        self, user: User, alert_type: str
    ) -> Optional[NotificationPreference]:
        """Get notification preference for user and alert type."""
        stmt = select(NotificationPreference).where(
            and_(
                NotificationPreference.user_id == user.id,
                NotificationPreference.alert_type == alert_type
            )
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def acknowledge_alert(self, alert_id: int, user_id: int) -> Alert:
        """Mark alert as acknowledged."""
        stmt = select(Alert).where(Alert.id == alert_id)
        result = await self.db.execute(stmt)
        alert = result.scalar_one_or_none()

        if alert:
            alert.acknowledged = True
            alert.acknowledged_by = user_id
            alert.acknowledged_at = datetime.utcnow()
            await self.db.commit()
            logger.info(f"Alert {alert_id} acknowledged by user {user_id}")

        return alert

    async def resolve_alert(self, alert_id: int, user_id: int) -> Alert:
        """Mark alert as resolved."""
        stmt = select(Alert).where(Alert.id == alert_id)
        result = await self.db.execute(stmt)
        alert = result.scalar_one_or_none()

        if alert:
            alert.resolved = True
            alert.resolved_by = user_id
            alert.resolved_at = datetime.utcnow()
            await self.db.commit()
            logger.info(f"Alert {alert_id} resolved by user {user_id}")

        return alert

    async def escalate_alert(self, alert_id: int, escalate_to_user_id: int) -> Alert:
        """Escalate alert to superior user."""
        stmt = select(Alert).where(Alert.id == alert_id)
        result = await self.db.execute(stmt)
        alert = result.scalar_one_or_none()

        if alert:
            alert.escalated = True
            alert.escalated_to = escalate_to_user_id
            alert.escalated_at = datetime.utcnow()
            await self.db.commit()
            logger.info(f"Alert {alert_id} escalated to user {escalate_to_user_id}")

        return alert

    async def send_notification(self, notification_id: int) -> None:
        """
        Deliver notification via configured channel (in-app, email, etc.).
        For email, integrate with email service (e.g., SendGrid).
        For in-app, emit via Socket.IO to user's connected clients.
        """
        stmt = select(Notification).where(Notification.id == notification_id)
        result = await self.db.execute(stmt)
        notification = result.scalar_one_or_none()

        if not notification:
            return

        try:
            if notification.channel in [NotificationChannel.IN_APP, NotificationChannel.BOTH]:
                # Emit via Socket.IO (handled by ws-relay integration)
                logger.debug(f"Queuing in-app notification {notification_id} for Socket.IO emission")

            if notification.channel in [NotificationChannel.EMAIL, NotificationChannel.BOTH]:
                # Send email (integrate with email service)
                logger.debug(f"Queuing email notification {notification_id}")

            notification.is_read = False  # Ensure it's marked unread when sent
            await self.db.commit()
            logger.info(f"Notification {notification_id} sent via {notification.channel}")

        except Exception as e:
            logger.error(f"Error sending notification {notification_id}: {e}", exc_info=True)
```

---

## Part 3: API Endpoints

**File**: `backend/app/routes/alerts.py`

```python
"""
Alert management and notification endpoints.
Includes CRUD for alerts, notifications, rules, and preferences.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc
from datetime import datetime

from app.db.session import get_db
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.alert_rule import AlertRule
from app.models.notification import Notification, NotificationChannel
from app.models.notification_preference import NotificationPreference
from app.models.user import User
from app.services.alert_engine import AlertEngine
from app.schemas.alert import (
    AlertResponse, AlertListResponse, AlertRuleResponse,
    NotificationResponse, NotificationPreferenceResponse
)
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/v1", tags=["alerts"])

# ============================================================================
# ALERTS ENDPOINTS
# ============================================================================

@router.get("/alerts", response_model=AlertListResponse)
async def list_alerts(
    unit_id: Optional[int] = Query(None),
    severity: Optional[str] = Query(None),
    alert_type: Optional[str] = Query(None),
    resolved: Optional[bool] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AlertListResponse:
    """
    List alerts with optional filtering by unit, severity, type, resolved status.
    Includes pagination.
    """
    filters = []

    if unit_id:
        filters.append(Alert.unit_id == unit_id)
    if severity:
        filters.append(Alert.severity == severity)
    if alert_type:
        filters.append(Alert.alert_type == alert_type)
    if resolved is not None:
        filters.append(Alert.resolved == resolved)

    # Count total
    count_stmt = select(Alert).where(and_(*filters) if filters else True)
    count_result = await db.execute(count_stmt)
    total = len(count_result.scalars().all())

    # Get paginated results
    stmt = select(Alert).where(and_(*filters) if filters else True) \
        .order_by(desc(Alert.created_at)) \
        .offset(skip) \
        .limit(limit)
    result = await db.execute(stmt)
    alerts = result.scalars().all()

    return AlertListResponse(
        items=[AlertResponse.model_validate(a) for a in alerts],
        total=total,
        skip=skip,
        limit=limit
    )

@router.get("/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AlertResponse:
    """Get detailed alert information."""
    stmt = select(Alert).where(Alert.id == alert_id)
    result = await db.execute(stmt)
    alert = result.scalar_one_or_none()

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return AlertResponse.model_validate(alert)

@router.put("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AlertResponse:
    """Acknowledge an alert."""
    engine = AlertEngine(db)
    alert = await engine.acknowledge_alert(alert_id, current_user.id)

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return AlertResponse.model_validate(alert)

@router.put("/alerts/{alert_id}/resolve")
async def resolve_alert(
    alert_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AlertResponse:
    """Resolve an alert."""
    engine = AlertEngine(db)
    alert = await engine.resolve_alert(alert_id, current_user.id)

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return AlertResponse.model_validate(alert)

@router.put("/alerts/{alert_id}/escalate")
async def escalate_alert(
    alert_id: int,
    escalate_to_user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AlertResponse:
    """Escalate alert to superior (admin only)."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    engine = AlertEngine(db)
    alert = await engine.escalate_alert(alert_id, escalate_to_user_id)

    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")

    return AlertResponse.model_validate(alert)

@router.get("/alerts/summary")
async def alert_summary(
    unit_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Get alert summary: counts by severity and type.
    Used for dashboard widgets.
    """
    filters = [Alert.resolved == False]
    if unit_id:
        filters.append(Alert.unit_id == unit_id)

    stmt = select(Alert).where(and_(*filters))
    result = await db.execute(stmt)
    active_alerts = result.scalars().all()

    summary = {
        "total_active": len(active_alerts),
        "by_severity": {
            "CRITICAL": len([a for a in active_alerts if a.severity == "CRITICAL"]),
            "WARNING": len([a for a in active_alerts if a.severity == "WARNING"]),
            "INFO": len([a for a in active_alerts if a.severity == "INFO"])
        },
        "by_type": {}
    }

    for alert_type in AlertType:
        count = len([a for a in active_alerts if a.alert_type == alert_type.value])
        if count > 0:
            summary["by_type"][alert_type.value] = count

    return summary

# ============================================================================
# ALERT RULES ENDPOINTS (Admin only)
# ============================================================================

@router.get("/alert-rules", response_model=List[AlertRuleResponse])
async def list_alert_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[AlertRuleResponse]:
    """List all alert rules (admin only)."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    stmt = select(AlertRule).order_by(AlertRule.created_at.desc())
    result = await db.execute(stmt)
    rules = result.scalars().all()

    return [AlertRuleResponse.model_validate(r) for r in rules]

@router.post("/alert-rules", response_model=AlertRuleResponse)
async def create_alert_rule(
    rule_data: AlertRuleResponse,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AlertRuleResponse:
    """Create new alert rule (admin only)."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    new_rule = AlertRule(
        name=rule_data.name,
        description=rule_data.description,
        alert_type=rule_data.alert_type,
        severity=rule_data.severity,
        metric=rule_data.metric,
        operator=rule_data.operator,
        threshold_value=rule_data.threshold_value,
        is_scope_all=rule_data.is_scope_all,
        scope_unit_id=rule_data.scope_unit_id if not rule_data.is_scope_all else None,
        cooldown_minutes=rule_data.cooldown_minutes,
        is_active=rule_data.is_active,
        created_by=current_user.id
    )
    db.add(new_rule)
    await db.commit()

    return AlertRuleResponse.model_validate(new_rule)

@router.put("/alert-rules/{rule_id}", response_model=AlertRuleResponse)
async def update_alert_rule(
    rule_id: int,
    rule_data: AlertRuleResponse,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> AlertRuleResponse:
    """Update alert rule (admin only)."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    stmt = select(AlertRule).where(AlertRule.id == rule_id)
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.name = rule_data.name
    rule.description = rule_data.description
    rule.alert_type = rule_data.alert_type
    rule.severity = rule_data.severity
    rule.metric = rule_data.metric
    rule.operator = rule_data.operator
    rule.threshold_value = rule_data.threshold_value
    rule.is_scope_all = rule_data.is_scope_all
    rule.scope_unit_id = rule_data.scope_unit_id if not rule_data.is_scope_all else None
    rule.cooldown_minutes = rule_data.cooldown_minutes
    rule.is_active = rule_data.is_active

    await db.commit()

    return AlertRuleResponse.model_validate(rule)

@router.delete("/alert-rules/{rule_id}")
async def delete_alert_rule(
    rule_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """Delete alert rule (admin only)."""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    stmt = select(AlertRule).where(AlertRule.id == rule_id)
    result = await db.execute(stmt)
    rule = result.scalar_one_or_none()

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    await db.delete(rule)
    await db.commit()

    return {"message": "Rule deleted"}

# ============================================================================
# NOTIFICATIONS ENDPOINTS
# ============================================================================

@router.get("/notifications", response_model=List[NotificationResponse])
async def list_notifications(
    unread_only: bool = Query(False),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[NotificationResponse]:
    """
    Get user's notifications.
    """
    filters = [Notification.user_id == current_user.id]
    if unread_only:
        filters.append(Notification.is_read == False)

    stmt = select(Notification).where(and_(*filters)) \
        .order_by(desc(Notification.created_at)) \
        .offset(skip) \
        .limit(limit)
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    return [NotificationResponse.model_validate(n) for n in notifications]

@router.put("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> NotificationResponse:
    """Mark single notification as read."""
    stmt = select(Notification).where(
        and_(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    result = await db.execute(stmt)
    notification = result.scalar_one_or_none()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    notification.is_read = True
    notification.read_at = datetime.utcnow()
    await db.commit()

    return NotificationResponse.model_validate(notification)

@router.put("/notifications/read-all")
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> dict:
    """Mark all user notifications as read."""
    stmt = select(Notification).where(
        and_(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )
    result = await db.execute(stmt)
    notifications = result.scalars().all()

    for notification in notifications:
        notification.is_read = True
        notification.read_at = datetime.utcnow()

    await db.commit()

    return {"updated": len(notifications)}

# ============================================================================
# NOTIFICATION PREFERENCES ENDPOINTS
# ============================================================================

@router.get("/notifications/preferences", response_model=List[NotificationPreferenceResponse])
async def get_notification_preferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> List[NotificationPreferenceResponse]:
    """Get user's notification preferences."""
    stmt = select(NotificationPreference).where(
        NotificationPreference.user_id == current_user.id
    )
    result = await db.execute(stmt)
    prefs = result.scalars().all()

    return [NotificationPreferenceResponse.model_validate(p) for p in prefs]

@router.put("/notifications/preferences/{alert_type}")
async def update_notification_preference(
    alert_type: str,
    pref_data: NotificationPreferenceResponse,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> NotificationPreferenceResponse:
    """Update notification preference for alert type."""
    stmt = select(NotificationPreference).where(
        and_(
            NotificationPreference.user_id == current_user.id,
            NotificationPreference.alert_type == alert_type
        )
    )
    result = await db.execute(stmt)
    pref = result.scalar_one_or_none()

    if not pref:
        # Create if doesn't exist
        pref = NotificationPreference(
            user_id=current_user.id,
            alert_type=alert_type,
            channel=pref_data.channel,
            min_severity=pref_data.min_severity
        )
        db.add(pref)
    else:
        pref.channel = pref_data.channel
        pref.min_severity = pref_data.min_severity

    await db.commit()

    return NotificationPreferenceResponse.model_validate(pref)
```

---

## Part 4: Background Task Setup

### Option A: APScheduler (Recommended for Python/FastAPI)

**File**: `backend/app/tasks/scheduler.py`

```python
"""
Background task scheduler for alert engine evaluation.
Uses APScheduler to run alert evaluation every 5 minutes.
"""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import logging

from app.db.base import Base
from app.services.alert_engine import AlertEngine
from app.config import settings

logger = logging.getLogger(__name__)

async_engine = create_async_engine(
    settings.DATABASE_URL,
    echo=False,
    future=True
)

async_session = sessionmaker(
    async_engine, class_=AsyncSession, expire_on_commit=False
)

scheduler = AsyncIOScheduler()

async def evaluate_alerts_task():
    """Task function: evaluate all alert rules."""
    async with async_session() as session:
        engine = AlertEngine(session)
        try:
            await engine.evaluate_all_rules()
        except Exception as e:
            logger.error(f"Error in alert evaluation task: {e}", exc_info=True)

def start_scheduler():
    """Start the background scheduler."""
    if not scheduler.running:
        scheduler.add_job(
            evaluate_alerts_task,
            IntervalTrigger(minutes=5),
            id="evaluate_alerts",
            name="Evaluate all alert rules every 5 minutes",
            replace_existing=True
        )
        scheduler.start()
        logger.info("Alert scheduler started")

def stop_scheduler():
    """Stop the background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Alert scheduler stopped")
```

**Integration in FastAPI app startup**:

```python
# In app/main.py
from contextlib import asynccontextmanager
from app.tasks.scheduler import start_scheduler, stop_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    start_scheduler()
    yield
    # Shutdown
    stop_scheduler()

app = FastAPI(
    title="KEYSTONE API",
    lifespan=lifespan
)
```

### Option B: Celery Beat (For larger deployments)

**File**: `backend/app/tasks/celery_config.py`

```python
"""Celery configuration for distributed tasks."""

from celery import Celery
from celery.schedules import schedule
from app.config import settings

celery_app = Celery(
    "keystone_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "evaluate-alerts-every-5-minutes": {
            "task": "app.tasks.tasks.evaluate_alerts",
            "schedule": schedule(run_every=300),  # 300 seconds = 5 minutes
        }
    }
)
```

**File**: `backend/app/tasks/tasks.py`

```python
"""Celery tasks."""

from app.tasks.celery_config import celery_app
from app.services.alert_engine import AlertEngine
from app.db.session import AsyncSessionLocal
import asyncio

@celery_app.task(name="app.tasks.tasks.evaluate_alerts")
def evaluate_alerts():
    """Celery task: evaluate all alert rules."""
    async def run():
        async with AsyncSessionLocal() as session:
            engine = AlertEngine(session)
            await engine.evaluate_all_rules()

    asyncio.run(run())
```

**Start with**:
```bash
celery -A app.tasks.celery_config worker --loglevel=info
celery -A app.tasks.celery_config beat --loglevel=info
```

---

## Part 5: Socket.IO Integration

**File**: `backend/app/services/notification_emitter.py`

```python
"""
Real-time notification emission via Socket.IO.
Integrates with existing ws-relay service.
"""

import socketio
import logging

logger = logging.getLogger(__name__)

# This assumes ws-relay exposes a client connection pool
# Adjust based on your actual ws-relay integration
sio_manager = None

def set_sio_manager(manager):
    """Set the socketio async client manager (called on app startup)."""
    global sio_manager
    sio_manager = manager

async def emit_alert_notification(user_id: int, notification_data: dict):
    """
    Emit notification to user via Socket.IO.
    Notification is sent to user's room (e.g., "user:{user_id}").
    """
    if not sio_manager:
        logger.warning("Socket.IO manager not initialized")
        return

    room = f"user:{user_id}"
    try:
        await sio_manager.emit("alert", notification_data, room=room)
        logger.debug(f"Notification emitted to room {room}: {notification_data}")
    except Exception as e:
        logger.error(f"Error emitting notification to {room}: {e}", exc_info=True)

async def emit_to_unit(unit_id: int, alert_data: dict):
    """Emit alert to all users in a unit."""
    room = f"unit:{unit_id}"
    try:
        if sio_manager:
            await sio_manager.emit("unit_alert", alert_data, room=room)
        logger.debug(f"Alert emitted to unit room {room}")
    except Exception as e:
        logger.error(f"Error emitting to unit {unit_id}: {e}", exc_info=True)
```

---

## Part 6: Frontend Components

### React Schemas/DTOs

**File**: `frontend/src/types/alerts.ts`

```typescript
export enum AlertType {
  LOW_DOS = "LOW_DOS",
  LOW_READINESS = "LOW_READINESS",
  CONVOY_DELAYED = "CONVOY_DELAYED",
  ANOMALY = "ANOMALY",
  EQUIPMENT_DEADLINED = "EQUIPMENT_DEADLINED",
  PM_OVERDUE = "PM_OVERDUE",
  PARTS_BACKORDERED = "PARTS_BACKORDERED",
  CASUALTY_REPORTED = "CASUALTY_REPORTED",
  BLOOD_PRODUCT_EXPIRING = "BLOOD_PRODUCT_EXPIRING",
  REQUISITION_PENDING_APPROVAL = "REQUISITION_PENDING_APPROVAL",
  REPORT_DUE = "REPORT_DUE",
  STRENGTH_BELOW_THRESHOLD = "STRENGTH_BELOW_THRESHOLD",
  EAS_APPROACHING = "EAS_APPROACHING",
  SECURITY_CLEARANCE_EXPIRING = "SECURITY_CLEARANCE_EXPIRING",
  FUEL_CRITICAL = "FUEL_CRITICAL",
  AMMO_BELOW_RSR = "AMMO_BELOW_RSR",
}

export enum AlertSeverity {
  INFO = "INFO",
  WARNING = "WARNING",
  CRITICAL = "CRITICAL",
}

export interface Alert {
  id: number;
  unit_id: number;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  threshold_value?: number;
  actual_value?: number;
  entity_type: string;
  entity_id?: number;
  link_url?: string;
  acknowledged: boolean;
  acknowledged_by?: number;
  acknowledged_at?: string;
  resolved: boolean;
  resolved_by?: number;
  resolved_at?: string;
  escalated: boolean;
  escalated_to?: number;
  escalated_at?: string;
  auto_generated: boolean;
  notification_sent: boolean;
  notification_sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: number;
  user_id: number;
  alert_id?: number;
  title: string;
  body: string;
  link_url?: string;
  channel: "IN_APP" | "EMAIL" | "BOTH";
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface AlertRule {
  id: number;
  name: string;
  description?: string;
  alert_type: string;
  severity: AlertSeverity;
  metric: string;
  operator: "LT" | "LTE" | "GT" | "GTE" | "EQ" | "NEQ";
  threshold_value: number;
  is_scope_all: boolean;
  scope_unit_id?: number;
  echelon_scope?: string;
  cooldown_minutes: number;
  last_fired_at?: string;
  is_active: boolean;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreference {
  id: number;
  user_id: number;
  alert_type: string;
  channel: "IN_APP" | "EMAIL" | "BOTH" | "NONE";
  min_severity: AlertSeverity;
}

export interface AlertSummary {
  total_active: number;
  by_severity: {
    CRITICAL: number;
    WARNING: number;
    INFO: number;
  };
  by_type: Record<string, number>;
}
```

### Alert Dashboard Component

**File**: `frontend/src/components/AlertDashboard.tsx`

```typescript
import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, Info, Zap } from "lucide-react";
import { Alert, AlertSeverity, AlertSummary } from "../types/alerts";
import { apiClient } from "../lib/api";

const severityColors: Record<AlertSeverity, string> = {
  CRITICAL: "border-l-4 border-red-500 bg-red-50",
  WARNING: "border-l-4 border-orange-500 bg-orange-50",
  INFO: "border-l-4 border-blue-500 bg-blue-50",
};

const severityIcons: Record<AlertSeverity, React.ReactNode> = {
  CRITICAL: <AlertCircle className="w-5 h-5 text-red-500" />,
  WARNING: <AlertTriangle className="w-5 h-5 text-orange-500" />,
  INFO: <Info className="w-5 h-5 text-blue-500" />,
};

export const AlertDashboard: React.FC = () => {
  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: () => apiClient.get("/alerts?resolved=false").then(r => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ["alerts-summary"],
    queryFn: () => apiClient.get("/alerts/summary").then(r => r.data),
  });

  const handleAcknowledge = async (alertId: number) => {
    await apiClient.put(`/alerts/${alertId}/acknowledge`);
    // Invalidate query to refetch
  };

  const handleResolve = async (alertId: number) => {
    await apiClient.put(`/alerts/${alertId}/resolve`);
  };

  if (isLoading) return <div>Loading alerts...</div>;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <p className="text-gray-600 text-sm">Total Active</p>
            <p className="text-3xl font-bold">{summary.total_active}</p>
          </div>
          <div className="bg-red-50 p-4 rounded shadow">
            <p className="text-red-600 text-sm">Critical</p>
            <p className="text-3xl font-bold text-red-600">
              {summary.by_severity.CRITICAL}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded shadow">
            <p className="text-orange-600 text-sm">Warning</p>
            <p className="text-3xl font-bold text-orange-600">
              {summary.by_severity.WARNING}
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded shadow">
            <p className="text-blue-600 text-sm">Info</p>
            <p className="text-3xl font-bold text-blue-600">
              {summary.by_severity.INFO}
            </p>
          </div>
        </div>
      )}

      {/* Alert Cards */}
      <div className="space-y-3">
        {alerts?.items?.map((alert: Alert) => (
          <div key={alert.id} className={`p-4 rounded ${severityColors[alert.severity]}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {severityIcons[alert.severity]}
                <div className="flex-1">
                  <h3 className="font-semibold">{alert.alert_type}</h3>
                  <p className="text-sm mt-1">{alert.message}</p>
                  {alert.threshold_value !== undefined && (
                    <p className="text-xs mt-1">
                      Threshold: {alert.threshold_value}, Actual: {alert.actual_value}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                {!alert.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Acknowledge
                  </button>
                )}
                {!alert.resolved && (
                  <button
                    onClick={() => handleResolve(alert.id)}
                    className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    Resolve
                  </button>
                )}
                {alert.link_url && (
                  <a
                    href={alert.link_url}
                    className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                  >
                    View
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Notification Bell Component

**File**: `frontend/src/components/NotificationBell.tsx`

```typescript
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, X } from "lucide-react";
import { Notification } from "../types/alerts";
import { apiClient } from "../lib/api";
import { useSocket } from "../hooks/useSocket";

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const socket = useSocket();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get("/notifications?unread_only=true").then(r => r.data),
  });

  // Listen for real-time alerts
  useEffect(() => {
    if (!socket) return;

    socket.on("alert", (data) => {
      // Toast notification
      console.log("Alert received:", data);
      // Invalidate notifications query
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    });

    return () => {
      socket.off("alert");
    };
  }, [socket, queryClient]);

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const handleMarkRead = async (notificationId: number) => {
    await apiClient.put(`/notifications/${notificationId}/read`);
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleMarkAllRead = async () => {
    await apiClient.put("/notifications/read-all");
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications?.length ? (
              notifications.map((notif: Notification) => (
                <div
                  key={notif.id}
                  className={`p-3 border-b text-sm ${
                    !notif.is_read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <p className="font-medium">{notif.title}</p>
                      <p className="text-gray-600">{notif.body}</p>
                      {notif.link_url && (
                        <a href={notif.link_url} className="text-blue-600 text-xs hover:underline">
                          View details
                        </a>
                      )}
                    </div>
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">No notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
```

### Notification Preferences Component

**File**: `frontend/src/components/NotificationPreferences.tsx`

```typescript
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertType, AlertSeverity } from "../types/alerts";
import { apiClient } from "../lib/api";

export const NotificationPreferences: React.FC = () => {
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => apiClient.get("/notifications/preferences").then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      apiClient.put(`/notifications/preferences/${data.alert_type}`, data),
    onSuccess: () => {
      // Invalidate query
    },
  });

  const handleChange = (alertType: string, field: string, value: string) => {
    const pref = preferences?.find((p: any) => p.alert_type === alertType) || {};
    mutation.mutate({
      ...pref,
      alert_type: alertType,
      [field]: value,
    });
  };

  if (isLoading) return <div>Loading preferences...</div>;

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Notification Preferences</h2>

      <div className="space-y-4">
        {Object.values(AlertType).map((alertType) => {
          const pref = preferences?.find((p: any) => p.alert_type === alertType);
          return (
            <div key={alertType} className="grid grid-cols-3 gap-4 p-4 border rounded">
              <div>
                <p className="font-medium">{alertType}</p>
              </div>
              <div>
                <label className="text-sm text-gray-600">Channel</label>
                <select
                  value={pref?.channel || "IN_APP"}
                  onChange={(e) =>
                    handleChange(alertType, "channel", e.target.value)
                  }
                  className="mt-1 block w-full border rounded p-2"
                >
                  <option value="IN_APP">In-App</option>
                  <option value="EMAIL">Email</option>
                  <option value="BOTH">Both</option>
                  <option value="NONE">None</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-600">Min Severity</label>
                <select
                  value={pref?.min_severity || "INFO"}
                  onChange={(e) =>
                    handleChange(alertType, "min_severity", e.target.value)
                  }
                  className="mt-1 block w-full border rounded p-2"
                >
                  <option value="INFO">Info</option>
                  <option value="WARNING">Warning</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

---

## Part 7: Seed Data

**File**: `backend/app/seeds/alert_rules.py`

```python
"""
Default alert rules seed for KEYSTONE.
Run once during initial setup.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.alert_rule import AlertRule, RuleOperator, RuleScope
from app.models.user import User
from sqlalchemy import select

async def seed_alert_rules(db: AsyncSession):
    """Create default alert rules."""

    # Get system admin user (assumption: first user created, or specific admin)
    stmt = select(User).where(User.is_admin == True).limit(1)
    result = await db.execute(stmt)
    admin = result.scalar_one_or_none()

    if not admin:
        print("No admin user found. Skipping alert rule seeding.")
        return

    rules = [
        AlertRule(
            name="Supply DOS < 3 Days (Critical)",
            description="Alert when supply DOS drops below 3 days (critical resupply needed)",
            alert_type="LOW_DOS",
            severity="CRITICAL",
            metric="supply_dos",
            operator=RuleOperator.LT,
            threshold_value=3.0,
            is_scope_all=True,
            cooldown_minutes=60,
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="Supply DOS < 5 Days (Warning)",
            description="Alert when supply DOS drops below 5 days",
            alert_type="LOW_DOS",
            severity="WARNING",
            metric="supply_dos",
            operator=RuleOperator.LT,
            threshold_value=5.0,
            is_scope_all=True,
            cooldown_minutes=120,
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="Equipment Readiness < 70% (Critical)",
            description="Alert when equipment readiness drops below 70%",
            alert_type="LOW_READINESS",
            severity="CRITICAL",
            metric="equipment_readiness_pct",
            operator=RuleOperator.LT,
            threshold_value=70.0,
            is_scope_all=True,
            cooldown_minutes=60,
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="Equipment Readiness < 85% (Warning)",
            description="Alert when equipment readiness drops below 85%",
            alert_type="LOW_READINESS",
            severity="WARNING",
            metric="equipment_readiness_pct",
            operator=RuleOperator.LT,
            threshold_value=85.0,
            is_scope_all=True,
            cooldown_minutes=120,
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="PM Overdue > 7 Days (Warning)",
            description="Alert when preventive maintenance is overdue by more than 7 days",
            alert_type="PM_OVERDUE",
            severity="WARNING",
            metric="pm_overdue_days",
            operator=RuleOperator.GT,
            threshold_value=7.0,
            is_scope_all=True,
            cooldown_minutes=180,
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="Equipment Deadlined > 48hrs (Critical)",
            description="Critical alert for deadlined equipment",
            alert_type="EQUIPMENT_DEADLINED",
            severity="CRITICAL",
            metric="equipment_readiness_pct",
            operator=RuleOperator.LT,
            threshold_value=60.0,
            is_scope_all=True,
            cooldown_minutes=60,
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="Personnel Fill < 80% (Warning)",
            description="Alert when personnel strength is below 80% authorized",
            alert_type="STRENGTH_BELOW_THRESHOLD",
            severity="WARNING",
            metric="personnel_strength_pct",
            operator=RuleOperator.LT,
            threshold_value=80.0,
            is_scope_all=True,
            cooldown_minutes=240,
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="Blood Products Expiring < 48hrs (Critical)",
            description="Critical alert for blood products expiring within 48 hours",
            alert_type="BLOOD_PRODUCT_EXPIRING",
            severity="CRITICAL",
            metric="blood_product_expiry_days",
            operator=RuleOperator.LT,
            threshold_value=2.0,
            is_scope_all=True,
            cooldown_minutes=120,
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="Convoy Delayed > 2hrs (Warning)",
            description="Alert when movement is delayed by more than 2 hours",
            alert_type="CONVOY_DELAYED",
            severity="WARNING",
            metric="movement_delay_hours",
            operator=RuleOperator.GT,
            threshold_value=2.0,
            is_scope_all=True,
            cooldown_minutes=60,
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="EAS Approaching < 90 days (Warning)",
            description="Alert for personnel with EAS approaching within 90 days",
            alert_type="EAS_APPROACHING",
            severity="WARNING",
            metric="eas_days_remaining",
            operator=RuleOperator.LT,
            threshold_value=90.0,
            is_scope_all=True,
            cooldown_minutes=1440,  # Once per day
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="Fuel Critical < 20% (Critical)",
            description="Alert when fuel level drops below 20%",
            alert_type="FUEL_CRITICAL",
            severity="CRITICAL",
            metric="fuel_level_pct",
            operator=RuleOperator.LT,
            threshold_value=20.0,
            is_scope_all=True,
            cooldown_minutes=60,
            is_active=True,
            created_by=admin.id,
        ),
        AlertRule(
            name="Ammunition Below RSR (Warning)",
            description="Alert when ammunition is below recommended supply rate",
            alert_type="AMMO_BELOW_RSR",
            severity="WARNING",
            metric="ammo_vs_rsr_pct",
            operator=RuleOperator.LT,
            threshold_value=100.0,
            is_scope_all=True,
            cooldown_minutes=120,
            is_active=True,
            created_by=admin.id,
        ),
    ]

    for rule in rules:
        # Check if rule already exists
        stmt = select(AlertRule).where(AlertRule.name == rule.name)
        result = await db.execute(stmt)
        existing = result.scalar_one_or_none()

        if not existing:
            db.add(rule)
            print(f"Created alert rule: {rule.name}")

    await db.commit()
    print("Alert rules seeding complete")

# Run from FastAPI startup or CLI
# Usage:
#   from app.seeds.alert_rules import seed_alert_rules
#   await seed_alert_rules(session)
```

---

## Part 8: Testing Checklist

```markdown
# Alert Engine Testing Checklist

## Unit Tests

- [ ] AlertEngine.evaluate_all_rules() correctly iterates active rules
- [ ] AlertEngine.evaluate_rule() respects cooldown periods
- [ ] AlertEngine.check_supply_thresholds() correctly calculates DOS
- [ ] AlertEngine.check_equipment_readiness() correctly identifies deadlined equipment
- [ ] AlertEngine.check_maintenance_deadlines() finds overdue PMs
- [ ] AlertEngine.check_personnel_thresholds() calculates strength percentage
- [ ] AlertEngine._compare_value() handles all operators (LT, LTE, GT, GTE, EQ, NEQ)
- [ ] AlertEngine.fire_alert() creates Alert and Notifications
- [ ] AlertEngine.acknowledge_alert() marks alert acknowledged
- [ ] AlertEngine.resolve_alert() marks alert resolved
- [ ] AlertEngine.escalate_alert() sets escalation
- [ ] NotificationPreference filtering works correctly

## Integration Tests

- [ ] API GET /api/v1/alerts with filters returns correct results
- [ ] API PUT /api/v1/alerts/{id}/acknowledge updates alert
- [ ] API PUT /api/v1/alerts/{id}/resolve updates alert
- [ ] API PUT /api/v1/alerts/{id}/escalate updates alert (admin only)
- [ ] API GET /api/v1/alerts/summary returns correct counts
- [ ] Alert rule CRUD endpoints work (admin only)
- [ ] Notification endpoints return user's notifications
- [ ] Preference endpoints save user preferences
- [ ] Socket.IO emission of alerts to user rooms
- [ ] Background task fires on schedule (APScheduler or Celery)

## Frontend Tests

- [ ] AlertDashboard displays active alerts
- [ ] Severity colors correctly applied
- [ ] Alert action buttons (Acknowledge, Resolve, View) work
- [ ] NotificationBell shows unread count badge
- [ ] Notification dropdown displays unread notifications
- [ ] Mark as read functionality works
- [ ] Mark all as read clears badge
- [ ] NotificationPreferences saves user choices
- [ ] Real-time alerts display as toast when received via Socket.IO

## System Tests

- [ ] Seed alert rules insert 12 default rules
- [ ] Alert engine cycle runs every 5 minutes
- [ ] Alerts fire when thresholds crossed
- [ ] Notifications created per user preferences
- [ ] Escalation notifies selected user
- [ ] Email and in-app notifications respect user channel preference
```

---

## Part 9: Configuration & Environment Variables

**File**: `.env.example`

```bash
# Alert Engine Configuration
ALERT_EVALUATION_INTERVAL_MINUTES=5  # Run alert evaluation every N minutes
ALERT_COOLDOWN_DEFAULT_MINUTES=60    # Default cooldown between alert firings

# Socket.IO Configuration
SOCKETIO_NAMESPACE=/alerts
SOCKETIO_ALLOWED_ORIGINS=http://localhost:5173,https://keystone.example.com

# Email Configuration (for notification delivery)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=alerts@keystone.example.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=KEYSTONE Alerts <alerts@keystone.example.com>

# Celery Configuration (if using Celery instead of APScheduler)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
```

---

## Part 10: Documentation

### Alert Types Reference

| Alert Type | Severity | Metric | Trigger |
|---|---|---|---|
| LOW_DOS | WARNING/CRITICAL | supply_dos | Supply below threshold days |
| LOW_READINESS | WARNING/CRITICAL | equipment_readiness_pct | Equipment readiness below % |
| CONVOY_DELAYED | WARNING | movement_delay_hours | Movement delayed beyond 2hrs |
| ANOMALY | INFO/WARNING | custom | System-detected anomaly |
| EQUIPMENT_DEADLINED | CRITICAL | equipment_readiness_pct | Critical equipment offline |
| PM_OVERDUE | WARNING | pm_overdue_days | PM overdue by > 7 days |
| PARTS_BACKORDERED | WARNING | - | Part on back order |
| CASUALTY_REPORTED | CRITICAL | - | Personnel casualty reported |
| BLOOD_PRODUCT_EXPIRING | CRITICAL | blood_product_expiry_days | Blood expires < 48hrs |
| REQUISITION_PENDING_APPROVAL | INFO | - | Requisition awaiting approval |
| REPORT_DUE | WARNING | - | Report submission due |
| STRENGTH_BELOW_THRESHOLD | WARNING | personnel_strength_pct | Unit fill < 80% |
| EAS_APPROACHING | WARNING | eas_days_remaining | Personnel EAS < 90 days |
| SECURITY_CLEARANCE_EXPIRING | WARNING | clearance_expiry_days | Clearance expires soon |
| FUEL_CRITICAL | CRITICAL | fuel_level_pct | Fuel < 20% |
| AMMO_BELOW_RSR | WARNING | ammo_vs_rsr_pct | Ammunition < RSR |

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ KEYSTONE Notifications & Alerting System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  FastAPI Backend (Python)          Frontend (React/TypeScript)   │
│  ┌──────────────────────┐           ┌────────────────────────┐  │
│  │  API Routes          │           │  AlertDashboard        │  │
│  │  /alerts             │◄──────────│  NotificationBell      │  │
│  │  /alert-rules        │           │  NotificationPrefs     │  │
│  │  /notifications      │           │  AlertToast (real-time)│  │
│  └──────────────────────┘           └────────────────────────┘  │
│           ▲                                      ▲                │
│           │                                      │                │
│           └──────────────────────┬───────────────┘                │
│                                  │ Socket.IO                     │
│  ┌──────────────────────────────────────────────┐               │
│  │  ws-relay (Node.js Socket.IO Server)         │               │
│  │  Emits: alert, unit_alert, notification      │               │
│  └──────────────────────────────────────────────┘               │
│           ▲                                                       │
│           │                                                       │
│  ┌────────┴─────────────────────────────────────┐               │
│  │  PostgreSQL Database                         │               │
│  │  ├─ alerts                                   │               │
│  │  ├─ alert_rules                              │               │
│  │  ├─ notifications                            │               │
│  │  ├─ notification_preferences                 │               │
│  │  ├─ equipment_status (readiness, fuel)      │               │
│  │  ├─ supply_status_record (DOS)               │               │
│  │  ├─ maintenance_work_orders                  │               │
│  │  └─ personnel (strength, EAS)                │               │
│  └───────────────────────────────────────────────┘               │
│           ▲                                                       │
│           │                                                       │
│  ┌────────┴─────────────────────────────────────┐               │
│  │  AlertEngine (Services)                      │               │
│  │  ├─ evaluate_all_rules()                     │               │
│  │  ├─ check_supply_thresholds()                │               │
│  │  ├─ check_equipment_readiness()              │               │
│  │  ├─ check_maintenance_deadlines()            │               │
│  │  ├─ check_personnel_thresholds()             │               │
│  │  ├─ fire_alert() + dispatch notifications    │               │
│  │  └─ acknowledge/resolve/escalate             │               │
│  └───────────────────────────────────────────────┘               │
│           ▲                                                       │
│           │                                                       │
│  ┌────────┴──────────────────────────────────┐                  │
│  │  Scheduler (APScheduler or Celery Beat)   │                  │
│  │  Runs every 5 minutes:                     │                  │
│  │  → AlertEngine.evaluate_all_rules()        │                  │
│  └────────────────────────────────────────────┘                  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 11: Deployment Notes

### Docker Considerations

If using Docker Compose with multiple services:

```yaml
# docker-compose.yml snippet
services:
  backend:
    environment:
      ALERT_EVALUATION_INTERVAL_MINUTES: 5
      SOCKETIO_NAMESPACE: /alerts
    depends_on:
      - postgres
      - ws-relay

  ws-relay:
    environment:
      ALERT_SOCKET_NAMESPACE: /alerts

  scheduler:  # Optional: separate container for background tasks
    image: keystone-backend:latest
    command: celery -A app.tasks.celery_config worker --loglevel=info
    depends_on:
      - redis
      - postgres
```

### Performance Considerations

- Alert evaluation query optimization: index `created_at`, `resolved`, `severity` on alerts table
- Large result sets: paginate alert list endpoints
- Notification delivery: batch email sends, queue async emissions
- Rule cooldown: prevents alert storm for flapping conditions
- Socket.IO memory: monitor for memory leaks in long-running ws-relay connections

### Security

- Rate limit alert endpoints
- Validate user permissions before CRUD operations on alerts/rules
- Sanitize message content before storage
- Log all escalations and resolutions for audit
- PII/classified data in alerts should respect data classification labels

---

## Summary

This prompt provides a complete enterprise alerting system for KEYSTONE including:

1. **Enhanced Alert & new Notification models** with full lifecycle management
2. **AlertEngine service** with configurable rules and threshold evaluation
3. **Background task scheduling** (APScheduler or Celery)
4. **Real-time Socket.IO integration** for push notifications
5. **Comprehensive REST API** for alert management, rules, and preferences
6. **React frontend components** for alert dashboard, notification center, and preferences
7. **Seed data** with 12 default alert rules
8. **Full testing checklist** and deployment guidance

Implement following the existing KEYSTONE patterns: async SQLAlchemy, pydantic schemas, structured logging, and role-based access control.
