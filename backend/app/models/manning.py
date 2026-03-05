"""Manning, billet structure, and qualification models."""

from sqlalchemy import (
    Boolean,
    Column,
    Date,
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


class BilletStructure(Base):
    """Table of Organization billet definition."""

    __tablename__ = "billet_structures"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(
        Integer, ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True
    )
    billet_id_code = Column(String(30), unique=True, nullable=False, index=True)
    billet_title = Column(String(100), nullable=False)
    mos_required = Column(String(10), nullable=True)
    rank_required = Column(String(20), nullable=True)
    is_key_billet = Column(Boolean, default=False)
    is_filled = Column(Boolean, default=False)
    filled_by_id = Column(
        Integer,
        ForeignKey("personnel.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    filled_date = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit", back_populates="billets")
    assigned_personnel = relationship(
        "Personnel",
        foreign_keys=[filled_by_id],
        back_populates="billet_assignments",
    )


class ManningSnapshot(Base):
    """Point-in-time manning snapshot for a unit."""

    __tablename__ = "manning_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(
        Integer, ForeignKey("units.id", ondelete="CASCADE"), nullable=False, index=True
    )
    snapshot_date = Column(DateTime(timezone=True), server_default=func.now())
    authorized_total = Column(Integer, nullable=False, default=0)
    assigned_total = Column(Integer, nullable=False, default=0)
    present_for_duty = Column(Integer, nullable=False, default=0)
    fill_rate_pct = Column(Float, nullable=True)
    mos_shortfalls = Column(JSON, nullable=True)
    rank_distribution = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    unit = relationship("Unit", back_populates="manning_snapshots")


class Qualification(Base):
    """Personnel qualification record."""

    __tablename__ = "qualifications"

    id = Column(Integer, primary_key=True, index=True)
    personnel_id = Column(
        Integer,
        ForeignKey("personnel.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    qualification_type = Column(String(50), nullable=False)
    qualification_name = Column(String(100), nullable=False)
    date_achieved = Column(Date, nullable=True)
    expiration_date = Column(Date, nullable=True)
    is_current = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    personnel = relationship("Personnel", back_populates="qualifications")
