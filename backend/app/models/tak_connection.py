"""TAK (Team Awareness Kit) server connection model."""

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
)
from sqlalchemy.dialects.postgresql import JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ConnectionStatus(str, enum.Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    POLLING = "polling"


class TAKProtocol(str, enum.Enum):
    TCP = "tcp"
    SSL = "ssl"
    HTTP = "http"


class TAKConnection(Base):
    """Represents a configured connection to a TAK server.

    TAK (Team Awareness Kit) servers aggregate CoT (Cursor on Target) messages
    from ATAK devices in the field. KEYSTONE connects to TAK servers to ingest
    logistics-relevant CoT data such as supply status reports, equipment
    positions, and unit location updates.
    """

    __tablename__ = "tak_connections"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # e.g., "1st Marines TAK Server"
    host = Column(String(255), nullable=False)  # TAK server hostname/IP
    port = Column(Integer, default=8089)  # Default TAK server port
    protocol = Column(SQLEnum(TAKProtocol), default=TAKProtocol.TCP)  # tcp, ssl, http
    api_port = Column(Integer, default=8443)  # REST API port

    # Authentication
    use_tls = Column(Boolean, default=True)
    verify_tls = Column(
        Boolean, default=True
    )  # verify TLS certificates (disable only for self-signed)
    cert_file = Column(String(255), nullable=True)  # path to client cert
    api_token = Column(
        String(255), nullable=True
    )  # API auth token (stored encrypted in prod)

    # Data filtering
    unit_id = Column(
        Integer, ForeignKey("units.id"), nullable=True
    )  # Associate with KEYSTONE unit
    cot_types_filter = Column(
        JSON, nullable=True
    )  # List of CoT types to ingest (e.g., ["b-r-.*", "a-f-G-.*"])
    channel_filter = Column(String(255), nullable=True)  # TAK channel name filter

    # Status
    is_active = Column(Boolean, default=True)
    last_connected = Column(DateTime(timezone=True), nullable=True)
    last_error = Column(Text, nullable=True)
    connection_status = Column(
        SQLEnum(ConnectionStatus), default=ConnectionStatus.DISCONNECTED
    )

    # Metadata
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit")
    creator = relationship("User")
