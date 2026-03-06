"""Seed demo users and personnel for the Living Simulation Engine.

Creates a realistic 1st Battalion, 11th Marines structure with named users
who have demo_profile metadata (rank, billet, edipi, mos, description).
Also seeds 150 additional enlisted personnel with realistic MOS distribution.
"""

import logging
import random
from typing import Dict, List, Optional

from sqlalchemy import select, func as sa_func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import hash_password
from app.models.personnel import PayGrade, Personnel, PersonnelStatus
from app.models.unit import Unit
from app.models.user import Role, User

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Battalion user definitions
# ---------------------------------------------------------------------------

# Map unit abbreviation -> list of user defs
BATTALION_STRUCTURE: Dict[str, List[dict]] = {
    "1/11": [
        {
            "username": "bn_co",
            "email": "bn.co@1-11.usmc.mil",
            "full_name": "LtCol David R. Harris",
            "role": Role.COMMANDER,
            "rank": "LtCol",
            "billet": "Battalion Commander",
            "edipi": "1234500001",
            "mos": "0802",
            "description": "Commanding Officer, 1st Battalion, 11th Marines",
        },
        {
            "username": "bn_xo",
            "email": "bn.xo@1-11.usmc.mil",
            "full_name": "Maj Thomas J. Chen",
            "role": Role.COMMANDER,
            "rank": "Maj",
            "billet": "Executive Officer",
            "edipi": "1234500002",
            "mos": "0802",
            "description": "Executive Officer, 1st Battalion, 11th Marines",
        },
        {
            "username": "bn_s4",
            "email": "bn.s4@1-11.usmc.mil",
            "full_name": "Capt Rachel M. Vasquez",
            "role": Role.S4,
            "rank": "Capt",
            "billet": "Battalion S-4",
            "edipi": "1234500003",
            "mos": "0402",
            "description": "Logistics Officer managing supply, maintenance, and transportation",
        },
        {
            "username": "bn_s3",
            "email": "bn.s3@1-11.usmc.mil",
            "full_name": "Capt Marcus W. Thompson",
            "role": Role.S3,
            "rank": "Capt",
            "billet": "Battalion S-3",
            "edipi": "1234500004",
            "mos": "0802",
            "description": "Operations Officer coordinating fire missions and training",
        },
        {
            "username": "bn_s1",
            "email": "bn.s1@1-11.usmc.mil",
            "full_name": "1stLt Angela K. Nowak",
            "role": Role.OPERATOR,
            "rank": "1stLt",
            "billet": "Battalion S-1",
            "edipi": "1234500005",
            "mos": "0180",
            "description": "Admin Officer tracking personnel strength and admin actions",
        },
        {
            "username": "bn_sgtmaj",
            "email": "bn.sgtmaj@1-11.usmc.mil",
            "full_name": "SgtMaj William R. Brooks",
            "role": Role.OPERATOR,
            "rank": "SgtMaj",
            "billet": "Battalion Sergeant Major",
            "edipi": "1234500006",
            "mos": "0369",
            "description": "Senior enlisted advisor to the Battalion Commander",
        },
        {
            "username": "bn_supply_chief",
            "email": "bn.supply@1-11.usmc.mil",
            "full_name": "GySgt Michael A. Reyes",
            "role": Role.OPERATOR,
            "rank": "GySgt",
            "billet": "BN Supply Chief",
            "edipi": "1234500007",
            "mos": "3043",
            "description": "Manages battalion-level supply accounts and Class I-X tracking",
        },
        {
            "username": "bn_ops_chief",
            "email": "bn.opschief@1-11.usmc.mil",
            "full_name": "MSgt James L. Patterson",
            "role": Role.OPERATOR,
            "rank": "MSgt",
            "billet": "BN Operations Chief",
            "edipi": "1234500008",
            "mos": "0848",
            "description": "Senior enlisted for S-3 operations, fire direction, and training",
        },
    ],
    "A Btry 1/11": [
        {
            "username": "alpha_co",
            "email": "alpha.co@1-11.usmc.mil",
            "full_name": "Capt Steven R. Martinez",
            "role": Role.COMMANDER,
            "rank": "Capt",
            "billet": "Battery Commander",
            "edipi": "1234500009",
            "mos": "0802",
            "description": "Commanding Officer, Alpha Battery",
        },
        {
            "username": "alpha_supply",
            "email": "alpha.supply@1-11.usmc.mil",
            "full_name": "SSgt Kevin D. Okafor",
            "role": Role.OPERATOR,
            "rank": "SSgt",
            "billet": "Battery Supply SNCO",
            "edipi": "1234500010",
            "mos": "3043",
            "description": "Battery-level supply management and requisition submissions",
        },
    ],
    "B Btry 1/11": [
        {
            "username": "bravo_co",
            "email": "bravo.co@1-11.usmc.mil",
            "full_name": "Capt Diana L. Park",
            "role": Role.COMMANDER,
            "rank": "Capt",
            "billet": "Battery Commander",
            "edipi": "1234500011",
            "mos": "0802",
            "description": "Commanding Officer, Bravo Battery",
        },
        {
            "username": "bravo_supply",
            "email": "bravo.supply@1-11.usmc.mil",
            "full_name": "SSgt Carlos R. Mendoza",
            "role": Role.OPERATOR,
            "rank": "SSgt",
            "billet": "Battery Supply SNCO",
            "edipi": "1234500012",
            "mos": "3043",
            "description": "Battery-level supply management and requisition submissions",
        },
    ],
    "C Btry 1/11": [
        {
            "username": "charlie_co",
            "email": "charlie.co@1-11.usmc.mil",
            "full_name": "Capt James T. Whitfield",
            "role": Role.COMMANDER,
            "rank": "Capt",
            "billet": "Battery Commander",
            "edipi": "1234500013",
            "mos": "0802",
            "description": "Commanding Officer, Charlie Battery",
        },
        {
            "username": "charlie_supply",
            "email": "charlie.supply@1-11.usmc.mil",
            "full_name": "SSgt Tanya M. Williams",
            "role": Role.OPERATOR,
            "rank": "SSgt",
            "billet": "Battery Supply SNCO",
            "edipi": "1234500014",
            "mos": "3043",
            "description": "Battery-level supply management and requisition submissions",
        },
    ],
    "H&S Btry 1/11": [
        {
            "username": "hs_co",
            "email": "hs.co@1-11.usmc.mil",
            "full_name": "Capt Lauren E. Douglas",
            "role": Role.COMMANDER,
            "rank": "Capt",
            "billet": "Battery Commander",
            "edipi": "1234500015",
            "mos": "0802",
            "description": "Commanding Officer, Headquarters & Service Battery",
        },
        {
            "username": "hs_supply",
            "email": "hs.supply@1-11.usmc.mil",
            "full_name": "SSgt Robert F. Greene",
            "role": Role.OPERATOR,
            "rank": "SSgt",
            "billet": "Battery Supply SNCO",
            "edipi": "1234500016",
            "mos": "3043",
            "description": "H&S Battery supply management and Class IX tracking",
        },
        {
            "username": "maint_chief",
            "email": "maint.chief@1-11.usmc.mil",
            "full_name": "GySgt Antonio J. Rivera",
            "role": Role.OPERATOR,
            "rank": "GySgt",
            "billet": "Maintenance Chief",
            "edipi": "1234500017",
            "mos": "3521",
            "description": "Senior maintenance SNCO overseeing all battalion equipment repair",
        },
        {
            "username": "maint_tech1",
            "email": "maint.tech1@1-11.usmc.mil",
            "full_name": "Sgt Bryan K. Hawkins",
            "role": Role.OPERATOR,
            "rank": "Sgt",
            "billet": "Maintenance Technician",
            "edipi": "1234500018",
            "mos": "3521",
            "description": "Vehicle maintenance technician, MTVR and HMMWV specialist",
        },
        {
            "username": "maint_tech2",
            "email": "maint.tech2@1-11.usmc.mil",
            "full_name": "Sgt Lisa M. Chung",
            "role": Role.OPERATOR,
            "rank": "Sgt",
            "billet": "Maintenance Technician",
            "edipi": "1234500019",
            "mos": "3522",
            "description": "Electronics maintenance technician, comms and radar systems",
        },
        {
            "username": "motort_chief",
            "email": "motort.chief@1-11.usmc.mil",
            "full_name": "SSgt Derek W. Johnson",
            "role": Role.OPERATOR,
            "rank": "SSgt",
            "billet": "Motor Transport Chief",
            "edipi": "1234500020",
            "mos": "3529",
            "description": "Motor transport section chief, manages dispatching and licensing",
        },
        {
            "username": "motort_dispatcher",
            "email": "motort.disp@1-11.usmc.mil",
            "full_name": "Cpl Sarah N. Ortiz",
            "role": Role.OPERATOR,
            "rank": "Cpl",
            "billet": "Motor Transport Dispatcher",
            "edipi": "1234500021",
            "mos": "3531",
            "description": "Dispatcher coordinating vehicle assignments and convoy logistics",
        },
        {
            "username": "bn_surgeon",
            "email": "bn.surgeon@1-11.usmc.mil",
            "full_name": "LT Samuel Y. Kim, USN",
            "role": Role.OPERATOR,
            "rank": "LT",
            "billet": "Battalion Surgeon",
            "edipi": "1234500022",
            "mos": "8404",
            "description": "Navy medical officer supporting battalion medical readiness",
        },
    ],
}

