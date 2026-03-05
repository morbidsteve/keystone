"""Unit strength tracking model for personnel readiness."""

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class UnitStrength(Base):
    __tablename__ = "unit_strengths"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    reported_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)

    # Officer strength
    authorized_officers = Column(Integer, nullable=False, default=0)
    assigned_officers = Column(Integer, nullable=False, default=0)

    # Enlisted strength
    authorized_enlisted = Column(Integer, nullable=False, default=0)
    assigned_enlisted = Column(Integer, nullable=False, default=0)

    # Personnel accounting
    attached = Column(Integer, nullable=False, default=0)
    detached = Column(Integer, nullable=False, default=0)
    tad = Column(Integer, nullable=False, default=0)
    leave = Column(Integer, nullable=False, default=0)
    medical = Column(Integer, nullable=False, default=0)
    ua = Column(Integer, nullable=False, default=0)

    # Totals
    total_authorized = Column(Integer, nullable=False, default=0)
    total_assigned = Column(Integer, nullable=False, default=0)
    fill_pct = Column(Float, nullable=False, default=0.0)

    # MOS shortfalls
    mos_shortfalls = Column(JSON, nullable=True, default=list)

    notes = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit", back_populates="strength_reports")
