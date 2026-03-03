"""Data source configuration and processed file tracking models."""

import enum

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DataSourceType(str, enum.Enum):
    MIRC_DIRECTORY = "mirc_directory"
    IRC_SERVER = "irc_server"
    EXCEL_DIRECTORY = "excel_directory"


class DataSourceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ERROR = "error"
    CONNECTING = "connecting"
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"


class DataSource(Base):
    """Configured data ingestion source (directory watcher, IRC connection, etc.)."""

    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    source_type = Column(SQLEnum(DataSourceType), nullable=False)
    is_enabled = Column(Boolean, default=True)
    config = Column(JSON, nullable=False, default=dict)  # Type-specific configuration
    status = Column(SQLEnum(DataSourceStatus), default=DataSourceStatus.INACTIVE)
    last_run = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    files_processed = Column(Integer, default=0)
    records_ingested = Column(Integer, default=0)

    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    creator = relationship("User")
    processed_files = relationship(
        "ProcessedFile", back_populates="data_source", cascade="all, delete-orphan"
    )


class ProcessedFile(Base):
    """Tracks files already ingested by a data source to avoid re-processing."""

    __tablename__ = "processed_files"

    id = Column(Integer, primary_key=True, index=True)
    data_source_id = Column(
        Integer,
        ForeignKey("data_sources.id", ondelete="CASCADE"),
        nullable=False,
    )
    file_path = Column(String(500), nullable=False)
    file_hash = Column(String(64), nullable=True)  # SHA-256 of file contents
    records_extracted = Column(Integer, default=0)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())

    data_source = relationship("DataSource", back_populates="processed_files")

    __table_args__ = (
        UniqueConstraint("data_source_id", "file_path", name="uq_datasource_filepath"),
    )
