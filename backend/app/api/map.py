"""Map data API endpoints for the Geospatial Logistics COP."""

import math
from typing import List, Optional, Set

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.auth import get_current_user
from app.core.permissions import get_accessible_units, require_role
from app.database import get_db
from app.models.unit import Unit
from app.models.transportation import Movement, MovementStatus
from app.models.location import (
    EntityType,
    Location,
    PositionSource,
    Route,
    RouteStatus,
    RouteType,
    SupplyPoint,
    SupplyPointStatus,
    SupplyPointType,
)
from app.models.alert import Alert
from app.models.user import Role, User
from app.schemas.map import (
    ConvoyEndpoint,
    ConvoyPosition,
    MapAlertResponse,
    MapAllResponse,
    MapConvoyResponse,
    MapRouteResponse,
    MapSupplyPointResponse,
    MapUnitResponse,
    NearbyResponse,
    PositionUpdateRequest,
    RouteCreateRequest,
    RouteUpdateRequest,
    RouteWaypointResponse,
    SupplyPointCreateRequest,
    SupplyPointUpdateRequest,
)
from app.utils.coordinates import latlon_to_mgrs, validate_and_normalize

router = APIRouter()

VALID_LAYERS: Set[str] = {"units", "convoys", "supply_points", "routes", "alerts"}

_ECHELON_SIDC = {
    "MEF": "SFGPU------G",
    "DIV": "SFGPU------F",
    "REGT": "SFGPU------E",
    "BN": "SFGPU------D",
    "CO": "SFGPU------C",
}


def _safe_mgrs(lat: Optional[float], lon: Optional[float]) -> Optional[str]:
    """Compute MGRS from lat/lon, returning None if coordinates are missing."""
    if lat is not None and lon is not None:
        try:
            return latlon_to_mgrs(lat, lon)
        except Exception:
            return None
    return None


