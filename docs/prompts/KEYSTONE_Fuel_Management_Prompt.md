# KEYSTONE Fuel/POL Management Module — Comprehensive Build Prompt

**System**: USMC Logistics Intelligence (KEYSTONE)
**Module**: Fuel and POL (Class III) Supply Management
**Date**: 2026-03-05
**Status**: Build-Ready Specification

---

## 1. EXECUTIVE SUMMARY

This module extends KEYSTONE to provide **real-time fuel inventory tracking, consumption forecasting, and resupply planning** for USMC units. It integrates with existing SupplyStatusRecord (Class III tracking), EquipmentCatalogItem (vehicle data), and MapPage (geographic visualization).

**Key deliverables:**
- Fuel storage point (FARP/FSP/mobile refueler) inventory management
- Transaction logging (receipt, issue, transfer, loss, sampling)
- Per-equipment fuel consumption rates with operational tempo adjustment
- Automatic DOS (days-of-supply) calculation and resupply forecasting
- Fuel dashboard with map overlay, analytics, and status reporting

**Integration points:**
- Extends Supply Status Record module (Class III portion of LOGSTAT)
- Uses existing Unit, Equipment, and User models
- Overlays on MapPage for geographic awareness
- Feeds operational planning (tempo-based consumption projection)

---

## 2. DATABASE MODELS

### 2.1 FuelStoragePoint

Physical locations where fuel is stored and dispensed.

```python
# backend/app/models/fuel.py

from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Text, ForeignKey, Enum
)
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

class FacilityType(str, enum.Enum):
    """Fuel storage facility classification."""
    FARP = "FARP"  # Forward Arming/Refueling Point
    FSP = "FSP"  # Fuel Supply Point (battalion-level)
    BSA_FUEL_POINT = "BSA_FUEL_POINT"  # Brigade Support Area fuel point
    MOBILE_REFUELER = "MOBILE_REFUELER"  # TFDS, tanker truck
    BLADDER_FARM = "BLADDER_FARM"  # Fabric bladder system
    TANK_FARM = "TANK_FARM"  # Permanent/semi-permanent tank field
    DISTRIBUTED_CACHE = "DISTRIBUTED_CACHE"  # Company-level jerry cans, drums
    SKI_FUELS = "SKI_FUELS"  # Fuel position in expeditionary camp

class FuelType(str, enum.Enum):
    """NATO/USMC fuel types."""
    JP8 = "JP8"  # Primary jet/turbine fuel
    JP5 = "JP5"  # Naval specification jet fuel
    DF2 = "DF2"  # Diesel fuel (military)
    MOGAS = "MOGAS"  # Motor gasoline (when authorized)
    OIL_ENGINE = "OIL_ENGINE"  # Crankcase oil (various grades)
    HYDRAULIC_FLUID = "HYDRAULIC_FLUID"  # MIL-H-5606 or equiv
    COOLANT = "COOLANT"  # Engine coolant (ethylene/propylene glycol)
    SPECIALTY_OIL = "SPECIALTY_OIL"  # Grease, ATF, manual transmission oil
    MIXED = "MIXED"  # Multiple fuel types (segregated storage)

class StorageStatus(str, enum.Enum):
    """Operational status of storage point."""
    OPERATIONAL = "OPERATIONAL"
    DEGRADED = "DEGRADED"  # Partial capacity, minor issues
    NON_OPERATIONAL = "NON_OPERATIONAL"
    DRY = "DRY"  # No usable inventory

class FuelStoragePoint(Base):
    __tablename__ = "fuel_storage_points"

    id = Column(UUID, primary_key=True, default=uuid4)
    unit_id = Column(UUID, ForeignKey("units.id"), nullable=False)

    # Identity
    name = Column(String(255), nullable=False)  # "FARP-Alpha", "FSP-Main", "TFDS-12"
    facility_type = Column(Enum(FacilityType), nullable=False)

    # Location
    location_lat = Column(Float, nullable=True)
    location_lon = Column(Float, nullable=True)
    location_mgrs = Column(String(20), nullable=True)  # MGRS grid reference
    location_description = Column(Text, nullable=True)  # "3km north of FOB Wilson"

    # Inventory
    fuel_type = Column(Enum(FuelType), nullable=False)
    capacity_gallons = Column(Float, nullable=False)  # Max storage
    current_gallons = Column(Float, nullable=False, default=0.0)

    # Status & Accountability
    status = Column(Enum(StorageStatus), nullable=False, default=StorageStatus.OPERATIONAL)
    last_resupply_date = Column(DateTime, nullable=True)
    next_resupply_eta = Column(DateTime, nullable=True)

    # Equipment (if mobile)
    equipment_id = Column(UUID, ForeignKey("equipment_catalog_items.id"), nullable=True)

    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by_user_id = Column(UUID, ForeignKey("users.id"), nullable=True)

    # Relationships
    unit = relationship("Unit")
    equipment = relationship("EquipmentCatalogItem")
    transactions = relationship("FuelTransaction", back_populates="storage_point")
    updated_by = relationship("User")

    @property
    def fill_percentage(self) -> float:
        """Current fill as percentage of capacity."""
        if self.capacity_gallons == 0:
            return 0.0
        return (self.current_gallons / self.capacity_gallons) * 100

    @property
    def available_capacity(self) -> float:
        """Gallons that can still be added."""
        return max(0.0, self.capacity_gallons - self.current_gallons)
```

### 2.2 FuelTransaction

Every fuel in/out movement.

```python
class TransactionType(str, enum.Enum):
    """Type of fuel transaction."""
    RECEIPT = "RECEIPT"  # Fuel received from higher echelon
    ISSUE = "ISSUE"  # Fuel issued to unit/vehicle
    TRANSFER = "TRANSFER"  # Fuel moved between storage points
    LOSS = "LOSS"  # Spillage, evaporation, waste
    SAMPLE = "SAMPLE"  # Sample drawn for testing (tracked for accountability)

class FuelTransaction(Base):
    __tablename__ = "fuel_transactions"

    id = Column(UUID, primary_key=True, default=uuid4)
    storage_point_id = Column(UUID, ForeignKey("fuel_storage_points.id"), nullable=False)

    # Transaction classification
    transaction_type = Column(Enum(TransactionType), nullable=False)
    fuel_type = Column(Enum(FuelType), nullable=False)
    quantity_gallons = Column(Float, nullable=False)  # Pos=in, Neg=out

    # Recipient/consumer (if applicable)
    receiving_unit_id = Column(UUID, ForeignKey("units.id"), nullable=True)
    vehicle_bumper_number = Column(String(50), nullable=True)  # "A-1-1-3"
    vehicle_type = Column(String(100), nullable=True)  # "JLTV", "MTVR", "AH-64D"

    # Accountability
    document_number = Column(String(50), nullable=True)  # Fuel request, manifest ref
    performed_by_user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    transaction_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    # Meter reading (for container or pump accountability)
    meter_reading_before = Column(Float, nullable=True)
    meter_reading_after = Column(Float, nullable=True)

    # Notes
    notes = Column(Text, nullable=True)

    # Audit
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    storage_point = relationship("FuelStoragePoint", back_populates="transactions")
    receiving_unit = relationship("Unit")
    performed_by = relationship("User")

    @property
    def net_volume_change(self) -> float:
        """Helper to get absolute volume if needed."""
        return abs(self.quantity_gallons)
```

### 2.3 FuelConsumptionRate

Fuel burn rates by equipment type and operational tempo.

