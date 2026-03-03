"""Map data API endpoints for the Geospatial Logistics COP."""

from typing import List, Optional, Set

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.permissions import get_accessible_units
from app.database import get_db
from app.models.unit import Unit
from app.models.transportation import Movement, MovementStatus
from app.models.location import (
    EntityType,
    Location,
    Route,
    SupplyPoint,
)
from app.models.alert import Alert
from app.models.user import User
from app.schemas.map import (
    ConvoyEndpoint,
    ConvoyPosition,
    MapAlertResponse,
    MapAllResponse,
    MapConvoyResponse,
    MapRouteResponse,
    MapSupplyPointResponse,
    MapUnitResponse,
)

router = APIRouter()

VALID_LAYERS: Set[str] = {"units", "convoys", "supply_points", "routes", "alerts"}

_ECHELON_SIDC = {
    "MEF": "SFGPU------G",
    "DIV": "SFGPU------F",
    "REGT": "SFGPU------E",
    "BN": "SFGPU------D",
    "CO": "SFGPU------C",
}


@router.get("/units", response_model=List[MapUnitResponse])
async def get_map_units(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all units that have position data, filtered by user access."""
    accessible_ids = await get_accessible_units(db, current_user)

    # Query units that have lat/lon set, filtered by accessible unit IDs
    result = await db.execute(
        select(Unit)
        .where(
            Unit.latitude.isnot(None),
            Unit.longitude.isnot(None),
            Unit.id.in_(accessible_ids),
        )
        .limit(500)
    )
    units = result.scalars().all()

    # Also check locations table for accessible units
    loc_result = await db.execute(
        select(Location).where(
            Location.entity_type == EntityType.UNIT,
            Location.entity_id.in_(accessible_ids),
        )
    )
    locations = {loc.entity_id: loc for loc in loc_result.scalars().all()}

    responses = []
    for unit in units:
        lat = unit.latitude
        lon = unit.longitude
        source = "CONFIGURED"
        last_update = None

        # Override with location table if more recent
        if unit.id in locations:
            loc = locations[unit.id]
            lat = loc.latitude
            lon = loc.longitude
            source = loc.position_source.value if loc.position_source else "CONFIGURED"
            last_update = loc.last_updated.isoformat() if loc.last_updated else None

        responses.append(
            MapUnitResponse(
                unit_id=unit.id,
                name=unit.name,
                abbreviation=unit.abbreviation,
                echelon=unit.echelon.value,
                latitude=lat,
                longitude=lon,
                position_source=source,
                last_position_update=last_update,
                supply_status=None,
                symbol_sidc=_ECHELON_SIDC.get(unit.echelon.value, "SFGPU------A"),
            )
        )

    return responses


@router.get("/convoys", response_model=List[MapConvoyResponse])
async def get_map_convoys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return active/recent convoys with position data, filtered by user access."""
    accessible_ids = await get_accessible_units(db, current_user)

    result = await db.execute(
        select(Movement)
        .where(
            Movement.status.in_(
                [
                    MovementStatus.EN_ROUTE,
                    MovementStatus.PLANNED,
                    MovementStatus.DELAYED,
                ]
            ),
            Movement.unit_id.in_(accessible_ids),
        )
        .limit(200)
    )
    movements = result.scalars().all()

    responses = []
    for m in movements:
        if not m.origin_lat or not m.origin_lon or not m.dest_lat or not m.dest_lon:
            continue

        current_pos = None
        if m.current_lat and m.current_lon:
            current_pos = ConvoyPosition(lat=m.current_lat, lon=m.current_lon)

        responses.append(
            MapConvoyResponse(
                convoy_id=m.id,
                name=m.convoy_id or f"Movement-{m.id}",
                origin=ConvoyEndpoint(
                    name=m.origin, lat=m.origin_lat, lon=m.origin_lon
                ),
                destination=ConvoyEndpoint(
                    name=m.destination, lat=m.dest_lat, lon=m.dest_lon
                ),
                current_position=current_pos,
                route_geometry=[
                    [m.origin_lat, m.origin_lon],
                    *([[m.current_lat, m.current_lon]] if m.current_lat else []),
                    [m.dest_lat, m.dest_lon],
                ],
                status=m.status.value,
                vehicle_count=m.vehicle_count,
                cargo_summary=m.cargo_description,
                departure_time=(
                    m.departure_time.isoformat() if m.departure_time else None
                ),
                eta=m.eta.isoformat() if m.eta else None,
                speed_kph=m.speed_kph,
                heading=m.heading,
            )
        )

    return responses


@router.get("/supply-points", response_model=List[MapSupplyPointResponse])
async def get_map_supply_points(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return supply points filtered by user unit access."""
    accessible_ids = await get_accessible_units(db, current_user)

    result = await db.execute(
        select(SupplyPoint)
        .options(selectinload(SupplyPoint.parent_unit))
        .where(SupplyPoint.parent_unit_id.in_(accessible_ids))
        .limit(200)
    )
    points = result.scalars().all()

    responses = []
    for p in points:
        parent_name = None
        if p.parent_unit:
            parent_name = p.parent_unit.abbreviation or p.parent_unit.name

        responses.append(
            MapSupplyPointResponse(
                id=p.id,
                name=p.name,
                point_type=p.point_type.value,
                latitude=p.latitude,
                longitude=p.longitude,
                status=p.status.value,
                parent_unit_name=parent_name,
                capacity_notes=p.capacity_notes,
            )
        )

    return responses


@router.get("/routes", response_model=List[MapRouteResponse])
async def get_map_routes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all configured routes (MSRs, ASRs)."""
    result = await db.execute(select(Route).limit(100))
    routes = result.scalars().all()

    return [
        MapRouteResponse(
            id=r.id,
            name=r.name,
            route_type=r.route_type.value,
            status=r.status.value,
            waypoints=r.waypoints or [],
            description=r.description,
        )
        for r in routes
    ]


@router.get("/alerts/geo", response_model=List[MapAlertResponse])
async def get_map_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return active alerts with geographic position from their unit, filtered by access."""
    accessible_ids = await get_accessible_units(db, current_user)

    result = await db.execute(
        select(Alert)
        .options(selectinload(Alert.unit))
        .where(
            Alert.acknowledged == False,  # noqa: E712
            Alert.unit_id.in_(accessible_ids),
        )
        .order_by(Alert.created_at.desc())
        .limit(50)
    )
    alerts = result.scalars().all()

    responses = []
    for a in alerts:
        lat = None
        lon = None

        # Get location from unit
        if a.unit and a.unit.latitude:
            lat = a.unit.latitude
            lon = a.unit.longitude

        responses.append(
            MapAlertResponse(
                id=a.id,
                alert_type=a.alert_type.value,
                severity=a.severity.value,
                message=a.message,
                unit_name=a.unit.name if a.unit else "Unknown",
                latitude=lat,
                longitude=lon,
            )
        )

    return responses


@router.get("/all", response_model=MapAllResponse)
async def get_map_all(
    layers: Optional[str] = Query(None, description="Comma-separated layer names"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Combined endpoint returning all map layers in a single request."""
    requested = set(layers.split(",")) & VALID_LAYERS if layers else VALID_LAYERS

    response = MapAllResponse()

    if "units" in requested:
        response.units = await get_map_units(db=db, current_user=current_user)
    if "convoys" in requested:
        response.convoys = await get_map_convoys(db=db, current_user=current_user)
    if "supply_points" in requested:
        response.supply_points = await get_map_supply_points(
            db=db, current_user=current_user
        )
    if "routes" in requested:
        response.routes = await get_map_routes(db=db, current_user=current_user)
    if "alerts" in requested:
        response.alerts = await get_map_alerts(db=db, current_user=current_user)

    return response