HIGHER_HQ_USERS: Dict[str, List[dict]] = {
    "11th Marines": [
        {
            "username": "regt_s4",
            "email": "regt.s4@11mar.usmc.mil",
            "full_name": "Maj Kenneth R. Sullivan",
            "role": Role.S4,
            "rank": "Maj",
            "billet": "Regimental S-4",
            "edipi": "1234500023",
            "mos": "0402",
            "description": "Regimental logistics officer overseeing subordinate battalion S-4s",
        },
        {
            "username": "regt_s3",
            "email": "regt.s3@11mar.usmc.mil",
            "full_name": "Maj Christina A. Fuentes",
            "role": Role.S3,
            "rank": "Maj",
            "billet": "Regimental S-3",
            "edipi": "1234500024",
            "mos": "0802",
            "description": "Regimental operations officer directing fire support coordination",
        },
    ],
}

# ---------------------------------------------------------------------------
# Enlisted MOS distribution for artillery battalion (~150 Marines)
# ---------------------------------------------------------------------------

ENLISTED_MOS_DISTRIBUTION: List[dict] = [
    # Cannoneer / Artillery
    {
        "mos": "0811",
        "title": "Cannoneer",
        "count": 36,
        "pay_grades": ["E1", "E2", "E3"],
    },
    {
        "mos": "0844",
        "title": "Fire Direction Controlman",
        "count": 12,
        "pay_grades": ["E3", "E4", "E5"],
    },
    {
        "mos": "0842",
        "title": "Field Artillery Radar Operator",
        "count": 6,
        "pay_grades": ["E3", "E4"],
    },
    {
        "mos": "0861",
        "title": "Fire Support Man",
        "count": 6,
        "pay_grades": ["E3", "E4", "E5"],
    },
    # Motor Transport
    {
        "mos": "3531",
        "title": "Motor Vehicle Operator",
        "count": 18,
        "pay_grades": ["E2", "E3", "E4"],
    },
    {
        "mos": "3521",
        "title": "Automotive Mechanic",
        "count": 10,
        "pay_grades": ["E3", "E4", "E5"],
    },
    # Supply / Logistics
    {
        "mos": "3043",
        "title": "Supply Administration",
        "count": 8,
        "pay_grades": ["E2", "E3", "E4"],
    },
    {
        "mos": "3051",
        "title": "Warehouse Clerk",
        "count": 6,
        "pay_grades": ["E2", "E3"],
    },
    # Communications
    {
        "mos": "0621",
        "title": "Field Radio Operator",
        "count": 12,
        "pay_grades": ["E2", "E3", "E4"],
    },
    {
        "mos": "0631",
        "title": "Network Administrator",
        "count": 4,
        "pay_grades": ["E4", "E5"],
    },
    # Admin / Personnel
    {
        "mos": "0111",
        "title": "Admin Specialist",
        "count": 6,
        "pay_grades": ["E2", "E3", "E4"],
    },
    # Food Service
    {
        "mos": "3381",
        "title": "Food Service Specialist",
        "count": 8,
        "pay_grades": ["E2", "E3", "E4"],
    },
    # NBC / CBRN
    {
        "mos": "5711",
        "title": "CBRN Defense Specialist",
        "count": 4,
        "pay_grades": ["E3", "E4"],
    },
    # Medical (Navy)
    {
        "mos": "8404",
        "title": "Hospital Corpsman",
        "count": 8,
        "pay_grades": ["E3", "E4", "E5"],
    },
    # Armory
    {
        "mos": "2111",
        "title": "Small Arms Repairer",
        "count": 4,
        "pay_grades": ["E3", "E4", "E5"],
    },
    # Remaining general
    {
        "mos": "0311",
        "title": "Basic Marine",
        "count": 2,
        "pay_grades": ["E1", "E2"],
    },
]

