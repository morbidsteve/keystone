"""Maintenance work order model."""

import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.database import Base


class WorkOrderStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    AWAITING_PARTS = "AWAITING_PARTS"
    COMPLETE = "COMPLETE"


class MaintenanceWorkOrder(Base):
    __tablename__ = "maintenance_work_orders"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment_statuses.id"), nullable=True)
    work_order_number = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        SQLEnum(WorkOrderStatus), nullable=False, default=WorkOrderStatus.OPEN
    )
    priority = Column(Integer, nullable=False, default=3)
    parts_required = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    assigned_to = Column(String(100), nullable=True)
