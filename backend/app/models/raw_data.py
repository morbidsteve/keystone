"""Raw data ingestion tracking model."""

import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.database import Base


class SourceType(str, enum.Enum):
    MIRC = "MIRC"
    EXCEL = "EXCEL"
    GCSS_MC = "GCSS_MC"
    MANUAL = "MANUAL"


class ParseStatus(str, enum.Enum):
    PENDING = "PENDING"
    PARSED = "PARSED"
    FAILED = "FAILED"
    REVIEWED = "REVIEWED"


class RawData(Base):
    __tablename__ = "raw_data"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(SQLEnum(SourceType), nullable=False)
    original_content = Column(Text, nullable=False)
    channel_name = Column(String(100), nullable=True)
    sender = Column(String(100), nullable=True)
    file_name = Column(String(255), nullable=True)
    ingested_at = Column(DateTime(timezone=True), server_default=func.now())
    parse_status = Column(
        SQLEnum(ParseStatus), nullable=False, default=ParseStatus.PENDING
    )
    confidence_score = Column(Float, default=0.0)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