# Common first/last names for generating realistic personnel
_FIRST_NAMES = [
    "James",
    "John",
    "Robert",
    "Michael",
    "David",
    "William",
    "Richard",
    "Joseph",
    "Thomas",
    "Christopher",
    "Daniel",
    "Matthew",
    "Anthony",
    "Mark",
    "Steven",
    "Andrew",
    "Joshua",
    "Kevin",
    "Brian",
    "Ryan",
    "Carlos",
    "Jose",
    "Juan",
    "Miguel",
    "Jesus",
    "Alexander",
    "Tyler",
    "Brandon",
    "Samuel",
    "Nathan",
    "Ethan",
    "Jacob",
    "Noah",
    "Logan",
    "Mason",
    "Jackson",
    "Aiden",
    "Luke",
    "Dylan",
    "Aaron",
    "Marcus",
    "Darius",
    "Terrence",
    "DeShawn",
    "Malik",
    "Jamal",
    "Trevon",
    "Isaiah",
    "Elijah",
    "Caleb",
]
_LAST_NAMES = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
    "Walker",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
    "Flores",
    "Green",
    "Adams",
    "Nelson",
    "Baker",
    "Hall",
    "Rivera",
    "Campbell",
    "Mitchell",
    "Carter",
    "Roberts",
]

