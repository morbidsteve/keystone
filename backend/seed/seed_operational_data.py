"""Seed operational data for all empty tables in KEYSTONE.

Populates: equipment, sensitive_items, fuel_storage_points, fuel_transactions,
fuel_consumption_rates, unit_readiness_snapshots, unit_strengths, supply_points,
routes, medical_treatment_facilities, manning_snapshots, inventory_records,
convoy_plans, and updates units with lat/lng positions.

Idempotent — checks row counts before inserting.
"""

import asyncio
import json
import logging
import os
import random
import sys
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import func, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.unit import Unit
from app.models.equipment import Equipment, EquipmentAssetStatus
from app.models.custody import SensitiveItem, SensitiveItemType, SecurityClassification, ItemConditionCode, SensitiveItemStatus
from app.models.fuel import (
    FuelStoragePoint, FuelFacilityType, FuelType, FuelStorageStatus,
    FuelTransaction, FuelTransactionType,
    FuelConsumptionRate, ConsumptionSource,
)
from app.models.readiness_snapshot import UnitReadinessSnapshot
from app.models.unit_strength import UnitStrength
from app.models.location import SupplyPoint, SupplyPointType, SupplyPointStatus, Route, RouteType, RouteStatus
from app.models.medical import MedicalTreatmentFacility, MedicalTreatmentFacilityType, MTFStatus
from app.models.manning import ManningSnapshot
from app.models.inventory import InventoryRecord
from app.models.convoy_planning import ConvoyPlan, ConvoyPlanStatus, RiskAssessmentLevel

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")

NOW = datetime.now(timezone.utc)
random.seed(42)  # reproducible


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _table_count(db: AsyncSession, model) -> int:
    result = await db.execute(select(func.count()).select_from(model))
    return result.scalar() or 0


async def _get_unit_ids(db: AsyncSession, echelons: list[str] | None = None, limit: int = 50) -> list[int]:
    q = select(Unit.id)
    if echelons:
        q = q.where(Unit.echelon.in_(echelons))
    q = q.limit(limit)
    result = await db.execute(q)
    return [r[0] for r in result.all()]


async def _get_unit_ids_by_abbr(db: AsyncSession, abbrs: list[str]) -> dict[str, int]:
    result = await db.execute(select(Unit.abbreviation, Unit.id).where(Unit.abbreviation.in_(abbrs)))
    return {r[0]: r[1] for r in result.all()}


async def _get_user_id(db: AsyncSession) -> int:
    result = await db.execute(text("SELECT id FROM users LIMIT 1"))
    row = result.first()
    return row[0] if row else 1


async def _get_personnel_ids(db: AsyncSession, limit: int = 38) -> list[int]:
    result = await db.execute(text(f"SELECT id FROM personnel LIMIT {limit}"))
    return [r[0] for r in result.all()]


async def _get_catalog_items(db: AsyncSession) -> list[dict]:
    result = await db.execute(text(
        "SELECT id, tamcn, nomenclature, common_name, category FROM equipment_catalog"
    ))
    return [{"id": r[0], "tamcn": r[1], "nomenclature": r[2], "common_name": r[3], "category": r[4]}
            for r in result.all()]


async def _get_sensitive_catalog(db: AsyncSession) -> list[dict]:
    result = await db.execute(text(
        "SELECT id, nomenclature, nsn, item_type, tamcn FROM sensitive_item_catalog"
    ))
    return [{"id": r[0], "nomenclature": r[1], "nsn": r[2], "item_type": r[3], "tamcn": r[4]}
            for r in result.all()]


async def _get_supply_catalog(db: AsyncSession) -> list[dict]:
    result = await db.execute(text(
        "SELECT id, nsn, nomenclature, unit_of_issue FROM supply_catalog LIMIT 50"
    ))
    return [{"id": r[0], "nsn": r[1], "nomenclature": r[2], "unit_of_issue": r[3]}
            for r in result.all()]


# ---------------------------------------------------------------------------
# 1. Equipment instances
# ---------------------------------------------------------------------------

