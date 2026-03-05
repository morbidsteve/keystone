"""Pure Python route-planning and convoy utility functions."""

import math
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple


def calculate_route_time(
    distance_km: float,
    speed_kph: float,
    num_checkpoints: int = 0,
    stop_time_per_checkpoint_min: float = 10.0,
) -> timedelta:
    """Calculate total travel time including checkpoint stops.

    Args:
        distance_km: Total route distance in kilometres.
        speed_kph: Average march speed in km/h.
        num_checkpoints: Number of checkpoints along the route.
        stop_time_per_checkpoint_min: Average stop time per checkpoint in minutes.

    Returns:
        Total estimated travel time as a timedelta.
    """
    if speed_kph <= 0:
        raise ValueError("speed_kph must be positive")

    driving_hours = distance_km / speed_kph
    stop_hours = (num_checkpoints * stop_time_per_checkpoint_min) / 60.0
    return timedelta(hours=driving_hours + stop_hours)


def generate_march_table(
    departure_time: datetime,
    distance_km: float,
    march_speed_kph: float,
    catch_up_speed_kph: float,
    checkpoints: Optional[List[Dict[str, float]]] = None,
) -> dict:
    """Generate a march table with timing for each checkpoint.

    Args:
        departure_time: Convoy start-point time.
        distance_km: Total route distance in km.
        march_speed_kph: Normal march speed.
        catch_up_speed_kph: Catch-up speed for stragglers.
        checkpoints: List of dicts with keys ``name``, ``distance_km``,
            and optional ``stop_minutes``.

    Returns:
        Dict with ``departure``, ``arrival``, ``total_time_hours``,
        ``march_speed_kph``, ``catch_up_speed_kph``, and ``checkpoints`` list.
    """
    if march_speed_kph <= 0:
        raise ValueError("march_speed_kph must be positive")

    if checkpoints is None:
        checkpoints = []

    table_checkpoints: List[dict] = []
    current_time = departure_time
    current_distance = 0.0

    for cp in checkpoints:
        cp_distance = float(cp.get("distance_km", 0))
        leg_distance = cp_distance - current_distance
        if leg_distance > 0:
            leg_hours = leg_distance / march_speed_kph
            current_time += timedelta(hours=leg_hours)

        stop_minutes = float(cp.get("stop_minutes", 10))
        table_checkpoints.append(
            {
                "name": cp.get("name", ""),
                "distance_km": cp_distance,
                "arrival_time": current_time.isoformat(),
                "departure_time": (
                    current_time + timedelta(minutes=stop_minutes)
                ).isoformat(),
                "stop_minutes": stop_minutes,
            }
        )
        current_time += timedelta(minutes=stop_minutes)
        current_distance = cp_distance

    # Final leg to destination
    remaining = distance_km - current_distance
    if remaining > 0:
        current_time += timedelta(hours=remaining / march_speed_kph)

    total_hours = (current_time - departure_time).total_seconds() / 3600.0

    return {
        "departure": departure_time.isoformat(),
        "arrival": current_time.isoformat(),
        "total_time_hours": round(total_hours, 2),
        "march_speed_kph": march_speed_kph,
        "catch_up_speed_kph": catch_up_speed_kph,
        "checkpoints": table_checkpoints,
    }


_DEFAULT_MPG: Dict[str, float] = {
    "HMMWV": 8.0,
    "LMTV": 6.0,
    "HEMTT": 4.0,
    "STRYKER": 3.0,
    "M1_ABRAMS": 0.6,
    "DEFAULT": 5.0,
}


def calculate_fuel_requirements(
    distance_km: float,
    num_vehicles: int,
    vehicle_types: Optional[List[str]] = None,
    mpg_defaults: Optional[Dict[str, float]] = None,
) -> dict:
    """Estimate fuel requirements for a convoy movement.

    Args:
        distance_km: Total route distance in km.
        num_vehicles: Number of vehicles.
        vehicle_types: Optional list of vehicle type strings (one per vehicle).
        mpg_defaults: Optional override for miles-per-gallon lookup.

    Returns:
        Dict with ``total_gallons``, ``total_litres``, ``distance_miles``,
        and per-vehicle breakdown.
    """
    mpg_map = mpg_defaults if mpg_defaults is not None else _DEFAULT_MPG
    distance_miles = distance_km * 0.621371

    if vehicle_types is None:
        vehicle_types = ["DEFAULT"] * num_vehicles

    breakdown: List[dict] = []
    total_gallons = 0.0

    for vtype in vehicle_types:
        mpg = mpg_map.get(vtype.upper(), mpg_map.get("DEFAULT", 5.0))
        gallons = distance_miles / mpg
        total_gallons += gallons
        breakdown.append(
            {
                "vehicle_type": vtype,
                "mpg": mpg,
                "gallons_required": round(gallons, 1),
            }
        )

    return {
        "distance_km": distance_km,
        "distance_miles": round(distance_miles, 1),
        "num_vehicles": num_vehicles,
        "total_gallons": round(total_gallons, 1),
        "total_litres": round(total_gallons * 3.78541, 1),
        "vehicles": breakdown,
    }


def validate_convoy_plan(plan: dict) -> Tuple[bool, List[str]]:
    """Validate a convoy plan dict has minimum required fields.

    Args:
        plan: Dict representation of the convoy plan.

    Returns:
        Tuple of (is_valid, list_of_error_messages).
    """
    errors: List[str] = []

    if not plan.get("name"):
        errors.append("Convoy plan must have a name")
    if not plan.get("unit_id"):
        errors.append("Convoy plan must be assigned to a unit")
    if not plan.get("route_name"):
        errors.append("Route name is required")
    if not plan.get("departure_time_planned"):
        errors.append("Planned departure time is required")
    if not plan.get("total_distance_km") or plan["total_distance_km"] <= 0:
        errors.append("Total distance must be a positive number")
    if not plan.get("convoy_commander_id"):
        errors.append("Convoy commander must be assigned")
    if not plan.get("comm_plan"):
        errors.append("Communications plan is required")
    if not plan.get("recovery_plan"):
        errors.append("Recovery plan is required")

    return (len(errors) == 0, errors)


def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculate the great-circle distance between two points in kilometres.

    Uses the Haversine formula.

    Args:
        lat1: Latitude of point 1 (degrees).
        lon1: Longitude of point 1 (degrees).
        lat2: Latitude of point 2 (degrees).
        lon2: Longitude of point 2 (degrees).

    Returns:
        Distance in kilometres.
    """
    R = 6371.0  # Earth radius in km

    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c
