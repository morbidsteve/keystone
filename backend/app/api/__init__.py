"""API router aggregation."""

from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.supply import router as supply_router
from app.api.equipment import router as equipment_router
from app.api.equipment_individual import router as equipment_individual_router
from app.api.transportation import router as transportation_router
from app.api.reports import router as reports_router
from app.api.ingestion import router as ingestion_router
from app.api.alerts import router as alerts_router
from app.api.units import router as units_router
from app.api.schema_mapping import router as schema_mapping_router
from app.api.tak import router as tak_router
from app.api.settings import router as settings_router
from app.api.data_sources import router as data_sources_router
from app.api.map import router as map_router
from app.api.personnel import router as personnel_router
from app.api.convoy_manifest import router as convoy_manifest_router
from app.api.maintenance import router as maintenance_router
from app.api.maintenance_analytics import router as maintenance_analytics_router
from app.api.simulator import router as simulator_router
from app.api.catalog import router as catalog_router
from app.api.readiness import router as readiness_router
from app.api.requisitions import router as requisitions_router
from app.api.inventory import router as inventory_router
from app.api.manning import router as manning_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(supply_router, prefix="/supply", tags=["Supply"])
api_router.include_router(equipment_router, prefix="/equipment", tags=["Equipment"])
api_router.include_router(
    equipment_individual_router,
    prefix="/equipment/individual",
    tags=["Equipment Individual"],
)
api_router.include_router(
    transportation_router, prefix="/transportation", tags=["Transportation"]
)
api_router.include_router(reports_router, prefix="/reports", tags=["Reports"])
api_router.include_router(ingestion_router, prefix="/ingestion", tags=["Ingestion"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])
api_router.include_router(units_router, prefix="/units", tags=["Units"])
api_router.include_router(
    schema_mapping_router, prefix="/schema-mapping", tags=["Schema Mapping"]
)
api_router.include_router(tak_router, prefix="/tak", tags=["TAK Integration"])
api_router.include_router(settings_router, prefix="/settings", tags=["Settings"])
api_router.include_router(
    data_sources_router, prefix="/data-sources", tags=["Data Sources"]
)
api_router.include_router(map_router, prefix="/map", tags=["Map"])
api_router.include_router(personnel_router, prefix="/personnel", tags=["Personnel"])
api_router.include_router(
    convoy_manifest_router, prefix="/transportation", tags=["Convoy Manifest"]
)
api_router.include_router(
    maintenance_router, prefix="/maintenance", tags=["Maintenance"]
)
api_router.include_router(
    maintenance_analytics_router,
    prefix="/maintenance",
    tags=["Maintenance Analytics"],
)
api_router.include_router(
    simulator_router, prefix="/simulator", tags=["Simulator"]
)
api_router.include_router(catalog_router, prefix="/catalog", tags=["Catalog"])
api_router.include_router(readiness_router, prefix="/readiness", tags=["Readiness"])
api_router.include_router(
    requisitions_router, prefix="/requisitions", tags=["Requisitions"]
)
api_router.include_router(inventory_router, prefix="/inventory", tags=["Inventory"])
api_router.include_router(manning_router, prefix="/manning", tags=["Manning"])
