"""Seed realistic maintenance work orders, parts, and labor entries."""

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.maintenance import (
    EchelonOfMaintenance,
    LaborType,
    MaintenanceLabor,
    MaintenanceLevel,
    MaintenancePart,
    MaintenanceWorkOrder,
    PartSource,
    PartStatus,
    WorkOrderCategory,
    WorkOrderStatus,
)

logger = logging.getLogger(__name__)


async def seed_maintenance(db: AsyncSession) -> int:
    """Seed maintenance work orders, parts, and labor. Returns count inserted.

    Idempotent — skips if any work orders already exist.
    """
    existing = await db.execute(select(func.count(MaintenanceWorkOrder.id)))
    if existing.scalar() > 0:
        return 0

    now = datetime.now(timezone.utc)

    # fmt: off
    work_orders = [
        MaintenanceWorkOrder(
            unit_id=4,
            work_order_number="WO-2026-0101",
            description="Replace engine oil and filter — scheduled PMCS",
            category=WorkOrderCategory.PREVENTIVE,
            priority=3,
            status=WorkOrderStatus.COMPLETE,
            assigned_to="Cpl Martinez",
            location="Bay 1",
            created_at=now - timedelta(days=25),
            completed_at=now - timedelta(days=20),
            estimated_completion=now - timedelta(days=25) + timedelta(days=7),
            actual_hours=4.5,
            echelon_of_maintenance=EchelonOfMaintenance.FIRST,
            maintenance_level=MaintenanceLevel.ORGANIZATIONAL,
        ),
        MaintenanceWorkOrder(
            unit_id=4,
            work_order_number="WO-2026-0102",
            description="Diagnose intermittent radio comms failure on PRC-152",
            category=WorkOrderCategory.CORRECTIVE,
            priority=2,
            status=WorkOrderStatus.IN_PROGRESS,
            assigned_to="Sgt Chen",
            location="Comms Tent",
            created_at=now - timedelta(days=12),
            estimated_completion=now - timedelta(days=12) + timedelta(days=10),
            echelon_of_maintenance=EchelonOfMaintenance.SECOND,
            maintenance_level=MaintenanceLevel.INTERMEDIATE,
        ),
        MaintenanceWorkOrder(
            unit_id=4,
            work_order_number="WO-2026-0103",
            description="Front axle CV joint replacement",
            category=WorkOrderCategory.CORRECTIVE,
            priority=1,
            status=WorkOrderStatus.AWAITING_PARTS,
            assigned_to="LCpl Rivera",
            location="Bay 3",
            created_at=now - timedelta(days=18),
            estimated_completion=now - timedelta(days=18) + timedelta(days=14),
            deadline_date=now - timedelta(days=10),
            nmcm_since=now - timedelta(days=18),
            echelon_of_maintenance=EchelonOfMaintenance.SECOND,
            maintenance_level=MaintenanceLevel.ORGANIZATIONAL,
        ),
        MaintenanceWorkOrder(
            unit_id=4,
            work_order_number="WO-2026-0104",
            description="Annual safety inspection — hydraulic brake system",
            category=WorkOrderCategory.INSPECTION,
            priority=3,
            status=WorkOrderStatus.COMPLETE,
            assigned_to="SSgt Williams",
            location="Inspection Bay",
            created_at=now - timedelta(days=30),
            completed_at=now - timedelta(days=22),
            estimated_completion=now - timedelta(days=30) + timedelta(days=10),
            actual_hours=6.0,
            echelon_of_maintenance=EchelonOfMaintenance.FIRST,
            maintenance_level=MaintenanceLevel.ORGANIZATIONAL,
        ),
        MaintenanceWorkOrder(
            unit_id=4,
            work_order_number="WO-2026-0105",
            description="Tire rotation and balance — all four corners",
            category=WorkOrderCategory.PREVENTIVE,
            priority=3,
            status=WorkOrderStatus.OPEN,
            assigned_to="PFC Johnson",
            location="Motor Pool",
            created_at=now - timedelta(days=3),
            estimated_completion=now - timedelta(days=3) + timedelta(days=5),
            echelon_of_maintenance=EchelonOfMaintenance.FIRST,
            maintenance_level=MaintenanceLevel.ORGANIZATIONAL,
        ),
        MaintenanceWorkOrder(
            unit_id=4,
            work_order_number="WO-2026-0106",
            description="Replace starter motor assembly",
            category=WorkOrderCategory.CORRECTIVE,
            priority=2,
            status=WorkOrderStatus.IN_PROGRESS,
            assigned_to="Cpl Martinez",
            location="Bay 2",
            created_at=now - timedelta(days=8),
            estimated_completion=now - timedelta(days=8) + timedelta(days=6),
            echelon_of_maintenance=EchelonOfMaintenance.FIRST,
            maintenance_level=MaintenanceLevel.ORGANIZATIONAL,
        ),
        MaintenanceWorkOrder(
            unit_id=4,
            work_order_number="WO-2026-0107",
            description="Windshield ballistic glass replacement",
            category=WorkOrderCategory.CORRECTIVE,
            priority=2,
            status=WorkOrderStatus.AWAITING_PARTS,
            assigned_to="LCpl Rivera",
            location="Bay 1",
            created_at=now - timedelta(days=14),
            estimated_completion=now - timedelta(days=14) + timedelta(days=12),
            nmcs_since=now - timedelta(days=14),
            echelon_of_maintenance=EchelonOfMaintenance.SECOND,
            maintenance_level=MaintenanceLevel.INTERMEDIATE,
        ),
        MaintenanceWorkOrder(
            unit_id=4,
            work_order_number="WO-2026-0108",
            description="Generator 10kW — fuel injector cleaning and calibration",
            category=WorkOrderCategory.PREVENTIVE,
            priority=3,
            status=WorkOrderStatus.COMPLETE,
            assigned_to="Sgt Chen",
            location="Generator Shed",
            created_at=now - timedelta(days=20),
            completed_at=now - timedelta(days=15),
            estimated_completion=now - timedelta(days=20) + timedelta(days=8),
            actual_hours=3.0,
            echelon_of_maintenance=EchelonOfMaintenance.FIRST,
            maintenance_level=MaintenanceLevel.ORGANIZATIONAL,
        ),
        MaintenanceWorkOrder(
            unit_id=4,
            work_order_number="WO-2026-0109",
            description="Transmission fluid flush and filter replacement",
            category=WorkOrderCategory.PREVENTIVE,
            priority=3,
            status=WorkOrderStatus.OPEN,
            assigned_to="PFC Johnson",
            location="Bay 3",
            created_at=now - timedelta(days=2),
            estimated_completion=now - timedelta(days=2) + timedelta(days=4),
            echelon_of_maintenance=EchelonOfMaintenance.FIRST,
            maintenance_level=MaintenanceLevel.ORGANIZATIONAL,
        ),
        MaintenanceWorkOrder(
            unit_id=4,
            work_order_number="WO-2026-0110",
            description="CROWS II turret traverse motor repair",
            category=WorkOrderCategory.CORRECTIVE,
            priority=1,
            status=WorkOrderStatus.IN_PROGRESS,
            assigned_to="SSgt Williams",
            location="Weapons Bay",
            created_at=now - timedelta(days=5),
            estimated_completion=now - timedelta(days=5) + timedelta(days=9),
            echelon_of_maintenance=EchelonOfMaintenance.THIRD,
            maintenance_level=MaintenanceLevel.INTERMEDIATE,
        ),
    ]
    # fmt: on

    for wo in work_orders:
        db.add(wo)
    await db.flush()

    # Build a lookup by work order number for parts and labor references
    wo_map = {wo.work_order_number: wo for wo in work_orders}

    # --- Parts -----------------------------------------------------------
    parts = [
        # WO-2026-0103 (CV joint)
        MaintenancePart(
            work_order_id=wo_map["WO-2026-0103"].id,
            nsn="2520-01-547-2450",
            part_number="12460181",
            nomenclature="CV Joint Assembly",
            quantity=2,
            unit_cost=385.50,
            source=PartSource.ON_ORDER,
            status=PartStatus.ON_ORDER,
        ),
        MaintenancePart(
            work_order_id=wo_map["WO-2026-0103"].id,
            nsn="5330-01-234-5678",
            part_number="12340099",
            nomenclature="Axle Seal Kit",
            quantity=1,
            unit_cost=45.00,
            source=PartSource.ON_HAND,
            status=PartStatus.RECEIVED,
        ),
        # WO-2026-0106 (starter)
        MaintenancePart(
            work_order_id=wo_map["WO-2026-0106"].id,
            nsn="2920-01-432-1234",
            part_number="M939-STR-01",
            nomenclature="Starter Motor Assembly",
            quantity=1,
            unit_cost=520.00,
            source=PartSource.ON_HAND,
            status=PartStatus.INSTALLED,
        ),
        # WO-2026-0107 (windshield)
        MaintenancePart(
            work_order_id=wo_map["WO-2026-0107"].id,
            nsn="2510-01-567-8901",
            part_number="BG-WS-M1151",
            nomenclature="Ballistic Glass Windshield",
            quantity=1,
            unit_cost=1250.00,
            source=PartSource.ON_ORDER,
            status=PartStatus.ON_ORDER,
        ),
        # WO-2026-0108 (generator)
        MaintenancePart(
            work_order_id=wo_map["WO-2026-0108"].id,
            nsn="2910-01-345-6789",
            part_number="FI-CLN-KIT",
            nomenclature="Fuel Injector Cleaning Kit",
            quantity=1,
            unit_cost=89.99,
            source=PartSource.ON_HAND,
            status=PartStatus.INSTALLED,
        ),
    ]

    for part in parts:
        db.add(part)

    # --- Labor entries ---------------------------------------------------
    labor_entries = [
        # WO-2026-0101 (COMPLETE — oil change)
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0101"].id,
            personnel_id=1,
            labor_type=LaborType.INSPECT,
            hours=1.0,
            date=(now - timedelta(days=25)).date(),
            notes="Initial PMCS inspection",
        ),
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0101"].id,
            personnel_id=1,
            labor_type=LaborType.REPLACE,
            hours=2.5,
            date=(now - timedelta(days=24)).date(),
            notes="Drained and replaced engine oil, replaced filter",
        ),
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0101"].id,
            personnel_id=1,
            labor_type=LaborType.TEST,
            hours=1.0,
            date=(now - timedelta(days=24)).date(),
            notes="Post-service operational test",
        ),
        # WO-2026-0102 (IN_PROGRESS — radio)
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0102"].id,
            personnel_id=1,
            labor_type=LaborType.DIAGNOSE,
            hours=3.0,
            date=(now - timedelta(days=11)).date(),
            notes="Tested PRC-152 frequency hopping, identified intermittent antenna connector",
        ),
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0102"].id,
            personnel_id=1,
            labor_type=LaborType.REPAIR,
            hours=2.0,
            date=(now - timedelta(days=10)).date(),
            notes="Replaced antenna cable, re-soldered connector",
        ),
        # WO-2026-0104 (COMPLETE — brake inspection)
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0104"].id,
            personnel_id=1,
            labor_type=LaborType.INSPECT,
            hours=4.0,
            date=(now - timedelta(days=28)).date(),
            notes="Complete brake system inspection per TM",
        ),
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0104"].id,
            personnel_id=1,
            labor_type=LaborType.TEST,
            hours=2.0,
            date=(now - timedelta(days=27)).date(),
            notes="Brake performance test — all within spec",
        ),
        # WO-2026-0106 (IN_PROGRESS — starter)
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0106"].id,
            personnel_id=1,
            labor_type=LaborType.DIAGNOSE,
            hours=1.5,
            date=(now - timedelta(days=7)).date(),
            notes="Confirmed starter motor failure, no crank",
        ),
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0106"].id,
            personnel_id=1,
            labor_type=LaborType.REPLACE,
            hours=3.0,
            date=(now - timedelta(days=6)).date(),
            notes="Removed old starter, installed new assembly",
        ),
        # WO-2026-0108 (COMPLETE — generator injectors)
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0108"].id,
            personnel_id=1,
            labor_type=LaborType.INSPECT,
            hours=1.0,
            date=(now - timedelta(days=19)).date(),
            notes="Fuel system inspection, injectors fouled",
        ),
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0108"].id,
            personnel_id=1,
            labor_type=LaborType.REPAIR,
            hours=2.0,
            date=(now - timedelta(days=18)).date(),
            notes="Cleaned and calibrated all 4 injectors",
        ),
        # WO-2026-0110 (IN_PROGRESS — CROWS turret)
        MaintenanceLabor(
            work_order_id=wo_map["WO-2026-0110"].id,
            personnel_id=1,
            labor_type=LaborType.DIAGNOSE,
            hours=2.5,
            date=(now - timedelta(days=4)).date(),
            notes="Identified faulty traverse motor bearings",
        ),
    ]

    for entry in labor_entries:
        db.add(entry)

    await db.flush()

    logger.info(
        f"Maintenance seeded: {len(work_orders)} work orders, "
        f"{len(parts)} parts, {len(labor_entries)} labor entries."
    )
    return len(work_orders)
