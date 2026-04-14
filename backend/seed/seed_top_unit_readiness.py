"""Seed initial readiness snapshots and unit strength for top-level units.

Specifically ensures unit_id=1 (HQMC) and unit_id=2 (I MEF) and any other
top-of-tree units have at least one snapshot + strength row, so that the
default Readiness page (which loads unit_id=1) does not 404.

This complements seed_operational_data.seed_readiness_snapshots (which seeds
MEF/DIV/WING/GRP/REGT only). HQMC and any unit that the bulk seeder missed
is filled in here.

Idempotent — only inserts a snapshot/strength if the unit currently has none.
"""

import logging
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.readiness_snapshot import UnitReadinessSnapshot
from app.models.unit import Echelon, Unit
from app.models.unit_strength import UnitStrength

logger = logging.getLogger(__name__)


# Echelons that should always have a current readiness snapshot for the
# Readiness page's default selectors to function.
_TOP_ECHELONS = (
    Echelon.HQMC,
    Echelon.MEF,
    Echelon.DIV,
    Echelon.WING,
    Echelon.GRP,
    Echelon.REGT,
    Echelon.BN,
)


async def _has_snapshot(db: AsyncSession, unit_id: int) -> bool:
    res = await db.execute(
        select(func.count(UnitReadinessSnapshot.id)).where(
            UnitReadinessSnapshot.unit_id == unit_id
        )
    )
    return (res.scalar() or 0) > 0


async def _has_strength(db: AsyncSession, unit_id: int) -> bool:
    res = await db.execute(
        select(func.count(UnitStrength.id)).where(UnitStrength.unit_id == unit_id)
    )
    return (res.scalar() or 0) > 0


async def seed_top_unit_readiness(db: AsyncSession) -> int:
    """Backfill readiness snapshots + strength rows for top-tier units.

    Returns the number of (snapshot OR strength) rows inserted.
    """
    units_res = await db.execute(
        select(Unit).where(Unit.echelon.in_(_TOP_ECHELONS))
    )
    units = units_res.scalars().all()

    inserted = 0
    today = date.today()
    now = datetime.now(timezone.utc)

    for unit in units:
        if not await _has_snapshot(db, unit.id):
            db.add(
                UnitReadinessSnapshot(
                    unit_id=unit.id,
                    snapshot_date=now,
                    overall_readiness_pct=82.5,
                    equipment_readiness_pct=85.0,
                    supply_readiness_pct=78.0,
                    personnel_fill_pct=88.0,
                    training_readiness_pct=80.0,
                    c_rating="C-2",
                    s_rating="S-2",
                    r_rating="R-2",
                    p_rating="P-2",
                    t_rating="T-2",
                    limiting_factor="CL IX repair parts shortage",
                    notes=f"Initial baseline snapshot ({today.isoformat()}).",
                    is_official=True,
                )
            )
            inserted += 1

        if not await _has_strength(db, unit.id):
            # Sensible default: officer-heavy headquarters at upper echelons,
            # large enlisted population at battalion. The exact numbers are
            # only for dev seed — production data flows in via reports.
            if unit.echelon in (Echelon.HQMC, Echelon.MEF):
                auth_off, asg_off = 600, 555
                auth_enl, asg_enl = 25_000, 22_500
            elif unit.echelon == Echelon.DIV:
                auth_off, asg_off = 200, 180
                auth_enl, asg_enl = 18_000, 16_300
            elif unit.echelon == Echelon.WING:
                auth_off, asg_off = 150, 138
                auth_enl, asg_enl = 6_000, 5_500
            elif unit.echelon == Echelon.GRP:
                auth_off, asg_off = 80, 72
                auth_enl, asg_enl = 2_500, 2_300
            elif unit.echelon == Echelon.REGT:
                auth_off, asg_off = 50, 45
                auth_enl, asg_enl = 3_500, 3_200
            else:  # BN
                auth_off, asg_off = 42, 38
                auth_enl, asg_enl = 820, 742

            total_auth = auth_off + auth_enl
            total_asg = asg_off + asg_enl
            fill = round(total_asg / total_auth * 100, 1) if total_auth else 0.0

            db.add(
                UnitStrength(
                    unit_id=unit.id,
                    reported_at=now,
                    authorized_officers=auth_off,
                    assigned_officers=asg_off,
                    authorized_enlisted=auth_enl,
                    assigned_enlisted=asg_enl,
                    attached=14,
                    detached=5,
                    tad=22,
                    leave=38,
                    medical=15,
                    ua=0,
                    total_authorized=total_auth,
                    total_assigned=total_asg,
                    fill_pct=fill,
                    mos_shortfalls=[],
                    notes=None,
                )
            )
            inserted += 1

    if inserted:
        await db.flush()

    return inserted