# ---------------------------------------------------------------------------
# GET endpoints (existing, updated with MGRS)
# ---------------------------------------------------------------------------


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
        mgrs_val = unit.mgrs

        # Override with location table if more recent
        if unit.id in locations:
            loc = locations[unit.id]
            lat = loc.latitude
            lon = loc.longitude
            source = loc.position_source.value if loc.position_source else "CONFIGURED"
            last_update = loc.last_updated.isoformat() if loc.last_updated else None
            mgrs_val = loc.mgrs

        # Compute MGRS if not already set
        if not mgrs_val:
            mgrs_val = _safe_mgrs(lat, lon)

        responses.append(
            MapUnitResponse(
                unit_id=unit.id,
                name=unit.name,
                abbreviation=unit.abbreviation,
                echelon=unit.echelon.value,
                latitude=lat,
                longitude=lon,
                mgrs=mgrs_val,
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

        origin_mgrs = m.origin_mgrs or _safe_mgrs(m.origin_lat, m.origin_lon)
        dest_mgrs = m.dest_mgrs or _safe_mgrs(m.dest_lat, m.dest_lon)

        current_pos = None
        if m.current_lat and m.current_lon:
            current_mgrs = m.current_mgrs or _safe_mgrs(m.current_lat, m.current_lon)
            current_pos = ConvoyPosition(
                lat=m.current_lat, lon=m.current_lon, mgrs=current_mgrs
            )

        responses.append(
            MapConvoyResponse(
                convoy_id=m.id,
                name=m.convoy_id or f"Movement-{m.id}",
                origin=ConvoyEndpoint(
                    name=m.origin,
                    lat=m.origin_lat,
                    lon=m.origin_lon,
                    mgrs=origin_mgrs,
                ),
                destination=ConvoyEndpoint(
                    name=m.destination,
                    lat=m.dest_lat,
                    lon=m.dest_lon,
                    mgrs=dest_mgrs,
                ),
                current_position=current_pos,
                route_geometry=[
                    [float(m.origin_lat), float(m.origin_lon)],
                    *(
                        [[float(m.current_lat), float(m.current_lon)]]
                        if m.current_lat
                        else []
                    ),
                    [float(m.dest_lat), float(m.dest_lon)],
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

        mgrs_val = p.mgrs or _safe_mgrs(p.latitude, p.longitude)

        responses.append(
            MapSupplyPointResponse(
                id=p.id,
                name=p.name,
                point_type=p.point_type.value,
                latitude=p.latitude,
                longitude=p.longitude,
                mgrs=mgrs_val,
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

    responses = []
    for r in routes:
        wp_list = []
        for wp in (r.waypoints or []):
            if isinstance(wp, dict):
                wp_list.append(RouteWaypointResponse(
                    lat=wp.get("lat", 0.0),
                    lon=wp.get("lon", 0.0),
                    mgrs=wp.get("mgrs"),
                    label=wp.get("label"),
                ))
            elif isinstance(wp, (list, tuple)) and len(wp) >= 2:
                wp_list.append(RouteWaypointResponse(
                    lat=wp[0],
                    lon=wp[1],
                ))
        responses.append(MapRouteResponse(
            id=r.id,
            name=r.name,
            route_type=r.route_type.value,
            status=r.status.value,
            waypoints=wp_list,
            description=r.description,
        ))
    return responses


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

        mgrs_val = _safe_mgrs(lat, lon)

        responses.append(
            MapAlertResponse(
                id=a.id,
                alert_type=a.alert_type.value,
                severity=a.severity.value,
                message=a.message,
                unit_name=a.unit.name if a.unit else "Unknown",
                latitude=lat,
                longitude=lon,
                mgrs=mgrs_val,
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


# ---------------------------------------------------------------------------
# WRITE endpoints (new)
# ---------------------------------------------------------------------------


@router.post("/units/{unit_id}/position", response_model=MapUnitResponse)
async def update_unit_position(
    unit_id: int,
    request: PositionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.COMMANDER, Role.S3, Role.S4])),
):
    """Update a unit's position via GPS or MGRS. Requires ADMIN, COMMANDER, S3, or S4 role."""
    # RBAC: verify user can access this unit
    accessible_ids = await get_accessible_units(db, current_user)
    if unit_id not in accessible_ids:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this unit's data",
        )

    # Validate and normalize coordinates
    try:
        lat, lon, mgrs_val = validate_and_normalize(
            request.latitude, request.longitude, request.mgrs
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Fetch the unit
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalar_one_or_none()
    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Unit not found"
        )

    # Update unit coordinates
    unit.latitude = lat
    unit.longitude = lon
    unit.mgrs = mgrs_val

    # Update or create Location record
    loc_result = await db.execute(
        select(Location).where(
            Location.entity_type == EntityType.UNIT,
            Location.entity_id == unit_id,
        )
    )
    location = loc_result.scalar_one_or_none()

    if location:
        location.latitude = lat
        location.longitude = lon
        location.mgrs = mgrs_val
        location.position_source = PositionSource.MANUAL
        location.placed_by_id = current_user.id
        location.position_override = True
    else:
        location = Location(
            entity_type=EntityType.UNIT,
            entity_id=unit_id,
            name=unit.name,
            latitude=lat,
            longitude=lon,
            mgrs=mgrs_val,
            position_source=PositionSource.MANUAL,
            placed_by_id=current_user.id,
            position_override=True,
        )
        db.add(location)

    await db.flush()

    return MapUnitResponse(
        unit_id=unit.id,
        name=unit.name,
        abbreviation=unit.abbreviation,
        echelon=unit.echelon.value,
        latitude=lat,
        longitude=lon,
        mgrs=mgrs_val,
        position_source="MANUAL",
        last_position_update=None,
        supply_status=None,
        symbol_sidc=_ECHELON_SIDC.get(unit.echelon.value, "SFGPU------A"),
    )


@router.post("/supply-points", response_model=MapSupplyPointResponse)
async def create_supply_point(
    request: SupplyPointCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.S4, Role.S3, Role.COMMANDER])),
):
    """Create a new supply point. Requires ADMIN, S4, S3, or COMMANDER role."""
    # Validate coordinates
    try:
        lat, lon, mgrs_val = validate_and_normalize(
            request.latitude, request.longitude, request.mgrs
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    # Validate parent_unit_id against user's accessible units
    if request.parent_unit_id is not None:
        accessible_ids = await get_accessible_units(db, current_user)
        if current_user.role != Role.ADMIN and request.parent_unit_id not in accessible_ids:
            raise HTTPException(status_code=403, detail="Access denied")

    # Validate point_type against enum
    try:
        point_type_enum = SupplyPointType(request.point_type)
    except ValueError:
        valid_types = [t.value for t in SupplyPointType]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid point_type '{request.point_type}'. Must be one of: {valid_types}",
        )

    # Validate status against enum
    try:
        status_enum = SupplyPointStatus(request.status)
    except ValueError:
        valid_statuses = [s.value for s in SupplyPointStatus]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{request.status}'. Must be one of: {valid_statuses}",
        )

    supply_point = SupplyPoint(
        name=request.name,
        point_type=point_type_enum,
        latitude=lat,
        longitude=lon,
        mgrs=mgrs_val,
        parent_unit_id=request.parent_unit_id,
        status=status_enum,
        capacity_notes=request.capacity_notes,
        created_by=current_user.id,
    )
    db.add(supply_point)
    await db.flush()
    await db.refresh(supply_point)

    # Eagerly load parent_unit for response
    parent_name = None
    if supply_point.parent_unit_id:
        unit_result = await db.execute(
            select(Unit).where(Unit.id == supply_point.parent_unit_id)
        )
        parent_unit = unit_result.scalar_one_or_none()
        if parent_unit:
            parent_name = parent_unit.abbreviation or parent_unit.name

    return MapSupplyPointResponse(
        id=supply_point.id,
        name=supply_point.name,
        point_type=supply_point.point_type.value,
        latitude=supply_point.latitude,
        longitude=supply_point.longitude,
        mgrs=supply_point.mgrs,
        status=supply_point.status.value,
        parent_unit_name=parent_name,
        capacity_notes=supply_point.capacity_notes,
    )


@router.put("/supply-points/{supply_point_id}", response_model=MapSupplyPointResponse)
async def update_supply_point(
    supply_point_id: int,
    request: SupplyPointUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.S4, Role.S3, Role.COMMANDER])),
):
    """Update an existing supply point. Requires ADMIN, S4, S3, or COMMANDER role."""
    result = await db.execute(
        select(SupplyPoint)
        .options(selectinload(SupplyPoint.parent_unit))
        .where(SupplyPoint.id == supply_point_id)
    )
    supply_point = result.scalar_one_or_none()
    if not supply_point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Supply point not found"
        )

    # Update name
    if request.name is not None:
        supply_point.name = request.name

    # Update point_type
    if request.point_type is not None:
        try:
            supply_point.point_type = SupplyPointType(request.point_type)
        except ValueError:
            valid_types = [t.value for t in SupplyPointType]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid point_type '{request.point_type}'. Must be one of: {valid_types}",
            )

    # Update status
    if request.status is not None:
        try:
            supply_point.status = SupplyPointStatus(request.status)
        except ValueError:
            valid_statuses = [s.value for s in SupplyPointStatus]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{request.status}'. Must be one of: {valid_statuses}",
            )

    # Validate and update parent_unit_id
    if request.parent_unit_id is not None:
        accessible_ids = await get_accessible_units(db, current_user)
        if current_user.role != Role.ADMIN and request.parent_unit_id not in accessible_ids:
            raise HTTPException(status_code=403, detail="Access denied")
        supply_point.parent_unit_id = request.parent_unit_id

    # Update coordinates if any coordinate field provided
    has_coords = (
        request.latitude is not None
        or request.longitude is not None
        or request.mgrs is not None
    )
    if has_coords:
        try:
            lat, lon, mgrs_val = validate_and_normalize(
                request.latitude, request.longitude, request.mgrs
            )
            supply_point.latitude = lat
            supply_point.longitude = lon
            supply_point.mgrs = mgrs_val
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)
            )

    # Update capacity notes
    if request.capacity_notes is not None:
        supply_point.capacity_notes = request.capacity_notes

    await db.flush()
    await db.refresh(supply_point)

    parent_name = None
    if supply_point.parent_unit:
        parent_name = supply_point.parent_unit.abbreviation or supply_point.parent_unit.name

    return MapSupplyPointResponse(
        id=supply_point.id,
        name=supply_point.name,
        point_type=supply_point.point_type.value,
        latitude=supply_point.latitude,
        longitude=supply_point.longitude,
        mgrs=supply_point.mgrs,
        status=supply_point.status.value,
        parent_unit_name=parent_name,
        capacity_notes=supply_point.capacity_notes,
    )


