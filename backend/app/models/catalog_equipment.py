"""Equipment catalog reference table — USMC TAMCN-based equipment types."""

from sqlalchemy import Boolean, Column, Integer, String, Text

from app.database import Base


class EquipmentCatalogItem(Base):
    __tablename__ = "equipment_catalog"

    id = Column(Integer, primary_key=True, index=True)
    tamcn = Column(String(10), unique=True, nullable=True, index=True)
    niin = Column(String(13), nullable=True, index=True)
    nsn = Column(String(16), nullable=True, index=True)
    nomenclature = Column(String(150), nullable=False, index=True)
    common_name = Column(String(100), nullable=True)
    category = Column(String(50), nullable=False)
    subcategory = Column(String(50), nullable=True)
    supply_class = Column(String(10), nullable=False, default="VII")
    manufacturer = Column(String(100), nullable=True)
    weight_lbs = Column(Integer, nullable=True)
    crew_size = Column(Integer, nullable=True)
    pax_capacity = Column(Integer, nullable=True)
    is_serialized = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    echelon_typical = Column(String(10), nullable=True)
    notes = Column(Text, nullable=True)
