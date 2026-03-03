"""API router aggregation."""

from fastapi import APIRouter

from app.api.auth import router as auth_router
from app.api.dashboard import router as dashboard_router
from app.api.supply import router as supply_router
from app.api.equipment import router as equipment_router
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

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(supply_router, prefix="/supply", tags=["Supply"])
api_router.include_router(equipment_router, prefix="/equipment", tags=["Equipment"])
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
api_router.include_router(data_sources_router, prefix="/data-sources", tags=["Data Sources"])
api_router.include_router(map_router, prefix="/map", tags=["Map"])
