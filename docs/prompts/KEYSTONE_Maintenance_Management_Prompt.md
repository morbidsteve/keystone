# KEYSTONE — Comprehensive Maintenance Management System

## Mission

Significantly expand the KEYSTONE maintenance module to provide complete visibility into USMC unit equipment maintenance operations, including work order management, preventive maintenance scheduling, equipment deadline tracking, parts and supply logistics, and maintenance analytics. Enable commanders and S-4 personnel to track equipment status in real-time, identify bottlenecks in repair cycles, monitor parts availability, measure maintenance performance, and make data-driven readiness decisions.

**Current State**: Basic maintenance work order model exists (`MaintenanceWorkOrder`, `MaintenancePart`, `MaintenanceLabor`) with minimal API coverage and no frontend.

**Target State**: Production-grade maintenance dashboard with work orders, PM scheduling, deadline management, logistics analytics, and ERO tracking for higher-echelon repairs.

---

## Database Models

### Update Existing: `maintenance.py`

Update the existing `MaintenanceWorkOrder` model in `backend/app/models/maintenance.py`:

```python
# Add new enums:
class WorkOrderStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    AWAITING_PARTS = "AWAITING_PARTS"
    COMPLETE = "COMPLETE"
    CANCELED = "CANCELED"  # NEW

class EchelonOfMaintenance(str, enum.Enum):
    """USMC maintenance echelon levels per IETM."""
    FIRST = "1ST"        # Operator and organizational
    SECOND = "2ND"       # Organizational/unit level
    THIRD = "3RD"        # Direct support / intermediate
    FOURTH = "4TH"       # General support / intermediate
    FIFTH = "5TH"        # Depot-level repair

class MaintenanceLevel(str, enum.Enum):
    """USMC maintenance categories by authority and skill."""
    ORGANIZATIONAL = "ORGANIZATIONAL"  # Unit-level; operator/supply
    INTERMEDIATE = "INTERMEDIATE"      # DS/GS; need higher skill
    DEPOT = "DEPOT"                    # Depot facility; major overhaul

# Update MaintenanceWorkOrder:
class MaintenanceWorkOrder(Base):
    __tablename__ = "maintenance_work_orders"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    equipment_id = Column(Integer, ForeignKey("equipment_statuses.id"), nullable=True)
    individual_equipment_id = Column(
        Integer, ForeignKey("equipment.id"), nullable=True, index=True
    )
    work_order_number = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    status = Column(
        SQLEnum(WorkOrderStatus), nullable=False, default=WorkOrderStatus.OPEN
    )
    category = Column(SQLEnum(WorkOrderCategory), nullable=True)
    priority = Column(Integer, nullable=False, default=3)  # 1=Critical, 5=Low
    parts_required = Column(Text, nullable=True)
    estimated_completion = Column(DateTime(timezone=True), nullable=True)
    actual_hours = Column(Float, nullable=True)
    location = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    assigned_to = Column(String(100), nullable=True)

    # ────────────────────── NEW FIELDS ──────────────────────
    echelon_of_maintenance = Column(
        SQLEnum(EchelonOfMaintenance), nullable=True
    )
    maintenance_level = Column(
        SQLEnum(MaintenanceLevel), nullable=True
    )
    deadline_date = Column(DateTime(timezone=True), nullable=True)
    eri_date = Column(
        DateTime(timezone=True), nullable=True,
        comment="Equipment Repair Inquiry date for higher echelon"
    )
    erb_number = Column(
        String(50), nullable=True,
        comment="Equipment Repair Board case number"
    )
    downtime_hours = Column(
        Float, nullable=True,
        comment="Calculated: time between NMC and equipment return to FMC"
    )
    nmcs_since = Column(
        DateTime(timezone=True), nullable=True,
        comment="When equipment went NMC-S; null if NMC-M"
    )
    nmcm_since = Column(
        DateTime(timezone=True), nullable=True,
        comment="When equipment went NMC-M (maintenance-down)"
    )

    individual_equipment = relationship(
        "Equipment",
        back_populates="work_orders",
        foreign_keys=[individual_equipment_id],
    )
    parts = relationship(
        "MaintenancePart",
        back_populates="work_order",
        cascade="all, delete-orphan",
    )
    labor_entries = relationship(
        "MaintenanceLabor",
        back_populates="work_order",
        cascade="all, delete-orphan",
    )
    # NEW: relationship to PreventiveMaintenanceSchedule
    pm_schedule = relationship(
        "PreventiveMaintenanceSchedule",
        back_populates="work_orders",
    )
    # NEW: relationship to MaintenanceDeadline
    deadline_records = relationship(
        "MaintenanceDeadline",
        back_populates="work_order",
    )
    # NEW: relationship to EquipmentRepairOrder
    ero = relationship(
        "EquipmentRepairOrder",
        back_populates="work_order",
        uselist=False,
    )
```

---

### New Model: `maintenance_schedule.py`

Create `backend/app/models/maintenance_schedule.py`:

