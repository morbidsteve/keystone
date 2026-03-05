# KEYSTONE — Readiness & Reporting Module

## Mission

Build a comprehensive **unit readiness reporting and trends system** that aggregates equipment, supply, personnel, and training data into a unified readiness dashboard. The system calculates readiness by periodic snapshots, applies DRRS (Defense Readiness Reporting System) rating methodologies (C/S/R/P ratings and overall T-levels), and enables commanders to drill down from macro (brigade) to micro (squad-level) readiness at a glance.

**Outputs:**
- Overall readiness percentage (0-100%)
- DRRS C-rating (C-1 to C-4) — composite combat readiness
- S-rating (S-1 to S-4) — supply readiness
- R-rating (R-1 to R-4) — equipment/maintenance readiness
- P-rating (P-1 to P-4) — personnel readiness
- T-rating (T-1 to T-4) — training readiness
- Limiting factor analysis (what's dragging readiness down)
- 30/60/90-day trend charts
- Hierarchical rollup view (parent unit sees children's readiness)
- Unit strength T/O vs T/E with MOS-level shortfalls

---

## Database Models

### New Models to Create

Create the following new models in `backend/app/models/`:

#### `readiness_snapshot.py` — Unit Readiness Snapshot

This is the heart of the readiness system. One snapshot per unit per reporting period (typically daily, but triggered manually or on schedule).

```python
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class UnitReadinessSnapshot(Base):
    """Periodic readiness snapshot for a unit at a specific point in time.

    Represents the calculated readiness of a unit on a specific date.
    Includes all readiness components (equipment, supply, personnel, training)
    and DRRS ratings (C/S/R/P/T).
    """
    __tablename__ = "unit_readiness_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    snapshot_date = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # ── Overall Readiness Percentage (0-100) ──────────────────────────
    overall_readiness_pct = Column(Float, nullable=False)  # Weighted composite

    # ── Component Readiness Percentages ────────────────────────────────
    equipment_readiness_pct = Column(Float, nullable=True)  # From EquipmentStatus (mission_capable / total)
    supply_readiness_pct = Column(Float, nullable=True)    # From SupplyStatusRecord (DOS and GREEN status)
    personnel_fill_pct = Column(Float, nullable=True)      # T/E (assigned / authorized)
    training_readiness_pct = Column(Float, nullable=True)  # Optional: from personnel training status

    # ── DRRS Ratings (T-1 through T-4, C-1 through C-4, etc.) ─────────
    # Each rating: "1"=FULL, "2"=SUBSTANTIAL, "3"=PARTIAL, "4"=MINIMAL
    t_rating = Column(String(5), default="T-4", nullable=False)  # Training
    c_rating = Column(String(5), default="C-4", nullable=False)  # Composite (overall)
    s_rating = Column(String(5), default="S-4", nullable=False)  # Supply
    r_rating = Column(String(5), default="R-4", nullable=False)  # Equipment/Readiness
    p_rating = Column(String(5), default="P-4", nullable=False)  # Personnel

    # ── Analysis & Context ─────────────────────────────────────────────
    limiting_factor = Column(Text, nullable=True)  # e.g., "Supply shortfall: fuel at 45%"
    notes = Column(Text, nullable=True)            # Commander notes
    reported_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    is_official = Column(Boolean, default=False)   # Has this snapshot been formally filed?

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    unit = relationship("Unit", back_populates="readiness_snapshots")
    reported_by = relationship("User", foreign_keys=[reported_by_id])


class ReadinessThreshold(Base):
    """Configurable readiness thresholds by echelon and metric.

    Enables customization of what constitutes GREEN (C-1), AMBER (C-2/C-3), or RED (C-4)
    for each readiness component at different echelons (platoon, company, battalion, etc.).
    """
    __tablename__ = "readiness_thresholds"

    id = Column(Integer, primary_key=True, index=True)
    echelon = Column(String(30), nullable=False)  # "PLATOON", "COMPANY", "BATTALION", etc.
    metric_name = Column(String(100), nullable=False)  # "equipment", "supply", "personnel", "training", "composite"

    # Thresholds for rating boundaries
    # C-1 (green): >= green_min_pct
    # C-2/C-3 (amber): green_min_pct > x >= amber_min_pct
    # C-4 (red): < amber_min_pct
    green_min_pct = Column(Float, default=90.0, nullable=False)   # >= 90% = C-1
    amber_min_pct = Column(Float, default=75.0, nullable=False)   # >= 75% = C-2, < 75% = C-3/C-4

    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("echelon", "metric_name", name="uq_echelon_metric"),
    )


# Add to existing Unit model:
# readiness_snapshots = relationship("UnitReadinessSnapshot", back_populates="unit")
```

#### `unit_strength.py` — Unit Strength (Table of Organization vs Table of Equipment)

```python
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class UnitStrength(Base):
    """Tracks authorized T/O (Table of Organization) vs assigned T/E (Table of Equipment).

    Used to calculate personnel fill percentage and identify MOS shortfalls.
    Typically updated monthly or when unit changes occur.
    """
    __tablename__ = "unit_strength"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    reported_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    # ── Officer Strength ───────────────────────────────────────────────
    authorized_officers = Column(Integer, nullable=False, default=0)
    assigned_officers = Column(Integer, nullable=False, default=0)

    # ── Enlisted Strength ──────────────────────────────────────────────
    authorized_enlisted = Column(Integer, nullable=False, default=0)
    assigned_enlisted = Column(Integer, nullable=False, default=0)

    # ── Personnel Status Breakdown (attached, TDY, on leave, etc.) ─────
    attached = Column(Integer, default=0)                # Personnel attached from other units
    detached = Column(Integer, default=0)                # Personnel attached elsewhere
    tad = Column(Integer, default=0)                     # Temporary Additional Duty
    leave = Column(Integer, default=0)                   # On leave (but not deducted from assigned)
    medical = Column(Integer, default=0)                 # Medical hold, unable to deploy
    ua = Column(Integer, default=0)                      # Unauthorized Absence

    # ── Derived Totals ─────────────────────────────────────────────────
    total_authorized = Column(Integer, nullable=False, default=0)  # Officers + Enlisted authorized
    total_assigned = Column(Integer, nullable=False, default=0)    # Officers + Enlisted assigned
    fill_pct = Column(Float, nullable=False, default=0.0)          # total_assigned / total_authorized * 100

    # ── MOS / Specialty Shortfalls (JSON) ──────────────────────────────
    # Example: [{"mos": "0311", "mos_title": "Rifleman", "authorized": 10, "assigned": 8, "shortfall": 2}]
    mos_shortfalls = Column(JSON, nullable=True, default=list)

    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    unit = relationship("Unit", back_populates="strength_reports")
```

---

## Readiness Calculation Service

Create `backend/app/services/readiness.py` with the core calculation logic.

```python
"""
Readiness calculation service for KEYSTONE.

Implements DRRS (Defense Readiness Reporting System) methodology:
  - C-rating: Composite Combat Readiness (0-100%)
  - S-rating: Supply Readiness
  - R-rating: Equipment/Maintenance Readiness
  - P-rating: Personnel Readiness
  - T-rating: Training Readiness

Rating Scale:
  C-1 / S-1 / R-1 / P-1 / T-1: >= 90% (FULL READINESS)
  C-2 / S-2 / R-2 / P-2 / T-2: 75-89% (SUBSTANTIAL)
  C-3 / S-3 / R-3 / P-3 / T-3: 60-74% (PARTIAL)
  C-4 / S-4 / R-4 / P-4 / T-4: < 60% (MINIMAL)
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import logging

from app.models.unit import Unit
from app.models.equipment import EquipmentStatus
from app.models.supply import SupplyStatusRecord
from app.models.unit_strength import UnitStrength
from app.models.readiness_snapshot import UnitReadinessSnapshot, ReadinessThreshold

logger = logging.getLogger(__name__)


class ReadinessService:

    # ── Rating Thresholds (default, can be overridden by database) ────
    DEFAULT_THRESHOLDS = {
        "green_min": 90.0,   # C-1
        "amber_min": 75.0,   # C-2
        "partial_min": 60.0, # C-3
        # < 60 = C-4
    }

    @staticmethod
    def _percent_to_rating(pct: Optional[float], thresholds: Dict[str, float] = None) -> str:
        """Convert a percentage to a DRRS rating (1-4).

        Args:
            pct: Readiness percentage (0-100), or None if unavailable
            thresholds: Dict with keys 'green_min', 'amber_min', 'partial_min'

        Returns:
            Rating string: "C-1", "C-2", "C-3", or "C-4"
        """
        if pct is None:
            return "C-4"  # Default to minimal if no data

        t = thresholds or ReadinessService.DEFAULT_THRESHOLDS

        if pct >= t["green_min"]:
            return "C-1"
        elif pct >= t["amber_min"]:
            return "C-2"
        elif pct >= t["partial_min"]:
            return "C-3"
        else:
            return "C-4"

    @staticmethod
    async def calculate_equipment_readiness(
        unit_id: int,
        db: AsyncSession
    ) -> tuple[float, Optional[str]]:
        """Calculate equipment readiness for a unit.

        Aggregates EquipmentStatus records for the unit and its subordinates.
        Readiness = (mission_capable + nmc_m) / total * 100

        Returns:
            (readiness_pct, limiting_factor_text)
        """
        # Get all equipment assigned to this unit
        stmt = select(EquipmentStatus).where(EquipmentStatus.unit_id == unit_id)
        result = await db.execute(stmt)
        equipment_records = result.scalars().all()

        if not equipment_records:
            return (0.0, "No equipment assigned")

        total = len(equipment_records)
        mission_capable = sum(
            1 for e in equipment_records
            if e.mission_capable is True
        )
        nmc_m = sum(
            1 for e in equipment_records
            if e.nmc_m > 0  # NMC-M = Not Mission Capable Maintenance
        )

        serviceable = mission_capable + nmc_m
        pct = (serviceable / total) * 100.0 if total > 0 else 0.0

        # Identify limiting factor
        nmc_s_count = total - serviceable
        limiting = None
        if nmc_s_count > 0:
            limiting = f"Equipment: {nmc_s_count} items NMC-S (not mission capable - supply)"

        return (pct, limiting)

    @staticmethod
    async def calculate_supply_readiness(
        unit_id: int,
        db: AsyncSession
    ) -> tuple[float, Optional[str]]:
        """Calculate supply readiness for a unit.

        Aggregates SupplyStatusRecord for the unit.
        Items in GREEN status or with sufficient DOS count as ready.

        Readiness = (ready items) / (total critical items) * 100
        """
        stmt = select(SupplyStatusRecord).where(SupplyStatusRecord.unit_id == unit_id)
        result = await db.execute(stmt)
        supply_records = result.scalars().all()

        if not supply_records:
            return (0.0, "No supply records")

        # Assume items with status "GREEN" or DOS >= 10 days are ready
        total = len(supply_records)
        ready = sum(
            1 for s in supply_records
            if s.status == "GREEN" or (s.dos and s.dos >= 10)
        )

        pct = (ready / total) * 100.0 if total > 0 else 0.0

        limiting = None
        red_count = sum(1 for s in supply_records if s.status == "RED")
        if red_count > 0:
            limiting = f"Supply: {red_count} critical items RED status"

        return (pct, limiting)

    @staticmethod
    async def calculate_personnel_readiness(
        unit_id: int,
        db: AsyncSession
    ) -> tuple[float, Optional[str]]:
        """Calculate personnel readiness (fill percentage).

        Uses latest UnitStrength record for the unit.
        Readiness = total_assigned / total_authorized * 100
        """
        # Get the most recent strength report for this unit
        stmt = (
            select(UnitStrength)
            .where(UnitStrength.unit_id == unit_id)
            .order_by(UnitStrength.reported_at.desc())
            .limit(1)
        )
        result = await db.execute(stmt)
        strength = result.scalar()

        if not strength or strength.total_authorized == 0:
            return (0.0, "No strength data available")

        pct = strength.fill_pct

        limiting = None
        shortfall = strength.total_authorized - strength.total_assigned
        if shortfall > 0:
            limiting = f"Personnel: {shortfall} personnel below authorized ({pct:.1f}% fill)"

        # If MOS shortfalls exist, include them
        if strength.mos_shortfalls:
            mos_list = ", ".join([m["mos_title"] for m in strength.mos_shortfalls[:3]])
            limiting = f"Personnel: {mos_list} understaffed; {pct:.1f}% overall fill"

        return (pct, limiting)

    @staticmethod
    async def calculate_training_readiness(
        unit_id: int,
        db: AsyncSession
    ) -> tuple[float, Optional[str]]:
        """Calculate training readiness.

        [FUTURE] Currently a placeholder. Would aggregate from Personnel training status.
        Default to 80% for now.
        """
        # TODO: Integrate with Personnel model once training tracking is added
        return (80.0, None)

    @staticmethod
    async def calculate_composite_readiness(
        unit_id: int,
        db: AsyncSession,
        weights: Optional[Dict[str, float]] = None
    ) -> tuple[float, Optional[str]]:
        """Calculate overall composite readiness with weighted components.

        Default weights: 35% equipment, 25% supply, 25% personnel, 15% training

        Returns:
            (composite_pct, limiting_factor_text)
        """
        if weights is None:
            weights = {
                "equipment": 0.35,
                "supply": 0.25,
                "personnel": 0.25,
                "training": 0.15,
            }

        eq_pct, eq_limit = await ReadinessService.calculate_equipment_readiness(unit_id, db)
        sup_pct, sup_limit = await ReadinessService.calculate_supply_readiness(unit_id, db)
        pers_pct, pers_limit = await ReadinessService.calculate_personnel_readiness(unit_id, db)
        train_pct, train_limit = await ReadinessService.calculate_training_readiness(unit_id, db)

        composite = (
            eq_pct * weights["equipment"] +
            sup_pct * weights["supply"] +
            pers_pct * weights["personnel"] +
            train_pct * weights["training"]
        )

        # Determine the limiting factor (lowest scoring component)
        components = [
            ("Equipment", eq_pct, eq_limit),
            ("Supply", sup_pct, sup_limit),
            ("Personnel", pers_pct, pers_limit),
            ("Training", train_pct, train_limit),
        ]
        limiting = min(components, key=lambda x: x[1])
        limiting_text = f"{limiting[0]}: {limiting[1]:.1f}%"
        if limiting[2]:
            limiting_text += f" — {limiting[2]}"

        return (composite, limiting_text)

    @staticmethod
    async def generate_readiness_snapshot(
        unit_id: int,
        db: AsyncSession,
        reported_by_id: Optional[int] = None,
        notes: Optional[str] = None,
        is_official: bool = False
    ) -> UnitReadinessSnapshot:
        """Generate a complete readiness snapshot for a unit.

        Calculates all readiness components, assigns DRRS ratings, and creates
        a UnitReadinessSnapshot record.

        Returns:
            UnitReadinessSnapshot object
        """
        # Calculate all components
        eq_pct, _ = await ReadinessService.calculate_equipment_readiness(unit_id, db)
        sup_pct, _ = await ReadinessService.calculate_supply_readiness(unit_id, db)
        pers_pct, _ = await ReadinessService.calculate_personnel_readiness(unit_id, db)
        train_pct, _ = await ReadinessService.calculate_training_readiness(unit_id, db)
        composite_pct, limiting = await ReadinessService.calculate_composite_readiness(unit_id, db)

        # Convert to DRRS ratings
        c_rating = f"C-{ReadinessService._percent_to_rating(composite_pct).split('-')[1]}"
        s_rating = f"S-{ReadinessService._percent_to_rating(sup_pct).split('-')[1]}"
        r_rating = f"R-{ReadinessService._percent_to_rating(eq_pct).split('-')[1]}"
        p_rating = f"P-{ReadinessService._percent_to_rating(pers_pct).split('-')[1]}"
        t_rating = f"T-{ReadinessService._percent_to_rating(train_pct).split('-')[1]}"

        # Create snapshot
        snapshot = UnitReadinessSnapshot(
            unit_id=unit_id,
            snapshot_date=datetime.utcnow(),
            overall_readiness_pct=composite_pct,
            equipment_readiness_pct=eq_pct,
            supply_readiness_pct=sup_pct,
            personnel_fill_pct=pers_pct,
            training_readiness_pct=train_pct,
            c_rating=c_rating,
            s_rating=s_rating,
            r_rating=r_rating,
            p_rating=p_rating,
            t_rating=t_rating,
            limiting_factor=limiting,
            notes=notes,
            reported_by_id=reported_by_id,
            is_official=is_official,
        )

        db.add(snapshot)
        await db.commit()
        await db.refresh(snapshot)

        logger.info(
            f"Readiness snapshot created for unit {unit_id}: "
            f"{c_rating} ({composite_pct:.1f}%)"
        )

        return snapshot

    @staticmethod
    async def roll_up_readiness(
        parent_unit_id: int,
        db: AsyncSession
    ) -> Dict[str, Any]:
        """Aggregate readiness from subordinate units to parent.

        For a battalion, aggregate readiness from all companies.
        For a company, aggregate from all platoons.

        Returns:
            Dict with aggregated readiness stats
        """
        # Get all subordinate units
        stmt = (
            select(Unit)
            .where(Unit.parent_id == parent_unit_id)
            .order_by(Unit.unit_name)
        )
        result = await db.execute(stmt)
        subordinates = result.scalars().all()

        if not subordinates:
            return {}

        # Get latest snapshot for each subordinate
        snapshots = []
        for sub in subordinates:
            snap_stmt = (
                select(UnitReadinessSnapshot)
                .where(UnitReadinessSnapshot.unit_id == sub.id)
                .order_by(UnitReadinessSnapshot.snapshot_date.desc())
                .limit(1)
            )
            snap_result = await db.execute(snap_stmt)
            snap = snap_result.scalar()
            if snap:
                snapshots.append(snap)

        if not snapshots:
            return {"message": "No subordinate readiness data"}

        # Calculate averages
        avg_overall = sum(s.overall_readiness_pct for s in snapshots) / len(snapshots)
        avg_equipment = sum(s.equipment_readiness_pct or 0 for s in snapshots) / len(snapshots)
        avg_supply = sum(s.supply_readiness_pct or 0 for s in snapshots) / len(snapshots)
        avg_personnel = sum(s.personnel_fill_pct or 0 for s in snapshots) / len(snapshots)

        return {
            "unit_id": parent_unit_id,
            "num_subordinates": len(snapshots),
            "avg_overall_readiness_pct": avg_overall,
            "avg_equipment_readiness_pct": avg_equipment,
            "avg_supply_readiness_pct": avg_supply,
            "avg_personnel_fill_pct": avg_personnel,
            "subordinates": [
                {
                    "unit_id": s.unit_id,
                    "unit_name": next(u.unit_name for u in subordinates if u.id == s.unit_id),
                    "c_rating": s.c_rating,
                    "overall_readiness_pct": s.overall_readiness_pct,
                    "limiting_factor": s.limiting_factor,
                }
                for s in snapshots
            ],
        }
```

---

## API Endpoints

Create `backend/app/api/readiness.py` with the following endpoints:

```python
"""API endpoints for readiness reporting and snapshots."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from datetime import datetime, timedelta
from typing import Optional
import logging

from app.database import get_db
from app.auth import get_current_user
from app.rbac import get_accessible_units
from app.models.user import User
from app.models.unit import Unit
from app.models.readiness_snapshot import UnitReadinessSnapshot
from app.models.unit_strength import UnitStrength
from app.services.readiness import ReadinessService
from app.schemas.readiness import (
    ReadinessSnapshotResponse,
    ReadinessDashboardResponse,
    UnitStrengthResponse,
    ReadinessTrendResponse,
    ReadinessRollupResponse,
)

router = APIRouter(prefix="/api/v1/readiness", tags=["readiness"])
logger = logging.getLogger(__name__)


# ── GET /readiness/{unit_id} ──────────────────────────────────────────
@router.get("/{unit_id}", response_model=ReadinessSnapshotResponse)
async def get_current_readiness(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the most recent readiness snapshot for a unit.

    Returns C/S/R/P/T ratings, overall readiness %, and limiting factors.
    """
    # RBAC check
    accessible_units = await get_accessible_units(current_user.id, db)
    if unit_id not in accessible_units:
        raise HTTPException(status_code=403, detail="Not authorized for this unit")

    # Get most recent snapshot
    stmt = (
        select(UnitReadinessSnapshot)
        .where(UnitReadinessSnapshot.unit_id == unit_id)
        .order_by(desc(UnitReadinessSnapshot.snapshot_date))
        .limit(1)
    )
    result = await db.execute(stmt)
    snapshot = result.scalar()

    if not snapshot:
        raise HTTPException(status_code=404, detail="No readiness data for this unit")

    return snapshot


# ── GET /readiness/{unit_id}/history ──────────────────────────────────
@router.get("/{unit_id}/history", response_model=ReadinessTrendResponse)
async def get_readiness_history(
    unit_id: int,
    days: int = Query(30, ge=7, le=365, description="Number of days to retrieve"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get readiness trend over the last N days (default 30).

    Used for trend charts and historical analysis.
    """
    accessible_units = await get_accessible_units(current_user.id, db)
    if unit_id not in accessible_units:
        raise HTTPException(status_code=403, detail="Not authorized for this unit")

    cutoff_date = datetime.utcnow() - timedelta(days=days)

    stmt = (
        select(UnitReadinessSnapshot)
        .where(
            UnitReadinessSnapshot.unit_id == unit_id,
            UnitReadinessSnapshot.snapshot_date >= cutoff_date,
        )
        .order_by(UnitReadinessSnapshot.snapshot_date)
    )
    result = await db.execute(stmt)
    snapshots = result.scalars().all()

    if not snapshots:
        raise HTTPException(status_code=404, detail="No readiness history available")

    return {
        "unit_id": unit_id,
        "days": days,
        "snapshot_count": len(snapshots),
        "snapshots": snapshots,
    }


# ── GET /readiness/{unit_id}/rollup ────────────────────────────────────
@router.get("/{unit_id}/rollup", response_model=ReadinessRollupResponse)
async def get_readiness_rollup(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get aggregated readiness for all subordinate units.

    Shows parent unit's readiness alongside each subordinate's rating.
    Used for hierarchical drill-down view.
    """
    accessible_units = await get_accessible_units(current_user.id, db)
    if unit_id not in accessible_units:
        raise HTTPException(status_code=403, detail="Not authorized for this unit")

    rollup = await ReadinessService.roll_up_readiness(unit_id, db)

    if not rollup:
        raise HTTPException(status_code=404, detail="No subordinate units or readiness data")

    return rollup


# ── GET /readiness/dashboard ──────────────────────────────────────────
@router.get("", response_model=ReadinessDashboardResponse)
async def get_readiness_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get readiness dashboard for all units accessible to the user.

    Returns current readiness for each unit at the user's view level,
    suitable for a top-level dashboard card.
    """
    accessible_unit_ids = await get_accessible_units(current_user.id, db)

    # Get most recent snapshot for each accessible unit
    units_readiness = []
    for unit_id in accessible_unit_ids:
        stmt = (
            select(UnitReadinessSnapshot)
            .where(UnitReadinessSnapshot.unit_id == unit_id)
            .order_by(desc(UnitReadinessSnapshot.snapshot_date))
            .limit(1)
        )
        result = await db.execute(stmt)
        snapshot = result.scalar()

        if snapshot:
            units_readiness.append({
                "unit_id": unit_id,
                "unit_name": (await db.get(Unit, unit_id)).unit_name,
                "c_rating": snapshot.c_rating,
                "overall_readiness_pct": snapshot.overall_readiness_pct,
                "limiting_factor": snapshot.limiting_factor,
                "snapshot_date": snapshot.snapshot_date,
            })

    return {
        "timestamp": datetime.utcnow(),
        "unit_count": len(units_readiness),
        "units": units_readiness,
    }


# ── POST /readiness/{unit_id}/snapshot ────────────────────────────────
@router.post("/{unit_id}/snapshot", response_model=ReadinessSnapshotResponse)
async def create_readiness_snapshot(
    unit_id: int,
    notes: Optional[str] = Query(None),
    is_official: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Manually trigger a readiness snapshot for a unit.

    Calculates all readiness components and assigns DRRS ratings.
    If is_official=true, snapshot is marked as formally filed.
    """
    accessible_units = await get_accessible_units(current_user.id, db)
    if unit_id not in accessible_units:
        raise HTTPException(status_code=403, detail="Not authorized for this unit")

    # Verify unit exists
    unit = await db.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    # Generate snapshot
    snapshot = await ReadinessService.generate_readiness_snapshot(
        unit_id=unit_id,
        db=db,
        reported_by_id=current_user.id,
        notes=notes,
        is_official=is_official,
    )

    return snapshot


# ── GET /strength/{unit_id} ───────────────────────────────────────────
@router.get("/strength/{unit_id}", response_model=UnitStrengthResponse)
async def get_unit_strength(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the most recent unit strength report (T/O vs T/E).

    Includes personnel fill %, MOS shortfalls, and personnel status.
    """
    accessible_units = await get_accessible_units(current_user.id, db)
    if unit_id not in accessible_units:
        raise HTTPException(status_code=403, detail="Not authorized for this unit")

    # Get most recent strength report
    stmt = (
        select(UnitStrength)
        .where(UnitStrength.unit_id == unit_id)
        .order_by(desc(UnitStrength.reported_at))
        .limit(1)
    )
    result = await db.execute(stmt)
    strength = result.scalar()

    if not strength:
        raise HTTPException(status_code=404, detail="No strength data for this unit")

    return strength


# ── PUT /strength/{unit_id} ───────────────────────────────────────────
@router.put("/strength/{unit_id}", response_model=UnitStrengthResponse)
async def update_unit_strength(
    unit_id: int,
    strength_data: UnitStrengthUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update unit strength (T/O vs T/E) for a unit.

    Creates a new UnitStrength record (timestamped).
    """
    accessible_units = await get_accessible_units(current_user.id, db)
    if unit_id not in accessible_units:
        raise HTTPException(status_code=403, detail="Not authorized for this unit")

    unit = await db.get(Unit, unit_id)
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    # Create new strength record
    strength = UnitStrength(
        unit_id=unit_id,
        reported_at=datetime.utcnow(),
        authorized_officers=strength_data.authorized_officers,
        assigned_officers=strength_data.assigned_officers,
        authorized_enlisted=strength_data.authorized_enlisted,
        assigned_enlisted=strength_data.assigned_enlisted,
        attached=strength_data.attached,
        detached=strength_data.detached,
        tad=strength_data.tad,
        leave=strength_data.leave,
        medical=strength_data.medical,
        ua=strength_data.ua,
        mos_shortfalls=strength_data.mos_shortfalls,
        notes=strength_data.notes,
    )

    # Calculate derived fields
    strength.total_authorized = strength.authorized_officers + strength.authorized_enlisted
    strength.total_assigned = strength.assigned_officers + strength.assigned_enlisted
    strength.fill_pct = (
        (strength.total_assigned / strength.total_authorized * 100.0)
        if strength.total_authorized > 0
        else 0.0
    )

    db.add(strength)
    await db.commit()
    await db.refresh(strength)

    logger.info(f"Strength report created for unit {unit_id}: {strength.fill_pct:.1f}% fill")

    return strength
```

### API Request/Response Schemas

Create `backend/app/schemas/readiness.py`:

```python
"""Pydantic schemas for readiness API."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List, Dict, Any


class ReadinessSnapshotResponse(BaseModel):
    """Response for a single readiness snapshot."""
    id: int
    unit_id: int
    snapshot_date: datetime
    overall_readiness_pct: float
    equipment_readiness_pct: Optional[float]
    supply_readiness_pct: Optional[float]
    personnel_fill_pct: Optional[float]
    training_readiness_pct: Optional[float]
    c_rating: str  # "C-1", "C-2", "C-3", "C-4"
    s_rating: str
    r_rating: str
    p_rating: str
    t_rating: str
    limiting_factor: Optional[str]
    notes: Optional[str]
    is_official: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ReadinessTrendResponse(BaseModel):
    """Response for readiness trend data."""
    unit_id: int
    days: int
    snapshot_count: int
    snapshots: List[ReadinessSnapshotResponse]


class ReadinessRollupResponse(BaseModel):
    """Response for aggregated readiness across subordinate units."""
    unit_id: int
    num_subordinates: int
    avg_overall_readiness_pct: float
    avg_equipment_readiness_pct: float
    avg_supply_readiness_pct: float
    avg_personnel_fill_pct: float
    subordinates: List[Dict[str, Any]]


class ReadinessDashboardResponse(BaseModel):
    """Response for the readiness dashboard."""
    timestamp: datetime
    unit_count: int
    units: List[Dict[str, Any]]


class UnitStrengthResponse(BaseModel):
    """Response for unit strength report."""
    id: int
    unit_id: int
    reported_at: datetime
    authorized_officers: int
    assigned_officers: int
    authorized_enlisted: int
    assigned_enlisted: int
    attached: int
    detached: int
    tad: int
    leave: int
    medical: int
    ua: int
    total_authorized: int
    total_assigned: int
    fill_pct: float
    mos_shortfalls: Optional[List[Dict[str, Any]]]
    notes: Optional[str]

    class Config:
        from_attributes = True


class UnitStrengthUpdateRequest(BaseModel):
    """Request to update unit strength."""
    authorized_officers: int
    assigned_officers: int
    authorized_enlisted: int
    assigned_enlisted: int
    attached: int = 0
    detached: int = 0
    tad: int = 0
    leave: int = 0
    medical: int = 0
    ua: int = 0
    mos_shortfalls: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None
```

---

## Frontend Components

Create the following React components in `frontend/src/components/readiness/`:

### ReadinessCard.tsx

```typescript
/**
 * ReadinessCard: Display unit readiness at a glance
 *
 * Shows unit name, C-rating badge, current readiness %, and a mini sparkline.
 * Clickable to drill down to detail view.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface ReadinessCardProps {
  unitId: number;
  unitName: string;
  cRating: string;  // "C-1", "C-2", "C-3", "C-4"
  overallReadinessPct: number;
  limitingFactor?: string;
  onClick?: () => void;
}

export const ReadinessCard: React.FC<ReadinessCardProps> = ({
  unitId,
  unitName,
  cRating,
  overallReadinessPct,
  limitingFactor,
  onClick,
}) => {
  const navigate = useNavigate();

  // Color mapping based on rating
  const getRatingColor = (rating: string) => {
    const level = rating.split('-')[1];
    switch (level) {
      case '1': return 'bg-green-100 text-green-800';
      case '2': return 'bg-yellow-100 text-yellow-800';
      case '3': return 'bg-orange-100 text-orange-800';
      case '4': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/readiness/${unitId}`);
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{unitName}</CardTitle>
          <Badge className={`${getRatingColor(cRating)} font-bold text-sm`}>
            {cRating}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Readiness Percentage */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Readiness</span>
            <span className="text-2xl font-bold">{overallReadinessPct.toFixed(1)}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                overallReadinessPct >= 90 ? 'bg-green-500' :
                overallReadinessPct >= 75 ? 'bg-yellow-500' :
                overallReadinessPct >= 60 ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ width: `${Math.min(overallReadinessPct, 100)}%` }}
            />
          </div>

          {/* Limiting Factor */}
          {limitingFactor && (
            <p className="text-xs text-gray-600 italic">
              {limitingFactor}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

### ReadinessGauge.tsx

```typescript
/**
 * ReadinessGauge: Circular gauge display for readiness percentage
 *
 * Shows overall readiness as a half or full circle with color zones.
 */

import React from 'react';

interface ReadinessGaugeProps {
  percentage: number;  // 0-100
  size?: 'sm' | 'md' | 'lg';
  showRating?: boolean;
  rating?: string;  // "C-1", "C-2", etc.
}

export const ReadinessGauge: React.FC<ReadinessGaugeProps> = ({
  percentage,
  size = 'md',
  showRating = true,
  rating,
}) => {
  const sizes = {
    sm: { cx: 40, cy: 40, r: 35, fontSize: '14px', offsetY: 50 },
    md: { cx: 60, cy: 60, r: 50, fontSize: '18px', offsetY: 70 },
    lg: { cx: 100, cy: 100, r: 90, fontSize: '24px', offsetY: 120 },
  };

  const config = sizes[size];
  const circumference = 2 * Math.PI * config.r;
  const strokeDashOffset = circumference - (percentage / 100) * circumference;

  const getColor = (pct: number) => {
    if (pct >= 90) return '#22c55e'; // green
    if (pct >= 75) return '#eab308'; // yellow
    if (pct >= 60) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        width={config.cx * 2}
        height={config.cy * 2}
        viewBox={`0 0 ${config.cx * 2} ${config.cy * 2}`}
      >
        {/* Background Circle */}
        <circle
          cx={config.cx}
          cy={config.cy}
          r={config.r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="6"
        />

        {/* Progress Circle */}
        <circle
          cx={config.cx}
          cy={config.cy}
          r={config.r}
          fill="none"
          stroke={getColor(percentage)}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashOffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />

        {/* Center Text */}
        <text
          x={config.cx}
          y={config.cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={config.fontSize}
          fontWeight="bold"
          fill={getColor(percentage)}
        >
          {percentage.toFixed(0)}%
        </text>

        {/* Rating Badge (optional) */}
        {showRating && rating && (
          <text
            x={config.cx}
            y={config.cy + 30}
            textAnchor="middle"
            fontSize="14px"
            fontWeight="bold"
            fill="#666"
          >
            {rating}
          </text>
        )}
      </svg>
    </div>
  );
};
```

### ReadinessTrendChart.tsx

```typescript
/**
 * ReadinessTrendChart: Recharts line chart for readiness history
 *
 * Shows readiness trend over 30/60/90 days with shaded zones (green/amber/red).
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendDataPoint {
  date: string;
  overallReadinessPct: number;
  equipmentReadinessPct?: number;
  supplyReadinessPct?: number;
  personnelFillPct?: number;
}

interface ReadinessTrendChartProps {
  data: TrendDataPoint[];
  title?: string;
  height?: number;
  showComponents?: boolean;
}

export const ReadinessTrendChart: React.FC<ReadinessTrendChartProps> = ({
  data,
  title = 'Readiness Trend',
  height = 300,
  showComponents = false,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 12 }}
            />

            {/* Reference lines for thresholds */}
            <ReferenceLine
              y={90}
              stroke="#22c55e"
              strokeDasharray="5 5"
              label={{ value: 'C-1 (90%)', position: 'right', fontSize: 12 }}
            />
            <ReferenceLine
              y={75}
              stroke="#eab308"
              strokeDasharray="5 5"
              label={{ value: 'C-2 (75%)', position: 'right', fontSize: 12 }}
            />
            <ReferenceLine
              y={60}
              stroke="#f97316"
              strokeDasharray="5 5"
              label={{ value: 'C-3 (60%)', position: 'right', fontSize: 12 }}
            />

            <Tooltip
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              formatter={(value) => `${(value as number).toFixed(1)}%`}
            />

            <Legend />

            {/* Overall Readiness */}
            <Line
              type="monotone"
              dataKey="overallReadinessPct"
              stroke="#3b82f6"
              strokeWidth={3}
              name="Overall Readiness"
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />

            {/* Component Lines (optional) */}
            {showComponents && (
              <>
                <Line
                  type="monotone"
                  dataKey="equipmentReadinessPct"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Equipment"
                  dot={false}
                  opacity={0.7}
                />
                <Line
                  type="monotone"
                  dataKey="supplyReadinessPct"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Supply"
                  dot={false}
                  opacity={0.7}
                />
                <Line
                  type="monotone"
                  dataKey="personnelFillPct"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Personnel"
                  dot={false}
                  opacity={0.7}
                />
              </>
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

### StrengthTable.tsx

```typescript
/**
 * StrengthTable: TanStack Table displaying T/O vs T/E personnel
 *
 * Shows authorized vs assigned by MOS, with fill percentages and shortfalls.
 */

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  ColumnDef,
} from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MOSShortfall {
  mos: string;
  mos_title: string;
  authorized: number;
  assigned: number;
  shortfall: number;
}

interface StrengthTableProps {
  unitStrength: {
    total_authorized: number;
    total_assigned: number;
    fill_pct: number;
    authorized_officers: number;
    assigned_officers: number;
    authorized_enlisted: number;
    assigned_enlisted: number;
    mos_shortfalls?: MOSShortfall[];
  };
}

export const StrengthTable: React.FC<StrengthTableProps> = ({ unitStrength }) => {
  const columns = useMemo<ColumnDef<MOSShortfall>[]>(
    () => [
      {
        accessorKey: 'mos',
        header: 'MOS',
        cell: (info) => <span className="font-mono text-sm">{info.getValue()}</span>,
      },
      {
        accessorKey: 'mos_title',
        header: 'Title',
      },
      {
        accessorKey: 'authorized',
        header: 'Authorized',
        cell: (info) => <span className="text-right">{info.getValue()}</span>,
      },
      {
        accessorKey: 'assigned',
        header: 'Assigned',
        cell: (info) => <span className="text-right">{info.getValue()}</span>,
      },
      {
        accessorKey: 'shortfall',
        header: 'Shortfall',
        cell: (info) => {
          const shortfall = info.getValue() as number;
          return (
            <span className={`text-right font-semibold ${shortfall > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {shortfall > 0 ? `-${shortfall}` : '0'}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: unitStrength.mos_shortfalls || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personnel Strength (T/O vs T/E)</CardTitle>
        <div className="text-sm text-gray-600 mt-2">
          <p>
            {unitStrength.total_assigned} / {unitStrength.total_authorized} assigned
            ({unitStrength.fill_pct.toFixed(1)}% fill)
          </p>
          <p className="mt-1">
            Officers: {unitStrength.assigned_officers} / {unitStrength.authorized_officers}
            {' '}| Enlisted: {unitStrength.assigned_enlisted} / {unitStrength.authorized_enlisted}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable table={table} columns={columns} />
      </CardContent>
    </Card>
  );
};
```

### ReadinessRollupTree.tsx

```typescript
/**
 * ReadinessRollupTree: Hierarchical tree view of unit readiness
 *
 * Shows parent → children readiness, collapsible tree structure.
 * Color-coded by rating.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SubordinateUnit {
  unit_id: number;
  unit_name: string;
  c_rating: string;
  overall_readiness_pct: number;
  limiting_factor?: string;
}

interface ReadinessRollupTreeProps {
  parentUnitName: string;
  subordinates: SubordinateUnit[];
  avgOverallReadinessPct: number;
}

export const ReadinessRollupTree: React.FC<ReadinessRollupTreeProps> = ({
  parentUnitName,
  subordinates,
  avgOverallReadinessPct,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (unitId: number) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(unitId)) {
      newSet.delete(unitId);
    } else {
      newSet.add(unitId);
    }
    setExpandedRows(newSet);
  };

  const getRatingColor = (rating: string) => {
    const level = rating.split('-')[1];
    switch (level) {
      case '1': return 'bg-green-50 border-green-300';
      case '2': return 'bg-yellow-50 border-yellow-300';
      case '3': return 'bg-orange-50 border-orange-300';
      case '4': return 'bg-red-50 border-red-300';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Readiness Hierarchy</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 font-mono text-sm">
          {/* Parent Unit */}
          <div className={`border-l-2 pl-4 py-2 ${getRatingColor('C-1')}`}>
            <div className="flex items-center justify-between">
              <span className="font-bold">{parentUnitName}</span>
              <span className="text-xs text-gray-600">
                {avgOverallReadinessPct.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Subordinate Units */}
          {subordinates.map((sub) => (
            <div key={sub.unit_id} className={`border-l-4 pl-6 ${getRatingColor(sub.c_rating)}`}>
              <div
                className="flex items-center justify-between cursor-pointer py-2 hover:bg-gray-100 rounded"
                onClick={() => toggleRow(sub.unit_id)}
              >
                <div className="flex items-center gap-2">
                  {expandedRows.has(sub.unit_id) ? (
                    <ChevronDown size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                  <span className="font-semibold">{sub.unit_name}</span>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {sub.c_rating}
                  </span>
                </div>
                <span className="font-bold">
                  {sub.overall_readiness_pct.toFixed(1)}%
                </span>
              </div>

              {/* Expanded Details */}
              {expandedRows.has(sub.unit_id) && sub.limiting_factor && (
                <div className="pl-6 text-xs text-gray-600 italic mb-2">
                  {sub.limiting_factor}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### ReadinessPage.tsx (Main Page)

```typescript
/**
 * ReadinessPage: Master readiness reporting dashboard
 *
 * Combines all readiness components into a unified view.
 * Shows card grid, drill-down details, trend charts, and hierarchical rollup.
 */

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReadinessCard } from './ReadinessCard';
import { ReadinessGauge } from './ReadinessGauge';
import { ReadinessTrendChart } from './ReadinessTrendChart';
import { StrengthTable } from './StrengthTable';
import { ReadinessRollupTree } from './ReadinessRollupTree';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const ReadinessPage: React.FC = () => {
  const { unitId } = useParams<{ unitId?: string }>();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch current readiness snapshot
  const { data: snapshot, isLoading: snapshotLoading } = useQuery({
    queryKey: ['readiness', unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/readiness/${unitId}`);
      if (!res.ok) throw new Error('Failed to fetch readiness');
      return res.json();
    },
    enabled: !!unitId,
  });

  // Fetch readiness history
  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['readiness-history', unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/readiness/${unitId}/history?days=30`);
      if (!res.ok) throw new Error('Failed to fetch history');
      return res.json();
    },
    enabled: !!unitId,
  });

  // Fetch unit strength
  const { data: strength, isLoading: strengthLoading } = useQuery({
    queryKey: ['strength', unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/readiness/strength/${unitId}`);
      if (!res.ok) throw new Error('Failed to fetch strength');
      return res.json();
    },
    enabled: !!unitId,
  });

  // Fetch rollup (if viewing parent unit)
  const { data: rollup, isLoading: rollupLoading } = useQuery({
    queryKey: ['readiness-rollup', unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/readiness/${unitId}/rollup`);
      if (!res.ok) throw new Error('Failed to fetch rollup');
      return res.json();
    },
    enabled: !!unitId,
  });

  if (snapshotLoading) return <div className="p-4">Loading...</div>;

  if (!snapshot) return <div className="p-4">No readiness data available</div>;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Unit Readiness</h1>
        <p className="text-gray-600 mt-1">
          Snapshot as of {new Date(snapshot.snapshot_date).toLocaleString()}
        </p>
      </div>

      {/* Overview Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="flex flex-col items-center">
          <ReadinessGauge
            percentage={snapshot.overall_readiness_pct}
            size="sm"
            rating={snapshot.c_rating}
          />
          <p className="text-xs text-gray-600 mt-2">Overall</p>
        </div>

        {[
          { label: 'Equipment', value: snapshot.equipment_readiness_pct, rating: snapshot.r_rating },
          { label: 'Supply', value: snapshot.supply_readiness_pct, rating: snapshot.s_rating },
          { label: 'Personnel', value: snapshot.personnel_fill_pct, rating: snapshot.p_rating },
          { label: 'Training', value: snapshot.training_readiness_pct, rating: snapshot.t_rating },
        ].map((comp) => (
          <div key={comp.label} className="flex flex-col items-center">
            <ReadinessGauge
              percentage={comp.value || 0}
              size="sm"
              rating={comp.rating}
            />
            <p className="text-xs text-gray-600 mt-2">{comp.label}</p>
          </div>
        ))}
      </div>

      {/* Limiting Factor Alert */}
      {snapshot.limiting_factor && (
        <Card className="border-l-4 border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <h3 className="font-bold text-orange-900">Limiting Factor</h3>
            <p className="text-sm text-orange-800 mt-2">{snapshot.limiting_factor}</p>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trend">30-Day Trend</TabsTrigger>
          <TabsTrigger value="strength">Strength Report</TabsTrigger>
          {rollup && <TabsTrigger value="subordinates">Subordinate Units</TabsTrigger>}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Readiness Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Composite Rating</p>
                  <p className="text-2xl font-bold">{snapshot.c_rating}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Overall Readiness</p>
                  <p className="text-2xl font-bold">{snapshot.overall_readiness_pct.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Supply Rating</p>
                  <Badge variant="outline">{snapshot.s_rating}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Equipment Rating</p>
                  <Badge variant="outline">{snapshot.r_rating}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Personnel Rating</p>
                  <Badge variant="outline">{snapshot.p_rating}</Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Training Rating</p>
                  <Badge variant="outline">{snapshot.t_rating}</Badge>
                </div>
              </div>
              {snapshot.notes && (
                <div className="pt-4 border-t">
                  <p className="text-xs text-gray-600">Commander Notes</p>
                  <p className="mt-2 text-sm">{snapshot.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trend Tab */}
        <TabsContent value="trend" className="mt-4">
          {history && history.snapshots.length > 0 ? (
            <ReadinessTrendChart
              data={history.snapshots.map((s: any) => ({
                date: new Date(s.snapshot_date).toLocaleDateString(),
                overallReadinessPct: s.overall_readiness_pct,
                equipmentReadinessPct: s.equipment_readiness_pct,
                supplyReadinessPct: s.supply_readiness_pct,
                personnelFillPct: s.personnel_fill_pct,
              }))}
              showComponents
            />
          ) : (
            <Card><CardContent className="pt-6">No trend data available</CardContent></Card>
          )}
        </TabsContent>

        {/* Strength Tab */}
        <TabsContent value="strength" className="mt-4">
          {strength && <StrengthTable unitStrength={strength} />}
        </TabsContent>

        {/* Subordinates Tab */}
        {rollup && (
          <TabsContent value="subordinates" className="mt-4">
            <ReadinessRollupTree
              parentUnitName="This Unit"
              subordinates={rollup.subordinates}
              avgOverallReadinessPct={rollup.avg_overall_readiness_pct}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
```

---

## Routing

Add to `frontend/src/App.tsx`:

```typescript
// Import the ReadinessPage
import { ReadinessPage } from './pages/ReadinessPage';

// In the route configuration:
{
  path: '/readiness',
  element: <ReadinessPage />,
},
{
  path: '/readiness/:unitId',
  element: <ReadinessPage />,
},
```

Add to the sidebar/navigation component:

```typescript
<NavLink
  to="/readiness"
  label="Readiness"
  icon={<TrendingUp size={20} />}
/>
```

---

## Database Migrations

Run the following Alembic migration (create `backend/alembic/versions/add_readiness_models.py`):

```python
"""Add readiness models."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

def upgrade():
    # Create unit_readiness_snapshots table
    op.create_table(
        'unit_readiness_snapshots',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('snapshot_date', sa.DateTime(), nullable=False),
        sa.Column('overall_readiness_pct', sa.Float(), nullable=False),
        sa.Column('equipment_readiness_pct', sa.Float(), nullable=True),
        sa.Column('supply_readiness_pct', sa.Float(), nullable=True),
        sa.Column('personnel_fill_pct', sa.Float(), nullable=True),
        sa.Column('training_readiness_pct', sa.Float(), nullable=True),
        sa.Column('t_rating', sa.String(5), default='T-4', nullable=False),
        sa.Column('c_rating', sa.String(5), default='C-4', nullable=False),
        sa.Column('s_rating', sa.String(5), default='S-4', nullable=False),
        sa.Column('r_rating', sa.String(5), default='R-4', nullable=False),
        sa.Column('p_rating', sa.String(5), default='P-4', nullable=False),
        sa.Column('limiting_factor', sa.Text(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('reported_by_id', sa.Integer(), nullable=True),
        sa.Column('is_official', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id']),
        sa.ForeignKeyConstraint(['reported_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_unit_readiness_snapshots_unit_id', 'unit_readiness_snapshots', ['unit_id'])
    op.create_index('ix_unit_readiness_snapshots_snapshot_date', 'unit_readiness_snapshots', ['snapshot_date'])

    # Create readiness_thresholds table
    op.create_table(
        'readiness_thresholds',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('echelon', sa.String(30), nullable=False),
        sa.Column('metric_name', sa.String(100), nullable=False),
        sa.Column('green_min_pct', sa.Float(), default=90.0, nullable=False),
        sa.Column('amber_min_pct', sa.Float(), default=75.0, nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('echelon', 'metric_name', name='uq_echelon_metric'),
    )

    # Create unit_strength table
    op.create_table(
        'unit_strength',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('unit_id', sa.Integer(), nullable=False),
        sa.Column('reported_at', sa.DateTime(), nullable=False),
        sa.Column('authorized_officers', sa.Integer(), default=0, nullable=False),
        sa.Column('assigned_officers', sa.Integer(), default=0, nullable=False),
        sa.Column('authorized_enlisted', sa.Integer(), default=0, nullable=False),
        sa.Column('assigned_enlisted', sa.Integer(), default=0, nullable=False),
        sa.Column('attached', sa.Integer(), default=0),
        sa.Column('detached', sa.Integer(), default=0),
        sa.Column('tad', sa.Integer(), default=0),
        sa.Column('leave', sa.Integer(), default=0),
        sa.Column('medical', sa.Integer(), default=0),
        sa.Column('ua', sa.Integer(), default=0),
        sa.Column('total_authorized', sa.Integer(), default=0, nullable=False),
        sa.Column('total_assigned', sa.Integer(), default=0, nullable=False),
        sa.Column('fill_pct', sa.Float(), default=0.0, nullable=False),
        sa.Column('mos_shortfalls', postgresql.JSON(), default=list),
        sa.Column('notes', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['unit_id'], ['units.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_unit_strength_unit_id', 'unit_strength', ['unit_id'])
    op.create_index('ix_unit_strength_reported_at', 'unit_strength', ['reported_at'])

def downgrade():
    op.drop_index('ix_unit_strength_reported_at')
    op.drop_index('ix_unit_strength_unit_id')
    op.drop_table('unit_strength')
    op.drop_table('readiness_thresholds')
    op.drop_index('ix_unit_readiness_snapshots_snapshot_date')
    op.drop_index('ix_unit_readiness_snapshots_unit_id')
    op.drop_table('unit_readiness_snapshots')
```

---

## Seed Data: Readiness Thresholds

Create `backend/seed/seed_readiness_thresholds.py`:

```python
"""Seed readiness thresholds by echelon."""

from sqlalchemy.ext.asyncio import AsyncSession
from app.models.readiness_snapshot import ReadinessThreshold

READINESS_THRESHOLDS = [
    # ── PLATOON ──────────────────────────────────────────────────────
    {"echelon": "PLATOON", "metric_name": "composite", "green_min_pct": 90.0, "amber_min_pct": 75.0},
    {"echelon": "PLATOON", "metric_name": "equipment", "green_min_pct": 95.0, "amber_min_pct": 80.0},
    {"echelon": "PLATOON", "metric_name": "supply", "green_min_pct": 90.0, "amber_min_pct": 75.0},
    {"echelon": "PLATOON", "metric_name": "personnel", "green_min_pct": 90.0, "amber_min_pct": 80.0},
    {"echelon": "PLATOON", "metric_name": "training", "green_min_pct": 85.0, "amber_min_pct": 70.0},

    # ── COMPANY ──────────────────────────────────────────────────────
    {"echelon": "COMPANY", "metric_name": "composite", "green_min_pct": 85.0, "amber_min_pct": 70.0},
    {"echelon": "COMPANY", "metric_name": "equipment", "green_min_pct": 90.0, "amber_min_pct": 75.0},
    {"echelon": "COMPANY", "metric_name": "supply", "green_min_pct": 85.0, "amber_min_pct": 70.0},
    {"echelon": "COMPANY", "metric_name": "personnel", "green_min_pct": 85.0, "amber_min_pct": 75.0},
    {"echelon": "COMPANY", "metric_name": "training", "green_min_pct": 80.0, "amber_min_pct": 65.0},

    # ── BATTALION ────────────────────────────────────────────────────
    {"echelon": "BATTALION", "metric_name": "composite", "green_min_pct": 80.0, "amber_min_pct": 65.0},
    {"echelon": "BATTALION", "metric_name": "equipment", "green_min_pct": 85.0, "amber_min_pct": 70.0},
    {"echelon": "BATTALION", "metric_name": "supply", "green_min_pct": 80.0, "amber_min_pct": 65.0},
    {"echelon": "BATTALION", "metric_name": "personnel", "green_min_pct": 80.0, "amber_min_pct": 70.0},
    {"echelon": "BATTALION", "metric_name": "training", "green_min_pct": 75.0, "amber_min_pct": 60.0},

    # ── REGIMENT ─────────────────────────────────────────────────────
    {"echelon": "REGIMENT", "metric_name": "composite", "green_min_pct": 75.0, "amber_min_pct": 60.0},
    {"echelon": "REGIMENT", "metric_name": "equipment", "green_min_pct": 80.0, "amber_min_pct": 65.0},
    {"echelon": "REGIMENT", "metric_name": "supply", "green_min_pct": 75.0, "amber_min_pct": 60.0},
    {"echelon": "REGIMENT", "metric_name": "personnel", "green_min_pct": 75.0, "amber_min_pct": 65.0},
    {"echelon": "REGIMENT", "metric_name": "training", "green_min_pct": 70.0, "amber_min_pct": 55.0},
]


async def seed_readiness_thresholds(db: AsyncSession):
    """Load readiness thresholds."""
    for threshold_data in READINESS_THRESHOLDS:
        threshold = ReadinessThreshold(**threshold_data)
        db.add(threshold)

    await db.commit()
    print(f"Seeded {len(READINESS_THRESHOLDS)} readiness thresholds")
```

---

## Testing Notes

- Unit tests should cover:
  - `calculate_equipment_readiness()` with various equipment states
  - `calculate_supply_readiness()` with GREEN/AMBER/RED items
  - `calculate_personnel_readiness()` with various fill percentages
  - `calculate_composite_readiness()` with weighted components
  - `_percent_to_rating()` conversion logic
  - API endpoints with RBAC checks

- Integration test: Generate a snapshot, verify it appears in history, verify it rolls up correctly

- Frontend e2e: Navigate to /readiness, verify cards render, click drill-down, verify trend chart loads

---

## Implementation Checklist

- [ ] Create `backend/app/models/readiness_snapshot.py` with UnitReadinessSnapshot and ReadinessThreshold
- [ ] Create `backend/app/models/unit_strength.py` with UnitStrength
- [ ] Create `backend/app/services/readiness.py` with all calculation logic
- [ ] Create `backend/app/api/readiness.py` with all endpoints
- [ ] Create `backend/app/schemas/readiness.py` with Pydantic schemas
- [ ] Add readiness_snapshots, readiness_thresholds, unit_strength relationships to Unit model
- [ ] Create and run Alembic migration for new tables
- [ ] Create `backend/seed/seed_readiness_thresholds.py` and run seed
- [ ] Create `frontend/src/components/readiness/ReadinessCard.tsx`
- [ ] Create `frontend/src/components/readiness/ReadinessGauge.tsx`
- [ ] Create `frontend/src/components/readiness/ReadinessTrendChart.tsx`
- [ ] Create `frontend/src/components/readiness/StrengthTable.tsx`
- [ ] Create `frontend/src/components/readiness/ReadinessRollupTree.tsx`
- [ ] Create `frontend/src/pages/ReadinessPage.tsx`
- [ ] Update `frontend/src/App.tsx` routes
- [ ] Update navigation/sidebar
- [ ] Run backend tests (unit + integration)
- [ ] Run frontend component tests
- [ ] Manual e2e: login → navigate to /readiness → drill down to unit → verify trend chart → verify strength table