```python
class ConsumptionSource(str, enum.Enum):
    """How the rate was determined."""
    MANUAL = "MANUAL"  # Operator input, historical data, SOP
    CALCULATED = "CALCULATED"  # Derived from operational data
    TM_REFERENCE = "TM_REFERENCE"  # From tech manual (GPS fuel specs)

class FuelConsumptionRate(Base):
    __tablename__ = "fuel_consumption_rates"

    id = Column(UUID, primary_key=True, default=uuid4)
    equipment_catalog_item_id = Column(
        UUID, ForeignKey("equipment_catalog_items.id"), nullable=False
    )
    fuel_type = Column(Enum(FuelType), nullable=False)

    # Consumption metrics (by operational mode and duty)
    gallons_per_hour_idle = Column(Float, nullable=False, default=0.0)
    gallons_per_hour_tactical = Column(Float, nullable=False, default=0.0)
    gallons_per_mile = Column(Float, nullable=True)  # For ground vehicles
    gallons_per_flight_hour = Column(Float, nullable=True)  # For rotary/fixed wing

    # Metadata
    source = Column(Enum(ConsumptionSource), nullable=False, default=ConsumptionSource.MANUAL)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by_user_id = Column(UUID, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)

    # Relationships
    equipment = relationship("EquipmentCatalogItem")
    updated_by = relationship("User")

    __table_args__ = (
        # One entry per equipment type + fuel type combo
        UniqueConstraint("equipment_catalog_item_id", "fuel_type",
                         name="uc_equipment_fuel_rate"),
    )
```

### 2.4 FuelForecast

Projected fuel needs for operational planning.

```python
class OperationalTempo(str, enum.Enum):
    """Operational activity level."""
    LOW = "LOW"  # 25-50% of equipment moving/operating
    MEDIUM = "MEDIUM"  # 50-75% of equipment moving/operating
    HIGH = "HIGH"  # >75% operating, sustained ops
    SURGE = "SURGE"  # Full deployment, combat ops

class FuelForecast(Base):
    __tablename__ = "fuel_forecasts"

    id = Column(UUID, primary_key=True, default=uuid4)
    unit_id = Column(UUID, ForeignKey("units.id"), nullable=False)

    # Forecast parameters
    forecast_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    operational_tempo = Column(Enum(OperationalTempo), nullable=False)
    forecast_period_days = Column(Integer, nullable=False, default=7)

    # Equipment snapshot
    total_vehicles_by_type = Column(JSON, nullable=False)  # {"JLTV": 12, "MTVR": 4, ...}

    # Projections
    projected_daily_consumption_gallons = Column(Float, nullable=False)
    current_on_hand_gallons = Column(Float, nullable=False)
    days_of_supply = Column(Float, nullable=False)
    resupply_required_by_date = Column(DateTime, nullable=False)

    # Additional detail
    notes = Column(Text, nullable=True)
    created_by_user_id = Column(UUID, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    unit = relationship("Unit")
    created_by = relationship("User")
```

---

## 3. FUEL ANALYTICS SERVICE

Backend service for all fuel calculations and reporting.