```python
"""Preventive maintenance scheduling, deadlines, and equipment repair orders."""

import enum

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class PMType(str, enum.Enum):
    """Preventive maintenance interval types."""
    DAILY = "DAILY"
    WEEKLY = "WEEKLY"
    MONTHLY = "MONTHLY"
    QUARTERLY = "QUARTERLY"
    ANNUAL = "ANNUAL"
    MILEAGE = "MILEAGE"  # For vehicles


class DeadlineReason(str, enum.Enum):
    """Why equipment is deadlined (NMC-M or NMC-S)."""
    AWAITING_PARTS = "AWAITING_PARTS"
    AWAITING_REPAIR = "AWAITING_REPAIR"
    UNSCHEDULED_MAINTENANCE = "UNSCHEDULED_MAINTENANCE"
    SAFETY_ISSUE = "SAFETY_ISSUE"
    MODIFICATION_IN_PROGRESS = "MODIFICATION_IN_PROGRESS"
    PENDING_INSPECTION = "PENDING_INSPECTION"
    DEPOT_OVERHAUL = "DEPOT_OVERHAUL"


class EROStatus(str, enum.Enum):
    """Equipment Repair Order status for higher-echelon repair."""
    SUBMITTED = "SUBMITTED"
    RECEIVED_BY_IMA = "RECEIVED_BY_IMA"
    IN_REPAIR = "IN_REPAIR"
    AWAITING_RETURN_SHIPMENT = "AWAITING_RETURN_SHIPMENT"
    RETURNED = "RETURNED"
    REJECTED = "REJECTED"  # IMA cannot repair


class PreventiveMaintenanceSchedule(Base):
    """
    PM scheduling for equipment units.

    Tracks when PMs are due, which ones are overdue, and links to
    work orders when PM is performed.
    """
    __tablename__ = "preventive_maintenance_schedules"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    equipment_id = Column(
        Integer, ForeignKey("equipment.id"), nullable=False, index=True
    )
    pm_type = Column(SQLEnum(PMType), nullable=False)
    interval_value = Column(
        Integer, nullable=False,
        comment="Days between PMs (or miles if MILEAGE type)"
    )
    last_performed = Column(
        DateTime(timezone=True), nullable=True,
        comment="When this PM was last completed"
    )
    next_due = Column(
        DateTime(timezone=True), nullable=True,
        comment="Calculated next due date"
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit")
    equipment = relationship("Equipment")
    work_orders = relationship(
        "MaintenanceWorkOrder",
        back_populates="pm_schedule",
    )

    @property
    def is_overdue(self) -> bool:
        """Boolean: is next_due in the past?"""
        if not self.next_due:
            return False
        from datetime import datetime, timezone
        return self.next_due < datetime.now(timezone.utc)


class MaintenanceDeadline(Base):
    """
    Equipment deadline tracking (NMC-M or NMC-S status).

    When equipment goes deadlined, this record tracks why, when, and
    what work order is addressing it. When deadline is lifted (equipment
    returns to FMC), lifted_date and lifted_by are populated.
    """
    __tablename__ = "maintenance_deadlines"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    equipment_id = Column(
        Integer, ForeignKey("equipment.id"), nullable=False, index=True
    )
    deadline_date = Column(
        DateTime(timezone=True), server_default=func.now(),
        comment="When deadline was imposed"
    )
    reason = Column(SQLEnum(DeadlineReason), nullable=False)
    work_order_id = Column(
        Integer, ForeignKey("maintenance_work_orders.id"), nullable=True,
        comment="WO addressing this deadline (if any)"
    )
    lifted_date = Column(
        DateTime(timezone=True), nullable=True,
        comment="When deadline was removed"
    )
    lifted_by = Column(
        String(100), nullable=True,
        comment="Username of person who lifted deadline"
    )
    notes = Column(Text, nullable=True)

    unit = relationship("Unit")
    equipment = relationship("Equipment")
    work_order = relationship("MaintenanceWorkOrder", back_populates="deadline_records")

    @property
    def is_active(self) -> bool:
        """Boolean: deadline not yet lifted?"""
        return self.lifted_date is None


class EquipmentRepairOrder(Base):
    """
    Equipment Repair Order (ERO): tracking repairs at intermediate or depot echelon.

    When organizational-level repair is insufficient, units submit an ERO
    to the next higher maintenance echelon (e.g., DS, GS, depot). This tracks
    submission, in-progress status, and return.
    """
    __tablename__ = "equipment_repair_orders"

    id = Column(Integer, primary_key=True, index=True)
    unit_id = Column(Integer, ForeignKey("units.id"), nullable=False, index=True)
    equipment_id = Column(
        Integer, ForeignKey("equipment.id"), nullable=False, index=True
    )
    ero_number = Column(String(50), nullable=False, unique=True, index=True)
    submitted_date = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(SQLEnum(EROStatus), nullable=False, default=EROStatus.SUBMITTED)
    intermediate_maintenance_activity = Column(
        String(200), nullable=False,
        comment="Name/location of receiving IMA (e.g., 'BN DS Shop', 'Depot East Facility')"
    )
    estimated_return_date = Column(DateTime(timezone=True), nullable=True)
    actual_return_date = Column(DateTime(timezone=True), nullable=True)
    work_order_id = Column(
        Integer, ForeignKey("maintenance_work_orders.id"), nullable=True,
        comment="WO that triggered this ERO (if applicable)"
    )
    repair_description = Column(Text, nullable=True)
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    unit = relationship("Unit")
    equipment = relationship("Equipment")
    work_order = relationship("MaintenanceWorkOrder", back_populates="ero")

    @property
    def days_in_repair(self) -> int:
        """Number of days ERO has been in repair (from submitted to now, or to return)."""
        from datetime import datetime, timezone
        if self.actual_return_date:
            end_date = self.actual_return_date
        else:
            end_date = datetime.now(timezone.utc)
        delta = end_date - self.submitted_date
        return delta.days

    @property
    def is_returned(self) -> bool:
        """Has equipment been returned from repair?"""
        return self.status == EROStatus.RETURNED and self.actual_return_date is not None
```

---

## Maintenance Analytics Service

Create `backend/app/services/maintenance_analytics.py`:

```python
"""Maintenance performance analytics and KPI calculations."""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple

from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.equipment import Equipment, EquipmentAssetStatus, EquipmentFault
from app.models.maintenance import (
    MaintenanceLabor,
    MaintenancePart,
    MaintenanceWorkOrder,
    WorkOrderStatus,
)
from app.models.maintenance_schedule import (
    MaintenanceDeadline,
    PreventiveMaintenanceSchedule,
)


class MaintenanceAnalytics:
    """USMC maintenance KPI and analytics service."""

    def __init__(self, db: AsyncSession, unit_id: int):
        self.db = db
        self.unit_id = unit_id

    async def calculate_deadline_rate(self) -> float:
        """
        Deadline Rate: % of equipment in deadlined status (NMC-M).

        Returns: float 0-100 representing percent of unit equipment deadlined.
        """
        total_result = await self.db.execute(
            select(func.count(Equipment.id)).where(
                Equipment.unit_id == self.unit_id
            )
        )
        total = total_result.scalar() or 0
        if total == 0:
            return 0.0

        deadlined_result = await self.db.execute(
            select(func.count(Equipment.id)).where(
                and_(
                    Equipment.unit_id == self.unit_id,
                    Equipment.status == EquipmentAssetStatus.DEADLINED,
                )
            )
        )
        deadlined = deadlined_result.scalar() or 0

        return (deadlined / total) * 100.0

    async def calculate_avg_repair_time(self, days: int = 90) -> float:
        """
        Average Repair Time (Mean Time To Repair): average hours from
        work order creation to completion in the last N days.

        Returns: float hours
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        result = await self.db.execute(
            select(
                func.avg(
                    func.extract("epoch", MaintenanceWorkOrder.completed_at)
                    - func.extract("epoch", MaintenanceWorkOrder.created_at)
                )
            ).where(
                and_(
                    MaintenanceWorkOrder.unit_id == self.unit_id,
                    MaintenanceWorkOrder.status == WorkOrderStatus.COMPLETE,
                    MaintenanceWorkOrder.completed_at >= cutoff,
                )
            )
        )
        avg_seconds = result.scalar()
        if avg_seconds is None:
            return 0.0
        return avg_seconds / 3600.0  # Convert to hours

    async def calculate_parts_fill_rate(self, days: int = 90) -> float:
        """
        Parts Fill Rate: % of parts requested that have been received/installed
        in the last N days.

        Returns: float 0-100
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        total_result = await self.db.execute(
            select(func.count(MaintenancePart.id))
            .join(MaintenanceWorkOrder)
            .where(
                and_(
                    MaintenanceWorkOrder.unit_id == self.unit_id,
                    MaintenanceWorkOrder.created_at >= cutoff,
                )
            )
        )
        total = total_result.scalar() or 0
        if total == 0:
            return 0.0

        filled_result = await self.db.execute(
            select(func.count(MaintenancePart.id))
            .join(MaintenanceWorkOrder)
            .where(
                and_(
                    MaintenanceWorkOrder.unit_id == self.unit_id,
                    MaintenanceWorkOrder.created_at >= cutoff,
                    MaintenancePart.status.in_(["RECEIVED", "INSTALLED"]),
                )
            )
        )
        filled = filled_result.scalar() or 0

        return (filled / total) * 100.0

    async def get_overdue_pms(self) -> List[Dict]:
        """
        Get all overdue preventive maintenance items.

        Returns: list of {equipment_id, equipment_type, nomenclature, pm_type, next_due, days_overdue}
        """
        now = datetime.now(timezone.utc)

        result = await self.db.execute(
            select(
                PreventiveMaintenanceSchedule.id,
                Equipment.id.label("equipment_id"),
                Equipment.equipment_type,
                Equipment.nomenclature,
                Equipment.bumper_number,
                PreventiveMaintenanceSchedule.pm_type,
                PreventiveMaintenanceSchedule.next_due,
            )
            .join(Equipment)
            .where(
                and_(
                    Equipment.unit_id == self.unit_id,
                    PreventiveMaintenanceSchedule.next_due < now,
                )
            )
            .order_by(PreventiveMaintenanceSchedule.next_due.asc())
        )

        rows = result.all()
        overdue_list = []
        for row in rows:
            days_overdue = (now - row.next_due).days
            overdue_list.append(
                {
                    "pm_schedule_id": row.id,
                    "equipment_id": row.equipment_id,
                    "equipment_type": row.equipment_type,
                    "nomenclature": row.nomenclature,
                    "bumper_number": row.bumper_number,
                    "pm_type": row.pm_type,
                    "next_due": row.next_due,
                    "days_overdue": days_overdue,
                }
            )
        return overdue_list

    async def get_deadline_equipment(self) -> List[Dict]:
        """
        Get all currently deadlined equipment with reason and WO link.

        Returns: list of {equipment_id, bumper_number, nomenclature, reason, deadline_date, work_order_id, days_deadlined}
        """
        result = await self.db.execute(
            select(
                MaintenanceDeadline.id,
                Equipment.id.label("equipment_id"),
                Equipment.bumper_number,
                Equipment.nomenclature,
                MaintenanceDeadline.reason,
                MaintenanceDeadline.deadline_date,
                MaintenanceDeadline.work_order_id,
            )
            .join(Equipment)
            .where(
                and_(
                    Equipment.unit_id == self.unit_id,
                    MaintenanceDeadline.lifted_date.is_(None),
                )
            )
            .order_by(MaintenanceDeadline.deadline_date.asc())
        )

        rows = result.all()
        now = datetime.now(timezone.utc)
        deadline_list = []
        for row in rows:
            days_deadlined = (now - row.deadline_date).days
            deadline_list.append(
                {
                    "deadline_id": row.id,
                    "equipment_id": row.equipment_id,
                    "bumper_number": row.bumper_number,
                    "nomenclature": row.nomenclature,
                    "reason": row.reason,
                    "deadline_date": row.deadline_date,
                    "work_order_id": row.work_order_id,
                    "days_deadlined": days_deadlined,
                }
            )
        return deadline_list

    async def calculate_maintenance_man_hours(self, days: int = 30) -> float:
        """
        Total maintenance labor hours in the last N days.

        Returns: float total hours
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        result = await self.db.execute(
            select(func.sum(MaintenanceLabor.hours))
            .join(MaintenanceWorkOrder)
            .where(
                and_(
                    MaintenanceWorkOrder.unit_id == self.unit_id,
                    MaintenanceLabor.date >= cutoff.date(),
                )
            )
        )
        total = result.scalar() or 0.0
        return float(total)

    async def get_cannibalization_rate(self, days: int = 90) -> float:
        """
        Cannibalization Rate: % of parts sourced via cannibalization
        in the last N days.

        Returns: float 0-100
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        total_result = await self.db.execute(
            select(func.count(MaintenancePart.id))
            .join(MaintenanceWorkOrder)
            .where(
                and_(
                    MaintenanceWorkOrder.unit_id == self.unit_id,
                    MaintenanceWorkOrder.created_at >= cutoff,
                )
            )
        )
        total = total_result.scalar() or 0
        if total == 0:
            return 0.0

        cannibalized_result = await self.db.execute(
            select(func.count(MaintenancePart.id))
            .join(MaintenanceWorkOrder)
            .where(
                and_(
                    MaintenanceWorkOrder.unit_id == self.unit_id,
                    MaintenanceWorkOrder.created_at >= cutoff,
                    MaintenancePart.source == "CANNIBALIZED",
                )
            )
        )
        cannibalized = cannibalized_result.scalar() or 0

        return (cannibalized / total) * 100.0

    async def get_top_fault_codes(self, limit: int = 10) -> List[Dict]:
        """
        Top fault codes / most common equipment faults in the unit.

        Returns: list of {fault_description, equipment_type, count, severity}
        """
        result = await self.db.execute(
            select(
                EquipmentFault.fault_description,
                Equipment.equipment_type,
                func.count(EquipmentFault.id).label("count"),
            )
            .join(Equipment)
            .where(Equipment.unit_id == self.unit_id)
            .group_by(
                EquipmentFault.fault_description,
                Equipment.equipment_type,
            )
            .order_by(func.count(EquipmentFault.id).desc())
            .limit(limit)
        )

        rows = result.all()
        faults = [
            {
                "fault_description": row.fault_description,
                "equipment_type": row.equipment_type,
                "count": row.count,
            }
            for row in rows
        ]
        return faults

    async def get_maintenance_by_week(self, weeks: int = 12) -> List[Dict]:
        """
        Maintenance man-hours and work orders by week (for trend chart).

        Returns: list of {week_start_date, total_hours, work_order_count}
        """
        cutoff = datetime.now(timezone.utc) - timedelta(weeks=weeks)

        result = await self.db.execute(
            select(
                func.date_trunc("week", MaintenanceLabor.date).label("week_start"),
                func.sum(MaintenanceLabor.hours).label("total_hours"),
                func.count(
                    func.distinct(MaintenanceWorkOrder.id)
                ).label("work_order_count"),
            )
            .join(MaintenanceWorkOrder)
            .where(
                and_(
                    MaintenanceWorkOrder.unit_id == self.unit_id,
                    MaintenanceLabor.date >= cutoff.date(),
                )
            )
            .group_by(func.date_trunc("week", MaintenanceLabor.date))
            .order_by(func.date_trunc("week", MaintenanceLabor.date).desc())
        )

        rows = result.all()
        weekly = [
            {
                "week_start": row.week_start,
                "total_hours": float(row.total_hours or 0),
                "work_order_count": row.work_order_count or 0,
            }
            for row in rows
        ]
        return weekly
```

