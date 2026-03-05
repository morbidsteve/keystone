"""Personnel analytics service for manning, qualifications, and readiness."""

from datetime import date, timedelta
from typing import Any, Dict, List

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.manning import BilletStructure
from app.models.personnel import (
    DutyStatus,
    Personnel,
    PersonnelStatus,
)


class PersonnelAnalyticsService:
    """Compute personnel analytics: strength, MOS fill, qualifications, readiness."""

    @staticmethod
    async def get_unit_strength(db: AsyncSession, unit_id: int) -> Dict[str, Any]:
        """Counts by status/duty_status, fill rate vs billets."""
        # Get all personnel assigned to the unit
        result = await db.execute(
            select(Personnel).where(
                Personnel.unit_id == unit_id,
                Personnel.status != PersonnelStatus.INACTIVE,
            )
        )
        personnel_list = result.scalars().all()

        # Count billets for authorized total
        billet_result = await db.execute(
            select(func.count(BilletStructure.id)).where(
                BilletStructure.unit_id == unit_id
            )
        )
        authorized_total = billet_result.scalar() or 0

        total_assigned = len(personnel_list)

        # Duty status breakdown
        duty_status_breakdown: Dict[str, int] = {}
        present_count = 0
        for p in personnel_list:
            ds = p.duty_status.value if p.duty_status else "UNKNOWN"
            duty_status_breakdown[ds] = duty_status_breakdown.get(ds, 0) + 1
            if p.duty_status == DutyStatus.PRESENT:
                present_count += 1

        # Personnel status breakdown
        status_breakdown: Dict[str, int] = {}
        for p in personnel_list:
            s = p.status.value if p.status else "UNKNOWN"
            status_breakdown[s] = status_breakdown.get(s, 0) + 1

        fill_rate = (
            round(total_assigned / authorized_total * 100, 1)
            if authorized_total > 0
            else 0.0
        )

        return {
            "unit_id": unit_id,
            "total_assigned": total_assigned,
            "total_present": present_count,
            "total_authorized": authorized_total,
            "fill_rate_pct": fill_rate,
            "duty_status_breakdown": duty_status_breakdown,
            "status_breakdown": status_breakdown,
        }

    @staticmethod
    async def get_mos_fill(db: AsyncSession, unit_id: int) -> Dict[str, Any]:
        """T/O required vs assigned by MOS."""
        # Get billet MOS requirements
        billet_result = await db.execute(
            select(BilletStructure).where(BilletStructure.unit_id == unit_id)
        )
        billets = billet_result.scalars().all()

        # Count required MOS from billets
        mos_required: Dict[str, int] = {}
        mos_filled: Dict[str, int] = {}
        for b in billets:
            mos = b.mos_required or "UNSPECIFIED"
            mos_required[mos] = mos_required.get(mos, 0) + 1
            if b.is_filled:
                mos_filled[mos] = mos_filled.get(mos, 0) + 1

        # Get assigned personnel MOS counts
        personnel_result = await db.execute(
            select(Personnel.mos, func.count(Personnel.id))
            .where(
                Personnel.unit_id == unit_id,
                Personnel.status != PersonnelStatus.INACTIVE,
            )
            .group_by(Personnel.mos)
        )
        assigned_by_mos: Dict[str, int] = {}
        for row in personnel_result.all():
            mos = row[0] or "UNSPECIFIED"
            assigned_by_mos[mos] = row[1]

        # Build fill report
        all_mos = set(list(mos_required.keys()) + list(assigned_by_mos.keys()))
        mos_fill: List[Dict[str, Any]] = []
        for mos in sorted(all_mos):
            required = mos_required.get(mos, 0)
            assigned = assigned_by_mos.get(mos, 0)
            filled = mos_filled.get(mos, 0)
            shortfall = max(required - assigned, 0)
            mos_fill.append(
                {
                    "mos": mos,
                    "required": required,
                    "assigned": assigned,
                    "filled_billets": filled,
                    "shortfall": shortfall,
                    "fill_pct": round(assigned / required * 100, 1)
                    if required > 0
                    else 0.0,
                }
            )

        return {
            "unit_id": unit_id,
            "mos_fill": mos_fill,
        }

    @staticmethod
    async def get_qualification_status(
        db: AsyncSession, unit_id: int
    ) -> Dict[str, Any]:
        """Percentage current on rifle range, PFT, CFT, swim."""
        result = await db.execute(
            select(Personnel).where(
                Personnel.unit_id == unit_id,
                Personnel.status != PersonnelStatus.INACTIVE,
            )
        )
        personnel_list = result.scalars().all()
        total = len(personnel_list)
        if total == 0:
            return {
                "unit_id": unit_id,
                "rifle_qual_pct": 0.0,
                "pft_current_pct": 0.0,
                "cft_current_pct": 0.0,
                "swim_qual_pct": 0.0,
                "total_personnel": 0,
            }

        today = date.today()
        one_year_ago = today - timedelta(days=365)

        rifle_qualified = sum(
            1 for p in personnel_list if p.rifle_qual and p.rifle_qual.value != "UNQUAL"
        )
        pft_current = sum(
            1
            for p in personnel_list
            if p.pft_score is not None and p.pft_date and p.pft_date >= one_year_ago
        )
        cft_current = sum(
            1
            for p in personnel_list
            if p.cft_score is not None and p.cft_date and p.cft_date >= one_year_ago
        )
        swim_qualified = sum(
            1 for p in personnel_list if p.swim_qual and p.swim_qual.value != "UNQUAL"
        )

        return {
            "unit_id": unit_id,
            "rifle_qual_pct": round(rifle_qualified / total * 100, 1),
            "pft_current_pct": round(pft_current / total * 100, 1),
            "cft_current_pct": round(cft_current / total * 100, 1),
            "swim_qual_pct": round(swim_qualified / total * 100, 1),
            "total_personnel": total,
        }

    @staticmethod
    async def get_upcoming_losses(
        db: AsyncSession, unit_id: int, days: int = 90
    ) -> Dict[str, Any]:
        """EAS within N days."""
        today = date.today()
        cutoff = today + timedelta(days=days)

        result = await db.execute(
            select(Personnel)
            .where(
                Personnel.unit_id == unit_id,
                Personnel.status != PersonnelStatus.INACTIVE,
                Personnel.eaos.isnot(None),
                Personnel.eaos <= cutoff,
                Personnel.eaos >= today,
            )
            .order_by(Personnel.eaos)
        )
        personnel_list = result.scalars().all()

        losses: List[Dict[str, Any]] = []
        for p in personnel_list:
            losses.append(
                {
                    "personnel_id": p.id,
                    "name": f"{p.last_name}, {p.first_name}",
                    "rank": p.rank,
                    "mos": p.mos,
                    "eaos": p.eaos.isoformat() if p.eaos else None,
                    "days_remaining": (p.eaos - today).days if p.eaos else None,
                }
            )

        return {
            "unit_id": unit_id,
            "days_window": days,
            "losses": losses,
        }

    @staticmethod
    async def get_key_billet_vacancies(
        db: AsyncSession, unit_id: int
    ) -> Dict[str, Any]:
        """Unfilled key billets."""
        result = await db.execute(
            select(BilletStructure).where(
                BilletStructure.unit_id == unit_id,
                BilletStructure.is_key_billet.is_(True),
                BilletStructure.is_filled.is_(False),
            )
        )
        vacancies_list = result.scalars().all()

        vacancies: List[Dict[str, Any]] = []
        for b in vacancies_list:
            vacancies.append(
                {
                    "billet_id": b.id,
                    "billet_id_code": b.billet_id_code,
                    "billet_title": b.billet_title,
                    "mos_required": b.mos_required,
                    "rank_required": b.rank_required,
                }
            )

        return {
            "unit_id": unit_id,
            "vacancies": vacancies,
        }

    @staticmethod
    async def calculate_personnel_readiness(
        db: AsyncSession, unit_id: int
    ) -> Dict[str, Any]:
        """P-rating (P1-P5): 50% fill + 30% quals + 20% fitness."""
        # Fill component (50% weight)
        strength = await PersonnelAnalyticsService.get_unit_strength(db, unit_id)
        fill_rate = strength["fill_rate_pct"]
        fill_score = min(fill_rate, 100.0) * 0.5

        # Qualification component (30% weight)
        qual_status = await PersonnelAnalyticsService.get_qualification_status(
            db, unit_id
        )
        qual_avg = 0.0
        if qual_status["total_personnel"] > 0:
            qual_avg = (
                qual_status["rifle_qual_pct"]
                + qual_status["pft_current_pct"]
                + qual_status["cft_current_pct"]
                + qual_status["swim_qual_pct"]
            ) / 4.0
        qual_score = min(qual_avg, 100.0) * 0.3

        # Fitness component (20% weight) — based on PFT/CFT currency
        fitness_avg = 0.0
        if qual_status["total_personnel"] > 0:
            fitness_avg = (
                qual_status["pft_current_pct"] + qual_status["cft_current_pct"]
            ) / 2.0
        fitness_score = min(fitness_avg, 100.0) * 0.2

        composite = round(fill_score + qual_score + fitness_score, 1)

        # Determine P-rating
        if composite >= 90:
            p_rating = "P1"
        elif composite >= 75:
            p_rating = "P2"
        elif composite >= 60:
            p_rating = "P3"
        elif composite >= 45:
            p_rating = "P4"
        else:
            p_rating = "P5"

        return {
            "unit_id": unit_id,
            "p_rating": p_rating,
            "fill_score": round(fill_score, 1),
            "qual_score": round(qual_score, 1),
            "fitness_score": round(fitness_score, 1),
            "composite_score": composite,
            "details": {
                "fill_rate_pct": fill_rate,
                "qual_avg_pct": round(qual_avg, 1),
                "fitness_avg_pct": round(fitness_avg, 1),
                "total_assigned": strength["total_assigned"],
                "total_authorized": strength["total_authorized"],
            },
        }
