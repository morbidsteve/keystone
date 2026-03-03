"""Generate 30 days of realistic sample data for all units.

Populates supply status, equipment status, movements, and alerts.
"""

import asyncio
import random
import sys
import os
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.alert import Alert, AlertSeverity, AlertType
from app.models.equipment import EquipmentStatus
from app.models.supply import SupplyClass, SupplyStatus, SupplyStatusRecord
from app.models.transportation import Movement, MovementStatus
from app.models.unit import Echelon, Unit

# Realistic supply items per class
SUPPLY_ITEMS = {
    SupplyClass.I: [
        ("MRE Cases", 500, 10),
        ("Water (Gallons)", 2000, 50),
        ("UGR-A Meals", 300, 15),
    ],
    SupplyClass.II: [
        ("MOPP Suits", 200, 2),
        ("Flak Jackets", 150, 1),
        ("Helmets (ACH)", 180, 1),
    ],
    SupplyClass.III: [
        ("JP-8 (Gallons)", 50000, 1200),
        ("Diesel (Gallons)", 30000, 800),
        ("MOGAS (Gallons)", 5000, 150),
    ],
    SupplyClass.V: [
        ("5.56mm Ball (Rounds)", 100000, 2000),
        ("7.62mm Ball (Rounds)", 50000, 800),
        ("40mm HEDP (Rounds)", 2000, 50),
        ("AT-4 Rockets", 100, 2),
    ],
    SupplyClass.VII: [
        ("HMMWV M1151", 15, 0),
        ("MTVR MK23", 8, 0),
    ],
    SupplyClass.VIII: [
        ("CLS Bags", 50, 2),
        ("IV Fluid (Bags)", 200, 10),
        ("Combat Gauze", 500, 15),
    ],
    SupplyClass.IX: [
        ("HMMWV Parts Kits", 30, 3),
        ("Filters (Assorted)", 100, 5),
        ("Tires (Assorted)", 40, 2),
    ],
}

# Equipment types with TAMCNs
EQUIPMENT_TYPES = [
    ("D1149", "HMMWV M1151", 15),
    ("D1150", "HMMWV M1152", 8),
    ("E0846", "MTVR MK23", 10),
    ("E0857", "MTVR MK25", 4),
    ("A2073", "LAV-25", 6),
    ("B0200", "M777 Howitzer", 4),
]

LOCATIONS = [
    "Camp Lejeune",
    "Camp Pendleton",
    "Camp Wilson",
    "MCAS Miramar",
    "29 Palms",
    "Camp Hansen",
    "Camp Schwab",
]


def _determine_status(dos: float) -> SupplyStatus:
    if dos > 5:
        return SupplyStatus.GREEN
    elif dos > 3:
        return SupplyStatus.AMBER
    else:
        return SupplyStatus.RED