---

## API Endpoints

### Update Existing: `backend/app/api/maintenance.py`

The existing `/` (list), `/{wo_id}` (get), `POST /`, `PUT /{wo_id}`, `DELETE /{wo_id}` endpoints remain unchanged.

Enhance the list endpoint with additional filters:

```python
@router.get("/", response_model=List[MaintenanceWorkOrderResponse])
async def list_work_orders(
    unit_id: Optional[int] = Query(None),
    equipment_id: Optional[int] = Query(None),
    status: Optional[WorkOrderStatus] = Query(None),
    priority: Optional[int] = Query(None, ge=1, le=5),
    category: Optional[WorkOrderCategory] = Query(None),
    echelon: Optional[EchelonOfMaintenance] = Query(None),
    assigned_to: Optional[str] = Query(None),
    deadline_overdue: Optional[bool] = Query(None, description="Filter for overdue deadlines"),
    limit: int = Query(100, le=500),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List maintenance work orders with enhanced filtering.
    - deadline_overdue=true: return only WOs with deadline_date < now
    """
    accessible = await get_accessible_units(db, current_user)
    query = select(MaintenanceWorkOrder).where(
        MaintenanceWorkOrder.unit_id.in_(accessible)
    )

    if unit_id and unit_id in accessible:
        query = query.where(MaintenanceWorkOrder.unit_id == unit_id)
    if equipment_id is not None:
        query = query.where(
            MaintenanceWorkOrder.individual_equipment_id == equipment_id
        )
    if status:
        query = query.where(MaintenanceWorkOrder.status == status)
    if priority is not None:
        query = query.where(MaintenanceWorkOrder.priority == priority)
    if category:
        query = query.where(MaintenanceWorkOrder.category == category)
    if echelon:
        query = query.where(MaintenanceWorkOrder.echelon_of_maintenance == echelon)
    if assigned_to:
        query = query.where(MaintenanceWorkOrder.assigned_to == assigned_to)
    if deadline_overdue is not None:
        now = func.now()
        if deadline_overdue:
            query = query.where(MaintenanceWorkOrder.deadline_date < now)
        else:
            query = query.where(MaintenanceWorkOrder.deadline_date >= now)

    query = (
        query.order_by(
            MaintenanceWorkOrder.priority.asc(),
            MaintenanceWorkOrder.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()
```

### New Endpoints: Deadlines & Deadlines Management

Add to `backend/app/api/maintenance.py`:

