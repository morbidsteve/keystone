# KEYSTONE — Transportation & Movement Module Expansion

## Mission

Expand KEYSTONE's transportation and movement tracking system to support **pre-mission convoy planning, lift request management, real-time convoy tracking with route visualization, and post-mission analytics**. This enables S4 personnel to plan convoys with validated routes, march tables, and personnel assignments; request transportation support via a lift request board; and track active movements on an integrated map with route overlays.

The system is built on existing movement infrastructure (Movement, ConvoyVehicle, ConvoyPersonnel models) and extends it with pre-mission planning, resource scheduling, and intelligent routing.

---

## Database Models

### New Models to Create

Create the following new models in `backend/app/models/`:

#### `convoy_planning.py` — Pre-Mission Planning Documents

```python
"""Convoy planning, lift requests, and route management models."""

import enum
from datetime import datetime, timedelta

from sqlalchemy import (
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ConvoyPlanStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    APPROVED = "APPROVED"
    EXECUTING = "EXECUTING"
    COMPLETE = "COMPLETE"
    CANCELED = "CANCELED"


class RiskAssessmentLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EXTREME = "EXTREME"


class LiftRequestPriority(str, enum.Enum):
    ROUTINE = "ROUTINE"
    PRIORITY = "PRIORITY"
    EMERGENCY = "EMERGENCY"


class LiftRequestStatus(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    SCHEDULED = "SCHEDULED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    CANCELED = "CANCELED"


class CargoType(str, enum.Enum):
    PERSONNEL = "PERSONNEL"
    EQUIPMENT = "EQUIPMENT"
    SUPPLY = "SUPPLY"
    MIXED = "MIXED"


class ConvoyPlan(Base):
    """Pre-mission convoy planning document.

    Captures the full planning context: route, timing, personnel,
    risk assessment, contingencies, and approval status.
    """
    __tablename__ = "convoy_plans"
    __table_args__ = (
        Index("idx_convoy_plans_unit_status", "unit_id", "status"),
        Index("idx_convoy_plans_created_by", "created_by"),
    )

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Route planning
    route_name = Column(String(100), nullable=True)
    route_description = Column(Text, nullable=True)
    total_distance_km = Column(Float, nullable=True)
    estimated_duration_hours = Column(Float, nullable=True)
    route_primary = Column(
        Text, nullable=True
    )  # JSON waypoints: [{"lat": X, "lon": Y, "name": "CP1"}, ...]
    route_alternate = Column(
        Text, nullable=True
    )  # JSON waypoints for alternate route

    # Timing
    departure_time_planned = Column(DateTime(timezone=True), nullable=True)
    sp_time = Column(DateTime(timezone=True), nullable=True)  # Start Point time
    rp_time = Column(DateTime(timezone=True), nullable=True)  # Release Point time
    brief_time = Column(DateTime(timezone=True), nullable=True)
    rehearsal_time = Column(DateTime(timezone=True), nullable=True)

    # Command & admin
    movement_credit_number = Column(String(50), nullable=True)
    convoy_commander_id = Column(
        Integer, ForeignKey("personnel.id"), nullable=True
    )
    status = Column(
        SQLEnum(ConvoyPlanStatus), nullable=False, default=ConvoyPlanStatus.DRAFT
    )
    risk_assessment_level = Column(
        SQLEnum(RiskAssessmentLevel), nullable=True, default=RiskAssessmentLevel.MEDIUM
    )

    # Contingency plans (Text; can store structured data as JSON)
    comm_plan = Column(
        Text, nullable=True
    )  # JSON: {"primary_freq": "40.5", "alternate_freq": "41.2", "callsigns": {...}}
    recovery_plan = Column(Text, nullable=True)
    medevac_plan = Column(Text, nullable=True)

    # Relationships
    unit = relationship("Unit")
    created_by_user = relationship("User")
    convoy_commander = relationship("Personnel")
    serials = relationship(
        "ConvoySerial", back_populates="convoy_plan", cascade="all, delete-orphan"
    )


class ConvoySerial(Base):
    """Logical grouping within a convoy (e.g., S1, S2 for heavy vehicles; S3 for supply).

    Controls march order, spacing, speeds, and assigns a serial commander.
    """
    __tablename__ = "convoy_serials"
    __table_args__ = (Index("idx_convoy_serials_plan", "convoy_plan_id"),)

    id = Column(Integer, primary_key=True, index=True)
    convoy_plan_id = Column(
        Integer, ForeignKey("convoy_plans.id", ondelete="CASCADE"), nullable=False
    )
    serial_number = Column(String(10), nullable=False)  # "S1", "S2", etc.
    serial_commander_id = Column(
        Integer, ForeignKey("personnel.id"), nullable=True
    )
    vehicle_count = Column(Integer, nullable=False, default=0)
    pax_count = Column(Integer, nullable=False, default=0)
    march_order = Column(Integer, nullable=False)  # Sequence within convoy

    # Tactical spacing / march parameters
    march_speed_kph = Column(Float, nullable=True, default=40.0)
    catch_up_speed_kph = Column(Float, nullable=True, default=60.0)
    interval_meters = Column(Integer, nullable=True, default=50)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    convoy_plan = relationship("ConvoyPlan", back_populates="serials")
    serial_commander = relationship("Personnel")


class LiftRequest(Base):
    """Request for transportation support.

    Originated by a unit needing transport; routed to supporting unit
    for scheduling into a convoy (Movement).
    """
    __tablename__ = "lift_requests"
    __table_args__ = (
        Index("idx_lift_requests_requesting_unit", "requesting_unit_id"),
        Index("idx_lift_requests_assigned_movement", "assigned_movement_id"),
        Index("idx_lift_requests_status", "status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    requesting_unit_id = Column(
        Integer, ForeignKey("units.id"), nullable=False, index=True
    )
    supporting_unit_id = Column(
        Integer, ForeignKey("units.id"), nullable=True
    )  # Initially null; assigned by planner

    # Cargo definition
    cargo_type = Column(SQLEnum(CargoType), nullable=False)
    cargo_description = Column(Text, nullable=False)
    weight_lbs = Column(Integer, nullable=True)
    cube_ft = Column(Float, nullable=True)
    pax_count = Column(Integer, nullable=True, default=0)
    hazmat = Column(Boolean, default=False)

    # Logistics
    priority = Column(
        SQLEnum(LiftRequestPriority), nullable=False, default=LiftRequestPriority.ROUTINE
    )
    required_delivery_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(
        SQLEnum(LiftRequestStatus), nullable=False, default=LiftRequestStatus.REQUESTED
    )

    # Locations (free-text OR lat/lon; planner can geocode)
    pickup_location = Column(String(150), nullable=False)
    pickup_lat = Column(Float, nullable=True)
    pickup_lon = Column(Float, nullable=True)
    delivery_location = Column(String(150), nullable=False)
    delivery_lat = Column(Float, nullable=True)
    delivery_lon = Column(Float, nullable=True)

    # Assignment
    assigned_movement_id = Column(
        Integer, ForeignKey("movements.id"), nullable=True
    )

    # Audit
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    requesting_unit = relationship("Unit", foreign_keys=[requesting_unit_id])
    supporting_unit = relationship("Unit", foreign_keys=[supporting_unit_id])
    assigned_movement = relationship("Movement")
```

