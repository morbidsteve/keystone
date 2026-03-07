"""Seed the sensitive item catalog with default USMC items.

Mirrors the data previously hard-coded in frontend/src/data/sensitiveItemCatalog.ts.

Idempotent — checks NSN before inserting each item.
"""

import logging
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.catalog_sensitive_item import SensitiveItemCatalogEntry

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Seed data — sourced from frontend/src/data/sensitiveItemCatalog.ts
# ---------------------------------------------------------------------------

_SENSITIVE_ITEM_CATALOG: list[dict] = [
    # -----------------------------------------------------------------------
    # WEAPON
    # -----------------------------------------------------------------------
    {
        "nomenclature": "Rifle, 5.56mm, M4A1",
        "nsn": "1005-01-231-0973",
        "item_type": "WEAPON",
        "aliases": ["M4A1", "M4", "Carbine"],
    },
    {
        "nomenclature": "Rifle, 5.56mm, M16A4",
        "nsn": "1005-01-383-2872",
        "item_type": "WEAPON",
        "aliases": ["M16A4", "M16"],
    },
    {
        "nomenclature": "Pistol, 9mm, M18 (SIG P320)",
        "nsn": "1005-01-659-6741",
        "item_type": "WEAPON",
        "aliases": ["M18", "SIG", "P320", "Pistol"],
    },
    {
        "nomenclature": "Machine Gun, 7.62mm, M240B",
        "nsn": "1005-01-412-4939",
        "item_type": "WEAPON",
        "aliases": ["M240B", "M240", "240 Bravo"],
    },
    {
        "nomenclature": "Machine Gun, 5.56mm, M249 SAW",
        "nsn": "1005-01-127-7510",
        "item_type": "WEAPON",
        "aliases": ["M249", "SAW", "Squad Automatic"],
    },
    {
        "nomenclature": "Rifle, 5.56mm, M27 IAR",
        "nsn": "1005-01-596-8380",
        "item_type": "WEAPON",
        "aliases": ["M27", "IAR", "Infantry Automatic"],
    },
    {
        "nomenclature": "Machine Gun, Cal .50, M2",
        "nsn": "1005-00-322-9715",
        "item_type": "WEAPON",
        "aliases": ["M2", ".50 Cal", "Ma Deuce", "M2HB"],
    },
    {
        "nomenclature": "Grenade Launcher, 40mm, Mk19",
        "nsn": "1010-01-126-9063",
        "item_type": "WEAPON",
        "aliases": ["Mk19", "MK19", "Mark 19", "Grenade Launcher"],
    },
    {
        "nomenclature": "Grenade Launcher, 40mm, M203",
        "nsn": "1010-00-179-5693",
        "item_type": "WEAPON",
        "aliases": ["M203", "Grenade Launcher 203"],
    },
    {
        "nomenclature": "Launcher, Rocket, 84mm, AT4",
        "nsn": "1340-01-187-3927",
        "item_type": "WEAPON",
        "aliases": ["AT4", "AT-4", "84mm"],
    },
    {
        "nomenclature": "Launcher, Rocket, 66mm, M72 LAW",
        "nsn": "1340-00-691-1154",
        "item_type": "WEAPON",
        "aliases": ["M72", "LAW", "66mm"],
    },
    {
        "nomenclature": "Launcher, Rocket, 83mm, SMAW",
        "nsn": "1340-01-139-0916",
        "item_type": "WEAPON",
        "aliases": ["SMAW", "Shoulder-Launched"],
    },
    {
        "nomenclature": "Command Launch Unit, Javelin CLU",
        "nsn": "1430-01-570-4233",
        "item_type": "WEAPON",
        "aliases": ["Javelin CLU", "CLU", "Javelin"],
    },
    {
        "nomenclature": "Shotgun, 12 Gauge, M1014",
        "nsn": "1005-01-478-1394",
        "item_type": "WEAPON",
        "aliases": ["M1014", "Shotgun", "Benelli"],
    },
    {
        "nomenclature": "Rifle, 7.62mm, M110 SASS",
        "nsn": "1005-01-553-5196",
        "item_type": "WEAPON",
        "aliases": ["M110", "SASS", "Sniper"],
    },
    # -----------------------------------------------------------------------
    # OPTIC
    # -----------------------------------------------------------------------
    {
        "nomenclature": "Sight, Reflex, M150 ACOG (TA31RCO)",
        "nsn": "1240-01-412-6608",
        "item_type": "OPTIC",
        "aliases": ["M150", "ACOG", "RCO", "TA31"],
    },
    {
        "nomenclature": "Sight, LPVO, SU-260/P",
        "nsn": "1240-01-677-2193",
        "item_type": "OPTIC",
        "aliases": ["SU-260", "LPVO", "Squad Variable"],
    },
    {
        "nomenclature": "Sight, Rifle Combat Optic, AN/PVQ-31",
        "nsn": "1240-01-411-1265",
        "item_type": "OPTIC",
        "aliases": ["AN/PVQ-31", "PVQ-31", "RCO"],
    },
    {
        "nomenclature": "Aiming Light, AN/PEQ-16",
        "nsn": "5855-01-522-4337",
        "item_type": "OPTIC",
        "aliases": ["AN/PEQ-16", "PEQ-16", "PEQ16", "Aiming Light"],
    },
    {
        "nomenclature": "Aiming Light, AN/PEQ-15",
        "nsn": "5855-01-398-4276",
        "item_type": "OPTIC",
        "aliases": ["AN/PEQ-15", "PEQ-15", "PEQ15", "ATPIAL"],
    },
    # -----------------------------------------------------------------------
    # NVG
    # -----------------------------------------------------------------------
    {
        "nomenclature": "Night Vision Goggle, AN/PVS-31A",
        "nsn": "5855-01-629-5399",
        "item_type": "NVG",
        "aliases": ["AN/PVS-31A", "PVS-31", "BNVD", "Binocular NVG"],
    },
    {
        "nomenclature": "Night Vision Monocular, AN/PVS-14",
        "nsn": "5855-01-432-0524",
        "item_type": "NVG",
        "aliases": ["AN/PVS-14", "PVS-14", "PVS14", "Monocular"],
    },
    {
        "nomenclature": "ENVG-B, AN/PSQ-20B",
        "nsn": "5855-01-684-4918",
        "item_type": "NVG",
        "aliases": ["AN/PSQ-20B", "PSQ-20", "ENVG-B", "Enhanced NVG"],
    },
    # -----------------------------------------------------------------------
    # CRYPTO
    # -----------------------------------------------------------------------
    {
        "nomenclature": "Data Transfer Device, AN/CYZ-10",
        "nsn": "5810-01-398-5569",
        "item_type": "CRYPTO",
        "aliases": ["AN/CYZ-10", "CYZ-10", "DTD", "Simple Key Loader"],
    },
    {
        "nomenclature": "Inline Network Encryptor, KIV-7M",
        "nsn": "5810-01-484-6452",
        "item_type": "CRYPTO",
        "aliases": ["KIV-7M", "KIV7M", "Network Encryptor"],
    },
    # -----------------------------------------------------------------------
    # RADIO
    # -----------------------------------------------------------------------
    {
        "nomenclature": "Radio Set, AN/PRC-117G",
        "nsn": "5820-01-579-7393",
        "item_type": "RADIO",
        "aliases": ["AN/PRC-117G", "PRC-117G", "117G", "Multiband"],
    },
    {
        "nomenclature": "Radio Set, AN/PRC-152A",
        "nsn": "5820-01-451-8250",
        "item_type": "RADIO",
        "aliases": ["AN/PRC-152A", "PRC-152", "152A", "Harris"],
    },
    {
        "nomenclature": "Radio Set, AN/PRC-163",
        "nsn": "5820-01-666-7363",
        "item_type": "RADIO",
        "aliases": ["AN/PRC-163", "PRC-163", "163", "Rifleman Radio"],
    },
    {
        "nomenclature": "Radio Set, Vehicular, AN/VRC-110",
        "nsn": "5820-01-579-7392",
        "item_type": "RADIO",
        "aliases": ["AN/VRC-110", "VRC-110", "Vehicular Radio"],
    },
    # -----------------------------------------------------------------------
    # COMSEC
    # -----------------------------------------------------------------------
    {
        "nomenclature": "Secure Terminal Equipment, KY-100",
        "nsn": "5810-01-380-4063",
        "item_type": "COMSEC",
        "aliases": ["KY-100", "KY100", "STE", "Secure Phone"],
    },
    # -----------------------------------------------------------------------
    # EXPLOSIVE
    # -----------------------------------------------------------------------
    {
        "nomenclature": "Mine, Antipersonnel, M18A1 Claymore",
        "nsn": "1345-00-058-3028",
        "item_type": "EXPLOSIVE",
        "aliases": ["M18A1", "Claymore", "Mine"],
    },
    {
        "nomenclature": "Charge, Demolition, C4 Block",
        "nsn": "1375-00-028-5478",
        "item_type": "EXPLOSIVE",
        "aliases": ["C4", "C-4", "Demolition", "Explosive Block"],
    },
    {
        "nomenclature": "Grenade, Fragmentation, M67",
        "nsn": "1330-01-150-6544",
        "item_type": "EXPLOSIVE",
        "aliases": ["M67", "Frag", "Fragmentation Grenade"],
    },
    # -----------------------------------------------------------------------
    # MISSILE
    # -----------------------------------------------------------------------
    {
        "nomenclature": "Missile, Stinger, FIM-92",
        "nsn": "1410-01-407-4955",
        "item_type": "MISSILE",
        "aliases": ["FIM-92", "Stinger", "MANPADS"],
    },
    {
        "nomenclature": "Missile, Javelin, FGM-148",
        "nsn": "1430-01-495-2680",
        "item_type": "MISSILE",
        "aliases": ["FGM-148", "Javelin Missile", "Javelin Round"],
    },
]


async def seed_sensitive_item_catalog(db: AsyncSession) -> int:
    """Seed sensitive item catalog. Returns count of items inserted.

    Idempotent — checks NSN before inserting each item.
    """
    inserted = 0

    for item_data in _SENSITIVE_ITEM_CATALOG:
        nsn = item_data.get("nsn")
        if nsn:
            result = await db.execute(
                select(SensitiveItemCatalogEntry).where(
                    SensitiveItemCatalogEntry.nsn == nsn
                )
            )
            if result.scalar_one_or_none():
                continue

        record = SensitiveItemCatalogEntry(**item_data)
        db.add(record)
        inserted += 1

    if inserted:
        await db.flush()

    return inserted