@router.put(
    "/supply-points/{supply_point_id}/position",
    response_model=MapSupplyPointResponse,
)
async def update_supply_point_position(
    supply_point_id: int,
    request: PositionUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.S4, Role.S3, Role.COMMANDER])),
):
    """Quick position-only update for a supply point."""
    result = await db.execute(
        select(SupplyPoint)
        .options(selectinload(SupplyPoint.parent_unit))
        .where(SupplyPoint.id == supply_point_id)
    )
    supply_point = result.scalar_one_or_none()
    if not supply_point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Supply point not found"
        )

    try:
        lat, lon, mgrs_val = validate_and_normalize(
            request.latitude, request.longitude, request.mgrs
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    supply_point.latitude = lat
    supply_point.longitude = lon
    supply_point.mgrs = mgrs_val

    await db.flush()

    parent_name = None
    if supply_point.parent_unit:
        parent_name = supply_point.parent_unit.abbreviation or supply_point.parent_unit.name

    return MapSupplyPointResponse(
        id=supply_point.id,
        name=supply_point.name,
        point_type=supply_point.point_type.value,
        latitude=supply_point.latitude,
        longitude=supply_point.longitude,
        mgrs=supply_point.mgrs,
        status=supply_point.status.value,
        parent_unit_name=parent_name,
        capacity_notes=supply_point.capacity_notes,
    )


@router.delete("/supply-points/{supply_point_id}", status_code=status.HTTP_200_OK)
async def delete_supply_point(
    supply_point_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN])),
):
    """Soft-delete a supply point by setting status to INACTIVE. Admin only."""
    result = await db.execute(
        select(SupplyPoint).where(SupplyPoint.id == supply_point_id)
    )
    supply_point = result.scalar_one_or_none()
    if not supply_point:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Supply point not found"
        )

    supply_point.status = SupplyPointStatus.INACTIVE
    await db.flush()

    return {"detail": "Supply point deactivated", "id": supply_point_id}


