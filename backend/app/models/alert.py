"""Alert model for threshold-based notifications."""

import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.types import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class MetricType(str, enum.Enum):
    DOS = "DOS"
    READINESS_PCT = "READINESS_PCT"
    ON_HAND_QTY = "ON_HAND_QTY"
    FILL_RATE = "FILL_RATE"
    MAINTENANCE_BACKLOG = "MAINTENANCE_BACKLOG"
    FUEL_LEVEL = "FUEL_LEVEL"


class ScopeType(str, enum.Enum):
    ANY_UNIT = "ANY_UNIT"
    SPECIFIC_UNIT = "SPECIFIC_UNIT"
    ECHELON = "ECHELON"
    SUBORDINATES = "SUBORDINATES"


class RecommendationType(str, enum.Enum):
    RESUPPLY = "RESUPPLY"
    MAINTENANCE = "MAINTENANCE"
    FUEL_DELIVERY = "FUEL_DELIVERY"
    PERSONNEL_MOVE = "PERSONNEL_MOVE"


class RecommendationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    EXECUTED = "EXECUTED"
    EXPIRED = "EXPIRED"


class AlertType(str, enum.Enum):
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


class AlertSeverity(str, enum.Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AlertEntityType(str, enum.Enum):
    EQUIPMENT = "EQUIPMENT"
    SUPPLY = "SUPPLY"
    PERSONNEL = "PERSONNEL"
    MOVEMENT = "MOVEMENT"
    MAINTENANCE = "MAINTENANCE"
    UNIT = "UNIT"
    REQUISITION = "REQUISITION"


class RuleOperator(str, enum.Enum):
    LT = "LT"
    LTE = "LTE"
    GT = "GT"
    GTE = "GTE"
    EQ = "EQ"
    NEQ = "NEQ"


class NotificationChannel(str, enum.Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    BOTH = "BOTH"
    NONE = "NONE"


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    alert_type = Column(SQLEnum(AlertType), nullable=False)
    severity = Column(SQLEnum(AlertSeverity), nullable=False)
    message = Column(Text, nullable=False)
    threshold_value = Column(Float, nullable=True)
    actual_value = Column(Float, nullable=True)
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Entity reference
    entity_type = Column(SQLEnum(AlertEntityType), nullable=True)
    entity_id = Column(Integer, nullable=True, index=True)
    link_url = Column(String(500), nullable=True)

    # Alert lifecycle — resolved
    resolved = Column(Boolean, default=False, index=True)
    resolved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Escalation
    escalated = Column(Boolean, default=False)
    escalated_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    escalated_at = Column(DateTime(timezone=True), nullable=True)

    # Rule linkage
    rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=True)
    metric_value = Column(Float, nullable=True)

    # Metadata
    auto_generated = Column(Boolean, default=True)

    acknowledged_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit", back_populates="alerts")
    notifications = relationship("Notification", back_populates="alert")


class AlertRule(Base):
    __tablename__ = "alert_rules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    alert_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False)
    metric = Column(String(100), nullable=False)
    operator = Column(SQLEnum(RuleOperator), nullable=False)
    threshold_value = Column(Float, nullable=False)
    is_scope_all = Column(Boolean, default=True)
    scope_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    cooldown_minutes = Column(Integer, default=60)
    last_fired_at = Column(DateTime(timezone=True), nullable=True)
    is_active = Column(Boolean, default=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Advanced scoping
    scope_type = Column(String(20), default="ANY_UNIT")
    scope_echelon = Column(String(10), nullable=True)
    include_subordinates = Column(Boolean, default=False)

    # Advanced metric
    metric_type = Column(String(30), nullable=True)  # MetricType
    metric_item_filter = Column(JSON, nullable=True)  # {supply_class, tamcn, ...}

    # Notification targets
    notify_roles = Column(JSON, nullable=True)  # ["S4", "CO", ...]
    check_interval_minutes = Column(Integer, default=15)

    # Predictive logistics
    auto_recommend = Column(Boolean, default=False)
    recommend_type = Column(String(30), nullable=True)
    recommend_source_unit_id = Column(Integer, ForeignKey("units.id"), nullable=True)
    recommend_assign_to_role = Column(String(20), nullable=True)

    scope_unit = relationship("Unit", foreign_keys=[scope_unit_id])
    recommend_source_unit = relationship("Unit", foreign_keys=[recommend_source_unit_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.id"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    link_url = Column(String(500), nullable=True)
    channel = Column(SQLEnum(NotificationChannel), default=NotificationChannel.IN_APP)
    is_read = Column(Boolean, default=False, index=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="notifications")
    alert = relationship("Alert", back_populates="notifications")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    alert_type = Column(String(50), nullable=False)
    channel = Column(String(20), default="IN_APP")
    min_severity = Column(String(20), default="INFO")

    user = relationship("User", backref="notification_preferences")

    __table_args__ = (
        UniqueConstraint("user_id", "alert_type", name="uq_user_alert_type"),
    )
