"""Supply catalog reference table — NSN/LIN-based supply items."""

from sqlalchemy import Boolean, Column, Integer, String, Text

from app.database import Base


class SupplyCatalogItem(Base):
    __tablename__ = "supply_catalog"

    id = Column(Integer, primary_key=True, index=True)
    nsn = Column(String(16), unique=True, nullable=True, index=True)
    niin = Column(String(13), nullable=True, index=True)
    lin = Column(String(10), nullable=True, index=True)
    dodic = Column(String(6), nullable=True, index=True)
    nomenclature = Column(String(200), nullable=False, index=True)
    common_name = Column(String(100), nullable=True)
    supply_class = Column(String(5), nullable=False, index=True)
    supply_subclass = Column(String(5), nullable=True)
    unit_of_issue = Column(String(10), nullable=False, default="EA")
    unit_of_issue_desc = Column(String(50), nullable=True)
    category = Column(String(50), nullable=True)
    subcategory = Column(String(50), nullable=True)
    is_controlled = Column(Boolean, default=False)
    is_hazmat = Column(Boolean, default=False)
    shelf_life_days = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
