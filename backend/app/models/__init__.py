"""SQLAlchemy models for KEYSTONE."""

from app.models.user import User, Role
from app.models.unit import Unit, Echelon
from app.models.supply import SupplyStatusRecord, SupplyClass, SupplyStatus
from app.models.equipment import (
    EquipmentStatus,
    Equipment,
    EquipmentAssetStatus,
    EquipmentFault,
    FaultSeverity,
    EquipmentDriverAssignment,
)
from app.models.transportation import Movement, MovementStatus
from app.models.maintenance import (
    MaintenanceWorkOrder,
    WorkOrderStatus,
    WorkOrderCategory,
    MaintenancePart,
    PartSource,
    PartStatus,
    MaintenanceLabor,
    LaborType,
)
from app.models.report import Report, ReportType, ReportStatus, ReportExportDestination, AuthType
from app.models.raw_data import RawData, SourceType, ParseStatus
from app.models.alert import Alert, AlertType, AlertSeverity
from app.models.canonical_schema import CanonicalField
from app.models.data_template import DataTemplate
from app.models.tak_connection import TAKConnection, ConnectionStatus, TAKProtocol
from app.models.data_source import (
    DataSource,
    DataSourceType,
    DataSourceStatus,
    ProcessedFile,
)
from app.models.system_settings import SystemSetting
from app.models.location import (
    Location,
    EntityType,
    PositionSource,
    SupplyPoint,
    SupplyPointType,
    SupplyPointStatus,
    Route,
    RouteType,
    RouteStatus,
)
from app.models.personnel import (
    Personnel,
    PersonnelStatus,
    Weapon,
    AmmoLoad,
    ConvoyVehicle,
    ConvoyPersonnel,
    ConvoyRole,
)
from app.models.catalog_equipment import EquipmentCatalogItem
from app.models.catalog_supply import SupplyCatalogItem
from app.models.catalog_ammunition import AmmunitionCatalogItem
from app.models.readiness_snapshot import UnitReadinessSnapshot, ReadinessThreshold
from app.models.unit_strength import UnitStrength

__all__ = [
    "User",
    "Role",
    "Unit",
    "Echelon",
    "SupplyStatusRecord",
    "SupplyClass",
    "SupplyStatus",
    "EquipmentStatus",
    "Equipment",
    "EquipmentAssetStatus",
    "EquipmentFault",
    "FaultSeverity",
    "EquipmentDriverAssignment",
    "Movement",
    "MovementStatus",
    "MaintenanceWorkOrder",
    "WorkOrderStatus",
    "WorkOrderCategory",
    "MaintenancePart",
    "PartSource",
    "PartStatus",
    "MaintenanceLabor",
    "LaborType",
    "Report",
    "ReportType",
    "ReportStatus",
    "ReportExportDestination",
    "AuthType",
    "RawData",
    "SourceType",
    "ParseStatus",
    "Alert",
    "AlertType",
    "AlertSeverity",
    "CanonicalField",
    "DataTemplate",
    "TAKConnection",
    "ConnectionStatus",
    "TAKProtocol",
    "DataSource",
    "DataSourceType",
    "DataSourceStatus",
    "ProcessedFile",
    "SystemSetting",
    "Location",
    "EntityType",
    "PositionSource",
    "SupplyPoint",
    "SupplyPointType",
    "SupplyPointStatus",
    "Route",
    "RouteType",
    "RouteStatus",
    "Personnel",
    "PersonnelStatus",
    "Weapon",
    "AmmoLoad",
    "ConvoyVehicle",
    "ConvoyPersonnel",
    "ConvoyRole",
    "EquipmentCatalogItem",
    "SupplyCatalogItem",
    "AmmunitionCatalogItem",
    "UnitReadinessSnapshot",
    "ReadinessThreshold",
    "UnitStrength",
]