### Update Existing Models

Update the existing `Movement` model in `backend/app/models/transportation.py` to add these optional fields:

```python
# Add to Movement class:
convoy_plan_id = Column(Integer, ForeignKey("convoy_plans.id"), nullable=True)
convoy_serial_id = Column(Integer, ForeignKey("convoy_serials.id"), nullable=True)
march_table_data = Column(Text, nullable=True)  # JSON: checkpoint times and speeds

# Add relationships:
convoy_plan = relationship("ConvoyPlan")
convoy_serial = relationship("ConvoySerial")
```

Existing models `ConvoyVehicle` and `ConvoyPersonnel` remain unchanged. They link personnel and vehicles to a Movement by its ID.

---

## API Endpoints

### Convoy Planning Endpoints

Create `backend/app/api/convoy_planning.py`:

```python
@router.post("/convoy-plans", response_model=ConvoyPlanResponse, status_code=201)
async def create_convoy_plan(
    data: ConvoyPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new convoy plan (DRAFT status)."""
    # Verify user can create plans for this unit
    # Create ConvoyPlan with created_by = current_user.id
    # Return full plan with empty serials list

@router.get("/convoy-plans", response_model=list[ConvoyPlanResponse])
async def list_convoy_plans(
    unit_id: Optional[int] = Query(None),
    status: Optional[ConvoyPlanStatus] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List convoy plans with filters."""

@router.get("/convoy-plans/{plan_id}", response_model=ConvoyPlanResponse)
async def get_convoy_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single convoy plan with full detail."""

@router.put("/convoy-plans/{plan_id}", response_model=ConvoyPlanResponse)
async def update_convoy_plan(
    plan_id: int,
    data: ConvoyPlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update convoy plan (name, route, timing, commander, risk level)."""

@router.post("/convoy-plans/{plan_id}/serials", response_model=ConvoySerialResponse, status_code=201)
async def create_convoy_serial(
    plan_id: int,
    data: ConvoySerialCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add a serial to a convoy plan."""

@router.put("/convoy-plans/{plan_id}/serials/{serial_id}", response_model=ConvoySerialResponse)
async def update_convoy_serial(
    plan_id: int,
    serial_id: int,
    data: ConvoySerialUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update serial (vehicle/pax counts, speeds, commander)."""

@router.delete("/convoy-plans/{plan_id}/serials/{serial_id}", status_code=204)
async def delete_convoy_serial(
    plan_id: int,
    serial_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a serial from a plan."""

@router.post("/convoy-plans/{plan_id}/approve", response_model=ConvoyPlanResponse)
async def approve_convoy_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Transition plan to APPROVED (validates all required fields)."""
    # Check: name, unit, commander, route, timing, at least 1 serial with vehicles/pax
    # Update status to APPROVED
    # Return updated plan

@router.post("/convoy-plans/{plan_id}/execute", response_model=MovementResponse, status_code=201)
async def execute_convoy_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a Movement from a APPROVED ConvoyPlan (status -> EXECUTING).

    Returns the new Movement record with convoy_plan_id and march_table_data populated.
    """

@router.get("/convoy-plans/{plan_id}/march-table", response_model=dict)
async def get_march_table(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate/return march table for a convoy plan.

    Calculates SP, RP, checkpoint times based on:
    - Total distance
    - March speed per serial
    - Planned departure time

    Response: {
        "sp_time": "2026-03-15T06:00:00Z",
        "rp_time": "2026-03-15T12:30:00Z",
        "checkpoints": [
            {"name": "CP1", "distance_km": 25.5, "time": "2026-03-15T07:45:00Z", "speed_kph": 40},
            ...
        ],
        "serials": {
            "S1": {"march_speed": 40, "catch_up_speed": 60},
            ...
        },
        "fuel_estimate": {"total_gallons": 450, "per_vehicle": 22.5}
    }
    """

@router.post("/convoy-plans/{plan_id}/cancel", response_model=ConvoyPlanResponse)
async def cancel_convoy_plan(
    plan_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a convoy plan (status -> CANCELED)."""
```

