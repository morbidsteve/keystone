"""Ammunition catalog reference table — DODIC-based ammunition types."""

from sqlalchemy import Boolean, Column, Float, Integer, String, Text

from app.database import Base


class AmmunitionCatalogItem(Base):
    __tablename__ = "ammunition_catalog"

    id = Column(Integer, primary_key=True, index=True)
    dodic = Column(String(6), unique=True, nullable=False, index=True)
    nsn = Column(String(16), nullable=True, index=True)
    nomenclature = Column(String(200), nullable=False, index=True)
    common_name = Column(String(100), nullable=True)
    caliber = Column(String(30), nullable=True)
    weapon_system = Column(String(100), nullable=True)
    unit_of_issue = Column(String(10), nullable=False, default="RD")
    rounds_per_unit = Column(Integer, nullable=True)
    weight_per_round_lbs = Column(Float, nullable=True)
    is_controlled = Column(Boolean, default=True)
    hazard_class = Column(String(10), nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