async def seed_equipment(db: AsyncSession):
    if await _table_count(db, Equipment) > 0:
        logger.info("equipment already seeded, skipping")
        return

    catalog = await _get_catalog_items(db)
    if not catalog:
        logger.warning("No equipment_catalog found, skipping equipment seed")
        return

    # Get battalion and company-level units for assignment
    unit_ids = await _get_unit_ids(db, ["BN", "CO", "SQDN"], limit=80)
    if not unit_ids:
        unit_ids = await _get_unit_ids(db, limit=30)

    statuses = list(EquipmentAssetStatus)
    status_weights = [0.65, 0.12, 0.08, 0.05, 0.10]  # FMC heavy

    # Select a subset of catalog items to create instances for (vehicles, weapons systems)
    vehicle_categories = ["Tactical Vehicle", "Combat Vehicle", "Artillery", "Engineer Equipment"]
    vehicle_items = [c for c in catalog if c["category"] in vehicle_categories]
    other_items = [c for c in catalog if c["category"] not in vehicle_categories]

    records = []
    bumper_set = set()

    for item in vehicle_items[:30]:
        count = random.randint(4, 10)
        for i in range(count):
            uid = random.choice(unit_ids)
            tamcn = item["tamcn"]
            prefix = tamcn[-3:].upper()
            bumper = f"{prefix}-{uid:03d}-{i+1:02d}"
            while bumper in bumper_set:
                bumper = f"{prefix}-{uid:03d}-{i+1:02d}-{random.randint(10,99)}"
            bumper_set.add(bumper)

            serial = f"SN-{tamcn}-{random.randint(10000,99999)}"
            status = random.choices(statuses, weights=status_weights, k=1)[0]
            odo = random.randint(500, 85000) if "Vehicle" in (item["category"] or "") else None

            records.append(Equipment(
                unit_id=uid,
                equipment_type=item["category"] or "General",
                tamcn=tamcn,
                nomenclature=item["nomenclature"],
                bumper_number=bumper,
                serial_number=serial,
                usmc_id=f"USMC-{tamcn}-{i+1:04d}",
                status=status,
                odometer_miles=odo,
                notes=None,
            ))

    # Add some comm/optics/generators
    for item in other_items[:15]:
        count = random.randint(3, 6)
        for i in range(count):
            uid = random.choice(unit_ids)
            tamcn = item["tamcn"]
            prefix = tamcn[-3:].upper()
            bumper = f"{prefix}-{uid:03d}-{i+1:02d}"
            while bumper in bumper_set:
                bumper = f"{prefix}-{uid:03d}-{i+1:02d}-{random.randint(10,99)}"
            bumper_set.add(bumper)

            serial = f"SN-{tamcn}-{random.randint(10000,99999)}"
            status = random.choices(statuses, weights=status_weights, k=1)[0]

            records.append(Equipment(
                unit_id=uid,
                equipment_type=item["category"] or "General",
                tamcn=tamcn,
                nomenclature=item["nomenclature"],
                bumper_number=bumper,
                serial_number=serial,
                usmc_id=f"USMC-{tamcn}-{i+1:04d}",
                status=status,
                odometer_miles=None,
                notes=None,
            ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} equipment instances")


# ---------------------------------------------------------------------------
# 2. Sensitive items
# ---------------------------------------------------------------------------

async def seed_sensitive_items(db: AsyncSession):
    if await _table_count(db, SensitiveItem) > 0:
        logger.info("sensitive_items already seeded, skipping")
        return

    catalog = await _get_sensitive_catalog(db)
    if not catalog:
        logger.warning("No sensitive_item_catalog found, skipping")
        return

    unit_ids = await _get_unit_ids(db, ["BN", "CO"], limit=40)
    if not unit_ids:
        unit_ids = await _get_unit_ids(db, limit=20)

    personnel_ids = await _get_personnel_ids(db)
    user_id = await _get_user_id(db)

    type_map = {
        "WEAPON": SensitiveItemType.WEAPON,
        "OPTIC": SensitiveItemType.OPTIC,
        "NVG": SensitiveItemType.NVG,
        "CRYPTO": SensitiveItemType.CRYPTO,
        "RADIO": SensitiveItemType.RADIO,
        "COMSEC": SensitiveItemType.COMSEC,
        "EXPLOSIVE": SensitiveItemType.EXPLOSIVE,
        "MISSILE": SensitiveItemType.MISSILE,
    }

    classification_by_type = {
        "WEAPON": SecurityClassification.UNCLASSIFIED,
        "OPTIC": SecurityClassification.UNCLASSIFIED,
        "NVG": SecurityClassification.CUI,
        "CRYPTO": SecurityClassification.SECRET,
        "RADIO": SecurityClassification.CUI,
        "COMSEC": SecurityClassification.SECRET,
        "EXPLOSIVE": SecurityClassification.UNCLASSIFIED,
        "MISSILE": SecurityClassification.CONFIDENTIAL,
    }

    records = []
    serial_set = set()

    for cat_item in catalog:
        item_type_str = cat_item["item_type"]
        item_type = type_map.get(item_type_str, SensitiveItemType.OTHER)
        classification = classification_by_type.get(item_type_str, SecurityClassification.UNCLASSIFIED)

        # Weapons get more instances, others fewer
        if item_type_str == "WEAPON":
            count = random.randint(8, 20)
        elif item_type_str in ("OPTIC", "NVG"):
            count = random.randint(5, 12)
        elif item_type_str in ("RADIO",):
            count = random.randint(4, 8)
        else:
            count = random.randint(2, 5)

        for i in range(count):
            uid = random.choice(unit_ids)
            serial = f"W{random.randint(1000000, 9999999)}"
            while serial in serial_set:
                serial = f"W{random.randint(1000000, 9999999)}"
            serial_set.add(serial)

            holder_id = random.choice(personnel_ids) if personnel_ids and random.random() < 0.7 else None
            status = SensitiveItemStatus.ISSUED if holder_id else SensitiveItemStatus.ON_HAND

            # sensitive_items.nsn is varchar(15), catalog may have longer NSNs
            nsn_val = cat_item["nsn"]
            if nsn_val and len(nsn_val) > 15:
                nsn_val = nsn_val[:15]

            records.append(SensitiveItem(
                unit_id=uid,
                item_type=item_type,
                serial_number=serial,
                nomenclature=cat_item["nomenclature"],
                nsn=nsn_val,
                tamcn=cat_item["tamcn"],
                security_classification=classification,
                condition_code=random.choice([ItemConditionCode.A, ItemConditionCode.A, ItemConditionCode.B]),
                status=status,
                current_holder_id=holder_id,
                hand_receipt_number=f"HR-{uid}-{random.randint(1000,9999)}" if holder_id else None,
                created_by_user_id=user_id,
            ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} sensitive items")


# ---------------------------------------------------------------------------
# 3. Fuel storage points
# ---------------------------------------------------------------------------

async def seed_fuel_storage(db: AsyncSession):
    if await _table_count(db, FuelStoragePoint) > 0:
        logger.info("fuel_storage_points already seeded, skipping")
        return

    # Get MLG units for fuel points
    abbr_map = await _get_unit_ids_by_abbr(db, [
        "1st MLG", "CLR-1", "CLB-1", "CLB-5", "2nd MLG", "CLR-2",
        "3rd MLG", "CLR-3",
    ])
    mlg_ids = list(abbr_map.values())
    if not mlg_ids:
        mlg_ids = await _get_unit_ids(db, ["GRP", "BN"], limit=8)

    user_id = await _get_user_id(db)

    # Camp Pendleton / 29 Palms area fuel points
    storage_points = [
        {
            "name": "FARP EAGLE (Camp Pendleton Main)",
            "facility_type": FuelFacilityType.FARP,
            "fuel_type": FuelType.JP8,
            "capacity_gallons": 50000.0,
            "current_gallons": 38500.0,
            "latitude": 33.3050, "longitude": -117.3540,
            "location_description": "Camp Pendleton airfield FARP",
            "status": FuelStorageStatus.OPERATIONAL,
        },
        {
            "name": "BSA Fuel Point Alpha (Camp Pendleton South)",
            "facility_type": FuelFacilityType.BSA_FUEL_POINT,
            "fuel_type": FuelType.DF2,
            "capacity_gallons": 30000.0,
            "current_gallons": 22100.0,
            "latitude": 33.2284, "longitude": -117.3760,
            "location_description": "Camp Pendleton BSA south sector",
            "status": FuelStorageStatus.OPERATIONAL,
        },
        {
            "name": "Bladder Farm BRAVO (29 Palms)",
            "facility_type": FuelFacilityType.BLADDER_FARM,
            "fuel_type": FuelType.DF2,
            "capacity_gallons": 80000.0,
            "current_gallons": 61200.0,
            "latitude": 34.2367, "longitude": -116.0560,
            "location_description": "MCAGCC 29 Palms main training area",
            "status": FuelStorageStatus.OPERATIONAL,
        },
        {
            "name": "FSP CHARLIE (Camp Pendleton North)",
            "facility_type": FuelFacilityType.FSP,
            "fuel_type": FuelType.JP8,
            "capacity_gallons": 100000.0,
            "current_gallons": 73000.0,
            "latitude": 33.3500, "longitude": -117.4820,
            "location_description": "Camp Pendleton northern fuel storage",
            "status": FuelStorageStatus.OPERATIONAL,
        },
        {
            "name": "MOGAS Point DELTA (Camp Pendleton Motor-T)",
            "facility_type": FuelFacilityType.BSA_FUEL_POINT,
            "fuel_type": FuelType.MOGAS,
            "capacity_gallons": 10000.0,
            "current_gallons": 4200.0,
            "latitude": 33.2900, "longitude": -117.3200,
            "location_description": "Motor transport battalion fuel point",
            "status": FuelStorageStatus.DEGRADED,
        },
        {
            "name": "Mobile Refueler ECHO-1",
            "facility_type": FuelFacilityType.MOBILE_REFUELER,
            "fuel_type": FuelType.DF2,
            "capacity_gallons": 2500.0,
            "current_gallons": 1800.0,
            "latitude": 33.2710, "longitude": -117.3950,
            "location_description": "Field mobile refueler, currently at Range 210",
            "status": FuelStorageStatus.OPERATIONAL,
        },
        {
            "name": "Tank Farm FOXTROT (Camp Pendleton Main)",
            "facility_type": FuelFacilityType.TANK_FARM,
            "fuel_type": FuelType.JP8,
            "capacity_gallons": 250000.0,
            "current_gallons": 187500.0,
            "latitude": 33.3100, "longitude": -117.3680,
            "location_description": "Main installation tank farm",
            "status": FuelStorageStatus.OPERATIONAL,
        },
        {
            "name": "Distributed Cache GOLF (29 Palms South)",
            "facility_type": FuelFacilityType.DISTRIBUTED_CACHE,
            "fuel_type": FuelType.DF2,
            "capacity_gallons": 15000.0,
            "current_gallons": 9800.0,
            "latitude": 34.1850, "longitude": -116.1200,
            "location_description": "Pre-positioned fuel cache south training area",
            "status": FuelStorageStatus.OPERATIONAL,
        },
    ]

    records = []
    for i, sp in enumerate(storage_points):
        uid = mlg_ids[i % len(mlg_ids)]
        resupply_days_ago = random.randint(1, 14)
        next_resupply = NOW + timedelta(days=random.randint(3, 21))
        records.append(FuelStoragePoint(
            unit_id=uid,
            name=sp["name"],
            facility_type=sp["facility_type"],
            fuel_type=sp["fuel_type"],
            capacity_gallons=sp["capacity_gallons"],
            current_gallons=sp["current_gallons"],
            status=sp["status"],
            latitude=sp["latitude"],
            longitude=sp["longitude"],
            location_description=sp["location_description"],
            last_resupply_date=NOW - timedelta(days=resupply_days_ago),
            next_resupply_eta=next_resupply,
            updated_by_user_id=user_id,
        ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} fuel storage points")


# ---------------------------------------------------------------------------
# 4. Fuel transactions
# ---------------------------------------------------------------------------

async def seed_fuel_transactions(db: AsyncSession):
    if await _table_count(db, FuelTransaction) > 0:
        logger.info("fuel_transactions already seeded, skipping")
        return

    sp_result = await db.execute(select(FuelStoragePoint.id, FuelStoragePoint.fuel_type))
    storage_points = [(r[0], r[1]) for r in sp_result.all()]
    if not storage_points:
        logger.warning("No fuel storage points found, skipping transactions")
        return

    unit_ids = await _get_unit_ids(db, ["BN", "CO"], limit=30)
    user_id = await _get_user_id(db)

    vehicle_types = ["JLTV", "MTVR", "HMMWV", "LAV-25", "AAV", "M1A1", "LVSR", "AMK36"]
    records = []

    for _ in range(30):
        sp_id, fuel_type = random.choice(storage_points)
        tx_type = random.choices(
            [FuelTransactionType.ISSUE, FuelTransactionType.RECEIPT, FuelTransactionType.TRANSFER],
            weights=[0.6, 0.3, 0.1], k=1
        )[0]

        qty = round(random.uniform(50, 2000), 1)
        days_ago = random.randint(0, 30)
        veh = random.choice(vehicle_types)
        bumper = f"{veh[:3].upper()}-{random.randint(100,999)}"

        records.append(FuelTransaction(
            storage_point_id=sp_id,
            transaction_type=tx_type,
            fuel_type=fuel_type,
            quantity_gallons=qty,
            receiving_unit_id=random.choice(unit_ids) if unit_ids else None,
            vehicle_bumper_number=bumper,
            vehicle_type=veh,
            document_number=f"FT-{NOW.year}-{random.randint(10000,99999)}",
            performed_by_user_id=user_id,
            transaction_date=NOW - timedelta(days=days_ago, hours=random.randint(0, 23)),
        ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} fuel transactions")


# ---------------------------------------------------------------------------
# 5. Fuel consumption rates
# ---------------------------------------------------------------------------

async def seed_fuel_consumption_rates(db: AsyncSession):
    if await _table_count(db, FuelConsumptionRate) > 0:
        logger.info("fuel_consumption_rates already seeded, skipping")
        return

    # Get vehicle catalog items
    result = await db.execute(text(
        "SELECT id, common_name, category FROM equipment_catalog "
        "WHERE category IN ('Tactical Vehicle', 'Combat Vehicle', 'Artillery', 'Aviation')"
    ))
    items = [(r[0], r[1], r[2]) for r in result.all()]
    if not items:
        logger.warning("No vehicle catalog items found, skipping consumption rates")
        return

    user_id = await _get_user_id(db)
    records = []

    for item_id, name, category in items:
        if category == "Aviation":
            fuel_type = FuelType.JP8
            idle = round(random.uniform(40, 80), 1)
            tactical = round(random.uniform(100, 300), 1)
            per_mile = None
            per_flight_hr = round(random.uniform(150, 500), 1)
        elif category == "Combat Vehicle":
            fuel_type = FuelType.DF2
            idle = round(random.uniform(3, 8), 1)
            tactical = round(random.uniform(10, 25), 1)
            per_mile = round(random.uniform(0.5, 2.5), 2)
            per_flight_hr = None
        else:
            fuel_type = FuelType.DF2
            idle = round(random.uniform(0.5, 3), 1)
            tactical = round(random.uniform(2, 8), 1)
            per_mile = round(random.uniform(0.1, 0.8), 2)
            per_flight_hr = None

        records.append(FuelConsumptionRate(
            equipment_catalog_item_id=item_id,
            fuel_type=fuel_type,
            gallons_per_hour_idle=idle,
            gallons_per_hour_tactical=tactical,
            gallons_per_mile=per_mile,
            gallons_per_flight_hour=per_flight_hr,
            source=ConsumptionSource.TM_REFERENCE,
            notes=f"Standard consumption rate for {name or 'equipment'}",
            updated_by_user_id=user_id,
        ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} fuel consumption rates")


# ---------------------------------------------------------------------------
# 6. Unit readiness snapshots
# ---------------------------------------------------------------------------

async def seed_readiness_snapshots(db: AsyncSession):
    if await _table_count(db, UnitReadinessSnapshot) > 0:
        logger.info("unit_readiness_snapshots already seeded, skipping")
        return

    # Get top-level units: MEF, DIV, WING, GRP, REGT
    unit_ids = await _get_unit_ids(db, ["MEF", "DIV", "WING", "GRP", "REGT"], limit=60)
    user_id = await _get_user_id(db)

    records = []
    c_ratings = ["C-1", "C-2", "C-3", "C-4"]
    c_weights = [0.35, 0.40, 0.20, 0.05]

    for uid in unit_ids:
        # Create 3 monthly snapshots
        for months_ago in range(3):
            snap_date = NOW - timedelta(days=months_ago * 30)

            p_pct = round(random.uniform(72, 98), 1)
            s_pct = round(random.uniform(65, 95), 1)
            r_pct = round(random.uniform(70, 98), 1)
            t_pct = round(random.uniform(60, 95), 1)
            overall = round((p_pct + s_pct + r_pct + t_pct) / 4, 1)

            def _rating(pct):
                if pct >= 90: return "C-1"
                elif pct >= 80: return "C-2"
                elif pct >= 70: return "C-3"
                else: return "C-4"

            p_r = _rating(p_pct)
            s_r = _rating(s_pct).replace("C-", "S-")
            r_r = _rating(r_pct).replace("C-", "R-")
            t_r = _rating(t_pct).replace("C-", "T-")
            c_r = _rating(overall)

            # Determine limiting factor
            min_pct = min(p_pct, s_pct, r_pct, t_pct)
            if min_pct == s_pct:
                lf = "Supply shortfalls in CL IX repair parts"
            elif min_pct == t_pct:
                lf = "Training calendar impacts from deployment cycle"
            elif min_pct == r_pct:
                lf = "Equipment readiness below threshold - NMC vehicles awaiting parts"
            else:
                lf = "Personnel fill rate below TO&E requirement"

            records.append(UnitReadinessSnapshot(
                unit_id=uid,
                snapshot_date=snap_date,
                overall_readiness_pct=overall,
                equipment_readiness_pct=r_pct,
                supply_readiness_pct=s_pct,
                personnel_fill_pct=p_pct,
                training_readiness_pct=t_pct,
                t_rating=t_r,
                c_rating=c_r,
                s_rating=s_r,
                r_rating=r_r,
                p_rating=p_r,
                limiting_factor=lf,
                reported_by_id=user_id,
                is_official=months_ago == 0,
            ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} unit readiness snapshots")


# ---------------------------------------------------------------------------
# 7. Unit strengths
# ---------------------------------------------------------------------------

async def seed_unit_strengths(db: AsyncSession):
    if await _table_count(db, UnitStrength) > 0:
        logger.info("unit_strengths already seeded, skipping")
        return

    unit_ids = await _get_unit_ids(db, ["BN", "REGT", "GRP", "DIV", "MEF"], limit=80)

    # Echelon-based strength estimates
    echelon_strength = {
        "MEF": (600, 40),  # officers, enlisted multiplier factor
        "DIV": (200, 15),
        "WING": (150, 10),
        "GRP": (80, 8),
        "REGT": (50, 6),
        "BN": (30, 4),
    }

    # Get echelon for each unit
    result = await db.execute(select(Unit.id, Unit.echelon).where(Unit.id.in_(unit_ids)))
    unit_echelons = {r[0]: r[1] for r in result.all()}

    records = []
    for uid in unit_ids:
        ech = unit_echelons.get(uid, "BN")
        base_off, enl_mult = echelon_strength.get(ech, (30, 4))

        auth_off = base_off + random.randint(-5, 10)
        auth_enl = auth_off * enl_mult + random.randint(-20, 20)
        assigned_off = int(auth_off * random.uniform(0.82, 0.98))
        assigned_enl = int(auth_enl * random.uniform(0.85, 0.97))

        total_auth = auth_off + auth_enl
        total_assigned = assigned_off + assigned_enl
        fill = round(total_assigned / total_auth * 100, 1) if total_auth > 0 else 0.0

        tad = random.randint(0, max(1, total_assigned // 20))
        leave_count = random.randint(0, max(1, total_assigned // 15))
        med = random.randint(0, max(1, total_assigned // 30))
        attached = random.randint(0, max(1, total_assigned // 25))
        detached = random.randint(0, max(1, total_assigned // 25))

        shortfalls = []
        if random.random() < 0.4:
            mos_list = ["0311", "0331", "0351", "0611", "0621", "0811", "0861",
                        "1341", "1371", "2111", "2141", "3043", "3051", "6042", "6072"]
            for _ in range(random.randint(1, 3)):
                mos = random.choice(mos_list)
                shortfalls.append({"mos": mos, "short": random.randint(1, 5)})

        records.append(UnitStrength(
            unit_id=uid,
            reported_at=NOW - timedelta(days=random.randint(0, 7)),
            authorized_officers=auth_off,
            assigned_officers=assigned_off,
            authorized_enlisted=auth_enl,
            assigned_enlisted=assigned_enl,
            attached=attached,
            detached=detached,
            tad=tad,
            leave=leave_count,
            medical=med,
            ua=0,
            total_authorized=total_auth,
            total_assigned=total_assigned,
            fill_pct=fill,
            mos_shortfalls=shortfalls if shortfalls else None,
        ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} unit strength records")


# ---------------------------------------------------------------------------
# 8. Map data — unit lat/lng, supply points, routes
# ---------------------------------------------------------------------------

async def seed_map_data(db: AsyncSession):
    # Update units with positions
    # Check if units already have positions
    result = await db.execute(text(
        "SELECT COUNT(*) FROM units WHERE latitude IS NOT NULL AND latitude != 0"
    ))
    positioned = result.scalar() or 0

    if positioned < 10:
        # I MEF area - Camp Pendleton (~33.3, -117.35)
        # II MEF area - Camp Lejeune (~34.55, -77.35)
        # III MEF area - Okinawa (~26.5, 127.75)

        base_positions = {
            # I MEF cluster
            "I MEF": (33.30, -117.35),
            "1st MarDiv": (33.32, -117.36),
            "3rd MAW": (32.87, -117.14),  # MCAS Miramar
            "1st MLG": (33.28, -117.33),
            "I MIG": (33.31, -117.37),
            "11th MEU": (33.22, -117.40),
            "13th MEU": (33.23, -117.41),
            "15th MEU": (33.24, -117.42),
            # I MEF Division units
            "1st Marines": (33.33, -117.35),
            "5th Marines": (33.34, -117.38),
            "7th Marines": (33.35, -117.34),
            "11th Marines": (33.31, -117.36),
            "CLR-1": (33.27, -117.32),
            "CLR-17": (33.26, -117.31),
            # II MEF cluster
            "II MEF": (34.55, -77.35),
            "2nd MarDiv": (34.56, -77.36),
            "2nd MAW": (34.90, -76.88),  # MCAS Cherry Point
            "2nd MLG": (34.53, -77.34),
            "II MIG": (34.54, -77.37),
            "22nd MEU": (34.50, -77.40),
            "24th MEU": (34.51, -77.41),
            "26th MEU": (34.52, -77.42),
            # II MEF Division units
            "2nd Marines": (34.57, -77.35),
            "6th Marines": (34.58, -77.38),
            "8th Marines": (34.59, -77.34),
            "10th Marines": (34.55, -77.36),
            "CLR-2": (34.52, -77.33),
            # III MEF cluster
            "III MEF": (26.50, 127.75),
            "3rd MarDiv": (26.52, 127.76),
            "1st MAW": (26.35, 127.77),
            "3rd MLG": (26.48, 127.74),
            "III MIG": (26.51, 127.78),
            "31st MEU": (26.45, 127.80),
            # MARSOC
            "MARSOC": (34.57, -77.38),
            "MRR": (34.58, -77.39),
            # Installations
            "MCB CamPen": (33.30, -117.35),
            "MCB CamLej": (34.55, -77.35),
            "MCAS Miramar": (32.87, -117.14),
            "MCAS ChPt": (34.90, -76.88),
            "MCAGCC 29 Palms": (34.24, -116.05),
            "MCB Quantico": (38.52, -77.32),
            "MCAS Yuma": (32.66, -114.62),
            "MCAS Beaufort": (32.48, -80.72),
            "MCAS Iwakuni": (34.14, 132.24),
            "MCB Hawaii": (21.44, -157.76),
        }

        for abbr, (lat, lng) in base_positions.items():
            # Add small jitter for child units
            await db.execute(
                update(Unit)
                .where(Unit.abbreviation == abbr)
                .values(latitude=lat, longitude=lng)
            )

        # Set positions for battalion-level units based on parent position
        # Get all units with no position that have a parent with a position
        result = await db.execute(text("""
            UPDATE units c SET
                latitude = p.latitude + (random() - 0.5) * 0.05,
                longitude = p.longitude + (random() - 0.5) * 0.05
            FROM units p
            WHERE c.parent_id = p.id
              AND p.latitude IS NOT NULL
              AND c.latitude IS NULL
        """))

        # Run it again for grandchildren
        await db.execute(text("""
            UPDATE units c SET
                latitude = p.latitude + (random() - 0.5) * 0.03,
                longitude = p.longitude + (random() - 0.5) * 0.03
            FROM units p
            WHERE c.parent_id = p.id
              AND p.latitude IS NOT NULL
              AND c.latitude IS NULL
        """))

        await db.flush()
        logger.info("Updated unit positions")
    else:
        logger.info("Units already have positions, skipping")

    # Supply points
    if await _table_count(db, SupplyPoint) > 0:
        logger.info("supply_points already seeded, skipping")
    else:
        user_id = await _get_user_id(db)
        mlg_map = await _get_unit_ids_by_abbr(db, ["1st MLG", "2nd MLG", "3rd MLG", "CLR-1", "CLR-2", "CLR-3"])
        mlg_ids = list(mlg_map.values()) or await _get_unit_ids(db, ["GRP"], limit=5)

        supply_points = [
            {"name": "SP ALPHA - Camp Pendleton Main", "point_type": SupplyPointType.SUPPLY_POINT,
             "latitude": 33.2950, "longitude": -117.3600, "status": SupplyPointStatus.ACTIVE,
             "capacity_notes": "CL I/III/V, 500 ST throughput/day"},
            {"name": "SP BRAVO - 29 Palms Mainside", "point_type": SupplyPointType.SUPPLY_POINT,
             "latitude": 34.2300, "longitude": -116.0700, "status": SupplyPointStatus.ACTIVE,
             "capacity_notes": "CL I/III/IX, 200 ST throughput/day"},
            {"name": "ASP CHARLIE - Camp Pendleton", "point_type": SupplyPointType.AMMO_SUPPLY_POINT,
             "latitude": 33.3350, "longitude": -117.4100, "status": SupplyPointStatus.ACTIVE,
             "capacity_notes": "CL V ASP, 1000 tons storage"},
            {"name": "LZ HAWK - Training Area", "point_type": SupplyPointType.LZ,
             "latitude": 33.3700, "longitude": -117.4500, "status": SupplyPointStatus.ACTIVE,
             "capacity_notes": "CH-53 capable, 2 spots"},
            {"name": "LZ CONDOR - 29 Palms", "point_type": SupplyPointType.LZ,
             "latitude": 34.2500, "longitude": -116.1000, "status": SupplyPointStatus.ACTIVE,
             "capacity_notes": "MV-22/CH-53, 3 spots"},
            {"name": "LOG BASE PENDLETON", "point_type": SupplyPointType.LOG_BASE,
             "latitude": 33.2800, "longitude": -117.3300, "status": SupplyPointStatus.ACTIVE,
             "capacity_notes": "Full-spectrum logistics base, all classes of supply"},
            {"name": "WATER POINT DELTA", "point_type": SupplyPointType.WATER_POINT,
             "latitude": 33.3100, "longitude": -117.3400, "status": SupplyPointStatus.ACTIVE,
             "capacity_notes": "ROWPU, 6000 gal/day capacity"},
            {"name": "MCP ECHO - Camp Pendleton", "point_type": SupplyPointType.MAINTENANCE_COLLECTION_POINT,
             "latitude": 33.2650, "longitude": -117.3150, "status": SupplyPointStatus.ACTIVE,
             "capacity_notes": "3rd echelon maintenance, 20 bays"},
            {"name": "SP FOXTROT - Camp Lejeune", "point_type": SupplyPointType.SUPPLY_POINT,
             "latitude": 34.5500, "longitude": -77.3400, "status": SupplyPointStatus.ACTIVE,
             "capacity_notes": "CL I/III/IX, 400 ST throughput/day"},
            {"name": "ASP GOLF - Camp Lejeune", "point_type": SupplyPointType.AMMO_SUPPLY_POINT,
             "latitude": 34.5800, "longitude": -77.3700, "status": SupplyPointStatus.ACTIVE,
             "capacity_notes": "CL V ASP, 800 tons storage"},
        ]

        records = []
        for sp in supply_points:
            records.append(SupplyPoint(
                name=sp["name"],
                point_type=sp["point_type"],
                latitude=sp["latitude"],
                longitude=sp["longitude"],
                parent_unit_id=random.choice(mlg_ids),
                status=sp["status"],
                capacity_notes=sp["capacity_notes"],
                created_by=user_id,
            ))
        db.add_all(records)
        await db.flush()
        logger.info(f"Seeded {len(records)} supply points")

    # Routes (MSR/ASR)
    if await _table_count(db, Route) > 0:
        logger.info("routes already seeded, skipping")
    else:
        user_id = await _get_user_id(db)
        routes = [
            {
                "name": "MSR MICHIGAN",
                "route_type": RouteType.MSR,
                "status": RouteStatus.OPEN,
                "description": "Main supply route from Camp Pendleton mainside to 62 Area (San Mateo)",
                "waypoints": [
                    {"lat": 33.2300, "lng": -117.3700, "name": "SP Gate"},
                    {"lat": 33.2600, "lng": -117.3500, "name": "Checkpoint 1"},
                    {"lat": 33.2900, "lng": -117.3400, "name": "Las Pulgas junction"},
                    {"lat": 33.3200, "lng": -117.3300, "name": "San Mateo RP"},
                ],
            },
            {
                "name": "MSR TAMPA",
                "route_type": RouteType.MSR,
                "status": RouteStatus.OPEN,
                "description": "Primary N-S route through Camp Pendleton, parallels I-5",
                "waypoints": [
                    {"lat": 33.1900, "lng": -117.3800, "name": "South Gate SP"},
                    {"lat": 33.2500, "lng": -117.3600, "name": "Horno junction"},
                    {"lat": 33.3000, "lng": -117.3500, "name": "Mainside"},
                    {"lat": 33.3500, "lng": -117.4000, "name": "North Gate RP"},
                ],
            },
            {
                "name": "ASR PHOENIX",
                "route_type": RouteType.ASR,
                "status": RouteStatus.OPEN,
                "description": "Alternate route Camp Pendleton eastern corridor to ranges",
                "waypoints": [
                    {"lat": 33.2400, "lng": -117.3200, "name": "East Gate SP"},
                    {"lat": 33.2700, "lng": -117.3000, "name": "Range complex junction"},
                    {"lat": 33.3100, "lng": -117.2800, "name": "Impact area bypass"},
                    {"lat": 33.3400, "lng": -117.2600, "name": "Northern ranges RP"},
                ],
            },
            {
                "name": "MSR DIAMOND",
                "route_type": RouteType.MSR,
                "status": RouteStatus.OPEN,
                "description": "Primary route through MCAGCC 29 Palms training area",
                "waypoints": [
                    {"lat": 34.2000, "lng": -116.1000, "name": "Mainside SP"},
                    {"lat": 34.2200, "lng": -116.0800, "name": "Camp Wilson junction"},
                    {"lat": 34.2500, "lng": -116.0500, "name": "Range 400 area"},
                    {"lat": 34.2800, "lng": -116.0200, "name": "Northern boundary RP"},
                ],
            },
            {
                "name": "ASR IRON",
                "route_type": RouteType.ASR,
                "status": RouteStatus.RESTRICTED,
                "description": "Alternate route through 29 Palms southern training area, restricted due to live fire",
                "waypoints": [
                    {"lat": 34.1800, "lng": -116.1200, "name": "South gate SP"},
                    {"lat": 34.2000, "lng": -116.0900, "name": "Restricted zone boundary"},
                    {"lat": 34.2200, "lng": -116.0600, "name": "Observation post"},
                    {"lat": 34.2400, "lng": -116.0400, "name": "Range control RP"},
                ],
            },
            {
                "name": "MSR BOSTON",
                "route_type": RouteType.MSR,
                "status": RouteStatus.OPEN,
                "description": "Main supply route through Camp Lejeune",
                "waypoints": [
                    {"lat": 34.5200, "lng": -77.3800, "name": "Main Gate SP"},
                    {"lat": 34.5400, "lng": -77.3600, "name": "Courthouse Bay junction"},
                    {"lat": 34.5600, "lng": -77.3400, "name": "French Creek"},
                    {"lat": 34.5800, "lng": -77.3200, "name": "Camp Geiger RP"},
                ],
            },
            {
                "name": "SUPPLY ROUTE OKINAWA-1",
                "route_type": RouteType.SUPPLY_ROUTE,
                "status": RouteStatus.OPEN,
                "description": "Primary supply route Camp Butler to port facility",
                "waypoints": [
                    {"lat": 26.4500, "lng": 127.7500, "name": "Camp Butler SP"},
                    {"lat": 26.4700, "lng": 127.7600, "name": "Kadena junction"},
                    {"lat": 26.5000, "lng": 127.7800, "name": "White Beach RP"},
                ],
            },
        ]

        records = []
        for r in routes:
            records.append(Route(
                name=r["name"],
                route_type=r["route_type"],
                status=r["status"],
                waypoints=r["waypoints"],
                description=r["description"],
                created_by_id=user_id,
            ))
        db.add_all(records)
        await db.flush()
        logger.info(f"Seeded {len(records)} routes")


# ---------------------------------------------------------------------------
# 9. Medical treatment facilities
# ---------------------------------------------------------------------------

async def seed_medical_facilities(db: AsyncSession):
    if await _table_count(db, MedicalTreatmentFacility) > 0:
        logger.info("medical_treatment_facilities already seeded, skipping")
        return

    # Get medical/BN units
    abbr_map = await _get_unit_ids_by_abbr(db, [
        "1st Med Bn", "2nd Dental Bn", "3rd Med Bn",
        "1st MLG", "2nd MLG", "3rd MLG",
        "H&S Bn 1st MarDiv", "HQBN 3rd MarDiv",
    ])
    unit_ids = list(abbr_map.values())
    if not unit_ids:
        unit_ids = await _get_unit_ids(db, ["BN"], limit=4)

    facilities = [
        {
            "name": "BAS 1/1 - Camp Pendleton",
            "facility_type": MedicalTreatmentFacilityType.BAS,
            "callsign": "CORPSMAN 1",
            "latitude": 33.3050, "longitude": -117.3500,
            "capacity": 20, "current_census": 3,
            "status": MTFStatus.OPERATIONAL,
            "surgical": False, "blood_bank": False,
            "vent_capacity": 0, "x_ray": False, "ultrasound": False, "dental": False,
            "contact_freq": "42.500", "alternate_freq": "42.750",
            "physician_count": 1, "pa_count": 1, "medic_count": 8, "surgical_tech_count": 0,
        },
        {
            "name": "STP Alpha - Camp Pendleton",
            "facility_type": MedicalTreatmentFacilityType.STP,
            "callsign": "SURGEON 1",
            "latitude": 33.2900, "longitude": -117.3400,
            "capacity": 40, "current_census": 7,
            "status": MTFStatus.OPERATIONAL,
            "surgical": True, "blood_bank": True,
            "vent_capacity": 4, "x_ray": True, "ultrasound": True, "dental": False,
            "contact_freq": "43.100", "alternate_freq": "43.350",
            "physician_count": 3, "pa_count": 2, "medic_count": 15, "surgical_tech_count": 4,
        },
        {
            "name": "Role 2 CHARLIE - Camp Pendleton",
            "facility_type": MedicalTreatmentFacilityType.ROLE2,
            "callsign": "HOSPITAL 1",
            "latitude": 33.2750, "longitude": -117.3200,
            "capacity": 80, "current_census": 12,
            "status": MTFStatus.OPERATIONAL,
            "surgical": True, "blood_bank": True,
            "vent_capacity": 10, "x_ray": True, "ultrasound": True, "dental": True,
            "contact_freq": "44.200", "alternate_freq": "44.450",
            "physician_count": 6, "pa_count": 4, "medic_count": 25, "surgical_tech_count": 8,
        },
        {
            "name": "BAS 2/2 - Camp Lejeune",
            "facility_type": MedicalTreatmentFacilityType.BAS,
            "callsign": "CORPSMAN 2",
            "latitude": 34.5500, "longitude": -77.3500,
            "capacity": 20, "current_census": 2,
            "status": MTFStatus.OPERATIONAL,
            "surgical": False, "blood_bank": False,
            "vent_capacity": 0, "x_ray": False, "ultrasound": False, "dental": False,
            "contact_freq": "42.600", "alternate_freq": "42.850",
            "physician_count": 1, "pa_count": 1, "medic_count": 6, "surgical_tech_count": 0,
        },
    ]

    records = []
    for i, f in enumerate(facilities):
        uid = unit_ids[i % len(unit_ids)] if unit_ids else None
        records.append(MedicalTreatmentFacility(
            name=f["name"],
            facility_type=f["facility_type"],
            callsign=f["callsign"],
            unit_id=uid,
            latitude=f["latitude"],
            longitude=f["longitude"],
            capacity=f["capacity"],
            current_census=f["current_census"],
            status=f["status"],
            surgical=f["surgical"],
            blood_bank=f["blood_bank"],
            vent_capacity=f["vent_capacity"],
            x_ray=f["x_ray"],
            ultrasound=f["ultrasound"],
            dental=f["dental"],
            contact_freq=f["contact_freq"],
            alternate_freq=f["alternate_freq"],
            physician_count=f["physician_count"],
            pa_count=f["pa_count"],
            medic_count=f["medic_count"],
            surgical_tech_count=f["surgical_tech_count"],
        ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} medical treatment facilities")


# ---------------------------------------------------------------------------
# 10. Manning snapshots
# ---------------------------------------------------------------------------

async def seed_manning_snapshots(db: AsyncSession):
    if await _table_count(db, ManningSnapshot) > 0:
        logger.info("manning_snapshots already seeded, skipping")
        return

    unit_ids = await _get_unit_ids(db, ["BN", "REGT", "GRP", "DIV", "MEF"], limit=60)

    result = await db.execute(select(Unit.id, Unit.echelon).where(Unit.id.in_(unit_ids)))
    unit_echelons = {r[0]: r[1] for r in result.all()}

    echelon_auth = {
        "MEF": 2500, "DIV": 1200, "WING": 800, "GRP": 500, "REGT": 350, "BN": 180,
    }

    records = []
    for uid in unit_ids:
        ech = unit_echelons.get(uid, "BN")
        auth = echelon_auth.get(ech, 180) + random.randint(-20, 20)
        assigned = int(auth * random.uniform(0.85, 0.97))
        present = int(assigned * random.uniform(0.88, 0.98))
        fill = round(assigned / auth * 100, 1) if auth > 0 else 0.0

        # MOS shortfalls
        shortfalls = None
        if random.random() < 0.35:
            mos_list = ["0311", "0331", "0351", "0611", "0621", "0811", "1341", "2111", "3043", "6072"]
            shortfalls = [{"mos": random.choice(mos_list), "short": random.randint(1, 8)}
                          for _ in range(random.randint(1, 4))]

        # Rank distribution
        rank_dist = {
            "E1-E3": random.randint(int(assigned * 0.20), int(assigned * 0.30)),
            "E4-E5": random.randint(int(assigned * 0.25), int(assigned * 0.35)),
            "E6-E9": random.randint(int(assigned * 0.10), int(assigned * 0.15)),
            "O1-O3": random.randint(int(assigned * 0.05), int(assigned * 0.10)),
            "O4-O6": random.randint(int(assigned * 0.02), int(assigned * 0.05)),
        }

        records.append(ManningSnapshot(
            unit_id=uid,
            snapshot_date=NOW - timedelta(days=random.randint(0, 7)),
            authorized_total=auth,
            assigned_total=assigned,
            present_for_duty=present,
            fill_rate_pct=fill,
            mos_shortfalls=shortfalls,
            rank_distribution=rank_dist,
        ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} manning snapshots")


# ---------------------------------------------------------------------------
# 11. Inventory records
# ---------------------------------------------------------------------------

async def seed_inventory_records(db: AsyncSession):
    if await _table_count(db, InventoryRecord) > 0:
        logger.info("inventory_records already seeded, skipping")
        return

    supply_items = await _get_supply_catalog(db)
    if not supply_items:
        logger.warning("No supply_catalog found, skipping inventory records")
        return

    unit_ids = await _get_unit_ids(db, ["BN", "CO"], limit=30)

    records = []
    for item in supply_items:
        # Create inventory records for a handful of units per supply item
        for uid in random.sample(unit_ids, min(5, len(unit_ids))):
            on_hand = round(random.uniform(10, 500), 0)
            due_in = round(random.uniform(0, 50), 0) if random.random() < 0.3 else 0
            due_out = round(random.uniform(0, 30), 0) if random.random() < 0.2 else 0
            reorder = round(on_hand * random.uniform(0.15, 0.30), 0)

            records.append(InventoryRecord(
                unit_id=uid,
                nsn=item["nsn"],
                nomenclature=item["nomenclature"],
                location=f"Warehouse {random.choice(['A','B','C','D'])}-{random.randint(1,20):02d}",
                unit_of_issue=item["unit_of_issue"] or "EA",
                quantity_on_hand=on_hand,
                quantity_due_in=due_in,
                quantity_due_out=due_out,
                reorder_point=reorder,
                last_inventoried=NOW - timedelta(days=random.randint(1, 90)),
            ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} inventory records")


# ---------------------------------------------------------------------------
# 12. Convoy plans
# ---------------------------------------------------------------------------

async def seed_convoy_plans(db: AsyncSession):
    if await _table_count(db, ConvoyPlan) > 0:
        logger.info("convoy_plans already seeded, skipping")
        return

    unit_ids = await _get_unit_ids(db, ["BN", "REGT"], limit=20)
    user_id = await _get_user_id(db)
    personnel_ids = await _get_personnel_ids(db, limit=10)

    convoys = [
        {
            "name": "CONVOY OP STEEL KNIGHT 25-1",
            "route_name": "MSR MICHIGAN",
            "route_description": "Camp Pendleton mainside to 62 Area",
            "total_distance_km": 28.5,
            "estimated_duration_hours": 1.5,
            "status": ConvoyPlanStatus.COMPLETE,
            "risk": RiskAssessmentLevel.LOW,
        },
        {
            "name": "CONVOY RESUPPLY ALPHA",
            "route_name": "MSR TAMPA",
            "route_description": "Logistics resupply run, full CL I/III/V",
            "total_distance_km": 45.0,
            "estimated_duration_hours": 2.5,
            "status": ConvoyPlanStatus.APPROVED,
            "risk": RiskAssessmentLevel.MEDIUM,
        },
        {
            "name": "CONVOY ITX MOVEMENT 25-2",
            "route_name": "MSR DIAMOND",
            "route_description": "Movement to 29 Palms for ITX",
            "total_distance_km": 180.0,
            "estimated_duration_hours": 6.0,
            "status": ConvoyPlanStatus.EXECUTING,
            "risk": RiskAssessmentLevel.MEDIUM,
        },
        {
            "name": "CONVOY MEDEVAC REHEARSAL",
            "route_name": "ASR PHOENIX",
            "route_description": "Medical evacuation rehearsal convoy",
            "total_distance_km": 22.0,
            "estimated_duration_hours": 1.0,
            "status": ConvoyPlanStatus.DRAFT,
            "risk": RiskAssessmentLevel.LOW,
        },
        {
            "name": "CONVOY CLB-6 RETROGRADE",
            "route_name": "MSR BOSTON",
            "route_description": "Equipment retrograde from field exercise",
            "total_distance_km": 35.0,
            "estimated_duration_hours": 2.0,
            "status": ConvoyPlanStatus.APPROVED,
            "risk": RiskAssessmentLevel.LOW,
        },
    ]

    records = []
    for c in convoys:
        uid = random.choice(unit_ids) if unit_ids else 1
        commander_id = random.choice(personnel_ids) if personnel_ids else None
        dep_time = NOW + timedelta(days=random.randint(-10, 14), hours=random.randint(5, 8))

        records.append(ConvoyPlan(
            name=c["name"],
            unit_id=uid,
            created_by=user_id,
            route_name=c["route_name"],
            route_description=c["route_description"],
            total_distance_km=c["total_distance_km"],
            estimated_duration_hours=c["estimated_duration_hours"],
            departure_time_planned=dep_time,
            sp_time=dep_time + timedelta(minutes=15),
            brief_time=dep_time - timedelta(hours=2),
            movement_credit_number=f"MCN-{NOW.year}-{random.randint(1000,9999)}",
            convoy_commander_id=commander_id,
            status=c["status"],
            risk_assessment_level=c["risk"],
            comm_plan=f"Primary: TAC-1 (36.500 MHz), Alternate: TAC-2 (36.750 MHz), Contingency: BN TAC (38.100 MHz)",
            recovery_plan="Lead vehicle tows disabled vehicles. If not towable, request wrecker from CLB via BN TAC.",
            medevac_plan="Ground CASEVAC to nearest BAS. 9-line via BN TAC. Alternate: rotary wing from nearest FARP.",
        ))

    db.add_all(records)
    await db.flush()
    logger.info(f"Seeded {len(records)} convoy plans")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

async def main():
    logger.info("=== Starting operational data seed ===")
    async with async_session() as db:
        try:
            await seed_equipment(db)
            await seed_sensitive_items(db)
            await seed_fuel_storage(db)
            await seed_fuel_transactions(db)
            await seed_fuel_consumption_rates(db)
            await seed_readiness_snapshots(db)
            await seed_unit_strengths(db)
            await seed_map_data(db)
            await seed_medical_facilities(db)
            await seed_manning_snapshots(db)
            await seed_inventory_records(db)
            await seed_convoy_plans(db)
            await db.commit()
            logger.info("=== Operational data seed complete ===")
        except Exception:
            await db.rollback()
            logger.exception("Seed failed, rolled back")
            raise


if __name__ == "__main__":
    asyncio.run(main())