@router.post("/routes", response_model=MapRouteResponse)
async def create_route(
    request: RouteCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.S3, Role.COMMANDER])),
):
    """Create a new route (MSR, ASR, etc.). Requires ADMIN, S3, or COMMANDER role."""
    # Validate route_type
    try:
        route_type_enum = RouteType(request.route_type)
    except ValueError:
        valid_types = [t.value for t in RouteType]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid route_type '{request.route_type}'. Must be one of: {valid_types}",
        )

    # Validate status
    try:
        status_enum = RouteStatus(request.status)
    except ValueError:
        valid_statuses = [s.value for s in RouteStatus]
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status '{request.status}'. Must be one of: {valid_statuses}",
        )

    # Process waypoints: validate and normalize each coordinate
    waypoints_data = []
    for i, wp in enumerate(request.waypoints):
        try:
            lat, lon, mgrs_val = validate_and_normalize(
                wp.latitude, wp.longitude, wp.mgrs
            )
            waypoint = {"lat": lat, "lon": lon, "mgrs": mgrs_val}
            if wp.label:
                waypoint["label"] = wp.label
            waypoints_data.append(waypoint)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid coordinates for waypoint {i}: {e}",
            )

    route = Route(
        name=request.name,
        route_type=route_type_enum,
        status=status_enum,
        waypoints=waypoints_data,
        description=request.description,
        created_by_id=current_user.id,
    )
    db.add(route)
    await db.flush()
    await db.refresh(route)

    wp_responses = [
        RouteWaypointResponse(
            lat=wp.get("lat", 0.0),
            lon=wp.get("lon", 0.0),
            mgrs=wp.get("mgrs"),
            label=wp.get("label"),
        )
        for wp in (route.waypoints or [])
    ]

    return MapRouteResponse(
        id=route.id,
        name=route.name,
        route_type=route.route_type.value,
        status=route.status.value,
        waypoints=wp_responses,
        description=route.description,
    )