### Lift Request Endpoints

```python
@router.post("/lift-requests", response_model=LiftRequestResponse, status_code=201)
async def create_lift_request(
    data: LiftRequestCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new lift request (REQUESTED status)."""

@router.get("/lift-requests", response_model=list[LiftRequestResponse])
async def list_lift_requests(
    requesting_unit_id: Optional[int] = Query(None),
    supporting_unit_id: Optional[int] = Query(None),
    status: Optional[LiftRequestStatus] = Query(None),
    priority: Optional[LiftRequestPriority] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List lift requests (filter by unit, status, priority)."""

@router.get("/lift-requests/{request_id}", response_model=LiftRequestResponse)
async def get_lift_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single lift request."""

@router.put("/lift-requests/{request_id}", response_model=LiftRequestResponse)
async def update_lift_request(
    request_id: int,
    data: LiftRequestUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update lift request (cargo type/desc, priority, locations, required date)."""

@router.put("/lift-requests/{request_id}/assign", response_model=LiftRequestResponse)
async def assign_lift_request_to_movement(
    request_id: int,
    data: LiftRequestAssign,  # { "movement_id": int }
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Assign a lift request to a movement (status -> SCHEDULED).

    Also updates assigned_movement_id.
    """

@router.put("/lift-requests/{request_id}/approve", response_model=LiftRequestResponse)
async def approve_lift_request(
    request_id: int,
    data: LiftRequestApprove,  # { "supporting_unit_id": int }
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Approve a lift request and assign supporting unit (status -> APPROVED)."""

@router.put("/lift-requests/{request_id}/cancel", response_model=LiftRequestResponse)
async def cancel_lift_request(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cancel a lift request (status -> CANCELED)."""
```

### Expand Existing Transportation Endpoints

In `backend/app/api/transportation.py`, add:

```python
@router.get("/active", response_model=list[MovementResponse])
async def get_active_movements(
    unit_id: Optional[int] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return EN_ROUTE or DELAYED movements with real-time GPS data."""

@router.get("/history", response_model=list[MovementHistoryResponse])
async def get_movement_history(
    unit_id: Optional[int] = Query(None),
    days: int = Query(30, ge=1, le=365),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return COMPLETE movements with analytics (on-time rate, avg delay, duration)."""
```

---

## Services

Create `backend/app/services/route_planning.py`:

```python
"""Route planning and convoy calculation utilities."""

from datetime import datetime, timedelta
from typing import Optional
import math


def calculate_route_time(
    distance_km: float,
    speed_kph: float,
    num_checkpoints: int = 0,
    stop_time_per_checkpoint_min: int = 15,
) -> timedelta:
    """Calculate total elapsed time for a route.

    Args:
        distance_km: Total distance
        speed_kph: Average march speed
        num_checkpoints: Number of planned stops
        stop_time_per_checkpoint_min: Minutes to stop at each checkpoint

    Returns:
        timedelta of total elapsed time
    """
    drive_hours = distance_km / max(speed_kph, 1)
    stop_hours = (num_checkpoints * stop_time_per_checkpoint_min) / 60.0
    total_hours = drive_hours + stop_hours
    return timedelta(hours=total_hours)


def generate_march_table(
    departure_time: datetime,
    distance_km: float,
    march_speed_kph: float,
    catch_up_speed_kph: float,
    checkpoints: Optional[list[dict]] = None,  # [{"distance_km": X, "name": "CP1"}, ...]
) -> dict:
    """Generate a march table with SP, RPs, and checkpoint times.

    Args:
        departure_time: Planned SP time
        distance_km: Total route distance
        march_speed_kph: Normal march speed
        catch_up_speed_kph: Catch-up speed if trailing
        checkpoints: Optional list of waypoints with distances

    Returns:
        {
            "sp_time": datetime,
            "rp_time": datetime,
            "checkpoints": [
                {"name": "CP1", "distance_km": 25.5, "time": datetime, "speed_kph": 40},
                ...
            ],
            "total_duration_hours": float
        }
    """
    if not checkpoints:
        checkpoints = []

    current_distance = 0
    current_time = departure_time
    march_table_checkpoints = []

    for checkpoint in checkpoints:
        distance_increment = checkpoint.get("distance_km", 0)
        time_increment = calculate_route_time(distance_increment, march_speed_kph)
        current_time += time_increment
        march_table_checkpoints.append({
            "name": checkpoint.get("name", "Checkpoint"),
            "distance_km": distance_increment,
            "cumulative_distance_km": current_distance + distance_increment,
            "time": current_time.isoformat(),
            "speed_kph": march_speed_kph,
        })
        current_distance += distance_increment

    # Remaining distance to destination
    remaining = distance_km - current_distance
    if remaining > 0:
        final_time_increment = calculate_route_time(remaining, march_speed_kph)
        current_time += final_time_increment

    rp_time = current_time
    total_duration = (rp_time - departure_time).total_seconds() / 3600.0

    return {
        "sp_time": departure_time.isoformat(),
        "rp_time": rp_time.isoformat(),
        "checkpoints": march_table_checkpoints,
        "total_distance_km": distance_km,
        "total_duration_hours": total_duration,
        "march_speed_kph": march_speed_kph,
        "catch_up_speed_kph": catch_up_speed_kph,
    }


def calculate_fuel_requirements(
    distance_km: float,
    num_vehicles: int,
    vehicle_types: Optional[dict[str, int]] = None,  # {"HMMWV": 3, "JLTV": 2}
    mpg_defaults: Optional[dict[str, float]] = None,
) -> dict:
    """Estimate fuel requirements for a convoy.

    Args:
        distance_km: Total route distance
        num_vehicles: Total vehicle count (if no breakdown)
        vehicle_types: Optional dict of vehicle type -> count
        mpg_defaults: Optional dict of vehicle type -> MPG (fallback: HMMWV=7, JLTV=8, T/V=4)

    Returns:
        {
            "total_gallons": float,
            "total_liters": float,
            "per_vehicle_gallons": float,
            "breakdown": {
                "HMMWV": {"count": 3, "per_vehicle_gallons": 45, "total_gallons": 135},
                ...
            }
        }
    """
    if not mpg_defaults:
        mpg_defaults = {
            "HMMWV": 7.0,
            "JLTV": 8.0,
            "M_VEH": 4.0,
            "TRUCK": 4.5,
        }

    distance_miles = distance_km * 0.621371

    if vehicle_types:
        total_gallons = 0
        breakdown = {}
        for vtype, count in vehicle_types.items():
            mpg = mpg_defaults.get(vtype, 6.0)
            gallons_per_vehicle = distance_miles / mpg
            total_gallons_type = gallons_per_vehicle * count
            breakdown[vtype] = {
                "count": count,
                "per_vehicle_gallons": round(gallons_per_vehicle, 1),
                "total_gallons": round(total_gallons_type, 1),
            }
            total_gallons += total_gallons_type
    else:
        avg_mpg = mpg_defaults.get("HMMWV", 7.0)
        total_gallons = (distance_miles / avg_mpg) * num_vehicles
        breakdown = {
            "combined": {
                "count": num_vehicles,
                "per_vehicle_gallons": round(distance_miles / avg_mpg, 1),
                "total_gallons": round(total_gallons, 1),
            }
        }

    return {
        "total_gallons": round(total_gallons, 1),
        "total_liters": round(total_gallons * 3.78541, 1),
        "per_vehicle_gallons": round(total_gallons / max(num_vehicles, 1), 1),
        "breakdown": breakdown,
    }


def validate_convoy_plan(plan: dict) -> tuple[bool, list[str]]:
    """Validate a convoy plan for completeness.

    Args:
        plan: ConvoyPlan dict with name, commander_id, serials, route, timing

    Returns:
        (is_valid: bool, errors: list[str])
    """
    errors = []

    if not plan.get("name"):
        errors.append("Convoy plan must have a name")
    if not plan.get("convoy_commander_id"):
        errors.append("Convoy commander must be assigned")
    if not plan.get("route_primary"):
        errors.append("Primary route must be defined")
    if not plan.get("departure_time_planned"):
        errors.append("Planned departure time required")

    serials = plan.get("serials", [])
    if not serials:
        errors.append("At least one serial must be defined")
    else:
        for serial in serials:
            if not serial.get("vehicle_count", 0):
                errors.append(
                    f"Serial {serial.get('serial_number')} has no vehicles"
                )
            if not serial.get("serial_commander_id"):
                errors.append(
                    f"Serial {serial.get('serial_number')} has no commander"
                )

    is_valid = len(errors) == 0
    return is_valid, errors


def calculate_haversine_distance(
    lat1: float, lon1: float, lat2: float, lon2: float
) -> float:
    """Calculate distance between two lat/lon points in km."""
    R = 6371  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
```

