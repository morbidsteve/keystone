"""Fuel/POL analytics service — inventory, DOS, forecasting, bulk requirements."""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.equipment import EquipmentStatus
from app.models.fuel import (
    FuelConsumptionRate,
    FuelForecast,
    FuelStoragePoint,
    FuelStorageStatus,
    FuelTransaction,
    OperationalTempo,
)


# Tempo multipliers: (idle_weight, tactical_weight)
_TEMPO_WEIGHTS: Dict[OperationalTempo, tuple] = {
    OperationalTempo.LOW: (0.5, 0.0),
    OperationalTempo.MEDIUM: (0.75, 0.25),
    OperationalTempo.HIGH: (0.0, 0.8),
    OperationalTempo.SURGE: (0.0, 1.0),
}


class FuelAnalyticsService:
    """Business logic for fuel inventory, forecasting, and reporting."""

    # ------------------------------------------------------------------
    # Inventory by fuel type
    # ------------------------------------------------------------------

    @staticmethod
    async def get_unit_fuel_inventory(
        db: AsyncSession,
        unit_id: int,
    ) -> Dict[str, float]:
        """Return total gallons on hand grouped by fuel type for a unit."""
        result = await db.execute(
            select(
                FuelStoragePoint.fuel_type,
                func.sum(FuelStoragePoint.current_gallons),
            )
            .where(
                FuelStoragePoint.unit_id == unit_id,
                FuelStoragePoint.status != FuelStorageStatus.NON_OPERATIONAL,
            )
            .group_by(FuelStoragePoint.fuel_type)
        )
        rows = result.all()
        return {row[0].value: float(row[1] or 0.0) for row in rows}

    # ------------------------------------------------------------------
    # Days-of-supply calculation
    # ------------------------------------------------------------------

    @staticmethod
    async def calculate_fuel_dos(
        db: AsyncSession,
        unit_id: int,
        tempo: OperationalTempo,
    ) -> Dict[str, Any]:
        """Calculate days-of-supply for a unit at a given operational tempo."""
        # 1. Get on-hand inventory
        inventory = await FuelAnalyticsService.get_unit_fuel_inventory(db, unit_id)
        total_on_hand = sum(inventory.values())

        # 2. Get equipment counts for this unit
        equip_result = await db.execute(
            select(EquipmentStatus).where(EquipmentStatus.unit_id == unit_id)
        )
        equipment_rows = equip_result.scalars().all()

        # 3. Compute daily consumption from consumption rates
        daily_consumption = 0.0
        idle_w, tac_w = _TEMPO_WEIGHTS[tempo]

        for equip in equipment_rows:
            # Look up consumption rate by catalog_item_id
            if not equip.catalog_item_id:
                continue
            rate_result = await db.execute(
                select(FuelConsumptionRate).where(
                    FuelConsumptionRate.equipment_catalog_item_id
                    == equip.catalog_item_id
                )
            )
            rate = rate_result.scalar_one_or_none()
            if not rate:
                continue

            # Hourly consumption weighted by tempo (assume 12h operating day)
            hourly = (
                rate.gallons_per_hour_idle * idle_w
                + rate.gallons_per_hour_tactical * tac_w
            )
            # Multiply by count of mission-capable equipment and 12h day
            daily = hourly * 12.0 * equip.mission_capable
            daily_consumption += daily

        days_of_supply = (
            total_on_hand / daily_consumption if daily_consumption > 0 else 999.0
        )

        return {
            "unit_id": unit_id,
            "operational_tempo": tempo.value,
            "total_on_hand_gallons": total_on_hand,
            "inventory_by_fuel_type": inventory,
            "daily_consumption_gallons": round(daily_consumption, 2),
            "days_of_supply": round(days_of_supply, 2),
        }

    # ------------------------------------------------------------------
    # Storage point status listing
    # ------------------------------------------------------------------

    @staticmethod
    async def get_fuel_point_status(
        db: AsyncSession,
        unit_id: int,
    ) -> List[Dict[str, Any]]:
        """Return status summary for each storage point in a unit."""
        result = await db.execute(
            select(FuelStoragePoint).where(FuelStoragePoint.unit_id == unit_id)
        )
        points = result.scalars().all()

        summaries: List[Dict[str, Any]] = []
        for p in points:
            fill_pct = (
                (p.current_gallons / p.capacity_gallons * 100.0)
                if p.capacity_gallons > 0
                else 0.0
            )
            summaries.append(
                {
                    "id": p.id,
                    "name": p.name,
                    "facility_type": p.facility_type.value,
                    "fuel_type": p.fuel_type.value,
                    "capacity_gallons": p.capacity_gallons,
                    "current_gallons": p.current_gallons,
                    "fill_pct": round(fill_pct, 1),
                    "status": p.status.value if p.status else None,
                    "latitude": p.latitude,
                    "longitude": p.longitude,
                    "mgrs": p.mgrs,
                    "last_resupply_date": (
                        p.last_resupply_date.isoformat()
                        if p.last_resupply_date
                        else None
                    ),
                    "next_resupply_eta": (
                        p.next_resupply_eta.isoformat() if p.next_resupply_eta else None
                    ),
                }
            )
        return summaries

    # ------------------------------------------------------------------
    # Comprehensive dashboard
    # ------------------------------------------------------------------

    @staticmethod
    async def generate_fuel_status_report(
        db: AsyncSession,
        unit_id: int,
    ) -> Dict[str, Any]:
        """Build a comprehensive fuel dashboard for a unit."""
        # Storage points
        storage_points = await FuelAnalyticsService.get_fuel_point_status(db, unit_id)

        # Aggregates
        total_capacity = sum(sp["capacity_gallons"] for sp in storage_points)
        total_on_hand = sum(sp["current_gallons"] for sp in storage_points)
        overall_fill_pct = (
            (total_on_hand / total_capacity * 100.0) if total_capacity > 0 else 0.0
        )

        # Inventory by fuel type
        inventory = await FuelAnalyticsService.get_unit_fuel_inventory(db, unit_id)

        # Recent transactions (last 20)
        txn_result = await db.execute(
            select(FuelTransaction)
            .join(FuelStoragePoint)
            .where(FuelStoragePoint.unit_id == unit_id)
            .order_by(FuelTransaction.transaction_date.desc())
            .limit(20)
        )
        txns = txn_result.scalars().all()
        recent_transactions = [
            {
                "id": t.id,
                "storage_point_id": t.storage_point_id,
                "transaction_type": t.transaction_type.value,
                "fuel_type": t.fuel_type.value,
                "quantity_gallons": t.quantity_gallons,
                "vehicle_bumper_number": t.vehicle_bumper_number,
                "document_number": t.document_number,
                "transaction_date": (
                    t.transaction_date.isoformat() if t.transaction_date else None
                ),
            }
            for t in txns
        ]

        # Latest forecast
        forecast_result = await db.execute(
            select(FuelForecast)
            .where(FuelForecast.unit_id == unit_id)
            .order_by(FuelForecast.created_at.desc())
            .limit(1)
        )
        forecast_row = forecast_result.scalar_one_or_none()
        forecast = None
        if forecast_row:
            forecast = {
                "id": forecast_row.id,
                "operational_tempo": forecast_row.operational_tempo.value,
                "forecast_period_days": forecast_row.forecast_period_days,
                "projected_daily_consumption_gallons": forecast_row.projected_daily_consumption_gallons,
                "current_on_hand_gallons": forecast_row.current_on_hand_gallons,
                "days_of_supply": forecast_row.days_of_supply,
                "resupply_required_by_date": (
                    forecast_row.resupply_required_by_date.isoformat()
                    if forecast_row.resupply_required_by_date
                    else None
                ),
                "created_at": (
                    forecast_row.created_at.isoformat()
                    if forecast_row.created_at
                    else None
                ),
            }

        return {
            "unit_id": unit_id,
            "total_capacity_gallons": round(total_capacity, 2),
            "total_on_hand_gallons": round(total_on_hand, 2),
            "overall_fill_pct": round(overall_fill_pct, 1),
            "storage_points": storage_points,
            "inventory_by_fuel_type": inventory,
            "recent_transactions": recent_transactions,
            "forecast": forecast,
        }

    # ------------------------------------------------------------------
    # Bulk requirement across multiple units
    # ------------------------------------------------------------------

    @staticmethod
    async def calculate_bulk_requirement(
        db: AsyncSession,
        unit_ids: List[int],
        operation_days: int,
        tempo: OperationalTempo,
    ) -> Dict[str, Any]:
        """Calculate total fuel requirement for multiple units over N days."""
        total_daily = 0.0
        unit_breakdowns: List[Dict[str, Any]] = []

        for uid in unit_ids:
            dos_data = await FuelAnalyticsService.calculate_fuel_dos(db, uid, tempo)
            daily = dos_data["daily_consumption_gallons"]
            total_daily += daily
            unit_breakdowns.append(
                {
                    "unit_id": uid,
                    "daily_consumption_gallons": daily,
                    "total_requirement_gallons": round(daily * operation_days, 2),
                    "current_on_hand_gallons": dos_data["total_on_hand_gallons"],
                    "days_of_supply": dos_data["days_of_supply"],
                }
            )

        return {
            "unit_ids": unit_ids,
            "operation_days": operation_days,
            "operational_tempo": tempo.value,
            "total_daily_consumption_gallons": round(total_daily, 2),
            "total_requirement_gallons": round(total_daily * operation_days, 2),
            "unit_breakdowns": unit_breakdowns,
        }

    # ------------------------------------------------------------------
    # Forecast generation
    # ------------------------------------------------------------------

    @staticmethod
    async def project_fuel_needs(
        db: AsyncSession,
        unit_id: int,
        days_ahead: int,
        tempo: OperationalTempo,
        user_id: int,
        notes: Optional[str] = None,
    ) -> FuelForecast:
        """Generate and persist a fuel forecast for a unit."""
        dos_data = await FuelAnalyticsService.calculate_fuel_dos(db, unit_id, tempo)
        daily_consumption = dos_data["daily_consumption_gallons"]
        on_hand = dos_data["total_on_hand_gallons"]
        days_of_supply = dos_data["days_of_supply"]

        now = datetime.now(timezone.utc)
        resupply_by = now + timedelta(days=max(days_of_supply - 1, 0))

        forecast = FuelForecast(
            unit_id=unit_id,
            forecast_date=now,
            operational_tempo=tempo,
            forecast_period_days=days_ahead,
            projected_daily_consumption_gallons=round(daily_consumption, 2),
            current_on_hand_gallons=round(on_hand, 2),
            days_of_supply=round(days_of_supply, 2),
            resupply_required_by_date=resupply_by,
            notes=notes,
            created_by_user_id=user_id,
        )
        db.add(forecast)
        await db.flush()
        await db.refresh(forecast)
        return forecast
