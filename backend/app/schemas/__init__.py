"""Pydantic schemas for KEYSTONE API."""

from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
    UserUpdate,
)
from app.schemas.supply import (
    SupplyCreate,
    SupplyUpdate,
    SupplyResponse,
    SupplyFilters,
)
from app.schemas.equipment import (
    EquipmentCreate,
    EquipmentUpdate,
    EquipmentResponse,
)
from app.schemas.transportation import (
    MovementCreate,
    MovementUpdate,
    MovementResponse,
)
from app.schemas.dashboard import (
    DashboardSummary,
    SupplyClassSummary,
    ReadinessSummary,
    SustainabilityProjection,
    AlertSummary,
)
from app.schemas.report import ReportCreate, ReportResponse
from app.schemas.unit import UnitCreate, UnitResponse
from app.schemas.data_template import (
    FieldMapping,
    CanonicalFieldResponse,
    CanonicalFieldGrouped,
    DataTemplateCreate,
    DataTemplateUpdate,
    DataTemplateResponse,
    DataTemplateListItem,
    MappingPreviewRequest,
    MappingPreviewResponse,
    AutoDetectRequest,
    AutoDetectResponse,
)
from app.schemas.tak import (
    TAKConnectionCreate,
    TAKConnectionUpdate,
    TAKConnectionResponse,
    TAKConnectionStatus,
    COTMessage,
    COTIngestRequest,
    COTIngestResponse,
    TAKTestResult,
)

__all__ = [
    "LoginRequest",
    "TokenResponse",
    "UserCreate",
    "UserResponse",
    "UserUpdate",
    "SupplyCreate",
    "SupplyUpdate",
    "SupplyResponse",
    "SupplyFilters",
    "EquipmentCreate",
    "EquipmentUpdate",
    "EquipmentResponse",
    "MovementCreate",
    "MovementUpdate",
    "MovementResponse",
    "DashboardSummary",
    "SupplyClassSummary",
    "ReadinessSummary",
    "SustainabilityProjection",
    "AlertSummary",
    "ReportCreate",
    "ReportResponse",
    "UnitCreate",
    "UnitResponse",
    "FieldMapping",
    "CanonicalFieldResponse",
    "CanonicalFieldGrouped",
    "DataTemplateCreate",
    "DataTemplateUpdate",
    "DataTemplateResponse",
    "DataTemplateListItem",
    "MappingPreviewRequest",
    "MappingPreviewResponse",
    "AutoDetectRequest",
    "AutoDetectResponse",
    "TAKConnectionCreate",
    "TAKConnectionUpdate",
    "TAKConnectionResponse",
    "TAKConnectionStatus",
    "COTMessage",
    "COTIngestRequest",
    "COTIngestResponse",
    "TAKTestResult",
]