---

## Pydantic Schemas

Create `backend/app/schemas/convoy_planning.py`:

```python
"""Pydantic schemas for convoy planning and lift requests."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.convoy_planning import (
    CargoType,
    ConvoyPlanStatus,
    LiftRequestPriority,
    LiftRequestStatus,
    RiskAssessmentLevel,
)


# ============ ConvoyPlan Schemas ============

class ConvoySerialCreate(BaseModel):
    serial_number: str = Field(..., max_length=10)
    serial_commander_id: Optional[int] = None
    vehicle_count: int = Field(0, ge=0)
    pax_count: int = Field(0, ge=0)
    march_order: int
    march_speed_kph: Optional[float] = Field(40.0, ge=10.0, le=80.0)
    catch_up_speed_kph: Optional[float] = Field(60.0, ge=40.0, le=100.0)
    interval_meters: Optional[int] = Field(50, ge=25, le=200)


class ConvoySerialUpdate(BaseModel):
    serial_number: Optional[str] = None
    serial_commander_id: Optional[int] = None
    vehicle_count: Optional[int] = None
    pax_count: Optional[int] = None
    march_order: Optional[int] = None
    march_speed_kph: Optional[float] = None
    catch_up_speed_kph: Optional[float] = None
    interval_meters: Optional[int] = None


class ConvoySerialResponse(ConvoySerialCreate):
    id: int
    convoy_plan_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConvoyPlanCreate(BaseModel):
    name: str = Field(..., max_length=150)
    unit_id: int
    route_name: Optional[str] = None
    route_description: Optional[str] = None
    total_distance_km: Optional[float] = None
    estimated_duration_hours: Optional[float] = None
    route_primary: Optional[str] = None  # JSON waypoints
    route_alternate: Optional[str] = None
    departure_time_planned: Optional[datetime] = None
    sp_time: Optional[datetime] = None
    rp_time: Optional[datetime] = None
    brief_time: Optional[datetime] = None
    rehearsal_time: Optional[datetime] = None
    movement_credit_number: Optional[str] = None
    convoy_commander_id: Optional[int] = None
    risk_assessment_level: Optional[RiskAssessmentLevel] = RiskAssessmentLevel.MEDIUM
    comm_plan: Optional[str] = None
    recovery_plan: Optional[str] = None
    medevac_plan: Optional[str] = None


class ConvoyPlanUpdate(BaseModel):
    name: Optional[str] = None
    route_name: Optional[str] = None
    route_description: Optional[str] = None
    total_distance_km: Optional[float] = None
    estimated_duration_hours: Optional[float] = None
    route_primary: Optional[str] = None
    route_alternate: Optional[str] = None
    departure_time_planned: Optional[datetime] = None
    sp_time: Optional[datetime] = None
    rp_time: Optional[datetime] = None
    brief_time: Optional[datetime] = None
    rehearsal_time: Optional[datetime] = None
    movement_credit_number: Optional[str] = None
    convoy_commander_id: Optional[int] = None
    risk_assessment_level: Optional[RiskAssessmentLevel] = None
    comm_plan: Optional[str] = None
    recovery_plan: Optional[str] = None
    medevac_plan: Optional[str] = None


class ConvoyPlanResponse(ConvoyPlanCreate):
    id: int
    unit_id: int
    created_by: int
    status: ConvoyPlanStatus
    created_at: datetime
    updated_at: datetime
    serials: list[ConvoySerialResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ============ LiftRequest Schemas ============

class LiftRequestCreate(BaseModel):
    requesting_unit_id: int
    supporting_unit_id: Optional[int] = None
    cargo_type: CargoType
    cargo_description: str
    weight_lbs: Optional[int] = None
    cube_ft: Optional[float] = None
    pax_count: Optional[int] = Field(0, ge=0)
    hazmat: bool = False
    priority: LiftRequestPriority = LiftRequestPriority.ROUTINE
    required_delivery_date: datetime
    pickup_location: str
    pickup_lat: Optional[float] = None
    pickup_lon: Optional[float] = None
    delivery_location: str
    delivery_lat: Optional[float] = None
    delivery_lon: Optional[float] = None


class LiftRequestUpdate(BaseModel):
    cargo_type: Optional[CargoType] = None
    cargo_description: Optional[str] = None
    weight_lbs: Optional[int] = None
    cube_ft: Optional[float] = None
    pax_count: Optional[int] = None
    hazmat: Optional[bool] = None
    priority: Optional[LiftRequestPriority] = None
    required_delivery_date: Optional[datetime] = None
    pickup_location: Optional[str] = None
    pickup_lat: Optional[float] = None
    pickup_lon: Optional[float] = None
    delivery_location: Optional[str] = None
    delivery_lat: Optional[float] = None
    delivery_lon: Optional[float] = None


class LiftRequestAssign(BaseModel):
    movement_id: int


class LiftRequestApprove(BaseModel):
    supporting_unit_id: int


class LiftRequestResponse(LiftRequestCreate):
    id: int
    requesting_unit_id: int
    assigned_movement_id: Optional[int] = None
    status: LiftRequestStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

Expand `backend/app/schemas/transportation.py` with:

```python
class MovementHistoryResponse(MovementResponse):
    """Extended movement response with calculated analytics."""
    days_overdue: Optional[int] = None  # If delayed
    minutes_delayed: Optional[int] = None
    actual_duration_hours: Optional[float] = None
    on_time: bool = False
    average_speed_kph: Optional[float] = None
    convoy_plan: Optional[ConvoyPlanResponse] = None
    lift_requests: list[LiftRequestResponse] = []

    model_config = ConfigDict(from_attributes=True)