```python
# backend/app/services/fuel_analytics.py

from typing import Dict, List, Optional, Tuple
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

class FuelAnalyticsService:
    """Fuel consumption analysis, forecasting, and reporting."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def calculate_unit_fuel_consumption(
        self,
        unit_id: str,
        operational_tempo: OperationalTempo = OperationalTempo.MEDIUM,
    ) -> Dict[str, float]:
        """
        Calculate total fuel consumption for a unit based on assigned equipment
        and operational tempo.

        Returns: {
            "JP8_gal_per_hour": float,
            "DF2_gal_per_hour": float,
            "total_gal_per_hour": float,
            "equipment_count": int,
            "tempo": str
        }
        """
        # Get all equipment assigned to unit (including subordinates)
        equipment_ids = await self._get_unit_equipment_ids(unit_id)

        # Get consumption rates for each piece of equipment
        rates = await self.session.execute(
            select(FuelConsumptionRate).where(
                FuelConsumptionRate.equipment_catalog_item_id.in_(equipment_ids)
            )
        )
        rates_data = rates.scalars().all()

        # Aggregate by fuel type and tempo
        consumption_by_fuel = {}
        tempo_multiplier = self._get_tempo_multiplier(operational_tempo)

        for rate in rates_data:
            fuel_key = f"{rate.fuel_type.value}_gal_per_hour"

            # Select appropriate burn rate based on tempo
            if operational_tempo == OperationalTempo.LOW:
                burn_rate = rate.gallons_per_hour_idle * 0.5
            elif operational_tempo == OperationalTempo.MEDIUM:
                burn_rate = rate.gallons_per_hour_idle * 0.75 + rate.gallons_per_hour_tactical * 0.25
            elif operational_tempo == OperationalTempo.HIGH:
                burn_rate = rate.gallons_per_hour_tactical * 0.8
            else:  # SURGE
                burn_rate = rate.gallons_per_hour_tactical * 1.0

            consumption_by_fuel[fuel_key] = consumption_by_fuel.get(fuel_key, 0.0) + burn_rate

        total = sum(consumption_by_fuel.values())
        consumption_by_fuel["total_gal_per_hour"] = total
        consumption_by_fuel["equipment_count"] = len(equipment_ids)
        consumption_by_fuel["tempo"] = operational_tempo.value

        return consumption_by_fuel

    async def calculate_fuel_dos(
        self,
        unit_id: str,
        operational_tempo: OperationalTempo = OperationalTempo.MEDIUM,
    ) -> Dict[str, float]:
        """
        Calculate days of supply (DOS) for a unit.

        Returns: {
            "JP8_dos": float,
            "DF2_dos": float,
            "limiting_dos": float,
            "limiting_fuel_type": str,
            "alert_threshold_reached": bool
        }
        """
        # Get current fuel inventory for unit
        inventory = await self._get_unit_fuel_inventory(unit_id)

        # Get consumption rate
        consumption = await self.calculate_unit_fuel_consumption(unit_id, operational_tempo)

        dos_by_fuel = {}
        limiting_dos = float('inf')
        limiting_fuel = None

        for fuel_type in [FuelType.JP8, FuelType.DF2]:
            fuel_key = f"{fuel_type.value}_gal_per_hour"
            current_gal = inventory.get(fuel_type.value, 0.0)
            hourly_rate = consumption.get(fuel_key, 0.0)

            if hourly_rate > 0:
                dos = (current_gal / hourly_rate) / 24  # Convert hours to days
            else:
                dos = float('inf') if current_gal > 0 else 0.0

            dos_by_fuel[f"{fuel_type.value}_dos"] = dos

            if dos < limiting_dos and hourly_rate > 0:
                limiting_dos = dos
                limiting_fuel = fuel_type.value

        limiting_dos = limiting_dos if limiting_dos != float('inf') else 0.0
        alert_threshold = limiting_dos <= 3.0  # Alert if DOS ≤ 3 days

        return {
            **dos_by_fuel,
            "limiting_dos": limiting_dos,
            "limiting_fuel_type": limiting_fuel,
            "alert_threshold_reached": alert_threshold,
        }

    async def project_fuel_needs(
        self,
        unit_id: str,
        days_ahead: int = 7,
        operational_tempo: OperationalTempo = OperationalTempo.MEDIUM,
    ) -> FuelForecast:
        """
        Generate a fuel forecast for operational planning.

        Returns: FuelForecast record with:
        - Projected daily consumption
        - Days of supply
        - Resupply required by date
        - Equipment snapshot
        """
        consumption = await self.calculate_unit_fuel_consumption(unit_id, operational_tempo)
        inventory = await self._get_unit_fuel_inventory(unit_id)

        total_consumption_daily = consumption["total_gal_per_hour"] * 24
        total_on_hand = sum(inventory.values())
        projected_dos = total_on_hand / total_consumption_daily if total_consumption_daily > 0 else 0.0

        resupply_required_by = datetime.utcnow() + timedelta(days=projected_dos - 2)

        # Get equipment count by type
        vehicles_by_type = await self._get_equipment_summary(unit_id)

        forecast = FuelForecast(
            unit_id=unit_id,
            forecast_date=datetime.utcnow(),
            operational_tempo=operational_tempo,
            forecast_period_days=days_ahead,
            total_vehicles_by_type=vehicles_by_type,
            projected_daily_consumption_gallons=total_consumption_daily,
            current_on_hand_gallons=total_on_hand,
            days_of_supply=projected_dos,
            resupply_required_by_date=resupply_required_by,
        )

        return forecast

    async def get_fuel_point_status(self, unit_id: str) -> List[Dict]:
        """
        Get all fuel storage points for a unit with current status.

        Returns list of dicts:
        [{
            "id": str,
            "name": str,
            "facility_type": str,
            "current_gallons": float,
            "capacity_gallons": float,
            "fill_percentage": float,
            "fuel_type": str,
            "status": str,
            "last_resupply": datetime,
            "next_resupply_eta": datetime
        }, ...]
        """
        result = await self.session.execute(
            select(FuelStoragePoint).where(FuelStoragePoint.unit_id == unit_id)
        )
        points = result.scalars().all()

        return [
            {
                "id": str(point.id),
                "name": point.name,
                "facility_type": point.facility_type.value,
                "current_gallons": point.current_gallons,
                "capacity_gallons": point.capacity_gallons,
                "fill_percentage": point.fill_percentage,
                "fuel_type": point.fuel_type.value,
                "status": point.status.value,
                "last_resupply": point.last_resupply_date,
                "next_resupply_eta": point.next_resupply_eta,
                "location": {
                    "lat": point.location_lat,
                    "lon": point.location_lon,
                    "mgrs": point.location_mgrs,
                    "description": point.location_description,
                },
            }
            for point in points
        ]

    async def calculate_bulk_fuel_requirement(
        self,
        unit_ids: List[str],
        operation_days: int,
        operational_tempo: OperationalTempo = OperationalTempo.HIGH,
    ) -> Dict[str, float]:
        """
        Calculate total fuel required to sustain multiple units for N days.

        Returns: {
            "JP8_required_gallons": float,
            "DF2_required_gallons": float,
            "total_required_gallons": float,
            "operation_days": int,
            "tempo": str
        }
        """
        total_daily = 0.0

        for unit_id in unit_ids:
            consumption = await self.calculate_unit_fuel_consumption(unit_id, operational_tempo)
            hourly = consumption["total_gal_per_hour"]
            total_daily += hourly * 24

        total_required = total_daily * operation_days

        return {
            "JP8_required_gallons": total_required * 0.7,  # Adjust as needed
            "DF2_required_gallons": total_required * 0.3,
            "total_required_gallons": total_required,
            "operation_days": operation_days,
            "tempo": operational_tempo.value,
        }

    async def get_fuel_transaction_history(
        self,
        storage_point_id: str,
        period_days: int = 30,
    ) -> List[Dict]:
        """
        Get transaction history for a fuel storage point.

        Returns list of transaction dicts with all relevant fields.
        """
        cutoff = datetime.utcnow() - timedelta(days=period_days)

        result = await self.session.execute(
            select(FuelTransaction).where(
                FuelTransaction.storage_point_id == storage_point_id,
                FuelTransaction.transaction_date >= cutoff,
            ).order_by(FuelTransaction.transaction_date.desc())
        )
        transactions = result.scalars().all()

        return [
            {
                "id": str(t.id),
                "date": t.transaction_date,
                "type": t.transaction_type.value,
                "fuel_type": t.fuel_type.value,
                "quantity_gallons": t.quantity_gallons,
                "vehicle_bumper": t.vehicle_bumper_number,
                "vehicle_type": t.vehicle_type,
                "receiving_unit": t.receiving_unit_id,
                "document_number": t.document_number,
                "performed_by": t.performed_by.name if t.performed_by else "Unknown",
                "meter_before": t.meter_reading_before,
                "meter_after": t.meter_reading_after,
                "notes": t.notes,
            }
            for t in transactions
        ]

    async def generate_fuel_status_report(self, unit_id: str) -> Dict:
        """
        Generate a fuel status report (Class III portion of LOGSTAT).

        Returns comprehensive status suitable for higher echelon reporting.
        """
        points = await self.get_fuel_point_status(unit_id)
        dos = await self.calculate_fuel_dos(unit_id, OperationalTempo.MEDIUM)
        forecast = await self.project_fuel_needs(unit_id, 7, OperationalTempo.MEDIUM)

        total_capacity = sum(p["capacity_gallons"] for p in points)
        total_on_hand = sum(p["current_gallons"] for p in points)

        return {
            "unit_id": unit_id,
            "report_time": datetime.utcnow(),
            "storage_points": points,
            "total_capacity_gallons": total_capacity,
            "total_on_hand_gallons": total_on_hand,
            "fill_percentage": (total_on_hand / total_capacity * 100) if total_capacity > 0 else 0.0,
            "days_of_supply": dos["limiting_dos"],
            "limiting_fuel": dos["limiting_fuel_type"],
            "alert": dos["alert_threshold_reached"],
            "forecast": {
                "operational_tempo": forecast.operational_tempo.value,
                "projected_daily_consumption": forecast.projected_daily_consumption_gallons,
                "days_of_supply": forecast.days_of_supply,
                "resupply_required_by": forecast.resupply_required_by_date,
            },
        }

    # ---- Private helpers ----

    async def _get_unit_equipment_ids(self, unit_id: str) -> List[str]:
        """Get all equipment IDs assigned to unit (including subordinates)."""
        # Implementation fetches Unit.equipment relationship
        result = await self.session.execute(
            select(Unit).where(Unit.id == unit_id)
        )
        unit = result.scalar_one_or_none()
        if not unit:
            return []
        # Assume Unit has equipment relationship
        return [str(e.id) for e in unit.equipment]

    async def _get_unit_fuel_inventory(self, unit_id: str) -> Dict[str, float]:
        """Get current fuel inventory by type for all unit's storage points."""
        result = await self.session.execute(
            select(FuelStoragePoint).where(FuelStoragePoint.unit_id == unit_id)
        )
        points = result.scalars().all()

        inventory = {}
        for point in points:
            fuel_type = point.fuel_type.value
            inventory[fuel_type] = inventory.get(fuel_type, 0.0) + point.current_gallons

        return inventory

    async def _get_equipment_summary(self, unit_id: str) -> Dict[str, int]:
        """Get count of equipment by type for a unit."""
        # Implementation aggregates equipment types
        result = await self.session.execute(
            select(Unit).where(Unit.id == unit_id)
        )
        unit = result.scalar_one_or_none()
        if not unit:
            return {}

        summary = {}
        for equipment in unit.equipment:
            eq_type = equipment.equipment_type  # e.g., "JLTV"
            summary[eq_type] = summary.get(eq_type, 0) + 1

        return summary

    @staticmethod
    def _get_tempo_multiplier(tempo: OperationalTempo) -> float:
        """Map operational tempo to consumption multiplier."""
        return {
            OperationalTempo.LOW: 0.25,
            OperationalTempo.MEDIUM: 0.5,
            OperationalTempo.HIGH: 0.85,
            OperationalTempo.SURGE: 1.0,
        }.get(tempo, 0.5)
```