@router.put("/routes/{route_id}", response_model=MapRouteResponse)
async def update_route(
    route_id: int,
    request: RouteUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([Role.ADMIN, Role.S3, Role.COMMANDER])),
):
    """Update an existing route. Requires ADMIN, S3, or COMMANDER role."""
    result = await db.execute(select(Route).where(Route.id == route_id))
    route = result.scalar_one_or_none()
    if not route:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Route not found"
        )

    # Update name
    if request.name is not None:
        route.name = request.name

    # Update route_type
    if request.route_type is not None:
        try:
            route.route_type = RouteType(request.route_type)
        except ValueError:
            valid_types = [t.value for t in RouteType]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid route_type '{request.route_type}'. Must be one of: {valid_types}",
            )

    # Update status
    if request.status is not None:
        try:
            route.status = RouteStatus(request.status)
        except ValueError:
            valid_statuses = [s.value for s in RouteStatus]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status '{request.status}'. Must be one of: {valid_statuses}",
            )

    # Update description
    if request.description is not None:
        route.description = request.description

    # Update waypoints if provided
    if request.waypoints is not None:
        waypoints_data = []
        for i, wp in enumerate(request.waypoints):
            try:
                lat, lon, mgrs_val = validate_and_normalize(
                    wp.latitude, wp.longitude, wp.mgrs
                )
                waypoint = {"lat": lat, "lon": lon, "mgrs": mgrs_val}
                if wp.label:
                    waypoint["label"] = wp.label
                waypoints_data.append(waypoint)
            except ValueError as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid coordinates for waypoint {i}: {e}",
                )
        route.waypoints = waypoints_data

    route.updated_by_id = current_user.id

    await db.flush()
    await db.refresh(route)

    wp_responses = [
        RouteWaypointResponse(
            lat=wp.get("lat", 0.0),
            lon=wp.get("lon", 0.0),
            mgrs=wp.get("mgrs"),
            label=wp.get("label"),
        )
        for wp in (route.waypoints or [])
    ]

    return MapRouteResponse(
        id=route.id,
        name=route.name,
        route_type=route.route_type.value,
        status=route.status.value,
        waypoints=wp_responses,
        description=route.description,
    )


