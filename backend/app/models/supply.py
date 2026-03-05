"""Supply status tracking models."""

import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class SupplyClass(str, enum.Enum):
    I = "I"  # noqa: E741
    II = "II"
    III = "III"
    IV = "IV"
    V = "V"
    VI = "VI"
    VII = "VII"
    VIII = "VIII"
    IX = "IX"
    X = "X"


class SupplyStatus(str, enum.Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"


class SupplyStatusRecord(Base):
    __tablename__ = "supply_statuses"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    supply_class = Column(SQLEnum(SupplyClass), nullable=False, index=True)
    item_description = Column(String(255), nullable=False)
    on_hand_qty = Column(Float, nullable=False)
    required_qty = Column(Float, nullable=False)
    dos = Column(Float, nullable=False)
    consumption_rate = Column(Float, nullable=False, default=0.0)
    reorder_point = Column(Float, nullable=True)
    status = Column(SQLEnum(SupplyStatus), nullable=False)
    reported_at = Column(DateTime(timezone=True), server_default=func.now())
    source = Column(String(50), nullable=True)
    raw_data_id = Column(Integer, ForeignKey("raw_data.id"), nullable=True)
    catalog_item_id = Column(Integer, ForeignKey("supply_catalog.id"), nullable=True)

    unit = relationship("Unit", back_populates="supply_statuses")