---

## 4. API ENDPOINTS

### 4.1 Fuel Storage Points (CRUD)

```python
# backend/app/api/fuel.py

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime
from typing import List
from uuid import UUID

router = APIRouter(prefix="/api/v1/fuel", tags=["Fuel"])

@router.post("/storage-points")
async def create_fuel_storage_point(
    data: FuelStoragePointCreateRequest,
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user),
):
    """
    Create a new fuel storage point (FARP, FSP, etc.).

    Request body:
    {
        "unit_id": "uuid",
        "name": "FARP-Alpha",
        "facility_type": "FARP",
        "location_lat": 32.123,
        "location_lon": -117.456,
        "location_mgrs": "11SPE1234567890",
        "location_description": "3km north of FOB Wilson",
        "fuel_type": "JP8",
        "capacity_gallons": 5000,
        "equipment_id": "uuid (optional, for mobile refuelers)"
    }
    """
    point = FuelStoragePoint(
        unit_id=data.unit_id,
        name=data.name,
        facility_type=data.facility_type,
        location_lat=data.location_lat,
        location_lon=data.location_lon,
        location_mgrs=data.location_mgrs,
        location_description=data.location_description,
        fuel_type=data.fuel_type,
        capacity_gallons=data.capacity_gallons,
        current_gallons=0.0,
        equipment_id=data.equipment_id,
        updated_by_user_id=current_user.id,
    )
    session.add(point)
    await session.commit()
    return {"id": str(point.id), "name": point.name, "status": "created"}


@router.get("/storage-points")
async def get_fuel_storage_points(
    unit_id: UUID = Query(...),
    facility_type: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """
    List all fuel storage points for a unit.

    Query params:
    - unit_id (required): UUID of unit
    - facility_type (optional): Filter by FARP, FSP, MOBILE_REFUELER, etc.

    Returns array of storage point summaries with fill % and status.
    """
    query = select(FuelStoragePoint).where(FuelStoragePoint.unit_id == unit_id)
    if facility_type:
        query = query.where(FuelStoragePoint.facility_type == facility_type)

    result = await session.execute(query)
    points = result.scalars().all()

    return [
        {
            "id": str(p.id),
            "name": p.name,
            "facility_type": p.facility_type.value,
            "fuel_type": p.fuel_type.value,
            "current_gallons": p.current_gallons,
            "capacity_gallons": p.capacity_gallons,
            "fill_percentage": p.fill_percentage,
            "status": p.status.value,
            "location": {"lat": p.location_lat, "lon": p.location_lon, "mgrs": p.location_mgrs},
        }
        for p in points
    ]


@router.get("/storage-points/{storage_point_id}")
async def get_fuel_storage_point_detail(
    storage_point_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """
    Get detailed info on a single fuel storage point including recent transactions.

    Returns:
    {
        "id": str,
        "name": str,
        "facility_type": str,
        "location": {...},
        "inventory": {
            "current_gallons": float,
            "capacity_gallons": float,
            "fill_percentage": float,
            "fuel_type": str
        },
        "status": str,
        "last_resupply": datetime,
        "next_resupply_eta": datetime,
        "recent_transactions": [...],  # Last 20 transactions
        "estimated_days_to_empty": float
    }
    """
    result = await session.execute(
        select(FuelStoragePoint).where(FuelStoragePoint.id == storage_point_id)
    )
    point = result.scalar_one_or_none()
    if not point:
        raise HTTPException(status_code=404, detail="Storage point not found")

    # Get recent transactions
    tx_result = await session.execute(
        select(FuelTransaction)
        .where(FuelTransaction.storage_point_id == storage_point_id)
        .order_by(FuelTransaction.transaction_date.desc())
        .limit(20)
    )
    transactions = tx_result.scalars().all()

    # Estimate days to empty based on recent consumption
    analytics = FuelAnalyticsService(session)
    hourly_loss = await analytics._estimate_hourly_loss(storage_point_id)
    days_to_empty = (point.current_gallons / hourly_loss / 24) if hourly_loss > 0 else float('inf')

    return {
        "id": str(point.id),
        "name": point.name,
        "facility_type": point.facility_type.value,
        "location": {
            "lat": point.location_lat,
            "lon": point.location_lon,
            "mgrs": point.location_mgrs,
            "description": point.location_description,
        },
        "inventory": {
            "current_gallons": point.current_gallons,
            "capacity_gallons": point.capacity_gallons,
            "fill_percentage": point.fill_percentage,
            "fuel_type": point.fuel_type.value,
        },
        "status": point.status.value,
        "last_resupply": point.last_resupply_date,
        "next_resupply_eta": point.next_resupply_eta,
        "estimated_days_to_empty": days_to_empty,
        "recent_transactions": [
            {
                "id": str(t.id),
                "date": t.transaction_date,
                "type": t.transaction_type.value,
                "quantity": t.quantity_gallons,
                "vehicle": t.vehicle_bumper_number,
            }
            for t in transactions
        ],
    }


@router.put("/storage-points/{storage_point_id}")
async def update_fuel_storage_point(
    storage_point_id: UUID,
    data: FuelStoragePointUpdateRequest,
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user),
):
    """Update fuel storage point (name, location, capacity, status, etc.)."""
    result = await session.execute(
        select(FuelStoragePoint).where(FuelStoragePoint.id == storage_point_id)
    )
    point = result.scalar_one_or_none()
    if not point:
        raise HTTPException(status_code=404, detail="Storage point not found")

    # Update fields
    if data.name:
        point.name = data.name
    if data.status:
        point.status = data.status
    if data.next_resupply_eta:
        point.next_resupply_eta = data.next_resupply_eta
    if data.current_gallons is not None:
        point.current_gallons = data.current_gallons

    point.updated_at = datetime.utcnow()
    point.updated_by_user_id = current_user.id

    await session.commit()
    return {"id": str(point.id), "status": "updated"}
```

### 4.2 Fuel Transactions

