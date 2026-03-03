"""Pydantic schemas for TAK server integration."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field, field_serializer

from app.models.tak_connection import ConnectionStatus, TAKProtocol


# --- TAK Connection Schemas ---


class TAKConnectionBase(BaseModel):
    """Base schema for TAK connection data."""

    name: str = Field(..., min_length=1, max_length=100)
    host: str = Field(..., min_length=1, max_length=255)
    port: int = Field(default=8089, ge=1, le=65535)
    protocol: TAKProtocol = TAKProtocol.TCP
    api_port: int = Field(default=8443, ge=1, le=65535)
    use_tls: bool = True
    verify_tls: bool = True
    cert_file: Optional[str] = Field(None, max_length=255)
    api_token: Optional[str] = Field(None, max_length=255)
    unit_id: Optional[int] = None
    cot_types_filter: Optional[List[str]] = None
    channel_filter: Optional[str] = Field(None, max_length=255)
    is_active: bool = True


class TAKConnectionCreate(TAKConnectionBase):
    """Schema for creating a new TAK connection."""

    pass


class TAKConnectionUpdate(BaseModel):
    """Schema for updating an existing TAK connection."""

    name: Optional[str] = Field(None, min_length=1, max_length=100)
    host: Optional[str] = Field(None, min_length=1, max_length=255)
    port: Optional[int] = Field(None, ge=1, le=65535)
    protocol: Optional[TAKProtocol] = None
    api_port: Optional[int] = Field(None, ge=1, le=65535)
    use_tls: Optional[bool] = None
    verify_tls: Optional[bool] = None
    cert_file: Optional[str] = Field(None, max_length=255)
    api_token: Optional[str] = Field(None, max_length=255)
    unit_id: Optional[int] = None
    cot_types_filter: Optional[List[str]] = None
    channel_filter: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class TAKConnectionResponse(TAKConnectionBase):
    """Schema for TAK connection API response.

    The api_token field is masked in responses to prevent token leakage.
    Only the last 4 characters are shown.
    """

    id: int
    connection_status: ConnectionStatus = ConnectionStatus.DISCONNECTED
    last_connected: Optional[datetime] = None
    last_error: Optional[str] = None
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    @field_serializer("api_token")
    def mask_api_token(self, value: Optional[str], _info) -> Optional[str]:
        """Mask the API token in responses, showing only last 4 chars."""
        if not value:
            return value
        if len(value) <= 4:
            return "****"
        return "****" + value[-4:]

    model_config = ConfigDict(from_attributes=True)


class TAKConnectionStatus(BaseModel):
    """Schema for TAK connection status information."""

    connection_id: int
    name: str
    status: str
    connected_at: Optional[str] = None
    last_poll: Optional[str] = None
    last_error: Optional[str] = None
    messages_received: int = 0


# --- CoT Message Schemas ---


class COTPosition(BaseModel):
    """Position data from a CoT message."""

    lat: float = 0.0
    lon: float = 0.0
    hae: float = 0.0  # height above ellipsoid
    ce: float = 0.0  # circular error
    le: float = 0.0  # linear error


class COTSupplyItem(BaseModel):
    """Supply data extracted from a CoT logistics element."""

    supply_class: str
    on_hand: float = 0.0
    authorized: float = 0.0
    dos: float = 0.0
    required: float = 0.0
    item_description: str = ""


class COTEquipmentItem(BaseModel):
    """Equipment data extracted from a CoT logistics element."""

    tamcn: str = ""
    nomenclature: str = ""
    mission_capable: int = 0
    total: int = 0
    not_mission_capable: int = 0
    readiness_pct: float = 0.0


class COTMessage(BaseModel):
    """Parsed CoT (Cursor on Target) message representation."""

    uid: str
    cot_type: str
    category: str
    event_time: Optional[str] = None
    start_time: Optional[str] = None
    stale_time: Optional[str] = None
    how: Optional[str] = None
    position: Optional[COTPosition] = None
    callsign: Optional[str] = None
    group_name: Optional[str] = None
    group_role: Optional[str] = None
    remarks: Optional[str] = None
    logistics: List[COTSupplyItem] = []
    equipment: List[COTEquipmentItem] = []


class COTIngestRequest(BaseModel):
    """Request body for manual CoT XML ingestion."""

    xml_content: str = Field(..., min_length=10)
    connection_id: Optional[int] = None


class COTIngestResponse(BaseModel):
    """Response from CoT message ingestion."""

    success: bool
    message: str
    parsed: Optional[COTMessage] = None
    errors: Optional[List[str]] = None


class TAKTestResult(BaseModel):
    """Result from testing TAK server connectivity."""

    success: bool
    status_code: Optional[int] = None
    latency_ms: Optional[float] = None
    server_info: Optional[str] = None
    message: str
