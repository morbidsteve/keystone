"""Logistics recommendation model for predictive logistics engine."""

import enum

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import JSON

from app.database import Base


class RecommendationStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    DENIED = "DENIED"
    EXECUTED = "EXECUTED"
    EXPIRED = "EXPIRED"


class LogisticsRecommendation(Base):
    __tablename__ = "logistics_recommendations"

    id = Column(Integer, primary_key=True, index=True)

    # What triggered this?
    recommendation_type = Column(String(30), nullable=False)
    triggered_by_rule_id = Column(Integer, ForeignKey("alert_rules.id"), nullable=True)
    triggered_by_metric = Column(String(200), nullable=True)

    # What's recommended?
    target_unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    description = Column(Text, nullable=False)

    # Details
    recommended_items = Column(JSON, nullable=True)
    recommended_source = Column(String(200), nullable=True)
    recommended_vehicles = Column(JSON, nullable=True)
    recommended_personnel = Column(JSON, nullable=True)
    recommended_route = Column(Text, nullable=True)
    estimated_weight = Column(Float, nullable=True)
    estimated_cost = Column(Float, nullable=True)
    estimated_duration = Column(String(50), nullable=True)

    # Approval workflow
    status = Column(String(20), default="PENDING", index=True)
    assigned_to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_to_role = Column(String(20), nullable=True)

    # Outcomes
    generated_movement_id = Column(Integer, nullable=True)
    generated_requisition_id = Column(Integer, nullable=True)

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    decided_at = Column(DateTime(timezone=True), nullable=True)
    decided_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)

    # Expiration
    expires_at = Column(DateTime(timezone=True), nullable=True)

    target_unit = relationship("Unit", foreign_keys=[target_unit_id])