```python
@router.post("/transactions")
async def record_fuel_transaction(
    data: FuelTransactionRequest,
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user),
):
    """
    Record a fuel transaction (receipt, issue, transfer, loss, sample).

    Request body:
    {
        "storage_point_id": "uuid",
        "transaction_type": "ISSUE",  // RECEIPT, ISSUE, TRANSFER, LOSS, SAMPLE
        "fuel_type": "JP8",
        "quantity_gallons": -50.0,  // Negative for outflow
        "receiving_unit_id": "uuid (optional)",
        "vehicle_bumper_number": "A-1-1-3 (optional)",
        "vehicle_type": "JLTV (optional)",
        "document_number": "FR-2026-0312-001 (optional)",
        "meter_reading_before": 12345.5,
        "meter_reading_after": 12342.0,
        "notes": "Refueled JLTV squad"
    }

    Returns: Transaction ID and updated storage point inventory.
    """
    # Fetch storage point
    result = await session.execute(
        select(FuelStoragePoint).where(FuelStoragePoint.id == data.storage_point_id)
    )
    point = result.scalar_one_or_none()
    if not point:
        raise HTTPException(status_code=404, detail="Storage point not found")

    # Validate transaction
    if data.transaction_type == TransactionType.ISSUE and data.quantity_gallons > 0:
        raise HTTPException(status_code=400, detail="ISSUE must have negative quantity")
    if data.transaction_type == TransactionType.RECEIPT and data.quantity_gallons < 0:
        raise HTTPException(status_code=400, detail="RECEIPT must have positive quantity")

    # Update inventory
    new_inventory = point.current_gallons + data.quantity_gallons
    if new_inventory < 0:
        raise HTTPException(status_code=400, detail="Insufficient fuel (would go negative)")
    if new_inventory > point.capacity_gallons:
        raise HTTPException(status_code=400, detail="Would exceed storage capacity")

    # Record transaction
    transaction = FuelTransaction(
        storage_point_id=data.storage_point_id,
        transaction_type=data.transaction_type,
        fuel_type=data.fuel_type,
        quantity_gallons=data.quantity_gallons,
        receiving_unit_id=data.receiving_unit_id,
        vehicle_bumper_number=data.vehicle_bumper_number,
        vehicle_type=data.vehicle_type,
        document_number=data.document_number,
        performed_by_user_id=current_user.id,
        meter_reading_before=data.meter_reading_before,
        meter_reading_after=data.meter_reading_after,
        notes=data.notes,
    )

    # Update storage point
    point.current_gallons = new_inventory
    if data.transaction_type == TransactionType.RECEIPT:
        point.last_resupply_date = datetime.utcnow()

    point.updated_by_user_id = current_user.id
    point.updated_at = datetime.utcnow()

    session.add(transaction)
    await session.commit()

    return {
        "transaction_id": str(transaction.id),
        "storage_point_id": str(point.id),
        "new_inventory": point.current_gallons,
        "fill_percentage": point.fill_percentage,
    }


@router.get("/transactions")
async def get_fuel_transactions(
    storage_point_id: UUID = Query(None),
    unit_id: UUID = Query(None),
    transaction_type: Optional[str] = Query(None),
    period_days: int = Query(30),
    session: AsyncSession = Depends(get_session),
):
    """
    List fuel transactions with filtering.

    Query params:
    - storage_point_id (optional): Filter to single storage point
    - unit_id (optional): Get all transactions from unit's storage points
    - transaction_type (optional): RECEIPT, ISSUE, TRANSFER, LOSS, SAMPLE
    - period_days: How far back to search (default 30)

    Returns: Array of transaction records, most recent first.
    """
    cutoff = datetime.utcnow() - timedelta(days=period_days)
    query = select(FuelTransaction).where(FuelTransaction.transaction_date >= cutoff)

    if storage_point_id:
        query = query.where(FuelTransaction.storage_point_id == storage_point_id)
    elif unit_id:
        # Join to get all storage points for unit
        subquery = select(FuelStoragePoint.id).where(FuelStoragePoint.unit_id == unit_id)
        query = query.where(FuelTransaction.storage_point_id.in_(subquery))

    if transaction_type:
        query = query.where(FuelTransaction.transaction_type == transaction_type)

    query = query.order_by(FuelTransaction.transaction_date.desc())

    result = await session.execute(query)
    transactions = result.scalars().all()

    return [
        {
            "id": str(t.id),
            "date": t.transaction_date,
            "type": t.transaction_type.value,
            "fuel_type": t.fuel_type.value,
            "quantity_gallons": t.quantity_gallons,
            "storage_point": t.storage_point.name if t.storage_point else None,
            "vehicle_bumper": t.vehicle_bumper_number,
            "vehicle_type": t.vehicle_type,
            "document_number": t.document_number,
            "performed_by": t.performed_by.name if t.performed_by else "Unknown",
            "notes": t.notes,
        }
        for t in transactions
    ]
```

### 4.3 Consumption Rates & Forecasting

```python
@router.get("/consumption-rates")
async def get_consumption_rates(
    equipment_type: Optional[str] = Query(None),
    fuel_type: Optional[str] = Query(None),
    session: AsyncSession = Depends(get_session),
):
    """
    List fuel consumption rates by equipment type.

    Query params:
    - equipment_type (optional): Filter by JLTV, MTVR, AH-64D, CH-53, etc.
    - fuel_type (optional): Filter by JP8, DF2, etc.

    Returns: Array of rates with per-hour and per-mile metrics.
    """
    query = select(FuelConsumptionRate)

    if equipment_type:
        subquery = select(EquipmentCatalogItem.id).where(
            EquipmentCatalogItem.equipment_type == equipment_type
        )
        query = query.where(FuelConsumptionRate.equipment_catalog_item_id.in_(subquery))

    if fuel_type:
        query = query.where(FuelConsumptionRate.fuel_type == fuel_type)

    result = await session.execute(query)
    rates = result.scalars().all()

    return [
        {
            "id": str(r.id),
            "equipment_id": str(r.equipment_catalog_item_id),
            "equipment_type": r.equipment.equipment_type,
            "fuel_type": r.fuel_type.value,
            "gallons_per_hour_idle": r.gallons_per_hour_idle,
            "gallons_per_hour_tactical": r.gallons_per_hour_tactical,
            "gallons_per_mile": r.gallons_per_mile,
            "gallons_per_flight_hour": r.gallons_per_flight_hour,
            "source": r.source.value,
            "last_updated": r.last_updated,
        }
        for r in rates
    ]


@router.put("/consumption-rates/{rate_id}")
async def update_consumption_rate(
    rate_id: UUID,
    data: ConsumptionRateUpdateRequest,
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user),
):
    """Update a consumption rate (e.g., if actual ops data supersedes estimate)."""
    result = await session.execute(
        select(FuelConsumptionRate).where(FuelConsumptionRate.id == rate_id)
    )
    rate = result.scalar_one_or_none()
    if not rate:
        raise HTTPException(status_code=404, detail="Rate not found")

    if data.gallons_per_hour_idle is not None:
        rate.gallons_per_hour_idle = data.gallons_per_hour_idle
    if data.gallons_per_hour_tactical is not None:
        rate.gallons_per_hour_tactical = data.gallons_per_hour_tactical
    if data.gallons_per_mile is not None:
        rate.gallons_per_mile = data.gallons_per_mile

    rate.source = ConsumptionSource.CALCULATED
    rate.last_updated = datetime.utcnow()
    rate.updated_by_user_id = current_user.id

    await session.commit()
    return {"id": str(rate.id), "status": "updated"}


@router.get("/forecast/{unit_id}")
async def get_fuel_forecast(
    unit_id: UUID,
    operational_tempo: str = Query("MEDIUM"),
    session: AsyncSession = Depends(get_session),
):
    """
    Get current fuel forecast for a unit.

    Query params:
    - unit_id (required)
    - operational_tempo: LOW, MEDIUM, HIGH, SURGE (default: MEDIUM)

    Returns:
    {
        "unit_id": str,
        "forecast_date": datetime,
        "operational_tempo": str,
        "total_vehicles": {...},
        "projected_daily_consumption": float,
        "current_on_hand": float,
        "days_of_supply": float,
        "resupply_required_by": datetime,
        "alert": bool
    }
    """
    analytics = FuelAnalyticsService(session)
    tempo = OperationalTempo[operational_tempo]
    forecast = await analytics.project_fuel_needs(unit_id, 7, tempo)

    return {
        "unit_id": str(forecast.unit_id),
        "forecast_date": forecast.forecast_date,
        "operational_tempo": forecast.operational_tempo.value,
        "total_vehicles": forecast.total_vehicles_by_type,
        "projected_daily_consumption": forecast.projected_daily_consumption_gallons,
        "current_on_hand": forecast.current_on_hand_gallons,
        "days_of_supply": forecast.days_of_supply,
        "resupply_required_by": forecast.resupply_required_by_date,
        "alert": forecast.days_of_supply <= 3,
    }


@router.post("/forecast/{unit_id}")
async def generate_fuel_forecast(
    unit_id: UUID,
    data: ForecastGenerateRequest,
    session: AsyncSession = Depends(get_session),
    current_user = Depends(get_current_user),
):
    """
    Manually generate and save a new fuel forecast for a unit.

    Request body:
    {
        "operational_tempo": "HIGH",
        "days_ahead": 14,
        "notes": "Planning for exercise"
    }
    """
    analytics = FuelAnalyticsService(session)
    tempo = OperationalTempo[data.operational_tempo]

    forecast = await analytics.project_fuel_needs(unit_id, data.days_ahead, tempo)
    forecast.created_by_user_id = current_user.id
    forecast.notes = data.notes

    session.add(forecast)
    await session.commit()

    return {
        "forecast_id": str(forecast.id),
        "days_of_supply": forecast.days_of_supply,
        "resupply_required_by": forecast.resupply_required_by_date,
    }


@router.get("/dashboard/{unit_id}")
async def get_fuel_dashboard(
    unit_id: UUID,
    session: AsyncSession = Depends(get_session),
):
    """
    Get comprehensive fuel status dashboard for a unit.

    Returns all data needed for frontend dashboard:
    - Storage points summary
    - Days of supply
    - Forecast
    - Alert status
    - Recent transactions
    """
    analytics = FuelAnalyticsService(session)
    report = await analytics.generate_fuel_status_report(unit_id)

    return report


@router.post("/bulk-requirement")
async def calculate_bulk_requirement(
    data: BulkRequirementRequest,
    session: AsyncSession = Depends(get_session),
):
    """
    Calculate total fuel required to sustain multiple units for an operation.

    Request body:
    {
        "unit_ids": ["uuid", "uuid"],
        "operation_days": 14,
        "operational_tempo": "HIGH"
    }

    Returns total JP8, DF2, and combined requirements.
    """
    analytics = FuelAnalyticsService(session)
    tempo = OperationalTempo[data.operational_tempo]

    requirement = await analytics.calculate_bulk_fuel_requirement(
        data.unit_ids,
        data.operation_days,
        tempo,
    )

    return requirement
```