async def seed_sample_data_from_session(db: AsyncSession):
    """Generate 30 days of sample data using an existing session.

    Called from app startup. Idempotent — caller checks for existing data.
    """
    result = await db.execute(
        select(Unit).where(Unit.echelon.in_([Echelon.BN, Echelon.CO]))
    )
    units = result.scalars().all()

    if not units:
        print("No units found. Run seed_units.py first.")
        return

    now = datetime.now(timezone.utc)
    supply_count = 0
    equip_count = 0
    movement_count = 0
    alert_count = 0

    for unit in units:
            for day_offset in range(30):
                report_date = now - timedelta(days=day_offset)

                # Supply records (more items for BN, fewer for CO)
                classes_to_use = list(SUPPLY_ITEMS.keys())
                if unit.echelon == Echelon.CO:
                    classes_to_use = random.sample(classes_to_use, min(4, len(classes_to_use)))

                for sc in classes_to_use:
                    items = SUPPLY_ITEMS[sc]
                    for item_name, base_required, daily_rate in items:
                        # Add randomness for realism
                        scale = 0.3 if unit.echelon == Echelon.CO else 1.0
                        required = base_required * scale
                        # Simulate consumption over time
                        consumed = daily_rate * scale * day_offset * random.uniform(0.8, 1.2)
                        on_hand = max(0, required * random.uniform(0.5, 1.1) - consumed * 0.1)
                        dos = on_hand / (daily_rate * scale) if daily_rate * scale > 0 else 99
                        dos = min(dos, 30)

                        status = _determine_status(dos)

                        record = SupplyStatusRecord(
                            unit_id=unit.id,
                            supply_class=sc,
                            item_description=item_name,
                            on_hand_qty=round(on_hand, 1),
                            required_qty=round(required, 1),
                            dos=round(dos, 1),
                            consumption_rate=round(daily_rate * scale * random.uniform(0.8, 1.2), 2),
                            status=status,
                            reported_at=report_date,
                            source="SEED_DATA",
                        )
                        db.add(record)
                        supply_count += 1

                # Equipment records (weekly for COs, daily for BNs)
                if day_offset % (7 if unit.echelon == Echelon.CO else 1) == 0:
                    for tamcn, nomen, base_count in EQUIPMENT_TYPES:
                        count = max(1, int(base_count * (0.3 if unit.echelon == Echelon.CO else 1.0)))
                        mc = max(0, count - random.randint(0, max(1, count // 4)))
                        nmcm = random.randint(0, count - mc)
                        nmcs = count - mc - nmcm
                        readiness = round(mc / count * 100, 1) if count > 0 else 0

                        equip = EquipmentStatus(
                            unit_id=unit.id,
                            tamcn=tamcn,
                            nomenclature=nomen,
                            total_possessed=count,
                            mission_capable=mc,
                            not_mission_capable_maintenance=nmcm,
                            not_mission_capable_supply=nmcs,
                            readiness_pct=readiness,
                            reported_at=report_date,
                            source="SEED_DATA",
                        )
                        db.add(equip)
                        equip_count += 1

                # Movements (occasional)
                if random.random() < 0.15 and unit.echelon == Echelon.BN:
                    origin, dest = random.sample(LOCATIONS, 2)
                    dep_time = report_date - timedelta(hours=random.randint(1, 12))
                    eta = dep_time + timedelta(hours=random.randint(4, 48))
                    statuses = [MovementStatus.PLANNED, MovementStatus.EN_ROUTE,
                                MovementStatus.COMPLETE, MovementStatus.DELAYED]
                    weights = [0.2, 0.3, 0.4, 0.1]

                    move = Movement(
                        unit_id=unit.id,
                        convoy_id=f"C-{random.randint(100, 999)}",
                        origin=origin,
                        destination=dest,
                        departure_time=dep_time,
                        eta=eta,
                        actual_arrival=eta + timedelta(hours=random.randint(-2, 4)) if random.random() > 0.3 else None,
                        vehicle_count=random.randint(3, 20),
                        cargo_description=f"Resupply convoy - CL {random.choice(['I', 'III', 'V', 'IX'])}",
                        status=random.choices(statuses, weights=weights)[0],
                        reported_at=report_date,
                        source="SEED_DATA",
                    )
                    db.add(move)
                    movement_count += 1

            # Alerts for this unit (based on current state)
            # Low DOS alerts
            if random.random() < 0.3:
                alert = Alert(
                    unit_id=unit.id,
                    alert_type=AlertType.LOW_DOS,
                    severity=random.choice([AlertSeverity.WARNING, AlertSeverity.CRITICAL]),
                    message=f"CL {random.choice(['I', 'III', 'V'])} below minimum DOS threshold",
                    threshold_value=3.0,
                    actual_value=round(random.uniform(0.5, 2.9), 1),
                    acknowledged=random.random() < 0.4,
                )
                db.add(alert)
                alert_count += 1

            if random.random() < 0.2:
                alert = Alert(
                    unit_id=unit.id,
                    alert_type=AlertType.LOW_READINESS,
                    severity=AlertSeverity.WARNING,
                    message=f"Equipment readiness below 75% threshold",
                    threshold_value=75.0,
                    actual_value=round(random.uniform(55.0, 74.9), 1),
                    acknowledged=False,
                )
                db.add(alert)
                alert_count += 1

    print(
        f"Seeded sample data:\n"
        f"  Supply records: {supply_count}\n"
        f"  Equipment records: {equip_count}\n"
        f"  Movements: {movement_count}\n"
        f"  Alerts: {alert_count}"
    )


async def seed_sample_data():
    """Standalone entry point for seeding sample data."""
    async with async_session() as db:
        await seed_sample_data_from_session(db)
        await db.commit()


if __name__ == "__main__":
    asyncio.run(seed_sample_data())
