"""Equipment status tracking model."""

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class EquipmentStatus(Base):
    __tablename__ = "equipment_statuses"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    tamcn = Column(String(20), nullable=False)
    nomenclature = Column(String(100), nullable=False)
    total_possessed = Column(Integer, nullable=False)
    mission_capable = Column(Integer, nullable=False)
    not_mission_capable_maintenance = Column(Integer, nullable=False, default=0)
    not_mission_capable_supply = Column(Integer, nullable=False, default=0)
    readiness_pct = Column(Float, nullable=False)
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    source = Column(String(50), nullable=True)
    raw_data_id = Column(Integer, ForeignKey("raw_data.id"), nullable=True)

    unit = relationship("Unit", back_populates="equipment_statuses")
