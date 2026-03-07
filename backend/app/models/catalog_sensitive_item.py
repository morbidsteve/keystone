"""Sensitive item catalog reference table — dynamic replacement for frontend hard-coded catalog."""

from sqlalchemy import Boolean, Column, DateTime, Integer, String, JSON
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.sql import func

from app.database import Base
from app.models.custody import SensitiveItemType


class SensitiveItemCatalogEntry(Base):
    __tablename__ = "sensitive_item_catalog"

    id = Column(Integer, primary_key=True, index=True)
    nomenclature = Column(String(200), nullable=False, index=True)
    nsn = Column(String(20), nullable=True, index=True)
    item_type = Column(SQLEnum(SensitiveItemType), nullable=False, index=True)
    tamcn = Column(String(20), nullable=True, index=True)
    aliases = Column(JSON, default=list)  # JSON for SQLite compatibility in tests
    category = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