PAY_GRADE_TO_RANK = {
    "E1": "Pvt",
    "E2": "PFC",
    "E3": "LCpl",
    "E4": "Cpl",
    "E5": "Sgt",
    "E6": "SSgt",
    "E7": "GySgt",
    "E8": "MSgt",
    "E9": "SgtMaj",
}

PAY_GRADE_ENUM_MAP = {
    "E1": PayGrade.E1,
    "E2": PayGrade.E2,
    "E3": PayGrade.E3,
    "E4": PayGrade.E4,
    "E5": PayGrade.E5,
    "E6": PayGrade.E6,
    "E7": PayGrade.E7,
    "E8": PayGrade.E8,
    "E9": PayGrade.E9,
}


def _resolve_pay_grade(rank_str: str) -> Optional[PayGrade]:
    """Convert a rank string to PayGrade enum."""
    rank_to_pg = {
        "Pvt": PayGrade.E1,
        "PFC": PayGrade.E2,
        "LCpl": PayGrade.E3,
        "Cpl": PayGrade.E4,
        "Sgt": PayGrade.E5,
        "SSgt": PayGrade.E6,
        "GySgt": PayGrade.E7,
        "MSgt": PayGrade.E8,
        "SgtMaj": PayGrade.E9,
        "2ndLt": PayGrade.O1,
        "1stLt": PayGrade.O2,
        "Capt": PayGrade.O3,
        "Maj": PayGrade.O4,
        "LtCol": PayGrade.O5,
        "Col": PayGrade.O6,
        # Navy ranks mapped to approximate pay grades
        "LT": PayGrade.O3,
    }
    return rank_to_pg.get(rank_str)


