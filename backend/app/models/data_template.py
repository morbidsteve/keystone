"""Data template model for reusable schema mappings."""

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DataTemplate(Base):
    __tablename__ = "data_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    source_type = Column(String(20), nullable=False)  # EXCEL, CSV, MIRC, TAK, CUSTOM
    # Field mappings: maps source column names -> KEYSTONE canonical field names
    # Format: {"source_col_name": {"target_entity": "supply_status", "target_field": "on_hand_qty", "transform": "float"}}
    field_mappings = Column(JSON, nullable=False)
    # Header detection: column header patterns to auto-match this template
    header_patterns = Column(JSON, nullable=True)  # list of known header row values
    # Metadata
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    creator = relationship("User")

    def __repr__(self) -> str:
        return f"<DataTemplate {self.name} ({self.source_type})>"
