"""Canonical schema definition for KEYSTONE data mapping."""

from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSON

from app.database import Base


class CanonicalField(Base):
    __tablename__ = "canonical_fields"

    id = Column(Integer, primary_key=True, index=True)
    entity_name = Column(String(50), nullable=False, index=True)
    field_name = Column(String(50), nullable=False)
    display_name = Column(String(100), nullable=False)
    data_type = Column(
        String(20), nullable=False
    )  # string, integer, float, datetime, enum
    is_required = Column(Boolean, default=False)
    enum_values = Column(JSON, nullable=True)
    description = Column(Text, nullable=True)
    entity_group = Column(
        String(50), nullable=True
    )  # For UI grouping: "Supply", "Equipment", etc.

    def __repr__(self) -> str:
        return f"<CanonicalField {self.entity_name}.{self.field_name}>"