---

## 5. FRONTEND COMPONENTS

### 5.1 FuelPage.tsx (Main Page)

```typescript
// frontend/src/pages/FuelPage.tsx

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import FuelStorageCards from "../components/Fuel/FuelStorageCards";
import FuelTransactionTable from "../components/Fuel/FuelTransactionTable";
import FuelIssueForm from "../components/Fuel/FuelIssueForm";
import ConsumptionRateChart from "../components/Fuel/ConsumptionRateChart";
import FuelForecastChart from "../components/Fuel/FuelForecastChart";
import { FuelMapOverlay } from "../components/Fuel/FuelMapOverlay";
import { AlertTriangle, Droplet } from "lucide-react";

export default function FuelPage() {
  const { unitId } = useParams();
  const [selectedPoint, setSelectedPoint] = useState<string | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showForecast, setShowForecast] = useState(true);

  // Fetch dashboard data
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ["fuel-dashboard", unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/fuel/dashboard/${unitId}`);
      return res.json();
    },
  });

  // Fetch forecast
  const { data: forecast } = useQuery({
    queryKey: ["fuel-forecast", unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/fuel/forecast/${unitId}?operational_tempo=MEDIUM`);
      return res.json();
    },
  });

  if (isLoading) return <div>Loading fuel data...</div>;

  const dos = dashboard?.days_of_supply ?? 0;
  const alert = dashboard?.alert ?? false;
  const totalCapacity = dashboard?.total_capacity_gallons ?? 0;
  const totalOnHand = dashboard?.total_on_hand_gallons ?? 0;

  return (
    <div className="space-y-6 p-6">
      {/* Header with alerts */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <Droplet className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold">Fuel Management</h1>
            <p className="text-gray-600">Class III (POL) Supply & Resupply Planning</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowMap(!showMap)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {showMap ? "Hide Map" : "Show Map"}
          </button>
          <button
            onClick={() => setShowForecast(!showForecast)}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {showForecast ? "Hide Forecast" : "Show Forecast"}
          </button>
        </div>
      </div>

      {/* Alert banner */}
      {alert && dos <= 3 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900">Critical Fuel Status</h3>
            <p className="text-red-800">
              Days of supply: {dos.toFixed(1)} days. Resupply required by{" "}
              {new Date(dashboard.forecast.resupply_required_by).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Total Capacity</div>
          <div className="text-3xl font-bold">{(totalCapacity / 1000).toFixed(1)}K gal</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">On Hand</div>
          <div className="text-3xl font-bold">{(totalOnHand / 1000).toFixed(1)}K gal</div>
          <div className="text-xs text-gray-500 mt-1">
            {((totalOnHand / totalCapacity) * 100).toFixed(0)}% capacity
          </div>
        </div>
        <div className={`bg-white rounded-lg shadow p-6 ${alert ? "border-2 border-red-500" : ""}`}>
          <div className="text-sm text-gray-600">Days of Supply</div>
          <div className={`text-3xl font-bold ${alert ? "text-red-600" : ""}`}>
            {dos.toFixed(1)} days
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600">Daily Consumption</div>
          <div className="text-3xl font-bold">
            {(dashboard?.forecast?.projected_daily_consumption ?? 0).toFixed(0)} gal
          </div>
        </div>
      </div>

      {/* Map overlay (if enabled) */}
      {showMap && <FuelMapOverlay unitId={unitId} onSelectPoint={setSelectedPoint} />}

      {/* Storage points */}
      <FuelStorageCards
        points={dashboard?.storage_points ?? []}
        selectedId={selectedPoint}
        onSelect={setSelectedPoint}
      />

      {/* Forecast chart (if enabled) */}
      {showForecast && forecast && <FuelForecastChart forecast={forecast} />}

      {/* Transaction history and issue form */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <FuelTransactionTable unitId={unitId} />
        </div>
        <div>
          <FuelIssueForm unitId={unitId} defaultStoragePointId={selectedPoint} />
        </div>
      </div>

      {/* Consumption rates chart */}
      <ConsumptionRateChart />
    </div>
  );
}
```

### 5.2 Component: FuelStorageCards.tsx

```typescript
// frontend/src/components/Fuel/FuelStorageCards.tsx

import React from "react";
import { AlertCircle, Droplet, TrendingDown } from "lucide-react";

interface FuelStoragePoint {
  id: string;
  name: string;
  facility_type: string;
  fuel_type: string;
  current_gallons: number;
  capacity_gallons: number;
  fill_percentage: number;
  status: string;
  location?: { lat: number; lon: number; mgrs: string };
}

export default function FuelStorageCards({
  points,
  selectedId,
  onSelect,
}: {
  points: FuelStoragePoint[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {points.map((point) => {
        const isCritical = point.fill_percentage < 20;
        const isWarning = point.fill_percentage < 50;
        const isSelected = point.id === selectedId;

        return (
          <div
            key={point.id}
            onClick={() => onSelect(point.id)}
            className={`bg-white rounded-lg shadow-md p-4 cursor-pointer transition-all ${
              isSelected ? "ring-2 ring-blue-500" : ""
            } ${isCritical ? "border-2 border-red-500" : isWarning ? "border border-yellow-300" : ""}`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{point.name}</h3>
                <p className="text-sm text-gray-500">{point.facility_type}</p>
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-gray-600">{point.fuel_type}</div>
                {isCritical && <AlertCircle className="w-5 h-5 text-red-600" />}
              </div>
            </div>

            {/* Capacity gauge */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">Inventory</span>
                <span className="font-semibold">{point.fill_percentage.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isCritical
                      ? "bg-red-600"
                      : isWarning
                        ? "bg-yellow-500"
                        : "bg-green-500"
                  }`}
                  style={{ width: `${point.fill_percentage}%` }}
                />
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {(point.current_gallons / 1000).toFixed(1)}K / {(point.capacity_gallons / 1000).toFixed(1)}K gal
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 text-sm">
              <Droplet className="w-4 h-4 text-blue-500" />
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                point.status === "OPERATIONAL"
                  ? "bg-green-100 text-green-800"
                  : point.status === "DEGRADED"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
              }`}>
                {point.status}
              </span>
            </div>

            {/* Location (if available) */}
            {point.location?.mgrs && (
              <div className="text-xs text-gray-500 mt-2">
                MGRS: {point.location.mgrs}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

### 5.3 Component: FuelIssueForm.tsx

```typescript
// frontend/src/components/Fuel/FuelIssueForm.tsx

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../main";

export default function FuelIssueForm({
  unitId,
  defaultStoragePointId,
}: {
  unitId: string;
  defaultStoragePointId: string | null;
}) {
  const [storagePointId, setStoragePointId] = useState(defaultStoragePointId || "");
  const [vehicleBumper, setVehicleBumper] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [docNumber, setDocNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch available storage points
  const { data: points } = useQuery({
    queryKey: ["fuel-storage-points", unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/fuel/storage-points?unit_id=${unitId}`);
      return res.json();
    },
  });

  // Record transaction mutation
  const mutation = useMutation({
    mutationFn: async (values: any) => {
      const res = await fetch("/api/v1/fuel/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Failed to record transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fuel-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["fuel-storage-points"] });
      setVehicleBumper("");
      setVehicleType("");
      setQuantity("");
      setDocNumber("");
      setNotes("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storagePointId || !quantity) return;

    mutation.mutate({
      storage_point_id: storagePointId,
      transaction_type: "ISSUE",
      fuel_type: "JP8", // Would come from selected storage point
      quantity_gallons: -parseFloat(quantity), // Negative for issue
      vehicle_bumper_number: vehicleBumper || null,
      vehicle_type: vehicleType || null,
      document_number: docNumber || null,
      notes: notes || null,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Issue Fuel</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Storage Point</label>
          <select
            value={storagePointId}
            onChange={(e) => setStoragePointId(e.target.value)}
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
            required
          >
            <option value="">-- Select Storage Point --</option>
            {points?.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.fill_percentage.toFixed(0)}%)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Quantity (gal)</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Vehicle Bumper #</label>
          <input
            type="text"
            value={vehicleBumper}
            onChange={(e) => setVehicleBumper(e.target.value)}
            placeholder="e.g., A-1-1-3"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
          <input
            type="text"
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            placeholder="e.g., JLTV"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Document #</label>
          <input
            type="text"
            value={docNumber}
            onChange={(e) => setDocNumber(e.target.value)}
            placeholder="e.g., FR-2026-0312-001"
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
            className="w-full mt-1 px-3 py-2 border border-gray-300 rounded"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          {mutation.isPending ? "Recording..." : "Record Issue"}
        </button>
      </form>
    </div>
  );
}
```

### 5.4 Component: FuelForecastChart.tsx

```typescript
// frontend/src/components/Fuel/FuelForecastChart.tsx

import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function FuelForecastChart({ forecast }: { forecast: any }) {
  // Project DOS over time
  const daysAhead = 14;
  const dailyConsumption = forecast.projected_daily_consumption;
  const currentOnHand = forecast.current_on_hand;

  const data = Array.from({ length: daysAhead + 1 }, (_, i) => {
    const daysUsed = i;
    const remaining = Math.max(0, currentOnHand - dailyConsumption * daysUsed);
    const date = new Date();
    date.setDate(date.getDate() + i);

    return {
      day: i,
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      gallons: remaining,
      dos: remaining > 0 ? (remaining / dailyConsumption).toFixed(1) : "0",
    };
  });

  const resupplyDate = new Date(forecast.resupply_required_by);
  const daysUntilResupply = Math.ceil(
    (resupplyDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">14-Day Fuel Projection</h3>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-xs text-gray-600">Tempo</div>
          <div className="font-semibold">{forecast.operational_tempo}</div>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-xs text-gray-600">Daily Burn</div>
          <div className="font-semibold">{dailyConsumption.toFixed(0)} gal/day</div>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-xs text-gray-600">Current DOS</div>
          <div className="font-semibold">{forecast.days_of_supply.toFixed(1)} days</div>
        </div>
        <div className={`p-3 rounded ${daysUntilResupply <= 3 ? "bg-red-50" : "bg-green-50"}`}>
          <div className="text-xs text-gray-600">Days Until Resupply</div>
          <div className="font-semibold">{daysUntilResupply} days</div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="gallons"
            stroke="#3b82f6"
            name="Fuel On Hand (gal)"
            strokeWidth={2}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="dos"
            stroke="#10b981"
            name="Days of Supply"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 5.5 Component: FuelMapOverlay.tsx

```typescript
// frontend/src/components/Fuel/FuelMapOverlay.tsx

import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import L from "leaflet";
import { useMap } from "react-leaflet";

export function FuelMapOverlay({
  unitId,
  onSelectPoint,
}: {
  unitId: string;
  onSelectPoint: (id: string) => void;
}) {
  const map = useMap();

  const { data: points } = useQuery({
    queryKey: ["fuel-storage-points", unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/fuel/storage-points?unit_id=${unitId}`);
      return res.json();
    },
  });

  useEffect(() => {
    if (!map || !points) return;

    // Clear existing markers (fuel-specific)
    map.eachLayer((layer) => {
      if (layer instanceof L.CircleMarker && (layer as any).isFuelMarker) {
        map.removeLayer(layer);
      }
    });

    // Add fuel point markers
    points.forEach((point: any) => {
      if (!point.location?.lat || !point.location?.lon) return;

      const isCritical = point.fill_percentage < 20;
      const color = isCritical ? "#dc2626" : point.fill_percentage < 50 ? "#eab308" : "#10b981";

      const marker = L.circleMarker([point.location.lat, point.location.lon], {
        radius: 10 + point.fill_percentage / 5,
        fillColor: color,
        color: "#000",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.7,
      });

      (marker as any).isFuelMarker = true;

      marker.bindPopup(
        `<div class="font-semibold">${point.name}</div>
         <div class="text-sm">${point.fuel_type} - ${point.fill_percentage.toFixed(0)}%</div>
         <button class="text-blue-600 text-sm mt-1">Select Point</button>`
      );

      marker.on("click", () => onSelectPoint(point.id));
      marker.addTo(map);
    });
  }, [map, points]);

  return null;
}
```

---

## 6. SEED DATA

### 6.1 Default Fuel Consumption Rates

```python
# backend/scripts/seed_fuel_rates.py

CONSUMPTION_RATES = {
    # Light tactical vehicles
    "JLTV": {
        "fuel_type": "JP8",
        "gallons_per_hour_idle": 2.5,
        "gallons_per_hour_tactical": 6.0,
        "gallons_per_mile": 0.15,
    },
    "HMMWV": {
        "fuel_type": "JP8",
        "gallons_per_hour_idle": 3.0,
        "gallons_per_hour_tactical": 7.5,
        "gallons_per_mile": 0.20,
    },

    # Medium tactical vehicles
    "MTVR": {
        "fuel_type": "DF2",
        "gallons_per_hour_idle": 4.0,
        "gallons_per_hour_tactical": 10.0,
        "gallons_per_mile": 0.30,
    },
    "FMTV": {
        "fuel_type": "DF2",
        "gallons_per_hour_idle": 4.5,
        "gallons_per_hour_tactical": 11.0,
        "gallons_per_mile": 0.32,
    },

    # Armored vehicles
    "LAV-25": {
        "fuel_type": "DF2",
        "gallons_per_hour_idle": 10.0,
        "gallons_per_hour_tactical": 20.0,
        "gallons_per_mile": 0.50,
    },
    "ACV": {
        "fuel_type": "DF2",
        "gallons_per_hour_idle": 8.0,
        "gallons_per_hour_tactical": 18.0,
        "gallons_per_mile": 0.45,
    },

    # Rotary wing
    "UH-1Y": {
        "fuel_type": "JP5",
        "gallons_per_flight_hour": 120.0,
    },
    "AH-1Z": {
        "fuel_type": "JP5",
        "gallons_per_flight_hour": 100.0,
    },
    "CH-53E": {
        "fuel_type": "JP5",
        "gallons_per_flight_hour": 280.0,
    },
    "MV-22": {
        "fuel_type": "JP5",
        "gallons_per_flight_hour": 120.0,
    },

    # Fixed wing
    "F-35B": {
        "fuel_type": "JP5",
        "gallons_per_flight_hour": 1500.0,
    },
    "KC-130J": {
        "fuel_type": "JP5",
        "gallons_per_flight_hour": 1200.0,
    },
}

# Sample storage points for a MEU
SAMPLE_STORAGE_POINTS = [
    {
        "name": "FARP-Alpha",
        "facility_type": "FARP",
        "fuel_type": "JP8",
        "capacity_gallons": 5000,
        "current_gallons": 3500,
        "location_lat": 32.1234,
        "location_lon": -117.1234,
        "location_mgrs": "11SPE1234567890",
        "location_description": "3km north of FOB Wilson",
        "status": "OPERATIONAL",
    },
    {
        "name": "FSP-Main",
        "facility_type": "FSP",
        "fuel_type": "JP8",
        "capacity_gallons": 50000,
        "current_gallons": 35000,
        "location_lat": 32.0900,
        "location_lon": -117.1500,
        "location_mgrs": "11SPD9876543210",
        "location_description": "Battalion FSP, BSA",
        "status": "OPERATIONAL",
    },
    {
        "name": "TFDS-1",
        "facility_type": "MOBILE_REFUELER",
        "fuel_type": "DF2",
        "capacity_gallons": 3000,
        "current_gallons": 1200,
        "location_lat": 32.1050,
        "location_lon": -117.1800,
        "location_description": "Mobile with HQ Element",
        "status": "OPERATIONAL",
    },
]
```

---

## 7. ROUTING & INTEGRATION

### 7.1 Frontend Router

```typescript
// frontend/src/App.tsx (additions)

import FuelPage from "./pages/FuelPage";

const routes = [
  // ... existing routes ...
  { path: "/fuel/:unitId", element: <FuelPage /> },
  { path: "/fuel", element: <FuelPage /> }, // Default unit from context
];
```

### 7.2 Backend Router Registration

```python
# backend/app/main.py

from app.api import fuel

app.include_router(fuel.router)
```

---

## 8. QUALITY GATES & ACCEPTANCE CRITERIA

### Build & Tests
- [ ] `go vet ./...` (Go services, if any)
- [ ] `go build ./...` (if applicable)
- [ ] `npx tsc -b` (frontend full type-check)
- [ ] `npx vitest run` (frontend unit tests)
- [ ] `pytest backend/tests/` (backend unit tests)
- [ ] `docker compose build` (all containers)

### Functional Tests
- [ ] CRUD operations on FuelStoragePoint model
- [ ] Fuel transaction recording and inventory updates
- [ ] DOS calculation (verify formula correctness)
- [ ] Forecast generation for multiple tempos
- [ ] Bulk requirement calculation for multi-unit ops
- [ ] Alert triggering (DOS ≤ 3 days)
- [ ] Transaction history filtering

### Security Review
- [ ] No hardcoded credentials or secrets
- [ ] Proper auth checks on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Rate limiting on transaction endpoints
- [ ] Data validation on all inputs
- [ ] Audit trail for all fuel movements

### Frontend Tests
- [ ] FuelPage loads and displays dashboard
- [ ] FuelStorageCards render with correct fill percentages
- [ ] FuelIssueForm validates and submits transactions
- [ ] Map overlay displays markers at correct locations
- [ ] ForecastChart projects DOS correctly
- [ ] Alert banner triggers for critical DOS

### Smoke Tests (End-to-End)
- [ ] Create fuel storage point
- [ ] Record a fuel transaction (issue)
- [ ] Verify inventory updated correctly
- [ ] Load dashboard and verify calculations
- [ ] Generate forecast
- [ ] View transaction history

---

## 9. DEPLOYMENT NOTES

### Database Migrations
```sql
-- Add fuel tables and enums
-- Migrations auto-generated by SQLAlchemy (alembic)
```

### Environment Configuration
```bash
# .env.example additions
FUEL_ALERT_THRESHOLD_DAYS=3
FUEL_FORECAST_DEFAULT_DAYS=7
FUEL_CONSUMPTION_CALC_METHOD=WEIGHTED_AVERAGE
```

### Documentation & Training
- Fuel management SOP (how to use KEYSTONE Fuel module)
- Consumption rate calibration guide
- Resupply planning workflow
- Troubleshooting common issues

---

## 10. FUTURE ENHANCEMENTS

1. **Advanced Forecasting**
   - Machine learning model for consumption prediction
   - Seasonal adjustments
   - Weather impact on burn rates

2. **Multi-Source Fuel**
   - Support for mixed-type storage (segregated inventory)
   - Blending rules and compatibility

3. **Automatic Alerts**
   - Email/SMS notifications when DOS drops below threshold
   - Integration with supply chain system for auto-ordering

4. **Historical Analytics**
   - Actual vs. projected consumption analysis
   - Equipment-level burn rate trending
   - Unit fuel efficiency metrics

5. **Supply Chain Integration**
   - Two-way sync with DSLR (supply request)
   - Automated resupply recommendations
   - Cost analysis by fuel type

6. **Mobile App**
   - Field refueling at FARP/TFDS
   - Quick transaction recording via mobile
   - Offline mode for forward areas

---

**END OF SPECIFICATION**

This comprehensive build prompt covers all aspects of a USMC-ready fuel management system for KEYSTONE. It integrates seamlessly with existing supply, equipment, and unit models, provides real-time visibility into fuel status, and supports operational tempo-based forecasting for supply planning.
