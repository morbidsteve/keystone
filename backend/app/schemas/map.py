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
    mgrs: Optional[str] = None
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
    mgrs: Optional[str] = None


class ConvoyEndpoint(BaseModel):
    name: str
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    mgrs: Optional[str] = None


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
    mgrs: Optional[str] = None
    status: str
    parent_unit_name: Optional[str] = None
    capacity_notes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class RouteWaypointResponse(BaseModel):
    lat: float
    lon: float
    mgrs: Optional[str] = None
    label: Optional[str] = None


class MapRouteResponse(BaseModel):
    id: int
    name: str
    route_type: str
    status: str
    waypoints: List[RouteWaypointResponse] = []
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
    mgrs: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class MapAllResponse(BaseModel):
    units: List[MapUnitResponse] = []
    convoys: List[MapConvoyResponse] = []
    supply_points: List[MapSupplyPointResponse] = []
    routes: List[MapRouteResponse] = []
    alerts: List[MapAlertResponse] = []


# --- Request schemas ---


class PositionUpdateRequest(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    mgrs: Optional[str] = Field(None, max_length=20)


class SupplyPointCreateRequest(BaseModel):
    name: str
    point_type: str  # Validated against SupplyPointType enum
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    mgrs: Optional[str] = Field(None, max_length=20)
    parent_unit_id: Optional[int] = None
    status: str = "ACTIVE"
    capacity_notes: Optional[str] = None


class SupplyPointUpdateRequest(BaseModel):
    name: Optional[str] = None
    point_type: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    mgrs: Optional[str] = Field(None, max_length=20)
    parent_unit_id: Optional[int] = None
    status: Optional[str] = None
    capacity_notes: Optional[str] = None


class RouteWaypointRequest(BaseModel):
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    mgrs: Optional[str] = Field(None, max_length=20)
    label: Optional[str] = None


class RouteCreateRequest(BaseModel):
    name: str
    route_type: str
    status: str = "OPEN"
    waypoints: list[RouteWaypointRequest] = []
    description: Optional[str] = None


class RouteUpdateRequest(BaseModel):
    name: Optional[str] = None
    route_type: Optional[str] = None
    status: Optional[str] = None
    waypoints: Optional[list[RouteWaypointRequest]] = None
    description: Optional[str] = None


class NearbyResponse(BaseModel):
    units: list[MapUnitResponse] = []
    supply_points: list[MapSupplyPointResponse] = []
    alerts: list[MapAlertResponse] = []