```

---

## Frontend Components

Create the following components in `frontend/src/components/transportation/`:

### `ConvoyPlanWizard.tsx` — Multi-Step Form

```typescript
/**
 * Multi-step wizard for creating and editing convoy plans.
 * Steps:
 * 1. Basic info (name, unit, commander, movement credit)
 * 2. Route planning (primary/alternate routes, distance, duration)
 * 3. Timing (brief, rehearsal, departure, SP, RP times)
 * 4. Serials (add S1, S2, S3... with vehicles/pax/speeds/commander)
 * 5. Risk & Contingencies (risk level, comm plan, recovery, medevac)
 * 6. Review & Submit
 */
```

### `MarchTableView.tsx` — Display Generated March Table

```typescript
/**
 * Display march table with:
 * - SP time, RP time
 * - Checkpoint sequence (name, cumulative distance, ETA, speed)
 * - Fuel estimate breakdown
 * - Serial march speeds and intervals
 * - Export to PDF or print
 */
```

### `LiftRequestBoard.tsx` — Kanban-Style Lift Request Management

```typescript
/**
 * Kanban board with columns:
 * - REQUESTED (new requests)
 * - APPROVED (approved, waiting assignment)
 * - SCHEDULED (assigned to a movement)
 * - IN_TRANSIT (movement is en route)
 * - DELIVERED (movement complete)
 * - CANCELED (canceled requests)
 *
 * Drag-and-drop to change status or assign to movement.
 * Click to view/edit details.
 */
```

### `ActiveConvoyTracker.tsx` — Real-Time Convoy Status

```typescript
/**
 * Display currently EN_ROUTE or DELAYED movements:
 * - Convoy name (from convoy_plan_id or convoy_id)
 * - Current location (lat/lon + readable location)
 * - ETA to destination
 * - Speed, heading, last update time
 * - Serials within convoy (S1, S2, S3...)
 * - Personnel count, vehicle count
 * - Click to open detail modal or zoom to map
 */
```

### `MovementHistoryTable.tsx` — Post-Mission Analytics

```typescript
/**
 * Table of COMPLETE movements:
 * Columns:
 * - Date completed
 * - Convoy name
 * - Route (origin -> destination)
 * - Vehicles, personnel
 * - Planned vs. actual arrival (on-time indicator)
 * - Duration
 * - Average speed
 * - Click for detail modal
 *
 * Filters: unit, date range, on-time/delayed
 * Metrics: on-time rate %, avg delay, throughput
 */
```

### Update `TransportationPage.tsx`

```typescript
export default function TransportationPage() {
  const [activeTab, setActiveTab] = useState<
    "planning" | "active" | "requests" | "history"
  >("active");

  return (
    <div className="space-y-4">
      {/* Tab navigation */}
      <div className="flex gap-2">
        <button onClick={() => setActiveTab("planning")}>Convoy Planning</button>
        <button onClick={() => setActiveTab("active")}>Active Convoys</button>
        <button onClick={() => setActiveTab("requests")}>Lift Requests</button>
        <button onClick={() => setActiveTab("history")}>Movement History</button>
      </div>

      {/* Tab content */}
      {activeTab === "planning" && (
        <ConvoyPlanningSection />
      )}
      {activeTab === "active" && (
        <>
          <ConvoyMap />
          <ActiveConvoyTracker />
        </>
      )}
      {activeTab === "requests" && (
        <LiftRequestBoard />
      )}
      {activeTab === "history" && (
        <MovementHistoryTable />
      )}
    </div>
  );
}
```

### Update `MapPage.tsx` or `ConvoyMap.tsx`

Add convoy route polylines and checkpoints:

```typescript
/**
 * For each active Movement with convoy_plan_id:
 * 1. Render route_primary as polyline (color: blue or route color)
 * 2. Render route_alternate as dashed polyline (color: gray)
 * 3. Render checkpoints from march_table_data as numbered markers
 * 4. Render current position as icon with unit name and ETA
 * 5. Click route to view plan details or march table
 * 6. Hover waypoint to show checkpoint name + ETA
 */
