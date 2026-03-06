"""Living Simulation Engine — async background generators that create
realistic logistics activity directly in the database.

Unlike the external simulator (backend/simulator/), this engine runs
*inside* the FastAPI process as background asyncio tasks and writes
records through SQLAlchemy.
"""

import asyncio
import logging
import random
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Callable, Dict, List, Optional

from sqlalchemy import func as sa_func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.models.activity import Activity, ActivityType
from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.equipment import Equipment, EquipmentAssetStatus
from app.models.maintenance import (
    MaintenanceWorkOrder,
    WorkOrderCategory,
    WorkOrderStatus,
)
from app.models.personnel import Personnel, PersonnelStatus
from app.models.report import Report, ReportStatus, ReportType
from app.models.requisition import (
    Requisition,
    RequisitionLineItem,
    RequisitionPriority,
    RequisitionStatus,
)
from app.models.supply import SupplyClass, SupplyStatus, SupplyStatusRecord
from app.models.transportation import Movement, MovementStatus
from app.models.unit import Unit
from app.models.user import User

logger = logging.getLogger("app.services.living_sim")

# ---------------------------------------------------------------------------
# Scenario configuration
# ---------------------------------------------------------------------------

SCENARIO_MULTIPLIERS: Dict[str, Dict[str, float]] = {
    "Garrison": {
        "optempo": 1.0,
        "fault_rate": 1.0,
        "supply_consumption": 1.0,
        "convoy_rate": 0.5,
        "alert_rate": 0.8,
    },
    "Pre-Deployment": {
        "optempo": 2.0,
        "fault_rate": 1.5,
        "supply_consumption": 1.8,
        "convoy_rate": 2.0,
        "alert_rate": 1.5,
    },
    "ITX": {
        "optempo": 3.0,
        "fault_rate": 2.5,
        "supply_consumption": 3.0,
        "convoy_rate": 3.0,
        "alert_rate": 2.0,
    },
    "Steel_Guardian": {
        "optempo": 4.0,
        "fault_rate": 3.0,
        "supply_consumption": 4.0,
        "convoy_rate": 4.0,
        "alert_rate": 3.0,
    },
}

AVAILABLE_SCENARIOS = list(SCENARIO_MULTIPLIERS.keys())

# Realistic supply items for requisitions
SUPPLY_ITEMS: List[Dict[str, Any]] = [
    {
        "nsn": "6135-01-451-1234",
        "name": "Battery, BA-5590",
        "unit": "EA",
        "cost": 35.00,
    },
    {
        "nsn": "8140-01-234-5678",
        "name": "Sandbag, Polypropylene",
        "unit": "BD",
        "cost": 0.50,
    },
    {
        "nsn": "9150-01-456-7890",
        "name": "Oil, Lubricating, OE/HDO-15/40",
        "unit": "QT",
        "cost": 8.50,
    },
    {
        "nsn": "8345-01-567-8901",
        "name": "Tent, General Purpose, Medium",
        "unit": "EA",
        "cost": 3500.00,
    },
    {
        "nsn": "6545-01-678-9012",
        "name": "First Aid Kit, Individual",
        "unit": "EA",
        "cost": 22.00,
    },
    {
        "nsn": "5180-01-789-0123",
        "name": "Tool Kit, General Mechanic",
        "unit": "KT",
        "cost": 450.00,
    },
    {
        "nsn": "5340-01-890-1234",
        "name": "Hardware Kit, Assorted",
        "unit": "KT",
        "cost": 120.00,
    },
    {
        "nsn": "2540-01-234-5679",
        "name": "Mirror, Rearview, HMMWV",
        "unit": "EA",
        "cost": 85.00,
    },
    {
        "nsn": "2530-01-345-6780",
        "name": "Brake Pad Set, MTVR",
        "unit": "SE",
        "cost": 320.00,
    },
    {
        "nsn": "2920-01-456-7891",
        "name": "Starter Motor, MEP-803A",
        "unit": "EA",
        "cost": 890.00,
    },
    {
        "nsn": "5820-01-567-8902",
        "name": "Radio, AN/PRC-117G",
        "unit": "EA",
        "cost": 28000.00,
    },
    {
        "nsn": "1005-01-678-9013",
        "name": "Barrel, Spare, M240B",
        "unit": "EA",
        "cost": 1200.00,
    },
    {
        "nsn": "8415-01-789-0124",
        "name": "Boot, Combat, Temperate",
        "unit": "PR",
        "cost": 95.00,
    },
    {
        "nsn": "8465-01-890-1235",
        "name": "Canteen, 1QT w/ Cover",
        "unit": "EA",
        "cost": 12.00,
    },
    {
        "nsn": "9130-01-234-5670",
        "name": "Fuel Filter, HMMWV",
        "unit": "EA",
        "cost": 28.00,
    },
]

# Equipment fault descriptions
FAULT_DESCRIPTIONS: List[Dict[str, str]] = [
    {"desc": "Engine oil leak at front main seal", "system": "engine"},
    {"desc": "Transmission hard shift 2nd to 3rd gear", "system": "transmission"},
    {"desc": "Left front tire showing cord — needs replacement", "system": "tires"},
    {"desc": "Air filter housing cracked, debris ingestion risk", "system": "engine"},
    {"desc": "CTIS controller fault — cannot adjust tire pressure", "system": "CTIS"},
    {"desc": "Alternator undercharging — output below 24V", "system": "electrical"},
    {"desc": "Coolant leak at water pump gasket", "system": "cooling"},
    {"desc": "Brake pad wear indicator active — rear axle", "system": "brakes"},
    {"desc": "Windshield cracked — visibility impaired", "system": "body"},
    {"desc": "Power steering pump whine — low fluid", "system": "steering"},
    {"desc": "Differential pinion seal leak — rear axle", "system": "drivetrain"},
    {"desc": "Battery terminals corroded — intermittent start", "system": "electrical"},
]