```python
@router.get("/deadlines", response_model=List[MaintenanceDeadlineResponse])
async def get_unit_deadlines(
    unit_id: Optional[int] = Query(None),
    active_only: bool = Query(True, description="Only show active (not lifted) deadlines"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all deadlined equipment for a unit."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id and unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    units = [unit_id] if unit_id else accessible
    query = select(MaintenanceDeadline).where(
        MaintenanceDeadline.unit_id.in_(units)
    )

    if active_only:
        query = query.where(MaintenanceDeadline.lifted_date.is_(None))

    query = query.order_by(MaintenanceDeadline.deadline_date.asc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/deadlines", response_model=MaintenanceDeadlineResponse, status_code=201)
async def create_deadline(
    data: MaintenanceDeadlineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a maintenance deadline (equipment goes NMC)."""
    accessible = await get_accessible_units(db, current_user)
    if data.unit_id not in accessible:
        raise NotFoundError("Unit", data.unit_id)

    deadline = MaintenanceDeadline(**data.model_dump())
    db.add(deadline)
    await db.flush()
    await db.refresh(deadline)
    return deadline


@router.put("/deadlines/{deadline_id}", response_model=MaintenanceDeadlineResponse)
async def lift_deadline(
    deadline_id: int,
    data: MaintenanceDeadlineLift,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lift a deadline (equipment returns to FMC)."""
    result = await db.execute(
        select(MaintenanceDeadline).where(MaintenanceDeadline.id == deadline_id)
    )
    deadline = result.scalar_one_or_none()
    if not deadline:
        raise NotFoundError("Deadline", deadline_id)

    accessible = await get_accessible_units(db, current_user)
    if deadline.unit_id not in accessible:
        raise NotFoundError("Deadline", deadline_id)

    deadline.lifted_date = func.now()
    deadline.lifted_by = current_user.username

    await db.flush()
    await db.refresh(deadline)
    return deadline
```

### New Endpoints: PM Schedule

Add to `backend/app/api/maintenance.py`:

```python
@router.get("/pm-schedule", response_model=List[PreventiveMaintenanceScheduleResponse])
async def get_pm_schedule(
    unit_id: Optional[int] = Query(None),
    overdue_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get preventive maintenance schedule for a unit.
    If overdue_only=true, return only PMs past their next_due date.
    """
    accessible = await get_accessible_units(db, current_user)
    if unit_id and unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    units = [unit_id] if unit_id else accessible
    query = select(PreventiveMaintenanceSchedule).where(
        PreventiveMaintenanceSchedule.unit_id.in_(units)
    )

    if overdue_only:
        now = func.now()
        query = query.where(PreventiveMaintenanceSchedule.next_due < now)

    query = query.order_by(PreventiveMaintenanceSchedule.next_due.asc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/pm-schedule", response_model=PreventiveMaintenanceScheduleResponse, status_code=201)
async def create_pm_schedule(
    data: PreventiveMaintenanceScheduleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a preventive maintenance schedule entry."""
    accessible = await get_accessible_units(db, current_user)
    if data.unit_id not in accessible:
        raise NotFoundError("Unit", data.unit_id)

    pm = PreventiveMaintenanceSchedule(**data.model_dump())
    db.add(pm)
    await db.flush()
    await db.refresh(pm)
    return pm
```

### New Endpoints: Analytics

Create `backend/app/api/maintenance_analytics.py`:

```python
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.exceptions import NotFoundError
from app.core.permissions import get_accessible_units
from app.database import get_db
from app.models.user import User
from app.services.maintenance_analytics import MaintenanceAnalytics

router = APIRouter()


@router.get("/analytics/{unit_id}")
async def get_maintenance_analytics(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get comprehensive maintenance analytics for a unit.

    Returns:
    {
      "deadline_rate": 15.5,          # % of equipment deadlined
      "mttr": 18.5,                   # Mean time to repair (hours)
      "parts_fill_rate": 92.3,        # % of parts received
      "cannibalization_rate": 8.2,    # % of parts cannibalized
      "overdue_pms": [...],
      "deadline_equipment": [...],
      "top_faults": [...],
      "man_hours_last_30d": 245.5,
      "weekly_trend": [...]
    }
    """
    accessible = await get_accessible_units(db, current_user)
    if unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    analytics = MaintenanceAnalytics(db, unit_id)

    return {
        "deadline_rate": await analytics.calculate_deadline_rate(),
        "mttr": await analytics.calculate_avg_repair_time(days=90),
        "parts_fill_rate": await analytics.calculate_parts_fill_rate(days=90),
        "cannibalization_rate": await analytics.get_cannibalization_rate(days=90),
        "overdue_pms": await analytics.get_overdue_pms(),
        "deadline_equipment": await analytics.get_deadline_equipment(),
        "top_faults": await analytics.get_top_fault_codes(limit=10),
        "man_hours_last_30d": await analytics.calculate_maintenance_man_hours(days=30),
        "weekly_trend": await analytics.get_maintenance_by_week(weeks=12),
    }


@router.get("/analytics/{unit_id}/deadline-rate")
async def get_deadline_rate(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get deadline rate (% of equipment deadlined)."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    analytics = MaintenanceAnalytics(db, unit_id)
    return {"deadline_rate": await analytics.calculate_deadline_rate()}


@router.get("/analytics/{unit_id}/overdue-pms")
async def get_overdue_pms(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all overdue preventive maintenance items."""
    accessible = await get_accessible_units(db, current_user)
    if unit_id not in accessible:
        raise NotFoundError("Unit", unit_id)

    analytics = MaintenanceAnalytics(db, unit_id)
    return await analytics.get_overdue_pms()
```

---

## Pydantic Schemas

Create/update `backend/app/schemas/maintenance.py`:

Add these new schemas:

```python
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.models.maintenance import (
    EchelonOfMaintenance,
    MaintenanceLevel,
    WorkOrderCategory,
    WorkOrderStatus,
)
from app.models.maintenance_schedule import (
    DeadlineReason,
    EROStatus,
    PMType,
)


# ──────────────────── Deadline Schemas ──────────────────────

class MaintenanceDeadlineCreate(BaseModel):
    unit_id: int
    equipment_id: int
    reason: DeadlineReason
    work_order_id: Optional[int] = None
    notes: Optional[str] = None


class MaintenanceDeadlineLift(BaseModel):
    """Data for lifting (clearing) a deadline."""
    pass  # lifted_date and lifted_by are set by endpoint


class MaintenanceDeadlineResponse(BaseModel):
    id: int
    unit_id: int
    equipment_id: int
    deadline_date: datetime
    reason: DeadlineReason
    work_order_id: Optional[int]
    lifted_date: Optional[datetime]
    lifted_by: Optional[str]
    notes: Optional[str]
    is_active: bool

    class Config:
        from_attributes = True


# ──────────────────── PM Schedule Schemas ──────────────────────

class PreventiveMaintenanceScheduleCreate(BaseModel):
    unit_id: int
    equipment_id: int
    pm_type: PMType
    interval_value: int


class PreventiveMaintenanceScheduleResponse(BaseModel):
    id: int
    unit_id: int
    equipment_id: int
    pm_type: PMType
    interval_value: int
    last_performed: Optional[datetime]
    next_due: Optional[datetime]
    is_overdue: bool

    class Config:
        from_attributes = True


# ──────────────────── ERO Schemas ──────────────────────

class EquipmentRepairOrderCreate(BaseModel):
    unit_id: int
    equipment_id: int
    ero_number: str
    intermediate_maintenance_activity: str
    estimated_return_date: Optional[datetime] = None
    work_order_id: Optional[int] = None
    repair_description: Optional[str] = None


class EquipmentRepairOrderResponse(BaseModel):
    id: int
    unit_id: int
    equipment_id: int
    ero_number: str
    submitted_date: datetime
    status: EROStatus
    intermediate_maintenance_activity: str
    estimated_return_date: Optional[datetime]
    actual_return_date: Optional[datetime]
    work_order_id: Optional[int]
    repair_description: Optional[str]
    days_in_repair: int
    is_returned: bool

    class Config:
        from_attributes = True
```

---

## Frontend Integration

### New Page: `MaintenancePage.tsx`

Create `frontend/src/pages/MaintenancePage.tsx`:

