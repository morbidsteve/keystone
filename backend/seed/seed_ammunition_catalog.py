"""Seed the ammunition catalog with ~50 USMC ammunition items.

Covers small arms, grenades & pyrotechnics, heavy weapons & mortars,
and anti-armor munitions.

Idempotent — checks DODIC before inserting.
"""

import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog_ammunition import AmmunitionCatalogItem

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Seed data — ammunition items organized by category.
# ---------------------------------------------------------------------------

_AMMUNITION_CATALOG: list[dict] = [
    # -----------------------------------------------------------------------
    # SMALL ARMS AMMUNITION (~15 items)
    # -----------------------------------------------------------------------
    {
        "dodic": "A059",
        "nsn": "1305-01-580-7334",
        "nomenclature": "CTG, 5.56MM, BALL, M855A1",
        "common_name": "5.56mm Ball EPR",
        "caliber": "5.56x45mm",
        "weapon_system": "M4A1, M27 IAR",
        "unit_of_issue": "HD",
        "rounds_per_unit": 800,
        "weight_per_round_lbs": 0.026,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "A075",
        "nsn": "1305-01-463-8534",
        "nomenclature": "CTG, 5.56MM, TRACER, M856A1",
        "common_name": "5.56mm Tracer",
        "caliber": "5.56x45mm",
        "weapon_system": "M4A1, M27 IAR",
        "unit_of_issue": "HD",
        "rounds_per_unit": 800,
        "weight_per_round_lbs": 0.026,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "A080",
        "nsn": "1305-01-602-3480",
        "nomenclature": "CTG, 5.56MM, BLANK, M200",
        "common_name": "5.56mm Blank",
        "caliber": "5.56x45mm",
        "weapon_system": "M4A1, M27 IAR",
        "unit_of_issue": "BX",
        "rounds_per_unit": 1200,
        "weight_per_round_lbs": 0.018,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "A111",
        "nsn": "1305-01-567-8909",
        "nomenclature": "CTG, 5.56MM, MK318 MOD1",
        "common_name": "5.56mm SOST",
        "caliber": "5.56x45mm",
        "weapon_system": "M27 IAR",
        "unit_of_issue": "HD",
        "rounds_per_unit": 800,
        "weight_per_round_lbs": 0.026,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "A131",
        "nsn": "1305-01-536-8131",
        "nomenclature": "CTG, 7.62MM, BALL, M80A1",
        "common_name": "7.62mm Ball EPR",
        "caliber": "7.62x51mm",
        "weapon_system": "M240B, M110",
        "unit_of_issue": "HD",
        "rounds_per_unit": 500,
        "weight_per_round_lbs": 0.055,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "A143",
        "nsn": "1305-01-567-8910",
        "nomenclature": "CTG, 7.62MM, TRACER, M62A1",
        "common_name": "7.62mm Tracer",
        "caliber": "7.62x51mm",
        "weapon_system": "M240B",
        "unit_of_issue": "HD",
        "rounds_per_unit": 500,
        "weight_per_round_lbs": 0.055,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "A171",
        "nsn": "1305-01-456-7899",
        "nomenclature": "CTG, 7.62MM, BLANK, M82",
        "common_name": "7.62mm Blank",
        "caliber": "7.62x51mm",
        "weapon_system": "M240B",
        "unit_of_issue": "BX",
        "rounds_per_unit": 800,
        "weight_per_round_lbs": 0.040,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "A363",
        "nsn": "1305-01-345-6795",
        "nomenclature": "CTG, 9MM, BALL, M882",
        "common_name": "9mm Ball FMJ",
        "caliber": "9x19mm",
        "weapon_system": "M18",
        "unit_of_issue": "BX",
        "rounds_per_unit": 1000,
        "weight_per_round_lbs": 0.019,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "A557",
        "nsn": "1305-00-922-5618",
        "nomenclature": "CTG, .50 CAL, BALL, M33",
        "common_name": ".50 Cal Ball",
        "caliber": "12.7x99mm",
        "weapon_system": "M2A1",
        "unit_of_issue": "HD",
        "rounds_per_unit": 100,
        "weight_per_round_lbs": 0.250,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "A598",
        "nsn": "1305-01-567-8911",
        "nomenclature": "CTG, .50 CAL, API, M8",
        "common_name": ".50 Cal Armor Piercing",
        "caliber": "12.7x99mm",
        "weapon_system": "M2A1",
        "unit_of_issue": "HD",
        "rounds_per_unit": 100,
        "weight_per_round_lbs": 0.250,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "A606",
        "nsn": "1305-01-678-9018",
        "nomenclature": "CTG, .50 CAL, TRACER, M17",
        "common_name": ".50 Cal Tracer",
        "caliber": "12.7x99mm",
        "weapon_system": "M2A1",
        "unit_of_issue": "HD",
        "rounds_per_unit": 100,
        "weight_per_round_lbs": 0.250,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "AA36",
        "nsn": "1305-01-789-0127",
        "nomenclature": "CTG, .50 CAL, MK211 MOD 0",
        "common_name": ".50 Cal Raufoss",
        "caliber": "12.7x99mm",
        "weapon_system": "M2A1",
        "unit_of_issue": "HD",
        "rounds_per_unit": 100,
        "weight_per_round_lbs": 0.250,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "B542",
        "nsn": "1305-01-890-1238",
        "nomenclature": "CTG, 40MM, HE, M430A1",
        "common_name": "40mm HE (MK19)",
        "caliber": "40x53mm",
        "weapon_system": "MK19",
        "unit_of_issue": "RD",
        "rounds_per_unit": 48,
        "weight_per_round_lbs": 0.750,
        "hazard_class": "1.3",
    },
    {
        "dodic": "B546",
        "nsn": "1305-01-901-2349",
        "nomenclature": "CTG, 40MM, HE, M433",
        "common_name": "40mm HEDP",
        "caliber": "40x46mm",
        "weapon_system": "M203, M320",
        "unit_of_issue": "RD",
        "rounds_per_unit": 48,
        "weight_per_round_lbs": 0.510,
        "hazard_class": "1.4S",
    },
    {
        "dodic": "B568",
        "nsn": "1305-01-012-3460",
        "nomenclature": "CTG, 40MM, SMOKE, M713",
        "common_name": "40mm Red Smoke",
        "caliber": "40x46mm",
        "weapon_system": "M203, M320",
        "unit_of_issue": "RD",
        "rounds_per_unit": 48,
        "weight_per_round_lbs": 0.510,
        "hazard_class": "1.4G",
    },
    # -----------------------------------------------------------------------
    # GRENADES & PYROTECHNICS (~8 items)
    # -----------------------------------------------------------------------
    {
        "dodic": "B519",
        "nsn": "1310-01-567-8903",
        "nomenclature": "GRENADE, HAND, FRAG, M67",
        "common_name": "M67 Frag",
        "caliber": "N/A",
        "weapon_system": "Hand Thrown",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 0.875,
        "hazard_class": "1.2",
    },
    {
        "dodic": "B605",
        "nsn": "1330-01-567-8912",
        "nomenclature": "GRENADE, HAND, SMOKE, GREEN, M18",
        "common_name": "M18 Smoke Green",
        "caliber": "N/A",
        "weapon_system": "Hand Thrown",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 1.190,
        "hazard_class": "1.4G",
    },
    {
        "dodic": "B610",
        "nsn": "1330-01-678-9019",
        "nomenclature": "GRENADE, HAND, SMOKE, RED, M18",
        "common_name": "M18 Smoke Red",
        "caliber": "N/A",
        "weapon_system": "Hand Thrown",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 1.190,
        "hazard_class": "1.4G",
    },
    {
        "dodic": "B615",
        "nsn": "1330-01-789-0128",
        "nomenclature": "GRENADE, HAND, SMOKE, YELLOW, M18",
        "common_name": "M18 Smoke Yellow",
        "caliber": "N/A",
        "weapon_system": "Hand Thrown",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 1.190,
        "hazard_class": "1.4G",
    },
    {
        "dodic": "G878",
        "nsn": "1370-01-890-1239",
        "nomenclature": "MINE, AP, M18A1 CLAYMORE",
        "common_name": "M18A1 Claymore",
        "caliber": "N/A",
        "weapon_system": "Command Det",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 3.500,
        "hazard_class": "1.1",
    },
    {
        "dodic": "G940",
        "nsn": "1375-01-901-2350",
        "nomenclature": "CHARGE, DEMO, BLOCK, C4, M112",
        "common_name": "C4 Block",
        "caliber": "N/A",
        "weapon_system": "Demo",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 1.250,
        "hazard_class": "1.1",
    },
    {
        "dodic": "L594",
        "nsn": "1310-01-012-3461",
        "nomenclature": "SIGNAL, ILLUMINATION, PARA, M127A1",
        "common_name": "Parachute Flare",
        "caliber": "N/A",
        "weapon_system": "Hand Fired",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 0.500,
        "hazard_class": "1.3G",
    },
    {
        "dodic": "G881",
        "nsn": "1365-01-123-4571",
        "nomenclature": "GRENADE, HAND, STUN, M84",
        "common_name": "M84 Flashbang",
        "caliber": "N/A",
        "weapon_system": "Hand Thrown",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 0.500,
        "hazard_class": "1.4S",
    },
    # -----------------------------------------------------------------------
    # HEAVY WEAPONS & MORTAR (~8 items)
    # -----------------------------------------------------------------------
    {
        "dodic": "C445",
        "nsn": "1315-01-567-8913",
        "nomenclature": "CTG, 81MM, HE, M821A2",
        "common_name": "81mm HE",
        "caliber": "81mm",
        "weapon_system": "M252A1",
        "unit_of_issue": "RD",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 9.700,
        "hazard_class": "1.2",
    },
    {
        "dodic": "C485",
        "nsn": "1315-01-678-9020",
        "nomenclature": "CTG, 81MM, ILLUM, M853A1",
        "common_name": "81mm Illum",
        "caliber": "81mm",
        "weapon_system": "M252A1",
        "unit_of_issue": "RD",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 9.000,
        "hazard_class": "1.3G",
    },
    {
        "dodic": "C520",
        "nsn": "1315-01-789-0129",
        "nomenclature": "CTG, 81MM, SMOKE, M819",
        "common_name": "81mm WP Smoke",
        "caliber": "81mm",
        "weapon_system": "M252A1",
        "unit_of_issue": "RD",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 9.500,
        "hazard_class": "1.2",
    },
    {
        "dodic": "C626",
        "nsn": "1315-01-890-1240",
        "nomenclature": "CTG, 60MM, HE, M720A1",
        "common_name": "60mm HE",
        "caliber": "60mm",
        "weapon_system": "M224A1",
        "unit_of_issue": "RD",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 3.600,
        "hazard_class": "1.2",
    },
    {
        "dodic": "C644",
        "nsn": "1315-01-901-2351",
        "nomenclature": "CTG, 60MM, ILLUM, M721",
        "common_name": "60mm Illum",
        "caliber": "60mm",
        "weapon_system": "M224A1",
        "unit_of_issue": "RD",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 3.400,
        "hazard_class": "1.3G",
    },
    {
        "dodic": "D544",
        "nsn": "1315-01-012-3462",
        "nomenclature": "PROJ, 155MM, HE, M795",
        "common_name": "155mm HE",
        "caliber": "155mm",
        "weapon_system": "M777A2",
        "unit_of_issue": "RD",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 96.000,
        "hazard_class": "1.2",
    },
    {
        "dodic": "D563",
        "nsn": "1315-01-123-4572",
        "nomenclature": "PROJ, 155MM, SMOKE, M825A1",
        "common_name": "155mm WP Smoke",
        "caliber": "155mm",
        "weapon_system": "M777A2",
        "unit_of_issue": "RD",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 97.000,
        "hazard_class": "1.2",
    },
    {
        "dodic": "D579",
        "nsn": "1315-01-234-5680",
        "nomenclature": "PROJ, 155MM, ILLUM, M485A2",
        "common_name": "155mm Illum",
        "caliber": "155mm",
        "weapon_system": "M777A2",
        "unit_of_issue": "RD",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 95.000,
        "hazard_class": "1.3G",
    },
    # -----------------------------------------------------------------------
    # ANTI-ARMOR MUNITIONS (~6 items)
    # -----------------------------------------------------------------------
    {
        "dodic": "E396",
        "nsn": "1340-01-567-8914",
        "nomenclature": "ROCKET, 66MM, HEAT, M72A7",
        "common_name": "M72 LAW",
        "caliber": "66mm",
        "weapon_system": "M72",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 5.500,
        "hazard_class": "1.1",
    },
    {
        "dodic": "E521",
        "nsn": "1340-01-678-9021",
        "nomenclature": "ROCKET, HEAT, 84MM, M3E1",
        "common_name": "M3E1 MAAWS",
        "caliber": "84mm",
        "weapon_system": "M3 MAAWS",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 8.800,
        "hazard_class": "1.1",
    },
    {
        "dodic": "E580",
        "nsn": "1340-01-789-0130",
        "nomenclature": "MISSILE, JAVELIN, FGM-148F",
        "common_name": "Javelin Missile",
        "caliber": "127mm",
        "weapon_system": "FGM-148 CLU",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 26.100,
        "hazard_class": "1.1",
    },
    {
        "dodic": "E599",
        "nsn": "1340-01-890-1241",
        "nomenclature": "MISSILE, TOW 2B, BGM-71F",
        "common_name": "TOW 2B Aero",
        "caliber": "152mm",
        "weapon_system": "ITAS",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 49.800,
        "hazard_class": "1.1",
    },
    {
        "dodic": "G926",
        "nsn": "1340-01-901-2352",
        "nomenclature": "ROCKET, SHOULDER-LAUNCHED, AT4",
        "common_name": "AT4",
        "caliber": "84mm",
        "weapon_system": "AT4",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 14.800,
        "hazard_class": "1.1",
    },
    {
        "dodic": "M257",
        "nsn": "1340-01-012-3463",
        "nomenclature": "MISSILE, STINGER, FIM-92G",
        "common_name": "Stinger Block I",
        "caliber": "70mm",
        "weapon_system": "FIM-92",
        "unit_of_issue": "EA",
        "rounds_per_unit": 1,
        "weight_per_round_lbs": 22.300,
        "hazard_class": "1.1",
    },
]


async def seed_ammunition_catalog(db: AsyncSession) -> int:
    """Seed ammunition catalog. Returns count of items inserted.

    Idempotent — checks DODIC before inserting each item.
    """
    inserted = 0

    for item_data in _AMMUNITION_CATALOG:
        dodic = item_data.get("dodic")
        if dodic:
            result = await db.execute(
                select(AmmunitionCatalogItem).where(
                    AmmunitionCatalogItem.dodic == dodic
                )
            )
            if result.scalar_one_or_none():
                continue

        record = AmmunitionCatalogItem(**item_data)
        db.add(record)
        inserted += 1

    if inserted:
        await db.flush()

    return inserted