```

---

## Database Migration

Create a new Alembic migration in `backend/alembic/versions/`:

```python
"""Add convoy planning and lift request models.

Revision ID: 004
Revises: 003
Create Date: 2026-03-05 12:00:00.000000
"""

from alembic import op
import sqlalchemy as sa


def upgrade():
    # Create convoy_plans table
    op.create_table(
        "convoy_plans",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(150), nullable=False),
        sa.Column("unit_id", sa.Integer(), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("route_name", sa.String(100)),
        sa.Column("route_description", sa.Text),
        sa.Column("total_distance_km", sa.Float),
        sa.Column("estimated_duration_hours", sa.Float),
        sa.Column("route_primary", sa.Text),
        sa.Column("route_alternate", sa.Text),
        sa.Column("departure_time_planned", sa.DateTime(timezone=True)),
        sa.Column("sp_time", sa.DateTime(timezone=True)),
        sa.Column("rp_time", sa.DateTime(timezone=True)),
        sa.Column("brief_time", sa.DateTime(timezone=True)),
        sa.Column("rehearsal_time", sa.DateTime(timezone=True)),
        sa.Column("movement_credit_number", sa.String(50)),
        sa.Column("convoy_commander_id", sa.Integer()),
        sa.Column("status", sa.Enum("DRAFT", "APPROVED", "EXECUTING", "COMPLETE", "CANCELED")),
        sa.Column("risk_assessment_level", sa.Enum("LOW", "MEDIUM", "HIGH", "EXTREME")),
        sa.Column("comm_plan", sa.Text),
        sa.Column("recovery_plan", sa.Text),
        sa.Column("medevac_plan", sa.Text),
        sa.ForeignKeyConstraint(["unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.ForeignKeyConstraint(["convoy_commander_id"], ["personnel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_convoy_plans_unit_status", "convoy_plans", ["unit_id", "status"])
    op.create_index("idx_convoy_plans_created_by", "convoy_plans", ["created_by"])

    # Create convoy_serials table
    op.create_table(
        "convoy_serials",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("convoy_plan_id", sa.Integer(), nullable=False),
        sa.Column("serial_number", sa.String(10), nullable=False),
        sa.Column("serial_commander_id", sa.Integer()),
        sa.Column("vehicle_count", sa.Integer(), default=0),
        sa.Column("pax_count", sa.Integer(), default=0),
        sa.Column("march_order", sa.Integer(), nullable=False),
        sa.Column("march_speed_kph", sa.Float(), default=40.0),
        sa.Column("catch_up_speed_kph", sa.Float(), default=60.0),
        sa.Column("interval_meters", sa.Integer(), default=50),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["convoy_plan_id"], ["convoy_plans.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["serial_commander_id"], ["personnel.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_convoy_serials_plan", "convoy_serials", ["convoy_plan_id"])

    # Create lift_requests table
    op.create_table(
        "lift_requests",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("requesting_unit_id", sa.Integer(), nullable=False),
        sa.Column("supporting_unit_id", sa.Integer()),
        sa.Column("cargo_type", sa.Enum("PERSONNEL", "EQUIPMENT", "SUPPLY", "MIXED")),
        sa.Column("cargo_description", sa.Text, nullable=False),
        sa.Column("weight_lbs", sa.Integer()),
        sa.Column("cube_ft", sa.Float()),
        sa.Column("pax_count", sa.Integer(), default=0),
        sa.Column("hazmat", sa.Boolean(), default=False),
        sa.Column("priority", sa.Enum("ROUTINE", "PRIORITY", "EMERGENCY")),
        sa.Column("required_delivery_date", sa.DateTime(timezone=True)),
        sa.Column("status", sa.Enum("REQUESTED", "APPROVED", "SCHEDULED", "IN_TRANSIT", "DELIVERED", "CANCELED")),
        sa.Column("pickup_location", sa.String(150)),
        sa.Column("pickup_lat", sa.Float()),
        sa.Column("pickup_lon", sa.Float()),
        sa.Column("delivery_location", sa.String(150)),
        sa.Column("delivery_lat", sa.Float()),
        sa.Column("delivery_lon", sa.Float()),
        sa.Column("assigned_movement_id", sa.Integer()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(["requesting_unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["supporting_unit_id"], ["units.id"]),
        sa.ForeignKeyConstraint(["assigned_movement_id"], ["movements.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("idx_lift_requests_requesting_unit", "lift_requests", ["requesting_unit_id"])
    op.create_index("idx_lift_requests_assigned_movement", "lift_requests", ["assigned_movement_id"])
    op.create_index("idx_lift_requests_status", "lift_requests", ["status"])

    # Update movements table
    op.add_column("movements", sa.Column("convoy_plan_id", sa.Integer()))
    op.add_column("movements", sa.Column("convoy_serial_id", sa.Integer()))
    op.add_column("movements", sa.Column("march_table_data", sa.Text))
    op.create_foreign_key(
        "fk_movements_convoy_plan",
        "movements",
        "convoy_plans",
        ["convoy_plan_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_movements_convoy_serial",
        "movements",
        "convoy_serials",
        ["convoy_serial_id"],
        ["id"],
    )


def downgrade():
    op.drop_constraint("fk_movements_convoy_serial", "movements")
    op.drop_constraint("fk_movements_convoy_plan", "movements")
    op.drop_column("movements", "march_table_data")
    op.drop_column("movements", "convoy_serial_id")
    op.drop_column("movements", "convoy_plan_id")

    op.drop_table("lift_requests")
    op.drop_table("convoy_serials")
    op.drop_table("convoy_plans")
```

---

## Testing Strategy

### Backend Tests

Create `backend/tests/test_convoy_planning.py`:

```python
"""Test convoy planning endpoints and services."""

def test_create_convoy_plan():
    """POST /convoy-plans creates a DRAFT plan."""

def test_approve_convoy_plan():
    """POST /convoy-plans/{id}/approve validates and transitions to APPROVED."""

def test_execute_convoy_plan():
    """POST /convoy-plans/{id}/execute creates a Movement from plan."""

def test_generate_march_table():
    """GET /convoy-plans/{id}/march-table returns checkpoint times."""

def test_validate_convoy_plan():
    """Validation rejects incomplete plans (missing commander, serials, etc)."""

def test_crud_convoy_serials():
    """CRUD operations on serials."""

def test_calculate_fuel_requirements():
    """Fuel calculation by vehicle type matches expected values."""
```

Create `backend/tests/test_lift_requests.py`:

```python
"""Test lift request lifecycle."""

def test_create_lift_request():
    """POST /lift-requests creates REQUESTED request."""

def test_approve_lift_request():
    """PUT /lift-requests/{id}/approve assigns supporting unit."""

def test_assign_to_movement():
    """PUT /lift-requests/{id}/assign links to movement."""

def test_lift_request_filters():
    """GET /lift-requests filters by unit, status, priority."""
```

### Frontend Tests

- Snapshot tests for ConvoyPlanWizard form validation
- MarchTableView rendering with sample data
- LiftRequestBoard drag-and-drop state transitions
- ActiveConvoyTracker updates on socket.io messages

---

## Integration Notes

### Socket.IO Events

Broadcast movement updates to MapPage:

```typescript
socket.on("movement:position-update", (update: MovementPositionUpdate) => {
  // Update marker position and heading
  // Recalculate ETA
  // Trigger re-render
});

socket.on("movement:status-change", (update: MovementStatusUpdate) => {
  // Update status badge
  // If COMPLETE, remove from active list, add to history
});

socket.on("lift-request:status-change", (request: LiftRequest) => {
  // Re-render kanban board
});
```

### Permissions & Access Control

- **Create ConvoyPlan**: S4 or COMMANDER role, access to unit
- **Approve ConvoyPlan**: COMMANDER role only
- **Create LiftRequest**: Any role in requesting unit
- **Approve LiftRequest**: S4 or COMMANDER role in supporting unit
- **View movement history**: Accessible to requesting unit and supporting unit

---

## Acceptance Criteria

### Backend
- [ ] All models compile and migrate cleanly
- [ ] All API endpoints are implemented and tested
- [ ] Route planning service calculations match manual review
- [ ] Validation prevents incomplete convoy plans from approval
- [ ] Lift request assignments update movement records
- [ ] Permission checks enforce role-based access
- [ ] Integration tests verify full workflow: plan → approve → execute → movement

### Frontend
- [ ] ConvoyPlanWizard validates all 6 steps and prevents submission of incomplete plans
- [ ] MarchTableView displays checkpoint times within ±5 minutes of service calculation
- [ ] LiftRequestBoard kanban transitions reflect API status changes
- [ ] ActiveConvoyTracker updates position in real-time from socket.io events
- [ ] MovementHistoryTable calculates on-time rate and delay metrics
- [ ] ConvoyMap renders routes, checkpoints, and active positions

### End-to-End
- [ ] User can plan a convoy (wizard → approve → execute) and see it on the map
- [ ] Lift request board allows drag-drop assignment to a movement
- [ ] Completed movements appear in history with analytics
- [ ] All screens respect unit-level access controls
