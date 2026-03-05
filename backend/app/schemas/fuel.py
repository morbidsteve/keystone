"""Pydantic schemas for Fuel/POL management."""

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.fuel import (
    ConsumptionSource,
    FuelFacilityType,
    FuelStorageStatus,
    FuelTransactionType,
    FuelType,
    OperationalTempo,
)


# ---------------------------------------------------------------------------
# Fuel Storage Point
# ---------------------------------------------------------------------------


class FuelStoragePointCreate(BaseModel):
    unit_id: int
    name: str = Field(..., max_length=255)
    facility_type: FuelFacilityType
    fuel_type: FuelType
    capacity_gallons: float = Field(..., gt=0, allow_inf_nan=False)
    current_gallons: float = Field(0, ge=0, allow_inf_nan=False)
    status: FuelStorageStatus = FuelStorageStatus.OPERATIONAL

    # Location
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    mgrs: Optional[str] = Field(None, max_length=20)
    location_description: Optional[str] = Field(None, max_length=4000)

    # Resupply tracking
    last_resupply_date: Optional[datetime] = None
    next_resupply_eta: Optional[datetime] = None

    # Optional equipment link
    equipment_id: Optional[int] = None


class FuelStoragePointUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    facility_type: Optional[FuelFacilityType] = None
    fuel_type: Optional[FuelType] = None
    capacity_gallons: Optional[float] = Field(None, gt=0, allow_inf_nan=False)
    status: Optional[FuelStorageStatus] = None

    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    mgrs: Optional[str] = Field(None, max_length=20)
    location_description: Optional[str] = Field(None, max_length=4000)

    last_resupply_date: Optional[datetime] = None
    next_resupply_eta: Optional[datetime] = None

    equipment_id: Optional[int] = None


class FuelStoragePointResponse(BaseModel):
    id: int
    unit_id: int
    name: str
    facility_type: FuelFacilityType
    fuel_type: FuelType
    capacity_gallons: float
    current_gallons: float
    status: FuelStorageStatus

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    mgrs: Optional[str] = None
    location_description: Optional[str] = None

    last_resupply_date: Optional[datetime] = None
    next_resupply_eta: Optional[datetime] = None
    equipment_id: Optional[int] = None

    updated_by_user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Fuel Transaction
# ---------------------------------------------------------------------------


class FuelTransactionCreate(BaseModel):
    storage_point_id: int
    transaction_type: FuelTransactionType
    fuel_type: FuelType
    quantity_gallons: float = Field(..., allow_inf_nan=False)

    receiving_unit_id: Optional[int] = None
    vehicle_bumper_number: Optional[str] = Field(None, max_length=50)
    vehicle_type: Optional[str] = Field(None, max_length=100)
    document_number: Optional[str] = Field(None, max_length=50)

    meter_reading_before: Optional[float] = None
    meter_reading_after: Optional[float] = None
    notes: Optional[str] = Field(None, max_length=4000)

    @model_validator(mode="after")
    def validate_quantity_sign(self) -> "FuelTransactionCreate":
        """RECEIPT must be positive; ISSUE, LOSS, SAMPLE must be negative."""
        txn_type = self.transaction_type
        qty = self.quantity_gallons
        if txn_type == FuelTransactionType.RECEIPT and qty <= 0:
            raise ValueError("RECEIPT quantity_gallons must be positive")
        if txn_type in (
            FuelTransactionType.ISSUE,
            FuelTransactionType.LOSS,
            FuelTransactionType.SAMPLE,
            FuelTransactionType.TRANSFER,
        ) and qty >= 0:
            raise ValueError(
                f"{txn_type.value} quantity_gallons must be negative"
            )
        return self


class FuelTransactionResponse(BaseModel):
    id: int
    storage_point_id: int
    transaction_type: FuelTransactionType
    fuel_type: FuelType
    quantity_gallons: float

    receiving_unit_id: Optional[int] = None
    vehicle_bumper_number: Optional[str] = None
    vehicle_type: Optional[str] = None
    document_number: Optional[str] = None

    meter_reading_before: Optional[float] = None
    meter_reading_after: Optional[float] = None
    notes: Optional[str] = None

    performed_by_user_id: int
    transaction_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Fuel Consumption Rate
# ---------------------------------------------------------------------------


class FuelConsumptionRateUpdate(BaseModel):
    fuel_type: Optional[FuelType] = None
    gallons_per_hour_idle: Optional[float] = Field(None, ge=0, allow_inf_nan=False)
    gallons_per_hour_tactical: Optional[float] = Field(None, ge=0, allow_inf_nan=False)
    gallons_per_mile: Optional[float] = Field(None, ge=0, allow_inf_nan=False)
    gallons_per_flight_hour: Optional[float] = Field(None, ge=0, allow_inf_nan=False)
    source: Optional[ConsumptionSource] = None
    notes: Optional[str] = Field(None, max_length=4000)


class FuelConsumptionRateResponse(BaseModel):
    id: int
    equipment_catalog_item_id: int
    fuel_type: FuelType

    gallons_per_hour_idle: float
    gallons_per_hour_tactical: float
    gallons_per_mile: Optional[float] = None
    gallons_per_flight_hour: Optional[float] = None

    source: ConsumptionSource
    notes: Optional[str] = None

    updated_by_user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Fuel Forecast
# ---------------------------------------------------------------------------


class ForecastGenerateRequest(BaseModel):
    operational_tempo: OperationalTempo
    forecast_period_days: int = Field(7, ge=1, le=365)
    daily_hours: float = Field(8.0, gt=0, le=24, allow_inf_nan=False)
    daily_miles: float = Field(50.0, ge=0, le=1000, allow_inf_nan=False)
    notes: Optional[str] = Field(None, max_length=4000)


class FuelForecastResponse(BaseModel):
    id: int
    unit_id: int
    forecast_date: Optional[datetime] = None
    operational_tempo: OperationalTempo
    forecast_period_days: int

    projected_daily_consumption_gallons: float
    current_on_hand_gallons: float
    days_of_supply: float
    resupply_required_by_date: datetime

    notes: Optional[str] = None
    created_by_user_id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Fuel Dashboard
# ---------------------------------------------------------------------------


class FuelDashboardResponse(BaseModel):
    unit_id: int
    total_capacity_gallons: float
    total_on_hand_gallons: float
    overall_fill_pct: float
    storage_points: List[Dict]
    inventory_by_fuel_type: Dict[str, float]
    recent_transactions: List[Dict]
    forecast: Optional[Dict] = None


# ---------------------------------------------------------------------------
# Bulk Requirement
# ---------------------------------------------------------------------------


class BulkRequirementRequest(BaseModel):
    unit_ids: List[int] = Field(..., max_length=50)
    operation_days: int = Field(..., ge=1, le=365)
    operational_tempo: OperationalTempo
    daily_hours: float = Field(8.0, gt=0, le=24, allow_inf_nan=False)
    daily_miles: float = Field(50.0, ge=0, le=1000, allow_inf_nan=False)


class BulkRequirementResponse(BaseModel):
    unit_ids: List[int]
    operation_days: int
    operational_tempo: OperationalTempo
    total_daily_consumption_gallons: float
    total_requirement_gallons: float
    unit_breakdowns: List[Dict]