# Convoy routes
CONVOY_ROUTES: List[Dict[str, Any]] = [
    {
        "origin": "Camp Pendleton ASP",
        "destination": "Las Pulgas",
        "origin_lat": 33.3154,
        "origin_lon": -117.3542,
        "dest_lat": 33.3567,
        "dest_lon": -117.4012,
    },
    {
        "origin": "Camp Horno",
        "destination": "Edson Range",
        "origin_lat": 33.3211,
        "origin_lon": -117.3698,
        "dest_lat": 33.2867,
        "dest_lon": -117.3921,
    },
    {
        "origin": "Mainside Warehouse",
        "destination": "Camp San Mateo",
        "origin_lat": 33.2981,
        "origin_lon": -117.3156,
        "dest_lat": 33.3345,
        "dest_lon": -117.3589,
    },
    {
        "origin": "Camp Pendleton",
        "destination": "MCAGCC Twentynine Palms",
        "origin_lat": 33.3154,
        "origin_lon": -117.3542,
        "dest_lat": 34.2326,
        "dest_lon": -116.0553,
    },
    {
        "origin": "ASP-1",
        "destination": "FOB Condor",
        "origin_lat": 33.3000,
        "origin_lon": -117.3300,
        "dest_lat": 33.3500,
        "dest_lon": -117.3800,
    },
]


@dataclass
class SimulationConfig:
    """Configuration for the living simulation engine."""

    speed: int = 60  # 1=realtime, 60=1min/sec, 3600=1hr/sec
    scenario: str = "Garrison"
    enabled: bool = True

    # Base intervals in seconds (at realtime speed)
    requisition_interval: float = 900.0  # 15 min
    maintenance_interval: float = 1200.0  # 20 min
    convoy_interval: float = 1800.0  # 30 min
    supply_update_interval: float = 600.0  # 10 min
    alert_interval: float = 300.0  # 5 min
    personnel_interval: float = 1200.0  # 20 min
    report_interval: float = 3600.0  # 60 min

    @property
    def multipliers(self) -> Dict[str, float]:
        return SCENARIO_MULTIPLIERS.get(self.scenario, SCENARIO_MULTIPLIERS["Garrison"])

    def effective_interval(self, base: float) -> float:
        """Compute effective sleep interval considering speed and optempo."""
        optempo = self.multipliers.get("optempo", 1.0)
        # Higher optempo = more frequent events = shorter sleep
        # Higher speed = faster passage of sim time = shorter sleep
        return max(base / (self.speed * optempo), 2.0)