```typescript
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";

import WorkOrderTable from "@/components/maintenance/WorkOrderTable";
import WorkOrderDetail from "@/components/maintenance/WorkOrderDetail";
import PMScheduleTable from "@/components/maintenance/PMScheduleTable";
import DeadlineBoard from "@/components/maintenance/DeadlineBoard";
import MaintenanceAnalyticsPanel from "@/components/maintenance/MaintenanceAnalyticsPanel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function MaintenancePage() {
  const { unitId } = useParams();
  const [selectedWoId, setSelectedWoId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("work-orders");

  // Fetch work orders
  const { data: workOrders, isLoading: woLoading } = useQuery({
    queryKey: ["maintenance", "work-orders", unitId],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/maintenance?unit_id=${unitId}&limit=500`
      );
      return res.json();
    },
  });

  // Fetch analytics
  const { data: analytics } = useQuery({
    queryKey: ["maintenance", "analytics", unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/maintenance/analytics/${unitId}`);
      return res.json();
    },
  });

  // Fetch PM schedule
  const { data: pmSchedule } = useQuery({
    queryKey: ["maintenance", "pm-schedule", unitId],
    queryFn: async () => {
      const res = await fetch(
        `/api/v1/maintenance/pm-schedule?unit_id=${unitId}`
      );
      return res.json();
    },
  });

  // Fetch deadlines
  const { data: deadlines } = useQuery({
    queryKey: ["maintenance", "deadlines", unitId],
    queryFn: async () => {
      const res = await fetch(`/api/v1/maintenance/deadlines?unit_id=${unitId}`);
      return res.json();
    },
  });

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Maintenance Management</h1>
      </div>

      <MaintenanceAnalyticsPanel analytics={analytics} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="work-orders">Work Orders</TabsTrigger>
          <TabsTrigger value="pm-schedule">PM Schedule</TabsTrigger>
          <TabsTrigger value="deadlines">Deadlines</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="work-orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Work Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {woLoading ? (
                <div>Loading...</div>
              ) : (
                <>
                  <WorkOrderTable
                    workOrders={workOrders || []}
                    onSelectWo={(wo) => setSelectedWoId(wo.id)}
                  />
                  {selectedWoId && (
                    <WorkOrderDetail woId={selectedWoId} />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pm-schedule">
          <Card>
            <CardHeader>
              <CardTitle>Preventive Maintenance Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              <PMScheduleTable pmSchedule={pmSchedule || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deadlines">
          <Card>
            <CardHeader>
              <CardTitle>Deadlined Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <DeadlineBoard deadlines={deadlines || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-4">
            <MaintenanceAnalyticsPanel analytics={analytics} detailed={true} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Component: `WorkOrderTable.tsx`

Create `frontend/src/components/maintenance/WorkOrderTable.tsx`:

```typescript
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WorkOrder {
  id: number;
  work_order_number: string;
  status: "OPEN" | "IN_PROGRESS" | "AWAITING_PARTS" | "COMPLETE" | "CANCELED";
  priority: number;
  description: string;
  assigned_to: string | null;
  deadline_date: string | null;
  created_at: string;
}

interface Props {
  workOrders: WorkOrder[];
  onSelectWo: (wo: WorkOrder) => void;
}

export default function WorkOrderTable({ workOrders, onSelectWo }: Props) {
  const [sortBy, setSortBy] = useState<"priority" | "created" | "deadline">(
    "priority"
  );

  const statusColors = {
    OPEN: "bg-blue-100 text-blue-800",
    IN_PROGRESS: "bg-yellow-100 text-yellow-800",
    AWAITING_PARTS: "bg-orange-100 text-orange-800",
    COMPLETE: "bg-green-100 text-green-800",
    CANCELED: "bg-gray-100 text-gray-800",
  };

  const priorityLabel = (p: number) => {
    const labels = ["", "Critical", "High", "Medium", "Low", "Planning"];
    return labels[p] || "Unknown";
  };

  const sorted = [...workOrders].sort((a, b) => {
    if (sortBy === "priority") return a.priority - b.priority;
    if (sortBy === "created")
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === "deadline") {
      const aDate = a.deadline_date ? new Date(a.deadline_date).getTime() : Infinity;
      const bDate = b.deadline_date ? new Date(b.deadline_date).getTime() : Infinity;
      return aDate - bDate;
    }
    return 0;
  });

  const isOverdue = (deadline: string | null) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={sortBy === "priority" ? "default" : "outline"}
          onClick={() => setSortBy("priority")}
          size="sm"
        >
          By Priority
        </Button>
        <Button
          variant={sortBy === "created" ? "default" : "outline"}
          onClick={() => setSortBy("created")}
          size="sm"
        >
          By Created
        </Button>
        <Button
          variant={sortBy === "deadline" ? "default" : "outline"}
          onClick={() => setSortBy("deadline")}
          size="sm"
        >
          By Deadline
        </Button>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <Table>
          <TableHeader className="bg-slate-100">
            <TableRow>
              <TableHead className="w-32">WO #</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-20">Priority</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-28">Deadline</TableHead>
              <TableHead className="w-20">Assigned To</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((wo) => (
              <TableRow
                key={wo.id}
                className="hover:bg-slate-50 cursor-pointer"
                onClick={() => onSelectWo(wo)}
              >
                <TableCell className="font-mono font-semibold">
                  {wo.work_order_number}
                </TableCell>
                <TableCell>
                  <Badge className={statusColors[wo.status]}>
                    {wo.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">
                  {priorityLabel(wo.priority)}
                </TableCell>
                <TableCell className="text-sm text-gray-600 truncate">
                  {wo.description}
                </TableCell>
                <TableCell className="text-sm">
                  {wo.deadline_date ? (
                    <span
                      className={
                        isOverdue(wo.deadline_date)
                          ? "text-red-600 font-semibold flex items-center gap-1"
                          : ""
                      }
                    >
                      {isOverdue(wo.deadline_date) && (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      {new Date(wo.deadline_date).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm">
                  {wo.assigned_to || "—"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Details</DropdownMenuItem>
                      <DropdownMenuItem>Edit</DropdownMenuItem>
                      <DropdownMenuItem>Add Parts</DropdownMenuItem>
                      <DropdownMenuItem>Log Labor</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
```

### Component: `DeadlineBoard.tsx`

Create `frontend/src/components/maintenance/DeadlineBoard.tsx`:

```typescript
import React from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Deadline {
  deadline_id: number;
  equipment_id: number;
  bumper_number: string;
  nomenclature: string;
  reason: string;
  deadline_date: string;
  days_deadlined: number;
}

interface Props {
  deadlines: Deadline[];
}

export default function DeadlineBoard({ deadlines }: Props) {
  const criticalDeadlines = deadlines.filter((d) => d.days_deadlined > 30);
  const recentDeadlines = deadlines.filter(
    (d) => d.days_deadlined <= 30 && d.days_deadlined >= 7
  );
  const newDeadlines = deadlines.filter((d) => d.days_deadlined < 7);

  const reasonColors: Record<string, string> = {
    AWAITING_PARTS: "bg-red-50 border-l-4 border-red-500",
    AWAITING_REPAIR: "bg-orange-50 border-l-4 border-orange-500",
    SAFETY_ISSUE: "bg-red-100 border-l-4 border-red-700",
    PENDING_INSPECTION: "bg-yellow-50 border-l-4 border-yellow-500",
    DEPOT_OVERHAUL: "bg-purple-50 border-l-4 border-purple-500",
  };

  const DeadlineCard = ({ deadline }: { deadline: Deadline }) => (
    <Card className={`p-4 ${reasonColors[deadline.reason] || "bg-gray-50"}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold">{deadline.bumper_number}</h3>
          </div>
          <p className="text-sm text-gray-600 mt-1">{deadline.nomenclature}</p>
          <div className="flex items-center gap-2 mt-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600">
              {deadline.days_deadlined} days deadlined
            </span>
          </div>
        </div>
        <Badge variant="secondary">{deadline.reason}</Badge>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {criticalDeadlines.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-red-700 mb-3">
            Critical (30+ days deadlined)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {criticalDeadlines.map((deadline) => (
              <DeadlineCard key={deadline.deadline_id} deadline={deadline} />
            ))}
          </div>
        </div>
      )}

      {recentDeadlines.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-orange-700 mb-3">
            Recent (7-30 days)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recentDeadlines.map((deadline) => (
              <DeadlineCard key={deadline.deadline_id} deadline={deadline} />
            ))}
          </div>
        </div>
      )}

      {newDeadlines.length > 0 && (
        <div>
          <h2 className="text-lg font-bold text-blue-700 mb-3">
            New (0-7 days)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {newDeadlines.map((deadline) => (
              <DeadlineCard key={deadline.deadline_id} deadline={deadline} />
            ))}
          </div>
        </div>
      )}

      {deadlines.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>No deadlined equipment</p>
        </div>
      )}
    </div>
  );
}
```

### Component: `MaintenanceAnalyticsPanel.tsx`

Create `frontend/src/components/maintenance/MaintenanceAnalyticsPanel.tsx`:

```typescript
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { AlertTriangle, TrendingUp, Package, Wrench } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Analytics {
  deadline_rate: number;
  mttr: number;
  parts_fill_rate: number;
  cannibalization_rate: number;
  man_hours_last_30d: number;
  overdue_pms: Array<{ equipment_id: number; days_overdue: number }>;
  deadline_equipment: Array<{ days_deadlined: number }>;
  top_faults: Array<{ fault_description: string; count: number }>;
  weekly_trend: Array<{ week_start: string; total_hours: number; work_order_count: number }>;
}

interface Props {
  analytics?: Analytics;
  detailed?: boolean;
}

export default function MaintenanceAnalyticsPanel({
  analytics,
  detailed = false,
}: Props) {
  if (!analytics) {
    return <div className="text-gray-500">Loading analytics...</div>;
  }

  const gaugeColor = (value: number) => {
    if (value < 30) return "bg-green-500";
    if (value < 50) return "bg-yellow-500";
    if (value < 70) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Deadline Rate Gauge */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Deadline Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.deadline_rate.toFixed(1)}%</div>
          <Progress value={analytics.deadline_rate} className="mt-2" />
          <p className="text-xs text-gray-500 mt-2">
            {analytics.deadline_equipment.length} equipment deadlined
          </p>
        </CardContent>
      </Card>

      {/* Mean Time to Repair */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Mean Time to Repair
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.mttr.toFixed(1)}h</div>
          <p className="text-xs text-gray-500 mt-2">Last 90 days</p>
        </CardContent>
      </Card>

      {/* Parts Fill Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Package className="w-4 h-4" />
            Parts Fill Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{analytics.parts_fill_rate.toFixed(1)}%</div>
          <Progress value={analytics.parts_fill_rate} className="mt-2" />
          <p className="text-xs text-gray-500 mt-2">Last 90 days</p>
        </CardContent>
      </Card>

      {/* Cannibalization Rate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Cannibalization Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {analytics.cannibalization_rate.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500 mt-2">Parts sourced via cannibalization</p>
        </CardContent>
      </Card>

      {/* Additional detailed views if requested */}
      {detailed && (
        <>
          {/* Weekly Trend Chart */}
          <Card className="col-span-full">
            <CardHeader>
              <CardTitle>Maintenance Activity Trend (12 weeks)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.weekly_trend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week_start" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="total_hours"
                    stroke="#8884d8"
                    name="Labor Hours"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="work_order_count"
                    stroke="#82ca9d"
                    name="Work Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Faults Bar Chart */}
          {analytics.top_faults.length > 0 && (
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Top Equipment Faults</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={analytics.top_faults.slice(0, 10)}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      dataKey="fault_description"
                      type="category"
                      width={150}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
```

### Update Router: Add Maintenance Route

Edit `frontend/src/pages/App.tsx` or main router file:

```typescript
import MaintenancePage from "@/pages/MaintenancePage";

// Add to routes array:
{
  path: "/units/:unitId/maintenance",
  element: <MaintenancePage />,
}
```

### Update Sidebar Navigation

Add link to maintenance in the sidebar:

```typescript
// In sidebar navigation menu:
<NavLink to={`/units/${unitId}/maintenance`} className="flex items-center gap-2">
  <Wrench className="w-4 h-4" />
  Maintenance
</NavLink>
```

---

## Database Migrations

Create migration for new tables:

```bash
# Generate migration
alembic revision --autogenerate -m "Add maintenance schedules, deadlines, ERO models"
```

The migration should create:
- `preventive_maintenance_schedules` table
- `maintenance_deadlines` table
- `equipment_repair_orders` table
- Add columns to `maintenance_work_orders` table (echelon_of_maintenance, maintenance_level, deadline_date, eri_date, erb_number, downtime_hours, nmcs_since, nmcm_since)
- Add `CANCELED` to `work_order_status` enum

---

## Implementation Tasks

### Backend Development

1. **Update Models** (maintenance.py & new maintenance_schedule.py)
   - Add new enums and fields to MaintenanceWorkOrder
   - Create PreventiveMaintenanceSchedule, MaintenanceDeadline, EquipmentRepairOrder models
   - Add relationships and properties

2. **Create Analytics Service** (maintenance_analytics.py)
   - Implement all 8 analytics methods
   - Add computed properties for overdue, deadline status

3. **Expand API** (maintenance.py + new maintenance_analytics.py)
   - Enhance list_work_orders with new filters
   - Add deadline CRUD endpoints
   - Add PM schedule endpoints
   - Create analytics endpoint bundle

4. **Create Schemas** (schemas/maintenance.py)
   - Add response models for all new features
   - Pydantic validation

5. **Database Migrations**
   - Run alembic auto-generate
   - Review and apply migrations

### Frontend Development

1. **Create MaintenancePage.tsx**
   - Tab-based layout: Work Orders | PM Schedule | Deadlines | Analytics

2. **Create Component Library**
   - WorkOrderTable with sorting & filtering
   - WorkOrderDetail modal/panel
   - PMScheduleTable with overdue highlighting
   - DeadlineBoard (Kanban-style card layout)
   - MaintenanceAnalyticsPanel (gauges + charts)

3. **Integrate with Router & Navigation**
   - Add `/units/:unitId/maintenance` route
   - Add sidebar nav link

4. **Connect to APIs**
   - Fetch work orders, PM schedule, deadlines, analytics
   - Handle loading/error states

---

## Testing & Validation

### Backend Testing

- Unit tests for `MaintenanceAnalytics` service methods
- API endpoint tests for all new CRUD operations
- Verify database constraints (unique ero_number, etc.)
- Test permission checks (unit_id access control)

### Frontend Testing

- Component rendering tests (Vitest)
- Data fetch mocking with MSW
- Integration test: navigate to maintenance page, select work order, view details
- Verify deadline highlighting (red for overdue)
- Verify PM schedule overdue flags

### Manual Testing

- Create sample data (work orders, deadlines, PM schedules, EROs)
- Verify deadline rate calculation
- Verify MTTR calculation
- Test PM schedule overdue detection
- Test deadline lift workflow
- Verify analytics dashboard renders correctly

---

## Notes

- All deadlines, PM schedules, and EROs are scoped to unit (unit_id foreign key) for access control
- MaintenanceWorkOrder.downtime_hours should be calculated as the interval between equipment status changes (NMC → FMC)
- Use AsyncSession for all database queries (FastAPI/SQLAlchemy async pattern)
- Deadline rate is a key readiness metric — prominently display in dashboard
- Consider adding Celery tasks for periodic PM schedule recalculation (next_due dates)
- Future enhancement: integrate with supply chain to auto-link parts requests to logistics
