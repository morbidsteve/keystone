"""Unit readiness snapshot and threshold models for DRRS-style tracking."""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class UnitReadinessSnapshot(Base):
    __tablename__ = "unit_readiness_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    snapshot_date = Column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )

    # Composite readiness
    overall_readiness_pct = Column(Float, nullable=False)

    # Component readiness percentages
    equipment_readiness_pct = Column(Float, nullable=True)
    supply_readiness_pct = Column(Float, nullable=True)
    personnel_fill_pct = Column(Float, nullable=True)
    training_readiness_pct = Column(Float, nullable=True)

    # DRRS ratings (T/C/S/R/P)
    t_rating = Column(String(5), nullable=False, default="T-4")
    c_rating = Column(String(5), nullable=False, default="C-4")
    s_rating = Column(String(5), nullable=False, default="S-4")
    r_rating = Column(String(5), nullable=False, default="R-4")
    p_rating = Column(String(5), nullable=False, default="P-4")

    # Metadata
    limiting_factor = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_official = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit", back_populates="readiness_snapshots")
    reported_by = relationship("User", foreign_keys=[reported_by_id])


class ReadinessThreshold(Base):
    __tablename__ = "readiness_thresholds"
    __table_args__ = (
        UniqueConstraint("echelon", "metric_name", name="uq_echelon_metric"),
    )

    id = Column(Integer, primary_key=True, index=True)
    echelon = Column(String(30), nullable=False)
    metric_name = Column(String(100), nullable=False)
    green_min_pct = Column(Float, nullable=False, default=90.0)
    amber_min_pct = Column(Float, nullable=False, default=75.0)
    notes = Column(Text, nullable=True)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