class LivingSimulationEngine:
    """Runs background async tasks that generate realistic logistics events."""

    def __init__(
        self,
        db_session_factory: async_sessionmaker[AsyncSession],
        config: Optional[SimulationConfig] = None,
    ):
        self.config = config or SimulationConfig()
        self.session_factory = db_session_factory
        self.running = False
        self._tasks: List[asyncio.Task] = []  # type: ignore[type-arg]
        self._rng = random.Random(42)
        self._req_counter = 0
        self._wo_counter = 0
        self._convoy_counter = 0

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    async def start(self) -> None:
        """Launch all background generator tasks."""
        if self.running:
            logger.warning("Living sim engine is already running")
            return

        self.running = True
        logger.info(
            "Starting Living Simulation Engine — scenario=%s speed=%dx",
            self.config.scenario,
            self.config.speed,
        )
        self._tasks = [
            asyncio.create_task(self._requisition_generator(), name="sim-requisition"),
            asyncio.create_task(self._maintenance_generator(), name="sim-maintenance"),
            asyncio.create_task(self._convoy_generator(), name="sim-convoy"),
            asyncio.create_task(
                self._supply_update_generator(), name="sim-supply-update"
            ),
            asyncio.create_task(self._alert_generator(), name="sim-alert"),
            asyncio.create_task(
                self._personnel_activity_generator(), name="sim-personnel"
            ),
            asyncio.create_task(self._report_generator(), name="sim-report"),
        ]

    async def stop(self) -> None:
        """Cancel all background tasks gracefully."""
        self.running = False
        for t in self._tasks:
            t.cancel()
        if self._tasks:
            await asyncio.gather(*self._tasks, return_exceptions=True)
        self._tasks.clear()
        logger.info("Living Simulation Engine stopped")

    def get_status(self) -> Dict[str, Any]:
        """Return current engine status."""
        return {
            "running": self.running,
            "scenario": self.config.scenario,
            "speed": self.config.speed,
            "enabled": self.config.enabled,
            "active_tasks": len([t for t in self._tasks if not t.done()]),
            "multipliers": self.config.multipliers,
        }

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    async def _get_session(self) -> AsyncSession:
        return self.session_factory()

    async def _get_random_unit(self, db: AsyncSession) -> Optional[Unit]:
        """Pick a random unit from the database."""
        result = await db.execute(select(Unit.id))
        ids = [row[0] for row in result.all()]
        if not ids:
            return None
        chosen_id = self._rng.choice(ids)
        result2 = await db.execute(select(Unit).where(Unit.id == chosen_id))
        unit: Optional[Unit] = result2.scalar_one_or_none()
        return unit

    async def _get_demo_users(self, db: AsyncSession) -> List[User]:
        """Get all demo users (those with demo_profile set)."""
        result = await db.execute(select(User).where(User.demo_profile.isnot(None)))
        return list(result.scalars().all())

    async def _get_supply_users(self, db: AsyncSession) -> List[User]:
        """Get users with supply-related billets."""
        result = await db.execute(select(User).where(User.demo_profile.isnot(None)))
        users = result.scalars().all()
        supply_users = []
        for u in users:
            profile = u.demo_profile or {}
            billet = profile.get("billet", "").lower()
            if "supply" in billet or "s-4" in billet or "s4" in billet.replace("-", ""):
                supply_users.append(u)
        return supply_users if supply_users else list(users)[:3]

    async def _log_activity(
        self,
        db: AsyncSession,
        activity_type: ActivityType,
        action: str,
        description: str,
        unit_id: Optional[int] = None,
        user_id: Optional[int] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Create an Activity record."""
        activity = Activity(
            activity_type=activity_type,
            unit_id=unit_id,
            user_id=user_id,
            action=action,
            description=description[:500],
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
        )
        db.add(activity)

    async def _safe_loop(
        self, name: str, interval: float, handler: Callable[..., Any]
    ) -> None:
        """Run a generator in a safe loop with error recovery."""
        while self.running:
            try:
                sleep_time = self.config.effective_interval(interval)
                await asyncio.sleep(sleep_time)
                if not self.running:
                    break
                async with self.session_factory() as db:
                    await handler(db)
                    await db.commit()
            except asyncio.CancelledError:
                break
            except Exception:
                logger.exception("Error in %s generator", name)
                await asyncio.sleep(5)

    # ------------------------------------------------------------------
    # Generator 1: Requisitions
    # ------------------------------------------------------------------

    async def _requisition_generator(self) -> None:
        """Generate realistic requisitions from supply users."""
        await self._safe_loop(
            "requisition",
            self.config.requisition_interval,
            self._create_requisition,
        )

    async def _create_requisition(self, db: AsyncSession) -> None:
        supply_users = await self._get_supply_users(db)
        if not supply_users:
            return

        user = self._rng.choice(supply_users)
        if not user.unit_id:
            return

        self._req_counter += 1
        now = datetime.now(timezone.utc)
        req_number = f"REQ-{now.strftime('%Y%m%d')}-{self._req_counter:04d}"

        # Priority distribution: 80% routine, 15% urgent, 5% emergency
        priority_roll = self._rng.random()
        if priority_roll < 0.05:
            priority = RequisitionPriority.P02  # Emergency
        elif priority_roll < 0.20:
            priority = RequisitionPriority.P04  # Urgent
        else:
            priority = RequisitionPriority.P08  # Routine

        # Some start as DRAFT, some as SUBMITTED
        status = self._rng.choice(
            [
                RequisitionStatus.DRAFT,
                RequisitionStatus.SUBMITTED,
                RequisitionStatus.SUBMITTED,
            ]
        )

        item = self._rng.choice(SUPPLY_ITEMS)
        qty = self._rng.randint(1, 50)

        justification_templates = [
            f"Routine resupply of {item['name']} for battery operations",
            f"Replacement {item['name']} — current stock below reorder point",
            f"Required for upcoming field exercise — {item['name']}",
            f"Emergency replacement — {item['name']} critical for readiness",
            f"Preventive maintenance requires {item['name']}",
        ]

        req = Requisition(
            requisition_number=req_number,
            unit_id=user.unit_id,
            requested_by_id=user.id,
            status=status,
            priority=priority,
            justification=self._rng.choice(justification_templates),
            delivery_location="BN Supply Warehouse",
            estimated_cost=round(item["cost"] * qty, 2),
            submitted_at=now if status == RequisitionStatus.SUBMITTED else None,
        )
        db.add(req)
        await db.flush()

        line_item = RequisitionLineItem(
            requisition_id=req.id,
            nsn=item["nsn"],
            nomenclature=item["name"],
            quantity=qty,
            unit_of_issue=item["unit"],
            unit_cost=item["cost"],
        )
        db.add(line_item)

        profile = user.demo_profile or {}
        await self._log_activity(
            db,
            ActivityType.REQUISITION,
            "created",
            f"{profile.get('rank', '')} {user.full_name} submitted {req_number} "
            f"for {qty}x {item['name']} (Priority {priority.value})",
            unit_id=user.unit_id,
            user_id=user.id,
            entity_type="requisition",
            entity_id=req.id,
            details={
                "requisition_number": req_number,
                "item": item["name"],
                "quantity": qty,
                "priority": priority.value,
                "status": status.value,
            },
        )
        logger.debug("Created requisition %s", req_number)

    # ------------------------------------------------------------------
    # Generator 2: Maintenance Work Orders
    # ------------------------------------------------------------------

    async def _maintenance_generator(self) -> None:
        """Generate maintenance work orders for equipment faults."""
        await self._safe_loop(
            "maintenance",
            self.config.maintenance_interval,
            self._create_maintenance_wo,
        )

    async def _create_maintenance_wo(self, db: AsyncSession) -> None:
        fault_rate = self.config.multipliers.get("fault_rate", 1.0)

        # Only create WO if random check passes based on fault rate
        if self._rng.random() > (0.5 * fault_rate / 3.0 + 0.3):
            return

        # Pick a random FMC piece of equipment
        result = await db.execute(
            select(Equipment)
            .where(Equipment.status == EquipmentAssetStatus.FMC)
            .limit(50)
        )
        equipment_list = list(result.scalars().all())
        if not equipment_list:
            return

        equip = self._rng.choice(equipment_list)
        fault = self._rng.choice(FAULT_DESCRIPTIONS)

        self._wo_counter += 1
        now = datetime.now(timezone.utc)
        wo_number = f"WO-{now.strftime('%Y%m%d')}-{self._wo_counter:04d}"

        # Set equipment to NMC_M
        equip.status = EquipmentAssetStatus.NMC_M

        # Determine category
        category = self._rng.choice(
            [
                WorkOrderCategory.CORRECTIVE,
                WorkOrderCategory.CORRECTIVE,
                WorkOrderCategory.CORRECTIVE,
                WorkOrderCategory.INSPECTION,
            ]
        )

        wo = MaintenanceWorkOrder(
            unit_id=equip.unit_id,
            individual_equipment_id=equip.id,
            work_order_number=wo_number,
            description=f"{fault['desc']} on {equip.nomenclature} ({equip.bumper_number})",
            status=WorkOrderStatus.OPEN,
            category=category,
            priority=self._rng.choice([1, 2, 3, 3, 3, 4, 5]),
            estimated_completion=now + timedelta(hours=self._rng.randint(4, 72)),
            location="Maintenance Bay",
            nmcs_since=now,
        )
        db.add(wo)
        await db.flush()

        await self._log_activity(
            db,
            ActivityType.WORK_ORDER,
            "created",
            f"Work order {wo_number} opened: {fault['desc']} on "
            f"{equip.nomenclature} ({equip.bumper_number})",
            unit_id=equip.unit_id,
            entity_type="maintenance_work_order",
            entity_id=wo.id,
            details={
                "work_order_number": wo_number,
                "equipment": equip.nomenclature,
                "bumper_number": equip.bumper_number,
                "fault": fault["desc"],
                "system": fault["system"],
            },
        )

        # Also progress some existing open WOs
        await self._progress_work_orders(db)

    async def _progress_work_orders(self, db: AsyncSession) -> None:
        """Randomly progress some existing work orders."""
        result = await db.execute(
            select(MaintenanceWorkOrder)
            .where(
                MaintenanceWorkOrder.status.in_(
                    [WorkOrderStatus.OPEN, WorkOrderStatus.IN_PROGRESS]
                )
            )
            .limit(20)
        )
        open_wos = list(result.scalars().all())

        for wo in open_wos:
            if self._rng.random() < 0.15:
                if wo.status == WorkOrderStatus.OPEN:
                    wo.status = WorkOrderStatus.IN_PROGRESS
                    await self._log_activity(
                        db,
                        ActivityType.WORK_ORDER,
                        "in_progress",
                        f"Work order {wo.work_order_number} now in progress",
                        unit_id=wo.unit_id,
                        entity_type="maintenance_work_order",
                        entity_id=wo.id,
                    )
                elif wo.status == WorkOrderStatus.IN_PROGRESS:
                    if self._rng.random() < 0.3:
                        wo.status = WorkOrderStatus.AWAITING_PARTS
                        await self._log_activity(
                            db,
                            ActivityType.WORK_ORDER,
                            "awaiting_parts",
                            f"Work order {wo.work_order_number} awaiting parts",
                            unit_id=wo.unit_id,
                            entity_type="maintenance_work_order",
                            entity_id=wo.id,
                        )
                    else:
                        wo.status = WorkOrderStatus.COMPLETE
                        wo.completed_at = datetime.now(timezone.utc)
                        wo.actual_hours = round(self._rng.uniform(1.0, 40.0), 1)
                        # Restore equipment to FMC
                        if wo.individual_equipment_id:
                            equip_result = await db.execute(
                                select(Equipment).where(
                                    Equipment.id == wo.individual_equipment_id
                                )
                            )
                            equip = equip_result.scalar_one_or_none()
                            if equip:
                                equip.status = EquipmentAssetStatus.FMC

                        await self._log_activity(
                            db,
                            ActivityType.WORK_ORDER,
                            "completed",
                            f"Work order {wo.work_order_number} completed "
                            f"({wo.actual_hours}h labor)",
                            unit_id=wo.unit_id,
                            entity_type="maintenance_work_order",
                            entity_id=wo.id,
                        )

    # ------------------------------------------------------------------
    # Generator 3: Convoys / Movements
    # ------------------------------------------------------------------

    async def _convoy_generator(self) -> None:
        """Generate convoy movements and progress existing ones."""
        await self._safe_loop(
            "convoy",
            self.config.convoy_interval,
            self._create_convoy,
        )

    async def _create_convoy(self, db: AsyncSession) -> None:
        convoy_rate = self.config.multipliers.get("convoy_rate", 1.0)

        # Chance to create a new convoy
        if self._rng.random() > (0.4 * convoy_rate / 4.0 + 0.2):
            # Just progress existing ones
            await self._progress_convoys(db)
            return

        # Need a unit with users
        result = await db.execute(select(Unit.id).limit(50))
        unit_ids = [row[0] for row in result.all()]
        if not unit_ids:
            return

        unit_id = self._rng.choice(unit_ids)
        route = self._rng.choice(CONVOY_ROUTES)

        self._convoy_counter += 1
        now = datetime.now(timezone.utc)
        convoy_id = f"CVY-{now.strftime('%Y%m%d')}-{self._convoy_counter:04d}"

        departure = now + timedelta(hours=self._rng.randint(1, 12))
        eta = departure + timedelta(hours=self._rng.randint(2, 8))

        cargo_descriptions = [
            "Class I rations resupply — 3-day sustainment for battery",
            "Class III bulk fuel — JP-8 and diesel",
            "Class V ammunition resupply — 155mm HE and WP",
            "Class IX repair parts for battalion maintenance",
            "Mixed cargo — barrier material, sandbags, concertina wire",
            "Personnel movement — battery rotation",
            "Equipment transport — deadlined vehicles to intermediate maintenance",
        ]

        movement = Movement(
            unit_id=unit_id,
            convoy_id=convoy_id,
            origin=route["origin"],
            destination=route["destination"],
            departure_time=departure,
            eta=eta,
            vehicle_count=self._rng.randint(3, 15),
            cargo_description=self._rng.choice(cargo_descriptions),
            origin_lat=route["origin_lat"],
            origin_lon=route["origin_lon"],
            dest_lat=route["dest_lat"],
            dest_lon=route["dest_lon"],
            status=MovementStatus.PLANNED,
            source="living_sim",
        )
        db.add(movement)
        await db.flush()

        await self._log_activity(
            db,
            ActivityType.CONVOY,
            "created",
            f"Convoy {convoy_id} planned: {route['origin']} -> {route['destination']} "
            f"({movement.vehicle_count} vehicles)",
            unit_id=unit_id,
            entity_type="movement",
            entity_id=movement.id,
            details={
                "convoy_id": convoy_id,
                "origin": route["origin"],
                "destination": route["destination"],
                "vehicle_count": movement.vehicle_count,
                "departure": departure.isoformat(),
                "eta": eta.isoformat(),
            },
        )
        logger.debug("Created convoy %s", convoy_id)

        await self._progress_convoys(db)

    async def _progress_convoys(self, db: AsyncSession) -> None:
        """Progress existing planned/en-route convoys."""
        now = datetime.now(timezone.utc)

        # Move PLANNED -> EN_ROUTE if departure time has passed
        result = await db.execute(
            select(Movement)
            .where(Movement.status == MovementStatus.PLANNED)
            .where(Movement.departure_time.isnot(None))
            .limit(20)
        )
        for movement in result.scalars().all():
            if movement.departure_time and movement.departure_time <= now:
                movement.status = MovementStatus.EN_ROUTE
                # Set current position to origin
                movement.current_lat = movement.origin_lat
                movement.current_lon = movement.origin_lon
                movement.speed_kph = round(self._rng.uniform(30, 65), 1)

                await self._log_activity(
                    db,
                    ActivityType.CONVOY,
                    "departed",
                    f"Convoy {movement.convoy_id} departed {movement.origin}",
                    unit_id=movement.unit_id,
                    entity_type="movement",
                    entity_id=movement.id,
                )

        # Progress EN_ROUTE convoys — update position, possibly complete or delay
        result = await db.execute(
            select(Movement).where(Movement.status == MovementStatus.EN_ROUTE).limit(20)
        )
        for movement in result.scalars().all():
            roll = self._rng.random()
            if roll < 0.05:
                # Random delay
                movement.status = MovementStatus.DELAYED
                if movement.eta:
                    movement.eta = movement.eta + timedelta(
                        hours=self._rng.randint(1, 4)
                    )
                await self._log_activity(
                    db,
                    ActivityType.CONVOY,
                    "delayed",
                    f"Convoy {movement.convoy_id} delayed en route to "
                    f"{movement.destination}",
                    unit_id=movement.unit_id,
                    entity_type="movement",
                    entity_id=movement.id,
                )
            elif movement.eta and now >= movement.eta:
                # Arrived
                movement.status = MovementStatus.COMPLETE
                movement.actual_arrival = now
                movement.current_lat = movement.dest_lat
                movement.current_lon = movement.dest_lon
                movement.speed_kph = 0

                await self._log_activity(
                    db,
                    ActivityType.CONVOY,
                    "arrived",
                    f"Convoy {movement.convoy_id} arrived at {movement.destination}",
                    unit_id=movement.unit_id,
                    entity_type="movement",
                    entity_id=movement.id,
                )
            else:
                # Update position — interpolate between origin and dest
                if (
                    movement.origin_lat
                    and movement.dest_lat
                    and movement.departure_time
                    and movement.eta
                ):
                    total_secs = (
                        movement.eta - movement.departure_time
                    ).total_seconds()
                    elapsed_secs = (now - movement.departure_time).total_seconds()
                    progress = min(elapsed_secs / max(total_secs, 1), 1.0)

                    movement.current_lat = (
                        movement.origin_lat
                        + (movement.dest_lat - movement.origin_lat) * progress
                    )
                    movement.current_lon = (movement.origin_lon or 0) + (
                        (movement.dest_lon or 0) - (movement.origin_lon or 0)
                    ) * progress
                    movement.speed_kph = round(self._rng.uniform(30, 65), 1)

        # Resume delayed convoys
        result = await db.execute(
            select(Movement).where(Movement.status == MovementStatus.DELAYED).limit(10)
        )
        for movement in result.scalars().all():
            if self._rng.random() < 0.3:
                movement.status = MovementStatus.EN_ROUTE
                await self._log_activity(
                    db,
                    ActivityType.CONVOY,
                    "resumed",
                    f"Convoy {movement.convoy_id} resumed movement toward "
                    f"{movement.destination}",
                    unit_id=movement.unit_id,
                    entity_type="movement",
                    entity_id=movement.id,
                )

    # ------------------------------------------------------------------
    # Generator 4: Supply Updates
    # ------------------------------------------------------------------

    async def _supply_update_generator(self) -> None:
        """Decrement supply levels based on consumption rates."""
        await self._safe_loop(
            "supply_update",
            self.config.supply_update_interval,
            self._update_supplies,
        )

    async def _update_supplies(self, db: AsyncSession) -> None:
        consumption_mult = self.config.multipliers.get("supply_consumption", 1.0)

        result = await db.execute(
            select(SupplyStatusRecord)
            .where(SupplyStatusRecord.on_hand_qty > 0)
            .limit(30)
        )
        records = list(result.scalars().all())

        for record in records:
            if self._rng.random() > 0.3:
                continue

            # Consume based on rate * scenario multiplier
            base_consumption = record.consumption_rate * consumption_mult
            consumed = round(base_consumption * self._rng.uniform(0.5, 1.5), 2)
            record.on_hand_qty = max(0, record.on_hand_qty - consumed)

            # Recalculate DOS
            if record.consumption_rate > 0:
                record.dos = round(record.on_hand_qty / record.consumption_rate, 1)

            # Update status based on DOS
            if record.dos < 3:
                record.status = SupplyStatus.RED
            elif record.dos < 7:
                record.status = SupplyStatus.AMBER
            else:
                record.status = SupplyStatus.GREEN

            # Log significant changes
            if record.status == SupplyStatus.RED:
                await self._log_activity(
                    db,
                    ActivityType.SUPPLY,
                    "critical",
                    f"Supply {record.item_description} at {record.dos:.1f} DOS "
                    f"(Class {record.supply_class.value})",
                    unit_id=record.unit_id,
                    entity_type="supply",
                    entity_id=record.id,
                    details={
                        "item": record.item_description,
                        "supply_class": record.supply_class.value,
                        "dos": record.dos,
                        "on_hand": record.on_hand_qty,
                    },
                )

    # ------------------------------------------------------------------
    # Generator 5: Alerts
    # ------------------------------------------------------------------

    async def _alert_generator(self) -> None:
        """Check thresholds and generate alerts."""
        await self._safe_loop(
            "alert",
            self.config.alert_interval,
            self._check_and_create_alerts,
        )

    async def _check_and_create_alerts(self, db: AsyncSession) -> None:
        alert_rate = self.config.multipliers.get("alert_rate", 1.0)

        # Check for low supply DOS
        result = await db.execute(
            select(SupplyStatusRecord)
            .where(SupplyStatusRecord.dos < 3)
            .where(SupplyStatusRecord.on_hand_qty > 0)
            .limit(10)
        )
        low_supply = list(result.scalars().all())

        for record in low_supply:
            if self._rng.random() > 0.3 * alert_rate:
                continue

            # Check if we already have a recent unresolved alert for this
            existing = await db.execute(
                select(sa_func.count(Alert.id))
                .where(Alert.entity_type == "SUPPLY")
                .where(Alert.entity_id == record.id)
                .where(Alert.resolved == False)  # noqa: E712
            )
            if (existing.scalar() or 0) > 0:
                continue

            severity = (
                AlertSeverity.CRITICAL if record.dos < 1 else AlertSeverity.WARNING
            )
            alert = Alert(
                unit_id=record.unit_id,
                alert_type=AlertType.LOW_DOS,
                severity=severity,
                message=(
                    f"Low supply: {record.item_description} at {record.dos:.1f} "
                    f"DOS (Class {record.supply_class.value})"
                ),
                threshold_value=3.0,
                actual_value=record.dos,
                entity_type="SUPPLY",
                entity_id=record.id,
                auto_generated=True,
            )
            db.add(alert)

            await self._log_activity(
                db,
                ActivityType.ALERT,
                "triggered",
                f"{severity.value} alert: {record.item_description} "
                f"at {record.dos:.1f} DOS",
                unit_id=record.unit_id,
                entity_type="alert",
                details={
                    "alert_type": "LOW_DOS",
                    "severity": severity.value,
                    "item": record.item_description,
                    "dos": record.dos,
                },
            )

        # Check for deadlined equipment
        result = await db.execute(
            select(Equipment)
            .where(
                Equipment.status.in_(
                    [EquipmentAssetStatus.NMC_M, EquipmentAssetStatus.NMC_S]
                )
            )
            .limit(10)
        )
        nmc_equipment = list(result.scalars().all())

        for equip in nmc_equipment:
            if self._rng.random() > 0.2 * alert_rate:
                continue

            existing = await db.execute(
                select(sa_func.count(Alert.id))
                .where(Alert.entity_type == "EQUIPMENT")
                .where(Alert.entity_id == equip.id)
                .where(Alert.resolved == False)  # noqa: E712
            )
            if (existing.scalar() or 0) > 0:
                continue

            alert = Alert(
                unit_id=equip.unit_id,
                alert_type=AlertType.EQUIPMENT_DEADLINED,
                severity=AlertSeverity.WARNING,
                message=(
                    f"Equipment {equip.nomenclature} ({equip.bumper_number}) "
                    f"is {equip.status.value}"
                ),
                entity_type="EQUIPMENT",
                entity_id=equip.id,
                auto_generated=True,
            )
            db.add(alert)

            await self._log_activity(
                db,
                ActivityType.ALERT,
                "triggered",
                f"Equipment alert: {equip.nomenclature} ({equip.bumper_number}) "
                f"status {equip.status.value}",
                unit_id=equip.unit_id,
                entity_type="alert",
            )

        # Check for delayed convoys
        result = await db.execute(
            select(Movement).where(Movement.status == MovementStatus.DELAYED).limit(5)
        )
        for movement in result.scalars().all():
            if self._rng.random() > 0.4 * alert_rate:
                continue

            existing = await db.execute(
                select(sa_func.count(Alert.id))
                .where(Alert.entity_type == "MOVEMENT")
                .where(Alert.entity_id == movement.id)
                .where(Alert.resolved == False)  # noqa: E712
            )
            if (existing.scalar() or 0) > 0:
                continue

            alert = Alert(
                unit_id=movement.unit_id,
                alert_type=AlertType.CONVOY_DELAYED,
                severity=AlertSeverity.WARNING,
                message=(
                    f"Convoy {movement.convoy_id} delayed en route "
                    f"{movement.origin} -> {movement.destination}"
                ),
                entity_type="MOVEMENT",
                entity_id=movement.id,
                auto_generated=True,
            )
            db.add(alert)

            await self._log_activity(
                db,
                ActivityType.ALERT,
                "triggered",
                f"Convoy delay alert: {movement.convoy_id}",
                unit_id=movement.unit_id,
                entity_type="alert",
            )

    # ------------------------------------------------------------------
    # Generator 6: Personnel Activity
    # ------------------------------------------------------------------

    async def _personnel_activity_generator(self) -> None:
        """Generate random personnel status changes."""
        await self._safe_loop(
            "personnel",
            self.config.personnel_interval,
            self._update_personnel,
        )

    async def _update_personnel(self, db: AsyncSession) -> None:
        # Get some active personnel
        result = await db.execute(
            select(Personnel)
            .where(Personnel.status == PersonnelStatus.ACTIVE)
            .limit(50)
        )
        active_personnel = list(result.scalars().all())

        # Randomly change a few to TDY, LEAVE, or MEDICAL
        for person in active_personnel:
            if self._rng.random() > 0.03:
                continue

            new_status = self._rng.choice(
                [PersonnelStatus.TDY, PersonnelStatus.LEAVE, PersonnelStatus.MEDICAL]
            )
            old_status = person.status
            person.status = new_status

            status_reasons = {
                PersonnelStatus.TDY: [
                    "Temporary duty at School of Infantry",
                    "TDY to MCCES for MOS school",
                    "Liaison duty at Regimental headquarters",
                    "Range coach duty at Edson Range",
                ],
                PersonnelStatus.LEAVE: [
                    "Annual leave — 10 days",
                    "Emergency leave — family emergency",
                    "Terminal leave pending EAS",
                    "Post-deployment leave — 14 days",
                ],
                PersonnelStatus.MEDICAL: [
                    "Referred to Naval Hospital for evaluation",
                    "LIMDU processing — knee injury",
                    "Dental class 4 — emergency extraction",
                    "Physical therapy for training injury",
                ],
            }

            reason = self._rng.choice(status_reasons.get(new_status, ["Status change"]))

            await self._log_activity(
                db,
                ActivityType.PERSONNEL,
                "status_change",
                f"{person.rank} {person.last_name}, {person.first_name} "
                f"({person.mos}): {old_status.value} -> {new_status.value} — {reason}",
                unit_id=person.unit_id,
                entity_type="personnel",
                entity_id=person.id,
                details={
                    "edipi": person.edipi,
                    "from_status": old_status.value,
                    "to_status": new_status.value,
                    "reason": reason,
                },
            )

        # Return some TDY/LEAVE/MEDICAL personnel to ACTIVE
        result = await db.execute(
            select(Personnel)
            .where(
                Personnel.status.in_(
                    [
                        PersonnelStatus.TDY,
                        PersonnelStatus.LEAVE,
                        PersonnelStatus.MEDICAL,
                    ]
                )
            )
            .limit(30)
        )
        away_personnel = list(result.scalars().all())

        for person in away_personnel:
            if self._rng.random() > 0.1:
                continue

            old_status = person.status
            person.status = PersonnelStatus.ACTIVE

            await self._log_activity(
                db,
                ActivityType.PERSONNEL,
                "returned",
                f"{person.rank} {person.last_name}, {person.first_name} "
                f"returned to duty from {old_status.value}",
                unit_id=person.unit_id,
                entity_type="personnel",
                entity_id=person.id,
                details={
                    "edipi": person.edipi,
                    "from_status": old_status.value,
                    "to_status": "ACTIVE",
                },
            )

    # ------------------------------------------------------------------
    # Generator 7: Reports
    # ------------------------------------------------------------------

    async def _report_generator(self) -> None:
        """Auto-generate LOGSTAT and PERSTAT reports."""
        await self._safe_loop(
            "report",
            self.config.report_interval,
            self._create_report,
        )

    async def _create_report(self, db: AsyncSession) -> None:
        # Get a unit with users
        demo_users = await self._get_demo_users(db)
        if not demo_users:
            return

        user = self._rng.choice(demo_users)
        if not user.unit_id:
            return

        report_type = self._rng.choice([ReportType.LOGSTAT, ReportType.PERSTAT])
        now = datetime.now(timezone.utc)

        if report_type == ReportType.LOGSTAT:
            title = f"LOGSTAT — {now.strftime('%d%b%Y').upper()} — 1/11"
            content = await self._generate_logstat_content(db, user.unit_id, now)
        else:
            title = f"PERSTAT — {now.strftime('%d%b%Y').upper()} — 1/11"
            content = await self._generate_perstat_content(db, user.unit_id, now)

        report = Report(
            unit_id=user.unit_id,
            report_type=report_type,
            title=title,
            content=content,
            status=ReportStatus.DRAFT,
            generated_by=user.id,
            period_start=now - timedelta(hours=24),
            period_end=now,
            auto_generated=True,
        )
        db.add(report)
        await db.flush()

        await self._log_activity(
            db,
            ActivityType.REPORT,
            "generated",
            f"Auto-generated {report_type.value}: {title}",
            unit_id=user.unit_id,
            user_id=user.id,
            entity_type="report",
            entity_id=report.id,
            details={
                "report_type": report_type.value,
                "title": title,
            },
        )
        logger.debug("Generated %s report", report_type.value)

    async def _generate_logstat_content(
        self, db: AsyncSession, unit_id: int, now: datetime
    ) -> str:
        """Generate realistic LOGSTAT content from current DB state."""
        lines = [
            f"LOGSTAT AS OF {now.strftime('%d%H%MZ%b%Y').upper()}",
            "=" * 50,
            "",
            "1. SUPPLY STATUS:",
        ]

        result = await db.execute(
            select(SupplyStatusRecord).where(SupplyStatusRecord.unit_id == unit_id)
        )
        supplies = result.scalars().all()

        for cls in SupplyClass:
            cls_items = [s for s in supplies if s.supply_class == cls]
            if cls_items:
                avg_dos = sum(s.dos for s in cls_items) / len(cls_items)
                status = "RED" if avg_dos < 3 else ("AMBER" if avg_dos < 7 else "GREEN")
                lines.append(f"  CLASS {cls.value}: {status} ({avg_dos:.1f} DOS avg)")

        lines.extend(["", "2. EQUIPMENT STATUS:"])
        result = await db.execute(
            select(
                sa_func.count(Equipment.id).label("total"),
                Equipment.status,
            )
            .where(Equipment.unit_id == unit_id)
            .group_by(Equipment.status)
        )
        for row in result.all():
            lines.append(f"  {row[1].value}: {row[0]}")

        lines.extend(["", "3. MAINTENANCE STATUS:"])
        result = await db.execute(
            select(
                sa_func.count(MaintenanceWorkOrder.id).label("count"),
                MaintenanceWorkOrder.status,
            )
            .where(MaintenanceWorkOrder.unit_id == unit_id)
            .group_by(MaintenanceWorkOrder.status)
        )
        for row in result.all():
            lines.append(f"  {row[1].value}: {row[0]}")

        lines.extend(["", "4. TRANSPORTATION:"])
        result = await db.execute(
            select(sa_func.count(Movement.id))
            .where(Movement.unit_id == unit_id)
            .where(Movement.status == MovementStatus.EN_ROUTE)
        )
        en_route = result.scalar() or 0
        lines.append(f"  CONVOYS EN ROUTE: {en_route}")

        lines.extend(["", "5. REMARKS: NONE", "", "// END LOGSTAT //"])

        return "\n".join(lines)

    async def _generate_perstat_content(
        self, db: AsyncSession, unit_id: int, now: datetime
    ) -> str:
        """Generate realistic PERSTAT content."""
        lines = [
            f"PERSTAT AS OF {now.strftime('%d%H%MZ%b%Y').upper()}",
            "=" * 50,
            "",
            "1. PERSONNEL STRENGTH:",
        ]

        result = await db.execute(
            select(
                sa_func.count(Personnel.id).label("count"),
                Personnel.status,
            )
            .where(Personnel.unit_id == unit_id)
            .group_by(Personnel.status)
        )
        total = 0
        present = 0
        for row in result.all():
            cnt: int = row[0]
            stat = row[1]
            lines.append(f"  {stat.value}: {cnt}")
            total += cnt
            if stat == PersonnelStatus.ACTIVE:
                present = cnt

        lines.extend(
            [
                "",
                f"  TOTAL ASSIGNED: {total}",
                f"  PRESENT FOR DUTY: {present}",
                f"  FILL RATE: {(present / max(total, 1)) * 100:.1f}%",
                "",
                "2. GAINS/LOSSES: NONE THIS PERIOD",
                "",
                "3. REMARKS: NONE",
                "",
                "// END PERSTAT //",
            ]
        )

        return "\n".join(lines)


# ---------------------------------------------------------------------------
# Module-level singleton
# ---------------------------------------------------------------------------

_engine: Optional[LivingSimulationEngine] = None


def get_living_sim_engine() -> Optional[LivingSimulationEngine]:
    """Return the module-level engine instance (may be None)."""
    return _engine


def set_living_sim_engine(engine: LivingSimulationEngine) -> None:
    """Set the module-level engine instance."""
    global _engine
    _engine = engine