@router.get("/nearby", response_model=NearbyResponse)
async def get_nearby(
    lat: Optional[float] = None,
    lon: Optional[float] = None,
    mgrs: Optional[str] = None,
    radius_km: float = Query(5.0, ge=0.1, le=100.0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Find units, supply points, and alerts near a given position."""
    # Normalize the center point
    try:
        center_lat, center_lon, _ = validate_and_normalize(lat, lon, mgrs)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    accessible_ids = await get_accessible_units(db, current_user)

    # Approximate degree range for the bounding box filter
    # 1 degree latitude ~ 111 km
    lat_range = radius_km / 111.0
    # 1 degree longitude ~ 111 km * cos(lat)
    cos_lat = math.cos(math.radians(center_lat))
    lon_range = radius_km / (111.0 * cos_lat) if cos_lat > 0 else radius_km / 111.0

    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Compute distance in km between two lat/lon points."""
        r = 6371.0  # Earth radius in km
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (
            math.sin(d_lat / 2) ** 2
            + math.cos(math.radians(lat1))
            * math.cos(math.radians(lat2))
            * math.sin(d_lon / 2) ** 2
        )
        return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    # --- Nearby units ---
    unit_result = await db.execute(
        select(Unit).where(
            Unit.latitude.isnot(None),
            Unit.longitude.isnot(None),
            Unit.id.in_(accessible_ids),
            Unit.latitude.between(center_lat - lat_range, center_lat + lat_range),
            Unit.longitude.between(center_lon - lon_range, center_lon + lon_range),
        )
    )
    nearby_units = []
    for unit in unit_result.scalars().all():
        dist = _haversine(center_lat, center_lon, unit.latitude, unit.longitude)
        if dist <= radius_km:
            mgrs_val = unit.mgrs or _safe_mgrs(unit.latitude, unit.longitude)
            nearby_units.append(
                MapUnitResponse(
                    unit_id=unit.id,
                    name=unit.name,
                    abbreviation=unit.abbreviation,
                    echelon=unit.echelon.value,
                    latitude=unit.latitude,
                    longitude=unit.longitude,
                    mgrs=mgrs_val,
                    supply_status=None,
                    symbol_sidc=_ECHELON_SIDC.get(unit.echelon.value, "SFGPU------A"),
                )
            )

    # --- Nearby supply points ---
    sp_result = await db.execute(
        select(SupplyPoint)
        .options(selectinload(SupplyPoint.parent_unit))
        .where(
            SupplyPoint.parent_unit_id.in_(accessible_ids),
            SupplyPoint.status != SupplyPointStatus.INACTIVE,
            SupplyPoint.latitude.between(
                center_lat - lat_range, center_lat + lat_range
            ),
            SupplyPoint.longitude.between(
                center_lon - lon_range, center_lon + lon_range
            ),
        )
    )
    nearby_sps = []
    for sp in sp_result.scalars().all():
        dist = _haversine(center_lat, center_lon, sp.latitude, sp.longitude)
        if dist <= radius_km:
            parent_name = None
            if sp.parent_unit:
                parent_name = sp.parent_unit.abbreviation or sp.parent_unit.name
            mgrs_val = sp.mgrs or _safe_mgrs(sp.latitude, sp.longitude)
            nearby_sps.append(
                MapSupplyPointResponse(
                    id=sp.id,
                    name=sp.name,
                    point_type=sp.point_type.value,
                    latitude=sp.latitude,
                    longitude=sp.longitude,
                    mgrs=mgrs_val,
                    status=sp.status.value,
                    parent_unit_name=parent_name,
                    capacity_notes=sp.capacity_notes,
                )
            )

    # --- Nearby alerts (via unit position) ---
    alert_result = await db.execute(
        select(Alert)
        .options(selectinload(Alert.unit))
        .where(
            Alert.acknowledged == False,  # noqa: E712
            Alert.unit_id.in_(accessible_ids),
        )
        .order_by(Alert.created_at.desc())
        .limit(50)
    )
    nearby_alerts = []
    for a in alert_result.scalars().all():
        if a.unit and a.unit.latitude is not None and a.unit.longitude is not None:
            dist = _haversine(
                center_lat, center_lon, a.unit.latitude, a.unit.longitude
            )
            if dist <= radius_km:
                mgrs_val = _safe_mgrs(a.unit.latitude, a.unit.longitude)
                nearby_alerts.append(
                    MapAlertResponse(
                        id=a.id,
                        alert_type=a.alert_type.value,
                        severity=a.severity.value,
                        message=a.message,
                        unit_name=a.unit.name,
                        latitude=a.unit.latitude,
                        longitude=a.unit.longitude,
                        mgrs=mgrs_val,
                    )
                )

    return NearbyResponse(
        units=nearby_units,
        supply_points=nearby_sps,
        alerts=nearby_alerts,
    )
