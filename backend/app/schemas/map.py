"""Pydantic schemas for map API endpoints."""

from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


class MapUnitResponse(BaseModel):
    unit_id: int
    name: str
    abbreviation: str
    echelon: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    position_source: str = "CONFIGURED"
    last_position_update: Optional[str] = None
    supply_status: Optional[str] = None
    readiness_pct: Optional[float] = None
    worst_supply_class: Optional[str] = None
    worst_dos: Optional[float] = None
    symbol_sidc: str = "SFGPU------D"

    model_config = ConfigDict(from_attributes=True)


class ConvoyPosition(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class ConvoyEndpoint(BaseModel):
    name: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class MapConvoyResponse(BaseModel):
    convoy_id: int
    name: str
    origin: ConvoyEndpoint
    destination: ConvoyEndpoint
    current_position: Optional[ConvoyPosition] = None
    route_geometry: List[List[float]] = []
    status: str
    vehicle_count: int
    cargo_summary: Optional[str] = None
    departure_time: Optional[str] = None
    eta: Optional[str] = None
    speed_kph: Optional[float] = None
    heading: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class MapSupplyPointResponse(BaseModel):
    id: int
    name: str
    point_type: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    status: str
    parent_unit_name: Optional[str] = None
    capacity_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MapRouteResponse(BaseModel):
    id: int
    name: str
    route_type: str
    status: str
    waypoints: List[List[float]] = []
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MapAlertResponse(BaseModel):
    id: int
    alert_type: str
    severity: str
    message: str
    unit_name: str
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)

    model_config = ConfigDict(from_attributes=True)


class MapAllResponse(BaseModel):
    units: List[MapUnitResponse] = []
    convoys: List[MapConvoyResponse] = []
    supply_points: List[MapSupplyPointResponse] = []
    routes: List[MapRouteResponse] = []
    alerts: List[MapAlertResponse] = []
