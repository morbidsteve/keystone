"""Activity feed event log model."""

import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import JSON

from app.database import Base


class ActivityType(str, enum.Enum):
    REQUISITION = "REQUISITION"
    WORK_ORDER = "WORK_ORDER"
    CONVOY = "CONVOY"
    SUPPLY = "SUPPLY"
    ALERT = "ALERT"
    PERSONNEL = "PERSONNEL"
    REPORT = "REPORT"


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    activity_type = Column(SQLEnum(ActivityType), nullable=False, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)
    description = Column(String(500), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    unit = relationship("Unit")
    user = relationship("User")
