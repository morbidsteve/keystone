"""CASEVAC / medical logistics service layer."""

import math
from datetime import date, datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import BadRequestError, NotFoundError
from app.models.medical import (
    CasualtyLog,
    CasualtyReport,
    CasualtyReportStatus,
    EvacuationStatus,
    MedicalSupplyBurnRate,
    MedicalTreatmentFacility,
    MTFStatus,
)
from app.models.user import User


class CasevacService:
    """Business logic for CASEVAC workflow, MTF queries, burn rates, and PERSTAT."""

    # ------------------------------------------------------------------
    # Casualty Report CRUD + workflow
    # ------------------------------------------------------------------

    @staticmethod
    async def create_casualty_report(
        db: AsyncSession,
        user: User,
        data: dict,
    ) -> CasualtyReport:
        """Create a 9-line CASEVAC report.

        Generates a casualty ID in the pattern CAS-<UNIT>-<YYYYMMDD>-<XXXX>.
        """
        unit_id = data["unit_id"]
        now = datetime.now(timezone.utc)
        date_str = now.strftime("%Y%m%d")

        # Count existing reports for today + unit to generate sequence
        count_result = await db.execute(
            select(func.count(CasualtyReport.id)).where(
                CasualtyReport.casualty_id.like(f"CAS-{unit_id}-{date_str}-%")
            )
        )
        seq = (count_result.scalar() or 0) + 1
        casualty_id = f"CAS-{unit_id}-{date_str}-{seq:04d}"

        # Validate receiving facility if provided
        if data.get("receiving_facility_id"):
            facility_result = await db.execute(
                select(MedicalTreatmentFacility).where(
                    MedicalTreatmentFacility.id == data["receiving_facility_id"]
                )
            )
            if not facility_result.scalar_one_or_none():
                raise NotFoundError(
                    "MedicalTreatmentFacility", data["receiving_facility_id"]
                )

        report = CasualtyReport(
            casualty_id=casualty_id,
            reported_by_user_id=user.id,
            **data,
        )
        db.add(report)
        await db.flush()

        # Initial log entry
        log = CasualtyLog(
            casualty_report_id=report.id,
            event_type="CREATED",
            event_time=now,
            recorded_by_user_id=user.id,
            notes=f"9-Line report created. Precedence: {report.precedence.value}",
        )
        db.add(log)
        await db.flush()
        await db.refresh(report)

        # Reload with logs
        result = await db.execute(
            select(CasualtyReport)
            .where(CasualtyReport.id == report.id)
            .options(selectinload(CasualtyReport.logs))
        )
        return result.scalar_one()

    @staticmethod
    async def dispatch_evacuation(
        db: AsyncSession,
        user: User,
        casualty_id: int,
        facility_id: int,
        transport_method: str,
        accessible_unit_ids: Optional[List[int]] = None,
    ) -> CasualtyReport:
        """Dispatch a CASEVAC asset — validates state before transition."""
        result = await db.execute(
            select(CasualtyReport)
            .where(CasualtyReport.id == casualty_id)
            .options(selectinload(CasualtyReport.logs))
        )
        report = result.scalar_one_or_none()
        if not report:
            raise NotFoundError("CasualtyReport", casualty_id)

        # Only allow dispatch from REQUESTED status
        if report.evacuation_status != EvacuationStatus.REQUESTED:
            raise BadRequestError(
                f"Cannot dispatch: current evacuation status is "
                f"{report.evacuation_status.value}, expected REQUESTED"
            )

        # Validate facility exists
        fac_result = await db.execute(
            select(MedicalTreatmentFacility).where(
                MedicalTreatmentFacility.id == facility_id
            )
        )
        facility = fac_result.scalar_one_or_none()
        if not facility:
            raise NotFoundError("MedicalTreatmentFacility", facility_id)

        # H-5 fix: verify user has access to the target facility's unit
        if accessible_unit_ids is not None and facility.unit_id is not None:
            if facility.unit_id not in accessible_unit_ids:
                raise NotFoundError("MedicalTreatmentFacility", facility_id)

        now = datetime.now(timezone.utc)
        report.receiving_facility_id = facility_id
        report.transport_method = transport_method
        report.evacuation_status = EvacuationStatus.DISPATCHED
        report.status = CasualtyReportStatus.IN_PROGRESS
        report.pickup_time = now

        log = CasualtyLog(
            casualty_report_id=report.id,
            event_type="DISPATCHED",
            event_time=now,
            recorded_by_user_id=user.id,
            notes=f"Dispatched via {transport_method} to facility {facility.name}",
        )
        db.add(log)
        await db.flush()
        await db.refresh(report)

        reload = await db.execute(
            select(CasualtyReport)
            .where(CasualtyReport.id == report.id)
            .options(selectinload(CasualtyReport.logs))
        )
        return reload.scalar_one()

    @staticmethod
    async def update_patient_status(
        db: AsyncSession,
        user: User,
        casualty_id: int,
        new_status: EvacuationStatus,
        notes: Optional[str] = None,
    ) -> CasualtyReport:
        """Advance the evacuation workflow (AT_FACILITY, RTD, etc.)."""
        result = await db.execute(
            select(CasualtyReport)
            .where(CasualtyReport.id == casualty_id)
            .options(selectinload(CasualtyReport.logs))
        )
        report = result.scalar_one_or_none()
        if not report:
            raise NotFoundError("CasualtyReport", casualty_id)

        # Define valid transitions
        valid_transitions: Dict[EvacuationStatus, List[EvacuationStatus]] = {
            EvacuationStatus.REQUESTED: [EvacuationStatus.DISPATCHED],
            EvacuationStatus.DISPATCHED: [
                EvacuationStatus.EN_ROUTE,
                EvacuationStatus.AT_PICKUP,
            ],
            EvacuationStatus.EN_ROUTE: [EvacuationStatus.AT_PICKUP],
            EvacuationStatus.AT_PICKUP: [EvacuationStatus.IN_TRANSIT],
            EvacuationStatus.IN_TRANSIT: [EvacuationStatus.AT_FACILITY],
            EvacuationStatus.AT_FACILITY: [
                EvacuationStatus.RTD,
                EvacuationStatus.CLOSED,
            ],
            EvacuationStatus.RTD: [EvacuationStatus.CLOSED],
        }

        current_evac: EvacuationStatus = report.evacuation_status  # type: ignore[assignment]
        allowed: List[EvacuationStatus] = valid_transitions.get(current_evac, [])
        if new_status not in allowed:
            raise BadRequestError(
                f"Cannot transition from {report.evacuation_status.value} "
                f"to {new_status.value}"
            )

        now = datetime.now(timezone.utc)
        report.evacuation_status = new_status

        if new_status == EvacuationStatus.AT_FACILITY:
            report.arrival_at_facility_time = now

        log = CasualtyLog(
            casualty_report_id=report.id,
            event_type=new_status.value,
            event_time=now,
            recorded_by_user_id=user.id,
            notes=notes,
        )
        db.add(log)
        await db.flush()
        await db.refresh(report)

        reload = await db.execute(
            select(CasualtyReport)
            .where(CasualtyReport.id == report.id)
            .options(selectinload(CasualtyReport.logs))
        )
        return reload.scalar_one()

    @staticmethod
    async def close_casualty_report(
        db: AsyncSession,
        user: User,
        casualty_id: int,
        disposition: str,
    ) -> CasualtyReport:
        """Close a casualty report with a disposition note."""
        result = await db.execute(
            select(CasualtyReport)
            .where(CasualtyReport.id == casualty_id)
            .options(selectinload(CasualtyReport.logs))
        )
        report = result.scalar_one_or_none()
        if not report:
            raise NotFoundError("CasualtyReport", casualty_id)

        if report.status == CasualtyReportStatus.CLOSED:
            raise BadRequestError("Report is already closed")

        # C-1 fix: Only allow close from AT_FACILITY, RTD, or IN_PROGRESS states
        closeable_statuses = {
            CasualtyReportStatus.IN_PROGRESS,
            CasualtyReportStatus.OPEN,
        }
        closeable_evac = {
            EvacuationStatus.AT_FACILITY,
            EvacuationStatus.RTD,
        }
        if (
            report.status not in closeable_statuses
            or report.evacuation_status not in closeable_evac
        ):
            raise BadRequestError(
                f"Cannot close: status={report.status.value}, "
                f"evacuation_status={report.evacuation_status.value}. "
                f"Casualty must be AT_FACILITY or RTD before closing."
            )

        now = datetime.now(timezone.utc)
        report.status = CasualtyReportStatus.CLOSED
        report.evacuation_status = EvacuationStatus.CLOSED
        report.disposition = disposition

        log = CasualtyLog(
            casualty_report_id=report.id,
            event_type="CLOSED",
            event_time=now,
            recorded_by_user_id=user.id,
            notes=f"Closed: {disposition}",
        )
        db.add(log)
        await db.flush()
        await db.refresh(report)

        reload = await db.execute(
            select(CasualtyReport)
            .where(CasualtyReport.id == report.id)
            .options(selectinload(CasualtyReport.logs))
        )
        return reload.scalar_one()

    # ------------------------------------------------------------------
    # Burn Rates
    # ------------------------------------------------------------------

    @staticmethod
    async def calculate_medical_burn_rates(
        db: AsyncSession,
        unit_id: int,
    ) -> List[Dict[str, Any]]:
        """Return burn rate records with projected exhaustion for a unit."""
        result = await db.execute(
            select(MedicalSupplyBurnRate).where(
                MedicalSupplyBurnRate.unit_id == unit_id
            )
        )
        records = result.scalars().all()

        burn_rates: List[Dict[str, Any]] = []
        today = date.today()
        for r in records:
            # Compute days-of-supply and projected exhaustion if burn rate exists
            days_of_supply = r.days_of_supply
            projected = r.projected_exhaustion_date
            if r.burn_rate_per_day and r.burn_rate_per_day > 0 and r.quantity_on_hand:
                days_of_supply = round(r.quantity_on_hand / r.burn_rate_per_day, 1)
                days_offset = int(math.ceil(r.quantity_on_hand / r.burn_rate_per_day))
                from datetime import timedelta

                projected = today + timedelta(days=days_offset)

            is_critical = (
                days_of_supply is not None and days_of_supply <= r.critical_threshold
            )
            is_warning = (
                days_of_supply is not None and days_of_supply <= r.warning_threshold
            )

            burn_rates.append(
                {
                    "id": r.id,
                    "unit_id": r.unit_id,
                    "supply_catalog_item_id": r.supply_catalog_item_id,
                    "period_start": r.period_start.isoformat(),
                    "period_end": r.period_end.isoformat(),
                    "quantity_used": r.quantity_used,
                    "quantity_on_hand": r.quantity_on_hand,
                    "days_of_supply": days_of_supply,
                    "burn_rate_per_day": r.burn_rate_per_day,
                    "projected_exhaustion_date": (
                        projected.isoformat() if projected else None
                    ),
                    "critical_threshold": r.critical_threshold,
                    "warning_threshold": r.warning_threshold,
                    "is_critical": is_critical,
                    "is_warning": is_warning,
                }
            )

        return burn_rates

    # ------------------------------------------------------------------
    # Nearest MTF (Haversine)
    # ------------------------------------------------------------------

    @staticmethod
    async def find_nearest_mtf(
        db: AsyncSession,
        lat: float,
        lon: float,
        accessible_unit_ids: Optional[List[int]] = None,
    ) -> List[Dict[str, Any]]:
        """Find operational MTFs sorted by Haversine distance (km)."""
        from sqlalchemy import or_

        query = select(MedicalTreatmentFacility).where(
            MedicalTreatmentFacility.status == MTFStatus.OPERATIONAL,
            MedicalTreatmentFacility.latitude.isnot(None),
            MedicalTreatmentFacility.longitude.isnot(None),
        )

        # H-3 fix: filter by accessible units (or unaffiliated)
        if accessible_unit_ids is not None:
            query = query.where(
                or_(
                    MedicalTreatmentFacility.unit_id.in_(accessible_unit_ids),
                    MedicalTreatmentFacility.unit_id.is_(None),
                )
            )

        result = await db.execute(query)
        facilities = result.scalars().all()

        def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
            R = 6371.0  # Earth radius in km
            d_lat = math.radians(lat2 - lat1)
            d_lon = math.radians(lon2 - lon1)
            a = (
                math.sin(d_lat / 2) ** 2
                + math.cos(math.radians(lat1))
                * math.cos(math.radians(lat2))
                * math.sin(d_lon / 2) ** 2
            )
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c

        ranked: List[Dict[str, Any]] = []
        for f in facilities:
            dist = haversine(lat, lon, f.latitude, f.longitude)
            ranked.append(
                {
                    "facility_id": f.id,
                    "name": f.name,
                    "facility_type": f.facility_type.value,
                    "callsign": f.callsign,
                    "latitude": f.latitude,
                    "longitude": f.longitude,
                    "status": f.status.value,
                    "capacity": f.capacity,
                    "current_census": f.current_census,
                    "surgical": f.surgical,
                    "distance_km": round(dist, 2),
                }
            )

        ranked.sort(key=lambda x: x["distance_km"])
        return ranked

    # ------------------------------------------------------------------
    # PERSTAT Medical
    # ------------------------------------------------------------------

    @staticmethod
    async def generate_perstat_medical(
        db: AsyncSession,
        unit_id: int,
    ) -> Dict[str, Any]:
        """Aggregate medical PERSTAT for a unit.

        Counts open/in-progress casualties by triage category,
        evacuation status, and precedence.
        """
        result = await db.execute(
            select(CasualtyReport).where(
                CasualtyReport.unit_id == unit_id,
                CasualtyReport.status.in_(
                    [CasualtyReportStatus.OPEN, CasualtyReportStatus.IN_PROGRESS]
                ),
            )
        )
        reports = result.scalars().all()

        triage_breakdown: Dict[str, int] = {}
        evac_breakdown: Dict[str, int] = {}
        precedence_breakdown: Dict[str, int] = {}
        total_patients = 0

        for r in reports:
            total_patients += r.number_of_patients

            tc = r.triage_category.value if r.triage_category else "UNASSIGNED"
            triage_breakdown[tc] = triage_breakdown.get(tc, 0) + r.number_of_patients

            es = r.evacuation_status.value
            evac_breakdown[es] = evac_breakdown.get(es, 0) + 1

            prec = r.precedence.value
            precedence_breakdown[prec] = precedence_breakdown.get(prec, 0) + 1

        return {
            "unit_id": unit_id,
            "total_open_reports": len(reports),
            "total_patients": total_patients,
            "triage_breakdown": triage_breakdown,
            "evacuation_status_breakdown": evac_breakdown,
            "precedence_breakdown": precedence_breakdown,
        }