async def seed_demo_data(db: AsyncSession) -> int:
    """Seed demo users, their personnel records, and 150 additional enlisted.

    Returns total count of new users created. Idempotent: skips existing.
    """
    created_users = 0
    created_personnel = 0
    hashed_pw = hash_password("password")

    # Combine battalion + higher HQ structures
    all_units: Dict[str, List[dict]] = {}
    all_units.update(BATTALION_STRUCTURE)
    all_units.update(HIGHER_HQ_USERS)

    # Pre-fetch unit abbreviation -> id mapping
    unit_result = await db.execute(select(Unit.id, Unit.abbreviation))
    unit_map: Dict[str, int] = {row.abbreviation: row.id for row in unit_result.all()}

    for unit_abbr, users in all_units.items():
        unit_id = unit_map.get(unit_abbr)
        if not unit_id:
            logger.warning("Unit '%s' not found in database, skipping users", unit_abbr)
            continue

        for udef in users:
            # Check if user already exists
            existing = await db.execute(
                select(User).where(User.username == udef["username"])
            )
            if existing.scalar_one_or_none():
                continue

            user = User(
                username=udef["username"],
                email=udef["email"],
                hashed_password=hashed_pw,
                full_name=udef["full_name"],
                role=udef["role"],
                unit_id=unit_id,
                demo_profile={
                    "rank": udef["rank"],
                    "billet": udef["billet"],
                    "edipi": udef["edipi"],
                    "mos": udef["mos"],
                    "description": udef["description"],
                },
            )
            db.add(user)
            created_users += 1

            # Create matching Personnel record
            existing_p = await db.execute(
                select(Personnel).where(Personnel.edipi == udef["edipi"])
            )
            if not existing_p.scalar_one_or_none():
                name_parts = udef["full_name"].replace(",", "").split()
                # Handle names like "LtCol David R. Harris" or "LT Samuel Y. Kim, USN"
                first_name = name_parts[1] if len(name_parts) > 1 else name_parts[0]
                last_name = name_parts[-1] if len(name_parts) > 1 else name_parts[0]
                # Skip USN suffix
                if last_name == "USN" and len(name_parts) > 2:
                    last_name = name_parts[-2]

                personnel = Personnel(
                    edipi=udef["edipi"],
                    first_name=first_name,
                    last_name=last_name,
                    rank=udef["rank"],
                    unit_id=unit_id,
                    mos=udef["mos"],
                    status=PersonnelStatus.ACTIVE,
                    pay_grade=_resolve_pay_grade(udef["rank"]),
                    billet=udef["billet"],
                )
                db.add(personnel)
                created_personnel += 1

    # Seed 150 additional enlisted personnel distributed across battery units
    battery_units = ["A Btry 1/11", "B Btry 1/11", "C Btry 1/11", "H&S Btry 1/11"]
    battery_unit_ids = [unit_map.get(u) for u in battery_units if unit_map.get(u)]

    if battery_unit_ids:
        existing_count_result = await db.execute(
            select(sa_func.count(Personnel.id)).where(Personnel.edipi.like("90000%"))
        )
        existing_enlisted = existing_count_result.scalar() or 0

        if existing_enlisted < 150:
            rng = random.Random(42)
            edipi_counter = 9000000001
            used_names: set = set()

            for mos_def in ENLISTED_MOS_DISTRIBUTION:
                for i in range(mos_def["count"]):
                    edipi = str(edipi_counter)
                    edipi_counter += 1

                    # Generate unique name
                    for _ in range(100):
                        first = rng.choice(_FIRST_NAMES)
                        last = rng.choice(_LAST_NAMES)
                        name_key = f"{first}_{last}"
                        if name_key not in used_names:
                            used_names.add(name_key)
                            break

                    pg_str = rng.choice(mos_def["pay_grades"])
                    rank_str = PAY_GRADE_TO_RANK.get(pg_str, "Pvt")

                    # Distribute across batteries
                    # H&S gets support MOS, firing batteries get cannoneer MOS
                    if mos_def["mos"] in ("0811", "0844", "0842", "0861"):
                        # Firing battery MOS — distribute among A/B/C
                        target_ids = [
                            uid for uid in battery_unit_ids[:3] if uid is not None
                        ]
                    else:
                        # Support MOS — assign to H&S
                        hs_id = unit_map.get("H&S Btry 1/11")
                        target_ids = [hs_id] if hs_id else battery_unit_ids

                    assigned_unit = (
                        rng.choice(target_ids) if target_ids else battery_unit_ids[0]
                    )

                    personnel = Personnel(
                        edipi=edipi,
                        first_name=first,
                        last_name=last,
                        rank=rank_str,
                        unit_id=assigned_unit,
                        mos=mos_def["mos"],
                        status=PersonnelStatus.ACTIVE,
                        pay_grade=PAY_GRADE_ENUM_MAP.get(pg_str),
                        billet=mos_def["title"],
                    )
                    db.add(personnel)
                    created_personnel += 1

    await db.flush()
    logger.info(
        "Demo seed: %d users, %d personnel created", created_users, created_personnel
    )
    return created_users
